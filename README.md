# CareerPilot AI

AI Job Search, Matching & Application Assistant — plus **ScholarshipPilot** (Erasmus Mundus).

A human-in-the-loop career + scholarship intelligence agent. It discovers opportunities,
calculates a transparent match score, prepares tailored applications, and requires explicit
user approval before any submission.

> **Safety first.** CareerPilot never fabricates candidate information, never bypasses
> CAPTCHA/MFA/anti-bot controls, never auto-submits without explicit authorization, and keeps a
> full audit trail. It prioritizes official sources and stays human-controlled at final submission.

---

## 1. Architecture

Monorepo (npm workspaces):

```
careerpilot-ai/
├── apps/
│   ├── api          # Fastify + TypeScript REST API
│   └── web          # Next.js 14 (App Router) + Tailwind CSS
├── packages/
│   ├── shared       # Domain types, enums, matching + eligibility engines (pure, tested)
│   ├── database     # Prisma schema, client singleton, seed
│   ├── matching     # Transparent job matching engine + hard-requirement override
│   ├── ai           # AIProvider abstraction (heuristic + openai-compatible)
│   └── job-sources  # Pluggable JobSource interface, registry, normalizer, dedupe, demo source
└── prisma/          # (inside packages/database) schema + migrations
```

- **Backend:** Fastify 5, TypeScript
- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Database:** Prisma ORM — **SQLite for local dev** (no external DB needed); **PostgreSQL for production**
- **Auth:** JWT (via `@fastify/jwt`) + bcrypt password hashing
- **AI provider:** abstraction planned; current default is a deterministic "heuristic" engine
  (offline, no API key) so scoring/letters work without a key.

## 2. Requirements

- Node.js ≥ 20 (tested on v24)
- npm ≥ 10

## 3. Installation

```bash
cd careerpilot-ai
npm install
```

npm ≥ 11 may require approving install scripts for Prisma/esbuild:

```bash
npm approve-scripts @prisma/client prisma @prisma/engines esbuild
```

## 4. Environment variables

Copy the template and fill values:

```bash
cp .env.example packages/database/.env
```

Key variables (see `.env.example` for the full list):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | `file:./dev.db` (SQLite) or a Postgres URL |
| `PORT` | API port (default 4000) |
| `JWT_SECRET` | Signing secret for auth tokens |
| `NEXT_PUBLIC_API_URL` | Web → API base URL (default `http://localhost:4000`) |
| `AI_PROVIDER` | `heuristic` (default, offline) or `openai-compatible` |
| `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` | LLM provider config |
| `REDIS_URL` | Optional — enables BullMQ (not yet implemented) |
| `PLAYWRIGHT_HEADLESS` / `PLAYWRIGHT_USER_DATA_DIR` | Browser automation |
| `N8N_WEBHOOK_URL` | Optional n8n integration |

**Never commit real secrets.** `.env` is gitignored.

## 5. Database setup & migrations

```bash
npm run db:generate          # generate Prisma client
npm run db:migrate           # create + apply migration (dev)
npm run db:seed              # seed user, profile, demo jobs + demo Erasmus programmes
```

For production (PostgreSQL): set `DATABASE_URL` to a Postgres connection string, change
`schema.prisma` `provider` to `"postgresql"`, then `npm run db:migrate:deploy`.

Seed creates a dev user: `tania.akter2373@gmail.com` / `changeme123` (change in production).

> **Live deployment:** the app is deployed as a unified Next.js app (web + `/api/*` route
> handlers) on Vercel with a hosted **Prisma Postgres** database. See the Deployment section.

## 5b. Deployment (Vercel + Postgres)

The Fastify API was migrated to Next.js App Router route handlers (`apps/web/app/api/**`) so the
whole product is a single deployable. The database uses hosted **Prisma Postgres** (provisioned
via the Vercel marketplace).

- Set the Vercel project's **Root Directory** to `apps/web`.
- Environment variables on Vercel: `DATABASE_URL`, `JWT_SECRET`, `AI_PROVIDER` (default
  `heuristic`), `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` (optional).
- `npm install` runs the root `postinstall` (`prisma generate`) automatically.
- Deploy: `vercel deploy --prod --yes`.

## 6. Development

Run API and web in separate terminals:

```bash
npm run dev -w @careerpilot/api     # http://localhost:4000
npm run dev -w @careerpilot/web     # http://localhost:3000
```

Open http://localhost:3000 → redirected to `/dashboard`.

## 7. Testing

```bash
npm run test -w @careerpilot/shared   # matching + eligibility engine unit tests
npm run typecheck -w @careerpilot/api
npm run typecheck -w @careerpilot/web
npm run build -w @careerpilot/web
```

## 8. API overview

- `GET /api/health`
- `POST /api/auth/login`
- `GET/PUT /api/candidate` (auth)
- `GET /api/jobs`, `GET /api/jobs/:id`
- `POST /api/jobs/search` (search sources → normalize → dedupe → score → store)
- `POST /api/jobs/analyze` (AI job-data extraction)
- `POST /api/jobs/:id/cover-letter`, `POST /api/jobs/:id/tailor-cv`, `POST /api/jobs/:id/answers`
- `GET /api/cvs`, `POST /api/cvs`, `PUT /api/cvs/:id`, `DELETE /api/cvs/:id`
- `POST /api/applications/prepare` (CV auto-selection + cover letter + answers + validation)
- `GET /api/applications`, `GET /api/applications/:id`
- `POST /api/applications/:id/approve`, `POST /api/applications/:id/apply`, `PUT /api/applications/:id`
- `GET /api/dashboard`
- `GET /api/scholarships`, `GET /api/scholarships/:id`
- `POST /api/scholarships/search`
- `POST /api/scholarships/:id/analyze` (eligibility + match + priority)
- `POST /api/scholarships/:id/apply`
- `GET /api/scholarship-applications`
- `POST /api/scholarships/:id/motivation-letter`, `POST /api/scholarships/:id/sop`

## 9. Matching & eligibility (transparent, deterministic)

- **Job match:** Role 25% · Experience 20% · Skills 20% · Industry 10% · Location 10% ·
  Education 5% · Salary 5% · Career Growth 5%.
- **Scholarship match:** Academic 20% · Career 20% · Subject 20% · Experience 15% ·
  Eligibility 10% · Language 5% · Leadership 5% · Mobility 5%.
- **Eligibility:** `ELIGIBLE` / `LIKELY_ELIGIBLE` / `UNCERTAIN` / `NOT_ELIGIBLE`. Mandatory
  requirements that cannot be verified yield `UNCERTAIN` — never `ELIGIBLE`.

### Candidate preference rules (configurable)

- **Blocked companies** (`BLOCKED_COMPANIES`): postings from these are always skipped (default
  `nextjobz`).
- **Location:** international jobs (outside Bangladesh) are preferred; locally, **Dhaka** is
  preferred over other cities.

Weights live in `packages/shared` / `packages/matching` and are configurable/auditable.

## 9b. Multi-agent system

CareerPilot AI is organized as six cooperating agents, all backed by real data:

- 💼 **Job Agent** — searches Bdjobs + LinkedIn, scores jobs, prepares applications.
- 🎓 **Scholarship Agent** — searches the official Erasmus Mundus catalogue + government scholarships
  worldwide (UK, Germany, USA, Australia, Japan, China, Korea, Sweden, Netherlands, Canada), checks
  eligibility, and **only surfaces programmes where the candidate is eligible** (with a "view all"
  option). Prepares applications (motivation letter + SOP + document checklist → approve → submit,
  blocked if docs missing).
- 📄 **Document Agent** — CVs, cover letters, SOPs, motivation letters, certificates/transcripts
  (checklists wired to Google Drive).
- 🧠 **Profile Agent** — verified academic + professional profile (jobs + scholarship).
- 📅 **Deadline Agent** — tracks job + scholarship deadlines (`/deadlines`).
- 📊 **Career Intelligence Agent** — strongest-fit analysis, skill gaps, role demand, salary
  ranges (`/analytics`).

## 10. Playwright (browser-assisted applications)

Configured in the opencode `playwright` MCP server with a persistent profile. Permitted flows only:

- navigate, inspect, fill verified fields, upload selected documents, take screenshots.
- **STOP on CAPTCHA → `CAPTCHA_REQUIRED`; STOP on MFA → `MFA_REQUIRED`.**

The browser-assisted application module (Phase 6) is not yet wired into the app; only the
abstraction surface exists. No automation bypasses login, CAPTCHA, or anti-bot controls.

## 11. MCP integration

The app's `akij-performance` MCP and opencode `playwright` / `google` / `mssql` MCP servers are
configured in `opencode.jsonc` (project) and `~/.config/opencode/opencode.jsonc` (global). The
CareerPilot app itself exposes a REST API; MCP tools for job search / matching are planned.

## 12. n8n integration

Optional. `N8N_WEBHOOK_URL` is reserved. Planned workflows: scheduled job/scholarship search →
normalize → AI analysis → score → filter ≥ 80% → store → notify.

## 13. Job source configuration

Sources are stored in the `JobSource` table and are pluggable via a `JobSource` interface
(search / getJobDetails / supportsApplicationAutomation / apply). Included:

- `DemoJobSource` — offline fictional jobs (default, safe for dev/tests).
- `BdjobsSource` — public Bdjobs.com listings, **opt-in** via `ENABLE_BDJOBS=true`.

No connector bypasses CAPTCHA, MFA, login, rate limits, or ToS. Bdjobs renders listings
client-side, so the HTTP connector is best-effort and fails gracefully; the Playwright-assisted
path (Phase 6) is the correct route for JS-rendered listings.

## 14. Automation limitations & safeguards

- Final submission always requires explicit user approval.
- No fabricated qualifications, experience, salary, education, or certifications.
- Missing data → `USER_INPUT_REQUIRED` (never guessed).
- Full audit logging via `AuditLog` table.

## 15. ScholarshipPilot (Erasmus Mundus)

Separate module sharing the candidate profile/education/experience but keeping separate
scholarship preferences, documents, and application tracking.

- **Official source priority:** Erasmus+ → programme website → consortium university → portal.
- **Never state "guaranteed scholarship"** — use "Scholarship available" / "Potentially eligible".
- Deadlines are marked `UNVERIFIED` until confirmed against the official source.
- Motivation letters / SOPs are generated as clearly-labeled drafts with `USER_INPUT_REQUIRED`
  placeholders; never auto-submitted.

## 16. Roadmap (remaining phases)

- Real JS-rendered sources (Bdjobs, LinkedIn public pages, company ATS) — the pluggable
  `JobSource` interface + registry are in place; JS-rendered sites need the Playwright-assisted
  fetch path (Phase 6), not plain HTTP.
- CV tailoring UI + cover-letter endpoints wired to the AI provider (abstraction exists).
- Queue (BullMQ) + scheduler for automated daily search.
- Playwright-assisted application workflows (permitted sources only).
- Document management UI, scholarship calendar, deadline monitoring + notifications.
- Production PostgreSQL + Auth.js upgrade, CSRF hardening, rate limiting.

## 17. Decisions made (documented defaults)

- **SQLite for dev** (no local Postgres/Docker available); Postgres for prod.
- **Fastify** over NestJS (lighter, faster to scaffold).
- **JWT + bcrypt** for auth (Auth.js deferred).
- **Deterministic heuristic** AI default so the system works offline; LLM provider is pluggable.
- **String status fields** (not native Prisma enums) for SQLite/Postgres portability.
