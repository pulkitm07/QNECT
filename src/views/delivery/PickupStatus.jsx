import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueue } from '../../context/QueueContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { updateDeliveryStep } from '../../lib/supabase.js'
import { playChime } from '../../lib/utils.js'
import StepTracker from '../../components/StepTracker.jsx'

/* Expected minutes per step for ETA countdown */
const STEP_MINS = [0, 8, 6, 5, 0] // step 1→2: 8min, 2→3: 6min, 3→4: 5min

function useCountdown(delivery) {
  const [remaining, setRemaining] = useState(null)
  useEffect(() => {
    if (!delivery || delivery.step >= 4) { setRemaining(null); return }
    const expectedTotal = STEP_MINS.slice(delivery.step).reduce((a, b) => a + b, 0)
    const elapsed       = Math.floor((Date.now() - (delivery.checkedInAt || Date.now())) / 60000)
    const initial       = Math.max(0, expectedTotal - elapsed)
    setRemaining(initial * 60) // in seconds
    const id = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000)
    return () => clearInterval(id)
  }, [delivery?.step, delivery?.id])
  return remaining
}

export default function PickupStatus() {
  const navigate   = useNavigate()
  const toast      = useToast()
  const { logout } = useAuth()
  const { state, dispatch } = useQueue()
  const delivery   = state.delivery
  const [copied, setCopied] = useState(false)
  const [flash, setFlash]   = useState(false)
  const prevStep   = useRef(delivery?.step)
  const remaining  = useCountdown(delivery)

  useEffect(() => {
    if (delivery?.step === 4 && prevStep.current !== 4) {
      setFlash(true)
      playChime('ready')
      setTimeout(() => setFlash(false), 1000)
    }
    prevStep.current = delivery?.step
  }, [delivery?.step])

  const handleAdvance = async () => {
    if (!delivery || delivery.step >= 4) return
    dispatch({ type: 'DELIVERY_ADVANCE', id: delivery.id })
    await updateDeliveryStep(delivery.id, delivery.step + 1)
    if (delivery.step + 1 === 4) toast('Order ready for pickup! ✓')
    else toast('Step advanced ✓')
  }

  const handleCopy = () => {
    if (!delivery) return
    navigator.clipboard.writeText(delivery.id).then(() => {
      setCopied(true)
      toast('Token copied ✓')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const fmtTime = (secs) => {
    if (secs === null) return null
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  if (!delivery) {
    return (
      <main className="flex flex-col items-center justify-center flex-1 px-5 py-12 min-h-dvh">
        <div className="text-center">
          <span style={{ fontSize: 64, display: 'block', marginBottom: 12 }}>🛵</span>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>No active delivery session</p>
          <button className="btn-primary" onClick={() => navigate('/delivery')}>Check In →</button>
        </div>
      </main>
    )
  }

  const isReady    = delivery.step === 4
  const cardBorder = flash ? '#22c55e' : isReady ? '#22c55e55' : 'var(--color-border)'

  return (
    <main className="flex flex-col flex-1 px-5 py-10 max-w-sm mx-auto w-full min-h-dvh">

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <button onClick={() => navigate('/delivery')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#6b7280' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <button
          onClick={() => { logout('delivery'); toast('Signed out ✓'); navigate('/') }}
          style={{ padding: '6px 12px', borderRadius: 10, background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
        >
          Sign Out
        </button>
      </div>

      <h1 className="font-display font-bold text-2xl mb-5" style={{ color: 'var(--color-cream)' }}>Pickup Status</h1>

      {/* Token card */}
      <motion.div
        layout
        className="card mb-4 text-center py-8"
        animate={{ borderColor: cardBorder, boxShadow: flash ? '0 0 40px #22c55e66' : isReady ? '0 0 20px #22c55e22' : 'none' }}
        transition={{ duration: 0.3 }}
        style={{ border: `1px solid ${cardBorder}`, position: 'relative', overflow: 'hidden' }}
      >
        <p style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>Your Token</p>

        <motion.div
          key={delivery.id + '-stamp'}
          initial={{ scale: 2, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          style={{ fontSize: 64, fontFamily: 'Clash Display', fontWeight: 700, color: isReady ? '#22c55e' : '#F5A623', lineHeight: 1, marginBottom: 8 }}
        >
          {delivery.id}
        </motion.div>

        {isReady && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 1.2 }}
            style={{ position: 'absolute', inset: 0, borderRadius: 16, border: '2px solid #22c55e', pointerEvents: 'none' }}
          />
        )}

        <p style={{ fontSize: 14, color: '#6b7280' }}>{delivery.name} · {delivery.platform}</p>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Order: {delivery.order}</p>

        {/* ETA Countdown */}
        {!isReady && remaining !== null && (
          <div style={{ marginTop: 12, background: '#F5A62315', borderRadius: 10, padding: '8px 16px', display: 'inline-block' }}>
            <p style={{ fontSize: 12, color: '#F5A623', fontWeight: 700 }}>
              ⏱ Ready in ~{fmtTime(remaining)}
            </p>
          </div>
        )}

        {isReady && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: 14, fontWeight: 600, color: '#22c55e', marginTop: 10 }}>
            🎉 Ready for pickup!
          </motion.p>
        )}
      </motion.div>

      {/* Copy token */}
      <button
        onClick={handleCopy}
        className="btn-outline w-full mb-4"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {copied ? (
          <><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><span style={{ color: '#22c55e' }}>Copied!</span></>
        ) : (
          <><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 11V4a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>Copy Token ID</>
        )}
      </button>

      {/* Step tracker */}
      <div className="card mb-5" style={{ border: '1px solid var(--color-border)', padding: '20px 16px' }}>
        <StepTracker currentStep={delivery.step} />
      </div>

      {!isReady && (
        <button onClick={handleAdvance} className="btn-primary w-full">
          Advance Step (Staff Demo) →
        </button>
      )}
    </main>
  )
}
