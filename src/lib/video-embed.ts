export type VideoEmbedKind = 'youtube' | 'vimeo' | 'loom' | 'direct' | 'unknown'

export interface VideoEmbed {
  kind: VideoEmbedKind
  src: string
  providerId?: string
}

const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/

function hostname(url: URL): string {
  return url.hostname.replace(/^www\./, '').toLowerCase()
}

export function parseVideoUrl(raw: string): VideoEmbed | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const host = hostname(url)

  if (
    host === 'youtu.be' ||
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'youtube-nocookie.com'
  ) {
    let id = ''
    if (host === 'youtu.be') {
      id = url.pathname.replace(/^\/+/, '').split('/')[0] || ''
    } else if (url.pathname.startsWith('/embed/')) {
      id = url.pathname.split('/')[2] || ''
    } else if (url.pathname.startsWith('/shorts/')) {
      id = url.pathname.split('/')[2] || ''
    } else if (url.pathname.startsWith('/live/')) {
      id = url.pathname.split('/')[2] || ''
    } else {
      id = url.searchParams.get('v') || ''
    }
    id = id.replace(/[^a-zA-Z0-9_-]/g, '')
    if (YOUTUBE_ID.test(id)) {
      return {
        kind: 'youtube',
        src: `https://www.youtube-nocookie.com/embed/${id}`,
        providerId: id,
      }
    }
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const match = url.pathname.match(/\/(\d+)/)
    if (match) {
      return {
        kind: 'vimeo',
        src: `https://player.vimeo.com/video/${match[1]}`,
        providerId: match[1],
      }
    }
  }

  if (host === 'loom.com') {
    const match = url.pathname.match(/\/(?:share|embed)\/([a-zA-Z0-9]+)/)
    if (match) {
      return {
        kind: 'loom',
        src: `https://www.loom.com/embed/${match[1]}`,
        providerId: match[1],
      }
    }
  }

  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url.pathname)) {
    return { kind: 'direct', src: trimmed }
  }

  return { kind: 'unknown', src: trimmed }
}

export function isHttpVideoUrl(raw: string): boolean {
  return parseVideoUrl(raw) !== null
}

export function youtubeThumbnail(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}
