import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getRestaurant } from '../../data/restaurants.js'
import { useQueue } from '../../context/QueueContext.jsx'

function StarRating({ rating, color }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1l1.3 3.9H11L8.2 7.1l1 3.9L6 8.8l-3.2 2.2 1-3.9L1 4.9h3.7z"
            fill={i <= Math.round(rating) ? color : 'transparent'}
            stroke={color}
            strokeWidth="0.8"
          />
        </svg>
      ))}
    </span>
  )
}

export default function RestaurantDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { state }  = useQueue()
  const restaurant = getRestaurant(id)
  const [photoIdx, setPhotoIdx] = useState(0)

  if (!restaurant) {
    return (
      <main className="flex items-center justify-center flex-1 min-h-dvh">
        <div className="text-center">
          <p style={{ color: '#6b7280' }}>Restaurant not found.</p>
          <button className="btn-primary mt-4" onClick={() => navigate('/restaurants')}>← Back to List</button>
        </div>
      </main>
    )
  }

  const queueCount = state.queue.filter(q => q.restaurantId === restaurant.id && q.status === 'waiting').length
  const { accentColor: ac } = restaurant

  return (
    <main className="flex flex-col flex-1 min-h-dvh pb-28">

      {/* Photo carousel */}
      <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={photoIdx}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'absolute', inset: 0, background: restaurant.photos[photoIdx].gradient }}
          />
        </AnimatePresence>

        {/* Back button */}
        <button
          onClick={() => navigate('/restaurants')}
          style={{
            position: 'absolute', top: 16, left: 16,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            border: 'none', borderRadius: 10, padding: '8px 12px',
            color: '#FAF7F0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>

        {/* Photo label */}
        <div style={{
          position: 'absolute', bottom: 12, left: 16,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
          borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#FAF7F0',
        }}>
          {restaurant.photos[photoIdx].label}
        </div>

        {/* Photo dots */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 6 }}>
          {restaurant.photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setPhotoIdx(i)}
              style={{
                width: i === photoIdx ? 20 : 7, height: 7,
                borderRadius: 4, border: 'none', cursor: 'pointer',
                background: i === photoIdx ? ac : 'rgba(255,255,255,0.4)',
                transition: 'all 0.25s',
              }}
            />
          ))}
        </div>

        {/* Emoji */}
        <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 40 }}>{restaurant.emoji}</div>
      </div>

      {/* Content */}
      <div className="px-4 pt-5 max-w-lg mx-auto w-full">

        {/* Name + Queue badge */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="text-2xl font-display font-bold leading-tight" style={{ color: 'var(--color-cream)' }}>
            {restaurant.name}
          </h1>
          {queueCount > 0 ? (
            <span style={{ background: `${ac}18`, color: ac, border: `1px solid ${ac}30`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', marginTop: 4 }}>
              {queueCount} in queue
            </span>
          ) : (
            <span style={{ background: '#22c55e15', color: '#22c55e', border: '1px solid #22c55e30', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', marginTop: 4 }}>
              No wait
            </span>
          )}
        </div>

        <p className="text-sm mb-3" style={{ color: '#6b7280' }}>{restaurant.cuisine}</p>

        {/* Rating row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <StarRating rating={restaurant.rating} color={ac} />
            <span className="font-bold text-sm" style={{ color: ac }}>{restaurant.rating}</span>
            <span className="text-xs" style={{ color: '#6b7280' }}>({restaurant.reviewCount} reviews)</span>
          </div>
          <span style={{ color: '#374151' }}>·</span>
          <span className="font-semibold text-sm" style={{ color: ac }}>{restaurant.price}</span>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed mb-5" style={{ color: '#9ca3af' }}>
          {restaurant.description}
        </p>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { icon: '📍', label: 'Address', value: restaurant.address },
            { icon: '📞', label: 'Phone', value: restaurant.phone },
            { icon: '🕐', label: 'Hours', value: restaurant.hours },
            { icon: '🪑', label: 'Tables', value: `${restaurant.tables} tables` },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: '12px 14px',
            }}>
              <p className="text-xs mb-1" style={{ color: '#6b7280' }}>{item.icon} {item.label}</p>
              <p className="text-xs font-medium leading-tight" style={{ color: 'var(--color-cream)' }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Amenities */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>Amenities</p>
          <div className="flex flex-wrap gap-2">
            {restaurant.amenities.map(a => (
              <span key={a} style={{
                fontSize: 12, padding: '5px 12px', borderRadius: 20,
                background: `${ac}10`, color: ac, border: `1px solid ${ac}22`,
              }}>
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>Dining Options</p>
          <div className="flex flex-wrap gap-2">
            {restaurant.tags.map(t => (
              <span key={t} style={{
                fontSize: 12, padding: '5px 12px', borderRadius: 20,
                background: 'var(--color-surface)', color: '#9ca3af', border: '1px solid var(--color-border)',
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>
            Guest Reviews
          </p>
          <div className="space-y-3">
            {restaurant.reviews.map((rev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 14,
                  padding: '14px 16px',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: `${ac}20`, border: `1.5px solid ${ac}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: ac,
                      fontFamily: 'Clash Display, system-ui',
                    }}>
                      {rev.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-cream)' }}>{rev.name}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>{rev.date}</p>
                    </div>
                  </div>
                  <StarRating rating={rev.rating} color={ac} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>{rev.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '16px 20px 28px',
        background: 'linear-gradient(to top, var(--color-canvas) 70%, transparent)',
        zIndex: 50,
      }}>
        <div className="max-w-lg mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/customer?restaurant=${restaurant.id}`)}
            style={{
              width: '100%', padding: '16px 24px',
              background: ac, color: '#0D0D0D',
              borderRadius: 16, border: 'none',
              fontFamily: 'Clash Display, system-ui',
              fontSize: 16, fontWeight: 700,
              boxShadow: `0 6px 32px ${ac}44`,
              cursor: 'pointer',
            }}
          >
            {queueCount > 0
              ? `Reserve a Table · ~${queueCount * 6} min wait`
              : 'Reserve a Table · No wait 🎉'
            }
          </motion.button>
        </div>
      </div>
    </main>
  )
}
