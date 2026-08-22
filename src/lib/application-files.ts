export const APPLICATION_FILE_PREFIX = 'storage:'

export function isEmbeddedDataUrl(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('data:') && value.includes(',')
}

export function isApplicationStorageRef(value: string): boolean {
  return (
    value.startsWith(APPLICATION_FILE_PREFIX) ||
    /\/storage\/v1\/object\/(?:public|sign)\/application-docs\//.test(value)
  )
}

/** Extract the object path inside the application-docs bucket. */
export function parseApplicationStoragePath(value: string): string | null {
  if (!value) return null
  if (value.startsWith(APPLICATION_FILE_PREFIX)) {
    const rest = value.slice(APPLICATION_FILE_PREFIX.length).replace(/^\/+/, '')
    return rest.replace(/^application-docs\//, '')
  }
  const match = value.match(/\/storage\/v1\/object\/(?:public|sign)\/application-docs\/([^?]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function toApplicationStorageRef(path: string): string {
  return `${APPLICATION_FILE_PREFIX}application-docs/${path}`
}

export function sanitizeStorageFileName(name: string): string {
  const trimmed = name.trim() || 'file'
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_')
  return safe.slice(0, 120)
}
