import { useRef, useState } from 'react'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { MultiSelect } from 'primereact/multiselect'
import { Toast } from 'primereact/toast'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Tag } from 'primereact/tag'
import { useCompanies } from '../hooks/useCompanies'
import LocationPicker from './LocationPicker'

const WEEKDAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
]

const EMPTY = {
  id: null,
  name: '',
  address: '',
  latitude: null,
  longitude: null,
  radius_meters: 100,
  working_days: [1, 2, 3, 4, 5],
  shift_start: '09:00',
  shift_end: '18:00',
}

export default function CompaniesTab({ session }) {
  const { companies, loading, saveCompany, deleteCompany } = useCompanies()
  const [showDialog, setShowDialog] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [mapFlyTo, setMapFlyTo] = useState(null)
  const toast = useRef(null)

  function upd(key, val) {
    setForm(current => ({ ...current, [key]: val }))
  }

  function resetLookup() {
    setSearchQuery('')
    setSearchResults([])
    setSearched(false)
    setMapFlyTo(null)
  }

  function openNew() {
    setForm(EMPTY)
    resetLookup()
    setShowDialog(true)
  }

  function openEdit(company) {
    setForm({
      id: company.id,
      name: company.name,
      address: company.address || '',
      latitude: company.latitude,
      longitude: company.longitude,
      radius_meters: company.radius_meters,
      working_days: company.working_days || [1, 2, 3, 4, 5],
      shift_start: company.shift_start || '09:00',
      shift_end: company.shift_end || '18:00',
    })
    setSearchQuery('')
    setSearchResults([])
    setSearched(false)
    setMapFlyTo(company.latitude && company.longitude ? { lat: company.latitude, lng: company.longitude } : null)
    setShowDialog(true)
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
      toast.current.show({ severity: 'error', summary: 'Search failed', detail: 'Could not reach location service.', life: 3000 })
    }

    setSearching(false)
  }

  function selectLocation(result) {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)

    upd('address', result.display_name)
    upd('latitude', lat)
    upd('longitude', lng)
    setSearchResults([])
    setSearched(false)
    setSearchQuery('')
    setMapFlyTo({ lat, lng })
  }

  async function handleMapPick(lat, lng) {
    upd('latitude', lat)
    upd('longitude', lng)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'ClockApp/1.0' } }
      )
      const data = await res.json()
      if (data?.display_name) upd('address', data.display_name)
    } catch {
      // Keep picked coordinates even if reverse geocoding fails.
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.current.show({ severity: 'warn', summary: 'Required', detail: 'Company name is required.', life: 3000 })
      return
    }

    setSaving(true)
    const payload = { ...form, name: form.name.trim(), created_by: session?.user?.id }

    if (!payload.id) delete payload.id

    const { error } = await saveCompany(payload)

    if (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message, life: 4000 })
    } else {
      toast.current.show({ severity: 'success', summary: form.id ? 'Updated' : 'Created', detail: `"${form.name}" saved.`, life: 3000 })
      setShowDialog(false)
    }

    setSaving(false)
  }

  async function handleDelete(company) {
    const { error } = await deleteCompany(company.id)

    if (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message, life: 4000 })
    } else {
      toast.current.show({ severity: 'success', summary: 'Deleted', detail: `${company.name} removed.`, life: 3000 })
    }
  }

  const companyCount = companies.length
  const locatedCount = companies.filter(company => company.latitude && company.longitude).length

  const actionBody = row => (
    <div className="d-flex gap-2">
      <Button icon="pi pi-pencil" text size="small" onClick={() => openEdit(row)} />
      <Button icon="pi pi-trash" text size="small" severity="danger" onClick={() => handleDelete(row)} />
    </div>
  )

  const addressBody = row => (
    row.address
      ? `${row.address.slice(0, 72)}${row.address.length > 72 ? '...' : ''}`
      : <span className="text-muted-soft">No address set</span>
  )

  const shiftBody = row => `${row.shift_start || '--:--'} to ${row.shift_end || '--:--'}`

  return (
    <>
      <Toast ref={toast} />

      <Card className="glass-card logs-card table-panel">
        <div className="table-header">
          <div className="table-header-copy">
            <h2 className="section-title">Companies</h2>
            <p className="text-muted-soft">Manage company-level locations, shift windows, and operational defaults from one directory.</p>
          </div>
          <Button label="New Company" icon="pi pi-plus" className="primary-btn" onClick={openNew} />
        </div>

        <div className="summary-grid">
          <div className="summary-pill">
            <span className="label">Companies</span>
            <span className="value">{companyCount}</span>
          </div>
          <div className="summary-pill">
            <span className="label">Mapped Locations</span>
            <span className="value">{locatedCount}</span>
          </div>
          <div className="summary-pill">
            <span className="label">Coverage</span>
            <span className="value">{companyCount ? `${Math.round((locatedCount / companyCount) * 100)}%` : '0%'}</span>
          </div>
        </div>

        <div className="desktop-table">
          <DataTable value={companies} loading={loading} className="entries-table" stripedRows emptyMessage="No companies yet" size="small">
            <Column field="name" header="Name" />
            <Column header="Address" body={addressBody} />
            <Column header="Shift" body={shiftBody} />
            <Column header="Radius" body={row => `${row.radius_meters}m`} />
            <Column header="Working Days" body={row => `${(row.working_days || []).length} days`} />
            <Column header="" body={actionBody} style={{ width: '96px' }} />
          </DataTable>
        </div>

        <div className="mobile-records">
          {loading ? (
            <div className="mobile-empty-state">Loading companies...</div>
          ) : companies.length === 0 ? (
            <div className="mobile-empty-state">No companies yet</div>
          ) : (
            companies.map(company => (
              <article key={company.id} className="mobile-record-card">
                <div className="mobile-record-head">
                  <div>
                    <div className="mobile-record-title">{company.name}</div>
                    <div className="mobile-record-subtitle">{company.address || 'No address set yet'}</div>
                  </div>
                  <div className="d-flex gap-2">
                    <Button icon="pi pi-pencil" text size="small" onClick={() => openEdit(company)} />
                    <Button icon="pi pi-trash" text size="small" severity="danger" onClick={() => handleDelete(company)} />
                  </div>
                </div>
                <div className="mobile-record-grid">
                  <div className="mobile-record-cell">
                    <span>Shift</span>
                    <strong>{shiftBody(company)}</strong>
                  </div>
                  <div className="mobile-record-cell">
                    <span>Radius</span>
                    <strong>{company.radius_meters} meters</strong>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </Card>

      <Dialog
        header={form.id ? 'Edit Company' : 'New Company'}
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        style={{ width: '760px', maxWidth: '95vw' }}
        modal
      >
        <div className="d-flex flex-column gap-4 pt-2">
          <div className="settings-cluster">
            <div className="settings-cluster-head">
              <div>
                <h3 className="settings-cluster-title">Company identity</h3>
                <p className="settings-cluster-copy">Set the core company details shown across the admin workspace.</p>
              </div>
              <Tag severity="info" value={form.id ? 'Editing existing company' : 'Creating new company'} rounded />
            </div>

            <div className="row g-3">
              <div className="col-12">
                <div className="flex flex-column gap-2 input-shell">
                  <label className="field-label">Company Name *</label>
                  <InputText value={form.name} onChange={e => upd('name', e.target.value)} placeholder="e.g. Webgeaz Sdn Bhd" className="w-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="settings-cluster">
            <div>
              <h3 className="settings-cluster-title">Office location</h3>
              <p className="settings-cluster-copy">Search for an address or click directly on the map to pin the company office.</p>
            </div>

            <div className="search-bar-shell">
              <div className="input-shell">
                <InputText
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setSearched(false)
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by address, area, or landmark"
                  className="w-full"
                />
              </div>
              <Button type="button" onClick={handleSearch} disabled={searching} className="primary-btn search-trigger-btn">
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
              <p className="inline-helper-text">No locations found. Try a fuller address or nearby landmark.</p>
            )}

            {form.address && (
              <div className="setting-highlight">
                <p className="text-sm text-muted-soft">Selected location</p>
                <p>{form.address}</p>
                {form.latitude && form.longitude ? (
                  <p className="text-sm text-muted-soft">
                    {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
                  </p>
                ) : null}
              </div>
            )}

            <div>
              <p className="field-label mb-2">Map pin</p>
              <LocationPicker lat={form.latitude} lng={form.longitude} flyTo={mapFlyTo} onPick={handleMapPick} />
            </div>
          </div>

          <div className="settings-cluster">
            <div>
              <h3 className="settings-cluster-title">Attendance defaults</h3>
              <p className="settings-cluster-copy">Define the allowed clock-in radius and standard weekly working schedule.</p>
            </div>

            <div className="maintenance-form-grid">
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Radius (meters)</label>
                <InputNumber value={form.radius_meters} onValueChange={e => upd('radius_meters', e.value)} min={10} max={5000} showButtons />
              </div>
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
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Shift Start</label>
                <InputText value={form.shift_start} onChange={e => upd('shift_start', e.target.value)} type="time" className="w-full" />
              </div>
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Shift End</label>
                <InputText value={form.shift_end} onChange={e => upd('shift_end', e.target.value)} type="time" className="w-full" />
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 justify-content-end flex-wrap">
            <Button label="Cancel" text onClick={() => setShowDialog(false)} />
            <Button label={form.id ? 'Update Company' : 'Create Company'} icon="pi pi-check" className="primary-btn" loading={saving} onClick={handleSave} />
          </div>
        </div>
      </Dialog>
    </>
  )
}
