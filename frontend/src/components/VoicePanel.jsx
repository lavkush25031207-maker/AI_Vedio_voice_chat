import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Sparkles, 
  Loader2, 
  Settings,
  HelpCircle,
  Play,
  User,
  Bot,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  VolumeX
} from 'lucide-react';

export const QUESTION_BANKS = {
  python: [
    "Explain the difference between lists and tuples in Python, and when to use each.",
    "How does memory management and garbage collection work in Python?",
    "What are Python decorators and how do you write a custom decorator?",
    "Explain the difference between shallow copy and deep copy in Python.",
    "What are *args and **kwargs in Python functions and why do we use them?"
  ],
  java: [
    "Explain the core OOP principles in Java and how polymorphism is achieved.",
    "What is the difference between an abstract class and an interface in Java?",
    "How does memory management and Garbage Collection work in the JVM?",
    "Explain the difference between checked and unchecked exceptions in Java.",
    "What is the difference between HashMap, HashTable, and ConcurrentHashMap in Java?"
  ],
  react: [
    "What are React hooks and what problems do they solve compared to class components?",
    "Explain the Virtual DOM and how React's reconciliation algorithm works.",
    "What is the difference between useEffect, useMemo, and useCallback in React?",
    "How do you manage state across a large React application using Context or Redux?",
    "What is the difference between controlled and uncontrolled components in React?"
  ],
  javascript: [
    "Explain the difference between let, const, and var in JavaScript.",
    "What is the event loop in JavaScript and how does it handle microtasks vs macrotasks?",
    "What is a Closure in JavaScript and what is a practical real-world use case for it?",
    "Explain the difference between Promises, async/await, and traditional callbacks.",
    "What is prototypal inheritance and how does the prototype chain work in JavaScript?"
  ],
  database: [
    "What is the difference between SQL and NoSQL databases, and when would you choose each?",
    "Explain the ACID properties in relational database management systems.",
    "What is the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN in SQL?",
    "What is database indexing and how does it optimize search and query performance?",
    "What is database normalization and what are the first three normal forms?"
  ],
  cpp: [
    "What is the difference between pointers and references in C++?",
    "Explain virtual functions and runtime polymorphism in C++.",
    "What is RAII (Resource Acquisition Is Initialization) in C++ and why is it used?",
    "What is the difference between struct and class in C++?",
    "Explain the different types of smart pointers in modern C++ (unique_ptr, shared_ptr, weak_ptr)."
  ],
  dsa: [
    "Explain the difference between an Array and a Linked List in terms of time and space complexity.",
    "How does a Hash Table work and how are hash collisions handled?",
    "What is the difference between Breadth-First Search (BFS) and Depth-First Search (DFS)?",
    "Explain how Quick Sort works and what its best, average, and worst-case time complexities are.",
    "What is a Binary Search Tree (BST) and what makes an AVL tree balanced?"
  ],
  hr: [
    "Tell me about yourself, your educational background, and your key technical interests.",
    "Describe a challenging project or technical problem you solved, and how you approached it.",
    "Why are you interested in this software development role?",
    "How do you handle tight deadlines, pressure, or disagreements in a technical team?",
    "Where do you see yourself professionally in the next three to five years?"
  ]
};

export const TOPICS = [
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'java', label: 'Java', icon: '☕' },
  { id: 'react', label: 'React', icon: '⚛️' },
  { id: 'javascript', label: 'JavaScript', icon: '⚡' },
  { id: 'database', label: 'SQL & DB', icon: '🗄️' },
  { id: 'cpp', label: 'C++', icon: '🚀' },
  { id: 'dsa', label: 'DSA', icon: '🧠' },
  { id: 'hr', label: 'HR Behavioral', icon: '💼' }
];

// Fallback alias for backward compatibility
const QUESTIONS = QUESTION_BANKS.python;

export function detectTopic(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/\b(python|py|django|flask)\b/.test(lower)) return 'python';
  if (/\b(java|spring|springboot|jvm)\b/.test(lower) && !/\bjavascript\b/.test(lower)) return 'java';
  if (/\b(react|reactjs|hooks|virtual dom|jsx|redux)\b/.test(lower)) return 'react';
  if (/\b(sql|database|nosql|mysql|postgres|mongodb|db|query)\b/.test(lower)) return 'database';
  if (/\b(c\+\+|cpp|c plus plus)\b/.test(lower)) return 'cpp';
  if (/\b(dsa|data structure|algorithm|sorting|tree|graph)\b/.test(lower)) return 'dsa';
  if (/\b(hr|behavioral|non-technical|introduction|tell me about yourself)\b/.test(lower)) return 'hr';
  if (/\b(javascript|js|node|typescript|ts|ecmascript)\b/.test(lower)) return 'javascript';
  return null;
}

// Clean Hinglish detection markers — strictly NO English words (removed 'the', 'to', 'main', 'sir', 'ho', 'na', 'hum', 'han')
const HINGLISH_MARKERS = [
  "mujhe", "meri", "mera", "mere", "tumhara", "tumhari", "aapka", "aapki", "aapke", "aap",
  "hain", "hoga", "hogi", "honge", "karo", "karna", "karte", "karta",
  "karti", "batao", "bata", "batana", "samjhao", "samjhana", "chahiye", "chahta", "chahti",
  "chahte", "dekhna", "dekhte", "dekho", "seekhna", "seekhte", "seekho", "puchna", "pucho",
  "kya", "kaise", "kyun", "kyunki", "kab", "kahan", "kaun", "kitna", "kitni",
  "kal", "aaj", "abhi", "phir", "lekin", "nahi", "nahin", "nhi",
  "achha", "accha", "theek", "bilkul", "haan",
  "bahut", "thoda", "zyada", "matlab", "iska", "uska", "inhe", "unhe",
  "btao", "smjhao", "smjh", "krna", "krte", "kro", "hai", "bolo", "baat",
  "bhi", "toh", "yaar", "bhai", "boliye", "bologe",
  "karenge", "karein", "kijiye", "shuru", "sikha", "padhna", "padhao",
  "samajh", "aaya", "aayi", "gaya", "gayi", "raha", "rahi", "rahe",
  "tha", "thi", "wala", "wali", "wale", "kuch", "shukriya", "dhanyawad",
  "kripya", "kisko", "kisse"
];

export function detectHinglish(text) {
  if (!text) return false;
  const words = new Set(text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean));
  return HINGLISH_MARKERS.some(marker => words.has(marker));
}

export default function VoicePanel() {
  const [activeTab, setActiveTab] = useState('call'); // 'call' or 'evaluate'
  
  // Call mode states
  const [isCalling, setIsCalling] = useState(false);
  const [status, setStatus] = useState('Idle'); // 'Idle', 'Connecting...', 'Listening...', 'Thinking...', 'Speaking...'
  const [userSpeech, setUserSpeech] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [callError, setCallError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  // Conversation mode: 'welcome' -> 'conversation' (free chat) or 'interview' (structured Q&A)
  const [conversationMode, setConversationMode] = useState('welcome'); // 'welcome', 'conversation', 'interview'
  const [detectedLang, setDetectedLang] = useState('en'); // 'en' or 'hi' (Hinglish)
  
  // Topic selection & question sets based on user choice
  const [currentTopic, setCurrentTopic] = useState('python');
  const currentTopicRef = useRef('python');
  const hasUserChosenTopicRef = useRef(false);
  const [activeQuestions, setActiveQuestions] = useState(QUESTION_BANKS.python);
  const activeQuestionsRef = useRef(QUESTION_BANKS.python);

  const switchTopic = (topicKey, shouldAnnounce = false) => {
    if (!QUESTION_BANKS[topicKey]) return;
    setCurrentTopic(topicKey);
    currentTopicRef.current = topicKey;
    hasUserChosenTopicRef.current = true;
    setActiveQuestions(QUESTION_BANKS[topicKey]);
    activeQuestionsRef.current = QUESTION_BANKS[topicKey];
    setLiveQuestionIndex(0);
    liveQuestionIndexRef.current = 0;
    setQuestionIndex(0);

    if (shouldAnnounce && isCallingRef.current) {
      const topicLabels = {
        python: 'Python', java: 'Java', react: 'React', javascript: 'JavaScript',
        database: 'SQL & Database', cpp: 'C++', dsa: 'Data Structures & Algorithms', hr: 'HR Behavioral'
      };
      const tLabel = topicLabels[topicKey] || topicKey;
      const isHindi = detectedLangRef.current === 'hi';
      const switchText = isHindi
        ? `Humne topic ${tLabel} switch kar diya hai. Kya aap iska interview practice karna chahte hain?`
        : `Switched topic to ${tLabel}. Would you like to practice interview questions for it?`;
      setAiResponse(switchText);
      speakAloud(switchText);
    }
  };

  // Live Interview State Machine
  const [liveQuestionIndex, setLiveQuestionIndex] = useState(0);
  const [liveInterviewState, setLiveInterviewState] = useState('idle'); // 'idle', 'welcome', 'listening', 'evaluating', 'speaking_eval', 'asking_next'
  const [liveEvaluation, setLiveEvaluation] = useState(null);

  const isMutedRef = useRef(false);
  const liveQuestionIndexRef = useRef(0);
  const liveInterviewStateRef = useRef('idle');
  const liveEvaluationRef = useRef(null);
  const conversationModeRef = useRef('welcome');
  const detectedLangRef = useRef('en');
  const isComponentMountedRef = useRef(true);
  
  // Voice Synthesis configurations
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  
  // Detailed Evaluation states
  const [questionIndex, setQuestionIndex] = useState(0);
  const [evalRecording, setEvalRecording] = useState(false);
  const [evalAnswer, setEvalAnswer] = useState('');
  const [evalStatus, setEvalStatus] = useState('Idle'); // 'Idle', 'Listening...', 'Thinking...'
  const [evalResult, setEvalResult] = useState(null); // { score, strengths, mistakes, improved_version }
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSpeakingRefined, setIsSpeakingRefined] = useState(false);

  const recognitionRef = useRef(null);
  const evalRecognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const activeUtteranceRef = useRef(null);

  // Refs to avoid stale closures in SpeechRecognition callbacks
  const userSpeechRef = useRef('');
  const isCallingRef = useRef(false);
  const silenceTimeoutRef = useRef(null);
  const sessionIdRef = useRef(null);
  const voiceSpeedRef = useRef(1.0);
  const voicePitchRef = useRef(1.0);
  const isSendingPromptRef = useRef(false);
  const lastPromptRef = useRef('');
  const lastPromptAtRef = useRef(0);

  // Sync state with refs
  useEffect(() => {
    isCallingRef.current = isCalling;
  }, [isCalling]);

  useEffect(() => {
    userSpeechRef.current = userSpeech;
  }, [userSpeech]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    voiceSpeedRef.current = voiceSpeed;
  }, [voiceSpeed]);

  useEffect(() => {
    voicePitchRef.current = voicePitch;
  }, [voicePitch]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    liveQuestionIndexRef.current = liveQuestionIndex;
  }, [liveQuestionIndex]);

  useEffect(() => {
    liveInterviewStateRef.current = liveInterviewState;
  }, [liveInterviewState]);

  useEffect(() => {
    liveEvaluationRef.current = liveEvaluation;
  }, [liveEvaluation]);

  useEffect(() => {
    conversationModeRef.current = conversationMode;
  }, [conversationMode]);

  useEffect(() => {
    detectedLangRef.current = detectedLang;
  }, [detectedLang]);

  useEffect(() => {
    currentTopicRef.current = currentTopic;
  }, [currentTopic]);

  useEffect(() => {
    activeQuestionsRef.current = activeQuestions;
  }, [activeQuestions]);

  // Initialize SpeechRecognition for Call Mode ONCE on mount
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        if (!isComponentMountedRef.current) return;
        setStatus('Listening...');
      };

      rec.onresult = (event) => {
        if (!isComponentMountedRef.current) return;
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const text = finalTranscript || interimTranscript;
        setUserSpeech(text);
        userSpeechRef.current = text;

        // Detect language from user's speech
        if (text.trim()) {
          const isHinglish = detectHinglish(text);
          if (isHinglish) {
            setDetectedLang('hi');
            detectedLangRef.current = 'hi';
          } else {
            setDetectedLang('en');
            detectedLangRef.current = 'en';
          }
        }

        // Auto-silence submission logic — wait 5 seconds of silence so user has time to think
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        
        if (text.trim()) {
          silenceTimeoutRef.current = setTimeout(() => {
            if (!isComponentMountedRef.current) return;
            if (isCallingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.stop(); // Stops capturing, which triggers onend and sends the prompt
              } catch (e) {}
            }
          }, 5000); // 5000ms ensures candidate is not cut off while formulating thoughts
        }
      };

      rec.onerror = (event) => {
        if (!isComponentMountedRef.current) return;
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          if (isCallingRef.current && 
              liveInterviewStateRef.current !== 'speaking_eval' && 
              liveInterviewStateRef.current !== 'evaluating' &&
              liveInterviewStateRef.current !== 'asking_next' &&
              liveInterviewStateRef.current !== 'welcome') {
            startSpeechRecognition();
          }
        }
      };

      rec.onend = () => {
        if (!isComponentMountedRef.current) return;
        if (isCallingRef.current) {
          const finalPrompt = userSpeechRef.current.trim();
          
          // In interview mode
          if (conversationModeRef.current === 'interview') {
            const lowerPrompt = finalPrompt.toLowerCase();
            // Voice command for next question
            if (/\b(next question|agla question|skip question|next|agla sawaal)\b/i.test(lowerPrompt)) {
              userSpeechRef.current = '';
              setUserSpeech('');
              goToNextQuestion();
              return;
            }

            if (liveInterviewStateRef.current === 'listening') {
              const wordCount = finalPrompt.split(/\s+/).filter(Boolean).length;
              // Only submit if user spoke a real thought (at least 3 words), not filler noise
              if (wordCount >= 3) {
                userSpeechRef.current = '';
                setUserSpeech('');
                evaluateLiveAnswer(finalPrompt);
              } else {
                // Short hesitation — keep listening, don't interrupt the candidate
                startSpeechRecognition();
              }
            } else {
              startSpeechRecognition();
            }
          } else {
            // In conversation mode or welcome mode — send as free-form prompt
            const normalizedPrompt = finalPrompt.toLowerCase().replace(/\s+/g, ' ');
            const now = Date.now();
            const isDuplicatePrompt = normalizedPrompt === lastPromptRef.current && now - lastPromptAtRef.current < 8000;

            if (finalPrompt && !isSendingPromptRef.current && !isDuplicatePrompt) {
              lastPromptRef.current = normalizedPrompt;
              lastPromptAtRef.current = now;
              userSpeechRef.current = '';
              setUserSpeech('');
              
              if (detectHinglish(finalPrompt)) {
                setDetectedLang('hi');
                detectedLangRef.current = 'hi';
              } else {
                setDetectedLang('en');
                detectedLangRef.current = 'en';
              }

              // Check if user is requesting interview mode or specific topic
              const lower = finalPrompt.toLowerCase();
              const wantsInterview = /\b(interview|mock|practice|quiz|test|pariksha)\b/i.test(lower);
              const requestedTopic = detectTopic(lower);
              
              if (wantsInterview) {
                if (requestedTopic) {
                  setConversationMode('interview');
                  conversationModeRef.current = 'interview';
                  startInterviewMode(requestedTopic);
                } else if (hasUserChosenTopicRef.current) {
                  setConversationMode('interview');
                  conversationModeRef.current = 'interview';
                  startInterviewMode(currentTopicRef.current);
                } else {
                  const isHindi = detectedLangRef.current === 'hi';
                  const askTopicText = isHindi
                    ? "Aap kaunse topic ka interview practice karna chahte hain? Aap Python, Java, React, JavaScript, SQL, C++, DSA, ya HR behavioral choose kar sakte hain."
                    : "Which topic would you like to practice? You can choose Python, Java, React, JavaScript, SQL, C++, DSA, or HR behavioral.";
                  setAiResponse(askTopicText);
                  speakAloud(askTopicText);
                }
              } else if (requestedTopic) {
                switchTopic(requestedTopic);
                const topicLabels = {
                  python: 'Python', java: 'Java', react: 'React', javascript: 'JavaScript',
                  database: 'SQL & Database', cpp: 'C++', dsa: 'Data Structures & Algorithms', hr: 'HR Behavioral'
                };
                const tName = topicLabels[requestedTopic] || requestedTopic;
                const isHindi = detectedLangRef.current === 'hi';
                const confirmText = isHindi
                  ? `Humne ${tName} select kar liya hai. Kya aap iska interview practice shuru karna chahte hain ya koi sawaal poochna chahte hain?`
                  : `Switched to ${tName}. Would you like to start interview practice, or ask a question about it?`;
                setAiResponse(confirmText);
                speakAloud(confirmText);
              } else {
                // Stay in conversation mode
                if (conversationModeRef.current === 'welcome') {
                  setConversationMode('conversation');
                  conversationModeRef.current = 'conversation';
                }
                sendVoicePrompt(finalPrompt);
              }
            } else {
              startSpeechRecognition();
            }
          }
        }
      };

      recognitionRef.current = rec;
    } else {
      console.warn('SpeechRecognition API not supported in this browser.');
    }

    // Chrome Speech Synthesis Workaround - Periodic Resume
    const resumeInterval = setInterval(() => {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.resume();
      }
    }, 4000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (activeUtteranceRef.current) {
          activeUtteranceRef.current.onend = null;
          activeUtteranceRef.current.onerror = null;
        }
        if (window.speechSynthesis) {
          try {
            window.speechSynthesis.pause();
            window.speechSynthesis.cancel();
          } catch (e) {}
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // CRITICAL: Mark component as unmounted to prevent any background execution
      isComponentMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clear all timers
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      clearInterval(resumeInterval);

      // Force-stop all speech recognition by detaching handlers first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }

      if (evalRecognitionRef.current) {
        try {
          evalRecognitionRef.current.onstart = null;
          evalRecognitionRef.current.onresult = null;
          evalRecognitionRef.current.onerror = null;
          evalRecognitionRef.current.onend = null;
          evalRecognitionRef.current.abort();
        } catch (e) {}
        evalRecognitionRef.current = null;
      }

      // Force-stop all speech synthesis
      if (activeUtteranceRef.current) {
        activeUtteranceRef.current.onend = null;
        activeUtteranceRef.current.onerror = null;
        activeUtteranceRef.current = null;
      }
      if (synthRef.current) {
        try {
          synthRef.current.pause();
          synthRef.current.cancel();
        } catch (e) {}
      }
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.pause();
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    };
  }, []); // Run ONLY once on mount!

  // Tab switching and cleanups
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Stop ongoing calls/transcriptions
    setIsCalling(false);
    setStatus('Idle');
    setSessionId(null);
    setUserSpeech('');
    setAiResponse('');
    setCallError('');
    isSendingPromptRef.current = false;
    lastPromptRef.current = '';
    lastPromptAtRef.current = 0;
    setLiveQuestionIndex(0);
    setLiveEvaluation(null);
    setLiveInterviewState('idle');
    setIsMuted(false);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if (synthRef.current) synthRef.current.cancel();
    
    // Stop evaluation states
    stopEvalRecognition();
    setIsSpeakingRefined(false);
  };

  // Call Mode Logic
  const toggleCall = async () => {
    if (isCalling) {
      hangUpCall();
    } else {
      await startCall();
    }
  };

  const startCall = async () => {
    setIsCalling(true);
    setStatus('Connecting...');
    setUserSpeech('');
    setAiResponse('');
    setCallError('');
    setLiveQuestionIndex(0);
    setLiveEvaluation(null);
    setIsMuted(false);
    setConversationMode('welcome');
    conversationModeRef.current = 'welcome';
    isSendingPromptRef.current = false;
    lastPromptRef.current = '';
    lastPromptAtRef.current = 0;
    
    // Start in English by default
    setDetectedLang('en');
    detectedLangRef.current = 'en';
    
    try {
      let profileId = null;
      try {
        const profileRes = await fetch('/api/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData && profileData.id) profileId = profileData.id;
        }
      } catch (err) {
        console.warn("Failed to get profile context:", err);
      }

      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profile_id: profileId,
          session_type: 'HR Behavioral Round'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.id);
        
        // Welcome message: exactly 10 words, 1 sentence, in English
        setLiveInterviewState('welcome');
        const welcomeText = "Welcome to TalkFlow AI, how can I help you today?";
        setAiResponse(welcomeText);
        speakAloud(welcomeText);
      } else {
        throw new Error("Failed to initialize session");
      }
    } catch (error) {
      console.error(error);
      setStatus('Idle');
      setIsCalling(false);
      setLiveInterviewState('idle');
      setCallError('Backend offline. Start the backend or run `npm run dev` from the project root, then try again.');
    }
  };

  // Start structured interview mode when user requests it
  const startInterviewMode = (topicParam) => {
    const topic = topicParam || currentTopicRef.current || 'javascript';
    const questions = QUESTION_BANKS[topic] || QUESTION_BANKS.javascript;
    
    setCurrentTopic(topic);
    currentTopicRef.current = topic;
    setActiveQuestions(questions);
    activeQuestionsRef.current = questions;
    
    setLiveQuestionIndex(0);
    liveQuestionIndexRef.current = 0;
    setLiveEvaluation(null);
    setLiveInterviewState('asking_next');
    
    const topicLabels = {
      python: 'Python',
      java: 'Java',
      react: 'React',
      javascript: 'JavaScript',
      database: 'SQL & Database',
      cpp: 'C++',
      dsa: 'Data Structures & Algorithms',
      hr: 'HR Behavioral'
    };
    const topicLabel = topicLabels[topic] || (topic.charAt(0).toUpperCase() + topic.slice(1));
    const isHindi = detectedLangRef.current === 'hi';
    const startText = isHindi 
      ? `Bahut accha! Chalo ${topicLabel} interview practice shuru karte hain. Pehla question hai: ${questions[0]}`
      : `Great! Let's start your ${topicLabel} interview practice. Here is your first question: ${questions[0]}`;
    setAiResponse(startText);
    speakAloud(startText);
  };

  const hangUpCall = () => {
    setIsCalling(false);
    setStatus('Idle');
    setSessionId(null);
    setUserSpeech('');
    setAiResponse('');
    setCallError('');
    setLiveQuestionIndex(0);
    setLiveEvaluation(null);
    setLiveInterviewState('idle');
    setConversationMode('welcome');
    conversationModeRef.current = 'welcome';
    hasUserChosenTopicRef.current = false;
    setIsMuted(false);
    
    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onend = null;
      activeUtteranceRef.current.onerror = null;
      activeUtteranceRef.current = null;
    }
    // Force-stop all speech recognition and synthesis
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if (synthRef.current) {
      try {
        synthRef.current.pause();
        synthRef.current.cancel();
      } catch (e) {}
    }
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.pause();
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
  };

  const submitSpeechNow = () => {
    if (!isCallingRef.current) return;
    const finalPrompt = userSpeechRef.current.trim();
    if (!finalPrompt) return;

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    userSpeechRef.current = '';
    setUserSpeech('');

    if (detectHinglish(finalPrompt)) {
      setDetectedLang('hi');
      detectedLangRef.current = 'hi';
    } else {
      setDetectedLang('en');
      detectedLangRef.current = 'en';
    }

    if (conversationModeRef.current === 'interview' && liveInterviewStateRef.current === 'listening') {
      evaluateLiveAnswer(finalPrompt);
    } else {
      const lower = finalPrompt.toLowerCase();
      const wantsInterview = /\b(interview|mock|practice|quiz|test|pariksha)\b/i.test(lower);
      const requestedTopic = detectTopic(lower);

      if (wantsInterview) {
        if (requestedTopic) {
          setConversationMode('interview');
          conversationModeRef.current = 'interview';
          startInterviewMode(requestedTopic);
        } else if (hasUserChosenTopicRef.current) {
          setConversationMode('interview');
          conversationModeRef.current = 'interview';
          startInterviewMode(currentTopicRef.current);
        } else {
          const isHindi = detectedLangRef.current === 'hi';
          const askTopicText = isHindi
            ? "Aap kaunse topic ka interview practice karna chahte hain? Aap Python, Java, React, JavaScript, SQL, C++, DSA, ya HR behavioral choose kar sakte hain."
            : "Which topic would you like to practice? You can choose Python, Java, React, JavaScript, SQL, C++, DSA, or HR behavioral.";
          setAiResponse(askTopicText);
          speakAloud(askTopicText);
        }
      } else if (requestedTopic) {
        switchTopic(requestedTopic);
        const topicLabels = {
          python: 'Python', java: 'Java', react: 'React', javascript: 'JavaScript',
          database: 'SQL & Database', cpp: 'C++', dsa: 'Data Structures & Algorithms', hr: 'HR Behavioral'
        };
        const tName = topicLabels[requestedTopic] || requestedTopic;
        const isHindi = detectedLangRef.current === 'hi';
        const confirmText = isHindi
          ? `Humne ${tName} select kar liya hai. Kya aap iska interview practice shuru karna chahte hain ya koi sawaal poochna chahte hain?`
          : `Switched to ${tName}. Would you like to start interview practice, or ask a question about it?`;
        setAiResponse(confirmText);
        speakAloud(confirmText);
      } else {
        if (conversationModeRef.current === 'welcome') {
          setConversationMode('conversation');
          conversationModeRef.current = 'conversation';
        }
        sendVoicePrompt(finalPrompt);
      }
    }
  };

  const startSpeechRecognition = () => {
    if (isMutedRef.current) return;
    if (recognitionRef.current && isCallingRef.current) {
      setUserSpeech('');
      userSpeechRef.current = '';
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already running
      }
    }
  };

  const speakAloud = (text) => {
    if (!synthRef.current) return;
    if (!isComponentMountedRef.current) return;
    
    synthRef.current.cancel();
    setStatus('Speaking...');
    
    // Stop any active recognition while AI is speaking
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch(e) {}
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSpeedRef.current;
    utterance.pitch = voicePitchRef.current;
    
    // Select voice based strictly on user's detected language
    const voices = synthRef.current.getVoices();
    const isHindi = detectedLangRef.current === 'hi';
    
    // Try to find a Hindi or Indian English voice for Hinglish mode, fallback to English
    let selectedVoice = null;
    if (isHindi) {
      selectedVoice = voices.find(v => v.lang.startsWith('hi')) ||
                      voices.find(v => v.lang === 'en-IN' || v.lang.startsWith('en-IN') || (v.name && v.name.toLowerCase().includes('india')));
    }
    if (!selectedVoice) {
      // Prioritize female English voices
      selectedVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('zira') || 
         v.name.toLowerCase().includes('susan') || 
         v.name.toLowerCase().includes('hazel') || 
         v.name.toLowerCase().includes('google us english') ||
         v.name.toLowerCase().includes('soft') ||
         v.name.toLowerCase().includes('natural'))
      ) || voices.find(v => v.lang.startsWith('en'));
    }
    
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = () => {
      if (!isComponentMountedRef.current) return;
      if (isCallingRef.current) {
        // In interview mode with structured Q&A states
        if (conversationModeRef.current === 'interview') {
          if (liveInterviewStateRef.current === 'welcome' || liveInterviewStateRef.current === 'asking_next') {
            setLiveInterviewState('listening');
            setStatus('Listening...');
            setTimeout(() => {
              if (isComponentMountedRef.current && isCallingRef.current) {
                startSpeechRecognition();
              }
            }, 500);
          } else if (liveInterviewStateRef.current === 'speaking_eval') {
            // Finished speaking evaluation feedback.
            // DO NOT auto-advance to next question! Leave user in control!
            setLiveInterviewState('eval_ready');
            setStatus('Feedback Ready');
            setTimeout(() => {
              if (isComponentMountedRef.current && isCallingRef.current) {
                startSpeechRecognition();
              }
            }, 500);
          } else {
            setStatus('Listening...');
            setTimeout(() => {
              if (isComponentMountedRef.current && isCallingRef.current) {
                startSpeechRecognition();
              }
            }, 500);
          }
        } else {
          // In conversation/welcome mode — always go back to listening after AI speaks
          if (liveInterviewStateRef.current === 'welcome') {
            setLiveInterviewState('listening');
          }
          setStatus('Listening...');
          setTimeout(() => {
            if (isComponentMountedRef.current && isCallingRef.current) {
              startSpeechRecognition();
            }
          }, 500);
        }
      }
    };

    utterance.onerror = (e) => {
      if (!isComponentMountedRef.current) return;
      console.error("SpeechSynthesis error:", e);
      if (isCallingRef.current) {
        if (conversationModeRef.current === 'interview') {
          if (liveInterviewStateRef.current === 'welcome' || liveInterviewStateRef.current === 'asking_next') {
            setLiveInterviewState('listening');
            setStatus('Listening...');
            setTimeout(() => {
              if (isComponentMountedRef.current && isCallingRef.current) {
                startSpeechRecognition();
              }
            }, 500);
          } else if (liveInterviewStateRef.current === 'speaking_eval') {
            setLiveInterviewState('eval_ready');
            setStatus('Feedback Ready');
            setTimeout(() => {
              if (isComponentMountedRef.current && isCallingRef.current) {
                startSpeechRecognition();
              }
            }, 500);
          } else {
            setStatus('Listening...');
            setTimeout(() => {
              if (isComponentMountedRef.current && isCallingRef.current) {
                startSpeechRecognition();
              }
            }, 500);
          }
        } else {
          if (liveInterviewStateRef.current === 'welcome') {
            setLiveInterviewState('listening');
          }
          setStatus('Listening...');
          setTimeout(() => {
            if (isComponentMountedRef.current && isCallingRef.current) {
              startSpeechRecognition();
            }
          }, 500);
        }
      }
    };

    // Chrome garbage collection bypass
    window.activeUtterances = window.activeUtterances || [];
    window.activeUtterances.push(utterance);
    if (window.activeUtterances.length > 50) {
      window.activeUtterances.shift();
    }

    activeUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const sendVoicePrompt = async (prompt) => {
    if (!sessionIdRef.current) return;
    
    isSendingPromptRef.current = true;
    setStatus('Thinking...');
    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          content: prompt
        })
      });

      if (res.ok) {
        const data = await res.json();
        const cleanAiResponse = data.content.replace(/[*#`]/g, '');
        // Language is strictly dictated by the user's speech
        const userSpokeHinglish = detectHinglish(prompt);
        if (userSpokeHinglish) {
          setDetectedLang('hi');
          detectedLangRef.current = 'hi';
        } else {
          setDetectedLang('en');
          detectedLangRef.current = 'en';
        }
        setAiResponse(data.content);
        speakAloud(cleanAiResponse);
      } else {
        throw new Error("Failed to send prompt");
      }
    } catch (err) {
      console.error(err);
      const errText = "I encountered an error connecting to the voice tutor server. Please try speaking again.";
      setAiResponse(errText);
      speakAloud(errText);
    } finally {
      isSendingPromptRef.current = false;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (newMuted) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    } else {
      if (isCalling && liveInterviewStateRef.current === 'listening') {
        startSpeechRecognition();
      }
    }
  };

  const evaluateLiveAnswer = async (answerText) => {
    if (!isComponentMountedRef.current) return;
    
    // Dynamically set language from user's verbal answer
    const isHindiAnswer = detectHinglish(answerText);
    setDetectedLang(isHindiAnswer ? 'hi' : 'en');
    detectedLangRef.current = isHindiAnswer ? 'hi' : 'en';

    if (!answerText || !answerText.trim()) {
      // DON'T auto-advance — ask user to try again
      const emptyText = isHindiAnswer 
        ? "Mujhe aapka answer sunai nahi diya. Kripya dobara boliye, main sun rahi hoon."
        : "I couldn't hear your answer. Please try speaking again, I'm listening.";
      setAiResponse(emptyText);
      setLiveInterviewState('asking_next'); // This will trigger listening after speaking
      speakAloud(emptyText);
      return;
    }

    setLiveInterviewState('evaluating');
    setStatus('Thinking...');
    
    try {
      const topicRoleMap = {
        python: "Python Developer",
        java: "Java Developer",
        react: "React Frontend Developer",
        javascript: "JavaScript Developer",
        database: "Database Administrator / SQL Developer",
        cpp: "C++ Software Engineer",
        dsa: "Software Engineer / Algorithms",
        hr: "Software Engineer Candidate"
      };
      let targetRole = topicRoleMap[currentTopicRef.current] || "Software Developer";
      try {
        const profileRes = await fetch('/api/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData && profileData.target_role) {
            targetRole = profileData.target_role;
          }
        }
      } catch (e) {
        console.warn("Failed to get profile target role:", e);
      }

      const currentQ = activeQuestionsRef.current[liveQuestionIndexRef.current] || activeQuestionsRef.current[0];
      const res = await fetch('/api/chat/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ,
          answer: answerText,
          target_role: targetRole
        })
      });

      if (!isComponentMountedRef.current) return;

      if (res.ok) {
        const evalData = await res.json();
        setLiveEvaluation(evalData);
        setLiveInterviewState('speaking_eval');
        
        const isHindi = detectedLangRef.current === 'hi';
        // Brief student-friendly spoken summary
        const primaryMistake = evalData.mistakes && evalData.mistakes.length > 0 
          ? evalData.mistakes[0] 
          : (isHindi ? "kuch concepts clarify nahi the" : "some concepts were not clearly explained");
          
        const spokenFeedback = isHindi
          ? `Aapka score hai ${evalData.score} out of 100. Key feedback: ${primaryMistake}. Screen par feedback check kijiye aur jab ready hon toh Next Question par click kijiye.`
          : `Your score is ${evalData.score} out of 100. Key feedback: ${primaryMistake}. Please review the feedback on screen and click Next Question when you are ready.`;
        setAiResponse(spokenFeedback);
        speakAloud(spokenFeedback);
      } else {
        throw new Error("Live evaluation failed");
      }
    } catch (err) {
      if (!isComponentMountedRef.current) return;
      console.error("[Live eval error]:", err);
      const isHindi = detectedLangRef.current === 'hi';
      const errText = isHindi
        ? "Evaluation me thodi problem aayi. Screen par Next Question click karke aage badh sakte hain."
        : "There was an issue with evaluation. Click Next Question to continue.";
      setAiResponse(errText);
      setLiveInterviewState('eval_ready');
      speakAloud(errText);
    }
  };

  const goToNextQuestion = () => {
    if (!isComponentMountedRef.current) return;
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    const nextIndex = liveQuestionIndexRef.current + 1;
    const questions = activeQuestionsRef.current;
    const isHindi = detectedLangRef.current === 'hi';
    
    if (nextIndex < questions.length) {
      setLiveQuestionIndex(nextIndex);
      setLiveEvaluation(null);
      setUserSpeech('');
      setLiveInterviewState('asking_next');
      
      const nextText = isHindi
        ? `Agla question hai: ${questions[nextIndex]}`
        : `Next question: ${questions[nextIndex]}`;
      setAiResponse(nextText);
      speakAloud(nextText);
    } else {
      const finishText = isHindi
        ? "Congratulations! Aapne saare questions poore kar liye hain. Aapka mock practice session complete ho gaya hai. Thank you!"
        : "Congratulations! You have completed all the questions. Your mock practice session is complete. Thank you!";
      setAiResponse(finishText);
      setLiveInterviewState('idle');
      setConversationMode('welcome');
      conversationModeRef.current = 'welcome';
      speakAloud(finishText);
      setTimeout(() => {
        if (isComponentMountedRef.current) {
          hangUpCall();
        }
      }, 7000);
    }
  };

  // Evaluation Mode Logic
  const startEvalRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your response directly.");
      return;
    }

    if (evalRecognitionRef.current) {
      try {
        evalRecognitionRef.current.stop();
      } catch (e) {}
    }

    if (synthRef.current) synthRef.current.cancel();
    setIsSpeakingRefined(false);

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setEvalRecording(true);
      setEvalStatus('Listening...');
    };

    rec.onresult = (event) => {
      let currentText = '';
      for (let i = 0; i < event.results.length; ++i) {
        currentText += event.results[i][0].transcript;
      }
      setEvalAnswer(currentText);
    };

    rec.onerror = (e) => {
      console.error('Evaluation transcription error:', e.error);
    };

    rec.onend = () => {
      setEvalRecording(false);
      setEvalStatus('Idle');
    };

    evalRecognitionRef.current = rec;
    rec.start();
  };

  const stopEvalRecognition = () => {
    if (evalRecognitionRef.current) {
      try {
        evalRecognitionRef.current.stop();
      } catch (e) {}
    }
    setEvalRecording(false);
    setEvalStatus('Idle');
  };

  const handleEvaluate = async () => {
    if (!evalAnswer.trim()) {
      alert("Please speak or type your answer first!");
      return;
    }

    stopEvalRecognition();
    setIsEvaluating(true);
    setEvalStatus('Thinking...');
    
    try {
      let targetRole = "Frontend Developer";
      try {
        const profileRes = await fetch('/api/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData && profileData.target_role) {
            targetRole = profileData.target_role;
          }
        }
      } catch (e) {
        console.warn("Failed to get profile target role:", e);
      }

      const res = await fetch('/api/chat/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQuestions[questionIndex] || activeQuestions[0],
          answer: evalAnswer,
          target_role: targetRole
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEvalResult(data);
        setEvalStatus('Idle');
      } else {
        throw new Error("Evaluation endpoint failed");
      }
    } catch (error) {
      console.error(error);
      alert("Evaluation failed. Please try again.");
      setEvalStatus('Idle');
    } finally {
      setIsEvaluating(false);
    }
  };

  const cycleQuestion = () => {
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeakingRefined(false);
    setEvalAnswer('');
    setEvalResult(null);
    stopEvalRecognition();
    setQuestionIndex(prev => (prev + 1) % (activeQuestions.length || 1));
  };

  const speakRefinedAnswer = (text) => {
    if (!synthRef.current) return;

    if (isSpeakingRefined) {
      synthRef.current.cancel();
      setIsSpeakingRefined(false);
      return;
    }

    synthRef.current.cancel();
    setIsSpeakingRefined(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSpeedRef.current;
    utterance.pitch = voicePitchRef.current;

    const voices = synthRef.current.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onend = () => {
      setIsSpeakingRefined(false);
    };

    utterance.onerror = (e) => {
      console.error(e);
      setIsSpeakingRefined(false);
    };

    synthRef.current.speak(utterance);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow/Orange
    return '#ef4444'; // Red
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Outstanding Concept Knowledge!';
    if (score >= 60) return 'Solid Foundation. A few gaps to address.';
    return 'Requires review. Focus on key technical terms.';
  };

  return (
    <div className="voice-panel" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Premium Glass Switcher Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px', 
        background: 'rgba(255,255,255,0.03)', 
        padding: '6px', 
        borderRadius: '30px', 
        border: '1px solid rgba(255,255,255,0.06)', 
        width: 'fit-content' 
      }}>
        <button 
          onClick={() => handleTabChange('call')}
          style={{
            padding: '10px 20px',
            borderRadius: '24px',
            border: 'none',
            background: activeTab === 'call' ? 'linear-gradient(135deg, var(--color-accent), var(--color-purple))' : 'transparent',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <Volume2 size={16} />
          Interactive Call Mode
        </button>
        <button 
          onClick={() => handleTabChange('evaluate')}
          style={{
            padding: '10px 20px',
            borderRadius: '24px',
            border: 'none',
            background: activeTab === 'evaluate' ? 'linear-gradient(135deg, var(--color-accent), var(--color-purple))' : 'transparent',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <Sparkles size={16} />
          Detailed Answer Evaluation
        </button>
      </div>

      <div className="responsive-grid voice-workspace-grid" style={{ display: 'grid', gridTemplateColumns: '5fr 3fr', gap: '24px' }}>
        
        {/* Left Side: Active Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TAB 1: CALL MODE */}
          {activeTab === 'call' && (
            <div className="glass-panel" style={{
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              minHeight: '520px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {!isCalling ? (
                // State: Call NOT started
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.05)',
                      padding: '6px',
                      borderRadius: '50%',
                      display: 'flex',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <Volume2 size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Voice Speaking Practice</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hands-free speech-to-speech learning</span>
                    </div>
                  </div>

                  {/* Topic Selector Pills for user choice */}
                  <div style={{ margin: '16px 0 8px 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                      Select Your Preferred Topic / Subject:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {TOPICS.map((t) => {
                        const isSelected = currentTopic === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => switchTopic(t.id, false)}
                            style={{
                              background: isSelected ? 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.3))' : 'rgba(255,255,255,0.04)',
                              border: isSelected ? '1px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.08)',
                              color: isSelected ? '#fff' : 'var(--text-secondary)',
                              borderRadius: '20px',
                              padding: '6px 14px',
                              fontSize: '0.8rem',
                              fontWeight: isSelected ? '700' : '500',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease',
                              boxShadow: isSelected ? '0 0 12px rgba(6, 182, 212, 0.3)' : 'none'
                            }}
                          >
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '30px 0 20px 0' }}>
                    <button 
                      onClick={toggleCall}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)',
                        transition: 'transform 0.2s'
                      }}
                      className="floating-effect"
                    >
                      <Mic size={34} color="#fff" />
                    </button>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>
                        Start Voice Speaking Session
                      </p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', maxWidth: '400px', lineHeight: '1.4' }}>
                        AI will welcome you and ask what you need help with. Speak in English or Hinglish — AI will adapt to your choice!
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                // State: Call active
                <>
                  {/* Topic Pill Bar during Call — allows instant topic switching */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginRight: '4px' }}>
                      Active Topic:
                    </span>
                    {TOPICS.map((t) => {
                      const isSelected = currentTopic === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => switchTopic(t.id, true)}
                          style={{
                            background: isSelected ? 'linear-gradient(135deg, rgba(6,182,212,0.35), rgba(139,92,246,0.35))' : 'rgba(255,255,255,0.03)',
                            border: isSelected ? '1px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.06)',
                            color: isSelected ? '#fff' : 'var(--text-muted)',
                            borderRadius: '16px',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: isSelected ? '700' : '400',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Header card — adapts to conversation vs interview mode */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '16px',
                    borderRadius: '12px',
                    width: '100%'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        color: 'var(--color-accent)',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                      }}>
                        {conversationMode === 'interview' 
                          ? `Question ${liveQuestionIndex + 1} of ${activeQuestions.length}` 
                          : conversationMode === 'conversation' 
                            ? 'Voice Conversation' 
                            : 'Welcome'}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        background: liveInterviewState === 'listening' ? 'rgba(16, 185, 129, 0.15)' : status === 'Speaking...' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.06)',
                        color: liveInterviewState === 'listening' ? '#10b981' : status === 'Speaking...' ? '#8b5cf6' : 'var(--text-muted)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {status === 'Speaking...' ? 'AI Speaking...' : liveInterviewState === 'welcome' ? 'Welcome' : liveInterviewState === 'listening' ? 'Listening' : liveInterviewState === 'evaluating' ? 'Evaluating...' : liveInterviewState === 'speaking_eval' ? 'Feedback' : status === 'Thinking...' ? 'Thinking...' : 'Ready'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: '600', lineHeight: '1.5' }}>
                      {conversationMode === 'interview' 
                        ? activeQuestions[liveQuestionIndex] 
                        : aiResponse || 'Connecting to TalkFlow AI...'}
                    </p>
                    {detectedLang === 'hi' && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-purple)', marginTop: '6px', display: 'block' }}>
                        🗣️ Hinglish Mode Active
                      </span>
                    )}
                  </div>

                  {/* Pulsing Visualizer & Call controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', margin: '16px 0', width: '100%' }}>
                    {/* Mic mute button */}
                    <button
                      onClick={toggleMute}
                      title={isMuted ? "Unmute Mic" : "Mute Mic"}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.06)',
                        border: isMuted ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: isMuted ? '#ef4444' : '#fff',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    {/* Central Pulsing End Call / Speaking Sphere */}
                    <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justify: 'center' }}>
                      <div style={{
                        position: 'absolute',
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: status === 'Speaking...' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(6, 182, 212, 0.08)',
                        border: `1px solid ${status === 'Speaking...' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(6, 182, 212, 0.25)'}`,
                        animation: 'pulse 1.8s infinite ease-in-out',
                        opacity: isMuted ? 0.2 : 1
                      }}></div>
                      <button 
                        onClick={hangUpCall}
                        title="End Call"
                        style={{
                          width: '76px',
                          height: '76px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
                          zIndex: 10
                        }}
                      >
                        <PhoneOff size={24} color="#fff" />
                      </button>
                    </div>

                    {/* Next question (skip) button — only show in interview mode */}
                    {conversationMode === 'interview' && (
                      <button
                        onClick={goToNextQuestion}
                        title="Next Question"
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--color-accent)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <RefreshCw size={20} />
                      </button>
                    )}
                  </div>

                  {/* Speech input preview */}
                  {(liveInterviewState === 'listening' || userSpeech || status === 'Listening...') && (
                    <div style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px dashed rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '0.85rem',
                      width: '100%'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ color: 'var(--color-accent)' }}>
                          {isMuted ? "Microphone Muted" : conversationMode === 'interview' ? "Your Answer (Speaking...):" : "You (Speaking...):"}
                        </strong>
                        {userSpeech.trim() && (
                          <button
                            onClick={submitSpeechNow}
                            style={{
                              background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
                              border: 'none',
                              borderRadius: '16px',
                              padding: '5px 14px',
                              color: '#fff',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <CheckCircle2 size={12} />
                            Done Speaking
                          </button>
                        )}
                      </div>
                      <p style={{ margin: 0, color: isMuted ? 'var(--text-muted)' : '#fff', fontStyle: userSpeech ? 'normal' : 'italic', lineHeight: '1.4' }}>
                        {userSpeech || (conversationMode === 'interview' ? "(Start speaking your answer... Click 'Done Speaking' or pause when finished)" : "(Speak now — ask any question or say 'interview practice shuru karo'...)")}
                      </p>
                    </div>
                  )}

                  {/* Loading visualizer during evaluation or thinking */}
                  {(liveInterviewState === 'evaluating' || status === 'Thinking...') && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      padding: '20px 0',
                      color: 'var(--color-accent)',
                      width: '100%'
                    }}>
                      <Loader2 size={32} className="spin-animate" />
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px' }}>
                        {conversationMode === 'interview' ? 'AI IS EVALUATING YOUR CONCEPT DESCRIPTION...' : 'AI IS THINKING...'}
                      </span>
                    </div>
                  )}

                  {/* Evaluation Scorecard and Gaps feedback — only in interview mode */}
                  {conversationMode === 'interview' && liveEvaluation && (liveInterviewState === 'speaking_eval' || liveInterviewState === 'asking_next' || liveInterviewState === 'eval_ready') && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      padding: '16px',
                      width: '100%'
                    }}>
                      {/* Score badge & header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: `rgba(${liveEvaluation.score >= 80 ? '16, 185, 129' : liveEvaluation.score >= 60 ? '245, 158, 11' : '239, 68, 68'}, 0.1)`,
                          border: `2px solid ${liveEvaluation.score >= 80 ? '#10b981' : liveEvaluation.score >= 60 ? '#f59e0b' : '#ef4444'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          color: liveEvaluation.score >= 80 ? '#10b981' : liveEvaluation.score >= 60 ? '#f59e0b' : '#ef4444',
                          fontSize: '1.1rem'
                        }}>
                          {liveEvaluation.score}
                        </div>
                        <div>
                          <strong style={{ color: '#fff', fontSize: '0.85rem', display: 'block' }}>Concept Grade</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {liveEvaluation.score >= 80 ? 'Perfect conceptual definition!' : liveEvaluation.score >= 60 ? 'Good effort, minor gaps detected.' : 'Need to review core technical definition.'}
                          </span>
                        </div>
                      </div>

                      {/* Gaps/Mistakes (Kamiya) */}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <AlertTriangle size={12} />
                          MISTAKES & MISSED TECHNICAL TERMS
                        </span>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {liveEvaluation.mistakes && liveEvaluation.mistakes.map((mistake, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>{mistake}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Correct Version (Sahi Answer) */}
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.04)',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        borderRadius: '8px',
                        padding: '12px'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <CheckCircle2 size={12} />
                          SAHI ANSWER / CORRECT EXPLANATION
                        </span>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', fontStyle: 'italic' }}>
                          {liveEvaluation.improved_version}
                        </p>
                      </div>

                      {/* Explicit Next Question Button so AI never rushes the candidate */}
                      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
                        <button
                          onClick={goToNextQuestion}
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            borderRadius: '24px',
                            padding: '10px 24px',
                            color: '#fff',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <span>Next Question ({liveQuestionIndex + 1}/{activeQuestions.length})</span>
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: DETAILED EVALUATION MODE */}
          {activeTab === 'evaluate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Topic Selector for Evaluation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginRight: '6px' }}>
                  Topic:
                </span>
                {TOPICS.map((t) => {
                  const isSelected = currentTopic === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => switchTopic(t.id, false)}
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.3))' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.07)',
                        color: isSelected ? '#fff' : 'var(--text-muted)',
                        borderRadius: '16px',
                        padding: '4px 12px',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? '700' : '400',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Question Selection Card */}
              <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 'bold', letterSpacing: '1px' }}>
                    TECHNICAL QUESTION ({questionIndex + 1}/{activeQuestions.length})
                  </span>
                  <button 
                    onClick={cycleQuestion}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <RefreshCw size={12} />
                    Next Question
                  </button>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', lineHeight: '1.5', fontWeight: '600' }}>
                  {activeQuestions[questionIndex] || activeQuestions[0]}
                </h3>
              </div>

              {/* Speech Input / Text Area builder */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    YOUR VERBAL ANSWER
                  </label>
                  {evalStatus !== 'Idle' && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: evalStatus === 'Listening...' ? 'var(--color-accent)' : 'var(--color-purple)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: '600'
                    }}>
                      <span className="live-pulse-dot" style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: evalStatus === 'Listening...' ? 'var(--color-accent)' : 'var(--color-purple)'
                      }}></span>
                      {evalStatus}
                    </div>
                  )}
                </div>

                <textarea
                  value={evalAnswer}
                  onChange={(e) => setEvalAnswer(e.target.value)}
                  placeholder="Click the microphone below and speak clearly, or type your answer directly inside this workspace..."
                  style={{
                    width: '100%',
                    height: '140px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '14px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(6, 182, 212, 0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />

                <div className="eval-actions" style={{ display: 'flex', gap: '12px' }}>
                  {/* Microphone controller */}
                  <button
                    onClick={evalRecording ? stopEvalRecognition : startEvalRecognition}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      background: evalRecording 
                        ? 'linear-gradient(135deg, #ef4444, #b91c1c)' 
                        : 'rgba(255,255,255,0.05)',
                      border: evalRecording ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: evalRecording ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {evalRecording ? (
                      <>
                        <MicOff size={16} />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic size={16} style={{ color: 'var(--color-accent)' }} />
                        Start Speaking
                      </>
                    )}
                  </button>

                  {/* Submit evaluation trigger */}
                  <button
                    onClick={handleEvaluate}
                    disabled={isEvaluating}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: isEvaluating ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(6, 182, 212, 0.2)',
                      transition: 'transform 0.1s'
                    }}
                    onMouseDown={(e) => !isEvaluating && (e.currentTarget.style.transform = 'scale(0.97)')}
                    onMouseUp={(e) => !isEvaluating && (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 size={16} className="spin-animate" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Evaluate Answer
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Evaluation Loading State Overlay */}
              {isEvaluating && (
                <div className="glass-panel" style={{
                  padding: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'rgba(15, 23, 42, 0.35)',
                  backdropFilter: 'blur(8px)',
                  textAlign: 'center'
                }}>
                  <Loader2 size={40} className="spin-animate" style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Analyzing Response</h4>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Evaluating conceptual accuracy, sentence structure, and technical keyword coverage...
                    </p>
                  </div>
                </div>
              )}

              {/* Evaluation Results Card */}
              {evalResult && !isEvaluating && (
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s ease' }}>
                  
                  {/* Score badge & header summary */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '18px' }}>
                    <div style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '50%',
                      background: `radial-gradient(circle, rgba(0,0,0,0.3) 40%, transparent 70%), ${getScoreColor(evalResult.score)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 'bold',
                      color: '#fff',
                      boxShadow: `0 0 20px ${getScoreColor(evalResult.score)}44`,
                      border: '3px solid rgba(255,255,255,0.1)'
                    }}>
                      {evalResult.score}%
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Performance Grade</h4>
                      <span style={{ fontSize: '0.85rem', color: getScoreColor(evalResult.score), fontWeight: '600' }}>
                        {getScoreMessage(evalResult.score)}
                      </span>
                    </div>
                  </div>

                  {/* Strengths List */}
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                      Strengths & Mentions
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {evalResult.strengths.map((str, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Mistakes and Gaps List */}
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                      Mistakes & Missing Elements
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {evalResult.mistakes.map((mis, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{mis}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Refined response playback area */}
                  <div style={{
                    background: 'rgba(0,0,0,0.18)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-purple)', fontWeight: 'bold' }}>
                        REFINED PERFECT RESPONSE
                      </span>
                      
                      {/* Speaker Read aloud button */}
                      <button
                        onClick={() => speakRefinedAnswer(evalResult.improved_version)}
                        style={{
                          background: isSpeakingRefined ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isSpeakingRefined ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: '500'
                        }}
                      >
                        {isSpeakingRefined ? (
                          <>
                            <VolumeX size={12} style={{ color: 'var(--color-purple)' }} />
                            Stop Playing
                          </>
                        ) : (
                          <>
                            <Play size={12} style={{ color: 'var(--color-purple)' }} />
                            Listen Response
                          </>
                        )}
                      </button>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#f1f5f9', lineHeight: '1.6', fontStyle: 'italic' }}>
                      "{evalResult.improved_version}"
                    </p>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* Right Side: Global Settings & Tips Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Universal Voice Synthesis configurations */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
              <Settings size={16} style={{ color: 'var(--color-accent)' }} />
              Voice Settings
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Voice Pitch</span>
                  <span>{voicePitch}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.1" 
                  value={voicePitch} 
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Voice Speed</span>
                  <span>{voiceSpeed}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.6" 
                  max="1.4" 
                  step="0.1" 
                  value={voiceSpeed} 
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Tip Panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={16} style={{ color: 'var(--color-purple)' }} />
              Practice Tips
            </h4>
            
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              lineHeight: '1.6',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {activeTab === 'call' ? (
                <>
                  <li>Click the **Mic** button to start a voice session.</li>
                  <li>AI will **welcome you** and ask what you need help with.</li>
                  <li>Speak in **English or Hinglish** — AI will match your language.</li>
                  <li>Say **"interview practice"** to start a mock Q&A session.</li>
                  <li>Or just **ask any question** — the AI will answer conversationally.</li>
                  <li>AI will **wait for you to finish** before responding.</li>
                </>
              ) : (
                <>
                  <li>Cycle through interview questions using the **Next Question** button.</li>
                  <li>Click **Start Speaking** to begin transcribing your answer. Your speech populates the workspace in real-time.</li>
                  <li>Review the text inside the workspace. You can **manually edit or type** additions using your keyboard!</li>
                  <li>Click **Evaluate Answer** to submit your response to the AI tutor for grade evaluation.</li>
                  <li>Review strengths, mistakes, and click **Listen Response** to hear the perfect refined version read aloud!</li>
                </>
              )}
            </ul>
          </div>

        </div>

      </div>

      {/* visualizer css keyframe animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.3); opacity: 0.05; }
          100% { transform: scale(1); opacity: 0.25; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spin-animate {
          animation: spin 1s linear infinite;
        }
        .live-pulse-dot {
          animation: pulse 1.2s infinite ease-in-out;
        }
      `}</style>

    </div>
  );
}
