import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

const META = {
  staff: {
    label:    'Staff Portal',
    subtitle: 'Queue management & attendance',
    color:    '#60a5fa',
    hint:     'staff / qnect123',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="6" y="8" width="28" height="24" rx="4" stroke="#60a5fa" strokeWidth="2"/>
        <path d="M13 17h14M13 23h10" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  delivery: {
    label:    'Delivery Portal',
    subtitle: 'Pickup tokens & order tracking',
    color:    '#f97316',
    hint:     'delivery / deliver99',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M5 20c0-2.5 2-5 5-5h20l5 5v6H5V20z" fill="#f97316" fillOpacity="0.15" stroke="#f97316" strokeWidth="2"/>
        <circle cx="12" cy="31" r="3.5" fill="#f97316"/>
        <circle cx="30" cy="31" r="3.5" fill="#f97316"/>
        <path d="M25 15V10l7 5" stroke="#f97316" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
  },
}

function FloatInput({ label, id, type = 'text', value, onChange, required }) {
  return (
    <div className="input-wrapper">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder=" "
        className="input"
        autoComplete={type === 'password' ? 'current-password' : 'username'}
      />
      <label htmlFor={id} className="input-label">{label}</label>
    </div>
  )
}

export default function LoginScreen({ role }) {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const meta       = META[role]
  const [form, setForm]     = useState({ username: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake]   = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    // Small artificial delay to feel like a real auth request
    await new Promise(r => setTimeout(r, 600))
    const result = login(role, form.username, form.password)
    setLoading(false)
    if (result.ok) {
      navigate(role === 'staff' ? '/staff' : '/delivery')
    } else {
      setError(result.error)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center flex-1 px-5 py-12 min-h-dvh">
      <div className="w-full max-w-sm">

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-sm"
          style={{ color: '#6b7280' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </button>

        {/* Portal header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-center gap-4"
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: `${meta.color}12`,
              border: `1.5px solid ${meta.color}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {meta.icon}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold" style={{ color: '#FAF7F0' }}>
              {meta.label}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{meta.subtitle}</p>
          </div>
        </motion.div>

        {/* Form card */}
        <motion.form
          onSubmit={handleSubmit}
          animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="card space-y-2"
          style={{ border: `1px solid ${error ? '#ef444430' : '#1f2937'}` }}
        >
          <FloatInput
            label="Username"
            id={`${role}-username`}
            value={form.username}
            onChange={set('username')}
            required
          />
          <FloatInput
            label="Password"
            id={`${role}-password`}
            type="password"
            value={form.password}
            onChange={set('password')}
            required
          />

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm"
              style={{ color: '#ef4444', paddingTop: 4 }}
            >
              ⚠ {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn w-full mt-2"
            style={{
              background: meta.color,
              color: '#0D0D0D',
              fontWeight: 700,
              marginTop: 16,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Verifying…' : `Sign in to ${meta.label} →`}
          </button>
        </motion.form>

        {/* Demo hint */}
        <p className="text-xs text-center mt-5" style={{ color: '#374151' }}>
          Demo credentials: <span style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>{meta.hint}</span>
        </p>
      </div>
    </main>
  )
}
