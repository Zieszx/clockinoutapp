import { ProgressSpinner } from 'primereact/progressspinner'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import ChangePasswordPage from './pages/ChangePasswordPage'

export default function App() {
  const { session, profile, loading, login, logout, changePassword } = useAuth()

  if (loading) {
    return (
      <div className="flex align-items-center justify-content-center min-h-screen">
        <div className="text-center">
          <ProgressSpinner />
          <p className="text-color-secondary mt-3">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return <LoginPage onLogin={login} />
  if (profile?.must_change_password) return <ChangePasswordPage onDone={changePassword} />

  const roles = profile?.roles || []
  if (roles.includes('admin') || roles.includes('super_admin')) {
    return <AdminPage session={session} profile={profile} onLogout={logout} />
  }
  return <DashboardPage session={session} profile={profile} onLogout={logout} />
}
