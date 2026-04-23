import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueue } from '../../context/QueueContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { updateQueueStatus } from '../../lib/supabase.js'

/* ── Heatmap ── */
function Heatmap() {
  const hour = new Date().getHours()
  const mockTraffic = [
    2,1,1,1,1,2,3,5,7,8,7,8,9,8,7,6,8,9,8,7,5,4,3,2
  ]
  const max = Math.max(...mockTraffic)
  const getColor = (val) => {
    const ratio = val / max
    if (ratio < 0.4) return '#16a34a'
    if (ratio < 0.7) return '#F5A623'
    return '#ef4444'
  }
  return (
    <div className="card mb-4" style={{ border: '1px solid #1f2937', padding: '16px' }}>
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>
        Foot Traffic · Today
      </p>
      <div className="flex gap-0.5 items-end" style={{ height: 36 }}>
        {mockTraffic.map((val, i) => (
          <div
            key={i}
            title={`${i}:00`}
            style={{
              flex: 1,
              height: `${(val / max) * 100}%`,
              borderRadius: 3,
              background: getColor(val),
              opacity: i === hour ? 1 : 0.45,
              outline: i === hour ? '2px solid #FAF7F0' : 'none',
              outlineOffset: 1,
              transition: 'height 0.3s ease',
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs mt-1" style={{ color: '#374151' }}>
        <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
      </div>
    </div>
  )
}

/* ── Sortable Queue Card ── */
function SortableCard({ guest, onAdmit, onNotify, onCancel }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: guest.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  }

  const waited = Math.round((Date.now() - guest.joinedAt) / 60000)

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
        className="card mb-3"
        style={{ border: guest.notified ? '1px solid #F5A623' : '1px solid #1f2937', padding: '14px 16px' }}
      >
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing"
            style={{ color: '#374151', touchAction: 'none' }}
            aria-label="Drag to reorder"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="5" cy="4" r="1.5" fill="currentColor"/>
              <circle cx="5" cy="8" r="1.5" fill="currentColor"/>
              <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="11" cy="4" r="1.5" fill="currentColor"/>
              <circle cx="11" cy="8" r="1.5" fill="currentColor"/>
              <circle cx="11" cy="12" r="1.5" fill="currentColor"/>
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-semibold text-sm" style={{ color: '#FAF7F0' }}>{guest.name}</span>
              {guest.notified && (
                <span className="badge-amber" style={{ fontSize: 10 }}>Notified</span>
              )}
            </div>
            <div className="flex gap-3 text-xs" style={{ color: '#6b7280' }}>
              <span>👥 {guest.party}</span>
              <span>⏱ {waited}m ago</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => onNotify(guest.id)} title="Notify" style={{ color: '#F5A623', padding: 6, borderRadius: 8, background: '#F5A62315' }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 016 6v3l1.5 2.5H2.5L4 11V8a6 6 0 016-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z" fill="currentColor"/></svg>
            </button>
            <button onClick={() => onAdmit(guest.id)} title="Admit" style={{ color: '#22c55e', padding: 6, borderRadius: 8, background: '#22c55e15' }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M4 10l5 5L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => onCancel(guest.id)} title="Cancel" style={{ color: '#ef4444', padding: 6, borderRadius: 8, background: '#ef444415' }}>
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
  const { logout } = useAuth()
  const { state, dispatch, realtimeConnected } = useQueue()
  const { queue, seated, avgWait } = state
  const [bulkNotifying, setBulkNotifying] = useState(false)

  const handleLogout = () => {
    logout('staff')
    toast('Signed out ✓')
    navigate('/')
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleAdmit = async (id) => {
    dispatch({ type: 'ADMIT_GUEST', id })
    await updateQueueStatus(id, 'admitted')
    toast('Guest admitted ✓')
  }

  const handleCancel = async (id) => {
    dispatch({ type: 'CANCEL_GUEST', id })
    await updateQueueStatus(id, 'cancelled')
    toast('Guest removed')
  }

  const handleNotify = (id) => {
    dispatch({ type: 'NOTIFY_GUEST', id })
    toast('SMS sent ✓')
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIdx = queue.findIndex(q => q.id === active.id)
      const newIdx = queue.findIndex(q => q.id === over.id)
      dispatch({ type: 'REORDER_QUEUE', queue: arrayMove(queue, oldIdx, newIdx) })
    }
  }

  const bulkNotify = () => {
    setBulkNotifying(true)
    queue.forEach((g, i) => {
      setTimeout(() => {
        dispatch({ type: 'NOTIFY_GUEST', id: g.id })
        if (i === queue.length - 1) {
          setBulkNotifying(false)
          toast(`All ${queue.length} guests notified ✓`)
        }
      }, i * 200)
    })
  }

  return (
    <main className="flex flex-col flex-1 px-4 pt-8 pb-24 max-w-lg mx-auto w-full min-h-dvh">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: '#FAF7F0' }}>Staff Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <div
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: realtimeConnected ? '#22c55e' : '#374151',
                boxShadow: realtimeConnected ? '0 0 6px #22c55e' : 'none',
              }}
            />
            <span className="text-xs" style={{ color: realtimeConnected ? '#22c55e' : '#6b7280' }}>
              {realtimeConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/staff/attendance')}
            className="btn-outline text-xs"
            style={{ padding: '8px 14px' }}
          >
            Attendance →
          </button>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              padding: '8px 10px', borderRadius: 10, background: '#ef444415',
              color: '#ef4444', border: '1px solid #ef444430', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'In Queue', value: queue.length, color: '#F5A623' },
          { label: 'Seated Today', value: seated, color: '#22c55e' },
          { label: 'Avg Wait', value: `${avgWait}m`, color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="card text-center py-3" style={{ border: '1px solid #1f2937' }}>
            <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <Heatmap />

      {/* Queue list */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: '#FAF7F0' }}>
          Waiting <span style={{ color: '#F5A623' }}>({queue.length})</span>
        </p>
        <p className="text-xs" style={{ color: '#6b7280' }}>Drag to reorder</p>
      </div>

      {queue.length === 0 ? (
        <div className="card text-center py-10" style={{ border: '1px solid #1f2937' }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mx-auto mb-3">
            <circle cx="28" cy="28" r="24" fill="#141414" stroke="#1f2937" strokeWidth="1.5"/>
            <path d="M18 28h20M28 18v20" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="28" cy="28" r="6" stroke="#F5A623" strokeWidth="1.5"/>
          </svg>
          <p className="text-sm" style={{ color: '#6b7280' }}>Queue is empty</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={queue.map(q => q.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence>
              {queue.map(guest => (
                <SortableCard
                  key={guest.id}
                  guest={guest}
                  onAdmit={handleAdmit}
                  onNotify={handleNotify}
                  onCancel={handleCancel}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      )}

      {/* Bulk notify FAB */}
      {queue.length > 1 && (
        <button
          onClick={bulkNotify}
          disabled={bulkNotifying}
          style={{
            position: 'fixed',
            bottom: 28,
            right: 20,
            background: '#F5A623',
            color: '#0D0D0D',
            borderRadius: 50,
            padding: '14px 22px',
            fontWeight: 700,
            fontSize: 13,
            fontFamily: 'Satoshi, system-ui',
            boxShadow: '0 4px 24px #F5A62344',
            border: 'none',
            cursor: bulkNotifying ? 'not-allowed' : 'pointer',
            opacity: bulkNotifying ? 0.7 : 1,
            zIndex: 100,
            transition: 'all 0.15s',
          }}
        >
          {bulkNotifying ? '📣 Notifying…' : '📣 Notify All'}
        </button>
      )}
    </main>
  )
}
