import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js'
import { isDemoMode } from './utils'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey && !isDemoMode())

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const TRAINING_VIDEOS_BUCKET = 'training-videos'

/** Clear persisted auth when refresh tokens are invalid / network+CORS fails. */
export async function clearLocalAuthSession(): Promise<void> {
  if (!supabase) return
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // signOut can throw on network failure before clearing storage — force-remove keys
  }
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('sb-') || key.includes('auth-token'))) {
        keys.push(key)
      }
    }
    for (const key of keys) localStorage.removeItem(key)
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      await clearLocalAuthSession()
      return null
    }
    return data.session
  } catch {
    await clearLocalAuthSession()
    return null
  }
}

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void,
) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange(callback)
}
