# AptoHire University portal

AptoHire University is the placement-cell portal for the AptoHire platform. It shows roster activity, verified skills, placements and aggregate skills demand for one university. This is an independent Vite app. It does not import from the other four portals.

This project is a prototype. **All people, universities and organizations in mock mode are fictional sample data.** The app never needs a privileged Supabase key.

## 1. How this project fits

AptoHire has five independent websites that use one shared Supabase database:

| Website | Project | Local port |
|---|---|---:|
| aptohire.com | Root portal | 5173 |
| student.aptohire.com | Student portal | 5174 |
| **university.aptohire.com** | **This project** | **5175** |
| organization.aptohire.com | Organization portal | 5176 |
| admin.aptohire.com | Admin portal | 5177 |

The database project owns its schema, access policies, seed data and Edge Functions. This app only consumes it using the signed-in staff member’s JWT and the public anon/publishable key. Database policies remain the security boundary.

## 2. Folder tour

```text
aptohire-university/
├── frontend/                 Vite + React + TypeScript browser app
│   ├── src/app/               Providers, routes, auth and university gates
│   ├── src/components/        UI primitives and responsive shell
│   ├── src/pages/             Public auth and university portal pages
│   ├── src/features/          Query hooks
│   ├── src/lib/               CSV, scoring and Supabase client
│   └── public/samples/        Fictional CSV examples
├── backend/                  Browser-side Backend interface and adapters
│   ├── src/mock/               In-memory fictional demo implementation
│   └── src/supabase/           User-scoped Supabase implementation
├── docs/                      Plan and backend contract notes
├── e2e/                       Playwright browser checks
└── vercel.json                University project headers and SPA rewrite
```

`backend/` is **not** a separate API server. It is a small browser-safe adapter package used by `frontend/`. It must never contain a privileged server key. Components use `BackendProvider`; only the Supabase adapter talks to Supabase.

## 3. Prerequisites and setup

1. Install Node.js LTS (Node 20.19+ recommended) and Git.
2. From this folder, install packages:

   ```bash
   npm install
   ```

3. Copy the sample settings into Vite’s folder:

   ```bash
   cp .env.example frontend/.env.local
   ```

   On Windows PowerShell, use `Copy-Item .env.example frontend/.env.local`.

4. Keep `VITE_USE_MOCKS=true`. Start the app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:5175/login`. Choose one of the fictional demo accounts. Any non-empty password works in mock mode.

Mock mode makes no network calls. Demo state is held in the tab’s session storage and the in-memory backend.

## 4. Demo accounts

- `tpo@unia.edu.test` — Aravalli Institute of Technology, approved, rich sample data.
- `tpo@unib.edu.test` — Bluehaven College of Engineering, approved, smaller sample.
- `tpo@unic.edu.test` — Cedarfield University, pending application `AH-7K2Q9F`.

In the Cedarfield account, open **Account & security** and choose **Simulate admin approval** to see the approval state change. This is a demo-only control.

## 5. Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start on port 5175 |
| `npm run build` | Type-check, build, and run static security checks |
| `npm run preview` | Preview the built app on port 4175 |
| `npm run typecheck` | Type-check both workspaces |
| `npm run lint` | ESLint both workspaces |
| `npm run test` | Run Vitest unit tests |
| `npm run e2e` | Run Playwright browser tests |
| `npm run db:types` | Generate Supabase types after configuring a project ref |

## 6. Roster CSV tips

Use a UTF-8 `.csv` file, not `.xlsx`. The canonical fields are:

```csv
full_name,email,student_id_number,program,program_level,year,status
Jaya Demo,jaya@unia.edu.test,AU2026-001,Computer Science,ug,1,enrolled
```

Name is required. Each student should have an email or student ID so AptoHire can match them when they sign up. Year must be 1–10. Program level is `ug` or `pg`. Status accepts `incoming`, `enrolled`, `dropout` or `alumni` (common equivalents are normalized). The roster import Edge Function accepts at most 500 rows per import. Columns you do not map are removed in the browser before import.

- Deliberately messy validation sample: `frontend/public/samples/roster-sample.csv`.
- Clean sample: `frontend/public/samples/roster-sample-clean.csv`.

Student IDs are sent only to the roster import function over TLS; the app does not select or write a readable student ID after import.

## 7. Connect the shared Supabase project

The authoritative shared contract and frozen prompt contract are included in `docs/CONTRACT.md` and `docs/FROZEN-CONTRACTS.md`; the University-specific request schemas are in `docs/schemas/`. These are the source of truth for browser adapter requests and responses.

1. In `frontend/.env.local`, set `VITE_USE_MOCKS=false`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.
2. Keep the anon/publishable key public and rely on tested RLS. **Never put a service-role key or any privileged secret in this app.**
3. Run `npm run db:types` after setting `SUPABASE_PROJECT_REF` in your shell.
4. Before using live data, verify the optional views and columns listed in the shared contract against the selected backend deployment. Missing views should remain hidden rather than broadening access.

In Supabase, open **Authentication → URL Configuration** and allow:

- `https://university.aptohire.com/**`
- `http://localhost:5175/**`

Sessions are separate from the other subdomains. The storage key is `aptohire-university`.

## 8. Deploy as its own Vercel project

Create a separate Vercel project for this folder/repository and attach `university.aptohire.com`. Do not combine its source with another portal. Use the repository root as the project root, `npm run build` as the build command, and `frontend/dist` as the output directory. Add the `VITE_*` settings in Vercel. For a real production build, set `VITE_APP_ENV=production`, set `VITE_USE_MOCKS=false`, set `VITE_DEMO_MODE=false`, and leave `VITE_DEMO_PASSWORD` empty.

Review the current Vercel plan terms for your intended deployment model.

## 9. Common problems

| Problem | What to check |
|---|---|
| White page | Check for a misspelled setting in `frontend/.env.local`, then restart Vite. |
| “This account can’t use the university site” | Sign in with a university staff account. Other roles are intentionally blocked here. |
| No university is linked | Apply on aptohire.com, then sign up with the address used on the application. |
| Roster rejected | Save as UTF-8 CSV, check file size and row limits, and review the row report. |
| Supabase permission error | Confirm the signed-in account and shared database policies; do not weaken RLS. |
| Supabase project paused | Restore the project in the Supabase dashboard. |
| Port 5175 is busy | Stop the other local process; this dev server uses `--strictPort`. |

## 10. Copy, colors and privacy

- Page copy lives in `frontend/src/pages/` and feature copy is near its feature.
- Design tokens and global layout live in `frontend/src/styles/tokens.css` and `globals.css`.
- Query hooks live in `frontend/src/features/`; data mapping belongs in `backend/src/supabase/`.
- No page compares universities or exposes student identities in unmatched-demand views.

## 11. Glossary

- **Roster:** the university’s AptoHire affiliation list; it does not edit university master records.
- **Registered:** a student has claimed their AptoHire account.
- **Verified via roster:** the affiliation is linked to a row on this university’s roster.
- **Cohort:** a filtered year, program and lifecycle-status group.
- **Unmatched demand:** job-skill counts and reason totals without student identities.
- **Placement:** Placed, Not placed or Unknown. Unknown is not a negative outcome.
- **RLS:** database rules that decide which rows the signed-in user may access.
- **Mock mode:** local in-memory sample data with no backend network calls.

This browser app never needs a service-role key.
