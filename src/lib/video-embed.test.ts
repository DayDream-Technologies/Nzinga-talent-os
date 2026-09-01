import { describe, expect, it } from 'vitest'
import { isHttpVideoUrl, parseVideoUrl, youtubeThumbnail } from './video-embed'

describe('parseVideoUrl', () => {
  it('parses YouTube watch, short, and share URLs', () => {
    expect(parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      kind: 'youtube',
      src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      providerId: 'dQw4w9WgXcQ',
    })
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ?si=abc')).toMatchObject({
      kind: 'youtube',
      providerId: 'dQw4w9WgXcQ',
    })
    expect(parseVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toMatchObject({
      kind: 'youtube',
      providerId: 'dQw4w9WgXcQ',
    })
  })

  it('parses Vimeo and Loom URLs', () => {
    expect(parseVideoUrl('https://vimeo.com/123456789')).toEqual({
      kind: 'vimeo',
      src: 'https://player.vimeo.com/video/123456789',
      providerId: '123456789',
    })
    expect(parseVideoUrl('https://www.loom.com/share/abcdef123')).toEqual({
      kind: 'loom',
      src: 'https://www.loom.com/embed/abcdef123',
      providerId: 'abcdef123',
    })
  })

  it('treats direct video files as playable', () => {
    expect(parseVideoUrl('https://cdn.example.com/lesson.mp4')).toEqual({
      kind: 'direct',
      src: 'https://cdn.example.com/lesson.mp4',
    })
  })

  it('rejects non-http values and accepts other https links as unknown', () => {
    expect(parseVideoUrl('')).toBeNull()
    expect(parseVideoUrl('not a url')).toBeNull()
    expect(parseVideoUrl('javascript:alert(1)')).toBeNull()
    expect(parseVideoUrl('https://drive.google.com/file/d/abc/view')).toEqual({
      kind: 'unknown',
      src: 'https://drive.google.com/file/d/abc/view',
    })
  })
})

describe('isHttpVideoUrl', () => {
  it('accepts http(s) URLs only', () => {
    expect(isHttpVideoUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
    expect(isHttpVideoUrl('ftp://example.com/a.mp4')).toBe(false)
  })
})

describe('youtubeThumbnail', () => {
  it('builds the hqdefault thumbnail URL', () => {
    expect(youtubeThumbnail('dQw4w9WgXcQ')).toBe(
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    )
  })
})
