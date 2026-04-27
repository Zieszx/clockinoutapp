import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCompanySettings(companyId) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    if (!companyId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase.from('companies').select('*').eq('id', companyId).single()
    setSettings(data)
    setLoading(false)
  }, [companyId])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  async function saveSettings(payload) {
    if (!companyId) return { error: { message: 'No company assigned.' } }
    setSaving(true)
    const { error } = await supabase
      .from('companies')
      .update({
        name: payload.company_name || payload.name,
        address: payload.company_address || payload.address || null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        radius_meters: payload.radius_meters ?? 100,
        working_days: payload.working_days ?? null,
        shift_start: payload.shift_start ?? null,
        shift_end: payload.shift_end ?? null,
      })
      .eq('id', companyId)
    if (!error) await fetchSettings()
    setSaving(false)
    return { error }
  }

  return { settings, loading, saving, saveSettings }
}
