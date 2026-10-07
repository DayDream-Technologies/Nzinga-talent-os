import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { authenticateRequest, corsHeaders, errorResponse, getSupabaseAdmin, jsonResponse } from '../shared/auth.ts'
import { DocHubError, importDocument, sendSignRequest } from '../shared/dochub-api.ts'

interface SendBody {
  contractId?: string
  kind?: 'representation' | 'renewal' | 'usage'
  title?: string
  signerName?: string
  signerEmail?: string
  talentAccount?: string
  html?: string
  filename?: string
  contentType?: string
  fileBase64?: string
}

const KINDS = new Set(['representation', 'renewal', 'usage'])

serve(async (req) => {
  const origin = req.headers.get('origin') ?? undefined
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405, origin)

  const user = await authenticateRequest(req)
  if (!user) return errorResponse('Unauthorized', 401, origin)

  const admin = getSupabaseAdmin()
  const { data: staffUser } = await admin
    .from('users')
    .select('id, role')
    .eq('auth_uid', user.id)
    .maybeSingle()
  if (!staffUser) return errorResponse('Only staff can send contracts for signature.', 403, origin)

  const apiKey = Deno.env.get('DOCHUB_API_KEY')
  if (!apiKey) return errorResponse('DocHub is not configured. Set DOCHUB_API_KEY in Supabase secrets.', 503, origin)

  let body: SendBody
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400, origin)
  }

  const contractId = (body.contractId || '').trim()
  const signerEmail = (body.signerEmail || '').trim().toLowerCase()
  const signerName = (body.signerName || '').trim()
  const title = (body.title || 'Contract').trim()
  const kind = body.kind
  if (!contractId || !signerEmail || !signerEmail.includes('@') || !signerName || !kind || !KINDS.has(kind)) {
    return errorResponse('contractId, kind, signerName, and signerEmail are required.', 400, origin)
  }

  const { data: existing } = await admin
    .from('dochub_envelopes')
    .select('sign_request_id, document_id, document_url, status, expires_at')
    .eq('contract_id', contractId)
    .maybeSingle()
  if (existing?.sign_request_id) {
    return jsonResponse({
      contractId,
      documentId: existing.document_id,
      signRequestId: existing.sign_request_id,
      documentUrl: existing.document_url,
      status: existing.status,
      expiresAt: existing.expires_at,
      alreadySent: true,
    }, 200, origin)
  }

  let filename = (body.filename || '').trim()
  let contentType = (body.contentType || '').trim()
  let bytes: Uint8Array
  if (body.html && body.html.trim()) {
    filename = filename || 'contract.html'
    contentType = contentType || 'text/html'
    bytes = new TextEncoder().encode(body.html)
  } else if (body.fileBase64) {
    if (body.fileBase64.length > 8_000_000) {
      return errorResponse('That file is too large to send. Keep contracts under about 6 MB.', 413, origin)
    }
    try {
      const binary = atob(body.fileBase64)
      bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    } catch {
      return errorResponse('fileBase64 is not valid base64.', 400, origin)
    }
    filename = filename || 'contract.pdf'
    contentType = contentType || 'application/pdf'
  } else {
    return errorResponse('html or fileBase64 is required.', 400, origin)
  }
  if (!filename.includes('.')) filename = `${filename}.pdf`

  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  const { error: draftError } = await admin.from('dochub_envelopes').upsert({
    contract_id: contractId,
    kind,
    title,
    signer_email: signerEmail,
    signer_name: signerName,
    talent_account: body.talentAccount || null,
    status: 'draft',
    expires_at: expiresAt,
    created_by: user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'contract_id' })
  if (draftError) return errorResponse(draftError.message, 500, origin)

  try {
    const imported = await importDocument(apiKey, { filename, contentType, bytes }, title)
    const signRequestId = await sendSignRequest(apiKey, {
      documentId: imported.documentId,
      signerName,
      signerEmail,
      title,
    })
    const { error: updateError } = await admin
      .from('dochub_envelopes')
      .update({
        document_id: imported.documentId,
        sign_request_id: signRequestId,
        document_url: imported.documentUrl,
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('contract_id', contractId)
    if (updateError) return errorResponse(updateError.message, 500, origin)

    return jsonResponse({
      contractId,
      documentId: imported.documentId,
      signRequestId,
      documentUrl: imported.documentUrl,
      status: 'sent',
      expiresAt,
    }, 200, origin)
  } catch (error) {
    const message = error instanceof DocHubError ? error.message : 'DocHub send failed.'
    const status = error instanceof DocHubError ? (error.status >= 400 && error.status < 600 ? error.status : 502) : 502
    await admin.from('dochub_envelopes').update({
      status: 'draft',
      updated_at: new Date().toISOString(),
    }).eq('contract_id', contractId)
    return errorResponse(message, status === 401 || status === 403 ? status : status >= 500 ? 502 : status, origin)
  }
})
