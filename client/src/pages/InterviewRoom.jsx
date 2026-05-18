import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sessionAPI, streamChat, evaluateSession } from '../lib/api'
import { useAuthStore } from '../store/auth.store'

const TOPIC_LABELS = { dsa: 'DSA', hr: 'Behavioral', 'system-design': 'System Design' }
const TOPIC_COLORS = { dsa: '#6c63ff', hr: '#22d3ee', 'system-design': '#f59e0b' }
const DIFF_COLORS = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' }

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

function Message({ msg, isNew }) {
  const isUser = msg.role === 'user'
  return (
    <div className={isNew ? 'fade-in' : ''} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1.25rem', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.85rem', fontWeight: 700,
        background: isUser ? 'var(--accent)' : 'var(--surface2)',
        color: isUser ? '#fff' : 'var(--text-muted)',
      }}>
        {isUser ? 'Y' : 'AI'}
      </div>
      <div style={{
        maxWidth: '75%',
        background: isUser ? '#1e1a3a' : 'var(--surface)',
        border: `1px solid ${isUser ? '#3d3566' : 'var(--border)'}`,
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        padding: '0.85rem 1.1rem',
        fontSize: '0.92rem',
        lineHeight: 1.65,
      }}>
        {isUser ? (
          <p style={{ margin: 0 }}>{msg.content}</p>
        ) : (
          <div className="ai-message" dangerouslySetInnerHTML={{ __html: `<p>${formatText(msg.content)}</p>` }} />
        )}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: isUser ? 'right' : 'left' }}>
          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>AI</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px 14px 14px 4px', padding: '0.85rem 1.1rem', display: 'flex', gap: 5, alignItems: 'center' }}>
        <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
      </div>
    </div>
  )
}

function ScoreCard({ evaluation, onNewSession }) {
  const score = evaluation.score
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(6px)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '2.5rem', maxWidth: 520, width: '100%', margin: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>/ 100</div>
          <h2 style={{ fontWeight: 700, marginTop: '0.75rem', fontSize: '1.2rem' }}>Interview Complete</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.5rem', textAlign: 'center' }}>{evaluation.feedback}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#0f2a18', border: '1px solid #1a4a28', borderRadius: 12, padding: '1rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Strengths</div>
            {evaluation.strengths?.map((s, i) => <div key={i} style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>✓ {s}</div>)}
          </div>
          <div style={{ background: '#2a1010', border: '1px solid #4a1a1a', borderRadius: 12, padding: '1rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Improve</div>
            {evaluation.improvements?.map((s, i) => <div key={i} style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>→ {s}</div>)}
          </div>
        </div>
        <button onClick={onNewSession} style={{ width: '100%', padding: '0.8rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
          Practice Again →
        </button>
      </div>
    </div>
  )
}

export default function InterviewRoom() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()

  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [error, setError] = useState('')
  const [startTime] = useState(Date.now())

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    sessionAPI.getOne(sessionId).then(({ data }) => {
      setSession(data.session)
      setMessages(data.session.messages || [])
      if (!data.session.messages?.length) {
        sendMessage('Hello, I am ready to start the interview.', data.session)
      }
    }).catch(() => navigate('/topics'))
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const sendMessage = useCallback(async (text, sess = session) => {
    if (!text?.trim() || streaming || !sess) return
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }])
    setInput('')
    setStreaming(true)
    setStreamingText('')
    setError('')

    let full = ''
    await streamChat({
      sessionId: sess._id,
      userMessage: text,
      token,
      onChunk: (chunk) => { full += chunk; setStreamingText(full) },
      onDone: () => {
        setMessages(prev => [...prev, { role: 'assistant', content: full, timestamp: new Date() }])
        setStreamingText('')
        setStreaming(false)
        inputRef.current?.focus()
      },
      onError: (err) => { setError(err); setStreaming(false); setStreamingText('') },
    })
  }, [session, streaming, token])

  const handleSend = () => { if (input.trim()) sendMessage(input) }
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  const handleEndInterview = async () => {
    if (messages.length < 4) { setError('Have at least a couple exchanges before ending.'); return }
    setEvaluating(true)
    try {
      const duration = Math.floor((Date.now() - startTime) / 1000)
      const { data } = await evaluateSession(sessionId)
      await sessionAPI.complete(sessionId, { duration })
      setEvaluation(data.evaluation)
    } catch (err) {
      setError(err.response?.data?.error || 'Evaluation failed')
    } finally {
      setEvaluating(false)
    }
  }

  if (!session) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>Loading session...</div>
  )

  const topicColor = TOPIC_COLORS[session.topic]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', position: 'relative' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/topics')} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.35rem 0.75rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>← Back</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{TOPIC_LABELS[session.topic]} Interview</span>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 20, background: `${topicColor}22`, color: topicColor, fontWeight: 600 }}>{session.topic}</span>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 20, background: `${DIFF_COLORS[session.difficulty]}22`, color: DIFF_COLORS[session.difficulty], fontWeight: 600 }}>{session.difficulty}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{messages.filter(m => m.role === 'user').length} responses</div>
          </div>
        </div>
        <button
          onClick={handleEndInterview}
          disabled={evaluating || messages.length < 4}
          style={{ padding: '0.5rem 1.25rem', background: messages.length >= 4 ? '#2a1010' : 'transparent', border: `1px solid ${messages.length >= 4 ? 'var(--danger)' : 'var(--border)'}`, color: messages.length >= 4 ? 'var(--danger)' : 'var(--text-muted)', borderRadius: 8, cursor: messages.length >= 4 && !evaluating ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.875rem' }}
        >
          {evaluating ? 'Evaluating...' : 'End & Evaluate'}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', paddingBottom: '1rem' }}>
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} isNew={i === messages.length - 1 && !streaming} />
        ))}
        {streamingText && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>AI</div>
            <div style={{ maxWidth: '75%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px 14px 14px 4px', padding: '0.85rem 1.1rem', fontSize: '0.92rem', lineHeight: 1.65 }}>
              <div className="ai-message" dangerouslySetInnerHTML={{ __html: `<p>${formatText(streamingText)}</p>` }} />
              <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--accent)', marginLeft: 2, animation: 'pulse 0.8s infinite' }} />
            </div>
          </div>
        )}
        {streaming && !streamingText && <TypingIndicator />}
        {error && <div style={{ color: 'var(--danger)', padding: '0.75rem', background: '#2a1010', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '1rem 1.5rem', background: 'var(--surface)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', maxWidth: 900, margin: '0 auto' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            placeholder={streaming ? 'AI is responding...' : 'Type your answer... (Enter to send, Shift+Enter for newline)'}
            rows={3}
            style={{ flex: 1, padding: '0.75rem 1rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: '0.92rem', resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            style={{ padding: '0.75rem 1.5rem', background: input.trim() && !streaming ? 'var(--accent)' : 'var(--surface2)', color: input.trim() && !streaming ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 10, fontWeight: 700, cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed', fontSize: '0.9rem', flexShrink: 0, height: 80 }}
          >
            Send →
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Have at least 4 exchanges before ending the interview for evaluation.
        </div>
      </div>

      {evaluation && <ScoreCard evaluation={evaluation} onNewSession={() => navigate('/topics')} />}
    </div>
  )
}