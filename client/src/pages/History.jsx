import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessionAPI } from '../lib/api'

const TOPIC_LABELS = { dsa: 'DSA', hr: 'Behavioral', 'system-design': 'System Design' }
const TOPIC_COLORS = { dsa: '#6c63ff', hr: '#22d3ee', 'system-design': '#f59e0b' }
const DIFF_COLORS = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' }

function ScoreBadge({ score }) {
  if (score === null || score === undefined) return <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return <span style={{ fontWeight: 800, fontSize: '1.3rem', color }}>{score}</span>
}

function formatDuration(secs) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function History() {
  const [sessions, setSessions] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [topic, setTopic] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const params = { page, limit: 10 }
    if (topic) params.topic = topic
    if (status) params.status = status
    sessionAPI.getAll(params)
      .then(({ data }) => { setSessions(data.sessions); setPagination(data.pagination) })
      .finally(() => setLoading(false))
  }, [topic, status, page])

  const filterBtn = (label, active, onClick) => (
    <button onClick={onClick} style={{ padding: '0.4rem 0.9rem', borderRadius: 8, border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? '#1a1830' : 'transparent', color: active ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: active ? 600 : 400 }}>
      {label}
    </button>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Session History</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>All your past interview sessions.</p>
        </div>
        <button onClick={() => navigate('/topics')} style={{ padding: '0.6rem 1.25rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>+ New Session</button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {filterBtn('All topics', !topic, () => { setTopic(''); setPage(1) })}
        {filterBtn('DSA', topic === 'dsa', () => { setTopic('dsa'); setPage(1) })}
        {filterBtn('Behavioral', topic === 'hr', () => { setTopic('hr'); setPage(1) })}
        {filterBtn('System Design', topic === 'system-design', () => { setTopic('system-design'); setPage(1) })}
        <div style={{ width: 1, background: 'var(--border)', margin: '0 0.25rem' }} />
        {filterBtn('All status', !status, () => { setStatus(''); setPage(1) })}
        {filterBtn('Completed', status === 'completed', () => { setStatus('completed'); setPage(1) })}
        {filterBtn('Active', status === 'active', () => { setStatus('active'); setPage(1) })}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <div>Topic</div><div>Difficulty</div><div>Score</div><div>Duration</div><div>Date</div><div>Status</div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
            No sessions found. <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/topics')}>Start one →</span>
          </div>
        ) : (
          sessions.map((s, i) => {
            const color = TOPIC_COLORS[s.topic]
            const isLast = i === sessions.length - 1
            return (
              <div
                key={s._id}
                onClick={() => s.status === 'active' && navigate(`/interview/${s._id}`)}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px', padding: '1rem 1.25rem', borderBottom: isLast ? 'none' : '1px solid var(--border)', alignItems: 'center', cursor: s.status === 'active' ? 'pointer' : 'default', transition: 'background 0.15s' }}
                onMouseEnter={e => { if (s.status === 'active') e.currentTarget.style.background = 'var(--surface2)' }}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: 20, background: `${color}22`, color, fontWeight: 600 }}>{TOPIC_LABELS[s.topic]}</span>
                  {s.status === 'active' && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>→ Resume</span>}
                </div>
                <div style={{ fontSize: '0.85rem', color: DIFF_COLORS[s.difficulty], fontWeight: 500, textTransform: 'capitalize' }}>{s.difficulty}</div>
                <div><ScoreBadge score={s.score} /></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatDuration(s.duration)}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</div>
                <div>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 20, fontWeight: 600, background: s.status === 'completed' ? '#0f2a18' : s.status === 'active' ? '#1a1830' : '#2a1010', color: s.status === 'completed' ? '#22c55e' : s.status === 'active' ? '#6c63ff' : 'var(--text-muted)' }}>
                    {s.status}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: page === 1 ? 'var(--text-muted)' : 'var(--text)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
          <span style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{page} / {pagination.pages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: page === pagination.pages ? 'var(--text-muted)' : 'var(--text)', cursor: page === pagination.pages ? 'not-allowed' : 'pointer' }}>Next →</button>
        </div>
      )}
    </div>
  )
}