import { invokeEdgeFunction } from './edge-functions'
import { supabaseConfigured } from './supabase'
import { isTwilioConnected } from './integrations'

export type TwilioConnectionStatus = { connected: boolean; fromNumber?: string; expired?: boolean }

export function isVoiceSmsAvailable(): boolean {
  return isTwilioConnected()
}

export async function getTwilioStatus(): Promise<TwilioConnectionStatus> {
  if (!isTwilioConnected() || !supabaseConfigured) return { connected: false }
  const result = await invokeEdgeFunction<TwilioConnectionStatus>('twilio-sms', { action: 'status' })
  if (!result.ok) return { connected: false }
  return result.data
}

export async function makeCall(to: string): Promise<{ ok: boolean; error?: string }> {
  if (!isTwilioConnected()) return { ok: false, error: 'Voice calls are coming soon.' }
  const result = await invokeEdgeFunction<{ sid?: string }>('twilio-voice', { to })
  return result.ok ? { ok: true } : { ok: false, error: result.error }
}

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  if (!isTwilioConnected()) return { ok: false, error: 'Text messaging is coming soon.' }
  const result = await invokeEdgeFunction<{ sid?: string }>('twilio-sms', { to, body })
  return result.ok ? { ok: true } : { ok: false, error: result.error }
}

/** @deprecated RingCentral removed — use isVoiceSmsAvailable */
export function isRingCentralAvailable(): boolean {
  return isVoiceSmsAvailable()
}

export async function getRcConnectionStatus(): Promise<TwilioConnectionStatus> {
  return getTwilioStatus()
}

export async function getRcAuthUrl(): Promise<string | null> {
  return null
}

export async function disconnectRc(): Promise<boolean> {
  return true
}

export async function refreshRcToken(): Promise<boolean> {
  return isTwilioConnected()
}

export async function makeRcCall(to: string): Promise<{ ok: boolean; error?: string }> {
  return makeCall(to)
}

export async function sendRcSms(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  return sendSms(to, body)
}
