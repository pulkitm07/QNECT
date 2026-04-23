import { RESTAURANTS } from '../../data/restaurants.js'
import { useQueue } from '../../context/QueueContext.jsx'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const mockTraffic = [2,1,1,1,1,2,3,5,7,8,7,8,9,8,7,6,8,9,8,7,5,4,3,2]

const getColor = (val, max) => {
  const r = val / max
  if (r < 0.4) return '#22c55e'
  if (r < 0.7) return '#F5A623'
  return '#ef4444'
}

function BarChart({ data, labels, color = '#F5A623', height = 80 }) {
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: '100%',
              height: `${(v / max) * (height - 20)}px`,
              background: Array.isArray(color) ? color[i] : color,
              borderRadius: 4,
              transition: 'height 0.5s ease',
              opacity: 0.85,
            }}
          />
          {labels && <span style={{ fontSize: 9, color: '#6b7280', whiteSpace: 'nowrap' }}>{labels[i]}</span>}
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { state } = useQueue()
  const hour = new Date().getHours()
  const max  = Math.max(...mockTraffic)

  // Fake daily admit data
  const dailyAdmits = [34, 41, 28, 55, 62, 48, 70]
  const dayLabels   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const avgWaitByDay = [8, 9, 7, 11, 13, 10, 12]

  // Per-restaurant queue stats
  const restStats = RESTAURANTS.map(r => ({
    ...r,
    queueNow: state.queue.filter(q => q.restaurantId === r.id && q.status === 'waiting').length,
  }))

  return (
    <main className="flex flex-col flex-1 px-4 pt-8 pb-10 max-w-lg mx-auto w-full min-h-dvh">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--color-cream)' }}>Analytics</h1>
        <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Daily performance overview</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Admits Today', value: 70, color: '#22c55e' },
          { label: 'Avg Wait', value: `${state.avgWait}m`, color: '#F5A623' },
          { label: 'In Queue', value: state.queue.filter(q => q.status === 'waiting').length, color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="card text-center py-3" style={{ border: '1px solid var(--color-border)' }}>
            <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Foot traffic heatmap */}
      <div className="card mb-4" style={{ border: '1px solid var(--color-border)', padding: '16px' }}>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>Foot Traffic · Today</p>
        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 48 }}>
          {mockTraffic.map((val, i) => (
            <div key={i} title={`${i}:00 — ${val} guests`} style={{
              flex: 1, height: `${(val / max) * 100}%`,
              borderRadius: 3,
              background: getColor(val, max),
              opacity: i === hour ? 1 : 0.45,
              outline: i === hour ? '2px solid var(--color-cream)' : 'none',
              outlineOffset: 1,
              cursor: 'default',
              transition: 'height 0.4s ease',
            }} />
          ))}
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: '#374151' }}>
          <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
        </div>
      </div>

      {/* Weekly admits */}
      <div className="card mb-4" style={{ border: '1px solid var(--color-border)', padding: '16px' }}>
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>Weekly Admits</p>
        <BarChart data={dailyAdmits} labels={dayLabels} color="#F5A623" height={80} />
      </div>

      {/* Avg wait by day */}
      <div className="card mb-4" style={{ border: '1px solid var(--color-border)', padding: '16px' }}>
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>Avg Wait (mins) by Day</p>
        <BarChart data={avgWaitByDay} labels={dayLabels} color="#60a5fa" height={80} />
      </div>

      {/* Per-restaurant breakdown */}
      <div className="card" style={{ border: '1px solid var(--color-border)', padding: '16px' }}>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>Live Queue by Outlet</p>
        <div className="space-y-3">
          {restStats.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>{r.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-cream)' }}>{r.name}</span>
                  <span className="text-xs font-bold" style={{ color: r.accentColor }}>{r.queueNow} waiting</span>
                </div>
                <div style={{ height: 5, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.min((r.queueNow / 10) * 100, 100)}%`,
                    background: r.accentColor, borderRadius: 3, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
