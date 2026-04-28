import { useRef, useState } from 'react'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { Tag } from 'primereact/tag'
import { supabase } from '../lib/supabase'

export default function ProfileTab({ profile }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    department: profile?.department || ''
  })
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const toast = useRef(null)

  function update(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSaveProfile() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        department: form.department.trim() || null
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
      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <Card className="glass-card maintenance-card maintenance-panel h-100">
            <div className="d-flex flex-column gap-4">
              <div>
                <h2 className="section-title">Personal Information</h2>
                <p className="section-copy">Keep your profile details accurate so your team directory and attendance records stay up to date.</p>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="flex flex-column gap-2 input-shell">
                    <label className="field-label">Full Name</label>
                    <InputText value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Your full name" className="w-full" />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="flex flex-column gap-2 input-shell">
                    <label className="field-label">Department</label>
                    <InputText value={form.department} onChange={e => update('department', e.target.value)} placeholder="e.g. Engineering" className="w-full" />
                  </div>
                </div>
                <div className="col-12">
                  <div className="flex flex-column gap-2 input-shell">
                    <label className="field-label">Phone</label>
                    <InputText value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+60 12-345 6789" className="w-full" />
                  </div>
                </div>
              </div>

              <Button label="Save Changes" icon="pi pi-check" className="primary-btn w-100 w-md-auto" loading={saving} onClick={handleSaveProfile} />
            </div>
          </Card>
        </div>

        <div className="col-12 col-xl-5">
          <div className="d-flex flex-column gap-4 h-100">
            <Card className="glass-card status-panel">
              <div className="d-flex flex-column gap-3">
                <h2 className="section-title">Account Overview</h2>
                <div className="status-grid">
                  <div className="status-tile">
                    <div className="status-tile-label">Email</div>
                    <div className="status-tile-value text-break">{profile?.email}</div>
                  </div>
                  <div className="status-tile">
                    <div className="status-tile-label">Company</div>
                    <div className="status-tile-value">{profile?.company?.name || 'Not assigned'}</div>
                  </div>
                  <div className="status-highlight d-flex flex-wrap gap-2 align-items-center">
                    {(profile?.roles || ['employee']).map(role => (
                      <Tag key={role} value={role.replace('_', ' ')} rounded severity={role === 'super_admin' ? 'danger' : role === 'admin' ? 'warning' : 'info'} />
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="glass-card status-panel flex-1">
              <div className="d-flex flex-column gap-4">
                <div>
                  <h2 className="section-title">Change Password</h2>
                  <p className="section-copy">Update your password with a simple, mobile-friendly security form.</p>
                </div>
                <div className="d-flex flex-column gap-3">
                  <div className="flex flex-column gap-2 input-shell">
                    <label className="field-label">New Password</label>
                    <Password value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" toggleMask feedback={false} className="w-full" inputClassName="w-full" style={{ width: '100%' }} />
                  </div>
                  <div className="flex flex-column gap-2 input-shell">
                    <label className="field-label">Confirm Password</label>
                    <Password value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm password" feedback={false} toggleMask className="w-full" inputClassName="w-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <Button label="Change Password" icon="pi pi-lock" severity="warning" outlined className="w-100 w-md-auto" loading={changingPw} onClick={handleChangePassword} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
