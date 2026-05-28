# Nzinga Talent OS

Enterprise talent management system for Nzinga Talent Group. Manages talent through a 7-stage pipeline with role-based access control, a self-serve prospect application portal, file uploads, document management, and automated pipeline transitions.

## Tech Stack

- **React 18** + **Vite 6** + **TypeScript**
- **Tailwind CSS 4** (design tokens in `src/index.css` + `tailwind.config.ts`)
- **React Router 7** — URL-based navigation
- **TanStack Query** — server state / caching
- **Supabase** — optional backend (demo mode uses in-memory seed data)
- **Vitest** + **Testing Library** — unit tests

## Getting Started

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:3000
npm run build      # production build → dist/
npm run test       # unit tests
npm run typecheck  # TypeScript
```

## Demo Mode

By default `VITE_DEMO_MODE=true` (or leave Supabase vars unset). All data uses in-memory seed data from `src/constants/seed-data.ts`.

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in `supabase/migrations/001_initial_schema.sql`
3. Optional seed: `supabase/seed.sql`
4. Set in `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DEMO_MODE=false
```

5. Create a `documents` storage bucket (private) for file uploads

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

## Project Structure

```
src/
├── main.tsx                 # App bootstrap + providers
├── router.tsx               # React Router routes + lazy loading
├── components/
│   ├── ui/                  # Tailwind design system atoms
│   ├── auth/                # Login, company code, protected routes
│   ├── layout/              # AppShell, TopNav, Sidebar, Scoreboard
│   ├── dashboard/           # Dashboard, Tasks, History, Reports
│   ├── pipeline/            # Pipeline matrix, Roster
│   ├── talent/              # TalentRecord, NewEntry, tabs/
│   └── application/         # Prospect portal, modals
├── context/                 # AuthContext, AppDataContext
├── hooks/                   # useAuth, useTalents, useApplications, …
├── services/                # Supabase + demo-store data layer
├── types/                   # TypeScript domain types
├── constants/               # Stages, roles, app sections, seed data
└── lib/                     # supabase client, utils, legacy tokens
supabase/migrations/         # Database schema + RLS
.github/workflows/ci.yml     # CI pipeline
```

## License

Private — Nzinga Talent Group internal use only.
