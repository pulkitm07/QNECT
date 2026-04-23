import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueue } from '../../context/QueueContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { insertQueueEntry } from '../../lib/supabase.js'
import { getRestaurant, RESTAURANTS } from '../../data/restaurants.js'

function FloatInput({ label, id, type = 'text', value, onChange, required, min, max }) {
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
        min={min}
        max={max}
      />
      <label htmlFor={id} className="input-label">{label}</label>
    </div>
  )
}

export default function JoinForm() {
  const navigate         = useNavigate()
  const { dispatch }     = useQueue()
  const toast            = useToast()
  const [searchParams]   = useSearchParams()
  const restaurantId     = searchParams.get('restaurant') || RESTAURANTS[0].id
  const restaurant       = getRestaurant(restaurantId)
  const [form, setForm]  = useState({ name: '', phone: '', party: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const payload = { name: form.name, phone: form.phone, party: Number(form.party), restaurantId }
    dispatch({ type: 'JOIN_QUEUE', payload })
    await insertQueueEntry({
      name: payload.name, phone: payload.phone, party: payload.party,
      status: 'waiting', joined_at: new Date().toISOString(), restaurant_id: restaurantId,
    })
    toast('You joined the queue! 🎉')
    setLoading(false)
    navigate('/customer/status')
  }

  return (
    <main className="flex flex-col items-center justify-center flex-1 px-5 py-12 min-h-dvh">
      <div className="w-full max-w-sm">

        {/* Back */}
        <button onClick={() => navigate(restaurant ? `/restaurants/${restaurantId}` : '/restaurants')}
          className="mb-8 flex items-center gap-2 text-sm" style={{ color: '#6b7280' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>

        {/* Restaurant context banner */}
        {restaurant && (
          <div style={{
            background: `${restaurant.accentColor}12`,
            border: `1px solid ${restaurant.accentColor}30`,
            borderRadius: 14, padding: '12px 16px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>{restaurant.emoji}</span>
            <div>
              <p className="text-sm font-display font-semibold" style={{ color: 'var(--color-cream)' }}>{restaurant.name}</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>{restaurant.cuisine}</p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--color-cream)' }}>Reserve a Table</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>We'll SMS you when your table is ready</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-2" style={{ border: '1px solid var(--color-border)' }}>
          <FloatInput label="Your name"    id="name"  value={form.name}  onChange={set('name')}  required />
          <FloatInput label="Phone number" id="phone" type="tel" value={form.phone} onChange={set('phone')} required />
          <FloatInput label="Party size"   id="party" type="number" value={form.party} onChange={set('party')} required min="1" max="12" />

          <button type="submit" disabled={loading} className="btn-primary w-full" style={{ marginTop: 16 }}>
            {loading ? 'Joining…' : 'Join Queue →'}
          </button>
        </form>

        <p className="text-xs text-center mt-4" style={{ color: '#374151' }}>
          📱 A confirmation SMS will be sent to your number
        </p>
      </div>
    </main>
  )
}
