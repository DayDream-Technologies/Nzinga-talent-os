import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { T } from '@/lib/tokens'

export type ToastKind = 'success' | 'error'

export interface ToastMessage {
  id: number
  text: string
  kind: ToastKind
}

interface ToastContextValue {
  showToast: (text: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/** No-op when a provider is missing (tests, isolated trees). */
export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? { showToast: () => {} }
}

function ToastItem({ toast, onDone }: { toast: ToastMessage; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 4200)
    return () => window.clearTimeout(t)
  }, [onDone])

  const error = toast.kind === 'error'
  return (
    <div
      role="status"
      style={{
        background: error ? T.red : T.navBg,
        color: '#fff',
        padding: '10px 14px',
        borderRadius: 8,
        fontSize: 13,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        fontFamily: "'Outfit', sans-serif",
        maxWidth: 360,
        lineHeight: 1.4,
      }}
    >
      {toast.text}
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((text: string, kind: ToastKind = 'error') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev.slice(-2), { id, text, kind }])
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 11000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDone={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
