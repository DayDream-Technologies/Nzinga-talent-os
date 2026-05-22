# Nzinga Talent OS

Talent operating system for managing people, roles, and workflows at scale — pipeline matrix, roster, tasks, history, and role-based dashboards.

Built with **Next.js 15** and **React 19**. The UI lives in `components/NzingaTalentOS.jsx` (ported from `NzingaTalentOS_v2.jsx`).

## Prerequisites

- [Node.js](https://nodejs.org/) 18.18 or later

## Getting started

```bash
git clone https://github.com/DayDream-Technologies/Nzinga-talent-os.git
cd Nzinga-talent-os
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo login

Use any demo role on the sign-in screen, or sign in with:

| Role | Email | Password |
|------|-------|----------|
| Scout | jordan@nzinga.co | scout123 |
| Team 1 Lead | marcus@nzinga.co | lead123 |
| Ops Specialist | priya@nzinga.co | ops123 |
| Team 2 Lead | devon@nzinga.co | lead2123 |
| Director | simone@nzinga.co | director123 |
| Success Manager | alexis@nzinga.co | success123 |

Data is stored in memory for this prototype (no backend yet).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |

## Project structure

```
app/                    # Next.js App Router (layout, page, styles)
components/
  NzingaTalentOS.jsx    # Main application (client component)
NzingaTalentOS_v2.jsx   # Original single-file prototype (reference)
```

## License

TBD.
