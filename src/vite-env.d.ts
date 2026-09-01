/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_DEMO_MODE: string
  /** Deployed site origin, e.g. https://main.xxxxx.amplifyapp.com (no trailing slash) */
  readonly VITE_APP_URL?: string
  /** CloudFront distribution for S3 media (no trailing slash) */
  readonly VITE_CDN_URL?: string
  readonly VITE_S3_REGION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
