# Filter — Architecture

## System Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Press Inbox    │────→│   Mailgun    │────→│  Filter API │
│  (Gmail/etc)    │     │  (MX parse)  │     │  (Express)  │
│  auto-forward   │     │  webhook POST│     │  port 3001  │
└─────────────────┘     └──────────────┘     └──────┬──────┘
                                                     │
                              ┌───────────────────────┤
                              │                       │
                        ┌─────▼─────┐          ┌─────▼──────┐
                        │  Haiku    │          │  Supabase  │
                        │ Classify  │          │ PostgreSQL │
                        └─────┬─────┘          │ + Auth     │
                              │                │ + Realtime │
                        ┌─────▼─────┐          └─────┬──────┘
                        │  Sonnet   │                │
                        │  Rank +   │          ┌─────▼──────┐
                        │  Draft    │          │  React     │
                        └─────┬─────┘          │  Dashboard │
                              │                │  (Vite)    │
                        ┌─────▼─────┐          └────────────┘
                        │  Slack    │
                        │  Notify   │
                        └───────────┘
```

## Directory Structure

```
filter/
├── packages/
│   ├── api/                          # Express backend
│   │   ├── src/
│   │   │   ├── app.ts               # Express app, middleware, route mounting
│   │   │   ├── db/
│   │   │   │   └── supabase.ts      # Supabase service client
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts          # JWT verification, user attachment
│   │   │   │   └── adminOnly.ts     # Role check
│   │   │   ├── routes/
│   │   │   │   ├── webhooks.ts      # Mailgun inbound POST
│   │   │   │   ├── auth.ts          # Auth callback, /me
│   │   │   │   ├── projects.ts      # CRUD projects
│   │   │   │   ├── triage.ts        # Triage results + filtering
│   │   │   │   ├── contacts.ts      # Media contacts CRUD
│   │   │   │   ├── content.ts       # Press releases, writing samples, client context
│   │   │   │   ├── analytics.ts     # Sentiment, topics, volume, scores
│   │   │   │   └── admin.ts         # Pipeline logs, prompt versions
│   │   │   ├── services/
│   │   │   │   ├── classifier.ts    # Haiku classification (2500-word prompt)
│   │   │   │   ├── enricher.ts      # Parallel context assembly
│   │   │   │   ├── ranker.ts        # Sonnet ranking + drafting (2500-word prompt)
│   │   │   │   ├── slack.ts         # Block Kit notifications
│   │   │   │   └── contacts.ts      # Auto-discovery from email signatures
│   │   │   └── pipeline/
│   │   │       └── processor.ts     # Orchestrates classify → enrich → rank → publish
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                          # React frontend
│       ├── src/
│       │   ├── App.tsx              # Router + route definitions
│       │   ├── main.tsx             # Entry point
│       │   ├── globals.css          # Tailwind base + theme vars
│       │   ├── lib/
│       │   │   ├── supabase.ts      # Supabase anon client
│       │   │   └── utils.ts         # cn() utility
│       │   ├── hooks/
│       │   │   ├── useAuth.ts       # Supabase auth state + profile
│       │   │   ├── useProject.ts    # Project list + switcher
│       │   │   └── useTriageRealtime.ts  # Realtime subscription
│       │   ├── pages/
│       │   │   ├── Login.tsx        # Magic link auth
│       │   │   ├── Filter.tsx       # Main triage dashboard
│       │   │   ├── Relationships.tsx # Media contacts table
│       │   │   ├── CompanyContext.tsx # Briefing, press releases, samples
│       │   │   ├── Analytics.tsx     # Charts (sentiment, topics, volume, scores)
│       │   │   ├── Setup.tsx         # Project creation wizard
│       │   │   ├── Prompts.tsx       # Admin: prompt editor + history
│       │   │   ├── PipelineMonitor.tsx # Admin: processing status
│       │   │   └── SystemConfig.tsx  # Admin: team management
│       │   └── components/
│       │       ├── layout/
│       │       │   ├── AppShell.tsx       # Auth wrapper + nav
│       │       │   ├── TopNav.tsx         # Fixed header with nav tabs
│       │       │   └── ProjectSwitcher.tsx # Dropdown project selector
│       │       ├── triage/
│       │       │   ├── TriageTable.tsx    # TanStack Table implementation
│       │       │   ├── DetailPanel.tsx    # Slide-out email detail
│       │       │   ├── ScoreBadge.tsx     # Colour-coded score circle
│       │       │   ├── FlagChips.tsx      # Flag pill badges
│       │       │   └── DraftReplyEditor.tsx # Editable draft + copy/mailto
│       │       └── shared/
│       │           ├── ExportButton.tsx   # CSV export
│       │           └── ColumnToggle.tsx   # TanStack column visibility
│       ├── index.html
│       ├── tailwind.config.ts
│       ├── vite.config.ts
│       └── package.json
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql    # 17 tables, indexes
│       └── 002_rls_policies.sql      # RLS + helper functions
│
├── .github/workflows/
│   └── deploy.yml                    # CI: lint + build
│
├── .env.example
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── render.yaml                       # Render deployment (API + static)
├── CLAUDE.md                         # Development guide
├── ARCHITECTURE.md                   # This file
├── README.md
└── package.json                      # Workspaces root
```

## Email Pipeline

### Flow

```
1. INGEST
   Mailgun POST → verify HMAC-SHA256 signature
   → match recipient to project.receiving_address
   → insert into emails (status: ingested)
   → trigger processEmail() async

2. CLASSIFY (Haiku 4.5)
   Input: subject + body + sender + sensitive_topics
   Output: category, sender_type, outlet, topics, deadline,
           sentiment, summary, contact extraction, confidence
   → insert triage_results with classification
   → auto-discover contact if new sender
   → if spam/auto_reply/newsletter → mark filtered, STOP

3. ENRICH (parallel Supabase queries)
   → media_contacts (sender profile, tier, relationship)
   → interaction_history (last 5)
   → press_releases (topic-matched)
   → writing_samples (2-3 best)
   → project client_context + config
   → assemble context packet

4. RANK + DRAFT (Sonnet 4.6)
   Input: email + classification + full context packet
   Output: impact/urgency/risk scores, composite,
           recommended action, reasoning, talking points,
           draft reply with tone calibration, flags
   → sensitive topic → force escalation flag
   → update triage_results with ranking

5. PUBLISH
   → email status → published
   → Supabase Realtime pushes to dashboard
   → if score ≥ threshold → Slack channel notification
   → if auto_assign rules match → assign + Slack DM
```

### Error Handling

Each step wrapped in try/catch. On failure:

- Log to pipeline_logs with error_message and duration_ms
- Set email status to 'error' with error_message
- Pipeline stops at the failed step

## Database Schema

### Core Tables

| Table           | Purpose                  | Key Columns                                        |
| --------------- | ------------------------ | -------------------------------------------------- |
| organizations   | Top-level tenant         | name, slug                                         |
| users           | Auth profiles            | email, role, org_id                                |
| projects        | Press inbox config       | receiving_address, client_context, scoring_weights |
| project_members | RBAC per project         | user_id, project_id, role                          |
| emails          | Raw inbound emails       | from_address, subject, body_text, status           |
| triage_results  | Classification + ranking | composite_score, flags, draft_reply_body           |

### Supporting Tables

| Table               | Purpose                            |
| ------------------- | ---------------------------------- |
| media_contacts      | Journalist/contact database        |
| interaction_history | Contact interaction log            |
| press_releases      | Client announcements (for context) |
| writing_samples     | Tone calibration examples          |
| prompt_versions     | Versioned Haiku/Sonnet prompts     |
| saved_views         | User's custom filter configs       |
| pipeline_logs       | Per-step processing telemetry      |

### Row Level Security

- Every project-scoped table has RLS enabled
- `is_project_member(project_id)` — checks project_members for auth.uid()
- `is_admin()` — checks users.role for auth.uid()
- Both implemented as SECURITY DEFINER functions for performance

### Realtime

`triage_results` and `emails` added to `supabase_realtime` publication.
Frontend subscribes via `supabase.channel()` filtered by project_id.

## API Routes

### Public

| Method | Path                          | Description           |
| ------ | ----------------------------- | --------------------- |
| POST   | /api/webhooks/mailgun/inbound | Mailgun inbound email |
| GET    | /api/health                   | Health check          |

### Authenticated (requireAuth)

| Method         | Path                               | Description                       |
| -------------- | ---------------------------------- | --------------------------------- |
| POST           | /api/auth/callback                 | Exchange token, upsert profile    |
| GET            | /api/auth/me                       | Current user profile              |
| GET/POST       | /api/projects                      | List/create projects              |
| GET/PATCH      | /api/projects/:id                  | Get/update project                |
| GET            | /api/projects/:pid/triage          | List triage (filterable)          |
| GET/PATCH      | /api/projects/:pid/triage/:id      | Get/update triage                 |
| GET/POST/PATCH | /api/projects/:pid/contacts        | Contact CRUD                      |
| GET/POST       | /api/projects/:pid/press-releases  | Press releases                    |
| GET/POST       | /api/projects/:pid/writing-samples | Writing samples                   |
| PATCH          | /api/projects/:pid/client-context  | Update briefing                   |
| GET            | /api/projects/:pid/analytics/\*    | Sentiment, topics, volume, scores |

### Admin (requireAuth + adminOnly)

| Method  | Path                    | Description     |
| ------- | ----------------------- | --------------- |
| GET     | /api/admin/pipeline     | Pipeline logs   |
| GET/PUT | /api/admin/prompts/:pid | Prompt versions |

## Frontend Architecture

### Auth Flow

1. User visits any route
2. AppShell checks Supabase session via useAuth()
3. No session → redirect to /login
4. Login page: email → Supabase magic link OTP
5. On auth state change → fetch /api/auth/me for profile
6. Profile attached to outlet context for all child routes

### Realtime

useTriageRealtime subscribes to postgres_changes on triage_results.
New rows prepended with `is_new: true` flag → pink left-border highlight → clears after 5s.

### State Management

No global state library. Each page fetches its own data.

- Auth state: useAuth hook (Supabase session + profile)
- Project state: useProject hook (list + localStorage current)
- Triage state: useTriageRealtime hook (Supabase Realtime)
- Everything else: local useState + fetch on mount

## Deployment

### Render (render.yaml)

- **filter-api**: Node web service, builds `packages/api`, starts `dist/app.js`
- **filter-web**: Static site, builds `packages/web`, serves from `dist/`

### CI (GitHub Actions)

- Trigger: push/PR to main
- Steps: checkout → setup Node 20 → npm ci → lint → build

## AI Models

| Service    | Model                      | Purpose                                     | Cost Profile |
| ---------- | -------------------------- | ------------------------------------------- | ------------ |
| Classifier | claude-haiku-4-5-20251001  | Fast classification, ~1s per email          | Low          |
| Ranker     | claude-sonnet-4-6-20250514 | Deep ranking + draft reply, ~3-5s per email | Medium       |

Both prompts are 2000-3000 words with scoring rubrics, edge cases, and few-shot examples.
Located in `packages/api/src/services/classifier.ts` and `ranker.ts`.
