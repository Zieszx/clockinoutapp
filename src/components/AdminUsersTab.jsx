import { useRef, useState } from 'react'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { supabase } from '../lib/supabase'
import { useProfiles } from '../hooks/useProfiles'

const ROLE_OPTIONS = [
  { label: 'Employee', value: 'employee' },
  { label: 'Admin', value: 'admin' }
]

export default function AdminUsersTab() {
  const { profiles, loading, refetch } = useProfiles()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'employee'
  })
  const [creating, setCreating] = useState(false)
  const toast = useRef(null)

  function updateForm(key, value) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function handleCreateUser() {
    try {
      if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
        throw new Error('Full name, email, and password are required.')
      }

      setCreating(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('Your session is missing. Please sign in again.')
      }

      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (error) throw error

      toast.current.show({
        severity: 'success',
        summary: 'User Created',
        detail: `Created ${data.user.email} as ${data.user.role}.`,
        life: 4000
      })

      setForm({
        full_name: '',
        email: '',
        password: '',
        role: 'employee'
      })
      await refetch()
    } catch (err) {
      toast.current.show({
        severity: 'error',
        summary: 'Create User Failed',
        detail: err.message,
        life: 5000
      })
    } finally {
      setCreating(false)
    }
  }

  const roleBody = row => (
    <Tag
      severity={row.role === 'admin' ? 'warning' : 'info'}
      value={row.role}
      rounded
    />
  )

  const loginBody = row => (
    row.last_login_at ? new Date(row.last_login_at).toLocaleString() : 'Never'
  )

  return (
    <>
      <Toast ref={toast} />
      <div className="content-grid">
        <Card className="glass-card maintenance-card maintenance-panel">
          <div className="d-flex flex-column gap-4">
            <div>
              <h2 className="section-title">Add a new user</h2>
              <p className="section-copy">Create employee or admin accounts securely through a protected Supabase Edge Function.</p>
            </div>

            <div className="maintenance-form-grid">
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Full name</label>
                <InputText
                  value={form.full_name}
                  onChange={e => updateForm('full_name', e.target.value)}
                  placeholder="Employee name"
                />
              </div>

              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Role</label>
                <Dropdown
                  value={form.role}
                  onChange={e => updateForm('role', e.value)}
                  options={ROLE_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select role"
                />
              </div>

              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Email</label>
                <InputText
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  placeholder="name@company.com"
                />
              </div>

              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Password</label>
                <Password
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  feedback={false}
                  toggleMask
                  inputClassName="w-full"
                />
              </div>
            </div>

            <Button
              label="Create User"
              icon="pi pi-user-plus"
              className="primary-btn w-full md:w-auto"
              loading={creating}
              onClick={handleCreateUser}
            />
          </div>
        </Card>

        <Card className="glass-card logs-card table-panel">
          <div className="table-header">
            <div className="table-header-copy">
              <h2 className="section-title">Access roster</h2>
              <p className="text-muted-soft">Review active user profiles, roles, and last login activity.</p>
            </div>
          </div>

          <DataTable
            value={profiles}
            loading={loading}
            className="entries-table"
            scrollable
            scrollHeight="420px"
            stripedRows
            emptyMessage="No users found"
            size="small"
          >
            <Column field="full_name" header="Name" body={row => row.full_name || '—'} />
            <Column field="email" header="Email" />
            <Column header="Role" body={roleBody} />
            <Column header="Created" body={row => new Date(row.created_at).toLocaleDateString()} />
            <Column header="Last Login" body={loginBody} />
          </DataTable>
        </Card>
      </div>
    </>
  )
}
