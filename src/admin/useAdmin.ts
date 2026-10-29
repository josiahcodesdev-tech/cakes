import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type AdminState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'not-admin'; email: string }
  | { status: 'recovering'; session: Session } // arrived from a "reset password" email
  | { status: 'admin'; session: Session }

/** Tracks the login and whether that email is on the admin list (the `admins` table). */
export function useAdmin(): AdminState {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [recovering, setRecovering] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'USER_UPDATED') setRecovering(false)
      setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const email = session?.user.email
  useEffect(() => {
    if (!supabase || !email) return
    let cancelled = false
    // Only admins may read the admin list, so getting our own row back proves we're on it.
    supabase.from('admins').select('email').limit(1).then(({ data, error }) => {
      if (!cancelled) setIsAdmin(!error && !!data?.length)
    })
    return () => { cancelled = true }
  }, [email])

  if (!supabase || session === null) return { status: 'signed-out' }
  if (session === undefined) return { status: 'loading' }
  if (recovering) return { status: 'recovering', session }
  if (isAdmin === undefined) return { status: 'loading' }
  return isAdmin ? { status: 'admin', session } : { status: 'not-admin', email: email ?? '' }
}
