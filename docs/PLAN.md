# University portal implementation plan

## Routes

Public: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`. Protected: `/` overview, `/students`, `/students/:studentId`, `/roster`, `/roster/import`, `/placements`, `/skills?tab=supply|unmatched|gaps`, `/directory`, `/notifications`, `/account`, `/help`, and a catch-all 404.

## Modules

- **Frontend (`frontend/`)**: Vite + React/TypeScript app, routing, UI, auth and university gates, query hooks, CSV wizard, responsive shell, tests and deployment config.
- **Backend (`backend/`)**: browser-safe `Backend` interface, validated domain types, in-memory fictional seed/mock implementation, and a user-scoped Supabase adapter. This is not a server and owns no migrations or schema.
- **Feature areas**: auth, university, roster, students, analytics, placements, demand, directory, notifications, account and configuration.

## Backend interface

`Backend` groups `auth`, `university`, `students`, `roster`, `analytics`, `placements`, `demand`, `directory`, `notifications`, `config` and `account`. Each implementation lives behind the same provider. Zod schemas validate roster inputs, import reports, students, skills and demand responses. Components consume it only through the provider and TanStack Query hooks.

## Mocked data and runtime assumptions

The default mock provides three fictional universities, generated fictional students, analytics, jobs, placements and notifications. Mock sign-in is session-scoped; no network is needed. Mock analytics and organization entries are labelled **Sample data** in the UI. Supabase mode uses the shared contract copied to `docs/CONTRACT.md` and `docs/FROZEN-CONTRACTS.md`; the user-scoped adapter is aligned to the authorized university views, roster column grants, placement policies, and `roster-import` function. Roster CSV parsing and import reporting are wired to that function. No live Supabase credentials were available for a deployment-level integration test.

## Decisions

Keep a top-level frontend/backend package boundary as requested. The backend folder is a browser adapter, not an API server, because this portal calls Supabase directly with the staff JWT and RLS. Use a single mock role-switchable entry point, use session storage for the local demo session, and use fictional demo data only. See the final build report for deferred requirements.
