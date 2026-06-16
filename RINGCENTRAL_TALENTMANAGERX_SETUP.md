# RingCentral + talentmanagerx.com — Production alignment

> **Full setup, curl tests, and 400 error troubleshooting:** see [EDGE_FUNCTIONS_SETUP.md](./EDGE_FUNCTIONS_SETUP.md)

Production app: **https://talentmanagerx.com**  
Webhook target: **Supabase** `ringcentral-webhook` (not `talentmanagerx.com/api/webhook`)

---

## Security

- **Do not** store RingCentral Bearer access tokens or `RC_JWT` in Supabase or Amplify.
- If an access token was pasted in chat or committed, **revoke it** in RingCentral (wait for expiry or re-authenticate) and issue new tokens only via OAuth.
- Per-user OAuth in **Settings → Connect RingCentral** is the supported auth path for calls/SMS.

---

## 1. Amplify environment variables

Set in **AWS Amplify → Hosting → Environment variables**, then redeploy:

| Variable | Production value |
|----------|------------------|
| `VITE_SUPABASE_URL` | `https://rvuchforbheotenhkxnm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |
| `VITE_DEMO_MODE` | `false` |
| `VITE_APP_URL` | `https://talentmanagerx.com` |

No Mailjet or RingCentral keys in Amplify.

Local dev: copy [`.env.example`](./.env.example) → `.env`.

---

## 2. Supabase secrets (Edge Functions)

Set in **Dashboard → Edge Functions → Secrets** or via CLI.

Copy [`.env.secrets.example`](./.env.secrets.example) → `.env.secrets`, fill `RC_CLIENT_ID`, `RC_CLIENT_SECRET`, `MJ_*`, and `SUPABASE_PROJECT_REF`, then:

```powershell
# Windows
supabase link --project-ref YOUR-PROJECT-REF
.\scripts\set-supabase-secrets.ps1
```

```bash
# macOS/Linux
supabase link --project-ref YOUR-PROJECT-REF
chmod +x scripts/set-supabase-secrets.sh
./scripts/set-supabase-secrets.sh
```

### Production values (known)

| Secret | Value |
|--------|--------|
| `RC_SERVER_URL` | `https://platform.ringcentral.com` |
| `RC_WEBHOOK_VERIFICATION_TOKEN` | `cbc0d27c288d694bc2ec339bdbdeb3b3` |
| `APP_URL` | `https://talentmanagerx.com` |
| `RC_REDIRECT_URI` | `https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-oauth?action=callback` |

### You must supply

| Secret | Source |
|--------|--------|
| `RC_CLIENT_ID` | [RingCentral Developer Console](https://developers.ringcentral.com/my-account.html#/applications) |
| `RC_CLIENT_SECRET` | Same app |
| `MJ_APIKEY_PUBLIC` / `MJ_APIKEY_PRIVATE` | Mailjet |

---

## 3. RingCentral app configuration

1. App type: **Server/Web** with **Authorization Code** grant.
2. OAuth redirect URI (exact):
   ```
   https://YOUR-PROJECT-REF.supabase.co/functions/v1/ringcentral-oauth?action=callback
   ```
3. Permissions: `RingOut`, `SMS`, `ReadCallLog`, `ReadCallRecording`, `Telephony Sessions Notifications`, `SubscriptionWebhook`.

---

## 4. Database migrations

Run in Supabase **SQL Editor** (in order) or:

```bash
supabase db push
```

- [`supabase/migrations/004_ringcentral.sql`](./supabase/migrations/004_ringcentral.sql)
- [`supabase/migrations/005_fix_rc_tokens_auth_uid.sql`](./supabase/migrations/005_fix_rc_tokens_auth_uid.sql) — required if 004 was already applied

After 005, staff must **reconnect RingCentral** in Settings.

---

## 5. Deploy Edge Functions

```bash
npm run supabase:deploy
```

Or:

```powershell
.\scripts\deploy-edge-functions.ps1
```

Webhook URL after deploy:

```
https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-webhook
```

Deployed Edge Functions (production):

| Function | URL |
|----------|-----|
| `ringcentral-oauth` | `https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-oauth` |
| `ringcentral-call` | `https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-call` |
| `ringcentral-sms` | `https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-sms` |
| `ringcentral-webhook` | `https://rvuchforbheotenhkxnm.supabase.co/functions/v1/ringcentral-webhook` |
| `send-email` | `https://rvuchforbheotenhkxnm.supabase.co/functions/v1/send-email` |

The SPA calls these via `supabase.functions.invoke()` when `VITE_SUPABASE_URL=https://rvuchforbheotenhkxnm.supabase.co` is set in Amplify.

---

## 6. Migrate webhook from talentmanagerx.com → Supabase

**Retire:** `https://talentmanagerx.com/api/webhook/`  
**Use:** Supabase URL above

### Option A — Staff connects in app (recommended)

1. Set `RC_WEBHOOK_VERIFICATION_TOKEN` in Supabase secrets first.
2. On talentmanagerx.com: **Settings → Connect RingCentral**.
3. OAuth callback auto-creates a subscription with event filter `telephony/sessions`.
4. Delete any old subscription still pointing at `talentmanagerx.com/api/webhook`.

### Option B — Manual API (script)

Obtain a fresh `RC_ACCESS_TOKEN` via OAuth (not a pasted chat token):

```powershell
$env:SUPABASE_PROJECT_REF = "YOUR-PROJECT-REF"
$env:RC_ACCESS_TOKEN = "..."   # short-lived Bearer
.\scripts\migrate-ringcentral-webhook.ps1
```

To update an existing subscription instead of creating new:

```powershell
$env:RC_SUBSCRIPTION_ID = "subscription-id-from-rc"
.\scripts\migrate-ringcentral-webhook.ps1
```

Required subscription payload (included in script):

```json
{
  "eventFilters": ["/restapi/v1.0/account/~/extension/~/telephony/sessions"],
  "deliveryMode": {
    "transportType": "WebHook",
    "address": "https://YOUR-PROJECT-REF.supabase.co/functions/v1/ringcentral-webhook",
    "verificationToken": "cbc0d27c288d694bc2ec339bdbdeb3b3"
  }
}
```

List and delete old subscriptions:

```bash
curl -H "Authorization: Bearer $RC_ACCESS_TOKEN" \
  https://platform.ringcentral.com/restapi/v1.0/subscription
```

---

## 7. Smoke test checklist

- [ ] Amplify redeployed with `VITE_APP_URL=https://talentmanagerx.com`
- [ ] Supabase secrets set (scripts or dashboard)
- [ ] Migrations 004 + 005 applied
- [ ] Edge Functions deployed
- [ ] RingCentral OAuth redirect URI matches `RC_REDIRECT_URI`
- [ ] Staff connects RC in Settings
- [ ] Outbound call from talent record → history `call_direction: outbound`
- [ ] Inbound call from talent phone → history `call_direction: inbound`
- [ ] Old `talentmanagerx.com/api/webhook` subscription removed
- [ ] Application invite email sends via Mailjet

---

## Related docs

- [AMPLIFY_SETUP.md](./AMPLIFY_SETUP.md) — frontend env vars
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — database, auth, Edge Functions
