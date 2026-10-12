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

export function requireSupabase(): SupabaseClient {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Database is not configured.')
  }
  return supabase
}

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

/**
 * Validate the current session is alive and has a non-expired access token.
 * If the access token is expired, attempts a refresh.
 * Returns `true` when a valid session exists afterward.
 */
export async function ensureSession(): Promise<boolean> {
  if (!supabase) return false
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false

    // Check if the access token is expired or about to expire (30s buffer)
    const jwt = parseJwtExp(session.access_token)
    if (jwt !== null && jwt * 1000 < Date.now() + 30_000) {
      const { data, error } = await supabase.auth.refreshSession()
      return !error && !!data.session
    }
    return true
  } catch {
    return false
  }
}

/** Extract `exp` from a JWT payload without verifying. Returns epoch seconds or null. */
function parseJwtExp(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload))
    return typeof decoded.exp === 'number' ? decoded.exp : null
  } catch {
    return null
  }
}

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void,
) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange(callback)
}
