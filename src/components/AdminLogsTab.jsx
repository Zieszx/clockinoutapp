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
    <Card className="logs-card">
      <div className="flex flex-column md:flex-row gap-3 mb-4 align-items-start md:align-items-center justify-content-between flex-wrap">
        <div className="flex flex-column md:flex-row gap-3 align-items-start md:align-items-center flex-wrap">
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
      <DataTable
        value={entries}
        loading={loading}
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
    </Card>
  )
}
