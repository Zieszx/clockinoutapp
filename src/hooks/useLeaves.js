import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useLeaves(userId) {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('leaves')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
    setLeaves(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { refetch() }, [refetch])

  function isOnLeaveToday() {
    const today = new Date().toISOString().split('T')[0]
    return leaves.some(l => l.start_date <= today && l.end_date >= today)
  }

  async function addLeave(payload) {
    const { error } = await supabase.from('leaves').insert({ ...payload, user_id: userId })
    if (!error) await refetch()
    return { error }
  }

  async function deleteLeave(id) {
    const { error } = await supabase.from('leaves').delete().eq('id', id)
    if (!error) await refetch()
    return { error }
  }

  return { leaves, loading, isOnLeaveToday, addLeave, deleteLeave }
}
