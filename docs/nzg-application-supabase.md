# NZG Application + Guardian (Supabase)

## Migrations
Apply in order through `012_guardian_and_docs_comms.sql`:
- `applications.guardian_status`, `applications.guardian_email`
- `guardian_invites`, `guardian_profiles`
- document + history follow-up columns

## Auth email templates (Dashboard → Authentication → Email Templates)
Enable and configure:
1. **Confirm signup** — prospect account creation (`/auth/confirmed`)
2. **Magic Link** — guardian OTP invites (`/guardian/verify?app=…&token=…`)
3. **Reset password** — `/reset-password`

Redirect URLs must include your app origin, e.g.:
- `http://localhost:3000/**`
- production origin `/**`

## Guardian flow
1. Minor completes NZG portal application and provides guardian email
2. App status becomes `pending_guardian`
3. Guardian receives Supabase magic link email
4. Guardian completes `/guardian/verify` (ID, optional guardianship docs, e-consent)
5. App becomes `submitted` / `guardian_status=completed` and enters **New / Lead**

## Notes
- Public application is NZG-only (`APPLICATION_COMPANY_CODES`)
- Tax/banking/SSN are **not** collected in the public application (onboarding later)
- Demo mode without Supabase: guardian invite is stored locally; open `/guardian/verify?app=…&token=…` from invite response / console
