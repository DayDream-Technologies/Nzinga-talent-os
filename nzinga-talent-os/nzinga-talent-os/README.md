# Nzinga Talent OS

Enterprise talent management system for Nzinga Talent Group. Manages talent through a 7-stage pipeline with role-based access control, a self-serve prospect application portal, file uploads, document management, and automated pipeline transitions.

## Tech Stack

- **React 18** + **Vite 5**
- Inline styles with a unified design token system (`T`)
- No external UI library dependencies
- No backend — all state is in-memory (ready for API integration)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build
```

## Demo Credentials

**Company Code:** `NZG`

| Role | Email | Password |
|---|---|---|
| Scout | jordan@nzinga.co | scout123 |
| Team 1 Lead | marcus@nzinga.co | lead123 |
| Ops Specialist | priya@nzinga.co | ops123 |
| Team 2 Lead | devon@nzinga.co | lead2123 |
| Director | simone@nzinga.co | director123 |
| Success Manager | alexis@nzinga.co | success123 |

**Prospect Portal Access Code:** `KAI2026`

## Features

### Pipeline Management
- 7-stage talent pipeline: Holding Entry → Scout Complete → Team 1 Review → Ops Processing → Team 2 Audit → Executive Review → Signed Onboarding
- Role-based pipeline visibility — each role sees only their assigned stages
- Directors see all stages across the entire system

### Prospect Application Portal
- Self-serve portal accessible at the company code screen
- 6-section application form: Personal Info, Social Media, Talent & Niche, Business & Goals, Required Documents, Consent
- Autosave every 2 seconds with live save indicator
- Access code system for resuming saved applications
- File upload support (Gov ID, W-9, Banking Info, Proof of Income)

### Automated Workflow
- Stub talent profile auto-created when a prospect starts an application
- Incomplete applications remain in Applications Pipeline with ⚠ indicators
- 100% complete + submitted applications automatically transition to `holding_entry`
- Incomplete field detection with jump links to missing sections

### Talent Records
10-tab record view:
- **Details** — Lead info, social profile, revenue, history preview
- **Scoring** — Jordan Score (5-pillar system, min 3 per pillar, avg ≥ 3.5)
- **Compliance** — 8-item document checklist
- **Documents** — Required doc checklist with inline viewer (image + PDF)
- **Framework** — Contract terms (rep type, commission, term)
- **Executive** — Director-only summary view
- **Onboarding** — Portal setup, technical routing, warm hand-off
- **History / Notes** — Activity log with document-only filter checkbox
- **Tasks** — Linked tasks
- **Audit Log** — Full action history

### Role-Based Access Control
- Pipeline, Roster, Scoreboard, Command Launch search, and Reports all filtered by role
- Compliance and Framework tabs restricted to Ops Specialists, Team 2 Leads, and Directors
- Document upload restricted to Scouts, Ops Specialists, and Directors
- Directors have full visibility into all stages, users, and data

### Documents
- File uploads via `FileReader` (base64)
- Inline document viewer for images and PDFs
- Documents sourced from prospect portal uploads OR staff manual uploads
- Proof of Income collected but explicitly excluded from approval criteria
- Document uploads logged to talent history with view button

## Project Structure

```
nzinga-talent-os/
├── CLAUDE.md                  # Claude Code instructions
├── index.html
├── vite.config.js
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx               # ReactDOM entry
    ├── App.jsx                # Root — state management, view routing
    ├── data/
    │   └── constants.js       # All constants, seed data, pure logic
    └── components/
        ├── ui.jsx             # Design tokens + shared atoms
        ├── AuthScreens.jsx    # Company code + employee login
        ├── ProspectPortal.jsx # Prospect self-serve portal + application form
        ├── ApplicationModals.jsx # Send application modal + staff review
        ├── Layout.jsx         # TopNav, Scoreboard, Sidebar, FullMenu
        ├── Dashboard.jsx      # Dashboard, Workspace, Applications panel
        ├── Pipeline.jsx       # Pipeline matrix, Roster
        ├── Tasks.jsx          # Task management
        ├── History.jsx        # History/Notes, Reports
        ├── NewEntry.jsx       # New holding entry form
        └── TalentRecord.jsx   # 10-tab talent record modal
```

## Working with Claude Code

This repo includes a `CLAUDE.md` with full architectural context, common task recipes, and environment variable guidance for Claude Code to use when making changes.

```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Run in the project directory
claude
```

## Email Configuration

Application invitations use EmailJS. In demo mode the email call gracefully fails with a fallback message. To enable real email delivery:

1. Create a free account at [emailjs.com](https://emailjs.com)
2. Create a service and an email template
3. Set environment variables in `.env`:

```
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

4. Update `SendApplicationModal` in `src/components/ApplicationModals.jsx` to use `import.meta.env.VITE_EMAILJS_*`

## License

Private — Nzinga Talent Group internal use only.
