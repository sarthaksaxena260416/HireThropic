import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { statsAPI } from '../lib/api'
import { useAuthStore } from '../store/auth.store'

const TOPIC_COLORS = { dsa: '#6c63ff', hr: '#22d3ee', 'system-design': '#f59e0b' }
const TOPIC_LABELS = { dsa: 'DSA', hr: 'Behavioral', 'system-design': 'System Design' }

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: color || 'var(--text)', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ color: '#fff', fontWeight: 600 }}>Score: {payload[0].value}</div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    statsAPI.get().then(({ data }) => { setStats(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading dashboard...</div>

  if (!stats || stats.overview.totalSessions === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
        <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No data yet</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Complete your first interview to see stats here.</p>
        <button onClick={() => navigate('/topics')} style={{ padding: '0.75rem 2rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Start practicing</button>
      </div>
    )
  }

  const { overview, topicBreakdown, scoreOverTime } = stats
  const scoreColor = overview.avgScore >= 75 ? '#22c55e' : overview.avgScore >= 50 ? '#f59e0b' : '#ef4444'

  const radarData = ['dsa', 'hr', 'system-design'].map(t => {
    const found = topicBreakdown?.find(b => b.topic === t)
    return { topic: TOPIC_LABELS[t], score: found?.avgScore ?? 0 }
  })

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>Hey {user?.name?.split(' ')[0]} 👋 — here's your performance overview.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Avg Score" value={overview.avgScore ?? '—'} sub="across completed sessions" color={scoreColor} />
        <StatCard label="Sessions" value={overview.totalSessions} sub={`${overview.completedSessions} completed`} />
        <StatCard label="Completion" value={`${overview.completionRate}%`} sub="of started sessions" color={overview.completionRate >= 70 ? '#22c55e' : '#f59e0b'} />
        <StatCard label="Topics" value={topicBreakdown?.length ?? 0} sub="practiced so far" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '1.25rem' }}>Score over time</h3>
          {scoreOverTime?.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={scoreOverTime}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Complete more sessions to see your trend.</div>
          )}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '1.25rem' }}>Topic breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="topic" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="score" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {topicBreakdown?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {topicBreakdown.map(t => {
            const color = TOPIC_COLORS[t.topic]
            return (
              <div key={t.topic} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', color, fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>{TOPIC_LABELS[t.topic]}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: t.avgScore ? (t.avgScore >= 75 ? '#22c55e' : t.avgScore >= 50 ? '#f59e0b' : '#ef4444') : 'var(--text-muted)', lineHeight: 1 }}>
                  {t.avgScore ?? '—'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{t.count} session{t.count !== 1 ? 's' : ''}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}