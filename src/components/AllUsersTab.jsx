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
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { supabase } from '../lib/supabase'
import { useProfiles } from '../hooks/useProfiles'
import { useCompanies } from '../hooks/useCompanies'

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Admin', value: 'admin' },
  { label: 'Employee', value: 'employee' },
]

const EMPTY_FORM = {
  full_name: '',
  email: '',
  password: '',
  roles: ['employee'],
  company_id: null,
}

export default function AllUsersTab() {
  const { profiles, loading, refetch } = useProfiles()
  const { companies } = useCompanies()
  const [showDialog, setShowDialog] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const toast = useRef(null)

  function upd(key, val) {
    setForm(current => ({ ...current, [key]: val }))
  }

  function openNew() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowDialog(true)
  }

  function openEdit(row) {
    setEditId(row.id)
    setForm({
      full_name: row.full_name || '',
      email: row.email || '',
      password: '',
      roles: row.roles || ['employee'],
      company_id: row.company_id || null,
    })
    setShowDialog(true)
  }

  const filtered = profiles.filter(profile =>
    !search ||
    profile.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    profile.email?.toLowerCase().includes(search.toLowerCase()) ||
    profile.company?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const superAdmins = filtered.filter(profile => (profile.roles || []).includes('super_admin')).length
  const admins = filtered.filter(profile => (profile.roles || []).includes('admin')).length

  async function handleSave() {
    if (!form.full_name.trim() || !form.email.trim() || (!editId && !form.password.trim())) {
      toast.current.show({
        severity: 'warn',
        summary: 'Required',
        detail: editId ? 'Name and email are required.' : 'Name, email, and password are required.',
        life: 3000,
      })
      return
    }

    setSaving(true)

    try {
      if (editId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: form.full_name.trim(),
            roles: form.roles,
            company_id: form.company_id || null,
          })
          .eq('id', editId)

        if (error) throw error

        toast.current.show({ severity: 'success', summary: 'Updated', detail: `${form.email} updated.`, life: 3000 })
      } else {
        const { data: sessionData } = await supabase.auth.getSession()
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
          body: {
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            password: form.password,
            roles: form.roles,
            company_id: form.company_id,
          },
          headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
        })

        if (error || data?.error) throw new Error(data?.error || error?.message)

        toast.current.show({ severity: 'success', summary: 'User Created', detail: `${form.email} added.`, life: 4000 })
      }

      setShowDialog(false)
      await refetch()
    } catch (err) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
    }

    setSaving(false)
  }

  const rolesBody = row => (
    <div className="d-flex flex-wrap gap-1">
      {(row.roles || ['employee']).map(role => (
        <Tag
          key={role}
          severity={role === 'super_admin' ? 'danger' : role === 'admin' ? 'warning' : 'info'}
          value={role.replace('_', ' ')}
          rounded
        />
      ))}
    </div>
  )

  const companyBody = row => row.company?.name || <span className="text-muted-soft">Unassigned</span>
  const lastLoginBody = row => row.last_login_at ? new Date(row.last_login_at).toLocaleString() : 'Never'
  const actionBody = row => <Button icon="pi pi-pencil" text size="small" onClick={() => openEdit(row)} />

  return (
    <>
      <Toast ref={toast} />

      <Card className="glass-card logs-card table-panel">
        <div className="table-header">
          <div className="table-header-copy">
            <h2 className="section-title">All Users</h2>
            <p className="text-muted-soft">Review every account on the platform and keep access roles aligned with company ownership.</p>
          </div>
          <div className="table-toolbar">
            <div className="input-shell toolbar-search">
              <InputText value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, or company" className="w-full" />
            </div>
            <Button label="New User" icon="pi pi-plus" className="primary-btn" onClick={openNew} />
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-pill">
            <span className="label">Visible Users</span>
            <span className="value">{filtered.length}</span>
          </div>
          <div className="summary-pill">
            <span className="label">Admins</span>
            <span className="value">{admins}</span>
          </div>
          <div className="summary-pill">
            <span className="label">Super Admins</span>
            <span className="value">{superAdmins}</span>
          </div>
        </div>

        <div className="desktop-table">
          <DataTable value={filtered} loading={loading} className="entries-table" scrollable scrollHeight="460px" stripedRows emptyMessage="No users found" size="small">
            <Column field="full_name" header="Name" body={row => row.full_name || 'No name'} />
            <Column field="email" header="Email" />
            <Column header="Company" body={companyBody} />
            <Column header="Roles" body={rolesBody} />
            <Column header="Last Login" body={lastLoginBody} />
            <Column header="" body={actionBody} style={{ width: '60px' }} />
          </DataTable>
        </div>

        <div className="mobile-records">
          {loading ? (
            <div className="mobile-empty-state">Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="mobile-empty-state">No users found</div>
          ) : (
            filtered.map(row => (
              <article key={row.id} className="mobile-record-card">
                <div className="mobile-record-head">
                  <div>
                    <div className="mobile-record-title">{row.full_name || 'No name'}</div>
                    <div className="mobile-record-subtitle">{row.email}</div>
                  </div>
                  <Button icon="pi pi-pencil" text size="small" onClick={() => openEdit(row)} />
                </div>
                <div className="d-flex flex-wrap gap-2 mb-3">{rolesBody(row)}</div>
                <div className="mobile-record-grid">
                  <div className="mobile-record-cell">
                    <span>Company</span>
                    <strong>{row.company?.name || 'Unassigned'}</strong>
                  </div>
                  <div className="mobile-record-cell">
                    <span>Last Login</span>
                    <strong>{lastLoginBody(row)}</strong>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </Card>

      <Dialog
        header={editId ? 'Edit User' : 'New User'}
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        style={{ width: '640px', maxWidth: '95vw' }}
        modal
      >
        <div className="d-flex flex-column gap-4 pt-2">
          <div className="settings-cluster">
            <div>
              <h3 className="settings-cluster-title">Account details</h3>
              <p className="settings-cluster-copy">Set the user identity, company assignment, and role coverage for this account.</p>
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
                <InputText value={form.email} onChange={e => upd('email', e.target.value)} placeholder="name@company.com" className="w-full" disabled={!!editId} />
              </div>
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Company</label>
                <Dropdown value={form.company_id} onChange={e => upd('company_id', e.value)} options={companies} optionLabel="name" optionValue="id" placeholder="Select company" className="w-full" showClear />
              </div>
            </div>
          </div>

          {!editId && (
            <div className="settings-cluster">
              <div>
                <h3 className="settings-cluster-title">Temporary password</h3>
                <p className="settings-cluster-copy">The user will use this password for the first sign-in, then can change it from their profile screen.</p>
              </div>

              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Temporary Password</label>
                <Password value={form.password} onChange={e => upd('password', e.target.value)} feedback={false} toggleMask className="w-full" inputClassName="w-full" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          <div className="d-flex gap-2 justify-content-end flex-wrap">
            <Button label="Cancel" text onClick={() => setShowDialog(false)} />
            <Button label={editId ? 'Update User' : 'Create User'} icon="pi pi-check" className="primary-btn" loading={saving} onClick={handleSave} />
          </div>
        </div>
      </Dialog>
    </>
  )
}
