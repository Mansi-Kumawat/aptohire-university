# AptoHire University Portal — Integration & Production-Readiness Guide for IDE AI

**Purpose:** Give an IDE coding assistant (Cursor, Claude Code, Copilot, etc.) a safe, staged plan to audit and finish this University portal, connect it to the AptoHire portals you have already created, and wire it to the shared backend without inventing a database contract.

**Important:** This repository is a prototype. Do not connect real student data or call it production-ready until all release gates in this guide pass. Use fictional/sample data for development and demos.

---

## 1. Current state: what is here and what remains

### Present in this repository

- `frontend/`: Vite + React + TypeScript University portal, routes, auth screens, university dashboards, roster workflows, charts, UI, and configuration.
- `backend/`: a browser-safe TypeScript adapter package, with an in-memory mock implementation and a Supabase client adapter. **This is not a separately deployable API server and contains no database migrations.**
- `docs/PLAN.md`: implementation map and known assumptions.
- `docs/CONTRACT.md`: explicitly says the authoritative shared-backend contract has **not yet been supplied**.
- `e2e/`, frontend unit tests, Playwright and accessibility checks, lint/typecheck/build scripts, a Vercel SPA rewrite and security headers.
- `.env.example` files default to fictional mock mode.

### Blocking work before a real-backend connection

1. Obtain the actual shared AptoHire backend repository/project and its current, authoritative `CONTRACT.md` (or equivalent schema/API specification). The portal's placeholder `docs/CONTRACT.md` is not an API contract.
2. Compare every Supabase table, view, column, Edge Function, auth role, and RLS policy used by `backend/src/supabase/backend.ts` to that contract. Change the adapter only after this comparison; do not guess names or loosen access rules.
3. Other portal repositories/projects are not included in this University repository, so their current domains, environment variables, auth flows and backend compatibility have not been verified here. They already exist: **audit and connect them; do not regenerate or replace them.**
4. The final restored checkpoint has not been re-built after cleanup. Reinstall dependencies and run the quality checks below before relying on any prior build result.
5. No live Supabase project, production secrets, DNS, Vercel project configuration, backup/restore proof, monitoring, or production end-to-end test is verified by this file.

### Supabase objects the current University adapter expects (unverified)

The adapter currently references the following. Treat this as an **inventory to reconcile**, not an approved contract:

- Tables: `profiles`, `university_members`, `universities`, `roster_entries`, `placements`, `notifications`, `public_config`.
- Views: `university_students_v`, `university_student_skills_v`, `university_overview_v`, `university_funnel_v`, `university_skills_v`, `university_trends_v`, `university_demand_v`, `public_organizations`, `public_jobs`.
- Edge Functions: `complete-signup`, `roster-import`.

Check the exact selected columns, argument/payload shapes, ownership scoping, returned data, and failure behavior against the real backend contract and its tests. If an object or field does not exist, document it as blocked/optional; do not make a broader query to get around it.

### University-specific gaps to verify against requirements

- Real-mode behavior for sign-up/approval, roster imports/updates/removals, analytics, placements, notifications and public directories against the real database and signed-in roles.
- RLS and Edge Function authorization tests proving a university can access **only its own students**; unmatched-demand views show aggregate counts only and no student identity.
- Production configuration and hosting for the University portal, plus validated links to the other existing portal URLs.
- Tests that prove error, empty, loading, small-screen, keyboard, screen-reader, and privacy behavior with realistic backend responses—not only mock data.
- Institution-specific data governance: permitted roster fields, collection purpose, consent/notices, retention, deletion, incident response and approved data location/processor terms. Get the appropriate privacy/security/legal review before processing real people’s data.

The separate student portal owns student digital resumes/downloads; do not claim that feature is complete based on this University repository. The Master Runbook's demo workflow and the full product feature list span several other projects.

---

## 2. Source files provided with the AptoHire project

In this workspace, the user-uploaded source material is in `/home/user/uploads/`:

- `MASTER-RUNBOOK.md` — overall system layout, build/run order, local demo, deployment and final definition of done.
- `prd.md` — goals, scope, personas, flows and product-level requirements.
- `features.md` — feature IDs, priorities and acceptance criteria.
- `architecture.md` — portals, shared backend, data model and security boundaries.
- `Security.md` — security audit and required controls.
- `Responsiveness.md` — responsive behavior and breakpoint checks.
- `design.md` — visual system and interaction guidance.
- `agent.md` — AI agent contracts and safety requirements.
- `README.md` — human setup and operating overview.
- `Logo.jpeg` — supplied brand artwork.

The existing portal already has logo assets in `frontend/public/`. Preserve the supplied artwork and wordmark exactly; do not redraw, approximate, replace or recolor the logo. If the IDE runs on a different machine and `/home/user/uploads/` is unavailable, attach these files to its context or copy them into a project reference folder such as `docs/source/` before asking it to audit.

### Source-of-truth precedence

1. Security/privacy requirements and the authoritative shared backend contract govern implementation.
2. The user's uploaded `MASTER-RUNBOOK.md` governs the multi-project sequence and release checklist.
3. `prd.md`, `features.md`, `architecture.md`, `Security.md`, `Responsiveness.md`, `design.md`, and `agent.md` define requirements in their respective areas.
4. Existing repository code and this guide describe the current University portal state, not proof that a requirement is already satisfied.
5. If sources conflict, stop and report the conflict; do not silently pick a schema or reduce a security rule.

---

## 3. How the five portals should connect

AptoHire's intended layout is **five separately hosted websites plus one shared backend**:

| Portal | Intended production URL | Local development port |
|---|---|---:|
| Root / marketing & verification | `https://aptohire.com` | 5173 |
| Student | `https://student.aptohire.com` | 5174 |
| University (this repository) | `https://university.aptohire.com` | 5175 |
| Organization | `https://organization.aptohire.com` | 5176 |
| Admin | `https://admin.aptohire.com` | 5177 |

Since you have already created the other portals:

1. Keep their existing repositories and deployments. First record each repository path, branch, deployed URL, Vercel project, current mock/real mode, and backend contract version.
2. Keep each portal's UI/source independent. Do **not** import components from one portal into another or merge projects just to share data.
3. Have each portal call the same approved Supabase project/backend using its own browser-safe adapter and the user's authenticated session. The shared database's RLS and server functions—not hidden buttons or frontend role checks—must enforce access.
4. Configure each portal's cross-links to the correct real URL in its own environment. This portal uses `VITE_ROOT_URL`, `VITE_STUDENT_URL`, and `VITE_ORGANIZATION_URL`; production values must be HTTPS URLs. It intentionally does not advertise the admin portal.
5. Add every real portal URL (and exact local callback URLs needed for development) to Supabase Auth's redirect allow-list. Configure the backend Edge Function `ALLOWED_ORIGINS` with only the approved portal origins, if required by the actual backend implementation.
6. Confirm that every portal uses the same Supabase project URL and public anon/publishable key for the same environment (local, staging, or production). Never accidentally point one portal at production while another uses staging.
7. Run the cross-portal flow tests: a student consents to a scoped organization request; organization identity reveal happens only after consent; university sees only its own students and aggregate demand; admin-only actions stay admin-only.

**Session behavior:** the supplied Master Runbook specifies separate sign-in sessions per portal. Browser storage is isolated by hostname, so a user signed into one subdomain should not be assumed to be signed into another. Treat cross-portal navigation as a link and let the destination handle its own login unless a separately reviewed SSO design is adopted. Never put access/refresh tokens in query strings, copy tokens between apps, or weaken RLS to make navigation feel seamless.

**The backend is not a sixth frontend portal.** In this repository, `backend/` is a browser-side adapter library. The shared Supabase project/repository described by the runbook is separate and is not present here.

---

## 4. Safe backend connection steps

Do these steps in a **local or staging** environment first.

1. **Get the backend contract.** Ask the backend owner for the latest contract and test instructions. Place its copy at `docs/CONTRACT.md` for this portal. Record the source commit/version and date. The current placeholder must not be used to wire production.
2. **Inventory and map.** Compare the adapter inventory in section 1 to the contract: table/view/function names, columns, input and output schemas, role claims, RLS scope, errors and privacy classifications. Produce a mapping table in `docs/backend-integration-audit.md` with `MATCH / MISMATCH / MISSING / NOT TESTED` per item.
3. **Generate client types** only against the correct local/staging Supabase project, following the backend owner's process. This repo's `npm run db:types` script requires `SUPABASE_PROJECT_REF`; do not commit secrets or point it at an unapproved project.
4. **Configure local environment.** From the repo root:

   ```bash
   npm ci
   cp .env.example frontend/.env.local
   ```

   Keep the default `VITE_USE_MOCKS=true` for offline UI work. For local/staging real mode only, set these in `frontend/.env.local`:

   ```dotenv
   VITE_APP_ENV=local
   VITE_DEMO_MODE=true
   VITE_USE_MOCKS=false
   VITE_SITE_URL=http://localhost:5175
   VITE_ROOT_URL=http://localhost:5173
   VITE_ROOT_DOMAIN=localhost
   VITE_STUDENT_URL=http://localhost:5174
   VITE_ORGANIZATION_URL=http://localhost:5176
   VITE_SUPABASE_URL=<local-or-staging-project-url>
   VITE_SUPABASE_ANON_KEY=<public-anon-or-publishable-key>
   VITE_DEMO_PASSWORD=<fictional-demo-only-password-or-empty-if-not-used>
   ```

   Use the **public anon/publishable key only** in a Vite `VITE_*` variable. Vite variables are included in browser assets. Never put a Supabase `service_role` key, database password, AI provider secret, signing secret, pepper, or other privileged credential in this frontend repository or any `VITE_*` variable.
5. **Check authorization before UI wiring.** Test each RLS policy and Edge Function with allowed and forbidden roles, including two different fictional universities. A request denied by RLS is not a reason to disable RLS or widen a view.
6. **Wire only the adapter.** After the contract audit, update `backend/src/supabase/backend.ts` and validation types as needed. Keep components calling the `Backend` interface. Keep server-only behavior in the shared backend/Edge Functions, never in browser code.
7. **Test each flow in real mode** with fictional accounts/data. Check browser network responses and logs for accidental identities, student IDs, secrets, or excess fields. Verify roster imports are validated and authorized server-side, not merely in the browser.
8. **Keep mock and real modes separate.** Use explicit `.env.local` files and restart Vite after changing env. Do not seed sample data into a live production database.

---

## 5. Step-by-step instructions for the IDE AI tool

### Before starting

- Open the existing `aptohire-university/` repository as the workspace. Open the other existing portal/backend repositories separately only when needed.
- Ensure you have a clean Git commit/branch and a recoverable backup. Never allow the AI to deploy or make destructive remote database changes.
- Make the uploaded references in section 2 available to the IDE.
- Ask the IDE to report before modifying files. Work in small phases, review the diff, run checks, and commit each accepted phase.

### Master instruction to paste into the IDE AI

> You are working on the existing AptoHire University portal, not creating a new portal. Read `PRODUCTION-READINESS-IDE-GUIDE.md`, `README.md`, `docs/PLAN.md`, `docs/CONTRACT.md`, and all supplied AptoHire product/security references before making changes. The University portal must remain in `frontend/`, with its browser-safe adapter in `backend/`. Preserve the current supplied AptoHire logo/wordmark exactly. Use fictional data only. Do not expose another university's student identities in any student, skills or unmatched-demand view. Never expose a service-role key or server secret. Never weaken RLS, MFA, consent, validation or security headers to make a test pass. Do not rebuild or replace the other portals; they already exist. Do not invent backend tables, columns, functions or API contracts: the real shared backend contract must be supplied and reconciled first. Do not run `db push`, migrations against a remote database, `functions deploy`, secret-setting commands, production data resets, DNS changes or Vercel production deployment. Do not read or print secret values. Work one phase at a time; first report findings and blockers, then wait for approval before edits. At the end of each phase report changed files, checks run and results, unresolved risks, and the exact next step.

### Phase 0 — Audit only (no edits)

Prompt:

> Audit the current University portal against this guide and all available AptoHire references. Do not edit files. Confirm the repository layout, commands, test coverage, current mock/real switch, auth flow, Supabase adapter object inventory, routes, privacy-sensitive views, Vercel configuration, and known TODOs. Produce `docs/PRODUCTION_AUDIT.md` with a checklist marked `PASS / PARTIAL / FAIL / BLOCKED / NOT TESTED`, evidence paths, and proposed phases. Clearly mark the shared backend contract as blocked if it is still only the placeholder. Do not claim the build passes unless you run it from this checkpoint. Stop and ask me to review the audit.

Review the audit; confirm actual backend and other portal locations. Do not ask AI to assume these exist in the current workspace.

### Phase 1 — Reproducible local baseline

Prompt:

> After approval, install from the committed lockfile using `npm ci`. Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`; run `npm run e2e` if Playwright browsers are available. Fix only reproducible University-portal defects without changing product/security scope. Add or repair tests for every fix. Do not connect production services. Report command output summaries and any browser/dependency limitation. Stop for review.

### Phase 2 — Backend contract and cross-portal map (blocked until supplied)

Prompt:

> Use the actual shared backend contract and the existing portal/backend repositories I provide. Do not infer from the placeholder contract. Create `docs/backend-integration-audit.md` mapping every current adapter object, field, function payload, auth role and RLS requirement to the real contract and its tests. Also create a portal matrix with each existing portal's repo, URL, environment, Supabase project, auth redirect and cross-link settings. Do not edit adapter logic until every mismatch has an approved resolution. Mark unknowns BLOCKED and stop for my review.

### Phase 3 — Contract-aligned adapter

Prompt:

> After I approve the mapping, update only the University portal's adapter/types/tests to match the authoritative backend contract. Keep all UI data calls behind the existing `Backend` interface. Add contract-aligned tests for success, empty, permission denied, malformed response, timeout/error and per-university isolation. Do not modify backend migrations or remote policies from this portal repository. Do not relax privacy or RLS. Stop for review.

### Phase 4 — Connect the existing portals

Prompt:

> Do not recreate any portal. Check the existing root, student, university, organization and admin app settings against the approved portal matrix. Make cross-links use environment-based HTTPS URLs in deployed builds and correct localhost URLs in development. Verify auth redirect allow-lists and Edge Function origin configuration are documented, but do not change remote dashboard settings. Test that every portal uses the same intended Supabase environment and contract version. Preserve separate login sessions unless I approve a separate SSO design. Add cross-portal navigation/integration tests where repositories are available. Stop for review.

### Phase 5 — Security/privacy test pass

Prompt:

> Test the supplied Security.md acceptance criteria and the authoritative database contract. Add automated authorization/privacy tests for two fictional universities, student, organization and admin roles. Verify no cross-university identities or student-level rows leak through unmatched-demand analytics; organization identities remain hidden until explicit scoped consent; admin review is blind as specified; roster CSV data is minimized and processed server-side; no privileged keys are present in source, browser output, logs or committed files. Do not use real student data. Do not weaken any policy to make tests pass. Report any backend-only prerequisite as BLOCKED. Stop for review.

### Phase 6 — Production engineering

Prompt:

> Implement only locally testable production improvements approved in the audit: CI checks, pinned supported Node version, dependency/security review, accessible errors/loading states, safe logging, security-header review, environment validation, and deployment documentation. Preserve the existing Vercel SPA routing. Validate CSP against actual needed Supabase auth, database, storage and realtime origins; never broadly allow arbitrary origins. Add/verify tests. Do not add analytics or error-reporting services that transmit personal data without my approval. Do not deploy. Stop for review.

### Phase 7 — Staging release and end-to-end demo

Prompt:

> Prepare a staging-only release checklist using the supplied backend runbook and exact project settings. Verify all portals' staging environment variables, auth URLs, CORS/allowed origins, storage limits/policies, and demo seed separation. Run automated checks and the complete consent-first cross-portal demo using fictional data. Verify both allowed and denied access paths and reset/re-run the demo. Do not run remote migrations/deploy commands; give me manual steps to execute and record evidence. Stop for review.

### Phase 8 — Production launch decision

Prompt:

> Evaluate the completed release evidence against the Definition of Done and production gates in this guide and the Master Runbook. Produce a go/no-go report. Any missing authoritative contract, failing security test, untested RLS policy, unresolved privacy review, missing rollback/restore proof, or dependency vulnerability with no risk decision is NO-GO. Do not deploy. List exactly what I must do manually and which evidence remains missing.

---

## 6. Quality gates for this repository

From `/home/user/aptohire-university/` (or the repository root in your IDE):

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run e2e
```

The root scripts use the workspace setup. `npm run e2e` may require Playwright browser installation; follow the existing Playwright configuration if needed. If a check fails, fix the cause and rerun it—do not mark a skipped test as passed.

Manual University-portal checks:

- Mock mode works without internet and clearly labels sample data.
- Test at 360/375/390/768/1024/1440 px; no horizontal page overflow; controls remain usable.
- Keyboard navigation and visible focus work; reduced-motion preference is respected; serious/critical accessibility issues are fixed.
- University staff can only access their institution's records; pending/rejected university access is appropriately restricted.
- Student names, contact details, student IDs, files and cross-university data do not leak through unmatched-demand or aggregate analytics.
- Empty, loading, network failure, permission denied and malformed response states are safe and understandable.
- No secrets, real people's data, or privileged keys appear in built JavaScript, source maps, logs, screenshots or commits.

---

## 7. Production environment and deployment checklist

The University repository's documented Vercel setup is a workspace monorepo deployment:

- Vercel project root: repository root `.` (not `frontend/`, because the frontend depends on the workspace `backend/` package).
- Install: `npm ci`
- Build: `npm run build`
- Output: `frontend/dist`
- SPA rewrites and security headers: `vercel.json`.

For **staging**, configure Vercel Environment Variables for Preview/Production as appropriate; for a real production release this portal requires at least:

```dotenv
VITE_APP_ENV=production
VITE_DEMO_MODE=false
VITE_USE_MOCKS=false
VITE_SITE_URL=https://university.aptohire.com
VITE_ROOT_URL=https://aptohire.com
VITE_ROOT_DOMAIN=aptohire.com
VITE_STUDENT_URL=https://student.aptohire.com
VITE_ORGANIZATION_URL=https://organization.aptohire.com
VITE_SUPABASE_URL=<approved-production-project-url>
VITE_SUPABASE_ANON_KEY=<approved-public-anon-or-publishable-key>
VITE_DEMO_PASSWORD=
```

Use the exact environment and variable set required by the current source and backend contract. `VITE_*` values are public, even if entered in a dashboard. Never set a secret as a frontend variable. Build a separate staging Supabase/Vercel environment; keep mock/demo data out of production.

Before launch, the owner must manually verify (AI must not perform remote changes):

- Production Supabase project, correct region and access controls; email sender, password/reset flows, MFA for admins, approved redirect URLs and secure auth settings.
- Production database schema/migrations have been reviewed and tested in staging; RLS enabled on every relevant table/view; Edge Functions validate JWT/role/input/rate limits and reject unauthorized origins.
- Storage buckets are private where appropriate; upload type sniffing, size limits, authorization, malware-scanning decision, signed URL expiry and deletion behavior are tested.
- Secrets are stored only in the backend provider's secret store and rotated from any prior exposure; service-role credentials never reach portals.
- All five domains use HTTPS and the portal URLs/redirects/callbacks/CORS match exactly. No wildcard origin unless the security owner explicitly approves it.
- The current `vercel.json` CSP is checked against the production Supabase project URL and any required storage/realtime endpoints. Keep a restrictive policy; test authentication, uploads and realtime under it. Keep `X-Robots-Tag: noindex` only if that remains the intended indexing policy.
- Backup retention, scheduled backup/export and a **tested restore** are in place; rollback to the prior app release is documented.
- Monitoring/alerting and an incident process are ready. Logs avoid passwords, tokens, student identifiers and unnecessary personal data.
- Privacy notices, consent, retention/deletion, support contact, data processor terms and legal/security review are completed for the real deployment and its intended users.
- The full demo/acceptance flow has passed in staging twice, including reset and privacy checks. Use the Master Runbook's Definition of Done; don't seed fictional demo accounts into production.

The project owner—not the IDE AI—executes production migrations, secret configuration, function deployment, DNS changes and Vercel production promotion after reviewing the staging evidence and backup/rollback plan.

---

## 8. Release gates (go/no-go)

**Do not call this production-ready until all are true:**

- [ ] Current authoritative backend contract is in the repository and every adapter mapping has been reconciled.
- [ ] All intended existing portals are inventoried and use the right backend/environment, domains, callbacks and cross-links.
- [ ] `npm ci`, typecheck, lint, unit tests, build and E2E pass on the exact release commit; CI repeats them.
- [ ] RLS/Edge Function/storage policies have automated allow-and-deny tests, including cross-university isolation and consent expiry/withdrawal where relevant.
- [ ] Required cross-portal consent/reveal and university aggregate-only flows pass end to end with fictional staging data.
- [ ] No service role key or server secret is exposed; dependency and security findings have documented, accepted resolutions.
- [ ] Accessibility, responsive, privacy, security headers, error states and data-minimization checks pass.
- [ ] Backup restore, rollback, monitoring, incident handling, privacy/retention and operating ownership are documented and tested/approved.
- [ ] Staging sign-off is recorded; production configuration and manual operator steps have been independently reviewed.

**Current status based on files available in this workspace:** **NOT PRODUCTION READY / BLOCKED** until the shared backend contract and real backend integration/security evidence are supplied and verified. This is a readiness assessment, not a claim that the deployed portals are broken.
