import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useSpring, useMotionValue, animate } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useQueue } from '../../context/QueueContext.jsx'

const NEARBY = [
  { emoji: '💊', label: 'MedPlus Pharmacy',  dist: '3 min walk',  color: '#22c55e' },
  { emoji: '☕', label: 'Blue Tokai Coffee', dist: '5 min walk',  color: '#F5A623' },
  { emoji: '🏧', label: 'HDFC ATM',          dist: '2 min walk',  color: '#60a5fa' },
]

function AnimatedPosition({ position }) {
  const motionVal = useMotionValue(position)
  const spring    = useSpring(motionVal, { stiffness: 100, damping: 20 })
  const [display, setDisplay] = useState(position)

  useEffect(() => { motionVal.set(position) }, [position, motionVal])
  useEffect(() => spring.on('change', v => setDisplay(Math.round(v))), [spring])

  return <span>{display}</span>
}

export default function QueueStatus() {
  const navigate         = useNavigate()
  const { state, getPosition, getWaitMins } = useQueue()
  const { customer }     = state
  const confettiFired    = useRef(false)

  const position = customer ? getPosition(customer.id) : null
  const waitMins = customer ? getWaitMins(customer.id) : 0
  const total    = state.queue.length || 1
  const progress = position ? Math.max(0, (1 - (position - 1) / total) * 100) : 100

  useEffect(() => {
    if (position === 1 && !confettiFired.current) {
      confettiFired.current = true
      const prefersRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!prefersRM) {
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.5 }, colors: ['#F5A623', '#FAF7F0', '#ffffff'] })
      }
    }
  }, [position])

  if (!customer) {
    return (
      <main className="flex flex-col items-center justify-center flex-1 px-5 py-12 min-h-dvh">
        <div className="text-center">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto mb-4">
            <circle cx="40" cy="40" r="36" fill="#141414" stroke="#1f2937" strokeWidth="2"/>
            <path d="M28 40h24M40 28v24" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="40" cy="40" r="8" stroke="#F5A623" strokeWidth="2"/>
          </svg>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>No active queue session</p>
          <button className="btn-primary" onClick={() => navigate('/customer')}>Join Queue →</button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col flex-1 px-5 py-10 min-h-dvh max-w-sm mx-auto w-full">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold" style={{ color: '#FAF7F0' }}>Your Queue Status</h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Hi {customer.name} 👋</p>
      </div>

      {/* Position card */}
      <div
        className="card mb-4 text-center py-8"
        style={{ border: position === 1 ? '1px solid #F5A623' : '1px solid #1f2937' }}
      >
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280', letterSpacing: '0.2em' }}>Queue Position</p>
        <div className="text-8xl font-display font-bold" style={{ color: '#F5A623', lineHeight: 1 }}>
          {position !== null ? <AnimatedPosition position={position} /> : '—'}
        </div>
        {position === 1 && (
          <p className="mt-3 text-sm font-medium" style={{ color: '#F5A623' }}>🎉 You're next! Get ready.</p>
        )}

        {/* Progress bar */}
        <div className="mt-6 rounded-full overflow-hidden" style={{ height: 6, background: '#1f2937' }}>
          <div
            className={`h-full rounded-full transition-all duration-700 ${position !== 1 ? 'shimmer-bg' : ''}`}
            style={{
              width: `${progress}%`,
              background: position === 1 ? '#22c55e' : 'linear-gradient(90deg, #F5A623, #D98E1A)',
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: '#6b7280' }}>~{waitMins} min estimated wait</p>
      </div>

      {/* Party info */}
      <div className="card mb-6" style={{ border: '1px solid #1f2937' }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: '#6b7280' }}>Party size</span>
          <span style={{ color: '#FAF7F0', fontWeight: 600 }}>{customer.party} guests</span>
        </div>
      </div>

      {/* Nearby exploration */}
      {waitMins > 5 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>
            You have ~{waitMins} min — explore nearby
          </p>
          <div className="space-y-2">
            {NEARBY.map((poi, i) => (
              <motion.div
                key={poi.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card flex items-center gap-4"
                style={{ border: '1px solid #1f2937', padding: '12px 16px' }}
              >
                <span className="text-2xl">{poi.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#FAF7F0' }}>{poi.label}</p>
                  <p className="text-xs" style={{ color: poi.color }}>{poi.dist}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="btn-outline mt-8"
      >
        ← Back to Home
      </button>
    </main>
  )
}
