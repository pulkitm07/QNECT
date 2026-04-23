import { motion, AnimatePresence } from 'framer-motion'

const STEPS = ['Received', 'Preparing', 'Ready to Pick', 'Picked Up']

export default function StepTracker({ currentStep = 1 }) {
  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between">

        {/* Background line */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '10%',
            right: '10%',
            height: 2,
            background: '#1f2937',
            transform: 'translateY(-50%)',
            zIndex: 0,
          }}
        />

        {/* Animated fill line */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '10%',
            height: 2,
            background: 'linear-gradient(90deg, #F5A623, #D98E1A)',
            transform: 'translateY(-50%)',
            zIndex: 1,
            width: `${Math.max(0, ((currentStep - 1) / (STEPS.length - 1))) * 80}%`,
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {/* Step dots */}
        {STEPS.map((label, i) => {
          const stepNum  = i + 1
          const done     = stepNum < currentStep
          const active   = stepNum === currentStep

          return (
            <div key={label} className="relative z-10 flex flex-col items-center" style={{ flex: 1 }}>
              <motion.div
                animate={{
                  scale: active ? [1, 1.2, 1] : 1,
                  boxShadow: active ? '0 0 14px #F5A62388' : 'none',
                }}
                transition={{ duration: 0.4, repeat: active ? Infinity : 0, repeatDelay: 2 }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: done ? '#F5A623' : active ? '#F5A623' : '#141414',
                  border: done || active ? '2px solid #F5A623' : '2px solid #374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  transition: 'all 0.3s ease',
                }}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#0D0D0D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 700, color: active ? '#0D0D0D' : '#6b7280' }}>
                    {stepNum}
                  </span>
                )}
              </motion.div>
              <span
                className="text-center"
                style={{
                  fontSize: 10,
                  fontWeight: active || done ? 600 : 400,
                  color: active ? '#F5A623' : done ? '#FAF7F0' : '#6b7280',
                  lineHeight: 1.3,
                  maxWidth: 60,
                }}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
