import React, { useState } from 'react';
import { 
  Terminal, 
  User, 
  MessageSquare, 
  Volume2, 
  Video, 
  Code, 
  LayoutDashboard, 
  Sparkles,
  Wifi,
  Github,
  Lock,
  LogIn,
  LogOut
} from 'lucide-react';
import ProfilePanel from './components/ProfilePanel';
import ChatPanel from './components/ChatPanel';
import DashboardPanel from './components/DashboardPanel';
import VoicePanel from './components/VoicePanel';
import VideoPanel from './components/VideoPanel';
import CodingPanel from './components/CodingPanel';

export default function App() {
  const [currentStudent, setCurrentStudent] = useState(() => {
    const saved = localStorage.getItem('talkflow_student');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState('Checking...');

  // Auth States
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Simple ping check to verify if backend is active
  React.useEffect(() => {
    const checkStatus = () => {
      fetch('/api/status')
        .then(res => res.json())
        .then(data => {
          if (data && data.status === 'ok') {
            setBackendStatus('Connected');
          } else {
            setBackendStatus('Offline');
          }
        })
        .catch(() => {
          setBackendStatus('Offline');
        });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Validate current student profile if backend is connected
  React.useEffect(() => {
    if (backendStatus === 'Connected' && currentStudent && currentStudent.id) {
      fetch(`/api/profile/${currentStudent.id}`)
        .then(res => {
          if (res.status === 404) {
            // Profile not found in database (e.g. database reset/fallback)
            localStorage.removeItem('talkflow_student');
            setCurrentStudent(null);
          }
        })
        .catch(() => {});
    }
  }, [backendStatus, currentStudent]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAuthError('Username and password fields are required.');
      return;
    }
    
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/profile/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          name: name.trim() || 'Student'
        })
      });

      if (res.ok) {
        const student = await res.json();
        localStorage.setItem('talkflow_student', JSON.stringify(student));
        setCurrentStudent(student);
        setActiveTab('dashboard');
      } else {
        const err = await res.json();
        setAuthError(err.detail || 'Sign up failed. Username might be taken.');
      }
    } catch (err) {
      setAuthError('Connection error. Is the backend server running?');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAuthError('Username and password fields are required.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/profile/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      if (res.ok) {
        const student = await res.json();
        localStorage.setItem('talkflow_student', JSON.stringify(student));
        setCurrentStudent(student);
        setActiveTab('dashboard');
      } else {
        const err = await res.json();
        setAuthError(err.detail || 'Invalid username or password credentials.');
      }
    } catch (err) {
      setAuthError('Connection error. Is the backend server running?');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('talkflow_student');
    setCurrentStudent(null);
    setUsername('');
    setPassword('');
    setName('');
    setAuthError('');
    setActiveTab('dashboard');
  };

  const handleUpdateStudent = (updatedStudent) => {
    localStorage.setItem('talkflow_student', JSON.stringify(updatedStudent));
    setCurrentStudent(updatedStudent);
  };

  const handleTabChange = (newTab) => {
    if (newTab !== activeTab) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.pause();
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
      setActiveTab(newTab);
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, phase: 'Phase 6' },
    { id: 'chat', label: 'Live Doubts Chat', icon: MessageSquare, phase: 'Phase 2' },
    { id: 'voice', label: 'Voice Speaking', icon: Volume2, phase: 'Phase 3' },
    { id: 'video', label: 'AI Video Interview', icon: Video, phase: 'Phase 5' },
    { id: 'code', label: 'Coding Workspace', icon: Code, phase: 'Phase 4' },
    { id: 'profile', label: 'Student Profile', icon: User, phase: 'Phase 1' },
  ];


  // RENDER INTERACTION FOR UNAUTHENTICATED USERS
  if (!currentStudent) {
    return (
      <div className="auth-shell" style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Futuristic Floating Neon Circles */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)',
          top: '-100px',
          left: '-100px',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
          bottom: '-150px',
          right: '-150px',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }}></div>

        {/* Central Auth Glassmorphic Portal */}
        <div className="glass-panel" style={{
          width: '100%',
          maxWidth: '430px',
          padding: '40px 32px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          zIndex: 10,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Header Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <div className="glow-effect" style={{
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
            }}>
              <Sparkles size={26} color="#fff" />
            </div>
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-display)', margin: 0, background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TalkFlow AI
              </h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Next-Gen Interview Tutor
              </span>
            </div>
          </div>

          {/* Sub-tab selection controls */}
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '30px',
            padding: '4px',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '24px',
                border: 'none',
                background: authMode === 'login' ? 'linear-gradient(135deg, var(--color-accent), var(--color-purple))' : 'transparent',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '24px',
                border: 'none',
                background: authMode === 'signup' ? 'linear-gradient(135deg, var(--color-accent), var(--color-purple))' : 'transparent',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Register Account
            </button>
          </div>

          {/* Auth validation messages */}
          {authError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#fecaca',
              marginBottom: '20px',
              fontWeight: '500',
              lineHeight: '1.4'
            }}>
              {authError}
            </div>
          )}

          {/* Core Auth Form */}
          <form onSubmit={authMode === 'login' ? handleLogin : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {authMode === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>FULL NAME</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Enter your display name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '34px', width: '100%' }}
                    disabled={authLoading}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>USERNAME</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Choose an account username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ paddingLeft: '34px', width: '100%' }}
                  required
                  disabled={authLoading}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="Enter account security key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '34px', width: '100%' }}
                  required
                  disabled={authLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.25)'
              }}
            >
              {authLoading ? (
                <span>Loading Account...</span>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>{authMode === 'login' ? 'Sign In to TalkFlow' : 'Create Student Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Secure telemetry footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '16px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
            <span>AI BACKEND CONNECTION REQUIRED</span>
          </div>

        </div>

      </div>
    );
  }

  // RENDER MAIN APPLICATION LAYOUT FOR LOGGED IN USERS
  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <aside className="glass-panel app-sidebar" style={{
        width: '280px',
        margin: '16px 0 16px 16px',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', padding: '0 8px' }}>
            <div className="glow-effect" style={{
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px var(--color-accent)'
            }}>
              <Sparkles size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)', letterSpacing: '0.02em', background: 'linear-gradient(135deg, #fff, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TalkFlow AI
              </h1>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-accent)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Interview Tutor
              </span>
            </div>
            <div className="mobile-top-title">
              <span>STUDENT CONTROL PANEL</span>
              <strong>{activeTab === 'profile' ? 'Profile Setup' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</strong>
            </div>
          </div>

          {/* Nav List */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                    border: isActive ? '1px solid rgba(6, 182, 212, 0.15)' : '1px solid transparent',
                    color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem'
                  }}
                  className="btn"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? 'var(--color-accent)' : 'var(--text-muted)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'normal'
                  }}>
                    {item.phase}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar Info & Logout Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', paddingLeft: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <Wifi size={14} style={{ color: backendStatus === 'Connected' ? 'var(--color-success)' : 'var(--color-warning)' }} />
            <span>Backend: <strong>{backendStatus}</strong></span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Terminal size={12} />
              <span>v1.0.0</span>
            </div>
            
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <LogOut size={12} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Display Content */}
      <main className={`app-workspace workspace-${activeTab}`} style={{
        flex: 1,
        padding: '24px 32px 32px 32px',
        overflowY: 'auto',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Workspace Sub Header */}
        <div className="workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-purple)', letterSpacing: '0.1em', fontWeight: 'bold' }}>
              Student Control Panel
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', marginTop: '2px' }}>
              {activeTab === 'profile' ? 'Profile Setup' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
          </div>
          <a href="https://github.com" target="_blank" rel="noreferrer" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            textDecoration: 'none'
          }}>
            <Github size={16} />
            <span>Source Repo</span>
          </a>
        </div>

        {/* Tab Logic Display */}
        <div style={{ flex: 1 }}>
          {activeTab === 'dashboard' ? (
            <DashboardPanel student={currentStudent} onNavigate={handleTabChange} />
          ) : activeTab === 'profile' ? (
            <ProfilePanel student={currentStudent} onUpdateStudent={handleUpdateStudent} />
          ) : activeTab === 'chat' ? (
            <ChatPanel student={currentStudent} />
          ) : activeTab === 'voice' ? (
            <VoicePanel student={currentStudent} />
          ) : activeTab === 'video' ? (
            <VideoPanel student={currentStudent} />
          ) : activeTab === 'code' ? (
            <CodingPanel student={currentStudent} />
          ) : (
            <div style={{ color: '#fff' }}>Unimplemented Phase</div>
          )}
        </div>
      </main>
    </div>
  );
}
