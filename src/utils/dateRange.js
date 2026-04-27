export function getPresetRange(preset) {
  const now = new Date()
  switch (preset) {
    case 'today': {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      return { start: start.toISOString(), end: now.toISOString() }
    }
    case 'week': {
      const start = new Date(now)
      start.setDate(start.getDate() - start.getDay())
      start.setHours(0, 0, 0, 0)
      return { start: start.toISOString(), end: now.toISOString() }
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: start.toISOString(), end: now.toISOString() }
    }
    default:
      return { start: null, end: null }
  }
}
