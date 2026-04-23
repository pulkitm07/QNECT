import { useQueue } from '../context/QueueContext.jsx'

export function useAttendance() {
  const { state, dispatch } = useQueue()

  const toggleClock = (id) => dispatch({ type: 'TOGGLE_CLOCK', id })

  const clockedInCount  = state.staff.filter(s => s.clocked).length
  const clockedOutCount = state.staff.filter(s => !s.clocked).length

  return { staff: state.staff, toggleClock, clockedInCount, clockedOutCount }
}
