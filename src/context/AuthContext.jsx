import { createContext, useContext, useState, useCallback } from 'react'

/*
 * Fake credentials — hardcoded for demo purposes.
 * In production, replace with real Supabase auth.
 */
const CREDENTIALS = {
  staff:    { username: 'staff',    password: 'qnect123',  role: 'staff',    display: 'Staff Portal' },
  delivery: { username: 'delivery', password: 'deliver99', role: 'delivery', display: 'Delivery Portal' },
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // sessions: { staff: true/false, delivery: true/false }
  const [sessions, setSessions] = useState({ staff: false, delivery: false })

  const login = useCallback((role, username, password) => {
    const cred = CREDENTIALS[role]
    if (!cred) return { ok: false, error: 'Unknown role' }
    if (username === cred.username && password === cred.password) {
      setSessions(s => ({ ...s, [role]: true }))
      return { ok: true }
    }
    return { ok: false, error: 'Invalid username or password' }
  }, [])

  const logout = useCallback((role) => {
    setSessions(s => ({ ...s, [role]: false }))
  }, [])

  const isAuthed = useCallback((role) => sessions[role] === true, [sessions])

  return (
    <AuthContext.Provider value={{ login, logout, isAuthed }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
