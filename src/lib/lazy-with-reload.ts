import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

const CHUNK_RELOAD_KEY = 'nto_chunk_reload'

/** After a deploy, open tabs may request stale hashed chunks (404). Reload once. */
export function reloadForStaleChunk() {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY)
      return
    }
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  } catch {
    /* private mode */
  }
  window.location.reload()
}

export function installChunkLoadRecovery() {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    reloadForStaleChunk()
  })
}

const CHUNK_ERR =
  /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i

export function lazyWithReload<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      if (CHUNK_ERR.test(msg)) {
        reloadForStaleChunk()
        return new Promise(() => {}) as Promise<{ default: T }>
      }
      throw err
    }),
  )
}
