import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueue } from '../../context/QueueContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { insertDelivery } from '../../lib/supabase.js'

const PLATFORMS = ['Zomato', 'Swiggy', 'Dunzo', 'Other']

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
      />
      <label htmlFor={id} className="input-label">{label}</label>
    </div>
  )
}

export default function CheckIn() {
  const navigate     = useNavigate()
  const { dispatch } = useQueue()
  const toast        = useToast()
  const [form, setForm] = useState({ order: '', name: '', platform: 'Zomato' })
  const [loading, setLoading]   = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    dispatch({ type: 'DELIVERY_CHECKIN', payload: form })
    await insertDelivery({ order: form.order, name: form.name, platform: form.platform, step: 1 })
    toast('Checked in! Token assigned ✓')
    setLoading(false)
    navigate('/delivery/status')
  }

  return (
    <main className="flex flex-col items-center justify-center flex-1 px-5 py-12 min-h-dvh">
      <div className="w-full max-w-sm">

        <button onClick={() => navigate('/')} className="mb-8 flex items-center gap-2 text-sm" style={{ color: '#6b7280' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold" style={{ color: '#FAF7F0' }}>Delivery Check-In</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Get your pickup token</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-2" style={{ border: '1px solid #1f2937' }}>
          <FloatInput label="Order ID (e.g. ZMT-3310)" id="order" value={form.order} onChange={set('order')} required />
          <FloatInput label="Your name" id="dname" value={form.name} onChange={set('name')} required />

          <div className="input-wrapper">
            <select
              id="platform"
              value={form.platform}
              onChange={set('platform')}
              className="input"
              style={{ cursor: 'pointer', color: form.platform ? '#FAF7F0' : '#6b7280' }}
            >
              {PLATFORMS.map(p => <option key={p} value={p} style={{ background: '#1A1A1A' }}>{p}</option>)}
            </select>
            <label htmlFor="platform" className="input-label" style={{ top: 4, fontSize: 12, color: '#6b7280' }}>Platform</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            style={{ marginTop: 16 }}
          >
            {loading ? 'Checking in…' : 'Get Token →'}
          </button>
        </form>
      </div>
    </main>
  )
}
