/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_DEMO_MODE: string
  /** Deployed site origin, e.g. https://main.xxxxx.amplifyapp.com (no trailing slash) */
  readonly VITE_APP_URL?: string
  /** Optional — add when EmailJS is configured (see AMPLIFY_SETUP.md) */
  readonly VITE_EMAILJS_SERVICE_ID?: string
  readonly VITE_EMAILJS_TEMPLATE_ID?: string
  readonly VITE_EMAILJS_PUBLIC_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
