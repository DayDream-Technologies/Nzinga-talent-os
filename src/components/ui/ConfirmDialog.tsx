import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { useBlocker, type BlockerFunction } from 'react-router-dom'
import { T } from '@/lib/tokens'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Shared leave / delete confirmation dialog. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: T.elevatedBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: 12,
          padding: '22px 20px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: T.t1, fontFamily: "'Syne', sans-serif" }}>
          {title}
        </h2>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: T.t3, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 14px',
              borderRadius: 7,
              border: `1px solid ${T.cardBorder}`,
              background: T.cardBg,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: T.t2,
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '8px 14px',
              borderRadius: 7,
              border: 'none',
              background: danger ? T.red : T.blue,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Hook helper: request close; if dirty, show confirm first. */
export function useUnsavedClose(dirty: boolean, onClose: () => void) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  function requestClose() {
    if (dirty) setConfirmOpen(true)
    else onClose()
  }
  const dialog: ReactNode = (
    <ConfirmDialog
      open={confirmOpen}
      title="Leave without saving?"
      message="Continue? Unsaved changes will be lost."
      confirmLabel="Leave"
      danger
      onCancel={() => setConfirmOpen(false)}
      onConfirm={() => {
        setConfirmOpen(false)
        onClose()
      }}
    />
  )
  return { requestClose, dialog }
}

/**
 * Blocks in-app navigation and tab close when `dirty` is true.
 * Search-param-only updates on the same path are allowed (e.g. OAuth return).
 */
export function useUnsavedNavigation(dirty: boolean) {
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
    [dirty],
  )
  const blocker = useBlocker(shouldBlock)

  useEffect(() => {
    if (blocker.state === 'blocked' && !dirty) {
      blocker.reset()
    }
  }, [blocker, dirty])

  useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const onCancel = useCallback(() => {
    if (blocker.state === 'blocked') blocker.reset()
  }, [blocker])

  const onConfirm = useCallback(() => {
    if (blocker.state === 'blocked') blocker.proceed()
  }, [blocker])

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title="Leave without saving?"
      message="You have unsaved changes. If you leave now, they will be lost."
      confirmLabel="Leave"
      cancelLabel="Stay on page"
      danger
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
