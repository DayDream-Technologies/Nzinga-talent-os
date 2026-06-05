import { supabase } from './supabase'

export type EdgeFunctionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body: unknown,
): Promise<EdgeFunctionResult<T>> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured (demo mode)' }
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: body as Record<string, unknown>,
  })

  if (error) {
    return { ok: false, error: error.message || 'Edge function call failed' }
  }

  if (data?.error) {
    return { ok: false, error: data.error }
  }

  return { ok: true, data: data as T }
}
