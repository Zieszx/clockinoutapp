import { useState, useRef } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputNumber } from 'primereact/inputnumber'
import { Toast } from 'primereact/toast'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Divider } from 'primereact/divider'
import { useCompanySettings } from '../hooks/useCompanySettings'
import { getCurrentPosition } from '../utils/geo'

export default function MaintenanceTab({ session }) {
  const { settings, loading, saving, saveSettings } = useCompanySettings()
  const [radius, setRadius] = useState(100)
  const [triggering, setTriggering] = useState(false)
  const toast = useRef(null)

  async function handleSetLocation() {
    try {
      const pos = await getCurrentPosition()
      const { error } = await saveSettings(
        pos.coords.latitude,
        pos.coords.longitude,
        radius,
        session.user.id
      )
      if (error) throw error
      toast.current.show({
        severity: 'success',
        summary: 'Location Saved',
        detail: `Office set: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} — radius ${radius}m`,
        life: 4000
      })
    } catch (err) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
    }
  }

  async function handleTriggerPipeline() {
    const token = import.meta.env.VITE_GITHUB_TOKEN
    const repo = import.meta.env.VITE_GITHUB_REPO || 'Zieszx/clockinoutapp'
    if (!token) {
      toast.current.show({
        severity: 'warn',
        summary: 'Not Configured',
        detail: 'Set VITE_GITHUB_TOKEN in your environment variables.',
        life: 5000
      })
      return
    }
    setTriggering(true)
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows/deploy.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ref: 'main' })
        }
      )
      if (res.status === 204) {
        toast.current.show({ severity: 'success', summary: 'Deployment Triggered', detail: 'GitHub Actions workflow started.', life: 4000 })
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `GitHub responded with status ${res.status}`)
      }
    } catch (err) {
      toast.current.show({ severity: 'error', summary: 'Deploy Failed', detail: err.message, life: 5000 })
    } finally {
      setTriggering(false)
    }
  }

  if (loading) return <div className="flex justify-content-center p-5"><ProgressSpinner /></div>

  return (
    <>
      <Toast ref={toast} />
      <div className="flex flex-column gap-4">
        <Card title="Office Location" className="maintenance-card">
          {settings?.latitude && (
            <div className="mb-4 p-3 border-round" style={{ background: 'rgba(165,180,252,0.05)', border: '1px solid rgba(165,180,252,0.15)' }}>
              <p className="text-sm text-color-secondary mt-0 mb-1">Current Setting</p>
              <p className="m-0">Lat: <strong>{settings.latitude.toFixed(5)}</strong> — Lng: <strong>{settings.longitude.toFixed(5)}</strong></p>
              <p className="m-0 mt-1">Radius: <strong>{settings.radius_meters}m</strong></p>
            </div>
          )}
          <div className="flex flex-column gap-3">
            <div className="flex flex-column gap-2">
              <label className="text-sm font-medium">Clock-in Radius (meters)</label>
              <InputNumber
                value={radius}
                onValueChange={e => setRadius(e.value)}
                min={10}
                max={5000}
                showButtons
                style={{ maxWidth: '200px' }}
              />
            </div>
            <Button
              label="Set My Current Location as Office"
              icon="pi pi-map-marker"
              onClick={handleSetLocation}
              loading={saving}
              className="w-full md:w-auto"
            />
          </div>
        </Card>

        <Divider />

        <Card title="Deployment" className="maintenance-card">
          <p className="text-color-secondary text-sm mt-0">
            Trigger a new CI/CD pipeline to redeploy the app to GitLab Pages and Vercel.
            Any push to <code>main</code> also triggers this automatically.
          </p>
          <Button
            label="Trigger Deployment Now"
            icon="pi pi-cloud-upload"
            severity="warning"
            outlined
            loading={triggering}
            onClick={handleTriggerPipeline}
          />
        </Card>
      </div>
    </>
  )
}
