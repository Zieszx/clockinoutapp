import { useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { SelectButton } from 'primereact/selectbutton'
import { Calendar } from 'primereact/calendar'
import { Tag } from 'primereact/tag'
import { Card } from 'primereact/card'
import { useAllTimeEntries } from '../hooks/useAllTimeEntries'
import { calcDuration, formatTime, formatDate } from '../utils/duration'
import { getPresetRange } from '../utils/dateRange'
import { exportToXLSX } from '../utils/export'

const PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'All', value: 'all' }
]

export default function AdminLogsTab({ companyId }) {
  const { entries, loading, refetch } = useAllTimeEntries(companyId)
  const [preset, setPreset] = useState('all')
  const [customRange, setCustomRange] = useState(null)
  const uniqueEmployees = new Set(entries.map(row => row.user_id)).size
  const activeSessions = entries.filter(row => !row.clock_out).length

  function handlePresetChange(value) {
    if (!value) return
    setPreset(value)
    setCustomRange(null)
    refetch(getPresetRange(value))
  }

  function handleCustomRange(dates) {
    setCustomRange(dates)
    if (dates?.[0] && dates?.[1]) {
      setPreset(null)
      refetch({ start: dates[0].toISOString(), end: dates[1].toISOString() })
    }
  }

  const durationBody = row => {
    const d = calcDuration(row.clock_in, row.clock_out)
    return d === 'In progress' ? <Tag severity="success" value="In progress" /> : d
  }

  return (
    <Card className="glass-card logs-card table-panel">
      <div className="table-header">
        <div className="table-header-copy">
          <h2 className="section-title">Team attendance logs</h2>
          <p className="text-muted-soft">Review attendance across your company with export-ready filters and clearer mobile views.</p>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-pill">
          <span className="label">Employees</span>
          <span className="value">{uniqueEmployees}</span>
        </div>
        <div className="summary-pill">
          <span className="label">Entries</span>
          <span className="value">{entries.length}</span>
        </div>
        <div className="summary-pill">
          <span className="label">Active Sessions</span>
          <span className="value">{activeSessions}</span>
        </div>
      </div>

      <div className="logs-filter-bar">
        <div className="logs-filter-group input-shell">
          <SelectButton value={preset} onChange={e => handlePresetChange(e.value)} options={PRESETS} />
          <Calendar
            value={customRange}
            onChange={e => handleCustomRange(e.value)}
            selectionMode="range"
            readOnlyInput
            placeholder="Custom range"
            showIcon
            dateFormat="dd/mm/yy"
          />
        </div>
        <Button
          label="Export XLSX"
          icon="pi pi-file-excel"
          severity="success"
          outlined
          onClick={() => exportToXLSX(entries)}
          disabled={entries.length === 0}
        />
      </div>

      <div className="desktop-table">
        <DataTable
          value={entries}
          loading={loading}
          className="entries-table"
          scrollable
          scrollHeight="420px"
          stripedRows
          emptyMessage="No records found"
          size="small"
        >
          <Column field="full_name" header="Name" body={row => row.full_name || '—'} />
          <Column field="email" header="Email" />
          <Column header="Date" body={row => formatDate(row.clock_in)} />
          <Column header="Clock In" body={row => formatTime(row.clock_in)} />
          <Column header="Clock Out" body={row => formatTime(row.clock_out)} />
          <Column header="Duration" body={durationBody} />
        </DataTable>
      </div>

      <div className="mobile-records">
        {loading ? (
          <div className="mobile-empty-state">Loading records...</div>
        ) : entries.length === 0 ? (
          <div className="mobile-empty-state">No records found</div>
        ) : (
          entries.map(entry => (
            <article key={entry.id} className="mobile-record-card">
              <div className="mobile-record-head">
                <div>
                  <div className="mobile-record-title">{entry.full_name || '—'}</div>
                  <div className="mobile-record-subtitle">{entry.email}</div>
                </div>
                <div className="mobile-record-tag">{durationBody(entry)}</div>
              </div>
              <div className="mobile-record-grid">
                <div className="mobile-record-cell">
                  <span>Date</span>
                  <strong>{formatDate(entry.clock_in)}</strong>
                </div>
                <div className="mobile-record-cell">
                  <span>Clock In</span>
                  <strong>{formatTime(entry.clock_in)}</strong>
                </div>
                <div className="mobile-record-cell">
                  <span>Clock Out</span>
                  <strong>{formatTime(entry.clock_out)}</strong>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </Card>
  )
}
