import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { QueueProvider } from './context/QueueContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

const Landing         = lazy(() => import('./views/Landing.jsx'))
const JoinForm        = lazy(() => import('./views/customer/JoinForm.jsx'))
const QueueStatus     = lazy(() => import('./views/customer/QueueStatus.jsx'))
const Dashboard       = lazy(() => import('./views/staff/Dashboard.jsx'))
const Attendance      = lazy(() => import('./views/staff/Attendance.jsx'))
const DeliveryCheckIn = lazy(() => import('./views/delivery/CheckIn.jsx'))
const DeliveryStatus  = lazy(() => import('./views/delivery/PickupStatus.jsx'))

const pageVariants = {
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:     { opacity: 0, y: -8,  transition: { duration: 0.18, ease: 'easeIn'  } },
}

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  )
}

const Fallback = () => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5A623', fontSize: 14 }}>
    Loading…
  </div>
)

export default function App() {
  const location = useLocation()

  return (
    <ToastProvider>
      <QueueProvider>
        <div className="min-h-dvh flex flex-col">
          <Suspense fallback={<Fallback />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/"                   element={<PageWrapper><Landing /></PageWrapper>} />
                <Route path="/customer"           element={<PageWrapper><JoinForm /></PageWrapper>} />
                <Route path="/customer/status"    element={<PageWrapper><QueueStatus /></PageWrapper>} />
                <Route path="/staff"              element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/staff/attendance"   element={<PageWrapper><Attendance /></PageWrapper>} />
                <Route path="/delivery"           element={<PageWrapper><DeliveryCheckIn /></PageWrapper>} />
                <Route path="/delivery/status"    element={<PageWrapper><DeliveryStatus /></PageWrapper>} />
                <Route path="*"                   element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </div>
      </QueueProvider>
    </ToastProvider>
  )
}
