import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isDemoMode(): boolean {
  const demo = import.meta.env.VITE_DEMO_MODE
  if (demo === 'true') return true
  if (demo === 'false') return false
  return !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY
}
