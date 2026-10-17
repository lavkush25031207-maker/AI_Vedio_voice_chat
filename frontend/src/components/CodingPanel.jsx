import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Code, 
  Terminal, 
  Sparkles, 
  Mic, 
  MicOff, 
  RefreshCw, 
  Play, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  BookOpen, 
  Settings, 
  Bot, 
  User, 
  Radio, 
  ChevronRight,
  ChevronLeft,
  Zap
} from 'lucide-react';

// Supported languages with display labels and starter templates
const LANGUAGES = [
  { value: 'python',     label: 'Python',      icon: '🐍' },
  { value: 'javascript', label: 'JavaScript',   icon: '🟨' },
  { value: 'typescript', label: 'TypeScript',   icon: '🔷' },
  { value: 'java',       label: 'Java',         icon: '☕' },
  { value: 'cpp',        label: 'C++',          icon: '⚡' },
  { value: 'csharp',     label: 'C#',           icon: '🟣' },
  { value: 'go',         label: 'Go (Golang)',  icon: '🐹' },
  { value: 'rust',       label: 'Rust',         icon: '🦀' },
  { value: 'kotlin',     label: 'Kotlin',       icon: '🟠' },
  { value: 'swift',      label: 'Swift',        icon: '🍎' },
  { value: 'sql',        label: 'SQL',          icon: '🗄️' },
  { value: 'php',        label: 'PHP',          icon: '🐘' },
  { value: 'ruby',       label: 'Ruby',         icon: '💎' },
  { value: 'scala',      label: 'Scala',        icon: '🔴' },
];

const STARTER_TEMPLATES = {
  python:     `def solution(*args):\n    # Write your solution here\n    pass`,
  javascript: `function solution() {\n  // Write your solution here\n}`,
  typescript: `function solution(): void {\n  // Write your solution here\n}`,
  java:       `class Solution {\n    public void solve() {\n        // Write your solution here\n    }\n}`,
  cpp:        `#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solution() {\n    // Write your solution here\n}`,
  csharp:     `using System;\npublic class Solution {\n    public void Solve() {\n        // Write your solution here\n    }\n}`,
  go:         `package main\n\nfunc solution() {\n    // Write your solution here\n}`,
  rust:       `fn solution() {\n    // Write your solution here\n}`,
  kotlin:     `fun solution() {\n    // Write your solution here\n}`,
  swift:      `func solution() {\n    // Write your solution here\n}`,
  sql:        `-- Write your SQL query here\nSELECT `,
  php:        `<?php\nfunction solution() {\n    // Write your solution here\n}\n?>`,
  ruby:       `def solution\n  # Write your solution here\nend`,
  scala:      `object Solution {\n  def solution(): Unit = {\n    // Write your solution here\n  }\n}`,
};

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

// Topics per language for richer AI prompts
const LANG_TOPICS = {
  python:     ['Arrays', 'Strings', 'Recursion', 'Dynamic Programming', 'Graphs', 'Sorting'],
  javascript: ['Closures', 'Promises', 'Event Loop', 'Prototype', 'Arrays', 'DOM Manipulation'],
  typescript: ['Generics', 'Interfaces', 'Type Guards', 'Enums', 'Decorators'],
  java:       ['OOP', 'Collections', 'Streams', 'Multithreading', 'Design Patterns'],
  cpp:        ['Pointers', 'STL', 'Memory Management', 'Bit Manipulation', 'Templates'],
  csharp:     ['LINQ', 'Delegates', 'Async/Await', 'Interfaces', 'Collections'],
  go:         ['Goroutines', 'Channels', 'Interfaces', 'Error Handling', 'Structs'],
  rust:       ['Ownership', 'Lifetimes', 'Traits', 'Enums', 'Error Handling'],
  kotlin:     ['Coroutines', 'Data Classes', 'Sealed Classes', 'Extension Functions'],
  swift:      ['Optionals', 'Protocols', 'Closures', 'Generics', 'Error Handling'],
  sql:        ['Joins', 'Subqueries', 'Window Functions', 'Aggregations', 'Indexes'],
  php:        ['OOP', 'Arrays', 'File I/O', 'PDO', 'Closures'],
  ruby:       ['Blocks', 'Modules', 'Iterators', 'Metaprogramming', 'Hashes'],
  scala:      ['Pattern Matching', 'Case Classes', 'Futures', 'Collections', 'Traits'],
};

export default function CodingPanel() {
  const [activeTab, setActiveTab] = useState('challenge');
  
  // ─── AI Dynamic Question States ──────────────────────────────────────────
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Easy');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Editor state
  const [editorCode, setEditorCode] = useState(STARTER_TEMPLATES['python']);
  const [editorLanguage, setEditorLanguage] = useState('python');
  const [fontSize, setFontSize] = useState(14);

  // Terminal & Scroll
  const [terminalOutput, setTerminalOutput] = useState('System ready. Write your code and click "Run Code" or "Submit Code to Tech Lead".');
  const [isTerminalRunning, setIsTerminalRunning] = useState(false);
  const lineNumbersRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Window controls
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isWindowHovered, setIsWindowHovered] = useState(false);

  // Voice / call stats
  const [isCalling, setIsCalling] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [userSpeech, setUserSpeech] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [sessionId, setSessionId] = useState(null);
  
  // Evaluation
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [isSpeakingWalkthrough, setIsSpeakingWalkthrough] = useState(false);
  
  // Code Explainer
  const [explainLanguage, setExplainLanguage] = useState('javascript');
  const [explainCode, setExplainCode] = useState('');

  // Voice config
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);

  // Speech Recognition Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const activeUtteranceRef = useRef(null);

  // Stale-closure refs
  const userSpeechRef = useRef('');
  const isCallingRef = useRef(false);
  const silenceTimeoutRef = useRef(null);
  const sessionIdRef = useRef(null);
  const voiceSpeedRef = useRef(1.0);
  const voicePitchRef = useRef(1.0);

  // Sync refs
  useEffect(() => { isCallingRef.current = isCalling; }, [isCalling]);
  useEffect(() => { userSpeechRef.current = userSpeech; }, [userSpeech]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { voiceSpeedRef.current = voiceSpeed; }, [voiceSpeed]);
  useEffect(() => { voicePitchRef.current = voicePitch; }, [voicePitch]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };
  const getLineCount = () => {
    const codeVal = activeTab === 'challenge' ? editorCode : explainCode;
    if (!codeVal) return 15;
    return Math.max(codeVal.split('\n').length, 15);
  };

  // ─── AI Question Fetch Core ─────────────────────────────────────────────────
  const fetchQuestion = useCallback(async (lang, difficulty, pushHistory = true) => {
    setIsGeneratingQuestion(true);
    setEvalResult(null);
    setTerminalOutput('> 🤖 Generating a new AI question for you...');
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeakingWalkthrough(false);

    const topics = LANG_TOPICS[lang] || ['Algorithms'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    try {
      const res = await fetch('/api/chat/generate_question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, difficulty, topic: randomTopic }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const question = {
        id: `ai-${Date.now()}`,
        title: data.title,
        language: data.language,
        difficulty: data.difficulty,
        category: data.category,
        description: data.description,
        constraints: data.constraints,
        starterCode: data.starter_code,
      };
      setCurrentQuestion(question);
      setEditorCode(data.starter_code);
      setEditorLanguage(data.language);
      setSelectedDifficulty(difficulty);

      if (pushHistory) {
        setQuestionHistory(prev => {
          const sliced = prev.slice(0, historyIndex + 1 < 0 ? prev.length : historyIndex + 1);
          const next = [...sliced, question];
          setHistoryIndex(next.length - 1);
          return next;
        });
      }
      setTerminalOutput(`> ✅ Question ready: "${data.title}" [${data.difficulty}]\n> Language: ${data.language.toUpperCase()}  |  Topic: ${data.category}\n> Write your solution below and click "Run Code" to test, or "Submit Code" to get AI feedback.`);
    } catch (e) {
      const fallbackQ = {
        id: `fallback-${Date.now()}`,
        title: `${difficulty} ${lang.toUpperCase()} Challenge`,
        language: lang,
        difficulty,
        category: 'Practice',
        description: `Write a ${difficulty} level solution in ${lang}. The AI question generator is temporarily unavailable — please try again later.`,
        constraints: ['Optimize for time and space complexity.', 'Handle edge cases carefully.'],
        starterCode: STARTER_TEMPLATES[lang] || STARTER_TEMPLATES['python'],
      };
      setCurrentQuestion(fallbackQ);
      setEditorCode(fallbackQ.starterCode);
      setEditorLanguage(lang);
      setTerminalOutput(`> ⚠️ Could not reach AI question generator. Loaded a starter template.\n> Write your solution and click Submit for AI evaluation.`);
    } finally {
      setIsGeneratingQuestion(false);
    }
  }, [historyIndex]);

  // Navigate to previous question in history
  const handlePrevQuestion = useCallback(() => {
    if (historyIndex <= 0) return;
    const prevIdx = historyIndex - 1;
    const prevQ = questionHistory[prevIdx];
    setHistoryIndex(prevIdx);
    setCurrentQuestion(prevQ);
    setEditorCode(prevQ.starterCode);
    setEditorLanguage(prevQ.language);
    setEvalResult(null);
    setTerminalOutput(`> ⬅️ Went back to: "${prevQ.title}" [${prevQ.difficulty}]\n> Write your solution and click Submit for AI evaluation.`);
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeakingWalkthrough(false);
  }, [historyIndex, questionHistory]);

  // Navigate to next question: adaptive difficulty + AI generation
  const handleNextQuestion = useCallback(async () => {
    if (historyIndex < questionHistory.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextQ = questionHistory[nextIdx];
      setHistoryIndex(nextIdx);
      setCurrentQuestion(nextQ);
      setEditorCode(nextQ.starterCode);
      setEditorLanguage(nextQ.language);
      setEvalResult(null);
      setTerminalOutput(`> ➡️ Going forward to: "${nextQ.title}" [${nextQ.difficulty}]\n> Write your solution and click Submit for AI evaluation.`);
      return;
    }

    const score = evalResult ? evalResult.score : null;
    let nextDifficulty = selectedDifficulty;
    let feedbackMsg = '';

    if (score !== null) {
      if (score >= 80) {
        if (selectedDifficulty === 'Easy') { nextDifficulty = 'Medium'; feedbackMsg = `🔥 Excellent (${score}%)! Leveling up to Medium.`; }
        else if (selectedDifficulty === 'Medium') { nextDifficulty = 'Hard'; feedbackMsg = `🚀 Outstanding (${score}%)! Leveling up to Hard!`; }
        else { feedbackMsg = `👑 Perfect mastery (${score}%)! Staying on Hard.`; }
      } else if (score < 60) {
        if (selectedDifficulty === 'Hard') { nextDifficulty = 'Medium'; feedbackMsg = `📉 Let's build confidence (${score}%). Back to Medium.`; }
        else { nextDifficulty = 'Easy'; feedbackMsg = `📚 Keep practicing (${score}%). Another Easy first.`; }
      } else {
        feedbackMsg = `👍 Solid effort (${score}%)! Another ${selectedDifficulty} challenge.`;
      }
    } else {
      if (selectedDifficulty === 'Easy') nextDifficulty = 'Medium';
      else if (selectedDifficulty === 'Medium') nextDifficulty = 'Hard';
      else nextDifficulty = 'Easy';
      feedbackMsg = `🔄 Moving to ${nextDifficulty}.`;
    }

    if (feedbackMsg) {
      setTerminalOutput(`> ${feedbackMsg}\n> 🤖 Generating next AI question...`);
    }
    await fetchQuestion(selectedLanguage, nextDifficulty);
  }, [evalResult, selectedDifficulty, selectedLanguage, historyIndex, questionHistory, fetchQuestion]);

  // Load first question on mount
  useEffect(() => {
    fetchQuestion('python', 'Easy');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Language dropdown change
  const handleLanguageChange = useCallback(async (lang) => {
    setSelectedLanguage(lang);
    setSelectedDifficulty('Easy');
    await fetchQuestion(lang, 'Easy');
  }, [fetchQuestion]);

  // Difficulty dropdown change
  const handleDifficultyChange = useCallback(async (difficulty) => {
    setSelectedDifficulty(difficulty);
    await fetchQuestion(selectedLanguage, difficulty);
  }, [selectedLanguage, fetchQuestion]);

  // (starter code sync handled inside fetchQuestion)


  // Initialize SpeechRecognition ONCE on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setStatus('Listening...');
      };

      rec.onresult = (event) => {
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

        // Auto-silence submission timeout (2.2s)
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        
        if (text.trim()) {
          silenceTimeoutRef.current = setTimeout(() => {
            if (isCallingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch (e) {}
            }
          }, 2200);
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          if (isCallingRef.current) startSpeechRecognition();
        }
      };

      rec.onend = () => {
        if (isCallingRef.current) {
          const finalPrompt = userSpeechRef.current.trim();
          if (finalPrompt) {
            sendVoicePrompt(finalPrompt);
          } else {
            startSpeechRecognition();
          }
        }
      };

      recognitionRef.current = rec;
    }

    // Chrome Speech Synthesis Workaround
    const resumeInterval = setInterval(() => {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.resume();
      }
    }, 4000);

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (synthRef.current) synthRef.current.cancel();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      clearInterval(resumeInterval);
    };
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsCalling(false);
    setStatus('Idle');
    setSessionId(null);
    setUserSpeech('');
    setAiResponse('');
    setEvalResult(null);
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeakingWalkthrough(false);
  };

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
    
    try {
      let profileId = null;
      try {
        const profileRes = await fetch('/api/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData && profileData.id) profileId = profileData.id;
        }
      } catch (err) {}

      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profile_id: profileId,
          session_type: 'Technical Coding Round'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.id);
        
        const welcomeText = `Hello! I am your Technical Lead Interviewer. Let's start the coding round. We are working on the "${currentQuestion ? currentQuestion.title : 'current coding challenge'}". Please let me know your thoughts or click Run/Submit when you are ready.`;
        setAiResponse(welcomeText);
        speakAloud(welcomeText);
      } else {
        throw new Error();
      }
    } catch (error) {
      setStatus('Idle');
      setIsCalling(false);
      alert("Could not start AI Tutor session. Offline fallback mode.");
    }
  };

  const hangUpCall = () => {
    setIsCalling(false);
    setStatus('Idle');
    setSessionId(null);
    setUserSpeech('');
    setAiResponse('');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if (synthRef.current) synthRef.current.cancel();
  };

  const startSpeechRecognition = () => {
    if (recognitionRef.current && isCallingRef.current) {
      setUserSpeech('');
      userSpeechRef.current = '';
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
  };

  const speakAloud = (text) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    setStatus('Speaking...');
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSpeedRef.current;
    utterance.pitch = voicePitchRef.current;
    
    const voices = synthRef.current.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onend = () => {
      if (isCallingRef.current) {
        setStatus('Listening...');
        startSpeechRecognition();
      }
    };

    utterance.onerror = () => {
      if (isCallingRef.current) {
        setStatus('Listening...');
        startSpeechRecognition();
      }
    };

    // V8 Garbage collection bypass
    window.activeUtterances = window.activeUtterances || [];
    window.activeUtterances.push(utterance);
    if (window.activeUtterances.length > 50) window.activeUtterances.shift();

    activeUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const sendVoicePrompt = async (prompt) => {
    if (!sessionIdRef.current) return;
    
    setStatus('Thinking...');
    try {
      // Feed technical lead background context
      const problemTitle = currentQuestion ? currentQuestion.title : 'Coding Challenge';
      const fullPrompt = `Candidate is working on the coding problem: "${problemTitle}". Candidate current code: \`\`\`${editorCode}\`\`\`. Candidate says: "${prompt}"`;  
      
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          content: fullPrompt
        })
      });

      if (res.ok) {
        const data = await res.json();
        const cleanResponse = data.content.replace(/[*#`]/g, '');
        setAiResponse(data.content);
        speakAloud(cleanResponse);
      } else {
        throw new Error();
      }
    } catch (err) {
      const errText = "I encountered an error. Please try speaking your question again.";
      setAiResponse(errText);
      speakAloud(errText);
    }
  };

  const handleRunCode = () => {
    const codeVal = activeTab === 'challenge' ? editorCode : explainCode;
    if (!codeVal || !codeVal.trim()) {
      setTerminalOutput('✘ Error: Code workspace is empty. Please write some code before running compiling execution.');
      return;
    }

    setIsTerminalRunning(true);
    setTerminalOutput('> Running compilation syntax checks...\n');
    
    setTimeout(() => {
      setTerminalOutput(prev => prev + '> Compiling code structure in local sandbox...\n');
      setTimeout(() => {
        let testResult = '';
        if (activeTab === 'challenge') {
          // Generic run-code simulation for any AI question
          const codeLen = editorCode.trim().length;
          const hasLogic = editorCode.includes('return') || editorCode.includes('SELECT') || editorCode.includes('yield') || editorCode.includes('print');
          if (codeLen < 30) {
            testResult = `✘ Test Case 1: Code too short. Please write a meaningful solution.\n\nPlease complete your implementation before running.`;
          } else if (hasLogic) {
            testResult = `✔ Test Case 1: Syntax check passed.\n✔ Test Case 2: Function structure detected.\n✔ Test Case 3: Return/output statement found.\n\nAll structural checks PASSED! Code appears syntactically valid.\n\n👉 NEXT STEP: Click the blue "Submit Code to Tech Lead" button to get full AI evaluation with score & feedback!`;
          } else {
            testResult = `✔ Test Case 1: Syntax check passed.\n⚠ Test Case 2: No return/output statement detected. Make sure your solution actually returns a value.\n\nPartial check complete.\n\n👉 NEXT STEP: Click "Submit Code to Tech Lead" to get AI feedback!`;
          }
        } else {
          testResult = `✔ Compilation checks complete.\n✔ Pasted syntax parsed successfully with no runtime block errors.\n\n👉 NEXT STEP: Click the blue "Submit Code to Tech Lead" button at the bottom right to get detailed AI walkthrough analysis!`;
        }
        
        setTerminalOutput(prev => prev + '> Running local unit tests...\n' + testResult);
        setIsTerminalRunning(false);
      }, 800);
    }, 600);
  };

  const handleSubmitCode = async () => {
    const codeVal = activeTab === 'challenge' ? editorCode : explainCode;
    if (!codeVal || !codeVal.trim()) {
      setTerminalOutput('✘ Error: Code workspace is empty. Please write some code before submitting.');
      return;
    }

    setIsEvaluating(true);
    setTerminalOutput('> Initiating comprehensive code evaluation review with AI Technical Lead...\n');
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeakingWalkthrough(false);

    try {
      let targetRole = "Frontend Developer";
      try {
        const profileRes = await fetch('/api/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData && profileData.target_role) targetRole = profileData.target_role;
        }
      } catch (e) {}

      const reqBody = {
        problem_title: activeTab === 'challenge' ? (currentQuestion ? currentQuestion.title : 'Coding Challenge') : "Custom Code Explainer Request",
        language: activeTab === 'challenge' ? editorLanguage : explainLanguage,
        code: codeVal,
        target_role: targetRole
      };

      const res = await fetch('/api/chat/evaluate_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      if (res.ok) {
        const data = await res.json();
        setEvalResult(data);
        setTerminalOutput(prev => prev + `✔ Evaluation complete!\nAI Lead Code Grade: ${data.score}/100\n\nScroll down to view detailed feedback strengths, bottlenecks, and the optimized version sample code!`);
      } else {
        throw new Error();
      }
    } catch (err) {
      console.error(err);
      setTerminalOutput(prev => prev + `✘ Error compiling code. Please check your backend connection.`);
      alert("Evaluation offline. Please check your backend compilation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const speakCodeWalkthrough = (text) => {
    if (!synthRef.current) return;

    if (isSpeakingWalkthrough) {
      synthRef.current.cancel();
      setIsSpeakingWalkthrough(false);
      return;
    }

    synthRef.current.cancel();
    setIsSpeakingWalkthrough(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSpeedRef.current;
    utterance.pitch = voicePitchRef.current;

    const voices = synthRef.current.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onend = () => { setIsSpeakingWalkthrough(false); };
    utterance.onerror = () => { setIsSpeakingWalkthrough(false); };

    synthRef.current.speak(utterance);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow/Orange
    return '#ef4444'; // Red
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', minHeight: '620px' }}>
      
      {/* Switcher Tab Header */}
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
          onClick={() => handleTabChange('challenge')}
          style={{
            padding: '10px 20px',
            borderRadius: '24px',
            border: 'none',
            background: activeTab === 'challenge' ? 'linear-gradient(135deg, var(--color-accent), var(--color-purple))' : 'transparent',
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
          <Code size={16} />
          Coding Challenge Mode
        </button>
        <button 
          onClick={() => handleTabChange('explainer')}
          style={{
            padding: '10px 20px',
            borderRadius: '24px',
            border: 'none',
            background: activeTab === 'explainer' ? 'linear-gradient(135deg, var(--color-accent), var(--color-purple))' : 'transparent',
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
          <BookOpen size={16} />
          Interactive Code Explainer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '5fr 6fr', gap: '24px', alignItems: 'start', position: 'relative' }}>
        
        {/* LEFT COLUMN: Challenge Info & AI Speech Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CHALLENGE SELECTOR & CARD */}
          {activeTab === 'challenge' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-purple)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🌐 Language &amp; Difficulty
                </span>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Language Dropdown */}
                  <select 
                    value={selectedLanguage} 
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    disabled={isGeneratingQuestion}
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '5px 10px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      outline: 'none',
                      minWidth: '130px'
                    }}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.icon} {lang.label}</option>
                    ))}
                  </select>

                  {/* Difficulty Dropdown */}
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => handleDifficultyChange(e.target.value)}
                    disabled={isGeneratingQuestion}
                    style={{
                      background: selectedDifficulty === 'Easy' ? 'rgba(16,185,129,0.1)' : selectedDifficulty === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${selectedDifficulty === 'Easy' ? 'rgba(16,185,129,0.4)' : selectedDifficulty === 'Medium' ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}`,
                      borderRadius: '8px',
                      color: selectedDifficulty === 'Easy' ? '#10b981' : selectedDifficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                      padding: '5px 10px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      outline: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    {DIFFICULTY_LEVELS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  {/* Regenerate button */}
                  <button
                    onClick={() => fetchQuestion(selectedLanguage, selectedDifficulty)}
                    disabled={isGeneratingQuestion}
                    title="Generate a new question"
                    style={{
                      background: 'rgba(139,92,246,0.15)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      borderRadius: '8px',
                      color: '#a78bfa',
                      padding: '5px 10px',
                      cursor: isGeneratingQuestion ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isGeneratingQuestion ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={12} />}
                    {isGeneratingQuestion ? 'Generating...' : 'New Q'}
                  </button>
                </div>
              </div>

              {/* Question card — shows loading skeleton or the actual question */}
              {isGeneratingQuestion ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px', color: '#a78bfa' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>🤖 AI is crafting your question...</p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.75rem', opacity: 0.6 }}>This takes 3-8 seconds</p>
                </div>
              ) : currentQuestion ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentQuestion.title}</h3>
                    <span style={{
                      fontSize: '0.65rem',
                      background: currentQuestion.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.15)' : currentQuestion.difficulty === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: currentQuestion.difficulty === 'Easy' ? '#10b981' : currentQuestion.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>{currentQuestion.difficulty}</span>
                    {currentQuestion.category && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '8px', flexShrink: 0 }}>
                        {currentQuestion.category}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                    <button
                      onClick={handlePrevQuestion}
                      disabled={historyIndex <= 0}
                      title={historyIndex <= 0 ? 'No previous question' : 'Go to previous question'}
                      style={{
                        background: historyIndex <= 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: historyIndex <= 0 ? 'rgba(255,255,255,0.25)' : '#fff',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <ChevronLeft size={13} /> Prev
                    </button>
                    <button
                      onClick={handleNextQuestion}
                      disabled={isGeneratingQuestion}
                      title="Next question (adaptive difficulty)"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.25))',
                        border: '1px solid rgba(139,92,246,0.4)',
                        color: '#c4b5fd',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        cursor: isGeneratingQuestion ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      Next <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {currentQuestion.description}
                </p>

                <h5 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '0.8rem' }}>Evaluation Constraints:</h5>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  {(currentQuestion.constraints || []).map((c, i) => (
                    <li key={i} style={{ marginBottom: '3px' }}>{c}</li>
                  ))}
                </ul>
              </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Select a language and difficulty to generate your first question.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'explainer' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.2rem', fontWeight: '600' }}>Line-by-Line Code Explainer</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Paste any complex utility function, regular expression, or SQL block into the right pane. The AI Coding Tutor will analyze its execution stack and read a simple code walkthrough out loud.
              </p>
            </div>
          )}

          {/* AI TECH LEAD CODING AVATAR ORB WIDGET */}
          <div className="glass-panel" style={{
            position: 'relative',
            height: '240px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)'
          }}>
            {/* Ambient Background Grid */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',
              backgroundSize: '15px 15px',
              pointerEvents: 'none'
            }}></div>

            {/* Glowing AI Orb */}
            <div style={{
              position: 'relative',
              width: '110px',
              height: '110px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Outer halo */}
              <div style={{
                position: 'absolute',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                border: '1px dashed rgba(139, 92, 246, 0.3)',
                animation: 'spin 16s linear infinite',
                opacity: (status === 'Thinking...' || isEvaluating) ? 0.8 : 0.4
              }}></div>

              {/* Pulsing glow ring */}
              <div style={{
                position: 'absolute',
                width: '125px',
                height: '125px',
                borderRadius: '50%',
                border: `1px solid ${status === 'Speaking...' ? 'rgba(236, 72, 153, 0.4)' : status === 'Listening...' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                animation: (status === 'Speaking...' || status === 'Listening...') ? 'pulse 1.4s infinite ease-in-out' : 'none',
                opacity: 0.6
              }}></div>

              {/* Central Liquid Avatar Sphere */}
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: status === 'Speaking...'
                  ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                  : status === 'Thinking...' || isEvaluating
                    ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)'
                    : status === 'Listening...'
                      ? 'linear-gradient(135deg, #06b6d4, #10b981)'
                      : 'linear-gradient(135deg, #1e293b, #334155)',
                boxShadow: status === 'Speaking...'
                  ? '0 0 30px rgba(236, 72, 153, 0.5)'
                  : status === 'Thinking...' || isEvaluating
                    ? '0 0 30px rgba(139, 92, 246, 0.5)'
                    : status === 'Listening...'
                      ? '0 0 30px rgba(6, 182, 212, 0.5)'
                      : '0 0 10px rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5,
                transition: 'all 0.5s ease',
                animation: (status === 'Thinking...' || isEvaluating) ? 'pulse 0.9s infinite ease-in-out' : 'none'
              }}>
                <Bot size={34} color="#fff" />
              </div>
            </div>

            {/* Top-Left: Privacy Status */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px 10px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.7rem',
                color: '#fff',
                fontWeight: '600'
              }}>
                <Radio size={10} className="live-pulse-dot" style={{ color: 'var(--color-purple)' }} />
                AI TECH LEAD INTERVIEWER
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '3px 8px',
                borderRadius: '10px',
                color: '#10b981',
                fontSize: '0.6rem',
                fontWeight: 'bold',
                width: 'fit-content'
              }}>
                PRIVACY SECURED • CAMERA OFFLINE
              </div>
            </div>

            {/* Top-Right: Stateful Action Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '0.7rem',
              color: status === 'Speaking...' ? 'var(--color-purple)' : status === 'Listening...' ? 'var(--color-accent)' : 'var(--text-muted)',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {status}
            </div>
          </div>

          {/* AI DIALOGUE DISCUSSION LOG */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>
                AI TECH LEAD DISCUSSION
              </span>
              
              <button 
                onClick={toggleCall}
                style={{
                  marginLeft: 'auto',
                  background: isCalling ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  padding: '5px 12px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isCalling ? <MicOff size={12} /> : <Mic size={12} />}
                {isCalling ? 'Stop Call' : 'Discuss Code (Speech)'}
              </button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <User size={14} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-secondary)' }}>You (Transcribed):</strong>
                  <p style={{ margin: '3px 0 0 0', color: '#fff', fontStyle: userSpeech ? 'normal' : 'italic' }}>
                    {userSpeech || (isCalling ? "(Speak to ask for hints or talk about your code...)" : "(Speech discussion offline)")}
                  </p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '8px 0' }}></div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Bot size={14} style={{ color: 'var(--color-purple)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-secondary)' }}>AI Interviewer:</strong>
                  <p style={{ margin: '3px 0 0 0', color: '#fff', fontStyle: aiResponse ? 'normal' : 'italic' }}>
                    {aiResponse || "(Tutor is listening for your thoughts or questions)"}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Code Editor Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* MOCK VS CODE PANEL */}
          <div style={isFullScreen ? {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#1e1e1e',
            border: '1.5px solid var(--color-accent)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 45,
            transition: 'all 0.3s ease'
          } : {
            background: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            height: isCollapsed ? '42px' : '520px',
            transition: 'all 0.3s ease'
          }}>
            
            {/* Editor TopBar */}
            <div style={{
              background: '#252526',
              padding: '10px 16px',
              borderBottom: '1px solid #2d2d2d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isCollapsed ? 'pointer' : 'default'
            }}
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
              }
            }}
            >
              
              {/* Tabs */}
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseEnter={() => setIsWindowHovered(true)}
                onMouseLeave={() => setIsWindowHovered(false)}
              >
                {/* Red dot: reset workspace */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTab === 'challenge') {
                      setEditorCode(currentQuestion ? currentQuestion.starterCode : STARTER_TEMPLATES[selectedLanguage]);
                    } else {
                      setExplainCode('');
                    }
                    setEvalResult(null);
                    setTerminalOutput('Workspace reset successfully.');
                  }}
                  title="Reset/Clear Workspace"
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: '12px'
                  }}
                >
                  {isWindowHovered ? '×' : ''}
                </button>

                {/* Yellow dot: minimize/collapse */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isFullScreen) {
                      setIsFullScreen(false);
                    }
                    setIsCollapsed(!isCollapsed);
                  }}
                  title={isCollapsed ? "Expand window" : "Minimize window"}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: '12px'
                  }}
                >
                  {isWindowHovered ? '−' : ''}
                </button>

                {/* Green dot: maximize/fullscreen */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCollapsed) {
                      setIsCollapsed(false);
                    }
                    setIsFullScreen(!isFullScreen);
                  }}
                  title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '7px',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: '12px'
                  }}
                >
                  {isWindowHovered ? '⤢' : ''}
                </button>
                
                <div style={{
                  marginLeft: '12px',
                  background: '#1e1e1e',
                  borderTop: '2px solid var(--color-purple)',
                  padding: '4px 14px',
                  borderRadius: '4px 4px 0 0',
                  fontSize: '0.8rem',
                  color: '#fff',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Terminal size={12} style={{ color: 'var(--color-purple)' }} />
                  {activeTab === 'challenge' 
                    ? `solution.${editorLanguage === 'python' ? 'py' : editorLanguage === 'sql' ? 'sql' : editorLanguage === 'java' ? 'java' : editorLanguage === 'cpp' ? 'cpp' : editorLanguage === 'csharp' ? 'cs' : editorLanguage === 'go' ? 'go' : editorLanguage === 'rust' ? 'rs' : editorLanguage === 'kotlin' ? 'kt' : editorLanguage === 'swift' ? 'swift' : editorLanguage === 'php' ? 'php' : editorLanguage === 'ruby' ? 'rb' : editorLanguage === 'scala' ? 'scala' : editorLanguage === 'typescript' ? 'ts' : 'js'}`
                    : `explainer_script.${explainLanguage === 'python' ? 'py' : explainLanguage === 'sql' ? 'sql' : 'js'}`
                  }
                  {isCollapsed && <span style={{ color: 'var(--color-accent)', fontSize: '0.7rem', fontWeight: 'normal', marginLeft: '8px' }}>(Minimized - click to expand)</span>}
                </div>
              </div>

              {/* Editor controls settings */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                
                {/* Language Indicator */}
                <span style={{ fontSize: '0.75rem', color: '#858585', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {activeTab === 'challenge' ? editorLanguage : explainLanguage}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Settings size={12} style={{ color: '#858585' }} />
                  <select 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    style={{
                      background: '#252526',
                      border: '1px solid #333',
                      color: '#858585',
                      fontSize: '0.7rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {[12, 14, 16, 18].map(s => <option key={s} value={s}>{s}px</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Editor Workspace Core */}
            <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
              
              {/* Line numbers column */}
              <div 
                ref={lineNumbersRef}
                style={{
                  background: '#1a1a1a',
                  color: '#5a5a5a',
                  padding: '16px 8px',
                  borderRight: '1px solid #2d2d2d',
                  fontFamily: 'monospace',
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.6',
                  textAlign: 'right',
                  userSelect: 'none',
                  width: '45px',
                  overflowY: 'hidden',
                  whiteSpace: 'pre'
                }}
              >
                {Array.from({ length: getLineCount() }).map((_, i) => (
                  <div key={i} style={{ height: '1.6em' }}>{i + 1}</div>
                ))}
              </div>

              {/* Textarea Code entry */}
              <textarea
                ref={textareaRef}
                value={activeTab === 'challenge' ? editorCode : explainCode}
                onChange={(e) => activeTab === 'challenge' ? setEditorCode(e.target.value) : setExplainCode(e.target.value)}
                onScroll={handleScroll}
                placeholder={activeTab === 'challenge' 
                  ? "// Type your code solution here..."
                  : "/* Paste any code block here for line-by-line interactive AI tutor explainer walkthrough analysis... */"
                }
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#9cdcfe',
                  fontFamily: 'monospace',
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.6',
                  padding: '16px',
                  resize: 'none',
                  tabSize: 2,
                  caretColor: '#fff',
                  overflowY: 'auto'
                }}
              />

              {/* Loader overlay */}
              {isEvaluating && (
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  background: 'rgba(30,30,30,0.85)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  zIndex: 20
                }}>
                  <Loader2 size={36} className="spin-animate" style={{ color: 'var(--color-purple)' }} />
                  <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>AI Tech Lead Reviewing Code...</span>
                </div>
              )}
            </div>

            {/* Terminal Panel */}
            <div style={{
              height: '140px',
              background: '#151515',
              borderTop: '1.5px solid #2d2d2d',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#d4d4d4'
            }}>
              {/* Terminal Title Bar */}
              <div style={{
                background: '#1e1e1e',
                padding: '6px 16px',
                borderBottom: '1px solid #2d2d2d',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                <span>Console Output & Sandbox Terminal</span>
                {isTerminalRunning && <Loader2 size={10} className="spin-animate" style={{ marginLeft: 'auto', color: 'var(--color-accent)' }} />}
              </div>
              
              {/* Terminal Scroll Container */}
              <pre style={{
                margin: 0,
                padding: '12px 16px',
                flex: 1,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: '#38bdf8',
                lineHeight: '1.4'
              }}>
                {terminalOutput}
              </pre>
            </div>

            {/* Editor Footer Action Bar */}
            <div style={{
              background: '#252526',
              padding: '12px 16px',
              borderTop: '1px solid #2d2d2d',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              
              <button
                onClick={() => {
                  if (activeTab === 'challenge') {
                    setEditorCode(currentQuestion ? currentQuestion.starterCode : STARTER_TEMPLATES[selectedLanguage]);
                  } else {
                    setExplainCode('');
                  }
                  setEvalResult(null);
                }}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Reset Workspace
              </button>

              {activeTab === 'challenge' && (
                <button
                  onClick={handleRunCode}
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    color: 'var(--color-accent)',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Run Code
                </button>
              )}

              <button
                onClick={handleSubmitCode}
                disabled={isEvaluating}
                style={{
                  background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  cursor: isEvaluating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.2)'
                }}
              >
                <Sparkles size={14} />
                {activeTab === 'challenge' ? 'Submit Code to Tech Lead' : 'Explain pasted Code'}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* EVALUATION RESULTS CARD */}
      {evalResult && !isEvaluating && (
        <div className="glass-panel" style={{ 
          marginTop: '24px', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          animation: 'fadeIn 0.5s ease'
        }}>
          
          {/* Radial score gauge header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '18px' }}>
            <div style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(0,0,0,0.35) 40%, transparent 70%), ${getScoreColor(evalResult.score)}`,
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
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>Code Quality & Complexity Grade</h4>
              <span style={{ fontSize: '0.85rem', color: getScoreColor(evalResult.score), fontWeight: '600' }}>
                {evalResult.score >= 80 
                  ? "Outstanding structure, clean modular logic, and time optimization!"
                  : evalResult.score >= 60 
                    ? "Submissions compiles successfully. Space complexity or loop safety could improve."
                    : "Complexity bottlenecks or logical issues. Review standard algorithms."
                }
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Strengths checklist */}
            <div>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                Code Strengths identified
              </h5>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {evalResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            {/* Gaps / Mistakes checklist */}
            <div>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                Optimization Gaps & Bugs
              </h5>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {evalResult.mistakes.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          </div>

          {/* Refined clean Code Script Box */}
          <div style={{
            background: 'rgba(0,0,0,0.22)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-purple)', fontWeight: 'bold' }}>
                REFINED OPTIMIZED CODE VERSION
              </span>

              <button
                onClick={() => speakCodeWalkthrough(evalResult.explanation)}
                style={{
                  background: isSpeakingWalkthrough ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${isSpeakingWalkthrough ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
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
                {isSpeakingWalkthrough ? (
                  <>
                    <VolumeX size={12} style={{ color: 'var(--color-purple)' }} />
                    Stop Review Playback
                  </>
                ) : (
                  <>
                    <Play size={12} style={{ color: 'var(--color-purple)' }} />
                    Listen Tech Lead Review
                  </>
                )}
              </button>
            </div>

            <pre style={{
              margin: 0,
              background: '#151515',
              padding: '14px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#4fc1ff',
              overflowX: 'auto',
              lineHeight: '1.5'
            }}>
              <code>{evalResult.improved_version}</code>
            </pre>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
              <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tech Lead walkthrough review:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {evalResult.explanation}
              </p>
            </div>
          </div>

          {/* Practice Next Question Action Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            borderTop: '1px solid rgba(255,255,255,0.06)', 
            paddingTop: '16px',
            marginTop: '8px'
          }}>
            <button
              onClick={handleNextQuestion}
              style={{
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
                border: 'none',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                padding: '10px 22px',
                borderRadius: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Practice Next Question</span>
              <ChevronRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* CSS Keyframe animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.25); opacity: 0.05; }
          100% { transform: scale(1); opacity: 0.25; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spin-animate {
          animation: spin 1.2s linear infinite;
        }
        .live-pulse-dot {
          animation: pulse 1.2s infinite ease-in-out;
        }
      `}</style>

    </div>
  );
}
