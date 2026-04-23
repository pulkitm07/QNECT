import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useQueue } from '../../context/QueueContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { playChime } from '../../lib/utils.js'
import { getRestaurant } from '../../data/restaurants.js'

const NEARBY = [
  { emoji: '💊', label: 'MedPlus Pharmacy', dist: '3 min walk', color: '#22c55e' },
  { emoji: '☕', label: 'Blue Tokai Coffee', dist: '5 min walk', color: '#F5A623' },
  { emoji: '🏧', label: 'HDFC ATM',          dist: '2 min walk', color: '#60a5fa' },
]

function AnimatedPosition({ position }) {
  const [display, setDisplay] = useState(position)
  const prev = useRef(position)
  useEffect(() => {
    if (position === prev.current) return
    const start    = prev.current
    const end      = position
    const duration = 500
    const startTs  = performance.now()
    const step = (ts) => {
      const t   = Math.min((ts - startTs) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(start + (end - start) * ease))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
    prev.current = position
  }, [position])
  return <span>{display}</span>
}

export default function QueueStatus() {
  const navigate = useNavigate()
  const toast    = useToast()
  const { state, dispatch, getPosition, getWaitMins } = useQueue()
  const { customer } = state
  const confettiFired = useRef(false)
  const prevPosition  = useRef(null)
  const [arrivedSent, setArrivedSent] = useState(false)

  const restaurant = customer ? getRestaurant(customer.restaurantId) : null
  const position   = customer ? getPosition(customer.id) : null
  const waitMins   = customer ? getWaitMins(customer.id) : 0
  const restQueue  = state.queue.filter(q => q.restaurantId === customer?.restaurantId)
  const total      = restQueue.length || 1
  const progress   = position ? Math.max(0, (1 - (position - 1) / total) * 100) : 100

  // Sound + confetti at #1
  useEffect(() => {
    if (position === 1 && prevPosition.current !== 1) {
      const prefersRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!prefersRM) {
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.5 }, colors: ['#F5A623', '#FAF7F0', '#fff'] })
      }
      if (!confettiFired.current) {
        confettiFired.current = true
        playChime('ready')
      }
    }
    prevPosition.current = position
  }, [position])

  const handleArrived = () => {
    if (!customer || arrivedSent) return
    dispatch({ type: 'CUSTOMER_ARRIVED', id: customer.id })
    setArrivedSent(true)
    toast("You're marked as arrived! Staff will seat you shortly 🪑")
    playChime('success')
  }

  const ac = restaurant?.accentColor || '#F5A623'

  if (!customer) {
    return (
      <main className="flex flex-col items-center justify-center flex-1 px-5 py-12 min-h-dvh">
        <div className="text-center">
          <span style={{ fontSize: 56, display: 'block', marginBottom: 16 }}>🍽️</span>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>No active queue session</p>
          <button className="btn-primary" onClick={() => navigate('/restaurants')}>Find a Restaurant →</button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col flex-1 px-5 py-10 min-h-dvh max-w-sm mx-auto w-full">

      {/* Restaurant header */}
      {restaurant && (
        <div className="flex items-center gap-3 mb-6">
          <span style={{ fontSize: 28 }}>{restaurant.emoji}</span>
          <div>
            <h1 className="text-lg font-display font-bold" style={{ color: 'var(--color-cream)' }}>{restaurant.name}</h1>
            <p className="text-xs" style={{ color: '#6b7280' }}>Queue Status · Hi {customer.name} 👋</p>
          </div>
        </div>
      )}

      {/* Position card */}
      <div className="card mb-4 text-center py-8" style={{ border: `1px solid ${position === 1 ? ac : 'var(--color-border)'}`, position: 'relative', overflow: 'hidden' }}>
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280', letterSpacing: '0.2em' }}>Queue Position</p>
        <div className="text-8xl font-display font-bold" style={{ color: ac, lineHeight: 1 }}>
          {position !== null ? <AnimatedPosition position={position} /> : '—'}
        </div>
        {position === 1 && <p className="mt-3 text-sm font-semibold" style={{ color: ac }}>🎉 You're next! Get ready.</p>}

        {/* Progress bar */}
        <div className="mt-6 rounded-full overflow-hidden" style={{ height: 6, background: '#1f2937' }}>
          <div
            className={position !== 1 ? 'shimmer-bg' : ''}
            style={{
              height: '100%', width: `${progress}%`, borderRadius: 9999,
              background: position === 1 ? '#22c55e' : `linear-gradient(90deg, ${ac}, ${ac}cc)`,
              transition: 'width 0.8s ease',
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
          ~{waitMins} min estimated wait
        </p>
      </div>

      {/* Info row */}
      <div className="card mb-4" style={{ border: '1px solid var(--color-border)' }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: '#6b7280' }}>Party size</span>
          <span style={{ color: 'var(--color-cream)', fontWeight: 600 }}>{customer.party} guests</span>
        </div>
      </div>

      {/* I'm Here button */}
      {!arrivedSent && position !== null && position <= 3 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleArrived}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: `1.5px solid ${ac}`,
            background: `${ac}15`, color: ac, fontWeight: 700, fontSize: 15,
            fontFamily: 'Clash Display, system-ui', cursor: 'pointer', marginBottom: 16,
          }}
        >
          👋 I'm Here — Notify Staff
        </motion.button>
      )}
      {arrivedSent && (
        <div style={{ background: '#22c55e15', border: '1px solid #22c55e30', borderRadius: 14, padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
          <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>✓ Staff notified you've arrived</p>
        </div>
      )}

      {/* Nearby while you wait */}
      {waitMins > 5 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>
            You have ~{waitMins} min — explore nearby
          </p>
          <div className="space-y-2">
            {NEARBY.map((poi, i) => (
              <motion.div key={poi.label}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card flex items-center gap-4"
                style={{ border: '1px solid var(--color-border)', padding: '12px 16px' }}
              >
                <span className="text-2xl">{poi.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-cream)' }}>{poi.label}</p>
                  <p className="text-xs" style={{ color: poi.color }}>{poi.dist}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => navigate('/restaurants')} className="btn-outline mt-8">
        ← Browse Restaurants
      </button>
    </main>
  )
}
