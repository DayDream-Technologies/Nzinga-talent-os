import { useEffect, useState } from 'react'
import { viewportBand, type ViewportBand } from '@/lib/viewport'

export function useViewport(): ViewportBand {
  const [band, setBand] = useState<ViewportBand>(() =>
    typeof window === 'undefined' ? 'desktop' : viewportBand(window.innerWidth),
  )

  useEffect(() => {
    function onResize() {
      setBand(viewportBand(window.innerWidth))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return band
}
