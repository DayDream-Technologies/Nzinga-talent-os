import { supabase, ensureSession } from './supabase'
import { FunctionsHttpError } from '@supabase/supabase-js'

export type EdgeFunctionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; sessionExpired?: boolean }

async function extractInvokeError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json()
      if (typeof payload?.error === 'string') return payload.error
      if (typeof payload?.message === 'string') return payload.message
    } catch {
      /* response body not JSON */
    }
    return error.message || 'Edge function returned an error'
  }

  if (error instanceof Error) return error.message
  return 'Edge function call failed'
}

/**
 * Invoke a Supabase Edge Function by name only (no query string in name).
 * Body must be a JSON object — use { action: 'status' } for ringcentral-oauth routing.
 *
 * Validates the auth session before calling. If the session is expired,
 * attempts a refresh. Returns `sessionExpired: true` when re-authentication
 * is required so the UI can show a re-login prompt.
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown> = {},
): Promise<EdgeFunctionResult<T>> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured (demo mode)' }
  }

  const cleanName = functionName.split('?')[0].trim()
  if (!cleanName) {
    return { ok: false, error: 'Invalid function name' }
  }

  // Ensure a valid auth session exists before calling the edge function.
  // Without this, the Supabase client silently falls back to the anon key
  // which the edge function rejects as unauthorized.
  // A missing session is not an expired one: a new applicant has no session
  // until they confirm their email and sign in. No request is sent in that case.
  const hasSession = await ensureSession()
  if (!hasSession) {
    return {
      ok: false,
      error: 'Sign in to continue. If you just created an account, confirm the email we sent, then log in.',
    }
  }

  const { data, error } = await supabase.functions.invoke(cleanName, {
    body,
  })

  if (error) {
    const message = await extractInvokeError(error)
    // Detect 401 from the edge function even if the session check passed
    // (race condition: token expired between check and call)
    if (error instanceof FunctionsHttpError && error.context?.status === 401) {
      return { ok: false, error: 'Your session has expired. Please log in again.', sessionExpired: true }
    }
    return { ok: false, error: message }
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { ok: false, error: String(data.error) }
  }

  return { ok: true, data: data as T }
}
