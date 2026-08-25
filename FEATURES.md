# Nzinga Talent OS — Platform capabilities

Nzinga Talent OS (also branded as Talent Manager X) is a multi-tenant talent operating system. It takes a person from first contact through application, vetting, Client Packet, contract, and active roster, and it gives the agency the CRM, communications, tickets, accounting, and reports needed to run day-to-day operations.

This file is the product capability catalog. Setup and development live in [README.md](README.md). Unshipped work lives in [TODO.md](TODO.md).

## How to keep this file current

- Update this file in the same change that ships a user-visible capability.
- Add or revise a bullet under the matching section below.
- Change the lifecycle diagram only when the SOP path itself changes.
- If a nav item or row action is still a stub, say so in that section rather than deleting the feature.

---

## Who uses it

| Audience | How they get in | What they do |
|---|---|---|
| **Staff** | Company code + staff login | Run CRM, pipeline, packets, contracts, finance, and admin |
| **Prospects** | `/portal` with an access code (or start a new application) | Fill the NZG short application |
| **Guardians** | `/guardian/verify` magic link | Confirm a minor applicant |
| **Signed talent** | `/talent/login` then `/talent/*` | Home, activity, money, files (including contract sign), messages, settings |

### Staff roles

System roles keep stable slugs. Directors can create additional roles with their own pipeline stages, module access, and permissions.

| Role | What they are for |
|---|---|
| **Scouting Agent** (`scout`) | Identify and qualify prospects. Send applications. Assemble a Client Packet. Do not approve representation or negotiate contracts. |
| **Team 1 Lead** | Legacy Client Packet Review path into operations. Can return a packet. |
| **Ops Specialist** | Compliance, documents, contract framework, and finance modules. |
| **Team 2 Lead** | Contract-pending audit before director review. |
| **Success Manager** | QA Client Packets, approve as **Approved - Future**, publish contracts, onboard signed clients. |
| **Director** | Full pipeline, admin (users, roles, settings), and executive decisions. |

Permissions that gate SOP actions: send application, submit Client Packet, track own submissions, approve packet, return packet, publish contract, admin access.

---

## End-to-end lifecycle

```mermaid
flowchart LR
  prospect[Prospect_CRM]
  app[Application]
  pipeline[Pipeline_NewLead]
  packet[Client_Packet]
  sm[SM_Review]
  future[Approved_Future]
  contract[Contract_Published]
  active[Active_Client]
  prospect --> app --> pipeline --> packet --> sm --> future --> contract --> active
```

**SOP sub-status** (shown on the pipeline record and CRM prospect) moves forward and does not rewind when an earlier event re-syncs:

1. New / Lead
2. Application Submitted / Under Vetting
3. In Manager Review
4. Approved - Future
5. Contract Published / Pending Signature
6. Active

**Pipeline stages** (the columns staff work) use these product labels:

| Stage key | Label |
|---|---|
| `holding_entry` | New / Lead |
| `scout_complete` | More Information Required |
| `team1_review` | Client Packet Review |
| `ops_processing` | Success Manager Validation |
| `team2_audit` | Contract Pending |
| `executive_review` | Director Review |
| `signed_onboarding` | Active Client |
| `archived` / `not_viable` | Archived / Declined |

Typical happy path:

1. Staff create a prospect (or a holding entry) and send an application. Known name, email, phone, DOB, location, and work area autofill the form.
2. The prospect completes and submits. Staff **Import to Pipeline** (or auto-upgrade on 100% submit) lands them at **New / Lead** as **Application Submitted / Under Vetting**.
3. The Scouting Agent scores Jordan pillars, records Discovery Call notes, collects government ID, and **Submit Client Packet to Success Manager**.
4. Success Manager QA: approve → CRM **Approved - Future** (Team 1 Lead can still Approve into ops on the legacy path).
5. Success Manager publishes the contract and notifies the prospect.
6. The prospect signs in the talent portal (in-app name confirmation). The record becomes an **Active Client**.

Each role only sees the pipeline stages they are allowed to act on. Scouts who submitted a packet can track that record downstream as read-only.

---

## Capability catalog

### Auth and tenancy

- Company code selects the tenant (NZG, NZINGA, TCG). Staff then sign in with email and password.
- Signup confirmation, password reset, and guardian links are sent by Supabase Auth (custom SMTP).
- Per-user settings: display name/title, light/dark theme, sidebar preference, password reset request.
- RingCentral account pairing on Settings for click-to-call and SMS (OAuth). TOTP MFA is configured in Supabase Auth; demo mode shows it as coming soon.

### Prospect CRM

- Create a prospect (name, email, DOB, division, source, assigned agent; parent contacts required for minors).
- Prospects list, merge, stage changes, notes, and a **Prospect Tracking Board**.
- **Send Application** from a prospect, talent record, New Entry, or applicant profile. Already-entered information maps into the matching application fields; staff notes are not copied.
- Application status keeps the CRM prospect in sync (sent → started → pending parent → completed) without overwriting a later SOP status such as Approved - Future.
- A few row actions still show **Coming soon** (for example some bulk/communication stubs on the prospects list).

### Applications

- NZG short application: Basic Information, Representation Interest, About You, then conditional Modeling / Acting / Sports / Influencing sections, Representation & Conflicts, Availability, Social & Portfolio, ID Verification, Final & Signature.
- Access-code lookup, autosave, file uploads, duplicate-email protection, and guardian flow for minors.
- Staff Applications list with progress, filters (in progress, pending parent, ready to import, incomplete), and applicant account profile.
- **Import to Pipeline** only for complete submitted apps (not pending guardian). Opens the pipeline record as **Application Submitted / Under Vetting** and does not rewind a later SOP stage.

### Pipeline and talent record

- Pipeline views (tables / kanban) filtered by the signed-in role’s stage access.
- Talent record tabs: Details, Scoring, Compliance, Documents, Framework, Executive, Onboarding, History, Tasks, Audit Log.
- **Jordan Score**: five pillars, each 1–5 with written rationale; all ≥ 3 and average ≥ 3.5 to advance.
- Scout Client Packet gate: Jordan Score, Discovery Call notes, and government ID. Submit sends the record to Success Manager review.
- Documents: government ID, tax, banking, proof of income, plus application uploads (headshots, reels, portfolio). Staff can add a profile photo.
- History captures notes, calls, emails, and system events (including follow-up flags). Tasks attach to the record.
- New Entry: manual holding-entry create, or create-and-send application.

### Contracts and onboarding

- Success Manager (or Director) **publish contract** and notify by email (platform send from Talent Manager X via Resend).
- Prospect/talent portal **Review and sign** uses in-app name confirmation (not DocuSign).
- On signature the CRM prospect becomes a **Clients · Active** roster record.
- Return-packet / more-information path sends the record back to the scout stage when QA rejects the packet.

### Clients / roster

- Shared account profile for applicants and clients: contacts, addresses, application answers, UDF roster sheet, charges, tickets, documents.
- UDF (user-defined roster fields) is staff-maintained; application answers prefill empty fields only.
- Clients list with lifecycle (current / future / past), contracts, and account number.
- Some client row actions remain **Coming soon** (publish signable documents from the list, add screening, send application from the clients grid).

### Communication

- **Send Email** compose for staff, with templates. Outbound mail goes through the `send-email` Edge Function (Resend). From-address is the platform domain; display name and Reply-To are per message.
- **Text Messaging Center** for SMS threads (RingCentral when connected).
- Talent record: click-to-call, SMS, call history (duration, direction, recording links when the telephony integration is connected).

### Client services

- Support tickets (create, status, types such as availability, scheduling, contract, billing).
- Agency tasks and checklist items.
- Appointments & meetings, plus a calendar of events.

### Accounting

Visible to Ops Specialist, Success Manager, and Director (account-manager module set). Agents do not see finance nav.

- Client invoices, recurring retainer plans, post retainers, overdue interest, batch receipts.
- Record escrow / deposit.
- Log expense / payout, vendors, disbursements, issue talent payouts.

### Reports

Role-scoped hub under **My Reports**:

- Roster & booking: roster scorecard, applicant pool & pipeline log, onboarding & offboarding, roster openings & availability, escrow balances (ops).
- Receivables: gross bookings & commission, AR aging, overdue accounts.
- Payables: pending talent payouts (AP aging).

### Admin

Directors (and roles with `admin_access`):

- Team users, invite team member, **Roles** (create / copy / edit / delete catalog roles and assign users).
- Audit log of admin and sensitive actions.
- System settings and in-app training.

### Talent portal

Signed clients (and approved prospects waiting to sign) use `/talent`:

- **Home** — status, agent, calendar, trust/earnings snapshot.
- **Activity** — appointments and related events.
- **Money** — invoices, commissions, payout request when tax/banking are ready.
- **Files** — documents on file and **Review and sign** when a contract is published.
- **Messages** — contact the assigned agent (prefilled email).
- **Settings** — portal preferences.

---

## Related docs

- [README.md](README.md) — install, demo mode, tech stack
- [TODO.md](TODO.md) — remaining product to-dos
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md), [EDGE_FUNCTIONS_SETUP.md](EDGE_FUNCTIONS_SETUP.md), [RINGCENTRAL_TALENTMANAGERX_SETUP.md](RINGCENTRAL_TALENTMANAGERX_SETUP.md) — integrations
