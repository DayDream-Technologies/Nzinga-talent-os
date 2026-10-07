const API = 'https://dochub.com/api/v2'

export class DocHubError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type Json = Record<string, unknown>

async function dochub(apiKey: string, path: string, init: RequestInit = {}): Promise<Json> {
  const headers = new Headers(init.headers)
  headers.set('X-API-Token', apiKey)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const res = await fetch(`${API}${path}`, { ...init, headers })
  const text = await res.text()
  let json: Json = {}
  if (text) {
    try {
      json = JSON.parse(text) as Json
    } catch {
      json = { detail: text.slice(0, 300) }
    }
  }
  if (!res.ok) {
    throw new DocHubError(errorDetail(json, res.status), res.status)
  }
  return json
}

function errorDetail(json: Json, status: number): string {
  const errors = json.errors
  if (Array.isArray(errors) && errors[0] && typeof errors[0] === 'object') {
    const first = errors[0] as Json
    const detail = first.detail || first.title
    if (typeof detail === 'string' && detail.trim()) return detail
  }
  if (typeof json.detail === 'string' && json.detail.trim()) return json.detail
  if (typeof json.message === 'string' && json.message.trim()) return json.message
  return `DocHub returned ${status}`
}

function attr(json: Json): Json {
  const data = json.data
  if (data && typeof data === 'object') {
    const attributes = (data as Json).attributes
    if (attributes && typeof attributes === 'object') return attributes as Json
  }
  return json
}

function resourceId(json: Json): string {
  const data = json.data
  if (data && typeof data === 'object' && typeof (data as Json).id === 'string') return (data as Json).id as string
  return typeof json.id === 'string' ? json.id : ''
}

export async function importDocument(
  apiKey: string,
  file: { filename: string; contentType: string; bytes: Uint8Array },
  title: string,
): Promise<{ documentId: string; documentUrl: string }> {
  const presign = await dochub(apiKey, '/s3-direct', {
    method: 'POST',
    body: JSON.stringify({ filename: file.filename, contentType: file.contentType }),
  })
  const root = attr(presign)
  const uploadUrl = typeof root.url === 'string' ? root.url : ''
  const fields = root.fields && typeof root.fields === 'object' ? (root.fields as Record<string, unknown>) : null
  const key = (fields && typeof fields.key === 'string' ? fields.key : '') || resourceId(presign)
  if (!uploadUrl || !fields || !key) {
    throw new DocHubError('DocHub did not return an upload URL.', 502)
  }

  const form = new FormData()
  for (const [name, value] of Object.entries(fields)) {
    if (value != null) form.append(name, String(value))
  }
  if (!('Content-Type' in fields) && !('content-type' in fields)) form.append('Content-Type', file.contentType)
  form.append('file', new Blob([file.bytes], { type: file.contentType }), file.filename)
  const uploaded = await fetch(uploadUrl, { method: 'POST', body: form })
  if (!uploaded.ok) {
    throw new DocHubError(`DocHub file upload failed (${uploaded.status}).`, 502)
  }

  const started = await dochub(apiKey, '/documents/imports', {
    method: 'POST',
    body: JSON.stringify({ s3DirectKey: key, title }),
  })
  const importId = resourceId(started) || (typeof attr(started).id === 'string' ? String(attr(started).id) : '')
  if (!importId) throw new DocHubError('DocHub did not return an import id.', 502)

  let documentId = ''
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const polled = await dochub(apiKey, `/documents/imports/${encodeURIComponent(importId)}`)
    const state = attr(polled)
    const status = String(state.status || '')
    if (status === 'failed' || status === 'password_required') {
      const error = state.error && typeof state.error === 'object' ? (state.error as Json).code : status
      throw new DocHubError(`DocHub could not import the file (${String(error)}).`, 422)
    }
    documentId =
      (typeof state.documentId === 'string' ? state.documentId : '') ||
      resourceId((state.document as Json) || {}) ||
      ''
    const related = polled.data && typeof polled.data === 'object'
      ? (((polled.data as Json).relationships as Json | undefined)?.document as Json | undefined)
      : undefined
    const relatedId = related && typeof related.data === 'object' ? (related.data as Json).id : ''
    if (typeof relatedId === 'string' && relatedId) documentId = relatedId
    if (status === 'completed' && documentId) break
  }
  if (!documentId) throw new DocHubError('DocHub import did not finish in time.', 504)

  let documentUrl = `https://dochub.com/d/${documentId}`
  try {
    const doc = await dochub(apiKey, `/documents/${encodeURIComponent(documentId)}`)
    const fullUrl = attr(doc).fullUrl
    if (typeof fullUrl === 'string' && fullUrl) documentUrl = fullUrl
  } catch {
    /* the hashid URL is the documented fallback */
  }
  return { documentId, documentUrl }
}

export async function sendSignRequest(
  apiKey: string,
  input: { documentId: string; signerName: string; signerEmail: string; title: string },
): Promise<string> {
  const role = await dochub(apiKey, '/document-roles', {
    method: 'POST',
    body: JSON.stringify({
      documentId: input.documentId,
      name: 'Signer',
      email: input.signerEmail,
      canFreeEdit: true,
      receivesFinalCopy: true,
    }),
  })
  const roleId = resourceId(role)
  if (!roleId) throw new DocHubError('DocHub did not return a signer role.', 502)

  const sign = await dochub(apiKey, '/sign-requests', {
    method: 'POST',
    body: JSON.stringify({
      documentId: input.documentId,
      daysTillSignerExpiration: 3,
      remindersEnabled: true,
      documentRoles: [
        {
          id: roleId,
          email: input.signerEmail,
          signerName: input.signerName,
          canFreeEdit: true,
          receivesFinalCopy: true,
        },
      ],
      emailContent: {
        subject: `Please sign: ${input.title}`,
        body: `${input.signerName}, please review and sign ${input.title}. This request expires in 3 days.`,
      },
    }),
  })
  const signRequestId = resourceId(sign)
  if (!signRequestId) throw new DocHubError('DocHub did not return a sign request id.', 502)
  return signRequestId
}
