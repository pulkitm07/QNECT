import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const ROLES = [
  {
    key:   'customer',
    label: 'Customer',
    sub:   'Join the queue remotely',
    path:  '/customer',
    badge: null,
    color: '#F5A623',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="10" r="5" fill="#F5A623" fillOpacity="0.9"/>
        <path d="M6 30c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    shape: (
      <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="90" fill="#F5A623"/>
      </svg>
    ),
  },
  {
    key:   'staff',
    label: 'Staff',
    sub:   'Manage queue & attendance',
    path:  '/staff/login',
    badge: 'Login required',
    color: '#60a5fa',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect x="6" y="8" width="24" height="20" rx="3" stroke="#60a5fa" strokeWidth="2.5"/>
        <path d="M12 16h12M12 22h8" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    shape: (
      <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 200 200" fill="none">
        <polygon points="100,10 190,170 10,170" fill="#60a5fa"/>
      </svg>
    ),
  },
  {
    key:   'delivery',
    label: 'Delivery',
    sub:   'Pickup check-in & token',
    path:  '/delivery/login',
    badge: 'Login required',
    color: '#f97316',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M4 18c0-2 2-4 4-4h16l4 4v5H4V18z" fill="#f97316" fillOpacity="0.2" stroke="#f97316" strokeWidth="2"/>
        <circle cx="10" cy="27" r="3" fill="#f97316"/>
        <circle cx="26" cy="27" r="3" fill="#f97316"/>
        <path d="M20 14V9l6 5" stroke="#f97316" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    shape: (
      <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 200 200" fill="none">
        <polygon points="100,10 181.5,55 181.5,145 100,190 18.5,145 18.5,55" fill="#f97316"/>
      </svg>
    ),
  },
]

/* Typewriter hook */
function useTypewriter(text, speed = 90) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return displayed
}

/* Animated counter */
function AnimCounter({ target, duration = 1800 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setVal(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return <span>{val}</span>
}

export default function Landing() {
  const navigate  = useNavigate()
  const brand     = useTypewriter('Qnect', 110)
  const prefersRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const card = {
    hidden:  { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    }),
  }

  return (
    <main className="flex flex-col items-center justify-center flex-1 px-5 py-16 min-h-dvh" style={{ background: '#0D0D0D' }}>

      {/* Hero */}
      <div className="mb-2 text-center">
        <h1 className="text-6xl font-display font-bold tracking-tight" style={{ color: '#FAF7F0', letterSpacing: '-2px' }}>
          {prefersRM ? 'Qnect' : (
            <>
              {brand.slice(0, 1)}
              <span style={{ color: '#F5A623' }}>{brand.slice(1)}</span>
              <span style={{ opacity: brand.length < 5 ? 1 : 0, transition: 'opacity 0.3s', color: '#F5A623' }}>|</span>
            </>
          )}
        </h1>
        <p className="text-sm mt-3" style={{ color: '#6b7280' }}>Smart queue management for restaurants</p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg mt-12">
        {ROLES.map((role, i) => (
          <motion.button
            key={role.key}
            custom={i}
            variants={prefersRM ? {} : card}
            initial={prefersRM ? {} : 'hidden'}
            animate={prefersRM ? {} : 'visible'}
            onClick={() => navigate(role.path)}
            className="card text-left cursor-pointer relative"
            style={{
              borderTop: `2px solid ${role.color}`,
              minHeight: 140,
            }}
            whileHover={{ scale: 1.03, boxShadow: `0 0 0 1px ${role.color}33` }}
            whileTap={{ scale: 0.97 }}
          >
            {role.shape}
            <div className="relative z-10">
              <div className="mb-4">{role.icon}</div>
              <div className="font-display font-semibold text-base" style={{ color: '#FAF7F0' }}>{role.label}</div>
              <div className="text-xs mt-1" style={{ color: '#6b7280' }}>{role.sub}</div>
              {role.badge && (
                <div
                  className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: `${role.color}18`, color: role.color, border: `1px solid ${role.color}30` }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <rect x="1" y="4" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M3 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {role.badge}
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Live ticker */}
      <div
        className="mt-14 w-full max-w-lg rounded-2xl py-3 px-5 flex flex-wrap items-center justify-center gap-4 text-xs"
        style={{ background: '#141414', border: '1px solid #1f2937', color: '#6b7280' }}
      >
        <span>
          <span style={{ color: '#F5A623', fontWeight: 700 }}><AnimCounter target={127} /></span> guests served today
        </span>
        <span style={{ color: '#374151' }}>·</span>
        <span>
          <span style={{ color: '#F5A623', fontWeight: 700 }}><AnimCounter target={3} /></span> tables turning over
        </span>
        <span style={{ color: '#374151' }}>·</span>
        <span>
          avg wait <span style={{ color: '#F5A623', fontWeight: 700 }}><AnimCounter target={11} /></span> min
        </span>
      </div>

      <p className="text-xs mt-6" style={{ color: '#374151' }}>Tap your role to continue</p>
    </main>
  )
}
