import { describe, it, expect } from 'vitest'
import { getDistanceMeters } from './geo'

describe('getDistanceMeters', () => {
  it('returns ~0 for same coordinates', () => {
    expect(getDistanceMeters(3.139, 101.686, 3.139, 101.686)).toBeCloseTo(0, 0)
  })
  it('returns ~314m for points ~314m apart', () => {
    const d = getDistanceMeters(3.139003, 101.686855, 3.141828, 101.686855)
    expect(d).toBeGreaterThan(300)
    expect(d).toBeLessThan(330)
  })
  it('returns large distance for KL to London', () => {
    const d = getDistanceMeters(3.139, 101.686, 51.505, -0.09)
    expect(d).toBeGreaterThan(10000)
  })
})
