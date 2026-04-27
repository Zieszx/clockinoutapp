import { useRef, useState } from 'react'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { supabase } from '../lib/supabase'

export default function ProfileTab({ profile }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    department: profile?.department || '',
  })
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const toast = useRef(null)

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSaveProfile() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        department: form.department.trim() || null,
      })
      .eq('id', profile.id)
    if (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message, life: 4000 })
    } else {
      toast.current.show({ severity: 'success', summary: 'Profile Updated', detail: 'Your changes have been saved.', life: 3000 })
    }
    setSaving(false)
  }

  async function handleChangePassword() {
    if (!password) return
    if (password !== confirmPw) {
      toast.current.show({ severity: 'error', summary: 'Mismatch', detail: 'Passwords do not match.', life: 3000 })
      return
    }
    if (password.length < 6) {
      toast.current.show({ severity: 'error', summary: 'Too short', detail: 'Minimum 6 characters.', life: 3000 })
      return
    }
    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message, life: 4000 })
    } else {
      toast.current.show({ severity: 'success', summary: 'Password Changed', detail: 'Your password has been updated.', life: 3000 })
      setPassword('')
      setConfirmPw('')
    }
    setChangingPw(false)
  }

  return (
    <>
      <Toast ref={toast} />
      <div className="content-grid">
        <Card className="glass-card maintenance-card maintenance-panel">
          <div className="d-flex flex-column gap-4">
            <div>
              <h2 className="section-title">Personal Information</h2>
              <p className="section-copy">Update your display name, department, and phone number.</p>
            </div>

            <div className="maintenance-form-grid">
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Full Name</label>
                <InputText value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Your full name" className="w-full" />
              </div>
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Department</label>
                <InputText value={form.department} onChange={e => update('department', e.target.value)} placeholder="e.g. Engineering" className="w-full" />
              </div>
              <div className="flex flex-column gap-2 input-shell maintenance-form-span-2">
                <label className="field-label">Phone</label>
                <InputText value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+60 12-345 6789" className="w-full" />
              </div>
            </div>

            <div className="d-flex flex-column gap-2">
              <div className="setting-highlight">
                <p className="text-sm" style={{ color: 'var(--app-text-soft)', margin: 0 }}>Email</p>
                <p style={{ margin: '0.25rem 0 0' }}><strong>{profile?.email}</strong></p>
              </div>
              {profile?.company?.name && (
                <div className="setting-highlight">
                  <p className="text-sm" style={{ color: 'var(--app-text-soft)', margin: 0 }}>Company</p>
                  <p style={{ margin: '0.25rem 0 0' }}><strong>{profile.company.name}</strong></p>
                </div>
              )}
            </div>

            <Button label="Save Changes" icon="pi pi-check" className="primary-btn w-full md:w-auto" loading={saving} onClick={handleSaveProfile} />
          </div>
        </Card>

        <Card className="glass-card status-panel">
          <div className="d-flex flex-column gap-4">
            <div>
              <h2 className="section-title">Change Password</h2>
              <p className="section-copy">Update your login password. Minimum 6 characters.</p>
            </div>
            <div className="flex flex-column gap-3">
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">New Password</label>
                <Password value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" toggleMask feedback={false} className="w-full" inputClassName="w-full" style={{ width: '100%' }} />
              </div>
              <div className="flex flex-column gap-2 input-shell">
                <label className="field-label">Confirm Password</label>
                <Password value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm password" feedback={false} toggleMask className="w-full" inputClassName="w-full" style={{ width: '100%' }} />
              </div>
            </div>
            <Button label="Change Password" icon="pi pi-lock" severity="warning" outlined className="w-full md:w-auto" loading={changingPw} onClick={handleChangePassword} />
          </div>
        </Card>
      </div>
    </>
  )
}
