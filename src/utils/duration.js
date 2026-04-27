export function calcDuration(clockIn, clockOut) {
  if (!clockOut) return 'In progress'
  const ms = new Date(clockOut) - new Date(clockIn)
  const totalMins = Math.floor(ms / 60000)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return `${h}h ${m}m`
}

export function formatTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString([], { year: 'numeric', month: 'short', day: '2-digit' })
}
