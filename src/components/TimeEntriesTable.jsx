import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { calcDuration, formatTime, formatDate } from '../utils/duration'

export default function TimeEntriesTable({ entries, loading }) {
  const durationBody = row => {
    const d = calcDuration(row.clock_in, row.clock_out)
    return d === 'In progress' ? <Tag severity="success" value="In progress" /> : d
  }

  return (
    <DataTable
      value={entries}
      loading={loading}
      className="entries-table"
      scrollable
      scrollHeight="400px"
      stripedRows
      emptyMessage="No records found"
      size="small"
    >
      <Column header="Date" body={row => formatDate(row.clock_in)} />
      <Column header="Clock In" body={row => formatTime(row.clock_in)} />
      <Column header="Clock Out" body={row => formatTime(row.clock_out)} />
      <Column header="Duration" body={durationBody} />
    </DataTable>
  )
}
