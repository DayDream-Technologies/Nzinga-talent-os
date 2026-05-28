# Nzinga Talent OS — Claude Code Guide

## Project Overview
Nzinga Talent OS (NTO) is a full-stack talent management system built in React + Vite. It manages talent through a 7-stage pipeline with 6 role-based user types, a prospect self-serve application portal, file uploads, document management, and RBAC enforcement throughout.

## Quick Start
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build → dist/
npm run preview    # preview the build
```

## Architecture
Single-page React app (no backend). All state is in-memory. File uploads are base64-encoded and stored in React state.

```
src/
├── App.jsx                    # Root component — state, routing between views
├── main.jsx                   # ReactDOM entry point
├── data/
│   └── constants.js           # ALL constants, seed data, pure logic functions
└── components/
    ├── ui.jsx                 # Design tokens (T), shared atoms (Btn, FInput, etc.)
    ├── AuthScreens.jsx        # CompanyCodeScreen, LoginScreen
    ├── ProspectPortal.jsx     # ProspectPortal, ApplicationForm (prospect-facing)
    ├── ApplicationModals.jsx  # SendApplicationModal, ApplicationReview
    ├── Layout.jsx             # TopNav, BreadcrumbBar, Scoreboard, FullMenu, Sidebar
    ├── Dashboard.jsx          # Dashboard, Workspace, ApplicationsPanel
    ├── Pipeline.jsx           # Pipeline, Roster
    ├── Tasks.jsx              # Tasks
    ├── History.jsx            # HistoryMod, Reports
    ├── NewEntry.jsx           # NewEntry
    └── TalentRecord.jsx       # TalentRecord (10-tab modal — the core record view)
```

## Key Files

### `src/data/constants.js`
The single source of truth. Contains:
- `COMPANY_CODES` — valid login codes (NZG, NZINGA, TCG)
- `USERS` — 6 seed employees with roles, emails, passwords
- `ROLE_STAGE_ACCESS` — maps each role to the pipeline stages they can see (RBAC)
- `ROLE_ACTION_STAGE` — the stage each role primarily acts on
- `STAGES`, `STAGE_LABELS`, `STAGE_COLORS` — pipeline stage config
- `REQUIRED_DOCS` — the 4 required documents (gov_id, tax_doc, banking, proof_income)
- `APP_SECTIONS` — the 6 sections of the prospect application form (with field definitions)
- `validateSection(secId, data)` → array of missing required field IDs
- `isAppComplete(app)` → boolean — all required fields filled
- `talentFromApp(app)` → builds a holding-entry talent object from a submitted application
- Seed data: `TASKS_SEED`, `HISTORY_SEED`, `TALENTS_SEED`, `APPLICATIONS_SEED`

### `src/App.jsx`
- Manages all top-level state: `talents`, `tasks`, `history`, `applications`, `view`, `user`
- `saveApp(app)` — the core application workflow function:
  - Creates a stub talent profile when a prospect starts an application
  - Upgrades the stub when the app is submitted and 100% complete
  - Auto-imports complete submitted apps to `holding_entry` pipeline
- `importAppToPipeline(app)` — manual staff import from Applications panel
- Uses `talentsRef` and `applicationsRef` to avoid stale closures

### `src/components/ui.jsx`
All shared design tokens and reusable atoms. The `T` object is the design system:
```js
T.blue, T.green, T.red, T.amber, T.purple, T.cyan, T.orange
T.t1 (darkest text) → T.t5 (lightest)
T.pageBg, T.cardBg, T.navBg, T.inputBg
```
Key components: `Btn`, `FInput`, `FTextarea`, `FSelect`, `Section`, `FileUpload`, `DocViewer`, `IncompleteSectionAlert`

## Roles & RBAC

| Role | Email | Password | Sees Stages |
|---|---|---|---|
| scout | jordan@nzinga.co | scout123 | holding_entry, scout_complete |
| team1_lead | marcus@nzinga.co | lead123 | scout_complete, team1_review |
| ops_specialist | priya@nzinga.co | ops123 | team1_review, ops_processing |
| team2_lead | devon@nzinga.co | lead2123 | ops_processing, team2_audit |
| director | simone@nzinga.co | director123 | ALL stages |
| success_manager | alexis@nzinga.co | success123 | executive_review, signed_onboarding |

Company Code: **NZG** (also: NZINGA, TCG)

## Pipeline Stages (sequential)
`holding_entry → scout_complete → team1_review → ops_processing → team2_audit → executive_review → signed_onboarding`
(Plus `archived` and `not_viable` as terminal stages)

## Application Workflow
1. Scout creates a holding entry OR sends application link to prospect
2. Prospect visits portal, enters access code, fills 6-section form with autosave
3. Incomplete apps remain in Applications Pipeline with ⚠ badges
4. On 100% completion + submit → stub profile auto-upgraded, enters `holding_entry`
5. Staff reviews via Applications panel → Import to Pipeline button

## Jordan Score
- 5 pillars, each scored 1–5 by scout
- All pillars must be ≥ 3
- Average must be ≥ 3.5 to advance to Team 1 Review
- Each pillar requires a written rationale

## File Uploads
Files are read as base64 `data:` URLs via `FileReader`. Stored in React state on the talent's `uploaded_docs` object. `DocViewer` renders images directly or PDFs in an iframe.

## Email (SendApplicationModal)
Uses EmailJS (`api.emailjs.com`). In demo mode, credentials are placeholder values so it gracefully falls back with a "demo mode" message. To enable:
1. Create account at emailjs.com
2. Set service ID, template ID, and public key in `SendApplicationModal`
3. The template should accept: `to_email`, `to_name`, `access_code`, `portal_link`, `from_name`

## Common Claude Code Tasks

### Add a new pipeline stage
1. Add to `STAGES` array in `constants.js`
2. Add label to `STAGE_LABELS`
3. Add color to `STAGE_COLORS`
4. Update `ROLE_STAGE_ACCESS` for relevant roles
5. Add any action logic in `TalentRecord.jsx`

### Add a new role
1. Add user to `USERS` in `constants.js`
2. Add to `ROLE_LABELS`, `ROLE_STAGE_ACCESS`, `ROLE_ACTION_STAGE`
3. Add to `ROLE_LABELS` display map
4. Any role-specific UI is gated with `role === "new_role"` checks in components

### Add a new application form section
1. Add to `APP_SECTIONS` in `constants.js` with `id`, `label`, `icon`, and `fields`
2. Required fields with `required: true` are auto-validated by `validateSection()`
3. `isAppComplete()` picks up the new section automatically

### Add a new required document
1. Add to `REQUIRED_DOCS` in `constants.js`
2. Add a corresponding `file_upload` field to the `documents` section in `APP_SECTIONS`
3. The Documents tab in TalentRecord picks up `REQUIRED_DOCS` automatically

### Modify scoring logic (Jordan Score pillars)
Edit `PILLAR_NAMES` in `constants.js` and the scoring UI is in `TalentRecord.jsx` under `tab==="Scoring"`.

## Environment Variables
No `.env` required for the demo. For production email:
```
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```
Then reference in `ApplicationModals.jsx` as `import.meta.env.VITE_EMAILJS_*`.

## Notes for Claude Code
- All state is managed in `App.jsx` and passed down as props — no Redux, no Context
- The `selected` state drives TalentRecord modal visibility
- `view` state drives which main panel renders
- RBAC is enforced at the data layer (`ROLE_STAGE_ACCESS`) AND at the UI layer (conditional renders)
- Never add global CSS files — all styles are inline style objects using `T` tokens
- When adding new components, follow the same import pattern (ui.jsx for atoms, constants.js for data)
