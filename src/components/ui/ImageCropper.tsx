import { useCallback, useRef, useState, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type Crop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/Button'
import {
  cropImageToBlob,
  outputExtension,
  preferredOutputType,
  replaceExtension,
} from '@/lib/crop-image'
import { T } from '@/lib/tokens'

interface ImageCropperProps {
  file: File
  aspect?: number
  maxWidth?: number
  title?: string
  onCancel: () => void
  onComplete: (blob: Blob, fileName: string) => void
}

export function ImageCropper({
  file,
  aspect = 1,
  maxWidth = 1200,
  title = 'Crop photo',
  onCancel,
  onComplete,
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [src] = useState(() => URL.createObjectURL(file))
  const [crop, setCrop] = useState<Crop>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(
      centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height),
    )
  }

  async function confirm() {
    const image = imgRef.current
    if (!image || !crop) return
    setBusy(true)
    setError('')
    try {
      const pixel = convertToPixelCrop(crop, image.width, image.height)
      const mimeType = preferredOutputType()
      const blob = await cropImageToBlob(image, pixel, { maxWidth, mimeType })
      const name = replaceExtension(file.name, outputExtension(mimeType))
      URL.revokeObjectURL(src)
      onComplete(blob, name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not crop this image.')
      setBusy(false)
    }
  }

  function cancel() {
    URL.revokeObjectURL(src)
    onCancel()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={cancel}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-lg bg-elevated-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ border: `1px solid ${T.cardBorder}` }}
      >
        <div className="flex items-center justify-between border-b border-card-border px-4 py-2.5">
          <span className="text-sm font-bold text-t1">{title}</span>
          <button type="button" onClick={cancel} className="cursor-pointer border-none bg-transparent text-base text-t3" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-black p-3">
          <ReactCrop crop={crop} onChange={(_, percent) => setCrop(percent)} aspect={aspect} keepSelection>
            <img ref={imgRef} src={src} alt="Crop preview" onLoad={onImageLoad} style={{ maxHeight: '60vh' }} />
          </ReactCrop>
        </div>
        {error && <div className="px-4 pt-2 text-xs font-semibold text-brand-red">{error}</div>}
        <div className="flex justify-end gap-2 px-4 py-3">
          <Button type="button" onClick={cancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" variant="purple" onClick={() => void confirm()} disabled={busy || !crop}>
            {busy ? 'Saving…' : 'Use photo'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function useImageCropper() {
  const [pending, setPending] = useState<{
    file: File
    aspect: number
    maxWidth: number
    title?: string
    resolve: (file: File | null) => void
  } | null>(null)

  const cropImage = useCallback((file: File, opts?: { aspect?: number; maxWidth?: number; title?: string }) => {
    const aspect = opts?.aspect
    if (!file.type.startsWith('image/') || aspect == null) return Promise.resolve(file)
    return new Promise<File | null>((resolve) => {
      setPending({
        file,
        aspect,
        maxWidth: opts?.maxWidth ?? 1200,
        title: opts?.title,
        resolve,
      })
    })
  }, [])

  const cropper = pending ? (
    <ImageCropper
      file={pending.file}
      aspect={pending.aspect}
      maxWidth={pending.maxWidth}
      title={pending.title}
      onCancel={() => {
        pending.resolve(null)
        setPending(null)
      }}
      onComplete={(blob, name) => {
        pending.resolve(new File([blob], name, { type: blob.type || 'image/jpeg' }))
        setPending(null)
      }}
    />
  ) : null

  return { cropImage, cropper }
}
