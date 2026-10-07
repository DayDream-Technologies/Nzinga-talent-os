export type StoredDocHubStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'completed'
  | 'expired'
  | 'voided'
  | 'rejected'

const TERMINAL = new Set<StoredDocHubStatus>(['completed', 'expired', 'voided', 'rejected'])

/** DocHub signs `timestamp + "." + rawBody` and sends `dochub_v1=` plus lowercase hex. */
export async function verifyDocHubSignature(
  secret: string,
  timestamp: string,
  rawBody: string,
  signature: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  skewSeconds = 300,
): Promise<boolean> {
  if (!secret || !timestamp || !signature.startsWith('dochub_v1=')) return false
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > skewSeconds) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  )
  const digest = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
  const expected = `dochub_v1=${digest}`
  if (expected.length !== signature.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  return mismatch === 0
}

function readPath(value: unknown, path: string[]): unknown {
  let cur: unknown = value
  for (const key of path) {
    if (!cur || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[key]
  }
  return cur
}

function signRequestStatus(data: unknown): string {
  const direct = readPath(data, ['sign_request', 'status'])
  if (typeof direct === 'string') return direct
  const nested = readPath(data, ['sign_request', 'attributes', 'status'])
  return typeof nested === 'string' ? nested : ''
}

/** Map a verified DocHub webhook onto our envelope status. Null means ignore (ping or unknown). */
export function statusFromDocHubEvent(type: string, data: unknown): StoredDocHubStatus | null {
  if (type === 'webhook.ping' || type === 'document.shared') return null
  if (type === 'sign_request.created' || type === 'document.created') return 'sent'
  if (type === 'signer.finalized') return 'signed'
  if (type === 'signer.rejected') return 'rejected'
  if (type === 'sign_request.voided') return 'voided'
  if (type !== 'document.status_changed') return null

  const status = signRequestStatus(data).toUpperCase()
  if (status.includes('FINAL') || status === 'COMPLETED' || status === 'COMPLETE') return 'completed'
  if (status.includes('EXPIR')) return 'expired'
  if (status.includes('VOID') || status.includes('CANCEL')) return 'voided'
  if (status.includes('REJECT')) return 'rejected'
  if (status.includes('OPEN') || status.includes('VIEW')) return 'viewed'
  return null
}

export function shouldAdvanceStatus(current: string, next: StoredDocHubStatus): boolean {
  if (current === next) return false
  if (TERMINAL.has(current as StoredDocHubStatus) && current !== next) {
    return TERMINAL.has(next) && current !== 'completed'
  }
  if (current === 'completed') return false
  return true
}

export function envelopeIds(data: unknown): { documentId?: string; signRequestId?: string } {
  const documentId =
    readString(data, ['document', 'id']) ||
    readString(data, ['document', 'data', 'id']) ||
    readString(data, ['document_id'])
  const signRequestId =
    readString(data, ['sign_request', 'id']) ||
    readString(data, ['sign_request', 'data', 'id']) ||
    readString(data, ['sign_request_id'])
  return {
    documentId: documentId || undefined,
    signRequestId: signRequestId || undefined,
  }
}

function readString(value: unknown, path: string[]): string {
  const found = readPath(value, path)
  return typeof found === 'string' ? found : ''
}
