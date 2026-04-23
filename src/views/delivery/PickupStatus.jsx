import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueue } from '../../context/QueueContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { updateDeliveryStep } from '../../lib/supabase.js'
import StepTracker from '../../components/StepTracker.jsx'

export default function PickupStatus() {
  const navigate     = useNavigate()
  const toast        = useToast()
  const { logout }   = useAuth()
  const { state, dispatch } = useQueue()
  const delivery     = state.delivery
  const [copied, setCopied] = useState(false)
  const [flash, setFlash]   = useState(false)
  const prevStep = useRef(delivery?.step)

  // Flash green when step reaches 4
  useEffect(() => {
    if (delivery?.step === 4 && prevStep.current !== 4) {
      setFlash(true)
      setTimeout(() => setFlash(false), 800)
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
      toast('Token copied to clipboard ✓')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!delivery) {
    return (
      <main className="flex flex-col items-center justify-center flex-1 px-5 py-12 min-h-dvh">
        <div className="text-center">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto mb-4">
            <circle cx="40" cy="40" r="36" fill="#141414" stroke="#1f2937" strokeWidth="2"/>
            <path d="M24 40h32M40 24v32" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="40" cy="40" r="10" stroke="#f97316" strokeWidth="2"/>
          </svg>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>No active delivery session</p>
          <button className="btn-primary" onClick={() => navigate('/delivery')}>Check In →</button>
        </div>
      </main>
    )
  }

  const isReady    = delivery.step === 4
  const cardBorder = flash ? '#22c55e' : isReady ? '#22c55e44' : '#1f2937'

  return (
    <main className="flex flex-col flex-1 px-5 py-10 max-w-sm mx-auto w-full min-h-dvh">

      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/delivery')} className="flex items-center gap-2 text-sm" style={{ color: '#6b7280' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <button
          onClick={() => { logout('delivery'); toast('Signed out ✓'); navigate('/') }}
          title="Sign out"
          style={{
            padding: '6px 10px', borderRadius: 10, background: '#ef444415',
            color: '#ef4444', border: '1px solid #ef444430', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
          }}
        >
          Sign Out
        </button>
      </div>

      <h1 className="text-2xl font-display font-bold mb-6" style={{ color: '#FAF7F0' }}>Pickup Status</h1>

      {/* Token card */}
      <AnimatePresence>
        <motion.div
          key={delivery.id}
          layout
          className="card mb-5 text-center py-8"
          animate={{
            borderColor: cardBorder,
            boxShadow: flash ? '0 0 40px #22c55e66' : isReady ? '0 0 20px #22c55e22' : 'none',
          }}
          transition={{ duration: 0.3 }}
          style={{
            border: `1px solid ${cardBorder}`,
          }}
        >
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280', letterSpacing: '0.2em' }}>Your Token</p>

          {/* Stamp animation on mount */}
          <motion.div
            key={delivery.id + '-stamp'}
            initial={{ scale: 2, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="text-6xl font-display font-bold mb-2"
            style={{ color: isReady ? '#22c55e' : '#F5A623', lineHeight: 1 }}
          >
            {delivery.id}
          </motion.div>

          {/* Ripple on ready */}
          {isReady && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 16,
                border: '2px solid #22c55e',
                pointerEvents: 'none',
              }}
            />
          )}

          <p className="text-sm" style={{ color: '#6b7280' }}>{delivery.name} · {delivery.platform}</p>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Order: {delivery.order}</p>

          {isReady && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-semibold mt-3"
              style={{ color: '#22c55e' }}
            >
              🎉 Ready for pickup!
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Copy token button */}
      <button
        onClick={handleCopy}
        className="btn-outline w-full mb-4 flex items-center justify-center gap-2"
      >
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#22c55e' }}>Copied!</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 11V4a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Copy Token ID
          </>
        )}
      </button>

      {/* Step tracker */}
      <div className="card mb-5" style={{ border: '1px solid #1f2937', padding: '20px 16px' }}>
        <StepTracker currentStep={delivery.step} />
      </div>

      {/* Advance step (demo / staff action) */}
      {!isReady && (
        <button
          onClick={handleAdvance}
          className="btn-primary w-full"
        >
          Advance Step (Staff Demo) →
        </button>
      )}
    </main>
  )
}
