import os
import re
import sys
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict

import google.generativeai as genai
from dotenv import load_dotenv

from app.ai_providers import generate_ai_response
from app.models import SessionHistory, ChatMessage, StudentProfile

# Global dictionaries simulating DB tables in memory
IN_MEMORY_SESSIONS: Dict[int, List[ChatMessage]] = {}
IN_MEMORY_SESSION_METADATA: Dict[int, SessionHistory] = {}

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
)

class StartSessionRequest(BaseModel):
    profile_id: Optional[int] = None
    session_type: str = "Mock Technical Interview"

class ChatMessageRequest(BaseModel):
    session_id: int
    content: str

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: str

@router.post("/session", response_model=SessionHistory)
def start_session(req: StartSessionRequest):
    new_id = len(IN_MEMORY_SESSION_METADATA) + 1
    while new_id in IN_MEMORY_SESSION_METADATA:
        new_id += 1

    new_session = SessionHistory(
        id=new_id,
        profile_id=req.profile_id,
        type=req.session_type,
        score=0,
        duration_seconds=0,
        feedback="Session started. Score will be generated only after a real evaluation.",
        created_at=datetime.utcnow().isoformat()
    )
    IN_MEMORY_SESSION_METADATA[new_id] = new_session
    IN_MEMORY_SESSIONS[new_id] = []
    return new_session

@router.get("/sessions", response_model=List[SessionHistory])
def get_all_sessions(profile_id: Optional[int] = None):
    """
    Fetches all completed or active mock interview sessions for a specific profile_id.
    """
    sessions = list(IN_MEMORY_SESSION_METADATA.values())
    if profile_id:
        sessions = [s for s in sessions if s.profile_id == profile_id]
    
    # Sort descending
    sessions.sort(key=lambda s: s.id, reverse=True)
    return sessions

@router.get("/stats")
def get_dashboard_stats(profile_id: Optional[int] = None):
    """
    Computes dashboard aggregate progress statistics filtered by profile_id.
    """
    sessions = list(IN_MEMORY_SESSION_METADATA.values())
    if profile_id:
        sessions = [s for s in sessions if s.profile_id == profile_id]
    
    total_sessions = len(sessions)
    scores = [s.score for s in sessions if s.score > 0]
    avg_score = int(sum(scores) / len(scores)) if scores else 0
    
    # Compute total messages in these sessions
    total_messages = 0
    for s in sessions:
        total_messages += len(IN_MEMORY_SESSIONS.get(s.id, []))
    
    # Progress per category
    technical = len([s for s in sessions if s.type in ("Mock Technical Interview", "Technical Coding Round")])
    behavioral = len([s for s in sessions if s.type == "HR Behavioral Round"])
    explainer = len([s for s in sessions if s.type == "Concept Explainer"])
    
    return {
        "total_sessions": total_sessions,
        "avg_score": avg_score,
        "total_messages": total_messages,
        "categories_progress": {
            "technical": technical,
            "behavioral": behavioral,
            "explainer": explainer
        }
    }

@router.get("/session/{session_id}/history", response_model=List[ChatMessageResponse])
def get_chat_history(session_id: int):
    # Initialize if missing
    if session_id not in IN_MEMORY_SESSION_METADATA:
        IN_MEMORY_SESSION_METADATA[session_id] = SessionHistory(
            id=session_id,
            profile_id=1,
            type="Mock Technical Interview",
            score=0,
            duration_seconds=0,
            feedback="Session started.",
            created_at=datetime.utcnow().isoformat()
        )
        IN_MEMORY_SESSIONS[session_id] = []

    return IN_MEMORY_SESSIONS.get(session_id, [])

def _is_hinglish(text: str) -> bool:
    """
    Detect if the user message contains Hinglish (Hindi words in Roman/English script).
    Returns True for Hinglish, False for pure English.
    """
    if not text:
        return False
    # Only genuine Hindi words in Roman script — no English collisions like 'the', 'to', 'main', 'sir', 'ho', 'na', 'hum', 'han'
    hinglish_markers = {
        "mujhe", "meri", "mera", "mere", "tumhara", "tumhari", "aapka", "aapki", "aapke", "aap",
        "hain", "hoga", "hogi", "honge", "karo", "karna", "karte", "karta",
        "karti", "batao", "bata", "batana", "samjhao", "samjhana", "chahiye", "chahta", "chahti",
        "chahte", "dekhna", "dekhte", "dekho", "seekhna", "seekhte", "seekho", "puchna", "pucho",
        "kya", "kaise", "kyun", "kyunki", "kab", "kahan", "kaun", "kitna", "kitni",
        "kal", "aaj", "abhi", "phir", "lekin", "nahi", "nahin", "nhi",
        "achha", "accha", "theek", "bilkul", "haan",
        "bahut", "thoda", "zyada", "matlab", "iska", "uska", "inhe", "unhe",
        "btao", "smjhao", "smjh", "krna", "krte", "kro", "hai",
        "bhi", "toh", "yaar", "bhai", "boliye", "bologe",
        "karenge", "karein", "kijiye", "shuru", "sikha", "padhna", "padhao",
        "samajh", "aaya", "aayi", "gaya", "gayi", "raha", "rahi", "rahe",
        "tha", "thi", "wala", "wali", "wale", "kuch", "shukriya", "dhanyawad",
        "kripya", "kisko", "kisse", "bolo", "baat", "bahen", "behen", "bhen", "laude"
    }
    words = set(re.findall(r'\b[a-zA-Z]+\b', text.lower()))
    return bool(words.intersection(hinglish_markers))



@router.post("/message", response_model=ChatMessageResponse)
def send_message(req: ChatMessageRequest):
    session_id = req.session_id
    
    # Initialize if missing
    if session_id not in IN_MEMORY_SESSION_METADATA:
        IN_MEMORY_SESSION_METADATA[session_id] = SessionHistory(
            id=session_id,
            profile_id=1,
            type="Mock Technical Interview",
            score=0,
            duration_seconds=0,
            feedback="Session started.",
            created_at=datetime.utcnow().isoformat()
        )
        IN_MEMORY_SESSIONS[session_id] = []

    # Save user message
    user_msg_id = len(IN_MEMORY_SESSIONS[session_id]) + 1
    user_msg = ChatMessage(
        id=user_msg_id,
        session_id=session_id,
        role="user",
        content=req.content,
        created_at=datetime.utcnow().isoformat()
    )
    IN_MEMORY_SESSIONS[session_id].append(user_msg)

    # Detect user's language: Hinglish or pure English
    user_is_hinglish = _is_hinglish(req.content)

    # Format history for AI providers
    formatted_history = []
    for msg in IN_MEMORY_SESSIONS[session_id]:
        role = "user" if msg.role == "user" else "assistant"
        formatted_history.append({"role": role, "content": msg.content})

    # Fetch profile context from profile in-memory storage
    student_name = "Candidate"
    target_role = "Software Engineer"
    skills = "Python, Java, React, JavaScript, SQL, C++, DSA, Web Development"
    experience_level = "Fresher"
    
    session_obj = IN_MEMORY_SESSION_METADATA[session_id]
    if session_obj.profile_id:
        from app.routers.profile import PROFILES
        profile = PROFILES.get(session_obj.profile_id)
        if profile:
            student_name = profile.name
            target_role = profile.target_role or target_role
            skills = profile.skills or skills
            experience_level = profile.experience_level or experience_level

    session_type = session_obj.type or "General Practice"

    # Build language rule based on detected user language
    if user_is_hinglish:
        language_rule = (
            "4. LANGUAGE — CRITICAL RULE: The user is speaking in Hinglish (Hindi-English mix in Roman script). "
            "You MUST reply in conversational, friendly Hinglish (Hindi + English mix). "
            "Example: 'Python ek versatile programming language hai jo data science aur backend me use hoti hai. "
            "Kya aap iska ek chhota example dekhna chahte hain?' "
            "Do NOT reply in pure English when user speaks Hinglish."
        )
    else:
        language_rule = (
            "4. LANGUAGE — CRITICAL RULE: The user is speaking in English. "
            "You MUST reply in 100% natural, clear English ONLY. "
            "ABSOLUTE PROHIBITION: Do NOT use ANY Hindi words, Hindi phrases, or Hinglish (such as 'haan', 'kya', 'hai', 'aap', 'accha', etc.). "
            "Even if previous messages in the chat history were in Hinglish, the user has now continued in English, so you MUST respond strictly in pure English. "
            "Example: 'Python is a high-level programming language known for readable syntax. Would you like to explore decorators or list comprehensions?'"
        )

    system_prompt = (
        f"You are TalkFlow AI, a super friendly, helpful, and highly interactive voice/chat tutor. "
        f"The student's name is {student_name}. Their profile context is: target role: {target_role}, "
        f"experience: {experience_level}, skills: {skills}, current session: {session_type}.\n\n"
        f"CRITICAL RULES (YOU MUST FOLLOW THESE TO ENSURE A GOOD USER EXPERIENCE):\n"
        f"1. You must ALWAYS listen, interact, and answer the candidate's latest message directly first. Do NOT ignore what they say or write. If they ask a question or make a statement, address it directly before asking a new question.\n"
        f"2. RESPOND IN MAXIMUM 2 OR 3 SHORT SENTENCES (maximum 40 words total). Keep it very conversational, brief, and quick to read/hear.\n"
        f"3. Use extremely simple, friendly, casual, and user-friendly language. Avoid overly professional coder jargon. Talk like a friendly mentor.\n"
        f"{language_rule}\n"
        f"5. DO NOT write code, code snippets, lists, bullet points, headers (#), bold formatting (**), or tables. Only use plain, conversational spoken text.\n"
        f"6. ADAPT TO THE USER'S CHOSEN TOPIC: Completely adapt to whatever technology or topic the user wants to practice (Python, Java, C++, React, SQL, HR, DSA, etc.). If the user asks about Python, answer about Python ONLY. Never restrict yourself to JavaScript unless the user specifically asks for JavaScript!\n"
        f"7. End with a single, very simple relevant question related to the user's chosen topic to keep the conversation interactive."
    )

    def clean_ai_response(text: str) -> str:
        if not text:
            return ""
            
        # Strip Pollinations.ai ads, signatures, and credit lines robustly
        lower_text = text.lower()
        for marker in ["support pollinations", "powered by pollinations", "support our mission", "pollinations.ai"]:
            idx = lower_text.find(marker)
            if idx != -1:
                # Truncate text before the marker, and clean up trailing dashes/spaces/stars
                prefix = text[:idx]
                prefix = re.sub(r"[\s\-\*\|_]*$", "", prefix)
                text = prefix
                lower_text = text.lower()

        # Remove markdown bold markers, headers, and code ticks to make spoken text clean
        cleaned = text.replace("**", "").replace("*", "").replace("###", "").replace("##", "").replace("#", "").replace("`", "")
        return cleaned.strip()

    ai_response_content = ""

    load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'), override=True) if "pytest" not in sys.modules else None
    
    # generate_ai_response takes history excluding the latest user message
    provider_result = generate_ai_response(system_prompt, formatted_history[:-1], req.content)
    if provider_result:
        ai_response_content = clean_ai_response(provider_result.content)

    if not ai_response_content and os.getenv("ALLOW_LOCAL_TUTOR_FALLBACK", "0") != "1":
        if user_is_hinglish:
            ai_response_content = (
                "AI providers abhi configured nahi hain. Kripya backend/.env me ek provider key configure karein."
            )
        else:
            ai_response_content = (
                "AI providers are not currently configured. Please configure an AI provider key in backend/.env."
            )
    
    if not ai_response_content:
        # High-end simulated chatbot response: Simple, interactive & Context-Aware Fresher-friendly dialogue engine
        query_lower = req.content.lower().strip()
        
        topic_aliases = {
            "html": ["html"],
            "css": ["css"],
            "javascript": ["javascript", "js"],
            "react": ["react"],
            "java": ["java", "core java", "oops"],
            "python": ["python"],
            "database": ["database", "sql", "nosql", "mysql"],
            "api": ["api"],
            "english": ["english", "grammar", "vocabulary", "speaking", "fluency", "pronunciation", "communication", "spoken"],
        }

        def detect_topic(text: str) -> str:
            for topic, aliases in topic_aliases.items():
                if any(alias in text for alias in aliases):
                    return topic
            return ""

        def detect_requested_topics(text: str) -> List[str]:
            requested = []
            for topic, aliases in topic_aliases.items():
                if any(alias in text for alias in aliases):
                    requested.append(topic)
            return requested

        def extract_learning_topic(text: str) -> str:
            patterns = [
                r"(?:learn|study|understand|know)\s+(?:about\s+)?([a-zA-Z][a-zA-Z0-9+#.\- ]{1,40})",
                r"(?:what is|explain|define)\s+([a-zA-Z][a-zA-Z0-9+#.\- ]{1,40})",
            ]
            for pattern in patterns:
                match = re.search(pattern, text, flags=re.IGNORECASE)
                if match:
                    topic = re.split(r"\b(?:and|but|because|please|with|for)\b", match.group(1), maxsplit=1)[0]
                    return topic.strip(" .?!,").title()
            return ""

        active_topic = ""
        for msg in reversed(IN_MEMORY_SESSIONS[session_id]):
            if msg.role == "user":
                active_topic = detect_topic(msg.content.lower())
                if active_topic:
                    break

        generic_topic = ""
        requested_topics = detect_requested_topics(query_lower)

        current_topic = detect_topic(query_lower)
        if current_topic:
            active_topic = current_topic
        else:
            generic_topic = extract_learning_topic(req.content)
            if generic_topic:
                active_topic = "general"
        
        topic_detected = bool(active_topic)
        if not active_topic:
            is_option = query_lower in ["1", "2", "3", "option 1", "option 2", "option 3"]
            last_msg_lower = IN_MEMORY_SESSIONS[session_id][-2].content.lower() if len(IN_MEMORY_SESSIONS[session_id]) >= 2 else ""
            is_quiz_answer = any(x in last_msg_lower for x in ["quiz time", "hyperlink", "clickable button", "change the text color", "keyword is used to declare", "built-in hook", "stores data in columns", "send new data"])
            if is_option or is_quiz_answer:
                active_topic = "html"
                topic_detected = True
            else:
                generic_topic = extract_learning_topic(req.content)
                if generic_topic:
                    active_topic = "general"
                    topic_detected = True

        is_asking_use = any(x in query_lower for x in ["use", "purpose", "why", "need", "advantage", "benefit", "where"])
        is_asking_definition = any(x in query_lower for x in ["what is", "explain", "define", "meaning", "understand"]) or not is_asking_use

        if query_lower in ["1", "2", "3", "option 1", "option 2", "option 3"]:
            num = query_lower.replace("option", "").strip()
            if num == "1":
                if active_topic == "html":
                    ai_response_content = (
                        f"Awesome choice! Here is a super simple **HTML Code Example**:\n\n"
                        f"```html\n"
                        f"<!DOCTYPE html>\n"
                        f"<html>\n"
                        f"<body>\n"
                        f"  <h1>Hello {student_name}!</h1>\n"
                        f"  <p>This paragraph is created using the HTML p tag.</p>\n"
                        f"</body>\n"
                        f"</html>\n"
                        f"```\n\n"
                        f"Notice how `<h1>` creates a big heading, and `<p>` creates body text! 😊 What would you like to cover next?"
                    )
                elif active_topic == "css":
                    ai_response_content = (
                        f"Great! Let's see some **CSS Code** to style our heading:\n\n"
                        f"```css\n"
                        f"h1 {{\n"
                        f"  color: #06b6d4; /* Makes heading teal */\n"
                        f"  font-size: 24px;\n"
                        f"  text-align: center;\n"
                        f"}}\n"
                        f"```\n\n"
                        f"This styles the HTML `<h1>` tags automatically. Ready for another query?"
                    )
                elif active_topic == "javascript":
                    ai_response_content = (
                        f"Awesome! Here is a simple **JavaScript Action Example**:\n\n"
                        f"```javascript\n"
                        f"// Function to show a welcome alert\n"
                        f"function welcomeUser(name) {{\n"
                        f"  alert('Welcome back, ' + name + '!');\n"
                        f"}}\n\n"
                        f"welcomeUser('{student_name}');\n"
                        f"```\n\n"
                        f"When called, this pops up a greeting! ⚡ What is your next question?"
                    )
                elif active_topic == "react":
                    ai_response_content = (
                        f"Awesome! Here is a simple **React Component Example**:\n\n"
                        f"```jsx\n"
                        f"import React from 'react';\n\n"
                        f"export default function Greeting() {{\n"
                        f"  return (\n"
                        f"    <div className='card'>\n"
                        f"      <h2>Hello, {student_name}!</h2>\n"
                        f"    </div>\n"
                        f"  );\n"
                        f"}}\n"
                        f"```\n\n"
                        f"This builds a reusable card! Ready to learn more?"
                    )
                elif active_topic == "database":
                    ai_response_content = (
                        f"Superb! Here is a simple **SQL Database Query** to fetch user profile details:\n\n"
                        f"```sql\n"
                        f"SELECT name, target_role \n"
                        f"FROM student_profiles \n"
                        f"WHERE name = '{student_name}';\n"
                        f"```\n\n"
                        f"This fetches rows matching your name. Pretty straightforward, right? 😊"
                    )
                else:
                    ai_response_content = (
                        f"Here is a simple **API Fetch Example** in JS:\n\n"
                        f"```javascript\n"
                        f"fetch('/api/profile')\n"
                        f"  .then(res => res.json())\n"
                        f"  .then(data => console.log('Loaded:', data));\n"
                        f"```\n\n"
                        f"This calls a backend API to load profile data! What should we cover next?"
                    )
            elif num == "2":
                if active_topic == "html":
                    ai_response_content = (
                        f"Quiz Time! 📝 Here is a quick question about **HTML**:\n\n"
                        f"*Which tag is used to create a clickable button?*\n\n"
                        f"1. `<input>`\n"
                        f"2. `<button>`\n"
                        f"3. `<a>` (Anchor)\n\n"
                        f"Tell me your answer (1, 2, or 3) and I will grade it! 🚀"
                    )
                elif active_topic == "css":
                    ai_response_content = (
                        f"Quiz Time! 📝 Here is a quick question about **CSS**:\n\n"
                        f"*Which property is used to change the text color of an element?*\n\n"
                        f"1. `text-color`\n"
                        f"2. `color`\n"
                        f"3. `background-color`\n\n"
                        f"Tell me your answer (1, 2, or 3) and I will grade it! 🚀"
                    )
                elif active_topic == "javascript":
                    ai_response_content = (
                        f"Quiz Time! 📝 Here is a quick question about **JavaScript**:\n\n"
                        f"*Which keyword is used to declare a variable whose value CANNOT be reassigned?*\n\n"
                        f"1. `let`\n"
                        f"2. `var`\n"
                        f"3. `const`\n\n"
                        f"Tell me your answer (1, 2, or 3) and I will grade it! 🚀"
                    )
                elif active_topic == "react":
                    ai_response_content = (
                        f"Quiz Time! 📝 Here is a quick question about **React**:\n\n"
                        f"*Which built-in hook is used to handle state inside functional components?*\n\n"
                        f"1. `useEffect`\n"
                        f"2. `useState`\n"
                        f"3. `useContext`\n\n"
                        f"Tell me your answer (1, 2, or 3) and I will grade it! 🚀"
                    )
                elif active_topic == "database":
                    ai_response_content = (
                        f"Quiz Time! 📝 Here is a quick question about **Databases**:\n\n"
                        f"*Which type of database stores data in columns and structured tables?*\n\n"
                        f"1. NoSQL database\n"
                        f"2. SQL relational database\n"
                        f"3. Graph database\n\n"
                        f"Tell me your answer (1, 2, or 3) and I will grade it! 🚀"
                    )
                else:
                    ai_response_content = (
                        f"Quiz Time! 📝 Here is a quick question about **APIs**:\n\n"
                        f"*Which HTTP method is used to SEND new data to a server?*\n\n"
                        f"1. `GET`\n"
                        f"2. `POST`\n"
                        f"3. `DELETE`\n\n"
                        f"Tell me your answer (1, 2, or 3) and I will grade it! 🚀"
                    )
            else:
                if active_topic == "html":
                    ai_response_content = (
                        f"Sure! Let's explain **HTML** in everyday terms:\n\n"
                        f"Think of building a website like building a **house**. HTML is the **brick-and-wood framework** — it defines where the walls, doors, and window frames are. Without it, there is no house structural skeleton! 🧱\n\n"
                        f"Does this make sense? What should we learn next?"
                    )
                elif active_topic == "css":
                    ai_response_content = (
                        f"Sure! Let's explain **CSS** in everyday terms:\n\n"
                        f"Using our **house** analogy, CSS is the **paint, wallpaper, carpet, and decorations**. It decides what color the walls are and how pretty the rooms look! 🎨\n\n"
                        f"Is this analogy helpful? Ask me another question!"
                    )
                elif active_topic == "javascript":
                    ai_response_content = (
                        f"Sure! Let's explain **JavaScript** in everyday terms:\n\n"
                        f"In our **house** analogy, JS is the **electricity, plumbing, and smart locks**. It makes the lights turn on when you click a switch and opens the door automatically when you press a key! ⚡\n\n"
                        f"Makes sense? Ask me anything else!"
                    )
                elif active_topic == "react":
                    ai_response_content = (
                        f"Sure! Let's explain **React** in everyday terms:\n\n"
                        f"Think of React like playing with **Lego blocks**. Instead of pouring concrete for every wall, you assemble reusable, pre-fabricated Lego components (like windows, rooms, and doors) together to build a house quickly! 🧱\n\n"
                        f"Does this analogy help?"
                    )
                elif active_topic == "database":
                    ai_response_content = (
                        f"Sure! Let's explain a **Database** in everyday terms:\n\n"
                        f"Think of a database like a **giant digital filing cabinet**. Whenever a user signs up, the cabinet opens and slides in a file card containing their email, password, and settings. Whenever they log in, the cabinet pulls that card out! 🗄️\n\n"
                        f"Does that databases clear?"
                    )
                else:
                    ai_response_content = (
                        f"Sure! Let's explain an **API** in everyday terms:\n\n"
                        f"Think of an API like a **waiter in a restaurant**. You (the frontend app) look at the menu and tell the waiter your order. The waiter goes to the kitchen (the database server), fetches the food, and brings it back to your table! 🍽️\n\n"
                        f"Does that restaurant analogy make sense?"
                    )

        else:
            last_msg_lower = IN_MEMORY_SESSIONS[session_id][-2].content.lower() if len(IN_MEMORY_SESSIONS[session_id]) >= 2 else ""
            if any(x in last_msg_lower for x in ["quiz time", "hyperlink", "clickable button", "change the text color", "keyword is used to declare", "built-in hook", "stores data in columns", "send new data"]):
                correct = False
                explanation = ""
                
                if "clickable button" in last_msg_lower:
                    if query_lower in ["2", "button", "<button>", "option 2"]:
                        correct = True
                        explanation = "The `<button>` tag is indeed the correct standard element to create a clickable button on a web page!"
                    else:
                        explanation = "The correct answer is 2 (`<button>`). Tag `<input>` is for generic entries, and `<a>` is for links."
                
                elif "change the text color" in last_msg_lower:
                    if query_lower in ["2", "color", "option 2"]:
                        correct = True
                        explanation = "The `color` property in CSS styles the font color, while `background-color` changes the element's backdrop!"
                    else:
                        explanation = "The correct answer is 2 (`color`). In CSS, color represents text font color!"
                
                elif "keyword is used to declare" in last_msg_lower:
                    if query_lower in ["3", "const", "option 3"]:
                        correct = True
                        explanation = "Variables declared with `const` cannot be reassigned once defined, helping prevent unintended state bugs!"
                    else:
                        explanation = "The correct answer is 3 (`const`). `let` and `var` variables can be reassigned freely."
                        
                elif "built-in hook" in last_msg_lower:
                    if query_lower in ["2", "usestate", "option 2"]:
                        correct = True
                        explanation = "Excellent! `useState` declares component state variables, while `useEffect` is for handling side effects!"
                    else:
                        explanation = "The correct answer is 2 (`useState`). This standard React hook is designed for reactive states!"
                        
                elif "stores data in columns" in last_msg_lower:
                    if query_lower in ["2", "sql", "relational", "option 2"]:
                        correct = True
                        explanation = "Yes! SQL relational databases store structured rows inside defined tables, while NoSQL uses documents!"
                    else:
                        explanation = "The correct answer is 2 (`SQL relational database`). SQL is highly structured using table columns!"
                        
                else:
                    if query_lower in ["2", "post", "option 2"]:
                        correct = True
                        explanation = "Spot on! `POST` sends new entities to a server, `GET` retrieves them, and `DELETE` removes them."
                    else:
                        explanation = "The correct answer is 2 (`POST`). `POST` is used specifically to send data payloads to a server."

                emoji = "🎉 **Correct!**" if correct else "❌ **Not quite!**"
                ai_response_content = (
                    f"{emoji} {student_name}, let's learn from this:\n\n"
                    f"{explanation}\n\n"
                    f"You are showing great progress as a candidate **{target_role}**! What concept should we cover next? Just ask!"
                )
            
            else:
                if not topic_detected:
                    is_english_learning_request = any(x in query_lower for x in [
                        "english", "language", "grammar", "vocabulary", "speaking",
                        "fluency", "pronunciation", "communication", "spoken"
                    ])
                    if is_english_learning_request:
                        ai_response_content = (
                            f"Nice to meet you, {student_name}! If you want to learn English, we can start with simple daily speaking practice.\n\n"
                            f"First, say this sentence clearly:\n"
                            f"\"My name is {student_name}, and I want to improve my English speaking.\"\n\n"
                            f"Then we can practice in 3 small steps:\n"
                            f"1. Basic self-introduction\n"
                            f"2. Daily-use sentences\n"
                            f"3. Grammar corrections while you speak\n\n"
                            f"Which one should we start with: 1, 2, or 3?"
                        )
                    elif any(greet in query_lower for greet in ["hi", "hello", "hey", "hola"]):
                        ai_response_content = (
                            f"Hello {student_name}! I am TalkFlow AI, your simulated technical interview tutor.\n\n"
                            f"I am currently running in **offline/simulated mode** (because no online key responded).\n\n"
                            f"In this mode, I can explain frontend technical topics. You can ask me about:\n"
                            f"• **HTML**\n"
                            f"• **CSS**\n"
                            f"• **JavaScript**\n"
                            f"• **React**\n"
                            f"• **Databases**\n"
                            f"• **APIs**\n\n"
                            f"To enable full AI capabilities, configure your key in backend/.env!"
                        )
                    else:
                        if user_is_hinglish:
                            ai_response_content = (
                                "Mujhe topic clearly samajh nahi aaya. Please ek topic choose kijiye, jaise Python, Java, React, JavaScript, SQL, C++, DSA, ya HR interview.\n\n"
                                "Example: 'Mujhe Python seekhna hai' ya 'React kya hota hai?'"
                            )
                        else:
                            ai_response_content = (
                                "I didn't quite catch the topic. Please choose what you would like to explore, such as Python, Java, React, JavaScript, SQL, C++, DSA, or HR interview.\n\n"
                                "Example: 'I want to learn Python' or 'Explain React hooks'."
                            )
                else:
                    subject_details = {
                        "general": {
                            "def": f"{generic_topic or 'This topic'} is something we can learn step by step. I will first explain the basic meaning, then give a small example, then ask you a practice question.",
                            "use": f"Learning {generic_topic or 'this topic'} becomes easier when we break it into small parts: basic definition, simple example, common use, and short practice."
                        },
                        "html": {
                            "def": "HTML stands for **Hypertext Markup Language**. Think of it as the **skeleton or structure** of any website you see on the internet! 🦴 It uses simple blocks called tags (like headers, paragraphs, buttons) to arrange content on the screen.",
                            "use": "We use HTML to put elements on a page. Every paragraph, button, image, form, and link is placed using HTML. Without it, a web page would be completely empty with no contents!"
                        },
                        "css": {
                            "def": "CSS stands for **Cascading Style Sheets**. Think of it as the **clothing, makeup, and design** of your website! 💅 It allows you to style your HTML layout and make it look clean and visually outstanding.",
                            "use": "We use CSS to change colors, fonts, align cards, add spacing (padding/margins), make columns, and build smooth hover effects and responsive layouts so it fits perfectly on mobile screens!"
                        },
                        "javascript": {
                            "def": "JavaScript is a powerful **programming language** for the web. Think of it as the **electricity and muscle** of a website! ⚡ It brings elements to life and enables interactions.",
                            "use": "We use JavaScript to handle button clicks, show pop-up dialogs, fetch live data from database APIs, run complex calculators, and dynamically update the screen without forcing a full page reload!"
                        },
                        "java": {
                            "def": "Java is a popular object-oriented programming language. It runs on the JVM, so the same Java program can work on many systems.",
                            "use": "We use Java for Android apps, backend APIs, banking software, enterprise systems, desktop apps, and large-scale services. Important basics are variables, loops, classes, objects, OOP, collections, and exceptions."
                        },
                        "python": {
                            "def": "Python is a beginner-friendly programming language with clean, English-like syntax. It is easy to read and quick to write.",
                            "use": "We use Python for AI, data science, automation, backend APIs, scripting, testing, and quick problem solving."
                        },
                        "english": {
                            "def": "English learning means improving speaking, listening, vocabulary, grammar, and confidence for daily or professional communication.",
                            "use": "We use English for interviews, workplace communication, emails, presentations, customer conversations, and learning global technical content."
                        },
                        "react": {
                            "def": "React is a modern frontend **JavaScript library** built by Facebook. Think of it as a tool that lets you build web interfaces using **reusable, modular components** (like Lego bricks)! 🧱",
                            "use": "We use React to break complex layouts into small, reusable components (like a Navbar, ChatCard, or ProfileHeader). It updates the screen instantly and efficiently whenever data changes using a virtual DOM."
                        },
                        "database": {
                            "def": "A **Database** is a dedicated system built to store, manage, and retrieve electronic data securely. Think of it as a **giant, high-speed warehouse** for all your app's digital assets! 🗄️",
                            "use": "We use databases to save user credentials, profiles, chat history, product details, and session records. Whenever a user logs in, the backend queries the database to load their exact progress!"
                        },
                        "api": {
                            "def": "API stands for **Application Programming Interface**. Think of it as a **secure messenger or waiter** that carries data back and forth between two systems (like your frontend app and the database)! 🍽️",
                            "use": "We use APIs to allow the frontend to fetch lists of messages, submit user profile edits to the database, or integrate third-party services (like maps, payments, or speech recognition engines)."
                        }
                    }

                    topic_names = {
                        "html": "HTML",
                        "css": "CSS",
                        "javascript": "JavaScript",
                        "java": "Java",
                        "python": "Python",
                        "english": "English",
                        "react": "React",
                        "database": "databases",
                        "api": "APIs",
                        "general": generic_topic or "this topic",
                    }

                    if user_is_hinglish:
                        simple_details = {
                            "general": {
                                "def": f"{generic_topic or 'This topic'} ko hum step by step simple way me learn karenge.",
                                "use": f"{generic_topic or 'This topic'} ko samajhne ke liye pehle basic meaning, phir small example best rahega.",
                            },
                            "html": {
                                "def": "HTML website ka structure banata hai, jaise heading, paragraph, image aur button.",
                                "use": "HTML se hum page par content rakhte hain. Without HTML, page almost empty hota.",
                            },
                            "css": {
                                "def": "CSS website ka design handle karta hai, jaise color, spacing, font aur layout.",
                                "use": "CSS se normal HTML page clean aur professional dikhta hai.",
                            },
                            "javascript": {
                                "def": "JavaScript website ko interactive banata hai, jaise button click, form check aur live updates.",
                                "use": "JavaScript se page user ke action par react karta hai.",
                            },
                            "java": {
                                "def": "Java ek object-oriented programming language hai jo JVM par run hoti hai.",
                                "use": "Java Android apps, backend APIs aur large software systems me use hoti hai.",
                            },
                            "python": {
                                "def": "Python beginner-friendly programming language hai jiska syntax clean hota hai.",
                                "use": "Python AI, automation, backend APIs aur quick problem solving me use hoti hai.",
                            },
                            "english": {
                                "def": "English learning me speaking, listening, vocabulary aur confidence improve karte hain.",
                                "use": "English interviews, office communication aur daily conversation me help karti hai.",
                            },
                            "react": {
                                "def": "React JavaScript ki library hai jisse UI ko small reusable components me banate hain.",
                                "use": "React se complex frontend screens manage karna easy hota hai.",
                            },
                            "database": {
                                "def": "Database app ka data store karta hai, jaise users, profile, messages aur history.",
                                "use": "Database se backend saved data ko dobara read aur update kar pata hai.",
                            },
                            "api": {
                                "def": "API frontend aur backend ke beech data bhejne ka bridge hota hai.",
                                "use": "API se app profile save, messages load aur server se response le pata hai.",
                            },
                        }
                        simple_topic = active_topic if active_topic in simple_details else "general"
                        topic_label = topic_names.get(simple_topic, generic_topic or simple_topic)
                        details = simple_details[simple_topic]

                        if len(requested_topics) > 1:
                            readable_topics = ", ".join(topic_names.get(topic, topic) for topic in requested_topics)
                            first_topic = requested_topics[0]
                            first_label = topic_names.get(first_topic, first_topic)
                            first_details = simple_details.get(first_topic, simple_details["html"])
                            ai_response_content = (
                                f"{readable_topics} technical preparation ke core topics hain.\n\n"
                                f"Chalo {first_label} se shuru karte hain: {first_details['def']}\n\n"
                                f"Kya aap {first_label} ka ek chhota example dekhna chahte hain?"
                            )
                        elif is_asking_use:
                            ai_response_content = (
                                f"{topic_label} ka use simple hai: {details['use']}\n\n"
                                f"Definition: {details['def']}\n\n"
                                f"Aapke hisaab se {topic_label} ka sabse bada benefit kya hai?"
                            )
                        else:
                            ai_response_content = (
                                f"Bilkul! Chaliye {topic_label} ko samajhte hain.\n\n"
                                f"{details['def']}\n\n"
                                f"Kya aap iska ek example dekhna chahte hain ya practice question solve karna chahte hain?"
                            )
                    else:
                        # Pure English response
                        eng_topic = active_topic if active_topic in subject_details else "general"
                        topic_label = topic_names.get(eng_topic, generic_topic or eng_topic)
                        eng_details = subject_details[eng_topic]

                        if len(requested_topics) > 1:
                            readable_topics = ", ".join(topic_names.get(topic, topic) for topic in requested_topics)
                            first_topic = requested_topics[0]
                            first_label = topic_names.get(first_topic, first_topic)
                            first_eng = subject_details.get(first_topic, subject_details["general"])
                            short_def = first_eng['def'].split('.')[0] + '.'
                            ai_response_content = (
                                f"{readable_topics} are core skills.\n\n"
                                f"Let's start with {first_label}. {short_def}\n\n"
                                f"Would you like an example?"
                            )
                        elif is_asking_use:
                            ai_response_content = (
                                f"Here is the key purpose of {topic_label}: {eng_details['use']}\n\n"
                                f"Core definition: {eng_details['def']}\n\n"
                                f"Would you like to explore a practical example or a practice question?"
                            )
                        else:
                            ai_response_content = (
                                f"Certainly! Let's explore {topic_label} together.\n\n"
                                f"{eng_details['def']}\n\n"
                                f"Would you like to see a code example, or test your knowledge with a practice question?"
                            )

    # Save AI response
    ai_msg_id = len(IN_MEMORY_SESSIONS[session_id]) + 1
    ai_msg = ChatMessage(
        id=ai_msg_id,
        session_id=session_id,
        role="model",
        content=ai_response_content,
        created_at=datetime.utcnow().isoformat()
    )
    IN_MEMORY_SESSIONS[session_id].append(ai_msg)

    return ai_msg

class EvaluationRequest(BaseModel):
    question: str
    answer: str
    target_role: Optional[str] = "Frontend Developer"

class EvaluationResponse(BaseModel):
    score: int
    strengths: List[str]
    mistakes: List[str]
    improved_version: str

@router.post("/evaluate", response_model=EvaluationResponse)
def evaluate_answer(req: EvaluationRequest):
    question = req.question.strip()
    answer = req.answer.strip()
    
    if not answer:
        return EvaluationResponse(
            score=0,
            strengths=["None (No answer provided)"],
            mistakes=["You did not provide any answer. Please click the microphone button and speak your response."],
            improved_version="Please record or type your answer so I can evaluate it!"
        )

    ai_json = None
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'), override=True) if "pytest" not in sys.modules else None
    
    prompt = (
        f"You are an expert technical interviewer evaluating a candidate's verbal response to an IT technical question.\n"
        f"Question: \"{question}\"\n"
        f"Candidate's Answer: \"{answer}\"\n"
        f"Target Role: \"{req.target_role}\"\n\n"
        f"Evaluate the candidate's answer for accuracy, technical depth, and clarity. Be constructive, encouraging, and clear (fresher-friendly).\n"
        f"Respond ONLY with a JSON object. Do not include markdown formatting or outer codeblocks. Here is the required JSON structure:\n"
        f"{{\n"
        f"  \"score\": <integer score from 0 to 100>,\n"
        f"  \"strengths\": [<list of 2-3 specific points they did well>],\n"
        f"  \"mistakes\": [<list of 2-3 mistakes, gaps, or areas of improvement>],\n"
        f"  \"improved_version\": \"<a concise, perfect sample response written in a simple, fresher-friendly manner, about 2-3 sentences>\"\n"
        f"}}\n"
    )

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    llm_response_text = ""

    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            llm_response_text = response.text.strip()
        except Exception as e:
            print(f"[Gemini evaluation failed]: {e}")

    if not llm_response_text:
        # Fallback to free Pollinations AI if Gemini is not configured or fails
        try:
            provider_result = generate_ai_response(
                "You are an expert technical interviewer. Respond ONLY with a valid JSON object. Do not include markdown or backticks.",
                [],
                prompt
            )
            if provider_result:
                llm_response_text = provider_result.content.strip()
        except Exception as e:
            print(f"[Fallback AI evaluation failed]: {e}")

    if llm_response_text:
        try:
            text = llm_response_text
            if text.startswith("```"):
                lines = text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                text = "\n".join(lines).strip()
            
            # Robust JSON parser: find first { and last } to avoid any outer noise/ads
            import json
            start_idx = text.find('{')
            end_idx = text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                text_json = text[start_idx:end_idx+1]
                ai_json = json.loads(text_json)
        except Exception as e:
            print(f"[JSON parsing failed for evaluation]: {e}, raw: {llm_response_text}")

    if ai_json and isinstance(ai_json, dict) and "score" in ai_json:
        return EvaluationResponse(
            score=int(ai_json.get("score", 70)),
            strengths=ai_json.get("strengths", ["Demonstrated willingness to answer."]),
            mistakes=ai_json.get("mistakes", ["Gaps in technical description."]),
            improved_version=ai_json.get("improved_version", "Here is a standard simple answer.")
        )

    # Fallback grading logic based on matching technical keywords
    q_lower = question.lower()
    ans_lower = answer.lower()
    
    score = 50
    strengths = []
    mistakes = []
    improved_version = ""

    if "let" in q_lower and "const" in q_lower:
        keywords = ["scope", "block", "hoist", "reassign", "function", "global"]
        found = [k for k in keywords if k in ans_lower]
        score += len(found) * 8
        if len(ans_lower) > 100:
            score += 10
        score = min(98, score)

        if "reassign" in found or "assign" in found:
            strengths.append("Correctly mentioned that const cannot be reassigned while let and var can.")
        else:
            mistakes.append("Did not specify that const cannot be reassigned.")
            
        if "block" in found or "scope" in found:
            strengths.append("Identified block scope difference for let/const vs function scope for var.")
        else:
            mistakes.append("Var is function-scoped while let/const are block-scoped.")
            
        improved_version = (
            "var is function-scoped and hoisted, allowing it to be accessed before declaration. "
            "In contrast, let and const are block-scoped and exist in a temporal dead zone until declared. "
            "Furthermore, const variables cannot be reassigned, whereas let and var variables can."
        )

    elif "event loop" in q_lower:
        keywords = ["stack", "queue", "callback", "promise", "microtask", "macrotask", "thread", "asynchronous"]
        found = [k for k in keywords if k in ans_lower]
        score += len(found) * 7
        if len(ans_lower) > 120:
            score += 10
        score = min(98, score)

        if "stack" in found or "queue" in found:
            strengths.append("Correctly referenced Call Stack and Callback Queue processing loops.")
        else:
            mistakes.append("Mention Call Stack and Callback Queue mechanisms.")
            
        if "asynchronous" in found or "promise" in found:
            strengths.append("Explained asynchronous execution model handling non-blocking callbacks.")
        else:
            mistakes.append("Include details on promises or microtask queue prioritization.")
            
        improved_version = (
            "JavaScript is single-threaded, but it achieves non-blocking asynchronous execution using the Event Loop. "
            "Synchronous code runs on the Call Stack. Asynchronous tasks (like fetch or setTimeout) are handled by Web APIs, "
            "and their callbacks are placed in the Callback or Microtask Queue. "
            "Once the Call Stack is empty, the Event Loop pushes callbacks from the queues onto the stack for execution."
        )

    elif "sql" in q_lower and "nosql" in q_lower:
        keywords = ["relation", "table", "schema", "document", "scale", "structured", "key", "join"]
        found = [k for k in keywords if k in ans_lower]
        score += len(found) * 7
        if len(ans_lower) > 110:
            score += 10
        score = min(98, score)

        if "table" in found or "schema" in found:
            strengths.append("Correctly distinguished structured table schemas from flexible document shapes.")
        else:
            mistakes.append("Differentiate relational schemas (tables) from schema-less options (documents).")
            
        if "scale" in found or "join" in found:
            strengths.append("Analyzed scalability models (vertical vs horizontal scaling).")
        else:
            mistakes.append("Contrast scaling: SQL scales vertically while NoSQL scales horizontally.")
            
        improved_version = (
            "SQL databases are relational, structured, and enforce strict table schemas, making them ideal for complex queries and transactions. "
            "NoSQL databases are non-relational, schema-less, and store data as documents, key-values, or graphs. "
            "SQL scales vertically by adding hardware power, whereas NoSQL scales horizontally across multiple servers."
        )

    elif "hook" in q_lower:
        keywords = ["usestate", "useeffect", "state", "lifecycle", "functional", "render", "side effect"]
        found = [k for k in keywords if k in ans_lower]
        score += len(found) * 7
        if len(ans_lower) > 100:
            score += 10
        score = min(98, score)

        if "state" in found or "usestate" in found:
            strengths.append("Correctly identified useState for managing state inside functional components.")
        else:
            mistakes.append("Ensure you explain useState hook for local reactivity.")
            
        if "lifecycle" in found or "useeffect" in found:
            strengths.append("Properly identified useEffect for handling side effects and lifecycle events.")
        else:
            mistakes.append("Clarify how functional components handle side effects via useEffect.")
            
        improved_version = (
            "React Hooks are built-in functions that allow developers to use state and lifecycle features inside functional components without writing classes. "
            "useState adds state management to components, triggering updates on value changes. "
            "useEffect manages side effects like API fetching, timers, and DOM updates, replacing lifecycle methods like componentDidMount."
        )

    elif "closure" in q_lower:
        keywords = ["lexical", "scope", "outer", "inner", "function", "remember", "variable"]
        found = [k for k in keywords if k in ans_lower]
        score += len(found) * 7
        if len(ans_lower) > 100:
            score += 10
        score = min(98, score)

        if "outer" in found or "inner" in found or "lexical" in found:
            strengths.append("Correctly explained inner functions retaining access to lexical outer parent variables.")
        else:
            mistakes.append("Define closures as functions carrying scope bundles from outer definitions.")
            
        improved_version = (
            "A closure is formed when an inner function is defined inside an outer function, "
            "allowing it to retain access to variables in its outer lexical scope even after the outer function has finished executing. "
            "Closures are heavily used for data encapsulation, state preservation, and custom factory functions."
        )

    else:
        # Generic technical questions
        keywords = ["learn", "use", "code", "concept", "develop", "system", "programming"]
        found = [k for k in keywords if k in ans_lower]
        score += len(found) * 5
        if len(ans_lower) > 80:
            score += 15
        score = min(98, score)

        strengths.append("Delivered a coherent explanation of the technical term.")
        if len(ans_lower) < 60:
            mistakes.append("Expand on your explanation to include architectural purposes or use cases.")
        
        if not mistakes:
            mistakes.append("To elevate your answer, add concrete examples or real-world use cases.")

        improved_version = (
            f"Here is a refined version of your explanation: "
            f"'{answer}' "
            f"To perfect it, define the core concept first, state its main purpose, and provide a quick practical example of how it is used."
        )

    return EvaluationResponse(
        score=score,
        strengths=strengths,
        mistakes=mistakes,
        improved_version=improved_version
    )


class CodeEvaluationRequest(BaseModel):
    problem_title: str
    language: str
    code: str
    target_role: Optional[str] = "Frontend Developer"

class CodeEvaluationResponse(BaseModel):
    score: int
    strengths: List[str]
    mistakes: List[str]
    improved_version: str
    explanation: str

@router.post("/evaluate_code", response_model=CodeEvaluationResponse)
def evaluate_code(req: CodeEvaluationRequest):
    problem_title = req.problem_title.strip()
    language = req.language.strip()
    code = req.code.strip()
    
    if not code:
        return CodeEvaluationResponse(
            score=0,
            strengths=["None (No code provided)"],
            mistakes=["The code workspace is empty. Please write your solution before submitting!"],
            improved_version="// Provide a code solution here",
            explanation="Please write a coding solution so I can run and analyze it!"
        )

    ai_json = None
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'), override=True) if "pytest" not in sys.modules else None
    
    prompt = (
        f"You are an expert technical lead evaluating a candidate's code submission in a coding interview round.\n"
        f"Problem: \"{problem_title}\"\n"
        f"Programming Language: \"{language}\"\n"
        f"Candidate's Code Submission:\n"
        f"```\n{code}\n```\n"
        f"Target Role: \"{req.target_role}\"\n\n"
        f"Evaluate the code for logical correctness, time and space complexity, syntax, edge case handling, clean naming, and best practices. Be constructive and concise.\n"
        f"Respond ONLY with a JSON object. Do not include markdown formatting or outer codeblocks. Here is the required JSON structure:\n"
        f"{{\n"
        f"  \"score\": <integer score from 0 to 100>,\n"
        f"  \"strengths\": [<list of 2-3 specific positive aspects of their code>],\n"
        f"  \"mistakes\": [<list of 2-3 syntax issues, speed optimizations, or edge cases missed>],\n"
        f"  \"improved_version\": \"<a fully optimized, clean, correct solution code string in that language, single line formatted with newlines as \\n>\",\n"
        f"  \"explanation\": \"<a 2-3 sentence clear, fresher-friendly walkthrough explanation of why this optimization is best>\"\n"
        f"}}\n"
    )

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    llm_response_text = ""

    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            llm_response_text = response.text.strip()
        except Exception as e:
            print(f"[Gemini code evaluation failed]: {e}")

    if not llm_response_text:
        # Fallback to free Pollinations AI if Gemini is not configured or fails
        try:
            system_prompt = "You are an expert technical lead evaluating code. Respond ONLY with a valid JSON object. Do not include markdown or backticks."
            user_content = (
                f"Evaluate this code submission.\n"
                f"Problem: \"{problem_title}\"\n"
                f"Programming Language: \"{language}\"\n"
                f"Candidate's Code Submission:\n"
                f"```\n{code}\n```\n"
                f"Target Role: \"{req.target_role}\"\n\n"
                f"Respond ONLY with a JSON object containing keys: score (0-100), strengths (array of strings), mistakes (array of strings), improved_version (code string), explanation (string walkthrough)."
            )
            provider_result = generate_ai_response(system_prompt, [], user_content)
            if provider_result:
                llm_response_text = provider_result.content.strip()
        except Exception as e:
            print(f"[Fallback AI code evaluation failed]: {e}")

    if llm_response_text:
        try:
            text = llm_response_text
            if text.startswith("```"):
                lines = text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                text = "\n".join(lines).strip()
            
            # Robust JSON parser: find first { and last }
            import json
            start_idx = text.find('{')
            end_idx = text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                text_json = text[start_idx:end_idx+1]
                ai_json = json.loads(text_json)
        except Exception as e:
            print(f"[JSON parsing failed for code evaluation]: {e}, raw: {llm_response_text}")

    if ai_json and isinstance(ai_json, dict) and "score" in ai_json:
        return CodeEvaluationResponse(
            score=int(ai_json.get("score", 70)),
            strengths=ai_json.get("strengths", ["Demonstrated coding logic."]),
            mistakes=ai_json.get("mistakes", ["Gaps in time complexity optimization."]),
            improved_version=ai_json.get("improved_version", "Here is a standard simple code solution."),
            explanation=ai_json.get("explanation", "Walkthrough of code optimization and safety patterns.")
        )

    # Local fallback keywords coding analysis
    prob_lower = problem_title.lower()
    code_lower = code.lower()
    
    score = 60
    strengths = []
    mistakes = []
    improved_version = ""
    explanation = ""

    if "debounce" in prob_lower:
        has_timeout = "settimeout" in code_lower
        has_clear = "cleartimeout" in code_lower
        has_closure = "return function" in code_lower or "return (" in code_lower or "=>" in code_lower
        has_args = "apply" in code_lower or "call" in code_lower or "...args" in code_lower
        
        if has_timeout:
            strengths.append("Correctly implemented delayed execution using setTimeout.")
            score += 10
        else:
            mistakes.append("Missing setTimeout call to delay function execution.")
            
        if has_clear:
            strengths.append("Correctly cleared previous timeouts using clearTimeout to prevent trigger overflows.")
            score += 10
        else:
            mistakes.append("Missing clearTimeout. Without clearing previous timers, the function will fire repeatedly.")
            
        if has_closure:
            strengths.append("Correctly returned a closure function to retain timer references.")
            score += 10
        else:
            mistakes.append("Ensure your debounce wrapper returns a closure function representing the wrapper trigger.")
            
        if has_args:
            strengths.append("Properly passed original event parameters and arguments using lexical triggers.")
            score += 10
        else:
            mistakes.append("Consider forwarding function parameters using rest arguments (...args) or function.apply().")

        score = min(98, score)
        improved_version = (
            "function debounce(func, delay) {\n"
            "  let timeoutId;\n"
            "  return function(...args) {\n"
            "    if (timeoutId) clearTimeout(timeoutId);\n"
            "    timeoutId = setTimeout(() => {\n"
            "      func.apply(this, args);\n"
            "    }, delay);\n"
            "  };\n"
            "}"
        )
        explanation = (
            "Debouncing is an optimization pattern that guarantees a rapid fire trigger (like typing in a search bar) "
            "only calls your handler after a specific period of silence. We clear previous timers using clearTimeout, "
            "and preserve calling context and event arguments using standard closures and rest parameters."
        )

    elif "two sum" in prob_lower:
        uses_map = "map" in code_lower or "dict" in code_lower or "{" in code_lower or "}" in code_lower
        has_double_loop = code_lower.count("for ") >= 2 or (code_lower.count("for ") == 1 and "while " in code_lower)
        
        if uses_map:
            strengths.append("Excellent optimization! Used a hash map / lookup object to solve the problem in linear time.")
            score += 25
        else:
            mistakes.append("Uses nested iterations. A hash-map lookup allows solving in single pass O(N) time instead.")
            
        if has_double_loop and not uses_map:
            mistakes.append("Suboptimal O(N^2) speed. Double loops run slowly for large datasets.")
            score -= 10
        elif not has_double_loop and uses_map:
            strengths.append("Properly avoided nested O(N^2) iterations.")
            score += 10

        score = max(40, min(98, score))
        if language.lower() == "python":
            improved_version = (
                "def twoSum(nums, target):\n"
                "    seen = {}\n"
                "    for i, num in enumerate(nums):\n"
                "        complement = target - num\n"
                "        if complement in seen:\n"
                "            return [seen[complement], i]\n"
                "        seen[num] = i\n"
                "    return []"
            )
        else:
            improved_version = (
                "function twoSum(nums, target) {\n"
                "  const seen = new Map();\n"
                "  for (let i = 0; i < nums.length; i++) {\n"
                "    const complement = target - nums[i];\n"
                "    if (seen.has(complement)) {\n"
                "      return [seen.get(complement), i];\n"
                "    }\n"
                "    seen.set(nums[i], i);\n"
                "  }\n"
                "  return [];\n"
                "}"
            )
        explanation = (
            "Instead of a nested iteration checking all combinations in O(N^2), "
            "we traverse the elements once and compute the 'complement' (target - current). "
            "Storing previously visited elements inside a Map dictionary allows constant-time O(1) lookups, "
            "delivering a perfect O(N) linear runtime."
        )

    elif "salary" in prob_lower or "employee" in prob_lower:
        has_limit = "limit" in code_lower
        has_offset = "offset" in code_lower
        has_max = "max" in code_lower
        
        if has_limit or has_offset or has_max:
            strengths.append("Correctly referenced filtering aggregates to isolate record hierarchies.")
            score += 25
        else:
            mistakes.append("Missing selection offsets. Ensure you query specifically the second highest salary using LIMIT/OFFSET or MAX subqueries.")
            
        score = min(98, score)
        improved_version = (
            "SELECT MAX(Salary) AS SecondHighestSalary\n"
            "FROM Employee\n"
            "WHERE Salary < (SELECT MAX(Salary) FROM Employee);"
        )
        explanation = (
            "This query filters out the absolute maximum salary, and retrieves the maximum of all remaining salaries, "
            "which represents exactly the second highest record. Alternatively, you can use "
            "'SELECT Salary FROM Employee ORDER BY Salary DESC LIMIT 1 OFFSET 1' (but note this requires handling NULL fallbacks)."
        )

    else:
        strengths.append("Submitted code logic is structurally valid.")
        if len(code) > 100:
            strengths.append("Used descriptive naming and functional structures.")
            score += 15
        else:
            mistakes.append("The code is very short. Try detailing functional helper routines or safety constraints.")
            
        improved_version = code
        explanation = "Walkthrough of code logic and stylistic clean code reviews."

    return CodeEvaluationResponse(
        score=score,
        strengths=strengths,
        mistakes=mistakes,
        improved_version=improved_version,
        explanation=explanation
    )


class GenerateQuestionRequest(BaseModel):
    language: str = "python"
    difficulty: str = "Easy"
    topic: Optional[str] = None


class GenerateQuestionResponse(BaseModel):
    title: str
    language: str
    difficulty: str
    category: str
    description: str
    constraints: List[str]
    starter_code: str


@router.post("/generate_question", response_model=GenerateQuestionResponse)
def generate_question(req: GenerateQuestionRequest):
    """
    Uses AI to dynamically generate a unique, fresh coding challenge for the given
    programming language and difficulty level (Easy, Medium, Hard).
    """
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'), override=True) if "pytest" not in sys.modules else None

    lang = req.language.strip().lower()
    difficulty = req.difficulty.strip().capitalize()
    topic_hint = f" Focus on the topic: {req.topic}." if req.topic else ""

    lang_display_map = {
        "python": "Python",
        "javascript": "JavaScript",
        "java": "Java",
        "cpp": "C++",
        "csharp": "C#",
        "typescript": "TypeScript",
        "go": "Go (Golang)",
        "rust": "Rust",
        "sql": "SQL",
        "kotlin": "Kotlin",
        "swift": "Swift",
        "php": "PHP",
        "ruby": "Ruby",
        "scala": "Scala",
    }
    lang_label = lang_display_map.get(lang, lang.title())

    starter_hints = {
        "python": "def solution():\n    # Write here\n    pass",
        "javascript": "function solution() {\n  // Write here\n}",
        "java": "class Solution {\n    public void solution() {\n        // Write here\n    }\n}",
        "cpp": "#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solution() {\n    // Write here\n}",
        "csharp": "using System;\npublic class Solution {\n    public void Solve() {\n        // Write here\n    }\n}",
        "typescript": "function solution(): void {\n  // Write here\n}",
        "go": "package main\n\nfunc solution() {\n    // Write here\n}",
        "rust": "fn solution() {\n    // Write here\n}",
        "sql": "-- Write your SQL query here\nSELECT ",
        "kotlin": "fun solution() {\n    // Write here\n}",
        "swift": "func solution() {\n    // Write here\n}",
        "php": "<?php\nfunction solution() {\n    // Write here\n}\n?>",
        "ruby": "def solution\n  # Write here\nend",
        "scala": "object Solution {\n  def solution(): Unit = {\n    // Write here\n  }\n}",
    }

    system_prompt = (
        "You are an expert coding interview question generator. "
        "Generate exactly ONE unique coding interview question in strict JSON format. "
        "Do NOT add any explanation or markdown — only pure JSON. "
        "The JSON must have these keys: "
        "\"title\" (short problem name), "
        "\"category\" (topic like Arrays, Trees, DP, SQL, etc.), "
        "\"description\" (2-4 sentence problem statement), "
        "\"constraints\" (array of 2-3 short constraint strings), "
        "\"starter_code\" (properly formatted starter code skeleton in the target language). "
        "The question MUST be clearly appropriate for the requested difficulty level."
    )

    user_prompt = (
        f"Generate a {difficulty} difficulty coding question for {lang_label}.{topic_hint} "
        f"The starter_code skeleton must be valid {lang_label} syntax. "
        f"Use this as the base starter template structure:\n{starter_hints.get(lang, starter_hints['python'])}\n"
        f"Return ONLY valid JSON, no other text."
    )

    raw_content = ""
    try:
        result = generate_ai_response(system_prompt, [], user_prompt)
        if result:
            raw_content = result.content.strip()
    except Exception as e:
        raw_content = ""

    # Parse JSON from AI response
    import json
    parsed = None
    try:
        # Strip markdown code fences if present
        clean = re.sub(r"```(?:json)?", "", raw_content).replace("```", "").strip()
        parsed = json.loads(clean)
    except Exception:
        parsed = None

    if parsed and isinstance(parsed, dict):
        return GenerateQuestionResponse(
            title=parsed.get("title", f"{difficulty} {lang_label} Challenge"),
            language=lang,
            difficulty=difficulty,
            category=parsed.get("category", "Algorithms"),
            description=parsed.get("description", f"Solve this {difficulty} {lang_label} problem."),
            constraints=parsed.get("constraints", ["Optimize for time complexity.", "Handle edge cases."]),
            starter_code=parsed.get("starter_code", starter_hints.get(lang, "// Write your solution here")),
        )

    # Hardcoded fallback bank (broad variety per language + difficulty)
    fallbacks = {
        ("python", "Easy"): {
            "title": "Find Maximum Element", "category": "Arrays",
            "description": "Given a list of integers, return the maximum element without using built-in max().",
            "constraints": ["Do not use Python's built-in max() or sort().", "O(N) time complexity required."],
            "starter_code": "def findMax(nums: list) -> int:\n    # Write your solution\n    pass",
        },
        ("python", "Medium"): {
            "title": "Longest Substring Without Repeating Characters", "category": "Sliding Window",
            "description": "Given a string s, find the length of the longest substring without repeating characters.",
            "constraints": ["O(N) sliding window approach expected.", "Handle empty string edge case."],
            "starter_code": "def lengthOfLongestSubstring(s: str) -> int:\n    # Write your solution\n    pass",
        },
        ("python", "Hard"): {
            "title": "Median of Two Sorted Arrays", "category": "Binary Search",
            "description": "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
            "constraints": ["O(log(m+n)) time complexity required.", "Handle arrays of different lengths."],
            "starter_code": "def findMedianSortedArrays(nums1: list, nums2: list) -> float:\n    # Write your solution\n    pass",
        },
        ("javascript", "Easy"): {
            "title": "Reverse a String", "category": "Strings",
            "description": "Write a function that reverses a string. The input string is given as an array of characters.",
            "constraints": ["Do not use built-in reverse().", "Solve in-place with O(1) extra memory."],
            "starter_code": "function reverseString(s) {\n  // Write your solution here\n}",
        },
        ("javascript", "Medium"): {
            "title": "Implement Promise.all()", "category": "Async/Concurrency",
            "description": "Implement a custom myPromiseAll() function that behaves like Promise.all(). It takes an array of promises and returns a single promise.",
            "constraints": ["Resolve when all promises resolve.", "Reject immediately if any promise rejects."],
            "starter_code": "function myPromiseAll(promises) {\n  // Write your solution here\n}",
        },
        ("sql", "Easy"): {
            "title": "Select Customers Without Orders", "category": "SQL Joins",
            "description": "Find all customers from the Customers table who never placed an order in the Orders table.",
            "constraints": ["Use a LEFT JOIN or NOT EXISTS clause.", "Return customer names only."],
            "starter_code": "-- Write your SQL query\nSELECT ",
        },
        ("java", "Easy"): {
            "title": "Check Palindrome", "category": "Strings",
            "description": "Write a method that checks whether a given string is a palindrome.",
            "constraints": ["Case-insensitive comparison.", "Ignore non-alphanumeric characters."],
            "starter_code": "class Solution {\n    public boolean isPalindrome(String s) {\n        // Write your solution\n        return false;\n    }\n}",
        },
    }

    key = (lang, difficulty)
    fallback = fallbacks.get(key, fallbacks.get(("python", difficulty), list(fallbacks.values())[0]))

    return GenerateQuestionResponse(
        title=fallback["title"],
        language=lang,
        difficulty=difficulty,
        category=fallback["category"],
        description=fallback["description"],
        constraints=fallback["constraints"],
        starter_code=fallback["starter_code"],
    )
