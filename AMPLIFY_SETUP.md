# AWS Amplify — Environment Variables

Nzinga Talent OS is a Vite SPA. Only variables prefixed with `VITE_` are embedded at **build time** and available in the browser via `import.meta.env`.

Configure them in the Amplify console:

**Hosting** → your app → **Hosting settings** → **Environment variables**

Then trigger a **new build** after any change (env vars are not applied to already-built assets).

---

## Required for production (Supabase)

Set these on every branch that should use the live database (e.g. `main` / production).

| Variable | Example | Notes |
|----------|---------|--------|
| `VITE_SUPABASE_URL` | `https://abcdefgh.supabase.co` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | API → `anon` `public` key (safe for frontend) |
| `VITE_DEMO_MODE` | `false` | Must be `false` for Supabase. If unset and Supabase vars exist, demo mode stays off. |

Database setup: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

**Do not** add `service_role` or database passwords to Amplify env vars for this frontend app.

---

## Recommended

| Variable | Example | Notes |
|----------|---------|--------|
| `VITE_APP_URL` | `https://talentmanagerx.com` | No trailing slash. Production custom domain. Used for prospect portal links in invitation emails. If omitted, the app uses the current browser origin at runtime. |

Production RingCentral + webhook alignment: [RINGCENTRAL_TALENTMANAGERX_SETUP.md](./RINGCENTRAL_TALENTMANAGERX_SETUP.md).

---

## Email & Phone — Supabase Secrets (NOT Amplify env vars)

Email (Mailjet) and Phone (RingCentral) API keys are stored as **Supabase secrets** and accessed only by Edge Functions. They are never exposed to the frontend bundle.

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for the full list of secrets to configure.

The frontend communicates with these services through Supabase Edge Functions:
- `send-email` — Mailjet transactional email
- `ringcentral-oauth` — RingCentral account linking
- `ringcentral-call` — Click-to-call via RingOut
- `ringcentral-sms` — SMS messaging
- `ringcentral-webhook` — Inbound call/recording event handler

---

## Per-environment strategy

| Amplify branch | Typical use | `VITE_DEMO_MODE` | Supabase project |
|----------------|-------------|------------------|------------------|
| `main` | Production | `false` | Production |
| `develop` / `staging` | QA | `false` | Staging |
| PR previews | Optional | `true` or separate staging project | Dev / staging |

Use **different** Supabase projects (or at least different anon keys) per environment. Do not point staging builds at production Supabase.

You can scope variables in Amplify per branch under **Environment variables** (branch overrides).

---

## Build settings

This repo includes [`amplify.yml`](./amplify.yml):

- `npm ci` → `npm run build`
- Output: `dist/`

Amplify should detect a static SPA; ensure **redirects** send unknown paths to `index.html` (standard for React Router). In Amplify Gen 2 / custom redirects, a common rule is:

- Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
- Target: `/index.html`
- Type: `200` (rewrite)

(Exact UI varies by Amplify version; use the SPA fallback template if offered.)

---

## Checklist before first production deploy

1. Supabase migrations and seed applied ([SUPABASE_SETUP.md](./SUPABASE_SETUP.md)).
2. Staff Auth users created and `users.auth_uid` linked.
3. Private `documents` storage bucket created.
4. Amplify env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DEMO_MODE=false`.
5. Amplify env: `VITE_APP_URL=https://talentmanagerx.com` (or your custom domain).
6. Supabase secrets: Mailjet keys, RingCentral credentials (see SUPABASE_SETUP.md).
7. Deploy Edge Functions: `supabase functions deploy --all`.
8. Redeploy Amplify after saving env vars.
9. Smoke test: company code → staff login → pipeline → send application (email sent via Mailjet).
10. Smoke test: `/portal` prospect flow with Supabase auth.
11. Smoke test: Settings → Connect RingCentral → click-to-call from talent record.

---

## Local development vs Amplify

| | Local (`.env`) | Amplify |
|--|----------------|---------|
| File | `.env` in repo root (gitignored) | Console → Environment variables |
| Reload | Restart `npm run dev` | New build / redeploy |
| Email/Phone | Edge Functions use Supabase secrets (same whether local or deployed) | Same |

---

## Related files

| File | Purpose |
|------|---------|
| `.env.example` | Local frontend env template |
| `.env.secrets.example` | Supabase Edge Function secrets template (copy to `.env.secrets`) |
| `RINGCENTRAL_TALENTMANAGERX_SETUP.md` | Production RC webhook + secrets for talentmanagerx.com |
| `scripts/set-supabase-secrets.ps1` | Apply secrets from `.env.secrets` (Windows) |
| `src/lib/supabase.ts` | Supabase client; demo mode detection |
| `src/lib/email.ts` | Email via Supabase Edge Function (Mailjet) |
| `src/lib/phone.ts` | Phone/SMS via Supabase Edge Function (RingCentral) |
| `src/lib/edge-functions.ts` | Typed wrapper for Edge Function invocation |
| `src/lib/utils.ts` | `isDemoMode()` |
| `supabase/functions/` | All Edge Functions (email, call, sms, oauth, webhook) |
| `SUPABASE_SETUP.md` | Database, auth, Edge Functions, and secrets setup |
