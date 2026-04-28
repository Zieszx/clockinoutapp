import { useState, useRef } from 'react'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import InstallPromptBanner from '../components/InstallPromptBanner'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await onLogin(email, password)
    if (error) {
      toast.current.show({ severity: 'error', summary: 'Login Failed', detail: error.message, life: 4000 })
    }
    setLoading(false)
  }

  return (
    <div className="app-shell">
      <Toast ref={toast} />
      <div className="login-shell">
        <section className="login-showcase">
          <div className="showcase-stack">
            <div className="showcase-hero">
              <div className="eyebrow">
                <i className="pi pi-sparkles" />
                Smarter Workforce Tracking
              </div>
              <h1>Clock in with confidence and clarity.</h1>
              <p>
                A modern attendance workspace for teams that need dependable time logs,
                location-aware clock-ins, and a cleaner daily routine.
              </p>
            </div>

            <div className="showcase-grid">
              <div className="showcase-tile">
                <i className="pi pi-map-marker" />
                <h3>Location-aware check-ins</h3>
                <p>Ensure attendance happens inside the approved office radius with minimal friction.</p>
              </div>
              <div className="showcase-tile">
                <i className="pi pi-chart-line" />
                <h3>Clear operational visibility</h3>
                <p>Review personal logs and export admin-wide records with a cleaner reporting flow.</p>
              </div>
              <div className="showcase-tile">
                <i className="pi pi-shield" />
                <h3>Secure access</h3>
                <p>Use role-based access so employees and admins each get the right surface area.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-panel-stack">
            <InstallPromptBanner />

            <Card className="login-card">
              <div className="login-heading">
                <span className="brand-mark">
                  <i className="pi pi-clock text-2xl" />
                </span>
                <h2>Welcome back</h2>
                <p>Sign in to access your live attendance controls, time logs, and company workspace.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-column gap-4">
                <div className="flex flex-column gap-2 input-shell">
                  <label className="field-label">Email</label>
                  <InputText
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    type="email"
                    required
                    className="w-full"
                  />
                </div>

                <div className="flex flex-column gap-2 input-shell">
                  <label className="field-label">Password</label>
                  <Password
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    feedback={false}
                    toggleMask
                    required
                    className="w-full"
                    inputClassName="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  label="Sign In"
                  icon="pi pi-arrow-right"
                  loading={loading}
                  className="w-full mt-2 primary-btn"
                />
              </form>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
