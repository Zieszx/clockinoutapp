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
import { useCompanies } from '../hooks/useCompanies'

const WEEKDAYS = [
  { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }, { label: 'Sun', value: 0 },
]

const EMPTY = {
  id: null, name: '', address: '', latitude: null, longitude: null,
  radius_meters: 100, working_days: [1,2,3,4,5], shift_start: '09:00', shift_end: '18:00',
}

export default function CompaniesTab({ session }) {
  const { companies, loading, saveCompany, deleteCompany } = useCompanies()
  const [showDialog, setShowDialog] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const toast = useRef(null)

  function upd(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function openNew() { setForm(EMPTY); setSearchQuery(''); setSearchResults([]); setShowDialog(true) }
  function openEdit(c) {
    setForm({ id: c.id, name: c.name, address: c.address || '', latitude: c.latitude, longitude: c.longitude,
      radius_meters: c.radius_meters, working_days: c.working_days || [1,2,3,4,5],
      shift_start: c.shift_start || '09:00', shift_end: c.shift_end || '18:00' })
    setSearchQuery(''); setSearchResults([]); setShowDialog(true)
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'ClockApp/1.0' } }
      )
      setSearchResults(await res.json())
    } catch {
      toast.current.show({ severity: 'error', summary: 'Search failed', detail: 'Could not reach location service.', life: 3000 })
    }
    setSearching(false)
  }

  function selectLocation(r) {
    upd('address', r.display_name)
    upd('latitude', parseFloat(r.lat))
    upd('longitude', parseFloat(r.lon))
    setSearchResults([])
    setSearchQuery('')
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

  async function handleDelete(c) {
    const { error } = await deleteCompany(c.id)
    if (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message, life: 4000 })
    } else {
      toast.current.show({ severity: 'success', summary: 'Deleted', detail: `${c.name} removed.`, life: 3000 })
    }
  }

  const actionBody = row => (
    <div className="d-flex gap-2">
      <Button icon="pi pi-pencil" text size="small" onClick={() => openEdit(row)} />
      <Button icon="pi pi-trash" text size="small" severity="danger" onClick={() => handleDelete(row)} />
    </div>
  )

  return (
    <>
      <Toast ref={toast} />
      <Card className="glass-card logs-card">
        <div className="table-header">
          <div className="table-header-copy">
            <h2 className="section-title">Companies</h2>
            <p className="text-muted-soft">Manage all companies registered on the platform.</p>
          </div>
          <Button label="New Company" icon="pi pi-plus" className="primary-btn" onClick={openNew} />
        </div>
        <DataTable value={companies} loading={loading} className="entries-table" stripedRows emptyMessage="No companies yet" size="small">
          <Column field="name" header="Name" />
          <Column header="Address" body={r => r.address ? r.address.slice(0,60) + (r.address.length > 60 ? '…' : '') : '—'} />
          <Column header="Shift" body={r => `${r.shift_start || '?'} – ${r.shift_end || '?'}`} />
          <Column header="Radius" body={r => `${r.radius_meters}m`} />
          <Column header="" body={actionBody} style={{ width: '90px' }} />
        </DataTable>
      </Card>

      <Dialog header={form.id ? 'Edit Company' : 'New Company'} visible={showDialog} onHide={() => setShowDialog(false)} style={{ width: '580px', maxWidth: '95vw' }} modal>
        <div className="d-flex flex-column gap-4 pt-2">
          <div className="flex flex-column gap-2 input-shell">
            <label className="field-label">Company Name *</label>
            <InputText value={form.name} onChange={e => upd('name', e.target.value)} placeholder="e.g. Webgeaz Sdn Bhd" className="w-full" />
          </div>

          <div className="flex flex-column gap-2">
            <label className="field-label">Search Location</label>
            <div className="d-flex gap-2">
              <InputText
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Type office name or address..."
                className="flex-1 w-full"
              />
              <Button onClick={handleSearch} disabled={searching} style={{ minWidth: '44px' }}>
                {searching ? <ProgressSpinner style={{ width: '18px', height: '18px' }} /> : <i className="pi pi-search" />}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="search-results-list">
                {searchResults.map(r => (
                  <button key={r.place_id} className="search-result-item" onClick={() => selectLocation(r)} type="button">
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}
            {form.address && (
              <div className="setting-highlight mt-2">
                <p className="text-sm" style={{ color: 'var(--app-text-soft)', margin: 0 }}>Selected location</p>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.88rem' }}>{form.address}</p>
                {form.latitude && <p className="text-sm mt-1" style={{ color: 'var(--app-text-soft)', margin: '0.25rem 0 0' }}>{parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}</p>}
              </div>
            )}
          </div>

          <div className="maintenance-form-grid">
            <div className="flex flex-column gap-2 input-shell">
              <label className="field-label">Radius (meters)</label>
              <InputNumber value={form.radius_meters} onValueChange={e => upd('radius_meters', e.value)} min={10} max={5000} showButtons />
            </div>
            <div className="flex flex-column gap-2 input-shell">
              <label className="field-label">Working Days</label>
              <MultiSelect value={form.working_days} onChange={e => upd('working_days', e.value)} options={WEEKDAYS} optionLabel="label" optionValue="value" placeholder="Select days" display="chip" className="w-full" />
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

          <div className="d-flex gap-2 justify-content-end">
            <Button label="Cancel" text onClick={() => setShowDialog(false)} />
            <Button label={form.id ? 'Update' : 'Create'} icon="pi pi-check" className="primary-btn" loading={saving} onClick={handleSave} />
          </div>
        </div>
      </Dialog>
    </>
  )
}
