# Supabase Edge Functions — Full Setup & Testing Guide

Production project: **rvuchforbheotenhkxnm**  
Production app: **https://talentmanagerx.com**

This guide covers Mailjet email and RingCentral phone/SMS/webhook Edge Functions, including how to fix common **400** errors such as `Invalid action`, `Invalid JSON body`, and Supabase gateway `Invalid arguments`.

---

## Table of contents

1. [Architecture](#architecture)
2. [Prerequisites checklist](#prerequisites-checklist)
3. [Database migrations](#database-migrations)
4. [Supabase secrets](#supabase-secrets)
5. [Amplify frontend env vars](#amplify-frontend-env-vars)
6. [RingCentral app configuration](#ringcentral-app-configuration)
7. [Deploy Edge Functions](#deploy-edge-functions)
8. [JWT verification (important)](#jwt-verification-important)
9. [How the frontend invokes functions](#how-the-frontend-invokes-functions)
10. [Testing each function](#testing-each-function)
11. [End-to-end app testing](#end-to-end-app-testing)
12. [Troubleshooting 400 errors](#troubleshooting-400-errors)
13. [Function reference](#function-reference)

---

## Architecture

```
talentmanagerx.com (React SPA)
  │
  │  supabase.functions.invoke('ringcentral-oauth', { body: { action: 'status' } })
  │  supabase.functions.invoke('ringcentral-call', { body: { talent_id, phone_number } })
  │  supabase.functions.invoke('ringcentral-sms', { body: { talent_id, phone_number, message } })
  │  supabase.functions.invoke('send-email', { body: { to_email, subject, html_body, ... } })
  ▼
https://rvuchforbheotenhkxnm.supabase.co/functions/v1/<function-name>
  │
  ├── ringcentral-oauth   → RingCentral OAuth + token storage
  ├── ringcentral-call    → RingOut (click-to-call)
  ├── ringcentral-sms     → SMS send
  ├── ringcentral-webhook → Inbound call events (RingCentral → Supabase)
  └── send-email          → Mailjet transactional email
```

Staff must be logged in with **Supabase Auth** (not demo mode) for all functions except `ringcentral-oauth?action=callback` (browser redirect from RingCentral) and `ringcentral-webhook` (RingCentral POST).

---

## Prerequisites checklist

- [ ] Supabase project `rvuchforbheotenhkxnm` with Auth enabled
- [ ] Staff users in `auth.users` linked to `public.users.auth_uid`
- [ ] Migrations `001`–`005` applied (especially `004_ringcentral`, `005_fix_rc_tokens_auth_uid`)
- [ ] RingCentral app at [developers.ringcentral.com](https://developers.ringcentral.com/my-account.html#/applications)
- [ ] Mailjet account with verified sender
- [ ] Supabase CLI installed: `npm i -g supabase` or use project devDependency
- [ ] Amplify env vars set and app redeployed

---

## Database migrations

Run in **SQL Editor** (in order) or:

```bash
supabase link --project-ref rvuchforbheotenhkxnm
supabase db push
```

Required for RingCentral:

| Migration | Purpose |
|-----------|---------|
| `004_ringcentral.sql` | `user_rc_tokens`, history telephony columns, `sms` type |
| `005_fix_rc_tokens_auth_uid.sql` | Fix tokens table to use `auth_uid` (Supabase Auth UUID) |

After `005`, all staff must **reconnect RingCentral** in Settings.

Verify tables exist:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_rc_tokens';

SELECT unnest(enum_range(NULL::history_type));
-- should include 'sms'
```

---

## Supabase secrets

Set in **Dashboard → Edge Functions → Secrets** or via CLI (**not** SQL Editor):

```powershell
supabase link --project-ref rvuchforbheotenhkxnm

# RingCentral
supabase secrets set RC_CLIENT_ID=your-client-id
supabase secrets set RC_CLIENT_SECRET=your-client-secret
supabase secrets set RC_SERVER_URL=https://platform.ringcentral.com
supabase secrets set RC_REDIRECT_URI=https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-oauth?action=callback
supabase secrets set RC_WEBHOOK_VERIFICATION_TOKEN=cbc0d27c288d694bc2ec339bdbdeb3b3
supabase secrets set APP_URL=https://talentmanagerx.com

# Mailjet
supabase secrets set MJ_APIKEY_PUBLIC=your-mailjet-api-key
supabase secrets set MJ_APIKEY_PRIVATE=your-mailjet-secret-key
supabase secrets set MJ_SENDER_EMAIL=discovery@nzingamamgmt.com
supabase secrets set MJ_SENDER_NAME="Nzinga Talent Group"
```

Or copy `.env.secrets.example` → `.env.secrets` and run:

```powershell
.\scripts\set-supabase-secrets.ps1              # all secrets
.\scripts\set-supabase-secrets.ps1 -MailjetOnly # Mailjet only
```

**Do not set:** Bearer tokens, `RC_JWT`, or `service_role` in Amplify. Supabase auto-injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for Edge Functions.

---

## Amplify frontend env vars

| Variable | Production value |
|----------|------------------|
| `VITE_SUPABASE_URL` | `https://rvuchforbheotenhkxnm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your anon public key |
| `VITE_DEMO_MODE` | `false` |
| `VITE_APP_URL` | `https://talentmanagerx.com` |

Redeploy Amplify after changing any `VITE_*` variable.

If `VITE_DEMO_MODE=true` or Supabase vars are missing, the app runs in **demo mode** and Edge Functions are never called.

---

## RingCentral app configuration

1. **App type:** Server/Web with **Authorization Code** grant.
2. **OAuth redirect URI** (must match `RC_REDIRECT_URI` exactly):
   ```
   https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-oauth?action=callback
   ```
3. **Permissions:** RingOut, SMS, ReadCallLog, ReadCallRecording, Telephony Sessions Notifications, SubscriptionWebhook.
4. **Webhook subscription** should point to Supabase (not `talentmanagerx.com/api/webhook`):
   ```
   https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-webhook
   ```
   With `verificationToken`: `cbc0d27c288d694bc2ec339bdbdeb3b3`  
   With `eventFilters`: `["/restapi/v1.0/account/~/extension/~/telephony/sessions"]`

See [RINGCENTRAL_TALENTMANAGERX_SETUP.md](./RINGCENTRAL_TALENTMANAGERX_SETUP.md) for webhook migration steps.

---

## Deploy Edge Functions

From repo root:

```bash
supabase link --project-ref rvuchforbheotenhkxnm
npm run supabase:deploy
```

Or individually:

```bash
supabase functions deploy send-email
supabase functions deploy ringcentral-oauth
supabase functions deploy ringcentral-call
supabase functions deploy ringcentral-sms
supabase functions deploy ringcentral-webhook
```

**Redeploy after any code or `config.toml` change.** An outdated `ringcentral-oauth` deployment is a common cause of `Invalid action` 400 errors.

---

## JWT verification (important)

| Function | JWT at gateway | Why |
|----------|----------------|-----|
| `ringcentral-oauth` | **Off** (`verify_jwt = false`) | RingCentral OAuth callback has no user JWT |
| `ringcentral-webhook` | **Off** | RingCentral webhook POST has no user JWT |
| `ringcentral-call`, `ringcentral-sms`, `send-email` | **On** (default) | Staff must send Supabase session JWT |

Config files in repo:

- `supabase/functions/ringcentral-oauth/config.toml`
- `supabase/functions/ringcentral-webhook/config.toml`

If deploying via Dashboard only, manually disable JWT verification for those two functions under **Edge Functions → [function] → Settings**.

Non-callback OAuth routes (`status`, `authorize`, etc.) still require a valid JWT — checked inside the function via `authenticateRequest()`.

---

## How the frontend invokes functions

**Correct** — function name only, `action` in JSON body:

```typescript
supabase.functions.invoke('ringcentral-oauth', {
  body: { action: 'status' },
})

supabase.functions.invoke('ringcentral-call', {
  body: { talent_id: 't123', phone_number: '+15551234567' },
})
```

**Wrong** — query string in function name (causes gateway/client errors):

```typescript
// DO NOT DO THIS
supabase.functions.invoke('ringcentral-oauth?action=status', { body: {} })
```

Implementation: [`src/lib/edge-functions.ts`](src/lib/edge-functions.ts), [`src/lib/phone.ts`](src/lib/phone.ts).

---

## Testing each function

### Step 0 — Get a staff JWT

1. Log in at https://talentmanagerx.com (or local dev with `.env` configured).
2. Open browser DevTools → **Application** → **Local Storage** → find Supabase auth token, **or** run in console on a logged-in page:

```javascript
const { data } = await window.supabase?.auth.getSession?.() 
  ?? await (await import('/src/lib/supabase.ts')).supabase.auth.getSession()
console.log(data.session?.access_token)
```

Easier: **Network tab** → any Supabase request → copy `Authorization: Bearer eyJ...` value.

Set for curl tests:

```powershell
$env:SUPABASE_URL = "https://rvuchforbheotenhkxnm.supabase.co"
$env:SUPABASE_ANON_KEY = "your-anon-key"
$env:STAFF_JWT = "eyJhbG..."   # staff access token from login
```

---

### Test 1 — `ringcentral-oauth` (status)

**Expected:** `200` with `{ "connected": false }` or connected details.

```powershell
curl -X POST "$env:SUPABASE_URL/functions/v1/ringcentral-oauth" `
  -H "Authorization: Bearer $env:STAFF_JWT" `
  -H "apikey: $env:SUPABASE_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d "{\"action\":\"status\"}"
```

**Expected failures:**

| Response | Cause |
|----------|--------|
| `401 Unauthorized` | Missing/invalid JWT or not logged in |
| `503 RingCentral is not configured` | Missing `RC_CLIENT_ID`, `RC_CLIENT_SECRET`, or `RC_REDIRECT_URI` secrets |
| `400 Invalid action` | Old function deploy OR body missing `"action"` OR wrong Content-Type |

---

### Test 2 — `ringcentral-oauth` (authorize)

**Expected:** `200` with `{ "auth_url": "https://platform.ringcentral.com/..." }`.

```powershell
curl -X POST "$env:SUPABASE_URL/functions/v1/ringcentral-oauth" `
  -H "Authorization: Bearer $env:STAFF_JWT" `
  -H "apikey: $env:SUPABASE_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d "{\"action\":\"authorize\"}"
```

Open the returned `auth_url` in a browser to complete OAuth. You should redirect back to:

```
https://talentmanagerx.com/settings?rc=connected
```

---

### Test 3 — `ringcentral-oauth` (callback validation)

RingCentral hits this via GET — test Validation-Token handshake:

```powershell
curl -X POST "$env:SUPABASE_URL/functions/v1/ringcentral-oauth?action=callback" `
  -H "Validation-Token: test-token-123" `
  -v
```

**Expected:** `200` with response header `Validation-Token: test-token-123`.

---

### Test 4 — `ringcentral-call`

**Prerequisite:** RingCentral connected in Settings (`user_rc_tokens` row exists).

```powershell
curl -X POST "$env:SUPABASE_URL/functions/v1/ringcentral-call" `
  -H "Authorization: Bearer $env:STAFF_JWT" `
  -H "apikey: $env:SUPABASE_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d "{\"talent_id\":\"YOUR_TALENT_ID\",\"phone_number\":\"+15551234567\"}"
```

**Expected:** `200` `{ "status": "initiated", "session_id": "...", "history_id": "..." }`

| Response | Cause |
|----------|--------|
| `403 RingCentral not connected` | Connect RC in Settings first |
| `400 talent_id and phone_number are required` | Missing fields in body |
| `400 No phone number associated with your RingCentral account` | RC extension has no phone |

---

### Test 5 — `ringcentral-sms`

```powershell
curl -X POST "$env:SUPABASE_URL/functions/v1/ringcentral-sms" `
  -H "Authorization: Bearer $env:STAFF_JWT" `
  -H "apikey: $env:SUPABASE_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d "{\"talent_id\":\"YOUR_TALENT_ID\",\"phone_number\":\"+15551234567\",\"message\":\"Test from NTO\"}"
```

**Expected:** `200` `{ "status": "sent", "message_id": "..." }`

---

### Test 6 — `send-email`

```powershell
curl -X POST "$env:SUPABASE_URL/functions/v1/send-email" `
  -H "Authorization: Bearer $env:STAFF_JWT" `
  -H "apikey: $env:SUPABASE_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d "{\"to_email\":\"you@example.com\",\"to_name\":\"Test\",\"subject\":\"NTO test\",\"html_body\":\"<p>Hello</p>\",\"text_body\":\"Hello\"}"
```

**Expected:** `200` `{ "status": "sent", ... }`

| Response | Cause |
|----------|--------|
| `503 Mailjet is not configured` | Missing `MJ_*` secrets |
| `400 to_email and subject are required` | Missing required fields |
| `400 Provide template_id, html_body, or text_body` | No email body |

---

### Test 7 — `ringcentral-webhook`

Validation handshake (RingCentral subscription setup):

```powershell
curl -X POST "$env:SUPABASE_URL/functions/v1/ringcentral-webhook" `
  -H "Validation-Token: test-token-456" `
  -v
```

**Expected:** `200`, response header echoes `Validation-Token`.

With verification token configured:

```powershell
curl -X POST "$env:SUPABASE_URL/functions/v1/ringcentral-webhook" `
  -H "Verification-Token: cbc0d27c288d694bc2ec339bdbdeb3b3" `
  -H "Content-Type: application/json" `
  -d "{\"body\":{\"parties\":[]}}"
```

**Expected:** `200` `{ "status": "ignored" }` or `{ "status": "processed" }`

---

## End-to-end app testing

1. **Login** — company code → staff email/password. Confirm `VITE_DEMO_MODE=false`.
2. **Settings** — `/settings` → Connect RingCentral → approve → land on `?rc=connected`.
3. **Status** — Settings shows phone number and extension.
4. **Talent record** — open talent with `phone` set → Call / SMS buttons enabled.
5. **Outbound call** — click Call → history entry with `call_direction: outbound`.
6. **SMS** — send test message → history entry type `sms`.
7. **Email** — History tab → Send Email, or Send Application from pipeline.
8. **Webhook** — place inbound call from talent phone → history `call_direction: inbound` (after webhook subscription active).

---

## Troubleshooting 400 errors

### `Invalid action` (from `ringcentral-oauth`)

**Cause:** Function received POST without recognizable `action`.

**Fix:**
1. Redeploy: `supabase functions deploy ringcentral-oauth`
2. Call with body `{ "action": "status" }` — not query string in URL path
3. Ensure `Content-Type: application/json`

### `Invalid JSON body`

**Cause:** Empty body or non-JSON POST.

**Fix:** Always send `{}` at minimum with `Content-Type: application/json`.

### `to_email and subject are required` / `talent_id and phone_number are required`

**Cause:** Missing required fields — this is correct validation, not a bug.

**Fix:** Include all required fields per [Function reference](#function-reference).

### Supabase client error / gateway 400

**Cause:** Function name includes `?` or `/`, or body is not a plain object.

**Fix:** Use exact names: `ringcentral-oauth`, `ringcentral-call`, `ringcentral-sms`, `send-email`.

### `401 Unauthorized`

**Cause:** No staff JWT, expired session, or JWT verification enabled on oauth/webhook incorrectly for client calls.

**Fix:** Log in again. For oauth `status`/`authorize`, pass staff JWT in `Authorization` header.

### `503 RingCentral is not configured`

**Cause:** Missing Supabase secrets.

**Fix:** Set all `RC_*` secrets and redeploy functions (secrets apply on next invoke, redeploy recommended).

### `403 RingCentral not connected`

**Cause:** No row in `user_rc_tokens` for your auth user.

**Fix:** Settings → Connect RingCentral. Verify migration `005` applied and `auth_uid` column exists.

### Functions work in curl but not in app

**Cause:** Demo mode, wrong `VITE_SUPABASE_URL`, or stale Amplify build.

**Fix:**
1. Confirm Amplify env vars match production project
2. Redeploy Amplify
3. Hard refresh browser / clear cache

### View function logs

```bash
supabase functions logs ringcentral-oauth --project-ref rvuchforbheotenhkxnm
supabase functions logs ringcentral-call --project-ref rvuchforbheotenhkxnm
```

Or **Dashboard → Edge Functions → [function] → Logs**.

---

## Function reference

### `ringcentral-oauth`

| `action` (in JSON body) | Method | Auth | Response |
|-------------------------|--------|------|----------|
| `status` | POST | Staff JWT | `{ connected, expired?, phone_number?, extension_id? }` |
| `authorize` | POST | Staff JWT | `{ auth_url }` |
| `disconnect` | POST | Staff JWT | `{ status: "disconnected" }` |
| `refresh` | POST | Staff JWT | `{ status: "refreshed", expires_at }` |
| `callback` | GET | None (query `code`, `state`) | Redirect to APP_URL/settings |

### `ringcentral-call`

POST body:

```json
{
  "talent_id": "string (required)",
  "phone_number": "string E.164 (required)"
}
```

### `ringcentral-sms`

POST body:

```json
{
  "talent_id": "string (required)",
  "phone_number": "string (required)",
  "message": "string max 1000 (required)"
}
```

### `send-email`

POST body:

```json
{
  "to_email": "string (required)",
  "to_name": "string",
  "subject": "string (required)",
  "html_body": "string (required unless template_id or text_body)",
  "text_body": "string (optional)",
  "template_id": "number (optional, Mailjet)",
  "template_vars": "object (optional)"
}
```

### `ringcentral-webhook`

POST from RingCentral only. No staff JWT. Handles Validation-Token handshake and call event payloads.

---

## Deployed URLs (production)

| Function | URL |
|----------|-----|
| ringcentral-oauth | https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-oauth |
| ringcentral-call | https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-call |
| ringcentral-sms | https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-sms |
| ringcentral-webhook | https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-webhook |
| send-email | https://rvuchforbheotenhkxnm.supabase.co/functions/v1/send-email |

---

## Related docs

- [RINGCENTRAL_TALENTMANAGERX_SETUP.md](./RINGCENTRAL_TALENTMANAGERX_SETUP.md) — webhook migration, verification token
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — database and auth
- [AMPLIFY_SETUP.md](./AMPLIFY_SETUP.md) — frontend env vars
- [.env.secrets.example](./.env.secrets.example) — secrets template
