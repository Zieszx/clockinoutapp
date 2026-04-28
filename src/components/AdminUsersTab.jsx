import { useRef, useState } from 'react'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { MultiSelect } from 'primereact/multiselect'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { supabase } from '../lib/supabase'
import { useProfiles } from '../hooks/useProfiles'

const ROLE_OPTIONS = [
  { label: 'Admin', value: 'admin' },
  { label: 'Employee', value: 'employee' }
]

const EMPTY_FORM = { full_name: '', email: '', password: '', roles: ['employee'] }

export default function AdminUsersTab({ profile }) {
  const { profiles, loading, refetch } = useProfiles()
  const [showDialog, setShowDialog] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const toast = useRef(null)

  const companyProfiles = profiles.filter(p => p.company_id === profile?.company_id)

  function upd(key, val) {
    setForm(f => ({ ...f, [key]: val }))
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
      roles: row.roles || ['employee']
    })
    setShowDialog(true)
  }

  async function handleSave() {
    if (!form.full_name.trim() || !form.email.trim() || (!editId && !form.password.trim())) {
      toast.current.show({
        severity: 'warn',
        summary: 'Required',
        detail: editId ? 'Name and email are required.' : 'Name, email, and password are required.',
        life: 3000
      })
      return
    }

    setSaving(true)
    try {
      if (editId) {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: form.full_name.trim(), roles: form.roles })
          .eq('id', editId)

        if (error) throw error
        toast.current.show({ severity: 'success', summary: 'Updated', detail: `${form.email} updated.`, life: 3000 })
      } else {
        const { data: s } = await supabase.auth.getSession()
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
          body: {
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            password: form.password,
            roles: form.roles,
            company_id: profile?.company_id
          },
          headers: {
            Authorization: `Bearer ${s.session?.access_token}`
          }
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
      {(row.roles || ['employee']).map(r => (
        <Tag key={r} severity={r === 'admin' ? 'warning' : 'info'} value={r} rounded />
      ))}
    </div>
  )

  const actionBody = row => (
    <Button icon="pi pi-pencil" text size="small" onClick={() => openEdit(row)} />
  )

  return (
    <>
      <Toast ref={toast} />
      <Card className="glass-card logs-card table-panel">
        <div className="table-header">
          <div className="table-header-copy">
            <h2 className="section-title">Team Members</h2>
            <p className="text-muted-soft">Users assigned to your company, with cleaner access controls and better mobile readability.</p>
          </div>
          <Button label="New User" icon="pi pi-plus" className="primary-btn" onClick={openNew} />
        </div>

        <div className="summary-grid">
          <div className="summary-pill">
            <span className="label">Members</span>
            <span className="value">{companyProfiles.length}</span>
          </div>
          <div className="summary-pill">
            <span className="label">Admins</span>
            <span className="value">{companyProfiles.filter(row => (row.roles || []).includes('admin')).length}</span>
          </div>
          <div className="summary-pill">
            <span className="label">Active Recently</span>
            <span className="value">{companyProfiles.filter(row => row.last_login_at).length}</span>
          </div>
        </div>

        <div className="desktop-table">
          <DataTable value={companyProfiles} loading={loading} className="entries-table" scrollable scrollHeight="420px" stripedRows emptyMessage="No users found" size="small">
            <Column field="full_name" header="Name" body={r => r.full_name || '—'} />
            <Column field="email" header="Email" />
            <Column header="Roles" body={rolesBody} />
            <Column header="Last Login" body={r => r.last_login_at ? new Date(r.last_login_at).toLocaleDateString() : 'Never'} />
            <Column header="" body={actionBody} style={{ width: '60px' }} />
          </DataTable>
        </div>

        <div className="mobile-records">
          {loading ? (
            <div className="mobile-empty-state">Loading users...</div>
          ) : companyProfiles.length === 0 ? (
            <div className="mobile-empty-state">No users found</div>
          ) : (
            companyProfiles.map(row => (
              <article key={row.id} className="mobile-record-card">
                <div className="mobile-record-head">
                  <div>
                    <div className="mobile-record-title">{row.full_name || '—'}</div>
                    <div className="mobile-record-subtitle">{row.email}</div>
                  </div>
                  <Button icon="pi pi-pencil" text size="small" onClick={() => openEdit(row)} />
                </div>
                <div className="mobile-record-grid">
                  <div className="mobile-record-cell">
                    <span>Roles</span>
                    <strong>{(row.roles || ['employee']).join(', ')}</strong>
                  </div>
                  <div className="mobile-record-cell">
                    <span>Last Login</span>
                    <strong>{row.last_login_at ? new Date(row.last_login_at).toLocaleDateString() : 'Never'}</strong>
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
        style={{ width: '520px', maxWidth: '95vw' }}
        modal
      >
        <div className="d-flex flex-column gap-4 pt-2">
          <div className="maintenance-form-grid">
            <div className="flex flex-column gap-2 input-shell">
              <label className="field-label">Full Name</label>
              <InputText value={form.full_name} onChange={e => upd('full_name', e.target.value)} placeholder="Full name" className="w-full" />
            </div>
            <div className="flex flex-column gap-2 input-shell">
              <label className="field-label">Roles</label>
              <MultiSelect value={form.roles} onChange={e => upd('roles', e.value)} options={ROLE_OPTIONS} optionLabel="label" optionValue="value" placeholder="Select roles" display="chip" className="w-full" />
            </div>
            <div className="flex flex-column gap-2 input-shell maintenance-form-span-2">
              <label className="field-label">Email</label>
              <InputText value={form.email} onChange={e => upd('email', e.target.value)} placeholder="name@company.com" className="w-full" disabled={!!editId} />
            </div>
            {!editId && (
              <div className="flex flex-column gap-2 input-shell maintenance-form-span-2">
                <label className="field-label">Temporary Password</label>
                <Password value={form.password} onChange={e => upd('password', e.target.value)} feedback={false} toggleMask className="w-full" inputClassName="w-full" style={{ width: '100%' }} />
              </div>
            )}
          </div>
          <div className="d-flex gap-2 justify-content-end">
            <Button label="Cancel" text onClick={() => setShowDialog(false)} />
            <Button label={editId ? 'Update' : 'Create'} icon="pi pi-check" className="primary-btn" loading={saving} onClick={handleSave} />
          </div>
        </div>
      </Dialog>
    </>
  )
}
