import { invokeEdgeFunction } from './edge-functions'
import { supabaseConfigured } from './supabase'
import type {
  RcConnectionStatus,
  RcAuthUrlResponse,
  MakeCallResponse,
  SendSmsResponse,
} from './ringcentral-types'

export function isRingCentralAvailable(): boolean {
  return supabaseConfigured
}

async function invokeRcOAuth<T>(action: string, body: Record<string, unknown> = {}): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  return invokeEdgeFunction<T>('ringcentral-oauth', { action, ...body })
}

export async function getRcConnectionStatus(): Promise<RcConnectionStatus> {
  if (!isRingCentralAvailable()) {
    return { connected: false }
  }

  const result = await invokeRcOAuth<RcConnectionStatus>('status')
  if (!result.ok) return { connected: false }
  return result.data
}

export async function getRcAuthUrl(): Promise<string | null> {
  const result = await invokeRcOAuth<RcAuthUrlResponse>('authorize')
  if (!result.ok) return null
  return result.data.auth_url
}

export async function disconnectRc(): Promise<boolean> {
  const result = await invokeRcOAuth('disconnect')
  return result.ok
}

export async function refreshRcToken(): Promise<boolean> {
  const result = await invokeRcOAuth('refresh')
  return result.ok
}

export async function makeCall(
  talentId: string,
  phoneNumber: string,
): Promise<MakeCallResponse> {
  const result = await invokeEdgeFunction<MakeCallResponse>('ringcentral-call', {
    talent_id: talentId,
    phone_number: phoneNumber,
  })

  if (!result.ok) {
    return { status: 'failed', message: result.error }
  }
  return result.data
}

export async function sendSms(
  talentId: string,
  phoneNumber: string,
  message: string,
): Promise<SendSmsResponse> {
  const result = await invokeEdgeFunction<SendSmsResponse>('ringcentral-sms', {
    talent_id: talentId,
    phone_number: phoneNumber,
    message,
  })

  if (!result.ok) {
    return { status: 'failed', error: result.error }
  }
  return result.data
}
