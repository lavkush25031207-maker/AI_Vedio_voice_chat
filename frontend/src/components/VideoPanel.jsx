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
  VolumeX,
  Video,
  VideoOff,
  Radio,
  Eye,
  Pause
} from 'lucide-react';

import interviewerClosed from './interviewer_closed.png';
import interviewerOpen from './interviewer_open.png';

import { QUESTION_BANKS, TOPICS, detectTopic, detectHinglish } from './VoicePanel';

export default function VideoPanel() {
  const [activeTab, setActiveTab] = useState('call'); // 'call' or 'evaluate'
  
  // Call mode states
  const [isCalling, setIsCalling] = useState(false);
  const [status, setStatus] = useState('Idle'); // 'Idle', 'Connecting...', 'Listening...', 'Thinking...', 'Speaking...'
  const [userSpeech, setUserSpeech] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [callError, setCallError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraPaused, setIsCameraPaused] = useState(false);

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
        ? `Humne topic ${tLabel} switch kar diya hai. Kya aap iska video interview practice karna chahte hain?`
        : `Switched topic to ${tLabel}. Would you like to practice video interview questions for it?`;
      setAiResponse(switchText);
      speakAloud(switchText);
    }
  };

  // Live Interview State Machine
  const [liveQuestionIndex, setLiveQuestionIndex] = useState(0);
  const [liveInterviewState, setLiveInterviewState] = useState('idle'); // 'idle', 'welcome', 'listening', 'evaluating', 'speaking_eval', 'eval_ready', 'asking_next'
  const [liveEvaluation, setLiveEvaluation] = useState(null);

  const isMutedRef = useRef(false);
  const isCameraPausedRef = useRef(false);
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
  const [evalStatus, setEvalStatus] = useState('Idle'); 
  const [evalResult, setEvalResult] = useState(null); 
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSpeakingRefined, setIsSpeakingRefined] = useState(false);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const localVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);

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

  // Sync ref to avoid stale closures in callbacks/effects
  useEffect(() => {
    cameraStreamRef.current = cameraStream;
  }, [cameraStream]);

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
    isCameraPausedRef.current = isCameraPaused;
  }, [isCameraPaused]);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: "user" }, 
        audio: false 
      });
      setCameraStream(stream);
      setIsCameraOn(true);
      
      // Delay slightly to ensure video element is mounted in DOM
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setIsCameraOn(false);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const [avatarMouthOpen, setAvatarMouthOpen] = useState(false);

  useEffect(() => {
    let intervalId = null;
    const isSpeaking = status === 'Speaking...' || isSpeakingRefined;

    if (isSpeaking) {
      intervalId = setInterval(() => {
        setAvatarMouthOpen(prev => !prev);
      }, 160);
    } else {
      setAvatarMouthOpen(false);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, isSpeakingRefined]);

  const toggleCameraPause = () => {
    if (!isCameraOn || !cameraStream) return;
    
    const newPaused = !isCameraPaused;
    setIsCameraPaused(newPaused);
    if (localVideoRef.current) {
      if (newPaused) {
        localVideoRef.current.pause();
      } else {
        localVideoRef.current.play().catch(e => console.error("Error playing video:", e));
      }
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

  // Start structured video interview mode when user requests it
  const startInterviewMode = (topicParam) => {
    const topic = topicParam || currentTopicRef.current || 'python';
    const questions = QUESTION_BANKS[topic] || QUESTION_BANKS.python;
    
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
      ? `Bahut accha! Chalo ${topicLabel} video interview practice shuru karte hain. Pehla question hai: ${questions[0]}`
      : `Great! Let's start your ${topicLabel} video interview practice. Here is your first question: ${questions[0]}`;
    setAiResponse(startText);
    speakAloud(startText);
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
            ? "Aap kaunse topic ka video interview practice karna chahte hain? Aap Python, Java, React, JavaScript, SQL, C++, DSA, ya HR behavioral choose kar sakte hain."
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
          ? `Humne ${tName} select kar liya hai. Kya aap iska video interview practice shuru karna chahte hain ya koi sawaal poochna chahte hain?`
          : `Switched to ${tName}. Would you like to start video interview practice, or ask a question about it?`;
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

  const evaluateLiveAnswer = async (answerText) => {
    if (!isComponentMountedRef.current) return;
    
    // Dynamically set language from candidate's verbal answer
    const isHindiAnswer = detectHinglish(answerText);
    setDetectedLang(isHindiAnswer ? 'hi' : 'en');
    detectedLangRef.current = isHindiAnswer ? 'hi' : 'en';

    if (!answerText || !answerText.trim()) {
      const emptyText = isHindiAnswer 
        ? "Mujhe aapka answer sunai nahi diya. Kripya dobara boliye, main sun rahi hoon."
        : "I couldn't hear your answer. Please try speaking again, I'm listening.";
      setAiResponse(emptyText);
      setLiveInterviewState('asking_next');
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
        const primaryMistake = evalData.mistakes && evalData.mistakes.length > 0 
          ? evalData.mistakes[0] 
          : (isHindi ? "kuch concepts clarify nahi the" : "some key technical points were missing");
          
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
                    ? "Aap kaunse topic ka video interview practice karna chahte hain? Aap Python, Java, React, JavaScript, SQL, C++, DSA, ya HR behavioral choose kar sakte hain."
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
                  ? `Humne ${tName} select kar liya hai. Kya aap iska video interview practice shuru karna chahte hain ya koi sawaal poochna chahte hain?`
                  : `Switched to ${tName}. Would you like to start video interview practice, or ask a question about it?`;
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

    // Chrome Speech Synthesis Workaround
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
      isComponentMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      clearInterval(resumeInterval);

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
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Run ONLY once on mount!
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
      let targetRole = topicRoleMap[currentTopic] || "Software Developer";
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

      const currentQ = activeQuestions[questionIndex] || activeQuestions[0];
      const res = await fetch('/api/chat/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ,
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
    if (score >= 80) return 'Outstanding Behavioral & Eye-contact Performance!';
    if (score >= 60) return 'Good presentation. Pacing and terminology could expand.';
    return 'Gaps identified. Work on body language and structured responses.';
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Switcher Tabs */}
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
          <Video size={16} />
          Interactive Video Call
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
          Detailed Video Evaluation
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '5fr 3fr', gap: '24px' }}>
        
        {/* Left Side: Active Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Universal Immersive Splitscreen AI Live Interview Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            height: '360px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: '#0a0f1d',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            {/* Left Column: AI Interviewer */}
            <div style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              background: '#090d16'
            }}>
              {/* Closed-mouth default avatar */}
              <img 
                src={interviewerClosed} 
                alt="AI Interviewer Idle" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.9,
                  transition: 'transform 0.5s ease',
                  transform: (status === 'Speaking...' || isSpeakingRefined) ? 'scale(1.02)' : 'scale(1)'
                }}
              />

              {/* Open-mouth overlay avatar - cross-fades based on avatarMouthOpen */}
              <img 
                src={interviewerOpen} 
                alt="AI Interviewer Speaking" 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: avatarMouthOpen ? 0.9 : 0,
                  transition: 'opacity 0.12s ease-in-out, transform 0.5s ease',
                  transform: (status === 'Speaking...' || isSpeakingRefined) ? 'scale(1.02)' : 'scale(1)',
                  pointerEvents: 'none'
                }}
              />

              {/* Gradient Overlay for Identity */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '80px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                pointerEvents: 'none'
              }}></div>

              {/* Status Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.7rem',
                color: '#fff',
                fontWeight: 'bold',
                zIndex: 10
              }}>
                <Radio size={12} className="live-pulse-dot" style={{ color: 'var(--color-accent)' }} />
                AI INTERVIEWER
              </div>

              {/* Dynamic Sound Visualizer Overlay on Avatar */}
              {(status === 'Speaking...' || isSpeakingRefined) && (
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  display: 'flex',
                  gap: '3px',
                  alignItems: 'center',
                  height: '18px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  padding: '4px 8px',
                  borderRadius: '10px',
                  zIndex: 10
                }}>
                  {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                    <div key={i} style={{
                      width: '2px',
                      height: '100%',
                      background: 'var(--color-purple)',
                      borderRadius: '2px',
                      transform: `scaleY(${0.3 + Math.random() * 0.7})`,
                      animation: `pulse ${0.3 + i*0.04}s infinite alternate ease-in-out`
                    }}></div>
                  ))}
                  <span style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 'bold', marginLeft: '4px' }}>Speaking</span>
                </div>
              )}
            </div>

            {/* Right Column: Student (You) */}
            <div style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              background: '#090d16'
            }}>
              {isCameraOn ? (
                <video 
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)' // Mirror effect for natural preview
                  }}
                />
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={32} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>Camera Offline</span>
                </div>
              )}

              {/* Pause overlay */}
              {isCameraOn && isCameraPaused && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#fff',
                  zIndex: 2
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <Pause size={20} color="#fff" />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px' }}>CAMERA PAUSED</span>
                </div>
              )}

              {/* Identity Overlay */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.7rem',
                color: '#fff',
                fontWeight: 'bold',
                zIndex: 10
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isCameraOn ? (isCameraPaused ? '#f59e0b' : '#10b981') : 'rgba(255,255,255,0.3)'
                }}></span>
                STUDENT (YOU)
              </div>
            </div>

            {/* Central Video Call controls overlay at the bottom center */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '8px 16px',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 30,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}>
              {/* Mic Mute Toggle */}
              <button
                onClick={toggleMute}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
                style={{
                  width: '40px',
                  height: '40px',
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
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Camera On/Off Toggle */}
              <button
                onClick={toggleCamera}
                title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isCameraOn ? 'rgba(255,255,255,0.06)' : 'rgba(239, 68, 68, 0.2)',
                  border: isCameraOn ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isCameraOn ? '#fff' : '#ef4444',
                  transition: 'all 0.2s'
                }}
              >
                {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              {/* Camera Pause/Resume Toggle */}
              {isCameraOn && (
                <button
                  onClick={toggleCameraPause}
                  title={isCameraPaused ? "Resume Video" : "Pause Video"}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isCameraPaused ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    transition: 'all 0.2s'
                  }}
                >
                  {isCameraPaused ? <Play size={18} /> : <Pause size={18} />}
                </button>
              )}

              {/* Separator line */}
              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>

              {/* Next Question (Skip) button */}
              {isCalling && (
                <button
                  onClick={goToNextQuestion}
                  title="Next Question"
                  style={{
                    width: '40px',
                    height: '40px',
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
                  <RefreshCw size={18} />
                </button>
              )}

              {/* End Call (Red button) */}
              <button
                onClick={hangUpCall}
                title="End Call"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'all 0.2s'
                }}
              >
                <PhoneOff size={18} />
              </button>
            </div>

            {/* Top-Right: Unified Stateful Action Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '6px 12px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.7rem',
              color: (status === 'Speaking...' || isSpeakingRefined)
                ? 'var(--color-purple)'
                : (status === 'Listening...' || evalStatus === 'Listening...')
                  ? 'var(--color-accent)'
                  : 'var(--text-muted)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              zIndex: 20
            }}>
              <span className="live-pulse-dot" style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: (status === 'Speaking...' || isSpeakingRefined)
                  ? '#8b5cf6'
                  : (status === 'Listening...' || evalStatus === 'Listening...')
                    ? '#06b6d4'
                    : 'rgba(255,255,255,0.3)'
              }}></span>
              {status === 'Speaking...' ? "Speaking" : status === 'Listening...' ? "Listening" : status === 'Thinking...' ? "Thinking..." : "Idle"}
            </div>
          </div>

          {/* TAB 1: INTERACTIVE CALL MODE */}
          {activeTab === 'call' && (
            <div className="glass-panel" style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              minHeight: '260px',
              position: 'relative'
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
                      <Video size={16} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Interactive Video Interview</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Face-to-face AI simulated technical & behavioral round</span>
                    </div>
                  </div>

                  {/* Topic Selector Pills for user choice */}
                  <div style={{ margin: '12px 0 6px 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                      Select Your Preferred Interview Topic:
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

                  {callError && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#ef4444',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertTriangle size={16} />
                      {callError}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '20px 0' }}>
                    <button 
                      onClick={toggleCall}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                    >
                      <Video size={24} color="#fff" />
                    </button>

                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 'bold' }}>
                        Start Video Interview Call
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        AI Faculty will welcome you and ask what you want to practice. Answer in English or Hinglish — AI adapts to your choice! Instant evaluation, mistake breakdowns, and model answers provided.
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                // State: Call active
                <>
                  {/* Topic Pill Bar during Call — allows instant topic switching */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '8px' }}>
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
                    borderRadius: '12px'
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
                            ? 'Video Conversation' 
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
                        {status === 'Speaking...' ? 'AI Speaking...' : liveInterviewState === 'welcome' ? 'Welcome' : liveInterviewState === 'listening' ? 'Listening' : liveInterviewState === 'evaluating' ? 'Evaluating...' : liveInterviewState === 'speaking_eval' ? 'Feedback' : liveInterviewState === 'eval_ready' ? 'Feedback Ready' : status === 'Thinking...' ? 'Thinking...' : 'Ready'}
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

                  {/* Speech input preview */}
                  {(liveInterviewState === 'listening' || userSpeech || status === 'Listening...') && (
                    <div style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px dashed rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '0.85rem'
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

                  {/* Loading visualizer during evaluation */}
                  {(liveInterviewState === 'evaluating' || status === 'Thinking...') && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      padding: '20px 0',
                      color: 'var(--color-accent)'
                    }}>
                      <Loader2 size={32} className="spin-animate" />
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px' }}>
                        {conversationMode === 'interview' ? 'AI FACULTY IS EVALUATING YOUR RESPONSE...' : 'AI IS THINKING...'}
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
                      padding: '16px'
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
                          <strong style={{ color: '#fff', fontSize: '0.85rem', display: 'block' }}>Evaluation Score</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {liveEvaluation.score >= 80 ? 'Excellent Answer!' : liveEvaluation.score >= 60 ? 'Good effort, some improvements needed.' : 'Needs significant review.'}
                          </span>
                        </div>
                      </div>

                      {/* Gaps/Mistakes (Kamiya) */}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <AlertTriangle size={12} />
                          KAMI / GAPS IDENTIFIED
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
                          SAHI / IMPROVED VERSION
                        </span>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', fontStyle: 'italic' }}>
                          {liveEvaluation.improved_version}
                        </p>
                      </div>

                      {/* Explicit Next Question Button so candidate is never rushed */}
                      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '6px' }}>
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

          {/* TAB 2: DETAILED VIDEO EVALUATION */}
          {activeTab === 'evaluate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Topic Selector Pills for Detailed Evaluation */}
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

              {/* Question card */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 'bold', letterSpacing: '1px' }}>
                    TECHNICAL & BEHAVIORAL QUESTION ({questionIndex + 1}/{activeQuestions.length})
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
                  >
                    <RefreshCw size={12} />
                    Next Question
                  </button>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', lineHeight: '1.5', fontWeight: '600' }}>
                  {activeQuestions[questionIndex] || activeQuestions[0]}
                </h3>
              </div>

              {/* Textarea builder */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    YOUR VIDEO TRANSCRIPTION
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
                  placeholder="Click Start Speaking and state your response clearly. Focus on the AI Digital Avatar."
                  style={{
                    width: '100%',
                    height: '130px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '14px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none'
                  }}
                />

                <div style={{ display: 'flex', gap: '12px' }}>
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
                      cursor: 'pointer'
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
                      boxShadow: '0 4px 15px rgba(6, 182, 212, 0.2)'
                    }}
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 size={16} className="spin-animate" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Evaluate Video Response
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Loading spinner overlay */}
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
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Analyzing Video Performance</h4>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Evaluating behavioral answers, language flow, keyword precision, and presentation pacing...
                    </p>
                  </div>
                </div>
              )}

              {/* Evaluation Results */}
              {evalResult && !isEvaluating && (
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s ease' }}>
                  
                  {/* Rating Grade circle */}
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
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Presentation Grade</h4>
                      <span style={{ fontSize: '0.85rem', color: getScoreColor(evalResult.score), fontWeight: '600' }}>
                        {getScoreMessage(evalResult.score)}
                      </span>
                    </div>
                  </div>

                  {/* Strengths List */}
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                      Strengths & Language Mentions
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
                      Mistakes & Behavioral Pacing Gaps
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {evalResult.mistakes.map((mis, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{mis}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Refined Professional Script */}
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
                        REFINED PROFESSIONAL SCRIPT
                      </span>
                      
                      <button
                        onClick={() => speakRefinedAnswer(evalResult.improved_version)}
                        style={{
                          background: isSpeakingRefined ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${isSpeakingRefined ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
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
                            Listen Script
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
              Video Settings
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
              Presentation Tips
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
                  <li>Focus your attention on the **Interactive AI Digital Avatar** as it speaks.</li>
                  <li>Click **Start Call** to begin speaking, and pause naturally to let the AI process.</li>
                  <li>Enjoy **complete privacy**—no device camera is accessed or required for this mode.</li>
                  <li>Speak clearly into your microphone at a steady pacing for perfect transcription.</li>
                </>
              ) : (
                <>
                  <li>Cycle through behavioral questions using the **Next Question** button.</li>
                  <li>Click **Start Speaking** to begin transcribing. The avatar operates in full privacy mode.</li>
                  <li>Review the text inside the workspace. You can **manually edit or type** additions.</li>
                  <li>Click **Evaluate Video Response** to analyze grading, pacing, and get refined scripts.</li>
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
