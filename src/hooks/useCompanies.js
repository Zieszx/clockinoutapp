import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCompanies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('companies').select('*').order('name')
    setCompanies(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  async function saveCompany(payload) {
    const { id, ...rest } = payload
    const { data, error } = id
      ? await supabase.from('companies').update(rest).eq('id', id).select().single()
      : await supabase.from('companies').insert(rest).select().single()
    if (!error) await refetch()
    return { data, error }
  }

  async function deleteCompany(id) {
    const { error } = await supabase.from('companies').delete().eq('id', id)
    if (!error) await refetch()
    return { error }
  }

  return { companies, loading, saveCompany, deleteCompany, refetch }
}
