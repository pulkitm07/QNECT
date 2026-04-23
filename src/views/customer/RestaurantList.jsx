import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RESTAURANTS } from '../../data/restaurants.js'
import { useQueue } from '../../context/QueueContext.jsx'

function StarRating({ rating, color = '#F5A623' }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="none">
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

function QueueBadge({ restaurantId, queue }) {
  const count = queue.filter(q => q.restaurantId === restaurantId && q.status === 'waiting').length
  if (count === 0) return (
    <span style={{ background: '#16a34a15', color: '#22c55e', border: '1px solid #22c55e30', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
      No wait
    </span>
  )
  return (
    <span style={{ background: '#F5A62315', color: '#F5A623', border: '1px solid #F5A62330', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
      {count} in queue · ~{count * 6} min
    </span>
  )
}

export default function RestaurantList() {
  const navigate = useNavigate()
  const { state } = useQueue()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    RESTAURANTS.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase())
    ), [search])

  return (
    <main className="flex flex-col flex-1 px-4 pt-8 pb-10 max-w-lg mx-auto w-full min-h-dvh">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} style={{ color: '#6b7280', padding: '6px', borderRadius: 8 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4L6 10l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--color-cream)' }}>Find a Restaurant</h1>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Browse, explore, and join the queue</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          id="restaurant-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, cuisine or area…"
          style={{
            width: '100%',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 14,
            padding: '12px 16px 12px 40px',
            fontSize: 14,
            color: 'var(--color-cream)',
            outline: 'none',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs mb-3" style={{ color: '#6b7280' }}>
        {filtered.length} {filtered.length === 1 ? 'restaurant' : 'restaurants'} {search ? `for "${search}"` : 'near you'}
      </p>

      {/* Restaurant cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span style={{ fontSize: 48 }}>🍽️</span>
          <p className="mt-3 text-sm" style={{ color: '#6b7280' }}>No restaurants found for "{search}"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r, i) => {
            const queueCount = state.queue.filter(q => q.restaurantId === r.id && q.status === 'waiting').length
            return (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: [0.22,1,0.36,1] }}
                onClick={() => navigate(`/restaurants/${r.id}`)}
                className="w-full text-left"
                style={{ display: 'block' }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
              >
                <div style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 20,
                  overflow: 'hidden',
                }}>
                  {/* Photo strip */}
                  <div style={{
                    height: 130,
                    background: r.photos[0].gradient,
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '12px 16px',
                    position: 'relative',
                  }}>
                    <span style={{ fontSize: 44, position: 'absolute', top: 16, right: 20 }}>{r.emoji}</span>
                    <QueueBadge restaurantId={r.id} queue={state.queue} />
                  </div>

                  {/* Info */}
                  <div style={{ padding: '14px 16px 16px' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-display font-semibold text-base" style={{ color: 'var(--color-cream)', lineHeight: 1.2 }}>{r.name}</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{r.cuisine}</p>
                      </div>
                      <span className="text-sm font-medium shrink-0" style={{ color: r.accentColor }}>{r.price}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1">
                        <StarRating rating={r.rating} color={r.accentColor} />
                        <span className="text-xs font-semibold" style={{ color: r.accentColor }}>{r.rating}</span>
                        <span className="text-xs" style={{ color: '#6b7280' }}>({r.reviewCount})</span>
                      </div>
                      <span style={{ color: '#374151' }}>·</span>
                      <span className="text-xs" style={{ color: '#6b7280' }}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }}>
                          <path d="M5.5 1a4 4 0 100 8 4 4 0 000-8zm0 1.5v2.25l1.5 1" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        {r.hours.split('–')[0].trim()}
                      </span>
                    </div>

                    <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: '#6b7280' }}>
                      📍 {r.address}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {r.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{
                          fontSize: 10, padding: '3px 8px', borderRadius: 20,
                          background: `${r.accentColor}12`, color: r.accentColor,
                          border: `1px solid ${r.accentColor}25`,
                        }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </main>
  )
}
