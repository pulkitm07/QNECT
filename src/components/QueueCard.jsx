import { useQueue } from '../hooks/useQueue.js'

const elapsedMins = (joinedAt) => Math.floor((Date.now() - joinedAt) / 60000)

export default function QueueCard({ guest, position }) {
  const { dispatch } = useQueue()

  const admit  = () => dispatch({ type: 'ADMIT_GUEST',  id: guest.id })
  const cancel = () => dispatch({ type: 'CANCEL_GUEST', id: guest.id })
  const notify = () => dispatch({ type: 'NOTIFY_GUEST', id: guest.id })

  return (
    <div className={`card slide-up transition ${guest.notified ? 'ring-1 ring-amber-300' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl font-medium text-brand min-w-[28px]">{position}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 text-sm">{guest.name}</span>
            <span className="badge-blue">{guest.party} pax</span>
            {guest.notified && <span className="badge-amber">Notified</span>}
            {position === 1 && <span className="badge-green">Next up</span>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Waiting {elapsedMins(guest.joinedAt)} min</p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={admit}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-brand-light text-brand-dark border border-brand/30 hover:bg-brand/20 transition"
        >
          ✓ Admit
        </button>
        <button
          onClick={notify}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 transition"
        >
          📲 Notify
        </button>
        <button
          onClick={cancel}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
        >
          ✕ Cancel
        </button>
      </div>
    </div>
  )
}
