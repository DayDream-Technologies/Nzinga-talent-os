import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isDemoMode } from './utils'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey && !isDemoMode())

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, anonKey!)
  : null

export const DOCUMENTS_BUCKET = 'documents'
