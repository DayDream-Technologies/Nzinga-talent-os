import { useEffect, useRef, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { T } from '@/lib/tokens'

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('a, button, input, select, textarea, label, [role="menu"], [role="menuitem"]'))
}

export function SelectAllCheckbox({
  checked,
  indeterminate = false,
  onChange,
  disabled,
  label = 'Select all',
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked
  }, [checked, indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.checked)}
    />
  )
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div data-scroll-container="" style={{ padding: 20, overflow: 'auto', height: '100%', background: T.pageBg }}>
      <div
        className="animate-fade-in-up"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          marginBottom: 16,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.t1, margin: 0 }}>{title}</h1>
          {subtitle && (
            <p style={{ fontSize: 13, color: T.t3, marginTop: 4, lineHeight: 1.45, maxWidth: 640 }}>{subtitle}</p>
          )}
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
            {actions}
          </div>
        )}
      </div>
      <div className="animate-fade-in-up stagger-2" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}

export function Card({
  children,
  style,
  className = '',
  hover = true,
}: {
  children: ReactNode
  style?: CSSProperties
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={`${hover ? 'ui-card' : ''} ${className}`.trim()}
      style={{
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        borderRadius: 10,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'visible',
        position: 'relative',
        zIndex: 1,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Btn({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'info'
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const styles: Record<string, CSSProperties> = {
    primary: { background: T.blue, color: '#fff', border: 'none' },
    secondary: { background: T.mutedBg, color: T.t1, border: `1px solid ${T.cardBorder}` },
    success: { background: T.green, color: '#fff', border: 'none' },
    danger: { background: T.red, color: '#fff', border: 'none' },
    info: { background: T.purple, color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: T.blue, border: 'none', textDecoration: 'underline' },
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="ui-btn"
      style={{
        ...styles[variant],
        padding: '8px 14px',
        borderRadius: 7,
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}

export function Badge({
  children,
  color = T.blue,
  pulse = false,
}: {
  children: ReactNode
  color?: string
  pulse?: boolean
}) {
  const urgent =
    pulse ||
    (typeof children === 'string' &&
      /overdue|urgent|pending/i.test(children))

  return (
    <span
      className={urgent ? 'ui-badge-urgent' : undefined}
      style={{
        display: 'inline-block',
        background: `${color}18`,
        color,
        border: `1px solid ${color}33`,
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  )
}

export function Table({
  headers,
  rows,
  sortIndex,
  sortDir,
  onSort,
  selectAll,
  onRowClick,
  rowSelected,
}: {
  headers: ReactNode[]
  rows: ReactNode[][]
  sortIndex?: number
  sortDir?: 'asc' | 'desc'
  onSort?: (index: number) => void
  selectAll?: ReactNode
  onRowClick?: (index: number) => void
  rowSelected?: boolean[]
}) {
  return (
    <div style={{ overflowX: 'auto', overflowY: 'visible', position: 'relative', zIndex: 1 }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }}>
        <thead>
          <tr>
            {headers.map((h, i) => {
              const label = typeof h === 'string' ? h : ''
              const sortable = Boolean(onSort && label)
              const active = sortable && sortIndex === i
              const isFirst = i === 0
              const isCompactCol = !label
              const isLast = i === headers.length - 1
              return (
                <th
                  key={i}
                  onClick={sortable ? () => onSort?.(i) : undefined}
                  title={sortable ? `Sort by ${label}` : undefined}
                  style={{
                    textAlign: isLast && isCompactCol ? 'right' : 'left',
                    padding: '8px 10px',
                    paddingRight: isLast ? 14 : 10,
                    borderBottom: `1px solid ${T.cardBorder}`,
                    color: active ? T.blue : T.t3,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: sortable ? 'pointer' : 'default',
                    userSelect: sortable ? 'none' : undefined,
                    width: isCompactCol ? '1%' : undefined,
                    position: 'sticky',
                    top: 0,
                    zIndex: 3,
                    background: T.cardBg,
                  }}
                >
                  {isFirst && selectAll ? selectAll : h}
                  {active && (
                    <span style={{ marginLeft: 4, fontSize: 10 }}>{sortDir === 'desc' ? '▼' : '▲'}</span>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const clickable = Boolean(onRowClick)
            const selected = Boolean(rowSelected?.[i])
            return (
              <tr
                key={i}
                className={`ui-table-row animate-fade-in-up stagger-${Math.min(i + 1, 8)}${clickable ? ' is-clickable' : ''}${selected ? ' is-selected' : ''}`}
                style={{ position: 'relative', zIndex: selected || clickable ? 2 : 1 }}
                tabIndex={clickable ? 0 : undefined}
                onClick={
                  onRowClick
                    ? (e: MouseEvent<HTMLTableRowElement>) => {
                        if (isInteractiveTarget(e.target)) return
                        onRowClick(i)
                      }
                    : undefined
                }
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return
                        if (isInteractiveTarget(e.target)) return
                        e.preventDefault()
                        onRowClick(i)
                      }
                    : undefined
                }
              >
                {row.map((cell, j) => {
                  const label = typeof headers[j] === 'string' ? (headers[j] as string) : ''
                  const isCompactCol = !label
                  const isLast = j === row.length - 1
                  return (
                    <td
                      key={j}
                      style={{
                        padding: '10px',
                        paddingRight: isLast ? 14 : 10,
                        borderBottom: `1px solid ${T.cardBorder}`,
                        color: T.t1,
                        verticalAlign: isCompactCol ? 'middle' : 'top',
                        whiteSpace: isCompactCol ? 'nowrap' : undefined,
                        width: isCompactCol ? '1%' : undefined,
                        textAlign: isLast && isCompactCol ? 'right' : 'left',
                        position: isCompactCol ? 'relative' : undefined,
                        zIndex: isLast && isCompactCol ? 2 : undefined,
                        overflow: 'visible',
                      }}
                    >
                      {cell}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: T.t4, fontSize: 13 }}>No records yet.</div>
      )}
    </div>
  )
}

export function Money({ value }: { value: number }) {
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
      ${value.toLocaleString()}
    </span>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 4 }}>{label}</div>
      {children}
    </label>
  )
}

/** Checkbox multi-select for clients, agents, talent, etc. */
export function MultiCheck({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, marginBottom: 6 }}>{label}</div>
      <div
        style={{
          border: `1px solid ${T.cardBorder}`,
          borderRadius: 8,
          padding: '8px 10px',
          maxHeight: 120,
          overflow: 'auto',
          background: T.inputBg,
          display: 'grid',
          gap: 6,
        }}
      >
        {options.length === 0 && (
          <div style={{ fontSize: 12, color: T.t4 }}>No options available.</div>
        )}
        {options.map((opt) => {
          const checked = selected.includes(opt)
          return (
            <label
              key={opt}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.t1, cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) =>
                  onChange(e.target.checked ? [...selected, opt] : selected.filter((x) => x !== opt))
                }
              />
              {opt}
            </label>
          )
        })}
      </div>
    </div>
  )
}

export function ModalShell({
  title,
  onClose,
  children,
  width = 520,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  width?: number
}) {
  // Portal to body so position:fixed is viewport-relative. Panel/page enter
  // animations keep a CSS transform, which would otherwise pin "fixed" overlays
  // to the full scrollable page instead of the visible window.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: T.elevatedBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: 12,
          padding: '24px 28px',
          width,
          maxWidth: '92vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.t1, margin: 0, fontFamily: "'Syne', sans-serif" }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              color: T.t3,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function toLocalDateTimeInput(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromLocalDateTimeInput(local: string): string {
  if (!local) return new Date().toISOString()
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: `1px solid ${T.inputBorder}`,
  background: T.inputBg,
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  color: T.t1,
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
}

export function StatusColor(status: string): string {
  const map: Record<string, string> = {
    open: T.amber,
    in_progress: T.blue,
    closed: T.green,
    resolved: T.green,
    done: T.green,
    sent: T.blue,
    paid: T.green,
    overdue: T.red,
    pending: T.amber,
    issued: T.blue,
    completed: T.green,
    cleared: T.green,
    disbursed: T.purple,
    draft: T.t3,
    active: T.green,
    screening: T.blue,
    interview: T.purple,
    offer: T.amber,
    signed: T.green,
    new: T.cyan,
  }
  return map[status] || T.t3
}

export function TicketTypeColor(type: string): string {
  const map: Record<string, string> = {
    availability: T.cyan,
    scheduling: T.blue,
    contract: T.purple,
    billing: T.amber,
    general: T.t3,
  }
  return map[type] || T.t3
}
