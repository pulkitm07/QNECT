import { useNavigate } from 'react-router-dom'
import { useQueue } from '../../context/QueueContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const MAX_SHIFT_MINS = 480 // 8-hour full shift

function clockedDuration(clockedAt, isClocked) {
  if (!clockedAt || !isClocked) return null
  const [h, m] = clockedAt.split(':').map(Number)
  const start  = new Date()
  start.setHours(h, m, 0, 0)
  const diffMs   = Date.now() - start.getTime()
  const diffMins = Math.max(0, Math.floor(diffMs / 60000))
  return diffMins
}

function formatMins(mins) {
  if (mins === null) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function Attendance() {
  const navigate = useNavigate()
  const toast    = useToast()
  const { state, dispatch } = useQueue()
  const { staff } = state

  const handleToggle = (id) => {
    dispatch({ type: 'TOGGLE_CLOCK', id })
    const member = staff.find(s => s.id === id)
    toast(member?.clocked ? 'Clocked out ✓' : 'Clocked in ✓')
  }

  return (
    <main className="flex flex-col flex-1 px-4 pt-8 pb-12 max-w-lg mx-auto w-full min-h-dvh">

      <button onClick={() => navigate('/staff')} className="mb-6 flex items-center gap-2 text-sm" style={{ color: '#6b7280' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to Dashboard
      </button>

      <h1 className="text-2xl font-display font-bold mb-6" style={{ color: '#FAF7F0' }}>Attendance</h1>

      {/* Summary bar */}
      <div className="card mb-6 flex gap-4 text-center" style={{ border: '1px solid #1f2937' }}>
        <div className="flex-1">
          <div className="text-2xl font-display font-bold" style={{ color: '#22c55e' }}>
            {staff.filter(s => s.clocked).length}
          </div>
          <div className="text-xs" style={{ color: '#6b7280' }}>Clocked In</div>
        </div>
        <div style={{ width: 1, background: '#1f2937' }} />
        <div className="flex-1">
          <div className="text-2xl font-display font-bold" style={{ color: '#6b7280' }}>
            {staff.filter(s => !s.clocked).length}
          </div>
          <div className="text-xs" style={{ color: '#6b7280' }}>Off Shift</div>
        </div>
      </div>

      <div className="space-y-3">
        {staff.map(member => {
          const mins = member.clocked
            ? clockedDuration(member.clockedAt, true)
            : member.totalMins
          const pct = mins !== null ? Math.min((mins / MAX_SHIFT_MINS) * 100, 100) : 0

          return (
            <div key={member.id} className="card" style={{ border: '1px solid #1f2937', padding: '16px' }}>
              <div className="flex items-center gap-3 mb-3">
                {/* Avatar */}
                <div
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: member.clocked ? '#F5A62320' : '#1f2937',
                    border: `2px solid ${member.clocked ? '#F5A623' : '#374151'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: member.clocked ? '#F5A623' : '#6b7280',
                    fontFamily: 'Clash Display',
                  }}
                >
                  {member.name[0]}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#FAF7F0' }}>{member.name}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>{member.role}</p>
                </div>

                <div className="flex items-center gap-3">
                  {member.clocked && member.clockedAt && (
                    <span className="text-xs" style={{ color: '#6b7280' }}>Since {member.clockedAt}</span>
                  )}
                  <button
                    onClick={() => handleToggle(member.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: member.clocked ? '#ef444415' : '#22c55e15',
                      color: member.clocked ? '#ef4444' : '#22c55e',
                      transition: 'all 0.15s',
                    }}
                  >
                    {member.clocked ? 'Clock Out' : 'Clock In'}
                  </button>
                </div>
              </div>

              {/* Hours bar */}
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: '#6b7280' }}>
                  <span>Hours today</span>
                  <span style={{ color: member.clocked ? '#F5A623' : '#6b7280' }}>
                    {formatMins(mins)} / 8h
                  </span>
                </div>
                <div style={{ height: 4, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: pct > 80 ? '#22c55e' : pct > 40 ? '#F5A623' : '#60a5fa',
                      borderRadius: 2,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
