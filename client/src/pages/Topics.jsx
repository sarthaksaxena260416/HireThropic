import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessionAPI } from '../lib/api'

const TOPICS = [
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    desc: 'Arrays, trees, graphs, DP, sorting, and more.',
    icon: '{ }',
    color: '#6c63ff',
    bg: '#1a1830',
    difficulties: ['easy', 'medium', 'hard'],
    time: '20–40 min',
  },
  {
    id: 'hr',
    name: 'Behavioral (HR)',
    desc: 'STAR-method questions on leadership, teamwork, and conflict.',
    icon: '🤝',
    color: '#22d3ee',
    bg: '#0f2830',
    difficulties: ['easy', 'medium', 'hard'],
    time: '15–30 min',
  },
  {
    id: 'system-design',
    name: 'System Design',
    desc: 'Design Twitter, Uber, URL shorteners, and more at scale.',
    icon: '⚙️',
    color: '#f59e0b',
    bg: '#2a1f0a',
    difficulties: ['medium', 'hard'],
    time: '30–60 min',
  },
]

const DIFF_LABEL = { easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' }
const DIFF_DESC = {
  easy: 'Warm-up questions, fundamental concepts.',
  medium: 'Standard interview difficulty.',
  hard: 'Senior-level, complex problems.',
}

export default function Topics() {
  const [selected, setSelected] = useState(null)
  const [difficulty, setDifficulty] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const topic = TOPICS.find(t => t.id === selected)

  const startSession = async () => {
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      const { data } = await sessionAPI.create({ topic: selected, difficulty })
      navigate(`/interview/${data.session._id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session')
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Choose a topic</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>Pick what you want to practice, then set your difficulty.</p>
      </div>

      {/* Topic cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {TOPICS.map(t => (
          <div
            key={t.id}
            onClick={() => { setSelected(t.id); if (!t.difficulties.includes(difficulty)) setDifficulty(t.difficulties[0]) }}
            style={{
              background: selected === t.id ? t.bg : 'var(--surface)',
              border: `2px solid ${selected === t.id ? t.color : 'var(--border)'}`,
              borderRadius: 14,
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            {selected === t.id && (
              <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>✓</div>
            )}
            <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>{t.icon}</div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>{t.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>{t.desc}</p>
            <span style={{ fontSize: '0.78rem', color: t.color, fontWeight: 500 }}>⏱ {t.time}</span>
          </div>
        ))}
      </div>

      {/* Difficulty selector */}
      {topic && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>Select difficulty</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {topic.difficulties.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 8,
                  border: `1.5px solid ${difficulty === d ? topic.color : 'var(--border)'}`,
                  background: difficulty === d ? `${topic.color}22` : 'transparent',
                  color: difficulty === d ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: difficulty === d ? 600 : 400,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s',
                }}
              >
                {DIFF_LABEL[d]}
              </button>
            ))}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem' }}>{DIFF_DESC[difficulty]}</p>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem', background: '#2a1010', borderRadius: 8, fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <button
        onClick={startSession}
        disabled={!selected || loading}
        style={{
          padding: '0.85rem 2.5rem',
          background: selected ? 'var(--accent)' : 'var(--surface2)',
          color: selected ? '#fff' : 'var(--text-muted)',
          border: 'none',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: '1rem',
          cursor: selected && !loading ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
        }}
      >
        {loading ? 'Starting...' : '🚀 Start Interview'}
      </button>
    </div>
  )
}