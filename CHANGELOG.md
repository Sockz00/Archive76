# Archive76 Changelog

All notable changes to Archive76 are recorded in this file.

## 2026-09-01 — M2 stabilization

### Fixed
- `vite.config.ts`: replaced `__dirname` (CommonJS-only) with `fileURLToPath(new URL(...))` to fix ESLint `no-undef` error in ESM context
- `queries.rs`: swapped LIMIT/OFFSET parameter order in `list_catalogue_items` — the SQL is `LIMIT ? OFFSET ?` but the code was binding offset first, causing `LIMIT 0` to silently return empty pages
- `queries.rs`: seed data now uses valid UUID strings (matching the `uuid::Uuid` parsing in `get_catalogue_item`) and sets `retired_at` on the retired seed item so the `retired_at IS NULL` filter actually excludes it
- `queries.rs`: corrected `list_trackable_only` test expectation — retired items are excluded by the `retired_at IS NULL` filter, not the trackability flag
- `CataloguePage.tsx`: fixed TanStack Query v5 `useInfiniteQuery` generic signature and data access patterns
- `invoke.ts`: added missing `TrackabilityStatus` and `AvailabilityStatus` imports; fixed type coercion for validated responses
- `FilterBar.tsx`: fixed `React.ChangeEvent<HTMLSelect>` → `React.ChangeEvent<HTMLSelectElement>`
- `SearchBar.tsx`: replaced `NodeJS.Timeout` (requires `@types/node`) with `ReturnType<typeof setTimeout>`
- `CatalogueGrid.tsx`: removed unused `ItemKind` import

### Added
- `ARCHITECTURE.md` — authoritative architecture document describing the Tauri 2 + React + Rust + SQLite/FTS5 stack, command surface, data flow, and performance design
- `README.md` — rewritten to reflect current M2 state, stack, repository layout, and development workflow

### Verification
- 27 Rust unit/integration tests pass (db, schema, queries, FTS5 triggers)
- Frontend: `tsc --noEmit` clean, ESLint clean, Vite production build succeeds
- Rust: `cargo fmt --check` clean, `cargo clippy -- -D warnings` clean

## 2026-08-31 — M2 foundation

- Tauri 2 + React + TypeScript + Rust scaffold committed
- SQLite schema with FTS5, migrations, sync triggers
- Domain model with `CatalogueItem`, `Player`, status enums
- Initial query layer with pagination and search
- GitHub Actions CI (Rust + Frontend jobs)
- `PERFORMANCE.md` with benchmark environment and methodology

## 2026-00-00 — M1 (historical)

- Original .NET 10 + Avalonia + EF Core implementation (now removed from disk)
