import * as XLSX from 'xlsx'
import { calcDuration, formatTime, formatDate } from './duration'

export function exportToXLSX(entries, filename = 'time-logs.xlsx') {
  const rows = entries.map(e => ({
    'Employee': e.full_name || e.email || 'Unknown',
    'Date': formatDate(e.clock_in),
    'Clock In': formatTime(e.clock_in),
    'Clock Out': e.clock_out ? formatTime(e.clock_out) : '—',
    'Duration': calcDuration(e.clock_in, e.clock_out)
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Time Logs')
  XLSX.writeFile(wb, filename)
}
