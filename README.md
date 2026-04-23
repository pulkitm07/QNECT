# Qnect 🍽️

> Smart queue management for restaurants — built with React + Vite + Tailwind + Supabase.

## Roles
| Role | Path | Description |
|------|------|-------------|
| Customer | `/customer` | Join the virtual queue, track position in real time |
| Staff | `/staff` | Admit / notify / cancel guests; clock-in/out attendance |
| Delivery | `/delivery` | Check in for pickup, track prep stage, get a token |

## Stack
- **React 18** + **React Router v6**
- **Vite** (dev server & build)
- **Tailwind CSS v3**
- **Supabase** (Postgres + Realtime) — optional, app works with mock state without it

## Quick start

```bash
git clone https://github.com/pulkitm07/QNECT.git
cd QNECT
npm install
npm run dev
```

The app runs fully on local mock state out of the box — no Supabase account needed to explore.

## Connecting Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Copy `.env.example` → `.env` and fill in your project URL and anon key
4. Restart `npm run dev`

## File structure

```
src/
├── App.jsx                  ← role-based router
├── context/
│   └── QueueContext.jsx     ← global state + dispatch
├── views/
│   ├── Landing.jsx          ← 3-way toggle entry portal
│   ├── customer/
│   │   ├── JoinForm.jsx
│   │   └── QueueStatus.jsx
│   ├── staff/
│   │   ├── Dashboard.jsx    ← queue management
│   │   └── Attendance.jsx   ← clock-in/out
│   └── delivery/
│       ├── CheckIn.jsx
│       └── PickupStatus.jsx
├── components/
│   ├── QueueCard.jsx        ← admit / notify / cancel card
│   ├── StepTracker.jsx      ← delivery prep stages
│   ├── StatBar.jsx          ← staff summary numbers
│   └── BackButton.jsx
├── hooks/
│   ├── useQueue.js
│   └── useAttendance.js
└── lib/
    └── supabase.js          ← client + DB helpers
```

## Deploy

```bash
npm run build   # outputs to /dist
```

Push `/dist` to Vercel, Netlify, or any static host. Set the two `VITE_` env vars in your host's dashboard.
