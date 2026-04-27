import { describe, it, expect } from 'vitest'
import { calcDuration, formatTime, formatDate } from './duration'

describe('calcDuration', () => {
  it('returns "In progress" when clockOut is null', () => {
    expect(calcDuration('2024-01-01T09:00:00Z', null)).toBe('In progress')
  })
  it('calculates 1h 30m correctly', () => {
    expect(calcDuration('2024-01-01T09:00:00Z', '2024-01-01T10:30:00Z')).toBe('1h 30m')
  })
  it('returns "0h 0m" for same timestamps', () => {
    expect(calcDuration('2024-01-01T09:00:00Z', '2024-01-01T09:00:00Z')).toBe('0h 0m')
  })
})

describe('formatTime', () => {
  it('returns "—" for null', () => {
    expect(formatTime(null)).toBe('—')
  })
})

describe('formatDate', () => {
  it('returns "—" for null', () => {
    expect(formatDate(null)).toBe('—')
  })
})
