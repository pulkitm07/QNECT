import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx.addToast
}

function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          style={{
            pointerEvents: 'auto',
            background: t.type === 'error' ? '#7f1d1d' : '#1A1A1A',
            color: t.type === 'error' ? '#fca5a5' : '#FAF7F0',
            border: `1px solid ${t.type === 'error' ? '#991b1b' : '#374151'}`,
            borderLeft: `3px solid ${t.type === 'error' ? '#ef4444' : '#F5A623'}`,
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            animation: 'slide-up 0.2s ease-out',
            whiteSpace: 'nowrap',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
