import { useRef, useState } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { InputTextarea } from 'primereact/inputtextarea'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { Toast } from 'primereact/toast'
import { useLeaves } from '../hooks/useLeaves'

export default function LeaveTab({ userId, companyId }) {
  const { leaves, loading, addLeave, deleteLeave } = useLeaves(userId)
  const [dates, setDates] = useState(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useRef(null)

  async function handleAdd() {
    if (!dates?.[0] || !dates?.[1]) {
      toast.current.show({ severity: 'warn', summary: 'Select dates', detail: 'Choose a start and end date.', life: 3000 })
      return
    }
    setSaving(true)
    const start = dates[0].toISOString().split('T')[0]
    const end = dates[1].toISOString().split('T')[0]
    const { error } = await addLeave({
      start_date: start,
      end_date: end,
      reason: reason.trim() || null,
      company_id: companyId || null
    })
    if (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message, life: 4000 })
    } else {
      toast.current.show({ severity: 'success', summary: 'Leave Submitted', detail: `Leave set from ${start} to ${end}.`, life: 3000 })
      setDates(null)
      setReason('')
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    const { error } = await deleteLeave(id)
    if (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message, life: 4000 })
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const statusBody = row => {
    if (row.end_date < today) return <Tag severity="secondary" value="Past" rounded />
    if (row.start_date <= today && today <= row.end_date) return <Tag severity="warning" value="Active" rounded />
    return <Tag severity="info" value="Upcoming" rounded />
  }

  const actionBody = row => (
    row.start_date >= today
      ? <Button icon="pi pi-trash" severity="danger" text size="small" onClick={() => handleDelete(row.id)} />
      : null
  )

  return (
    <>
      <Toast ref={toast} />
      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <Card className="glass-card maintenance-card maintenance-panel h-100">
            <div className="d-flex flex-column gap-4">
              <div>
                <h2 className="section-title">Apply for Leave</h2>
                <p className="section-copy">Select a date range and add any context your team should know. The form stays simple and mobile-friendly.</p>
              </div>

              <div className="d-flex flex-column gap-3">
                <div className="flex flex-column gap-2 input-shell">
                  <label className="field-label">Date Range</label>
                  <Calendar
                    value={dates}
                    onChange={e => setDates(e.value)}
                    selectionMode="range"
                    readOnlyInput
                    showIcon
                    dateFormat="dd M yy"
                    placeholder="Select leave dates"
                    minDate={new Date()}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-column gap-2 input-shell">
                  <label className="field-label">Reason</label>
                  <InputTextarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Annual leave, medical, family, travel, or other context"
                    rows={4}
                    autoResize
                    className="w-full"
                  />
                </div>
              </div>

              <Button
                label="Submit Leave"
                icon="pi pi-calendar-plus"
                className="primary-btn w-100 w-md-auto"
                loading={saving}
                onClick={handleAdd}
              />
            </div>
          </Card>
        </div>

        <div className="col-12 col-xl-8">
          <Card className="glass-card logs-card table-panel h-100">
            <div className="table-header">
              <div className="table-header-copy">
                <h2 className="section-title">My Leave Records</h2>
                <p className="text-muted-soft">Track upcoming, active, and past leave entries in a cleaner timeline-style list.</p>
              </div>
            </div>

            <div className="desktop-table">
              <DataTable
                value={leaves}
                loading={loading}
                className="entries-table"
                stripedRows
                emptyMessage="No leave records yet"
                size="small"
              >
                <Column field="start_date" header="From" />
                <Column field="end_date" header="To" />
                <Column field="reason" header="Reason" body={row => row.reason || '—'} />
                <Column header="Status" body={statusBody} />
                <Column header="" body={actionBody} style={{ width: '60px' }} />
              </DataTable>
            </div>

            <div className="mobile-records">
              {loading ? (
                <div className="mobile-empty-state">Loading leave records...</div>
              ) : leaves.length === 0 ? (
                <div className="mobile-empty-state">No leave records yet</div>
              ) : (
                leaves.map(row => (
                  <article key={row.id} className="mobile-record-card">
                    <div className="mobile-record-head">
                      <div>
                        <div className="mobile-record-title">{row.start_date} to {row.end_date}</div>
                        <div className="mobile-record-subtitle">{row.reason || 'No reason provided'}</div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div className="mobile-record-tag">{statusBody(row)}</div>
                        {row.start_date >= today ? (
                          <Button icon="pi pi-trash" severity="danger" text size="small" onClick={() => handleDelete(row.id)} />
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
