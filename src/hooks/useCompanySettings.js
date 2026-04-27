import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCompanySettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('company_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        setSettings(data)
        setLoading(false)
      })
  }, [])

  async function saveSettings(payload, userId) {
    setSaving(true)
    const nextPayload = {
      id: 1,
      company_name: payload.company_name || null,
      company_address: payload.company_address || null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      radius_meters: payload.radius_meters ?? 100,
      updated_at: new Date().toISOString(),
      updated_by: userId
    }

    const { error } = await supabase
      .from('company_settings')
      .upsert(nextPayload)

    if (!error) setSettings(nextPayload)
    setSaving(false)
    return { error }
  }

  return { settings, loading, saving, saveSettings }
}
