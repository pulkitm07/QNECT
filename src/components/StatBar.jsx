export default function StatBar({ waiting, seated, avgWait }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {[
        { label: 'Waiting', value: waiting,        color: 'text-brand'    },
        { label: 'Seated',  value: seated,         color: 'text-staff'    },
        { label: 'Avg wait',value: `${avgWait}m`,  color: 'text-amber-600'},
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
          <div className={`text-2xl font-medium ${color}`}>{value}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  )
}
