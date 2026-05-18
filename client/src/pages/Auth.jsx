import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

function AuthLayout({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--accent)', textDecoration: 'none' }}>HireThropic</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '1.5rem', letterSpacing: '-0.5px' }}>{title}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>{subtitle}</p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--text)', fontSize: '0.95rem', outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()

  const handle = async e => {
    e.preventDefault()
    setError('')
    const res = await login(email, password)
    if (res.success) navigate('/topics')
    else setError(res.error)
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue practicing">
      <form onSubmit={handle}>
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.6rem', background: '#2a1010', borderRadius: 8 }}>
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontSize: '0.95rem' }}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        No account? <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Sign up free</Link>
      </p>
    </AuthLayout>
  )
}

export function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()

  const handle = async e => {
    e.preventDefault()
    setError('')
    const res = await register(name, email, password)
    if (res.success) navigate('/topics')
    else setError(res.error)
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start practicing interviews for free">
      <form onSubmit={handle}>
        <Field label="Full name" value={name} onChange={setName} placeholder="Sarthak" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 6 characters" />
        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.6rem', background: '#2a1010', borderRadius: 8 }}>
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontSize: '0.95rem' }}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
      </p>
    </AuthLayout>
  )
}