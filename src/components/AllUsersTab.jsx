import { useRef, useState } from 'react'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { Dropdown } from 'primereact/dropdown'
import { MultiSelect } from 'primereact/multiselect'
import { Toast } from 'primereact/toast'
import { supabase } from '../lib/supabase'
import { useProfiles } from '../hooks/useProfiles'
import { useCompanies } from '../hooks/useCompanies'

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Admin', value: 'admin' },
  { label: 'Employee', value: 'employee' },
]

const EMPTY_FORM = { full_name: '', email: '', password: '', roles: ['employee'], company_id: null }

export default function AllUsersTab() {
  const { profiles, loading, refetch } = useProfiles()
  const { companies } = useCompanies()
  const [form, setForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const toast = useRef(null)

  function upd(key, val) { setForm(f => ({ ...f, [key]: val })) }

  const filtered = profiles.filter(p =>
    !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.company?.name?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate() {
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.current.show({ severity: 'warn', summary: 'Required', detail: 'Name, email, and password are required.', life: 3000 })
      return
    }
    setCreating(true)
    try {
      const { data: s } = await supabase.auth.getSession()
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { full_name: form.full_name.trim(), email: form.email.trim(), password: form.password, roles: form.roles, company_id: form.company_id },
        headers: { Authorization: `Bearer ${s.session?.access_token}` }
      })
      if (error || data?.error) throw new Error(data?.error || error?.message)
      toast.current.show({ severity: 'success', summary: 'User Created', detail: `${form.email} added.`, life: 4000 })
      setForm(EMPTY_FORM)
      await refetch()
    } catch (err) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
    }
    setCreating(false)
  }

  const rolesBody = row => (
    <div className="d-flex flex-wrap gap-1">
      {(row.roles || ['employee']).map(r => (
        <Tag key={r} severity={r === 'super_admin' ? 'danger' : r === 'admin' ? 'warning' : 'info'} value={r} rounded />
      ))}
    </div>
  )

  const companyBody = row => row.company?.name || <span style={{ color: 'var(--app-text-soft)' }}>—</span>

  return (
    <>
      <Toast ref={toast} />
      <div className="content-grid">
        <Card className="glass-card maintenance-card maintenance-panel">
          <div className="d-flex flex-column gap-4">
            <div>
              <h2 className="section-title">Add New User</h2>
              <p className="section-copy">Create a user and assign them to any company.</p>
            </div>
            <div className="maintenance-form-grid">
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Full Name</label>
                <InputText value={form.full_name} onChange={e => upd('full_name', e.target.value)} placeholder="Full name" className="w-full" />
              </div>
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Roles</label>
                <MultiSelect value={form.roles} onChange={e => upd('roles', e.value)} options={ROLE_OPTIONS} optionLabel="label" optionValue="value" placeholder="Select roles" display="chip" className="w-full" />
              </div>
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Email</label>
                <InputText value={form.email} onChange={e => upd('email', e.target.value)} placeholder="name@company.com" className="w-full" />
              </div>
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Company</label>
                <Dropdown value={form.company_id} onChange={e => upd('company_id', e.value)} options={companies} optionLabel="name" optionValue="id" placeholder="Select company" className="w-full" showClear />
              </div>
              <div className="flex flex-column gap-2 input-shell maintenance-form-span-2">
                <label className="field-label">Temporary Password</label>
                <Password value={form.password} onChange={e => upd('password', e.target.value)} feedback={false} toggleMask className="w-full" inputClassName="w-full" style={{ width: '100%' }} />
              </div>
            </div>
            <Button label="Create User" icon="pi pi-user-plus" className="primary-btn w-full md:w-auto" loading={creating} onClick={handleCreate} />
          </div>
        </Card>

        <Card className="glass-card logs-card table-panel">
          <div className="table-header">
            <div className="table-header-copy">
              <h2 className="section-title">All Users</h2>
              <p className="text-muted-soft">Every user across all companies on the platform.</p>
            </div>
            <InputText value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ maxWidth: '200px' }} />
          </div>
          <DataTable value={filtered} loading={loading} className="entries-table" scrollable scrollHeight="460px" stripedRows emptyMessage="No users found" size="small">
            <Column field="full_name" header="Name" body={r => r.full_name || '—'} />
            <Column field="email" header="Email" />
            <Column header="Company" body={companyBody} />
            <Column header="Roles" body={rolesBody} />
            <Column header="Last Login" body={r => r.last_login_at ? new Date(r.last_login_at).toLocaleDateString() : 'Never'} />
          </DataTable>
        </Card>
      </div>
    </>
  )
}
