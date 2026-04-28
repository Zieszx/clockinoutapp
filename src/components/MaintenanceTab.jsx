import { useEffect, useRef, useState } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { MultiSelect } from 'primereact/multiselect'
import { Toast } from 'primereact/toast'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Divider } from 'primereact/divider'
import { useCompanySettings } from '../hooks/useCompanySettings'
import LocationPicker from './LocationPicker'

const WEEKDAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 }
]

export default function MaintenanceTab({ profile }) {
  const { settings, loading, saving, saveSettings } = useCompanySettings(profile?.company_id)
  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: null,
    longitude: null,
    radius_meters: 100,
    working_days: [1, 2, 3, 4, 5],
    shift_start: '09:00',
    shift_end: '18:00'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [mapFlyTo, setMapFlyTo] = useState(null)
  const [triggering, setTriggering] = useState(false)
  const toast = useRef(null)

  useEffect(() => {
    if (!settings) return
    setForm({
      name: settings.name || '',
      address: settings.address || '',
      latitude: settings.latitude ?? null,
      longitude: settings.longitude ?? null,
      radius_meters: settings.radius_meters || 100,
      working_days: settings.working_days || [1, 2, 3, 4, 5],
      shift_start: settings.shift_start || '09:00',
      shift_end: settings.shift_end || '18:00'
    })
  }, [settings])

  function upd(key, val) {
    setForm(current => ({ ...current, [key]: val }))
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearched(false)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'ClockApp/1.0' } }
      )
      const data = await res.json()
      setSearchResults(data)
      setSearched(true)
    } catch {
      toast.current.show({
        severity: 'error',
        summary: 'Search failed',
        detail: 'Could not reach location service.',
        life: 3000
      })
    }
    setSearching(false)
  }

  function selectLocation(result) {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setForm(current => ({ ...current, address: result.display_name, latitude: lat, longitude: lng }))
    setSearchResults([])
    setSearched(false)
    setSearchQuery('')
    setMapFlyTo({ lat, lng })
  }

  async function handleMapPick(lat, lng) {
    setForm(current => ({ ...current, latitude: lat, longitude: lng }))
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'ClockApp/1.0' } }
      )
      const data = await res.json()
      if (data?.display_name) {
        setForm(current => ({ ...current, address: data.display_name }))
      }
    } catch {
      // Ignore reverse geocode failures; coordinates are already saved locally.
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.current.show({
        severity: 'warn',
        summary: 'Required',
        detail: 'Company name is required.',
        life: 3000
      })
      return
    }

    const { error } = await saveSettings(form)
    if (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message, life: 4000 })
    } else {
      toast.current.show({ severity: 'success', summary: 'Saved', detail: 'Company settings updated.', life: 3000 })
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
      const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/deploy.yml/dispatches`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ref: 'main' })
      })
      if (res.status === 204) {
        toast.current.show({
          severity: 'success',
          summary: 'Deployment Triggered',
          detail: 'GitHub Actions workflow started.',
          life: 4000
        })
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `GitHub responded with status ${res.status}`)
      }
    } catch (err) {
      toast.current.show({ severity: 'error', summary: 'Deploy Failed', detail: err.message, life: 5000 })
    }
    setTriggering(false)
  }

  if (loading) {
    return <div className="flex justify-content-center p-5"><ProgressSpinner /></div>
  }

  if (!profile?.company_id) {
    return (
      <Card className="glass-card maintenance-panel">
        <p style={{ color: 'var(--app-text-soft)' }}>You are not assigned to a company. Contact a Super Admin.</p>
      </Card>
    )
  }

  return (
    <>
      <Toast ref={toast} />
      <div className="d-flex flex-column gap-4">
        <Card className="glass-card maintenance-card maintenance-panel">
          <div className="d-flex flex-column gap-4">
            <div>
              <h2 className="section-title">Company Settings</h2>
              <p className="section-copy">Update your company identity, office location, check-in radius, and shift schedule.</p>
            </div>

            <div className="settings-cluster">
              <div className="settings-cluster-head">
                <div>
                  <h3 className="settings-cluster-title">Company Identity</h3>
                  <p className="settings-cluster-copy">Set the official company name and weekly schedule shown to your team.</p>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <div className="flex flex-column gap-2 input-shell">
                    <label className="field-label">Company Name</label>
                    <InputText
                      value={form.name}
                      onChange={e => upd('name', e.target.value)}
                      placeholder="e.g. Webgeaz Sdn Bhd"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="flex flex-column gap-2 input-shell">
                    <label className="field-label">Working Days</label>
                    <MultiSelect
                      value={form.working_days}
                      onChange={e => upd('working_days', e.value)}
                      options={WEEKDAYS}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select days"
                      display="chip"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="flex flex-column gap-2 input-shell">
                    <label className="field-label">Radius (meters)</label>
                    <InputNumber value={form.radius_meters} onValueChange={e => upd('radius_meters', e.value)} min={10} max={5000} showButtons />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="flex flex-column gap-2 input-shell">
                    <label className="field-label">Shift Start</label>
                    <InputText value={form.shift_start} onChange={e => upd('shift_start', e.target.value)} type="time" className="w-full" />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="flex flex-column gap-2 input-shell">
                    <label className="field-label">Shift End</label>
                    <InputText value={form.shift_end} onChange={e => upd('shift_end', e.target.value)} type="time" className="w-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-cluster">
              <div className="settings-cluster-head">
                <div>
                  <h3 className="settings-cluster-title">Office Location</h3>
                  <p className="settings-cluster-copy">Search by address or pin the exact location on the map to define valid clock-in boundaries.</p>
                </div>
              </div>

              <div className="flex flex-column gap-2">
                <label className="field-label">Search Location</label>
                <div className="search-bar-shell">
                  <InputText
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value)
                      setSearched(false)
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g. Jalan Ampang, Kuala Lumpur"
                    className="flex-1 w-full"
                  />
                  <Button type="button" onClick={handleSearch} disabled={searching} className="search-trigger-btn">
                    {searching ? <ProgressSpinner style={{ width: '18px', height: '18px' }} /> : <i className="pi pi-search" />}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="search-results-list">
                    {searchResults.map(result => (
                      <button key={result.place_id} className="search-result-item" onClick={() => selectLocation(result)} type="button">
                        {result.display_name}
                      </button>
                    ))}
                  </div>
                )}

                {searched && searchResults.length === 0 && (
                  <p className="inline-helper-text">No locations found. Try a street address or landmark.</p>
                )}

                {form.address && (
                  <div className="setting-highlight mt-2">
                    <p className="text-sm" style={{ color: 'var(--app-text-soft)', margin: 0 }}>Selected location</p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.88rem' }}>{form.address}</p>
                    {form.latitude ? (
                      <p className="text-sm mt-1" style={{ color: 'var(--app-text-soft)', margin: '0.25rem 0 0' }}>
                        {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="mt-2">
                  <p className="field-label mb-2">Or click the map to pin a location</p>
                  <LocationPicker lat={form.latitude} lng={form.longitude} flyTo={mapFlyTo} onPick={handleMapPick} />
                </div>
              </div>
            </div>

            <div className="d-flex flex-column flex-md-row gap-3 justify-content-between align-items-md-center">
              <div className="inline-helper-text">Changes apply to attendance validation and schedule visibility for your company.</div>
              <Button label="Save Settings" icon="pi pi-check" className="primary-btn w-full w-md-auto" loading={saving} onClick={handleSave} />
            </div>
          </div>
        </Card>

        <Divider className="my-0" />

        <Card className="glass-card maintenance-card maintenance-panel">
          <div className="d-flex flex-column gap-4">
            <div>
              <h2 className="section-title">Deployment</h2>
              <p className="section-copy">Trigger the GitHub Actions workflow for <code>github.com/Zieszx/clockinoutapp</code>.</p>
            </div>
            <Button label="Trigger Deployment Now" icon="pi pi-cloud-upload" severity="warning" outlined loading={triggering} onClick={handleTriggerPipeline} />
          </div>
        </Card>
      </div>
    </>
  )
}
