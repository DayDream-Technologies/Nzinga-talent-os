import { beforeEach, describe, expect, it } from 'vitest'
import {
  IDLE_MS,
  STORAGE_LAST_ACTIVITY,
  clearFreshLoginMark,
  clearIdleTimer,
  isIdleExpired,
  markFreshLogin,
  shouldRequireIdleReauthOnRestore,
} from '@/lib/session-storage'

describe('idle timeout vs first login', () => {
  beforeEach(() => {
    clearIdleTimer()
    clearFreshLoginMark()
  })

  it('treats a missing timestamp as not expired', () => {
    expect(isIdleExpired()).toBe(false)
  })

  it('detects a stale last-activity timestamp', () => {
    localStorage.setItem(STORAGE_LAST_ACTIVITY, String(Date.now() - IDLE_MS - 1000))
    expect(isIdleExpired()).toBe(true)
  })

  it('does not lock a first login on public auth screens', () => {
    localStorage.setItem(STORAGE_LAST_ACTIVITY, String(Date.now() - IDLE_MS - 1000))
    expect(shouldRequireIdleReauthOnRestore('/login')).toBe(false)
    expect(shouldRequireIdleReauthOnRestore('/tmx')).toBe(false)
  })

  it('still locks an idle restore on a protected page', () => {
    localStorage.setItem(STORAGE_LAST_ACTIVITY, String(Date.now() - IDLE_MS - 1000))
    expect(shouldRequireIdleReauthOnRestore('/workspace')).toBe(true)
  })

  it('resets the timer so a password login is never immediately expired', () => {
    localStorage.setItem(STORAGE_LAST_ACTIVITY, String(Date.now() - IDLE_MS - 1000))
    markFreshLogin()
    expect(isIdleExpired()).toBe(false)
    expect(shouldRequireIdleReauthOnRestore('/workspace')).toBe(false)
  })
})
