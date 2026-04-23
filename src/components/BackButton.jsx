import { useNavigate } from 'react-router-dom'

export default function BackButton({ to = '/', label = 'Back' }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-5"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  )
}
