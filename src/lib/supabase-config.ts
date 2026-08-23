/** Supabase project base URL — set VITE_SUPABASE_URL in Amplify / .env */
export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '') ?? ''
}

/** Deployed Edge Function URLs (derived from VITE_SUPABASE_URL) */
export function getSupabaseFunctionUrls() {
  const base = getSupabaseUrl()
  return {
    sendEmail: `${base}/functions/v1/send-email`,
    ringcentralOauth: `${base}/functions/v1/ringcentral-oauth`,
    ringcentralCall: `${base}/functions/v1/ringcentral-call`,
    ringcentralSms: `${base}/functions/v1/ringcentral-sms`,
    ringcentralWebhook: `${base}/functions/v1/ringcentral-webhook`,
  } as const
}

/** OAuth callback URL — must match RC_REDIRECT_URI Supabase secret and RingCentral app config */
export function getRingCentralOAuthCallbackUrl(): string {
  return `${getSupabaseFunctionUrls().ringcentralOauth}?action=callback`
}
