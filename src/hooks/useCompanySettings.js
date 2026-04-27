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
      .then(({ data }) => { setSettings(data); setLoading(false) })
  }, [])

  async function saveSettings(lat, lng, radius, userId) {
    setSaving(true)
    const { error } = await supabase
      .from('company_settings')
      .upsert({
        id: 1,
        latitude: lat,
        longitude: lng,
        radius_meters: radius,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
    if (!error) setSettings({ id: 1, latitude: lat, longitude: lng, radius_meters: radius })
    setSaving(false)
    return { error }
  }

  return { settings, loading, saving, saveSettings }
}
