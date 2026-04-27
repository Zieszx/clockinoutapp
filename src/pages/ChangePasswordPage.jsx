import { useState, useRef } from 'react'
import { Card } from 'primereact/card'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'

export default function ChangePasswordPage({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      toast.current.show({ severity: 'error', summary: 'Mismatch', detail: 'Passwords do not match.', life: 3000 })
      return
    }
    if (password.length < 6) {
      toast.current.show({ severity: 'error', summary: 'Too short', detail: 'Password must be at least 6 characters.', life: 3000 })
      return
    }
    setLoading(true)
    const { error } = await onDone(password)
    if (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message, life: 4000 })
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
                <i className="pi pi-lock" />
                Security Setup
              </div>
              <h1>Set your personal password.</h1>
              <p>Your account was created by an admin with a temporary password. Please set a new one before continuing.</p>
            </div>
            <div className="showcase-grid">
              <div className="showcase-tile">
                <i className="pi pi-shield" />
                <h3>Keep it strong</h3>
                <p>Use a mix of letters, numbers, and symbols for best security.</p>
              </div>
              <div className="showcase-tile">
                <i className="pi pi-lock" />
                <h3>One-time only</h3>
                <p>You only need to do this once. You can change it again anytime from your profile.</p>
              </div>
              <div className="showcase-tile">
                <i className="pi pi-check-circle" />
                <h3>Minimum 6 characters</h3>
                <p>Your password must be at least 6 characters long.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="login-panel">
          <Card className="login-card">
            <div className="login-heading">
              <span className="brand-mark">
                <i className="pi pi-lock text-2xl" />
              </span>
              <h2>Change Password</h2>
              <p>Choose a strong password to secure your account.</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-column gap-4">
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">New Password</label>
                <Password
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  toggleMask
                  required
                  className="w-full"
                  inputClassName="w-full"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Confirm Password</label>
                <Password
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  feedback={false}
                  toggleMask
                  required
                  className="w-full"
                  inputClassName="w-full"
                  style={{ width: '100%' }}
                />
              </div>
              <Button
                type="submit"
                label="Set Password & Continue"
                icon="pi pi-arrow-right"
                loading={loading}
                className="w-full mt-2 primary-btn"
              />
            </form>
          </Card>
        </section>
      </div>
    </div>
  )
}
