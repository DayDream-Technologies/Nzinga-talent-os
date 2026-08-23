import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { T } from '@/lib/tokens'

/** Floats above tables, sticky headers, and scroll wrappers. */
export const MENU_OVERLAY_Z = 5000

const GAP = 4
const VIEWPORT_PAD = 8

const dotStyle = {
  display: 'block',
  width: 4,
  height: 4,
  borderRadius: 999,
  background: 'currentColor',
  flexShrink: 0,
} as const

const overlayPanelStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
}

export type ActionItem = {
  id: string
  label: string
  onClick?: () => void
  /** When true, shows Coming soon toast instead of onClick */
  stub?: boolean
  danger?: boolean
  disabled?: boolean
}

function ComingSoonToast({ label, onDone }: { label: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 2200)
    return () => window.clearTimeout(t)
  }, [onDone])
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 11000,
        background: T.navBg,
        color: '#fff',
        padding: '10px 14px',
        borderRadius: 8,
        fontSize: 13,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <strong>{label}</strong> — Coming soon
    </div>
  )
}

function placeOverlay(
  anchor: HTMLElement,
  menu: HTMLElement,
  align: 'left' | 'right',
  minWidth: number,
): CSSProperties {
  const r = anchor.getBoundingClientRect()
  const menuH = menu.offsetHeight
  const menuW = Math.max(minWidth, menu.offsetWidth, r.width)
  const spaceBelow = window.innerHeight - r.bottom - GAP - VIEWPORT_PAD
  const openUp = menuH > 0 && spaceBelow < menuH && r.top > spaceBelow
  const top = openUp
    ? Math.max(VIEWPORT_PAD, r.top - GAP - menuH)
    : Math.min(r.bottom + GAP, window.innerHeight - VIEWPORT_PAD - menuH)
  let left = align === 'right' ? r.right - menuW : r.left
  left = Math.min(Math.max(VIEWPORT_PAD, left), window.innerWidth - menuW - VIEWPORT_PAD)
  return {
    position: 'fixed',
    top,
    left,
    minWidth: menuW,
    zIndex: MENU_OVERLAY_Z,
    visibility: 'visible',
  }
}

function OverlayMenu({
  anchorRef,
  align,
  minWidth,
  maxHeight,
  children,
  onClose,
}: {
  anchorRef: RefObject<HTMLElement | null>
  align: 'left' | 'right'
  minWidth: number
  maxHeight?: number
  children: ReactNode
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    minWidth,
    zIndex: MENU_OVERLAY_Z,
    visibility: 'hidden',
  })

  const update = useCallback(() => {
    const anchor = anchorRef.current
    const menu = menuRef.current
    if (!anchor || !menu) return
    setStyle(placeOverlay(anchor, menu, align, minWidth))
  }, [anchorRef, align, minWidth])

  useLayoutEffect(() => {
    update()
    const frame = window.requestAnimationFrame(update)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [update])

  useEffect(() => {
    function onPointer(e: MouseEvent) {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || anchorRef.current?.contains(t)) return
      onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [anchorRef, onClose])

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{
        ...overlayPanelStyle,
        ...style,
        maxHeight,
        overflowY: maxHeight ? 'auto' : 'visible',
        padding: 4,
      }}
    >
      {children}
    </div>,
    document.body,
  )
}

function actionButtonStyle(item: ActionItem): CSSProperties {
  return {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    border: 'none',
    background: 'transparent',
    fontSize: 12,
    cursor: item.disabled ? 'not-allowed' : 'pointer',
    color: item.danger ? T.red : T.t1,
    fontFamily: 'inherit',
    borderRadius: 5,
    opacity: item.disabled ? 0.5 : 1,
  }
}

export function RowActionsMenu({
  items,
  align = 'right',
}: {
  items: ActionItem[]
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, zIndex: open ? MENU_OVERLAY_Z : 1 }} onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Row actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          width: 32,
          height: 32,
          minWidth: 32,
          minHeight: 32,
          padding: 0,
          boxSizing: 'border-box',
          flexShrink: 0,
          background: open ? '#eff6ff' : '#fff',
          border: `1px solid ${open ? T.blue : '#d1d5db'}`,
          borderRadius: 8,
          cursor: 'pointer',
          color: open ? T.blue : T.t2,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
          lineHeight: 0,
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = '#f3f4f6'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = open ? '#eff6ff' : '#fff'
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            pointerEvents: 'none',
          }}
        >
          <span style={dotStyle} />
          <span style={dotStyle} />
          <span style={dotStyle} />
        </span>
      </button>
      {open && (
        <OverlayMenu
          anchorRef={triggerRef}
          align={align}
          minWidth={200}
          onClose={() => setOpen(false)}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                if (item.stub || !item.onClick) {
                  setToast(item.label)
                  return
                }
                item.onClick()
              }}
              style={actionButtonStyle(item)}
              onMouseEnter={(e) => {
                if (!item.disabled) e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {item.label}
              {item.stub ? <span style={{ color: T.t4, marginLeft: 6 }}>(soon)</span> : null}
            </button>
          ))}
        </OverlayMenu>
      )}
      {toast && <ComingSoonToast label={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

export function BulkActionsMenu({
  label = 'Bulk actions',
  groups,
  disabled,
}: {
  label?: string
  groups: { label: string; items: ActionItem[] }[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <div style={{ position: 'relative', display: 'inline-block', zIndex: open ? MENU_OVERLAY_Z : 2 }}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: '7px 12px',
          borderRadius: 7,
          border: '1px solid #e5e7eb',
          background: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          fontFamily: 'inherit',
          color: T.t1,
        }}
      >
        {label} ▾
      </button>
      {open && (
        <OverlayMenu
          anchorRef={triggerRef}
          align="right"
          minWidth={240}
          maxHeight={360}
          onClose={() => setOpen(false)}
        >
          {groups.map((g) => (
            <div key={g.label} style={{ marginBottom: 6 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: T.t4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '6px 8px 4px',
                }}
              >
                {g.label}
              </div>
              {g.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false)
                    if (item.stub || !item.onClick) {
                      setToast(item.label)
                      return
                    }
                    item.onClick()
                  }}
                  style={actionButtonStyle(item)}
                >
                  {item.label}
                  {item.stub ? <span style={{ color: T.t4, marginLeft: 6 }}>(soon)</span> : null}
                </button>
              ))}
            </div>
          ))}
        </OverlayMenu>
      )}
      {toast && <ComingSoonToast label={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

export function stubGroups(
  categories: { label: string; actions: string[] }[],
  overrides: Record<string, ActionItem> = {},
): { label: string; items: ActionItem[] }[] {
  return categories.map((cat) => ({
    label: cat.label,
    items: cat.actions.map((name) => {
      const id = `${cat.label}:${name}`
      return (
        overrides[id] ||
        overrides[name] || {
          id,
          label: name,
          stub: true,
        }
      )
    }),
  }))
}

export type { ReactNode }
