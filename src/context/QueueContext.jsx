import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react'
import { supabase, subscribeToQueue } from '../lib/supabase.js'

/* ─── Initial mock data ──────────────────────────────────────────────────── */
const INITIAL_QUEUE = [
  { id: 1, name: 'Rohan Desai',   party: 4, joinedAt: Date.now() - 360000, status: 'waiting' },
  { id: 2, name: 'Sneha Iyer',    party: 2, joinedAt: Date.now() - 300000, status: 'waiting' },
  { id: 3, name: 'Aryan Kapoor',  party: 3, joinedAt: Date.now() - 240000, status: 'waiting' },
  { id: 4, name: 'Meera Shah',    party: 5, joinedAt: Date.now() - 180000, status: 'waiting' },
  { id: 5, name: 'Vikram Nair',   party: 2, joinedAt: Date.now() - 120000, status: 'waiting' },
]

const INITIAL_STAFF = [
  { id: 1, name: 'Rekha B.',  role: 'Host',    clocked: true,  clockedAt: '09:00', totalMins: 180 },
  { id: 2, name: 'Sameer K.', role: 'Server',  clocked: true,  clockedAt: '10:15', totalMins: 110 },
  { id: 3, name: 'Pooja M.',  role: 'Server',  clocked: false, clockedAt: null,    totalMins: 0   },
  { id: 4, name: 'Dev R.',    role: 'Cashier', clocked: true,  clockedAt: '08:45', totalMins: 215 },
]

const INITIAL_DELIVERIES = [
  { id: 'D-05', order: 'ZMT-3310', platform: 'Zomato', step: 3, name: 'Kavya S.' },
  { id: 'D-06', order: 'SWG-7129', platform: 'Swiggy', step: 2, name: 'Ravi M.' },
]

const initialState = {
  queue:      INITIAL_QUEUE,
  staff:      INITIAL_STAFF,
  deliveries: INITIAL_DELIVERIES,
  seated:     12,
  avgWait:    14,
  customer:   null,
  delivery:   null,
}

/* ─── Reducer ────────────────────────────────────────────────────────────── */
function reducer(state, action) {
  switch (action.type) {

    case 'JOIN_QUEUE': {
      const entry = {
        id:       action.payload.id || Date.now(),
        name:     action.payload.name,
        party:    action.payload.party,
        joinedAt: Date.now(),
        status:   'waiting',
      }
      return {
        ...state,
        queue:    [...state.queue, entry],
        customer: { ...action.payload, id: entry.id },
      }
    }

    case 'ADMIT_GUEST':
      return {
        ...state,
        queue:  state.queue.filter(q => q.id !== action.id),
        seated: state.seated + 1,
      }

    case 'CANCEL_GUEST':
      return {
        ...state,
        queue: state.queue.filter(q => q.id !== action.id),
      }

    case 'NOTIFY_GUEST':
      return {
        ...state,
        queue: state.queue.map(q =>
          q.id === action.id ? { ...q, notified: true } : q
        ),
      }

    case 'REORDER_QUEUE':
      return { ...state, queue: action.queue }

    case 'TOGGLE_CLOCK': {
      const now = new Date()
      const hh  = now.getHours().toString().padStart(2, '0')
      const mm  = now.getMinutes().toString().padStart(2, '0')
      return {
        ...state,
        staff: state.staff.map(s =>
          s.id === action.id
            ? { ...s, clocked: !s.clocked, clockedAt: !s.clocked ? `${hh}:${mm}` : null }
            : s
        ),
      }
    }

    case 'DELIVERY_CHECKIN': {
      const tokenNum = Math.floor(Math.random() * 90) + 10
      const entry = {
        id:       `D-${tokenNum}`,
        order:    action.payload.order,
        platform: action.payload.platform,
        name:     action.payload.name,
        step:     1,
      }
      return {
        ...state,
        deliveries: [...state.deliveries, entry],
        delivery:   entry,
      }
    }

    case 'DELIVERY_ADVANCE': {
      const updated = state.deliveries.map(d =>
        d.id === action.id ? { ...d, step: Math.min(d.step + 1, 4) } : d
      )
      const current = updated.find(d => d.id === action.id)
      return {
        ...state,
        deliveries: updated,
        delivery:   state.delivery?.id === action.id ? current : state.delivery,
      }
    }

    // Realtime sync from Supabase
    case 'RT_QUEUE_UPDATE': {
      const { eventType, new: newRow, old: oldRow } = action.payload
      if (eventType === 'INSERT') {
        const exists = state.queue.find(q => q.id === newRow.id)
        if (exists) return state
        return { ...state, queue: [...state.queue, { ...newRow, joinedAt: Date.parse(newRow.joined_at) }] }
      }
      if (eventType === 'UPDATE') {
        if (newRow.status !== 'waiting') {
          return { ...state, queue: state.queue.filter(q => q.id !== newRow.id) }
        }
        return {
          ...state,
          queue: state.queue.map(q => q.id === newRow.id ? { ...q, ...newRow } : q)
        }
      }
      if (eventType === 'DELETE') {
        return { ...state, queue: state.queue.filter(q => q.id !== oldRow.id) }
      }
      return state
    }

    default:
      return state
  }
}

/* ─── Context ────────────────────────────────────────────────────────────── */
const QueueContext = createContext(null)

export function QueueProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  // Supabase realtime subscription
  useEffect(() => {
    if (!supabase) return

    const unsub = subscribeToQueue((payload) => {
      dispatch({ type: 'RT_QUEUE_UPDATE', payload })
    })

    // Track socket status
    const channel = supabase.channel('presence-check')
    channel.subscribe((status) => {
      setRealtimeConnected(status === 'SUBSCRIBED')
    })

    return () => {
      unsub()
      supabase.removeChannel(channel)
    }
  }, [])

  const getPosition = useCallback((id) => {
    const idx = state.queue.findIndex(q => q.id === id)
    return idx === -1 ? null : idx + 1
  }, [state.queue])

  const getWaitMins = useCallback((id) => {
    const pos = getPosition(id)
    return pos === null ? 0 : pos * 6
  }, [getPosition])

  return (
    <QueueContext.Provider value={{ state, dispatch, getPosition, getWaitMins, realtimeConnected }}>
      {children}
    </QueueContext.Provider>
  )
}

export function useQueue() {
  const ctx = useContext(QueueContext)
  if (!ctx) throw new Error('useQueue must be used inside QueueProvider')
  return ctx
}
