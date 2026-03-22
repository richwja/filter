# Filter — Development Guide

## CORE DIRECTIVE

**Simple, focused, elegant code ONLY.**

- Fix existing bugs before adding new features
- Remove complexity before refactoring
- Question every abstraction — if it's used once, inline it
- Edit existing files; avoid creating new ones unless structurally necessary
- No "enterprise" features — this is a focused product, not a platform

## Code Standards

### Explicit over Implicit

```typescript
// YES — clear intent, obvious flow
const count = results.length;
if (count === 0) return { data: [], error: 'No results' };

// NO — clever but unreadable
return results?.length ? results : { ...DEFAULT };
```

### File Size Limits

- New files: max 300 lines
- Existing files: don't increase without removing elsewhere
- Functions: max 50 lines
- If a function is too long, it's doing too much

### No Over-Engineering

- No abstractions for one-time operations
- No helpers used in only one place
- No feature flags for hypothetical futures
- Three similar lines > premature abstraction
- No backwards-compatibility shims — just change the code
- Don't add error handling for scenarios that can't happen
- Only validate at system boundaries (user input, external APIs)

### Before Adding Code

1. Can I edit existing code instead?
2. Can I delete code to make room?
3. Is this file already too large?
4. Am I building for a hypothetical future?

### TypeScript

- Strict mode. No `any` without justification.
- Interfaces over types for object shapes
- Use `unknown` over `any` when type is genuinely unknown
- Don't add type annotations where inference works

### Naming

- Descriptive, not abbreviated: `classification` not `cls`
- Boolean vars: `isDeadlineDriven`, `hasError` — reads as English
- Functions: verb phrases. `classifyEmail`, `buildTriageNotification`

## Stack Quick Reference

| Layer             | Technology                               |
| ----------------- | ---------------------------------------- |
| Frontend          | React 18 + Vite + TypeScript             |
| Styling           | Tailwind CSS (light theme, pink accents) |
| Components        | shadcn/ui (Radix primitives)             |
| Tables            | TanStack Table                           |
| Charts            | Recharts                                 |
| Icons             | Lucide React                             |
| Backend           | Express + TypeScript                     |
| Database          | Supabase (PostgreSQL + Auth + Realtime)  |
| AI Classification | Anthropic Haiku 4.5                      |
| AI Ranking        | Anthropic Sonnet 4.6                     |
| Email Ingestion   | Mailgun inbound webhooks                 |
| Notifications     | Slack Block Kit                          |
| Hosting           | Render (API service + static site)       |
| Monorepo          | npm workspaces                           |

## Local Development

```bash
# From repo root
npm run dev        # Both API + web concurrently
npm run dev:api    # API only (port 3001)
npm run dev:web    # Web only (port 5173, proxies /api → 3001)
```

Env files: `.env` at root (API vars), `packages/web/.env.local` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

## Branch Strategy

- `main` = production (auto-deploys via Render)
- Feature branches → PR → merge to main
- No staging branch yet — add when needed

## Design System — Non-Negotiable

These rules come from the Milltown Measure design language. Do not deviate.

### Colours

- **Page background:** `bg-gray-100` (#f3f4f6)
- **Cards:** `bg-white` with `border-gray-200`
- **Nav/header:** `bg-white border-gray-200`
- **Primary CTA:** `bg-pink-600` (#db2777), hover `bg-pink-700`
- **Active state:** `text-pink-600`, active tab bg `bg-pink-50`
- **Text:** `text-gray-900` headings, `text-gray-700` body, `text-gray-500` muted
- **Sentiment:** teal (#0f766e), amethyst (#6d5bae), ruby (#9f1239)

### Typography

- **Font:** Geist (loaded via Google Fonts CDN)
- **Headings:** `tracking-heading` (-0.02em), `font-semibold`
- **Body:** `tracking-body` (-0.01em)
- **Buttons:** `font-medium` (NEVER `font-bold`)

### Components

- **Cards:** `rounded-xl` (never `rounded-lg`), `border border-gray-200`
- **Buttons:** `font-medium transition-colors`, consistent padding
- **Inputs:** `bg-white border-gray-300 focus:border-pink-600 focus:outline-none`
- **Icons:** Lucide only. `h-4 w-4` (small), `h-5 w-5` (standard)

### Anti-Patterns — DO NOT USE

- No gradient backgrounds
- No uppercase text or `tracking-wide`
- No `border-2` or `border-4` (only 1px border)
- No `font-bold` on buttons
- No `rounded-lg` on cards
- No generic AI aesthetics (purple gradients, Inter font, cookie-cutter layouts)

## Architecture at a Glance

### Pipeline (per email)

```
Mailgun webhook → Store email → Haiku classifies → Filter spam
  → Enrich (parallel Supabase lookups) → Sonnet ranks + drafts reply
  → Publish to Realtime → Slack notification if high score
```

### Multi-tenancy

Everything scoped to a **project**. A project = one press inbox for one client.

```
Organization (Milltown Partners)
  └── Project (e.g. "Joby Aviation")
       ├── receiving_address, slack_channel, media_sheet
       ├── client_context (strategic briefing for Sonnet)
       ├── scoring_weights, sensitive_topics
       └── team members with roles
```

### Roles

- **User:** sees their projects. Filter Inbox, Relationships, Analytics, Settings (General, Context, Team).
- **Admin:** everything users see + Settings > Prompts.

## Prompt Engineering

The classifier (Haiku) and ranker (Sonnet) prompts are the core intelligence. They are NOT throwaway templates. Each should be:

- 2000-3000 words with detailed scoring rubrics
- Edge case handling for ambiguous emails
- Few-shot examples showing ideal output
- Client-context injection points clearly marked
- These prompts are the product. Treat changes with care.

Files: `packages/api/src/services/classifier.ts`, `packages/api/src/services/ranker.ts`

## Security Rules

- All secrets in env vars, never in code
- `.gitignore` covers `.env`, `.env.*`, `*.pem`, `*.key`
- Supabase anon key (frontend, safe with RLS) vs service key (backend only)
- RLS on every project-scoped table
- Mailgun webhook signature verification (HMAC-SHA256)
- No hardcoded API keys, tokens, or credentials anywhere

## Key File Paths

### API

- `packages/api/src/app.ts` — Express app, route mounting
- `packages/api/src/pipeline/processor.ts` — Full email pipeline orchestration
- `packages/api/src/services/classifier.ts` — Haiku classification + prompt
- `packages/api/src/services/ranker.ts` — Sonnet ranking + prompt
- `packages/api/src/services/enricher.ts` — Context assembly
- `packages/api/src/routes/webhooks.ts` — Mailgun inbound endpoint

### Web

- `packages/web/src/App.tsx` — Router + route definitions
- `packages/web/src/components/layout/AppShell.tsx` — Authenticated layout wrapper + SetupWizard trigger
- `packages/web/src/pages/Filter.tsx` — Main triage dashboard
- `packages/web/src/pages/Settings.tsx` — Settings layout shell (sidebar + outlet)
- `packages/web/src/pages/settings/` — SettingsGeneral, SettingsContext, SettingsTeam, SettingsPrompts
- `packages/web/src/hooks/useTriageRealtime.ts` — Supabase Realtime subscription
- `packages/web/tailwind.config.ts` — Theme (colours, fonts, spacing)

### Database

- `supabase/migrations/001_initial_schema.sql` — Full schema (17 tables)
- `supabase/migrations/002_rls_policies.sql` — Row Level Security

## For AI Assistants

**REQUIRED:**

- Read the ENTIRE error before fixing
- Test fixes before claiming success
- Update this file when changing architecture
- Simplify existing code before adding features
- Follow the design system exactly — check the anti-patterns list

**PROHIBITED:**

- Adding complexity without justification
- Creating abstractions used in only one place
- Making "enterprise" features or over-configurable systems
- Creating new files when editing existing ones works
- Adding comments to code you didn't change
- Adding docstrings or type annotations beyond what's needed
- Using any font other than Geist
- Using any colour not in the design system
