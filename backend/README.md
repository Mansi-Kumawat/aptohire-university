# University backend package boundary

This package is the **browser-side data access boundary**, not a private application server. It implements the `Backend` interface for the mock and Supabase modes. The Vite frontend consumes the package through `BackendProvider`; feature components never import Supabase or call `fetch`.

The real adapter uses only the signed-in staff member's Supabase client and relies on the shared database's RLS and Edge Functions. It never contains a privileged server key and must not be deployed as a server. Exact view/column mappings must be checked against `docs/CONTRACT.md` from the shared backend before production wiring.
