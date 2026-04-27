import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentPosition, getDistanceMeters } from '../utils/geo'

export function useTimeEntries(userId) {
  const [entries, setEntries] = useState([])
  const [openEntry, setOpenEntry] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setEntries(data || [])
    setOpenEntry((data || []).find(e => !e.clock_out) || null)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function clockIn() {
    const { data: settings } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (!settings?.latitude || !settings?.longitude) {
      return { error: { message: 'Office location not configured. Contact your admin.' } }
    }

    let position
    try {
      position = await getCurrentPosition()
    } catch {
      return { error: { message: 'Location access denied. Please enable GPS to clock in.' } }
    }

    const distance = getDistanceMeters(
      position.coords.latitude,
      position.coords.longitude,
      settings.latitude,
      settings.longitude
    )

    if (distance > settings.radius_meters) {
      return {
        error: {
          message: `You are ${Math.round(distance)}m from the office. Must be within ${settings.radius_meters}m.`
        }
      }
    }

    const { error } = await supabase
      .from('time_entries')
      .insert({ user_id: userId, clock_in: new Date().toISOString() })

    if (!error) await fetchEntries()
    return { error }
  }

  async function clockOut() {
    if (!openEntry) return { error: { message: 'No open session found.' } }
    const { error } = await supabase
      .from('time_entries')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', openEntry.id)
    if (!error) await fetchEntries()
    return { error }
  }

  return { entries, openEntry, loading, clockIn, clockOut, refetch: fetchEntries }
}
