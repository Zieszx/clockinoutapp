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
    <>
      <div className="desktop-table">
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
                  <div className="mobile-record-title">{formatDate(entry.clock_in)}</div>
                  <div className="mobile-record-subtitle">Attendance session</div>
                </div>
                <div className="mobile-record-tag">{durationBody(entry)}</div>
              </div>
              <div className="mobile-record-grid">
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
    </>
  )
}
