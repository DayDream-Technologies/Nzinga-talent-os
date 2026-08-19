import { useEffect, useState } from 'react'
import {
  readSidebarVisible,
  writeSidebarVisible,
  UI_PREFS_EVENT,
} from '@/lib/session-storage'

/** Sidebar nav preference — default visible; persists in localStorage. */
export function useSidebarPreference() {
  const [sidebarVisible, setSidebarVisibleState] = useState(readSidebarVisible)

  useEffect(() => {
    function sync() {
      setSidebarVisibleState(readSidebarVisible())
    }
    window.addEventListener(UI_PREFS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(UI_PREFS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  function setSidebarVisible(visible: boolean) {
    writeSidebarVisible(visible)
    setSidebarVisibleState(visible)
  }

  return { sidebarVisible, setSidebarVisible }
}
