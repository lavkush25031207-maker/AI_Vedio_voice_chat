import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, Bot, User, Loader2, Play } from 'lucide-react';

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize a new session on mount if one doesn't exist
  useEffect(() => {
    const initSession = async () => {
      try {
        let profileId = null;
        try {
          const profileRes = await fetch('/api/profile');
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData && profileData.id) {
              profileId = profileData.id;
            }
          }
        } catch (e) {
          console.warn("Failed to fetch student profile for chat context:", e);
        }

        const res = await fetch('/api/chat/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            profile_id: profileId,
            session_type: 'Mock Technical Interview' 
          })
        });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.id);
          
          // Add a welcoming system message locally
          setMessages([{
            id: 'welcome',
            role: 'model',
            content: "Hello! I'm TalkFlow AI. What would you like to practice today?",
            created_at: new Date().toISOString()
          }]);
        }
      } catch (err) {
        console.error("Failed to init session:", err);
      }
    };
    initSession();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || loading) return;

    const userText = input;
    setInput('');
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      content: userText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          content: userText
        })
      });
      
      if (res.ok) {
        const aiMsg = await res.json();
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'model',
        content: "Sorry, I encountered an error. Please ensure the backend is running and the API key is configured.",
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel chat-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '800px', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'var(--color-primary)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
          <Bot size={20} color="#fff" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>TalkFlow AI Assistant</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live Mock Interview</p>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id || idx} style={{
              display: 'flex',
              gap: '12px',
              alignSelf: isUser ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}>
              {!isUser && (
                <div style={{ alignSelf: 'flex-end', background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '50%', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={16} />
                </div>
              )}
              
              <div style={{
                background: isUser ? 'var(--color-primary)' : 'rgba(30, 41, 59, 0.7)',
                border: isUser ? 'none' : '1px solid rgba(255,255,255,0.1)',
                padding: '12px 16px',
                borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
                color: '#fff',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          children={String(children).replace(/\n$/, '')}
                          style={atomDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ borderRadius: '8px', margin: '10px 0' }}
                          {...props}
                        />
                      ) : (
                        <code className={className} style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px' }} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>

              {isUser && (
                <div style={{ alignSelf: 'flex-end', background: 'var(--color-primary)', padding: '6px', borderRadius: '50%', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} />
                </div>
              )}
            </div>
          );
        })}
        
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', maxWidth: '80%' }}>
            <div style={{ alignSelf: 'flex-end', background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '50%', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} />
            </div>
            <div style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '12px 20px',
                borderRadius: '16px 16px 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Loader2 size={18} className="spin" color="var(--color-accent)" />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(15, 23, 42, 0.4)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message or answer here..."
            disabled={loading || !sessionId}
            style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius-full)',
              padding: '12px 20px',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              background: input.trim() ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s transform'
            }}
          >
            <Send size={20} style={{ marginLeft: '2px' }} />
          </button>
        </form>
      </div>
      
      {/* Basic spinner animation CSS to be added if not already globally defined */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
