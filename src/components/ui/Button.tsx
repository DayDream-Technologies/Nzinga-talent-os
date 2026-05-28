import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'success' | 'danger' | 'warning' | 'purple' | 'ghost' | 'orange' | 'link'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  full?: boolean
  sm?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand-blue text-white border-transparent shadow-sm',
  success: 'bg-green-700 text-white border-transparent shadow-sm',
  danger: 'bg-brand-red text-white border-transparent shadow-sm',
  warning: 'bg-brand-amber text-white border-transparent shadow-sm',
  purple: 'bg-brand-purple text-white border-transparent shadow-sm',
  ghost: 'bg-white text-t2 border border-input-border shadow-sm',
  orange: 'bg-brand-orange text-white border-transparent shadow-sm',
  link: 'bg-transparent text-brand-blue border-transparent shadow-none',
}

export function Button({
  variant = 'ghost',
  full,
  sm,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded font-medium whitespace-nowrap font-sans',
        sm ? 'px-2.5 py-0.5 text-[11px]' : 'px-3.5 py-1 text-xs',
        variants[variant],
        full && 'w-full',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
