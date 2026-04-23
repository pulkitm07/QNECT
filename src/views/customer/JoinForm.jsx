import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueue } from '../../context/QueueContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { insertQueueEntry } from '../../lib/supabase.js'

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
        min={type === 'number' ? 1 : undefined}
        max={type === 'number' ? 12 : undefined}
      />
      <label htmlFor={id} className="input-label">{label}</label>
    </div>
  )
}

export default function JoinForm() {
  const navigate       = useNavigate()
  const { dispatch }   = useQueue()
  const toast          = useToast()
  const [form, setForm] = useState({ name: '', phone: '', party: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const payload = { name: form.name, phone: form.phone, party: Number(form.party) }

    // Optimistic local update
    dispatch({ type: 'JOIN_QUEUE', payload })

    // Try Supabase
    await insertQueueEntry({
      name:      payload.name,
      phone:     payload.phone,
      party:     payload.party,
      status:    'waiting',
      joined_at: new Date().toISOString(),
    })

    toast('You joined the queue! 🎉')
    setLoading(false)
    navigate('/customer/status')
  }

  return (
    <main className="flex flex-col items-center justify-center flex-1 px-5 py-12 min-h-dvh">
      <div className="w-full max-w-sm">

        {/* Header */}
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-sm"
          style={{ color: '#6b7280' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold" style={{ color: '#FAF7F0' }}>Join the Queue</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>We'll text you when your table is ready</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-2" style={{ border: '1px solid #1f2937' }}>
          <FloatInput label="Your name"      id="name"  value={form.name}  onChange={set('name')}  required />
          <FloatInput label="Phone number"   id="phone" type="tel"  value={form.phone} onChange={set('phone')} required />
          <FloatInput label="Party size"     id="party" type="number" value={form.party} onChange={set('party')} required />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
            style={{ marginTop: 16 }}
          >
            {loading ? 'Joining…' : 'Join Queue →'}
          </button>
        </form>
      </div>
    </main>
  )
}
