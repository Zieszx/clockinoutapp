import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*, company:companies(id, name)')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (!error && data?.user) {
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id)
    }

    return { error }
  }

  async function logout() {
    try { await supabase.auth.signOut() }
    finally { setSession(null); setProfile(null) }
  }

  async function changePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (!error && profile) {
      await supabase.from('profiles').update({ must_change_password: false }).eq('id', profile.id)
      setProfile(p => ({ ...p, must_change_password: false }))
    }
    return { error }
  }

  return { session, profile, loading, login, logout, changePassword }
}
