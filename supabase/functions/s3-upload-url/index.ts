import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.709.0'
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.709.0'
import { authenticateRequest, corsHeaders, errorResponse, jsonResponse } from '../shared/auth.ts'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'video/mp4',
  'video/quicktime',
  'video/webm',
])

const PATH_RULES: Array<{ pattern: RegExp; maxBytes: number }> = [
  { pattern: /^talents\/[A-Za-z0-9._-]+\/profile\//, maxBytes: 5 * 1024 * 1024 },
  { pattern: /^talents\/[A-Za-z0-9._-]+\/(documents|media|contracts)\//, maxBytes: 25 * 1024 * 1024 },
  { pattern: /^applications\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\//, maxBytes: 25 * 1024 * 1024 },
  { pattern: /^guardian\/[A-Za-z0-9._-]+\//, maxBytes: 25 * 1024 * 1024 },
  { pattern: /^agency\/[A-Za-z0-9._-]+\/(contracts|invoices)\//, maxBytes: 25 * 1024 * 1024 },
]

const DEFAULT_MAX_BYTES = 25 * 1024 * 1024

function sanitizeFileName(name: string): string {
  const trimmed = name.trim() || 'file'
  return trimmed.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_').slice(0, 120)
}

function normalizePath(raw: string): string {
  return raw.replace(/^\/+/, '').replace(/\.\./g, '').replace(/\/+/g, '/')
}

function matchRule(path: string) {
  return PATH_RULES.find((rule) => rule.pattern.test(path))
}

function stemKey(key: string): string {
  return key.replace(/\.[^.]+$/, '')
}

serve(async (req) => {
  const origin = req.headers.get('origin') ?? undefined

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, origin)
  }

  const user = await authenticateRequest(req)
  if (!user) {
    return errorResponse('Unauthorized', 401, origin)
  }

  const bucket = Deno.env.get('S3_BUCKET')
  const region = Deno.env.get('AWS_REGION') || 'us-east-1'
  const cdn = (Deno.env.get('CDN_URL') || '').replace(/\/$/, '')
  const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
  const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')

  if (!bucket || !accessKeyId || !secretAccessKey) {
    return errorResponse('S3 is not configured', 500, origin)
  }

  let body: { path?: string; contentType?: string; fileSize?: number }
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400, origin)
  }

  const contentType = String(body.contentType || '').toLowerCase()
  const fileSize = Number(body.fileSize || 0)
  const requested = normalizePath(String(body.path || ''))

  if (!requested) return errorResponse('path is required', 400, origin)
  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    return errorResponse('File type is not allowed', 400, origin)
  }

  const rule = matchRule(requested)
  if (!rule) return errorResponse('Invalid upload path', 400, origin)

  const maxBytes = rule.maxBytes || DEFAULT_MAX_BYTES
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return errorResponse('fileSize is required', 400, origin)
  }
  if (fileSize > maxBytes) {
    return errorResponse(`File is too large (max ${Math.round(maxBytes / (1024 * 1024))} MB)`, 400, origin)
  }

  const slash = requested.lastIndexOf('/')
  const dir = slash >= 0 ? requested.slice(0, slash) : 'uploads'
  const fileName = sanitizeFileName(slash >= 0 ? requested.slice(slash + 1) : requested)
  const key = `${dir}/${Date.now()}_${fileName}`

  const s3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  })

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    StorageClass: 'INTELLIGENT_TIERING',
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
  const cdnBase = cdn || `https://${bucket}.s3.${region}.amazonaws.com`
  const thumbnailUrl = `${cdnBase}/thumbnails/${stemKey(key)}.webp`

  return jsonResponse(
    {
      uploadUrl,
      key,
      cdnUrl: `${cdnBase}/${key}`,
      thumbnailUrl,
    },
    200,
    origin,
  )
})
