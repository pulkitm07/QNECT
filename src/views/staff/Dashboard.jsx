import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueue } from '../../context/QueueContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { updateQueueStatus } from '../../lib/supabase.js'
import { playChime, notifyViaSMS } from '../../lib/utils.js'
import { RESTAURANTS } from '../../data/restaurants.js'

/* ── Heatmap ── */
const mockTraffic = [2,1,1,1,1,2,3,5,7,8,7,8,9,8,7,6,8,9,8,7,5,4,3,2]
function Heatmap() {
  const hour = new Date().getHours()
  const max  = Math.max(...mockTraffic)
  const getColor = (v) => { const r = v/max; return r < 0.4 ? '#22c55e' : r < 0.7 ? '#F5A623' : '#ef4444' }
  return (
    <div className="card mb-4" style={{ border: '1px solid var(--color-border)', padding: '16px' }}>
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>Foot Traffic · Today</p>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 40 }}>
        {mockTraffic.map((val, i) => (
          <div key={i} title={`${i}:00`} style={{
            flex: 1, height: `${(val/max)*100}%`, borderRadius: 3,
            background: getColor(val), opacity: i === hour ? 1 : 0.45,
            outline: i === hour ? '2px solid var(--color-cream)' : 'none', outlineOffset: 1,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#374151' }}>
        <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
      </div>
    </div>
  )
}

/* ── Table Floor Plan ── */
function TableGrid({ tables, dispatch }) {
  const statusColor = { empty: '#22c55e', occupied: '#ef4444', reserved: '#F5A623' }
  const statusLabel = { empty: 'Empty', occupied: 'Occupied', reserved: 'Reserved' }
  const cycleStatus = (t) => {
    const next = { empty: 'reserved', reserved: 'occupied', occupied: 'empty' }[t.status]
    dispatch({ type: 'SET_TABLE_STATUS', id: t.id, status: next })
  }
  return (
    <div className="card mb-4" style={{ border: '1px solid var(--color-border)', padding: '16px' }}>
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>Floor Plan</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {tables.map(t => (
          <button
            key={t.id}
            onClick={() => cycleStatus(t)}
            title={`${t.label} · ${t.seats} seats · ${statusLabel[t.status]}`}
            style={{
              background: `${statusColor[t.status]}18`,
              border: `1.5px solid ${statusColor[t.status]}55`,
              borderRadius: 10, padding: '8px 4px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              transition: 'all 0.2s',
            }}
          >
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <rect x="1" y="4" width="20" height="8" rx="2" fill={`${statusColor[t.status]}40`} stroke={statusColor[t.status]} strokeWidth="1.5"/>
              <rect x="3" y="1" width="4" height="4" rx="1" fill={statusColor[t.status]}/>
              <rect x="15" y="1" width="4" height="4" rx="1" fill={statusColor[t.status]}/>
              <rect x="3" y="11" width="4" height="4" rx="1" fill={statusColor[t.status]}/>
              <rect x="15" y="11" width="4" height="4" rx="1" fill={statusColor[t.status]}/>
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[t.status] }}>{t.label}</span>
            <span style={{ fontSize: 9, color: '#6b7280' }}>{t.seats}p</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
        {Object.entries(statusColor).map(([s, c]) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            <span style={{ fontSize: 10, color: '#6b7280' }}>{statusLabel[s]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Sortable Queue Card ── */
function SortableCard({ guest, onAdmit, onNotify, onCancel }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: guest.id })
  const waited = Math.round((Date.now() - guest.joinedAt) / 60000)

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 'auto' }}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
        className="card mb-3"
        style={{ border: guest.arrived ? '1px solid #22c55e' : guest.notified ? '1px solid #F5A623' : '1px solid var(--color-border)', padding: '14px 16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <button {...attributes} {...listeners} style={{ color: '#374151', touchAction: 'none', padding: '2px', cursor: 'grab', marginTop: 2 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              {[4,8,12].flatMap(y => [5,11].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="currentColor"/>))}
            </svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 14, color: 'var(--color-cream)' }}>{guest.name}</span>
              {guest.arrived && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#22c55e15', color: '#22c55e', border: '1px solid #22c55e30' }}>Arrived ✓</span>}
              {guest.notified && !guest.arrived && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#F5A62315', color: '#F5A623', border: '1px solid #F5A62330' }}>Notified</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#6b7280' }}>
              <span>👥 {guest.party}</span>
              <span>⏱ {waited}m</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onNotify(guest.id)} title="Notify" style={{ color: '#F5A623', padding: 6, borderRadius: 8, background: '#F5A62315', border: 'none', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 016 6v3l1.5 2.5H2.5L4 11V8a6 6 0 016-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z" fill="currentColor"/></svg>
            </button>
            <button onClick={() => onAdmit(guest.id)} title="Admit" style={{ color: '#22c55e', padding: 6, borderRadius: 8, background: '#22c55e15', border: 'none', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M4 10l5 5L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => onCancel(guest.id)} title="Cancel" style={{ color: '#ef4444', padding: 6, borderRadius: 8, background: '#ef444415', border: 'none', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Dashboard ── */
export default function Dashboard() {
  const navigate = useNavigate()
  const toast    = useToast()
  const { logout }  = useAuth()
  const { state, dispatch, realtimeConnected } = useQueue()
  const { queue, seated, avgWait, tables, selectedRestId } = state
  const [bulkNotifying, setBulkNotifying] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // Filter queue to selected restaurant
  const restQueue = queue.filter(q => q.restaurantId === selectedRestId && q.status === 'waiting')
  const curRest   = RESTAURANTS.find(r => r.id === selectedRestId)

  const handleAdmit = async (id) => {
    dispatch({ type: 'ADMIT_GUEST', id })
    await updateQueueStatus(id, 'admitted')
    toast('Guest admitted ✓')
    playChime('success')
  }

  const handleCancel = async (id) => {
    dispatch({ type: 'CANCEL_GUEST', id })
    await updateQueueStatus(id, 'cancelled')
    toast('Guest removed')
  }

  const handleNotify = async (id) => {
    dispatch({ type: 'NOTIFY_GUEST', id })
    const guest = queue.find(q => q.id === id)
    await notifyViaSMS(guest?.phone, `Hi ${guest?.name}, your table at ${curRest?.name} is almost ready!`)
    toast('📱 SMS sent ✓')
    playChime('alert')
  }

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = restQueue.findIndex(q => q.id === active.id)
    const newIdx = restQueue.findIndex(q => q.id === over.id)
    const reordered = arrayMove(restQueue, oldIdx, newIdx)
    dispatch({ type: 'REORDER_QUEUE', queue: [...queue.filter(q => q.restaurantId !== selectedRestId), ...reordered] })
  }

  const bulkNotify = () => {
    setBulkNotifying(true)
    restQueue.forEach((g, i) => {
      setTimeout(() => {
        dispatch({ type: 'NOTIFY_GUEST', id: g.id })
        if (i === restQueue.length - 1) { setBulkNotifying(false); toast(`All ${restQueue.length} guests notified ✓`) }
      }, i * 200)
    })
  }

  const handleLogout = () => { logout('staff'); toast('Signed out ✓'); navigate('/') }

  return (
    <main className="flex flex-col flex-1 px-4 pt-8 pb-24 max-w-lg mx-auto w-full min-h-dvh">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--color-cream)' }}>Staff Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: realtimeConnected ? '#22c55e' : '#374151', boxShadow: realtimeConnected ? '0 0 6px #22c55e' : 'none' }} />
            <span style={{ fontSize: 12, color: realtimeConnected ? '#22c55e' : '#6b7280' }}>{realtimeConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/staff/attendance')} className="btn-outline" style={{ fontSize: 12, padding: '7px 12px' }}>Attendance</button>
          <button onClick={() => navigate('/staff/analytics')} className="btn-outline" style={{ fontSize: 12, padding: '7px 12px' }}>Analytics</button>
          <button onClick={handleLogout} title="Sign out" style={{ padding: '7px 10px', borderRadius: 10, background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {/* Outlet selector */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        {RESTAURANTS.map(r => (
          <button
            key={r.id}
            onClick={() => dispatch({ type: 'SELECT_RESTAURANT', id: r.id })}
            style={{
              whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: 20, fontSize: 12,
              fontWeight: 600, border: 'none', cursor: 'pointer',
              background: r.id === selectedRestId ? r.accentColor : 'var(--color-surface)',
              color: r.id === selectedRestId ? '#0D0D0D' : '#6b7280',
              border: `1px solid ${r.id === selectedRestId ? r.accentColor : 'var(--color-border)'}`,
              transition: 'all 0.2s',
            }}
          >
            {r.emoji} {r.name}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'In Queue', value: restQueue.length, color: '#F5A623' },
          { label: 'Seated Today', value: seated, color: '#22c55e' },
          { label: 'Avg Wait', value: `${avgWait}m`, color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="card text-center py-3" style={{ border: '1px solid var(--color-border)' }}>
            <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, marginTop: 2, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <Heatmap />

      {/* Table grid */}
      <TableGrid tables={tables} dispatch={dispatch} />

      {/* Queue list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-cream)' }}>
          Waiting <span style={{ color: '#F5A623' }}>({restQueue.length})</span>
        </p>
        <p style={{ fontSize: 11, color: '#6b7280' }}>Drag to reorder</p>
      </div>

      {restQueue.length === 0 ? (
        <div className="card text-center py-10" style={{ border: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>🪑</span>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Queue is empty at {curRest?.name}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={restQueue.map(q => q.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence>
              {restQueue.map(guest => (
                <SortableCard key={guest.id} guest={guest} onAdmit={handleAdmit} onNotify={handleNotify} onCancel={handleCancel} />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      )}

      {/* Bulk notify FAB */}
      {restQueue.length > 1 && (
        <button
          onClick={bulkNotify}
          disabled={bulkNotifying}
          style={{
            position: 'fixed', bottom: 28, right: 20,
            background: '#F5A623', color: '#0D0D0D', borderRadius: 50,
            padding: '14px 22px', fontWeight: 700, fontSize: 13,
            fontFamily: 'Satoshi, system-ui', boxShadow: '0 4px 24px #F5A62344',
            border: 'none', cursor: bulkNotifying ? 'not-allowed' : 'pointer',
            opacity: bulkNotifying ? 0.7 : 1, zIndex: 100, transition: 'all 0.15s',
          }}
        >
          {bulkNotifying ? '📣 Notifying…' : '📣 Notify All'}
        </button>
      )}
    </main>
  )
}
