import { useEffect, useRef, useState } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { InputNumber } from 'primereact/inputnumber'
import { Toast } from 'primereact/toast'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Divider } from 'primereact/divider'
import { SelectButton } from 'primereact/selectbutton'
import { useCompanySettings } from '../hooks/useCompanySettings'
import { getCurrentPosition } from '../utils/geo'

const LOCATION_MODES = [
  { label: 'Use My Location', value: 'gps' },
  { label: 'Set by Address', value: 'address' }
]

export default function MaintenanceTab({ session }) {
  const { settings, loading, saving, saveSettings } = useCompanySettings()
  const [form, setForm] = useState({
    company_name: '',
    company_address: '',
    radius_meters: 100
  })
  const [locationMode, setLocationMode] = useState('gps')
  const [resolvingAddress, setResolvingAddress] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const toast = useRef(null)

  useEffect(() => {
    if (!settings) return
    setForm({
      company_name: settings.company_name || '',
      company_address: settings.company_address || '',
      radius_meters: settings.radius_meters || 100
    })
  }, [settings])

  function updateForm(key, value) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Address lookup failed with status ${response.status}`)
    }

    const results = await response.json()
    if (!results?.length) {
      throw new Error('No map result found for that address.')
    }

    return {
      latitude: Number(results[0].lat),
      longitude: Number(results[0].lon)
    }
  }

  async function handleSetLocation() {
    try {
      let coords

      if (!form.company_name.trim()) {
        throw new Error('Company name is required.')
      }

      if (locationMode === 'gps') {
        const pos = await getCurrentPosition()
        coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }
      } else {
        if (!form.company_address.trim()) {
          throw new Error('Company address is required when using address lookup.')
        }
        setResolvingAddress(true)
        coords = await geocodeAddress(form.company_address)
      }

      const { error } = await saveSettings({
        company_name: form.company_name.trim(),
        company_address: form.company_address.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        radius_meters: form.radius_meters
      }, session.user.id)

      if (error) throw error

      toast.current.show({
        severity: 'success',
        summary: 'Location Saved',
        detail: `Office set: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} - radius ${form.radius_meters}m`,
        life: 4000
      })
    } catch (err) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
    } finally {
      setResolvingAddress(false)
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
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
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
      <div className="maintenance-grid">
        <Card className="glass-card maintenance-card maintenance-panel">
          <div className="d-flex flex-column gap-4">
            <div>
              <h2 className="section-title">Office location</h2>
              <p className="section-copy">Set your company identity, approved attendance address, and office check-in coordinates.</p>
            </div>

            {(settings?.latitude || settings?.company_name || settings?.company_address) && (
              <div className="setting-highlight">
                <p className="text-muted-soft text-uppercase text-xs mt-0 mb-1">Current setting</p>
                <p>Company: <strong>{settings.company_name || 'Not set'}</strong></p>
                <p>Address: <strong>{settings.company_address || 'Not set'}</strong></p>
                {settings.latitude && settings.longitude ? (
                  <p>Lat: <strong>{settings.latitude.toFixed(5)}</strong> - Lng: <strong>{settings.longitude.toFixed(5)}</strong></p>
                ) : null}
                <p>Radius: <strong>{settings.radius_meters}m</strong></p>
              </div>
            )}

            <div className="maintenance-form-grid">
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Company name</label>
                <InputText
                  value={form.company_name}
                  onChange={e => updateForm('company_name', e.target.value)}
                  placeholder="Example: Webgeaz Sdn Bhd"
                />
              </div>

              <div className="flex flex-column gap-2 input-shell maintenance-form-span-2">
                <label className="field-label">Company address</label>
                <InputTextarea
                  value={form.company_address}
                  onChange={e => updateForm('company_address', e.target.value)}
                  rows={3}
                  placeholder="Full office address"
                  autoResize
                />
              </div>

              <div className="flex flex-column gap-2">
                <label className="field-label">Location source</label>
                <SelectButton value={locationMode} onChange={e => setLocationMode(e.value)} options={LOCATION_MODES} />
              </div>

              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Clock-in radius (meters)</label>
                <InputNumber
                  value={form.radius_meters}
                  onValueChange={e => updateForm('radius_meters', e.value ?? 100)}
                  min={10}
                  max={5000}
                  showButtons
                />
              </div>
            </div>

            <Button
              label={locationMode === 'gps' ? 'Set My Current Location as Office' : 'Set Office Using Company Address'}
              icon={locationMode === 'gps' ? 'pi pi-map-marker' : 'pi pi-building'}
              onClick={handleSetLocation}
              loading={saving || resolvingAddress}
              className="w-full md:w-auto primary-btn"
            />
          </div>
        </Card>

        <Divider className="my-0" />

        <Card className="glass-card maintenance-card maintenance-panel">
          <div className="d-flex flex-column gap-4">
            <div>
              <h2 className="section-title">Deployment</h2>
              <p className="section-copy">
                Trigger the GitHub Actions workflow for <code>github.com/Zieszx/clockinoutapp</code>.
                This will redeploy the app, and if your GitHub secrets are configured, it will also apply pending Supabase migrations.
              </p>
            </div>
            <Button
              label="Trigger Deployment Now"
              icon="pi pi-cloud-upload"
              severity="warning"
              outlined
              loading={triggering}
              onClick={handleTriggerPipeline}
            />
          </div>
        </Card>
      </div>
    </>
  )
}
