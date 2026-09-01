import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const s3 = new S3Client({})
const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

function extOf(key) {
  const base = key.split('/').pop() || ''
  const i = base.lastIndexOf('.')
  return i >= 0 ? base.slice(i + 1).toLowerCase() : ''
}

function stemKey(key) {
  return key.replace(/\.[^.]+$/, '')
}

async function bodyToBuffer(body) {
  if (!body) return Buffer.alloc(0)
  if (Buffer.isBuffer(body)) return body
  if (typeof body.transformToByteArray === 'function') {
    return Buffer.from(await body.transformToByteArray())
  }
  const chunks = []
  for await (const chunk of body) chunks.push(chunk)
  return Buffer.concat(chunks)
}

function contentTypeOf(record) {
  return String(record.contentType || record.content_type || '').toLowerCase()
}

export async function handler(event) {
  const records = event.Records || []
  for (const record of records) {
    const bucket = record.s3?.bucket?.name
    const key = decodeURIComponent(record.s3?.object?.key || '').replace(/\+/g, ' ')
    if (!bucket || !key) continue
    if (key.startsWith('thumbnails/')) continue

    const ext = extOf(key)
    if (['gif', 'svg', 'mp4', 'mov', 'webm', 'pdf', 'doc', 'docx', 'txt'].includes(ext)) continue

    const headType = contentTypeOf(record)
    if (headType && !IMAGE_TYPES.has(headType) && !headType.startsWith('image/')) continue

    try {
      const got = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      const mime = String(got.ContentType || headType || '').toLowerCase()
      if (mime && !IMAGE_TYPES.has(mime) && !mime.startsWith('image/')) continue

      const input = await bodyToBuffer(got.Body)
      const image = sharp(input, { failOn: 'none' }).rotate()

      const thumbKey = `thumbnails/${stemKey(key)}.webp`
      const largeKey = `thumbnails/${stemKey(key)}_lg.webp`

      const thumb = await image
        .clone()
        .resize(200, 200, { fit: 'cover', position: 'attention' })
        .webp({ quality: 80 })
        .toBuffer()

      const large = await image
        .clone()
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()

      await Promise.all([
        s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: thumbKey,
            Body: thumb,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000',
          }),
        ),
        s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: largeKey,
            Body: large,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000',
          }),
        ),
      ])
    } catch (err) {
      console.error('[process-image]', key, err)
      throw err
    }
  }
  return { ok: true, processed: records.length }
}
