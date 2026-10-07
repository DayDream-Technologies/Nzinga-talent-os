import { invokeEdgeFunction } from '@/lib/edge-functions'
import type { DocHubStatus, ProspectContract } from '@/types/agency'

export type DocHubKind = 'representation' | 'renewal' | 'usage'

export interface DocHubEnvelopeRow {
  contract_id: string
  kind: DocHubKind
  title: string
  status: DocHubStatus
  document_id: string | null
  document_url: string | null
  expires_at: string | null
  signer_name: string | null
  signer_email: string
}

export interface DocHubSendResult {
  contractId: string
  documentId: string | null
  signRequestId: string | null
  documentUrl: string | null
  status: DocHubStatus
  expiresAt: string | null
  alreadySent?: boolean
}

export async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function mergeDocHubEnvelope(
  contracts: ProspectContract[],
  row: Pick<DocHubEnvelopeRow, 'contract_id' | 'status' | 'document_id' | 'document_url' | 'expires_at' | 'signer_name'>,
  options: { promoteToCurrent?: boolean } = {},
): ProspectContract[] {
  const promote = options.promoteToCurrent !== false
  const match = contracts.find((c) => c.id === row.contract_id)
  if (!match) return contracts
  const same =
    match.dochubStatus === row.status &&
    (match.dochubDocumentId || null) === (row.document_id || null) &&
    (match.dochubUrl || null) === (row.document_url || null)
  if (same) return contracts

  const completePending = promote && row.status === 'completed' && match.status === 'pending_signature'
  return contracts.map((c) => {
    if (c.id === row.contract_id) {
      return {
        ...c,
        dochubStatus: row.status,
        dochubDocumentId: row.document_id,
        dochubUrl: row.document_url,
        expiresAt: row.expires_at,
        ...(completePending
          ? {
              status: 'current' as const,
              signedAt: new Date().toISOString(),
              signedName: row.signer_name || 'Signed in DocHub',
            }
          : {}),
      }
    }
    if (completePending && c.status === 'current') return { ...c, status: 'past' as const }
    return c
  })
}

export function sendDocHubContract(input: {
  contractId: string
  kind: DocHubKind
  title: string
  signerName: string
  signerEmail: string
  talentAccount?: string
  html?: string
  filename?: string
  contentType?: string
  fileBase64?: string
}) {
  return invokeEdgeFunction<DocHubSendResult>('dochub-send', { ...input })
}
