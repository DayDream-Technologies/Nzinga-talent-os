import { supabaseConfigured } from '@/lib/supabase'

/**
 * Frontend connection flags. Secrets live in Edge Function env;
 * Vite `VITE_*` flags (or a status ping) tell the UI to enable send/execute.
 * Until connected, show Coming soon — never fake a successful send.
 */

export type IntegrationId = 'twilio' | 'dochub' | 'stripe' | 'plaid' | 'screening' | 'calendar' | 'chase'

export function envFlag(name: string): boolean {
  const raw = String(import.meta.env[name] || '').toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes'
}

export function isTwilioConnected(): boolean {
  return envFlag('VITE_TWILIO_CONNECTED') && supabaseConfigured
}

/** The API key stays in Supabase secrets. Demo mode (no Supabase) stays on Coming soon. */
export function isDocHubConnected(): boolean {
  return supabaseConfigured
}

export function isStripeConnected(): boolean {
  return envFlag('VITE_STRIPE_CONNECTED') && supabaseConfigured
}

export function isPlaidConnected(): boolean {
  return envFlag('VITE_PLAID_CONNECTED') && supabaseConfigured
}

export function isScreeningConnected(): boolean {
  return envFlag('VITE_SCREENING_CONNECTED') && supabaseConfigured
}

export function isCalendarSyncConnected(): boolean {
  return envFlag('VITE_CALENDAR_SYNC_CONNECTED') && supabaseConfigured
}

export function isChaseConnected(): boolean {
  return envFlag('VITE_CHASE_CONNECTED') && supabaseConfigured
}

export const INTEGRATION_LABELS: Record<IntegrationId, string> = {
  twilio: 'Twilio (voice & SMS)',
  dochub: 'DocHub (e-sign)',
  stripe: 'Stripe (brand checkout)',
  plaid: 'Plaid (bank verify / feeds)',
  screening: 'Background screening',
  calendar: 'Google / Outlook calendar sync',
  chase: 'Chase escrow / ACH (NACHA)',
}

const COMING_SOON: Record<IntegrationId, string> = {
  twilio: 'Voice calls and text messaging are coming soon. You can still open the inbox and compose; send stays off until Twilio is live.',
  dochub: 'Contract sending and e-sign are coming soon. Preview stays available; send and sign stay off until DocHub is live.',
  stripe: 'Card and ACH invoice pay are coming soon. Invoice lists still show here; Pay stays off until Stripe is live.',
  plaid: 'Bank linking and live statement feeds are coming soon. You can still reconcile with in-app deposits.',
  screening: 'Background screening invites are coming soon. Status tracking stays in the workspace; Initiate stays off until a provider is live.',
  calendar: 'Google and Outlook calendar sync is coming soon. In-app hours and conflict checks still work.',
  chase: 'Live escrow clearing and payday ACH are coming soon. Approvals still follow the in-app escrow-cleared rule.',
}

export function integrationMessage(id: IntegrationId, audience: 'staff' | 'public' = 'staff'): string {
  const body = COMING_SOON[id]
  if (audience === 'public') return body
  return `${body} Vendor setup is listed in EXTERNAL_ATTENTION.txt.`
}
