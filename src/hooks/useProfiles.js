import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useProfiles() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, last_login_at, created_at')
      .order('created_at', { ascending: false })

    setProfiles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  return { profiles, loading, refetch: fetchProfiles }
}
