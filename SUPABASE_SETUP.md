# Supabase Setup — Nzinga Talent OS

This guide walks through connecting Nzinga Talent OS to Supabase: database schema, auth (staff + prospects), storage, and local app configuration.

---

## Account vs. project: what to use?

### Short answer

**A dedicated Supabase project for Nzinga is enough for most teams.** You do not need a separate Supabase *account* unless you have compliance, billing, or access-isolation requirements.

| Approach | When it fits |
|----------|----------------|
| **One project inside an existing Supabase org** | Solo dev, internal demo, or early staging while you validate the product. |
| **Separate projects per environment (recommended)** | Normal production setup: e.g. `nzinga-dev`, `nzinga-staging`, `nzinga-prod` under one organization. |
| **Separate Supabase organization (account)** | Different legal entities, strict billing separation, or you must guarantee no one on another team can see this project in the dashboard. |

### Optimal setup (recommended)

1. **One Supabase organization** for Nzinga (company email domain).
2. **Three projects** when you go live:
   - **Development** — local + experiments; can reset data freely.
   - **Staging** — mirrors production config; used for QA before release.
   - **Production** — real talent and application data only.
3. **Do not** share one production database with unrelated apps (other products in the same project). Each product should have its own project so RLS, backups, and keys stay isolated.
4. **Do not** put production data in a personal Supabase account long term. Transfer the project to a team org before go-live.

### Is it OK to use a project inside “another” account?

- **OK for development** if that account is yours or your company’s and access is controlled.
- **Avoid for production** if “another account” means a contractor’s personal login, a shared agency account, or an org where unrelated people have Owner access.
- **Prefer** a company-owned org where only Nzinga admins have Owner/Admin on the production project.

---

## Prerequisites

- [Supabase](https://supabase.com) account (free tier is fine for dev).
- Node.js 18+ and `npm install` already run in this repo.
- This repo’s migrations:
  - `supabase/migrations/001_initial_schema.sql`
  - `supabase/migrations/002_auth_and_fixes.sql`
  - `supabase/seed.sql`

---

## Step 1 — Create a Supabase project

1. Sign in at [supabase.com](https://supabase.com).
2. **New project** → choose organization (create a team org if this is for Nzinga long term).
3. Set a strong **database password** and store it in a password manager (needed for direct DB access, not for the React app).
4. Pick a **region** close to your users (e.g. `us-east-1` if most users are US-based). Region is hard to change later.
5. Wait until the project finishes provisioning.

**Optimal:** Name projects clearly: `nzinga-talent-dev`, `nzinga-talent-prod`.

---

## Step 2 — Run database migrations

In the Supabase dashboard: **SQL Editor** → New query.

Run in order (copy/paste each file’s full contents):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_auth_and_fixes.sql`
3. `supabase/seed.sql`

**Verify**

- **Table Editor** should show: `users`, `talents`, `applications`, `tasks`, `history`, `uploaded_docs`, `prospect_profiles`, `company_codes`.
- `company_codes` should contain `NZG`, `NZINGA`, `TCG`.
- `users` should have 6 seed staff rows (`auth_uid` will be `NULL` until Step 4).

**Optimal:** For teams, track migrations in git and apply the same files to dev → staging → prod in that order. Do not edit production schema by hand without a migration file.

---

## Step 3 — Configure Auth

### Email auth (default)

1. **Authentication** → **Providers** → ensure **Email** is enabled.
2. For **development**, you may disable “Confirm email” so staff can log in immediately.
3. For **production**, enable email confirmation and configure SMTP (Supabase → Project Settings → Auth → SMTP) or use a custom domain.

### Staff users (6 roles)

Create one Auth user per seed staff email (passwords are for dev only; use strong passwords in production):

| Email | Role (in `users` table) |
|-------|-------------------------|
| jordan@nzinga.co | scout |
| marcus@nzinga.co | team1_lead |
| priya@nzinga.co | ops_specialist |
| devon@nzinga.co | team2_lead |
| simone@nzinga.co | director |
| alexis@nzinga.co | success_manager |

**Authentication** → **Users** → **Add user** → create each with email + password.

### Link Auth users to `public.users`

For each Auth user, copy their **User UID** from the dashboard, then run in SQL Editor:

```sql
UPDATE users SET auth_uid = '<auth-user-uuid>' WHERE email = 'jordan@nzinga.co';
UPDATE users SET auth_uid = '<auth-user-uuid>' WHERE email = 'marcus@nzinga.co';
-- repeat for u3–u6
```

Staff login in the app uses `supabase.auth.signInWithPassword` and then loads the row from `users` where `auth_uid = auth.uid()`.

### Prospect users

Prospects sign up through the **Prospect Portal** when Supabase is configured. That flow:

1. Calls `signUp` with email/password.
2. Inserts a row into `prospect_profiles`.
3. Creates/updates their `applications` row.

No manual Auth setup is required for prospects beyond enabling Email auth.

---

## Step 4 — Storage (documents)

1. **Storage** → **New bucket**
2. Name: `documents`
3. **Private** (not public)

The app uploads to `{talentId}/{docId}/{timestamp}_{filename}` and uses signed URLs for viewing.

Optional: apply storage RLS policies (commented at the bottom of `002_auth_and_fixes.sql`) if you want upload restricted to scout / ops / director at the storage layer as well as in the UI.

---

## Step 5 — Environment variables

For **AWS Amplify**, use the same variable names in the Amplify console (see [AMPLIFY_SETUP.md](./AMPLIFY_SETUP.md)). EmailJS variables are optional and can be omitted until you configure email delivery.

Copy `.env.example` to `.env` in the project root for local development:

```bash
cp .env.example .env
```

Set:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
VITE_DEMO_MODE=false
```

Find URL and anon key under **Project Settings** → **API**.

**Security notes**

- Only the **anon** key belongs in the frontend `.env`. Never commit the **service_role** key to the repo or ship it in Vite env vars.
- `service_role` bypasses RLS — use only in trusted server-side scripts or Edge Functions.

---

## Step 6 — Run the app

```bash
npm install
npm run dev
```

1. Open the app (default `http://localhost:3000`).
2. Enter a valid company code: `NZG`, `NZINGA`, or `TCG`.
3. Log in as a staff user you created in Auth (linked in `users.auth_uid`).
4. For prospects, use the portal route and test signup / login / application save.

With `VITE_DEMO_MODE=true` or missing Supabase vars, the app uses in-memory seed data and does not hit Supabase.

---

## What the database provides (vs. demo mode)

| Feature | Supabase |
|---------|----------|
| Staff login | Auth + `users.auth_uid` |
| Prospect login | Auth + `prospect_profiles` |
| One submitted app per email | Partial unique index on `applications` |
| Role-based talent access | RLS policies per role/stage |
| Company codes | `company_codes` table |
| Created-by on talents | `talents.created_by` |
| Document files | `documents` storage bucket |

---

## Row Level Security (RLS)

Migrations enable RLS on all main tables. Policies are defined in:

- `001_initial_schema.sql` (initial policies)
- `002_auth_and_fixes.sql` (full role-based policies)

**Optimal practices**

- Test login as each role (scout, team1_lead, director, etc.) and confirm pipeline visibility matches `ROLE_STAGE_ACCESS` in the app.
- After changing policies, re-test prospect portal autosave and staff import flows.
- If something “works in SQL Editor but not in the app”, check that the request uses the **anon** key with a valid JWT (logged-in user), not the service role.

---

## Environments checklist

| Environment | Supabase project | `VITE_DEMO_MODE` | Email confirm |
|-------------|------------------|------------------|---------------|
| Local dev | `nzinga-dev` | `false` when testing DB | Optional off |
| Staging | `nzinga-staging` | `false` | On |
| Production | `nzinga-prod` | `false` | On + SMTP |

Use separate anon keys per project. Do not point staging builds at production.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Login succeeds but app shows no user | `users.auth_uid` not set for that Auth user |
| “Database not configured (demo mode)” on prospect signup | Missing `VITE_SUPABASE_*` or `VITE_DEMO_MODE=true` |
| RLS errors on insert/update | User not linked in `users` or role policy doesn’t cover that stage |
| Duplicate email on submit | Expected if a **submitted** application already exists for that email |
| Documents don’t load | Bucket `documents` missing or file path mismatch |
| Company code invalid | `company_codes` seed not run or code inactive |

---

## Edge Functions — Email (Mailjet) & Phone (RingCentral)

API keys for third-party services are stored as **Supabase secrets** (never exposed to the frontend). Edge Functions act as secure proxies.

### Deploy Edge Functions

```bash
# Install Supabase CLI if not already
npm i -g supabase

# Link your project
supabase link --project-ref <your-project-ref>

# Deploy all functions
supabase functions deploy send-email
supabase functions deploy ringcentral-oauth
supabase functions deploy ringcentral-call
supabase functions deploy ringcentral-sms
supabase functions deploy ringcentral-webhook
```

### Set Supabase Secrets

```bash
# Mailjet (email)
supabase secrets set MJ_APIKEY_PUBLIC=<your-mailjet-api-key>
supabase secrets set MJ_APIKEY_PRIVATE=<your-mailjet-secret-key>
supabase secrets set MJ_SENDER_EMAIL=discovery@nzingamamgmt.com
supabase secrets set MJ_SENDER_NAME="Nzinga Talent Group"

# RingCentral (phone/SMS)
supabase secrets set RC_CLIENT_ID=<your-ringcentral-client-id>
supabase secrets set RC_CLIENT_SECRET=<your-ringcentral-client-secret>
supabase secrets set RC_SERVER_URL=https://platform.ringcentral.com
supabase secrets set RC_REDIRECT_URI=https://<project-ref>.supabase.co/functions/v1/ringcentral-oauth?action=callback
supabase secrets set RC_WEBHOOK_VERIFICATION_TOKEN=<your-chosen-token>

# App URL (used in email templates for portal link)
supabase secrets set APP_URL=https://your-app-url.amplifyapp.com
```

### RingCentral App Setup

1. Create an app at [developers.ringcentral.com](https://developers.ringcentral.com).
2. App type: **Server/Web** with **Authorization Code** grant.
3. Permissions required: `RingOut`, `SMS`, `ReadCallLog`, `ReadCallRecording`, `Telephony Sessions Notifications`, `SubscriptionWebhook`.
4. Set OAuth redirect URI to your `ringcentral-oauth` Edge Function callback URL:
   `https://<project-ref>.supabase.co/functions/v1/ringcentral-oauth?action=callback`
5. Webhook subscriptions are **created automatically** when a staff member connects RingCentral in Settings. The OAuth callback registers a telephony sessions webhook pointing at `ringcentral-webhook`. Set `RC_WEBHOOK_VERIFICATION_TOKEN` in Supabase secrets so inbound events are verified.

### Run Migrations 004 + 005

Apply RingCentral migrations via the SQL Editor or CLI:

```bash
supabase db push
```

- `004_ringcentral.sql` — initial tokens table + telephony history columns
- `005_fix_rc_tokens_auth_uid.sql` — **required if 004 was already applied** — recreates `user_rc_tokens` with `auth_uid UUID` (Supabase Auth user id) and adds `rc_subscription_id`

Migration 005 drops and recreates `user_rc_tokens`. Existing RC connections will need to reconnect in Settings after applying it.

### Edge Function Reference

| Function | Purpose |
|----------|---------|
| `send-email` | Sends email via Mailjet API v3.1 (application invites + general email) |
| `ringcentral-oauth` | OAuth 2.0 flow for per-user RC account linking |
| `ringcentral-call` | Initiates outbound RingOut call |
| `ringcentral-sms` | Sends SMS via RC API |
| `ringcentral-webhook` | Receives RC telephony events (inbound calls, recordings) |

---

## Optional: Supabase CLI

This repo ships SQL migrations as files; you can apply them via the dashboard or link the project with the [Supabase CLI](https://supabase.com/docs/guides/cli) for `supabase db push` and local branching. CLI is optional for the React-only workflow described above.

---

## Related files in this repo

| File | Purpose |
|------|---------|
| `supabase/migrations/001_initial_schema.sql` | Core tables and enums |
| `supabase/migrations/002_auth_and_fixes.sql` | Auth columns, prospect_profiles, RLS, indexes |
| `supabase/migrations/004_ringcentral.sql` | RingCentral tokens table + telephony history fields |
| `supabase/migrations/005_fix_rc_tokens_auth_uid.sql` | Fix token table to use auth_uid + subscription id |
| `supabase/seed.sql` | Staff users + company codes |
| `supabase/functions/send-email/` | Mailjet email Edge Function |
| `supabase/functions/ringcentral-oauth/` | RC OAuth Edge Function |
| `supabase/functions/ringcentral-call/` | RC outbound call Edge Function |
| `supabase/functions/ringcentral-sms/` | RC SMS Edge Function |
| `supabase/functions/ringcentral-webhook/` | RC inbound events Edge Function |
| `supabase/functions/shared/auth.ts` | Common auth helpers for Edge Functions |
| `supabase/functions/shared/phone.ts` | Phone normalization for webhook talent matching |
| `.env.example` | Env var template |
| `src/lib/supabase.ts` | Client and demo-mode detection |
| `src/lib/email.ts` | Email via Edge Function (Mailjet) |
| `src/lib/phone.ts` | Phone/SMS via Edge Function (RingCentral) |
| `src/lib/edge-functions.ts` | Typed Edge Function invocation wrapper |
| `src/services/auth.service.ts` | Staff and prospect auth |
| `IMPLEMENTATION_LOG.md` | Frontend todo implementation notes |

---

## Quick reference: deployment order

1. Create project (prefer team org, correct region).
2. Run `001` → `002` → `004` → `005` → `seed.sql`.
3. Create `documents` bucket (private).
4. Create Auth users for staff; link `auth_uid`.
5. Configure `.env` with URL, anon key, `VITE_DEMO_MODE=false`.
6. Set Supabase secrets for Mailjet and RingCentral (see above).
7. Deploy Edge Functions: `supabase functions deploy --all`.
8. `npm run dev` and smoke-test staff + prospect flows.
9. Test: send application email, click-to-call, SMS from talent record.
10. For production: separate project, SMTP, strong passwords, backups enabled in Supabase dashboard.
