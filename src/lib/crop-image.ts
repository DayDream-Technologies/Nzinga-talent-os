import type { PixelCrop } from 'react-image-crop'

export function preferredOutputType(): 'image/webp' | 'image/jpeg' {
  if (typeof document === 'undefined') return 'image/jpeg'
  const canvas = document.createElement('canvas')
  return canvas.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg'
}

export function outputExtension(type: string): string {
  if (type.includes('webp')) return 'webp'
  if (type.includes('png')) return 'png'
  return 'jpg'
}

export function replaceExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'image'
  return `${base}.${ext}`
}

/** Profile photos are square; headshots are 3:4. Other fields are not cropped. */
export function cropAspectForField(fieldId: string): number | undefined {
  const id = fieldId.toLowerCase()
  if (id.includes('profile_photo') || id === 'profile') return 1
  if (id.includes('headshot')) return 3 / 4
  return undefined
}

export async function cropImageToBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  opts?: { maxWidth?: number; mimeType?: string; quality?: number },
): Promise<Blob> {
  const mimeType = opts?.mimeType || preferredOutputType()
  const quality = opts?.quality ?? 0.9
  const maxWidth = opts?.maxWidth ?? 1200

  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const sx = crop.x * scaleX
  const sy = crop.y * scaleY
  const sw = Math.max(1, crop.width * scaleX)
  const sh = Math.max(1, crop.height * scaleY)

  let dw = sw
  let dh = sh
  if (dw > maxWidth) {
    const ratio = maxWidth / dw
    dw = maxWidth
    dh = sh * ratio
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(dw))
  canvas.height = Math.max(1, Math.round(dh))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not crop image')
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))),
      mimeType,
      quality,
    )
  })
}
