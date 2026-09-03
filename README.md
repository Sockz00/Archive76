# Archive76 (WORK IN PROGRESS)

Archive76 is a local-first Windows desktop application for cataloguing Fallout 76 C.A.M.P. plans, weapon & armor mods, and legendary mods. 

Each computer has an independent installation and local database; one installation supports multiple local characters/profiles, but installations never synchronise. It keeps the local shared catalogue separate from each character/profile's collection state, favourites, notes, and settings.

After obtaining catalogue data and images, Archive76 works offline. It periodically checks catalogue sources (initially about weekly) and provides a manual **Check for Updates** action; those operations never upload personal data.

## Stack

Tauri 2 / React 19 / TypeScript / Vite 6 / Rust / SQLite (FTS5) / TanStack Query / TanStack Virtual / Zustand

## Current status (M2)

The M2 performance-first architecture is in place and verified end-to-end:

- Tauri 2 native shell with Rust backend (`src-tauri/`)
- React 19 + TypeScript + Vite 6 frontend (`src/`)
- SQLite schema with FTS5 full-text search, sync triggers, and migrations
- Paginated catalogue listing, search, and item detail Tauri commands
- 27 passing Rust unit/integration tests (db, schema, queries, FTS5 triggers)
- Type-safe Tauri invoke bridge with runtime validation
- TanStack Query for async data caching, TanStack Virtual for grid virtualization
- Zustand for UI filter/search state
- ESLint + clippy clean, `tsc --noEmit` clean, production build succeeds

## Repository layout

```
Archive76/
├── src/                      # React + TypeScript frontend
│   ├── components/           # SearchBar, FilterBar, CatalogueGrid, CataloguePage
│   ├── lib/
│   │   ├── hooks/            # TanStack Query hooks (useCatalogueList, useCatalogueSearch, …)
│   │   ├── providers/        # QueryProvider
│   │   ├── store/            # Zustand UI state
│   │   └── tauri/            # Tauri invoke bridge + types
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                # Rust + Tauri backend
│   └── src/
│       ├── lib.rs            # Tauri command surface
│       ├── db.rs             # SQLite connection management + tests
│       ├── schema.rs         # Schema + migrations
│       ├── models.rs         # Domain types (CatalogueItem, enums)
│       └── queries.rs        # Catalogue query layer + tests
├── .github/workflows/ci.yml  # GitHub Actions CI
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Development

```bash
# Frontend dev server (browser)
npm run dev

# Full Tauri dev (native shell)
npm run tauri:dev

# Type-check, lint, build
npm run type-check
npm run lint
npm run build

# Rust tests (from src-tauri/)
cargo test
```

## Data model

- `players` — local characters/profiles
- `catalogue_items` — the shared reference catalogue (plans, weapon mods, armour mods)
- `player_collection` — per-player collection/knowledge state (joins players ↔ catalogue_items)
- `catalogue_items_fts` — FTS5 virtual table over (name, source), kept in sync via triggers

See `DEVELOPMENT.md` for the full development record, architecture decisions, and performance requirements.
