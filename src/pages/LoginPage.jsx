import { useState, useRef } from 'react'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'

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
    <div className="login-container flex align-items-center justify-content-center min-h-screen px-3">
      <Toast ref={toast} />
      <Card className="login-card w-full" style={{ maxWidth: '420px' }}>
        <div className="text-center mb-5">
          <i className="pi pi-clock" style={{ fontSize: '3rem', color: '#a5b4fc' }} />
          <h1 className="text-3xl font-bold mt-2 mb-1" style={{ color: '#a5b4fc' }}>ClockApp</h1>
          <p className="text-color-secondary mt-0 mb-0">Time Tracking System</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-column gap-4">
          <div className="flex flex-column gap-2">
            <label className="text-sm font-medium">Email</label>
            <InputText
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              type="email"
              required
              className="w-full"
            />
          </div>
          <div className="flex flex-column gap-2">
            <label className="text-sm font-medium">Password</label>
            <Password
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
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
            label="Sign In"
            icon="pi pi-sign-in"
            loading={loading}
            className="w-full mt-2"
          />
        </form>
      </Card>
    </div>
  )
}
