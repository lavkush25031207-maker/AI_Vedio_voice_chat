import React, { useState, useEffect } from 'react';
import { 
  User, 
  Award, 
  MessageSquare, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function DashboardPanel({ student, onNavigate }) {
  const [profile, setProfile] = useState(student || {
    name: 'Fresher Student',
    target_role: 'Frontend Developer',
    skills: 'React, JavaScript, CSS, HTML',
    experience_level: 'Fresher',
    target_category: 'Mock Technical Interview'
  });

  const [stats, setStats] = useState({
    total_sessions: 0,
    avg_score: 0,
    total_messages: 0,
    categories_progress: {
      technical: 0,
      behavioral: 0,
      explainer: 0
    }
  });

  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!student) return;
      setLoading(true);
      try {
        // 1. Fetch Profile by specific ID
        const profileRes = await fetch(`/api/profile/${student.id}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData) setProfile(profileData);
        }

        // 2. Fetch Stats filtered by student.id
        const statsRes = await fetch(`/api/chat/stats?profile_id=${student.id}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData) setStats(statsData);
        }

        // 3. Fetch Recent Sessions filtered by student.id
        const sessionsRes = await fetch(`/api/chat/sessions?profile_id=${student.id}`);
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          if (sessionsData) setRecentSessions(sessionsData);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [student]);

  // Format skills string into clean tag pills
  const skillTags = profile.skills
    ? profile.skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : ['React', 'JavaScript', 'CSS', 'HTML'];

  // Overall Score radial circumference calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.avg_score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '30px',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>
              Welcome back
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            Hi, {profile.name}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, maxWidth: '550px', lineHeight: '1.5' }}>
            Practice with live AI feedback for {profile.target_role} preparation. Stale local browser data is no longer used for profile answers.
          </p>
        </div>
        <button 
          onClick={() => onNavigate('chat')}
          className="btn btn-primary glow-effect" 
          style={{ padding: '12px 24px', gap: '8px', fontSize: '0.95rem' }}
        >
          <span>Resume Practice</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        
        {/* Radial Score Gauge Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px', minHeight: '150px' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            <svg style={{ transform: 'rotate(-90deg)', width: '120px', height: '120px' }}>
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="url(#accentGradient)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
              <defs>
                <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-accent)" />
                  <stop offset="100%" stopColor="var(--color-purple)" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff' }}>{stats.avg_score}%</span>
              <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Avg Score
              </span>
            </div>
          </div>
          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#fff' }}>Prep Readiness</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
              Your composite score based on mock evaluations.
            </p>
          </div>
        </div>

        {/* Total Interviews Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Mock Interviews</span>
            <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.12)', borderRadius: '10px', display: 'flex' }}>
              <Layers size={18} style={{ color: 'var(--color-purple)' }} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff', display: 'block', lineHeight: '1' }}>
              {stats.total_sessions}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
              <TrendingUp size={14} /> Completed Practice Rounds
            </span>
          </div>
        </div>

        {/* Doubt Messages Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Live Doubt Chats</span>
            <div style={{ padding: '8px', background: 'rgba(6, 182, 212, 0.12)', borderRadius: '10px', display: 'flex' }}>
              <MessageSquare size={18} style={{ color: 'var(--color-accent)' }} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff', display: 'block', lineHeight: '1' }}>
              {stats.total_messages}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
              <Award size={14} style={{ color: 'var(--color-accent)' }} /> Total Interactive Queries
            </span>
          </div>
        </div>

      </div>

      {/* Main Content Split Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '4fr 5fr', gap: '24px' }}>
        
        {/* Left Side: Profile Details */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} style={{ color: 'var(--color-accent)' }} />
              Student Profile
            </h3>
            <button 
              onClick={() => onNavigate('profile')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-accent)',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span>Edit</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Full Name</span>
              <span style={{ fontSize: '1.05rem', color: '#fff', fontWeight: '600' }}>{profile.name}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Target Career Track</span>
              <span style={{ fontSize: '1.05rem', color: '#fff', fontWeight: '600' }}>{profile.target_role}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Experience Level</span>
              <span style={{ fontSize: '0.95rem', color: '#fff', display: 'inline-flex', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', width: 'fit-content' }}>
                {profile.experience_level}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Core Skills & Tech Stack</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skillTags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    style={{
                      fontSize: '0.75rem',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      color: 'var(--color-accent)',
                      padding: '4px 10px',
                      borderRadius: '30px',
                      fontWeight: '500'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Curriculum Status Checklist */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--color-purple)' }} />
              Curriculum Checklist
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Category 1 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
                <div>
                  <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '600', display: 'block' }}>Technical Interview</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Algorithms, stack syntax, system structures</span>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 'bold' }}>
                Active ({stats.categories_progress.technical} completed)
              </span>
            </div>

            {/* Category 2 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
                <div>
                  <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '600', display: 'block' }}>HR Behavioral Round</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Communication, situation logs, presentation</span>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 'bold' }}>
                Active ({stats.categories_progress.behavioral} completed)
              </span>
            </div>

            {/* Category 3 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
                <div>
                  <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '600', display: 'block' }}>Concept Explainer</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deep technical theory and architecture reviews</span>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 'bold' }}>
                Active ({stats.categories_progress.explainer} completed)
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Row: Recent Interview Timeline */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} style={{ color: 'var(--color-accent)' }} />
          Recent Interview Session History
        </h3>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading logs...</div>
        ) : recentSessions.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-sm)' }}>
            No interview sessions completed yet. Head to <strong>Live Doubts Chat</strong> or the presets to start your first session!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentSessions.slice(0, 4).map((sess) => (
              <div 
                key={sess.id} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.2s'
                }}
                className="btn"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '600' }}>{sess.type}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Completed on: {sess.created_at ? new Date(sess.created_at).toLocaleDateString() : 'N/A'} • Feedback: {sess.feedback.substring(0, 80)}...
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-accent)' }}>
                    {sess.score}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
