export interface RcConnectionStatus {
  connected: boolean
  expired?: boolean
  phone_number?: string
  extension_id?: string
}

export interface RcAuthUrlResponse {
  auth_url: string
}

export interface MakeCallRequest {
  talent_id: string
  phone_number: string
}

export interface MakeCallResponse {
  status: 'initiated' | 'failed'
  session_id?: string
  message?: string
}

export interface SendSmsRequest {
  talent_id: string
  phone_number: string
  message: string
}

export interface SendSmsResponse {
  status: 'sent' | 'failed'
  message_id?: string
  error?: string
}

export interface CallEventPayload {
  session_id: string
  direction: 'inbound' | 'outbound'
  from: string
  to: string
  duration_seconds?: number
  recording_url?: string
  result: 'answered' | 'missed' | 'voicemail' | 'rejected'
}
