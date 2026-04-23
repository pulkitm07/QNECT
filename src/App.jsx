import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { QueueProvider } from './context/QueueContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

const Landing         = lazy(() => import('./views/Landing.jsx'))
const JoinForm        = lazy(() => import('./views/customer/JoinForm.jsx'))
const QueueStatus     = lazy(() => import('./views/customer/QueueStatus.jsx'))
const RestaurantList  = lazy(() => import('./views/customer/RestaurantList.jsx'))
const RestaurantDetail= lazy(() => import('./views/customer/RestaurantDetail.jsx'))
const Dashboard       = lazy(() => import('./views/staff/Dashboard.jsx'))
const Attendance      = lazy(() => import('./views/staff/Attendance.jsx'))
const Analytics       = lazy(() => import('./views/staff/Analytics.jsx'))
const DeliveryCheckIn = lazy(() => import('./views/delivery/CheckIn.jsx'))
const DeliveryStatus  = lazy(() => import('./views/delivery/PickupStatus.jsx'))
const LoginScreen     = lazy(() => import('./views/LoginScreen.jsx'))

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
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

/** Redirects to login page if role session is not active */
function RequireAuth({ role, loginPath, children }) {
  const { isAuthed } = useAuth()
  return isAuthed(role)
    ? children
    : <Navigate to={loginPath} replace />
}

const Fallback = () => (
  <div style={{
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#F5A623', fontSize: 14,
  }}>
    Loading…
  </div>
)

export default function App() {
  const location = useLocation()

  return (
    <AuthProvider>
      <ToastProvider>
        <QueueProvider>
          <div className="min-h-dvh flex flex-col">
            <Suspense fallback={<Fallback />}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>

                  {/* Public routes */}
                  <Route path="/"                element={<PageWrapper><Landing /></PageWrapper>} />
                  <Route path="/restaurants"     element={<PageWrapper><RestaurantList /></PageWrapper>} />
                  <Route path="/restaurants/:id" element={<PageWrapper><RestaurantDetail /></PageWrapper>} />
                  <Route path="/customer"        element={<PageWrapper><JoinForm /></PageWrapper>} />
                  <Route path="/customer/status" element={<PageWrapper><QueueStatus /></PageWrapper>} />

                  {/* Staff login + protected routes */}
                  <Route
                    path="/staff/login"
                    element={<PageWrapper><LoginScreen role="staff" /></PageWrapper>}
                  />
                  <Route
                    path="/staff"
                    element={
                      <RequireAuth role="staff" loginPath="/staff/login">
                        <PageWrapper><Dashboard /></PageWrapper>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/staff/attendance"
                    element={
                      <RequireAuth role="staff" loginPath="/staff/login">
                        <PageWrapper><Attendance /></PageWrapper>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/staff/analytics"
                    element={
                      <RequireAuth role="staff" loginPath="/staff/login">
                        <PageWrapper><Analytics /></PageWrapper>
                      </RequireAuth>
                    }
                  />

                  {/* Delivery login + protected routes */}
                  <Route
                    path="/delivery/login"
                    element={<PageWrapper><LoginScreen role="delivery" /></PageWrapper>}
                  />
                  <Route
                    path="/delivery"
                    element={
                      <RequireAuth role="delivery" loginPath="/delivery/login">
                        <PageWrapper><DeliveryCheckIn /></PageWrapper>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/delivery/status"
                    element={
                      <RequireAuth role="delivery" loginPath="/delivery/login">
                        <PageWrapper><DeliveryStatus /></PageWrapper>
                      </RequireAuth>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </div>
        </QueueProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
