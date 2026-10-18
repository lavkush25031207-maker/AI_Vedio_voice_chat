import React, { useState, useEffect } from 'react';
import { User, Briefcase, Award, Code, CheckCircle, AlertCircle, Save, Star } from 'lucide-react';

export default function ProfilePanel({ student, onUpdateStudent }) {
  const [profile, setProfile] = useState(student || {
    name: '',
    target_role: 'Frontend Developer',
    skills: '',
    experience_level: 'Fresher',
    target_category: 'Mock Technical Interview'
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Fetch student profile on mount
  useEffect(() => {
    if (student) {
      fetchProfile();
    }
  }, [student]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/profile/${student.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setProfile(data);
        }
      } else {
        setStatus({ type: 'error', message: 'Profile could not be loaded from backend.' });
      }
    } catch (error) {
      console.warn('Backend offline, profile load skipped');
      setStatus({ type: 'error', message: 'Backend offline. Profile data was not loaded from local browser storage.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      setStatus({ type: 'error', message: 'Name field cannot be left blank.' });
      return;
    }
    
    setLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      const response = await fetch(`/api/profile/${student.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setStatus({ type: 'success', message: 'Profile settings saved successfully.' });
        if (onUpdateStudent) {
          onUpdateStudent(data);
        }
      } else {
        throw new Error('API return error');
      }
    } catch (error) {
      console.warn('Backend writing failed, profile not saved locally');
      setStatus({ type: 'error', message: 'Backend offline. Profile was not saved locally, so stale data will not be shown.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="glass-panel profile-panel" style={{ padding: '30px', maxWidth: '750px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))',
          padding: '10px',
          borderRadius: '50%',
          display: 'flex',
          border: '1px solid var(--border-glow)'
        }}>
          <User size={24} style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff' }}>Student Profile Settings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Setup your resume parameters to tailor interview challenges to your goals.
          </p>
        </div>
      </div>

      {status.message && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          background: status.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${status.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
          color: status.type === 'success' ? '#a7f3d0' : '#fecaca',
          fontSize: '0.9rem'
        }}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Name input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} /> Full Name
          </label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={profile.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        {/* Multi-column grid */}
        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Target Career Track */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={14} /> Target Job Role
            </label>
            <select name="target_role" value={profile.target_role} onChange={handleChange} disabled={loading}>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Fullstack Engineer">Fullstack Engineer</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Data Scientist">Data Scientist</option>
            </select>
          </div>

          {/* Skill Tier */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={14} /> Experience Tier
            </label>
            <select name="experience_level" value={profile.experience_level} onChange={handleChange} disabled={loading}>
              <option value="Fresher">Fresher (Entry Level)</option>
              <option value="1-2 Years Experience">1-2 Years Experience</option>
              <option value="3+ Years (Senior)">3+ Years (Senior)</option>
            </select>
          </div>
        </div>

        {/* Practice Category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Star size={14} /> Primary Interview Challenge Curriculum
          </label>
          <select name="target_category" value={profile.target_category} onChange={handleChange} disabled={loading}>
            <option value="Mock Technical Interview">Mock Technical Interview (Coding/Tech concepts)</option>
            <option value="HR Behavioral Round">HR Behavioral Round (Soft-skills/Speaking)</option>
            <option value="Concept Explainer">Concept Explainer (Deep-dives/Theory review)</option>
          </select>
        </div>

        {/* Technical Keywords */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code size={14} /> Skills / Tech Stack Keywords (comma separated)
          </label>
          <textarea
            name="skills"
            rows="3"
            placeholder="e.g. React, JavaScript, Python, FastAPI, SQLite, Algorithms"
            value={profile.skills}
            onChange={handleChange}
            style={{ resize: 'vertical' }}
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '150px', justifyContent: 'center' }}>
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
