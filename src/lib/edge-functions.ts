import { supabase } from './supabase'
import { FunctionsHttpError } from '@supabase/supabase-js'

export type EdgeFunctionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

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

  const { data, error } = await supabase.functions.invoke(cleanName, {
    body,
  })

  if (error) {
    return { ok: false, error: await extractInvokeError(error) }
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { ok: false, error: String(data.error) }
  }

  return { ok: true, data: data as T }
}
