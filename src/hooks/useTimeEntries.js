import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentPosition, getDistanceMeters } from '../utils/geo'

export function useTimeEntries(userId, companyId) {
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
    const open = (data || []).find(e => !e.clock_out) || null
    if (open) {
      const entryDate = new Date(open.clock_in).toDateString()
      if (entryDate !== new Date().toDateString()) {
        await supabase.from('time_entries')
          .update({ clock_out: open.clock_in, is_auto_clocked_out: true })
          .eq('id', open.id)
        setOpenEntry(null)
      } else {
        setOpenEntry(open)
      }
    } else {
      setOpenEntry(null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function clockIn() {
    if (!companyId) return { error: { message: 'You are not assigned to a company. Contact your admin.' } }

    const { data: company } = await supabase.from('companies').select('*').eq('id', companyId).single()
    if (!company) return { error: { message: 'Company settings not found. Contact your admin.' } }
    if (!company.latitude || !company.longitude) {
      return { error: { message: 'Office location not configured. Contact your admin.' } }
    }

    const now = new Date()

    if (company.working_days?.length) {
      const todayDay = now.getDay()
      if (!company.working_days.includes(todayDay)) {
        return { error: { message: 'Today is not a working day for your company.' } }
      }
    }

    if (company.shift_start && company.shift_end) {
      const [sh, sm] = company.shift_start.split(':').map(Number)
      const [eh, em] = company.shift_end.split(':').map(Number)
      const cur = now.getHours() * 60 + now.getMinutes()
      if (cur < sh * 60 + sm || cur > eh * 60 + em) {
        return { error: { message: `Clock-in only allowed between ${company.shift_start} and ${company.shift_end}.` } }
      }
    }

    const today = now.toISOString().split('T')[0]
    const { data: leaves } = await supabase
      .from('leaves')
      .select('id')
      .eq('user_id', userId)
      .lte('start_date', today)
      .gte('end_date', today)
      .limit(1)
    if (leaves?.length) {
      return { error: { message: 'You are on leave today and cannot clock in.' } }
    }

    let position
    try {
      position = await getCurrentPosition()
    } catch (err) {
      return { error: { message: err.message || 'Location access denied. Please enable GPS.' } }
    }

    const distance = getDistanceMeters(
      position.coords.latitude, position.coords.longitude,
      company.latitude, company.longitude
    )
    if (distance > company.radius_meters) {
      return { error: { message: `You are ${Math.round(distance)}m from the office. Must be within ${company.radius_meters}m.` } }
    }

    const { error } = await supabase
      .from('time_entries')
      .insert({ user_id: userId, company_id: companyId, clock_in: new Date().toISOString() })
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
