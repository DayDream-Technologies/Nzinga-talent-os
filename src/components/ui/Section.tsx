import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  action?: ReactNode
  children: ReactNode
  accent?: string
  className?: string
}

export function Section({ title, action, children, accent, className }: SectionProps) {
  return (
    <div className={cn('overflow-hidden rounded-md border border-card-border bg-card-bg', className)}>
      <div
        className="flex items-center justify-between border-b-2 bg-[#fafbfc] px-3 py-1.5"
        style={{ borderBottomColor: accent || '#2563eb' }}
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-t2">{title}</span>
        {action}
      </div>
      <div className="p-2.5 px-3">{children}</div>
    </div>
  )
}

export function TH({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b-2 border-gray-200 bg-[#f8f9fb] px-2.5 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-t3',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function TD({
  children,
  className,
  muted,
}: {
  children: ReactNode
  className?: string
  muted?: boolean
}) {
  return (
    <td
      className={cn(
        'border-b border-[#f0f2f5] px-2.5 py-2 align-middle text-xs',
        muted ? 'text-t3' : 'text-t2',
        className,
      )}
    >
      {children}
    </td>
  )
}

export function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div
      role="switch"
      aria-checked={on}
      onClick={() => !disabled && onChange(!on)}
      className={cn(
        'relative h-5 w-[38px] shrink-0 cursor-pointer rounded-[10px] transition-colors',
        on ? 'bg-brand-blue' : 'bg-gray-300',
        disabled && 'cursor-default',
      )}
    >
      <div
        className={cn(
          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left]',
          on ? 'left-5' : 'left-0.5',
        )}
      />
    </div>
  )
}
