import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

const FEATURES = [
  { icon: '🧠', title: 'AI-Powered Interviews', desc: 'Real conversations with an AI interviewer that adapts to your answers and asks smart follow-ups.' },
  { icon: '📊', title: 'Topic-Based Practice', desc: 'DSA, Behavioral, and System Design — each with tailored difficulty levels.' },
  { icon: '📈', title: 'Performance Dashboard', desc: 'Track your scores over time, see your weak areas, and watch yourself improve.' },
]

function Btn({ children, onClick, ghost, large }) {
  const style = ghost
    ? { padding: large ? '0.75rem 1.75rem' : '0.5rem 1.25rem', borderRadius: 10, cursor: 'pointer', fontSize: large ? '1rem' : '0.9rem', fontWeight: 600, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', transition: 'all 0.15s' }
    : { padding: large ? '0.75rem 1.75rem' : '0.5rem 1.25rem', borderRadius: 10, cursor: 'pointer', fontSize: large ? '1rem' : '0.9rem', fontWeight: 600, background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)', transition: 'all 0.15s' }
  return <button style={style} onClick={onClick}>{children}</button>
}

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--accent)' }}>HireThropic</span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {user ? (
            <Btn onClick={() => navigate('/topics')}>Go to App →</Btn>
          ) : (
            <>
              <Btn ghost onClick={() => navigate('/login')}>Log in</Btn>
              <Btn onClick={() => navigate('/register')}>Get started</Btn>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '6rem 1.5rem 4rem', maxWidth: 780, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: '#1a1a2e', border: '1px solid #3d3d6b', color: '#a78bfa', padding: '0.35rem 1rem', borderRadius: 20, fontSize: '0.82rem', marginBottom: '1.5rem', fontWeight: 500 }}>
          Powered by Claude AI
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.25rem', letterSpacing: '-1.5px' }}>
          Ace your next<br />
          <span style={{ color: 'var(--accent)' }}>technical interview</span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 560, margin: '0 auto 2.5rem' }}>
          Practice DSA, behavioral, and system design interviews with an AI that gives real-time feedback, scores your answers, and tracks your progress.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Btn large onClick={() => navigate('/register')}>Start practicing free →</Btn>
          <Btn ghost large onClick={() => navigate('/login')}>I have an account</Btn>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1.5rem 6rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem' }}>{f.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}