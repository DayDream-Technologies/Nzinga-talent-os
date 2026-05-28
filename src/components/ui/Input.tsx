import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface LabelProps {
  children: ReactNode
  required?: boolean
}

export function Label({ children, required }: LabelProps) {
  return (
    <div className="mb-0.5 text-[11px] font-medium text-t3">
      {children}
      {required && <span className="ml-0.5 text-brand-red">*</span>}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ className, error, readOnly, ...props }: InputProps) {
  return (
    <input
      readOnly={readOnly}
      className={cn(
        'box-border w-full rounded border px-2 py-1.5 text-xs text-t1 outline-none font-sans',
        readOnly ? 'bg-gray-50' : error ? 'border-brand-red bg-red-50' : 'border-input-border bg-input-bg',
        className,
      )}
      {...props}
    />
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ className, error, readOnly, ...props }: TextareaProps) {
  return (
    <textarea
      readOnly={readOnly}
      className={cn(
        'box-border w-full resize-y rounded border px-2 py-1.5 text-xs text-t1 outline-none font-sans',
        readOnly ? 'bg-gray-50' : error ? 'border-brand-red bg-red-50' : 'border-input-border bg-input-bg',
        className,
      )}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: (string | { v: string; l: string })[]
  error?: boolean
}

export function Select({ options, className, error, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'rounded border px-2 py-1.5 text-xs text-t1 outline-none font-sans',
        error ? 'border-brand-red' : 'border-input-border bg-input-bg',
        className,
      )}
      {...props}
    >
      {options.map((o) =>
        typeof o === 'string' ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ),
      )}
    </select>
  )
}
