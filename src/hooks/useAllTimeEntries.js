import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAllTimeEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async (filters = {}) => {
    setLoading(true)

    let query = supabase
      .from('time_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.start) query = query.gte('clock_in', filters.start)
    if (filters.end) query = query.lte('clock_in', filters.end)

    const [{ data: entriesData }, { data: profilesData }] = await Promise.all([
      query,
      supabase.from('profiles').select('id, email, full_name')
    ])

    const profileMap = {}
    profilesData?.forEach(p => { profileMap[p.id] = p })

    setEntries(
      (entriesData || []).map(e => ({
        ...e,
        email: profileMap[e.user_id]?.email || 'Unknown',
        full_name: profileMap[e.user_id]?.full_name || ''
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { entries, loading, refetch: fetchAll }
}
