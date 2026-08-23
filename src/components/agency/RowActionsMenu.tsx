import { useEffect, useRef, useState, type ReactNode } from 'react'
import { T } from '@/lib/tokens'

const dotStyle = {
  display: 'block',
  width: 4,
  height: 4,
  borderRadius: 999,
  background: 'currentColor',
  flexShrink: 0,
} as const

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

export function RowActionsMenu({
  items,
  align = 'right',
}: {
  items: ActionItem[]
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
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
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            [align === 'right' ? 'right' : 'left']: 0,
            minWidth: 200,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
            zIndex: 400,
            overflow: 'hidden',
            padding: 4,
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
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
              style={{
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
              }}
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
        </div>
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
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', zIndex: open ? 50 : undefined }}>
      <button
        type="button"
        disabled={disabled}
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
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: 240,
            maxHeight: 360,
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
            zIndex: 1000,
            padding: 6,
          }}
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
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false)
                    if (item.stub || !item.onClick) {
                      setToast(item.label)
                      return
                    }
                    item.onClick()
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '7px 10px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: 12,
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    color: item.danger ? T.red : T.t1,
                    fontFamily: 'inherit',
                    borderRadius: 5,
                  }}
                >
                  {item.label}
                  {item.stub ? <span style={{ color: T.t4, marginLeft: 6 }}>(soon)</span> : null}
                </button>
              ))}
            </div>
          ))}
        </div>
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
