import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react'
import { supabase, subscribeToQueue } from '../lib/supabase.js'

const INITIAL_QUEUE = [
  { id: 1, name: 'Rohan Desai',   party: 4, joinedAt: Date.now() - 360000, status: 'waiting', restaurantId: 'r1', arrived: false },
  { id: 2, name: 'Sneha Iyer',    party: 2, joinedAt: Date.now() - 300000, status: 'waiting', restaurantId: 'r1', arrived: false },
  { id: 3, name: 'Aryan Kapoor',  party: 3, joinedAt: Date.now() - 240000, status: 'waiting', restaurantId: 'r2', arrived: false },
  { id: 4, name: 'Meera Shah',    party: 5, joinedAt: Date.now() - 180000, status: 'waiting', restaurantId: 'r1', arrived: false },
  { id: 5, name: 'Vikram Nair',   party: 2, joinedAt: Date.now() - 120000, status: 'waiting', restaurantId: 'r3', arrived: false },
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

// Mock admit timestamps for rolling average (minutes between admits)
const INITIAL_ADMIT_TIMES = [6, 7, 5, 8, 6, 9, 5, 7]

const initialState = {
  queue:            INITIAL_QUEUE,
  staff:            INITIAL_STAFF,
  deliveries:       INITIAL_DELIVERIES,
  seated:           12,
  avgWait:          14,
  admitTimes:       INITIAL_ADMIT_TIMES,
  customer:         null,
  delivery:         null,
  selectedRestId:   'r1',
  tables: [
    { id: 't1', label: 'T1', seats: 2, status: 'empty' },
    { id: 't2', label: 'T2', seats: 4, status: 'occupied' },
    { id: 't3', label: 'T3', seats: 2, status: 'empty' },
    { id: 't4', label: 'T4', seats: 6, status: 'occupied' },
    { id: 't5', label: 'T5', seats: 4, status: 'reserved' },
    { id: 't6', label: 'T6', seats: 2, status: 'empty' },
    { id: 't7', label: 'T7', seats: 8, status: 'occupied' },
    { id: 't8', label: 'T8', seats: 4, status: 'empty' },
  ],
}

function rollingAvg(times) {
  if (!times.length) return 6
  return Math.round(times.slice(-8).reduce((a, b) => a + b, 0) / Math.min(times.length, 8))
}

function reducer(state, action) {
  switch (action.type) {

    case 'SELECT_RESTAURANT':
      return { ...state, selectedRestId: action.id }

    case 'JOIN_QUEUE': {
      const entry = {
        id:           action.payload.id || Date.now(),
        name:         action.payload.name,
        party:        action.payload.party,
        phone:        action.payload.phone,
        joinedAt:     Date.now(),
        status:       'waiting',
        restaurantId: action.payload.restaurantId || state.selectedRestId,
        arrived:      false,
      }
      return { ...state, queue: [...state.queue, entry], customer: { ...action.payload, id: entry.id } }
    }

    case 'CUSTOMER_ARRIVED':
      return {
        ...state,
        queue: state.queue.map(q => q.id === action.id ? { ...q, arrived: true } : q),
      }

    case 'ADMIT_GUEST': {
      const admittedAt   = Date.now()
      const guest        = state.queue.find(q => q.id === action.id)
      const waitMins     = guest ? Math.round((admittedAt - guest.joinedAt) / 60000) : 6
      const newAdmitTimes = [...state.admitTimes, waitMins]
      return {
        ...state,
        queue:      state.queue.filter(q => q.id !== action.id),
        seated:     state.seated + 1,
        admitTimes: newAdmitTimes,
        avgWait:    rollingAvg(newAdmitTimes),
        tables:     state.tables.map(t =>
          t.id === action.tableId ? { ...t, status: 'occupied' } : t
        ),
      }
    }

    case 'CANCEL_GUEST':
      return { ...state, queue: state.queue.filter(q => q.id !== action.id) }

    case 'NOTIFY_GUEST':
      return { ...state, queue: state.queue.map(q => q.id === action.id ? { ...q, notified: true } : q) }

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

    case 'SET_TABLE_STATUS':
      return { ...state, tables: state.tables.map(t => t.id === action.id ? { ...t, status: action.status } : t) }

    case 'DELIVERY_CHECKIN': {
      const tokenNum = Math.floor(Math.random() * 90) + 10
      const entry = { id: `D-${tokenNum}`, ...action.payload, step: 1, checkedInAt: Date.now() }
      return { ...state, deliveries: [...state.deliveries, entry], delivery: entry }
    }

    case 'DELIVERY_ADVANCE': {
      const updated = state.deliveries.map(d => d.id === action.id ? { ...d, step: Math.min(d.step + 1, 4) } : d)
      const current = updated.find(d => d.id === action.id)
      return { ...state, deliveries: updated, delivery: state.delivery?.id === action.id ? current : state.delivery }
    }

    case 'RT_QUEUE_UPDATE': {
      const { eventType, new: newRow, old: oldRow } = action.payload
      if (eventType === 'INSERT') {
        const exists = state.queue.find(q => q.id === newRow.id)
        if (exists) return state
        return { ...state, queue: [...state.queue, { ...newRow, joinedAt: Date.parse(newRow.joined_at), arrived: false }] }
      }
      if (eventType === 'UPDATE') {
        if (newRow.status !== 'waiting') return { ...state, queue: state.queue.filter(q => q.id !== newRow.id) }
        return { ...state, queue: state.queue.map(q => q.id === newRow.id ? { ...q, ...newRow } : q) }
      }
      if (eventType === 'DELETE') return { ...state, queue: state.queue.filter(q => q.id !== oldRow.id) }
      return state
    }

    default:
      return state
  }
}

const QueueContext = createContext(null)

export function QueueProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  useEffect(() => {
    if (!supabase) return
    const unsub = subscribeToQueue(payload => dispatch({ type: 'RT_QUEUE_UPDATE', payload }))
    const ch = supabase.channel('presence-check')
    ch.subscribe(status => setRealtimeConnected(status === 'SUBSCRIBED'))
    return () => { unsub(); supabase.removeChannel(ch) }
  }, [])

  const getPosition = useCallback((id) => {
    const restId = state.queue.find(q => q.id === id)?.restaurantId
    const restQ  = state.queue.filter(q => q.restaurantId === restId)
    const idx    = restQ.findIndex(q => q.id === id)
    return idx === -1 ? null : idx + 1
  }, [state.queue])

  const getWaitMins = useCallback((id) => {
    const pos = getPosition(id)
    return pos === null ? 0 : pos * rollingAvg(state.admitTimes)
  }, [getPosition, state.admitTimes])

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
