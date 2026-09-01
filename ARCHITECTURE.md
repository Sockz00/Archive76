# Archive76 Architecture

Last updated: 2026-09-01 (AWST)

This document describes the current architecture of Archive76. It is authoritative — if implementation and this document diverge, both are bugs.

## 1. Overview

Archive76 is a local-first desktop application for cataloguing Fallout 76 plans, weapon modifications, and armour modifications. It runs entirely on the user's machine with no server component.

## 2. Technology stack

| Layer | Technology |
| --- | --- |
| Desktop shell | Tauri 2 |
| UI framework | React 19 + TypeScript |
| Build tool | Vite 6 |
| Native backend | Rust 1.98 |
| Database | SQLite (bundled via libsqlite3-sys) |
| Full-text search | SQLite FTS5 |
| Data fetching | TanStack Query 5 |
| Virtualization | TanStack Virtual |
| UI state | Zustand |

## 3. Process architecture

```
┌─────────────────────────────────────────────────┐
│                  Tauri 2 shell                   │
│  ┌─────────────────────────────────────────────┐ │
│  │           React frontend (Vite)             │ │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐  │ │
│  │  │SearchBar │ │FilterBar │ │CatalogueGrid│  │ │
│  │  └──────────┘ └──────────┘ └────────────┘  │ │
│  │  ┌──────────────────────────────────────┐   │ │
│  │  │  TanStack Query + Zustand + Bridge   │   │ │
│  │  └──────────────────────────────────────┘   │ │
│  └──────────────────┬──────────────────────────┘ │
│                     │ invoke                      │
│  ┌──────────────────▼──────────────────────────┐ │
│  │            Rust backend                     │ │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │ │
│  │  │lib.rs   │ │queries.rs│ │db.rs+schema.rs│ │ │
│  │  │(commands)│ │(SQL)     │ │(SQLite)      │ │ │
│  │  └─────────┘ └──────────┘ └──────────────┘ │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 4. Rust backend

### 4.1 Command surface (`lib.rs`)

| Command | Purpose |
| --- | --- |
| `ping` | Health check |
| `database_status` | Return path, schema version, counts |
| `list_catalogue_items` | Paginated, filtered catalogue listing |
| `search_catalogue` | FTS5 full-text search |
| `get_catalogue_item` | Single item detail by UUID |

### 4.2 Database (`db.rs`)

- One connection per invoke (avoids `Send`/`Sync` issues with `rusqlite::Connection`)
- WAL journaling, foreign keys ON, 30s busy timeout
- Migrations applied on every `open()` call (idempotent)

### 4.3 Schema (`schema.rs`)

- `players`, `catalogue_items`, `player_collection`, `catalogue_items_fts`
- FTS5 virtual table with porter + unicode61 tokenizer
- Sync triggers keep FTS in lockstep with DML
- Migration table + `PRAGMA user_version` for versioning

### 4.4 Queries (`queries.rs`)

- `list_catalogue_items` — paginated, optional kind + trackable filters
- `search_catalogue` — FTS5 MATCH with rank ordering
- `get_catalogue_item` — full detail by UUID
- Returns lightweight `CatalogueItemSummary` for lists, full `CatalogueItem` for detail

## 5. Frontend

### 5.1 Tauri bridge (`src/lib/tauri/`)

- `invoke.ts` — typed wrappers around `window.__TAURI__.invoke`
- Runtime validation of every response shape
- `TauriNotAvailableError` for graceful fallback in `vite dev`
- `types.ts` — TypeScript types mirroring Rust serde output

### 5.2 State management

| Concern | Tool |
| --- | --- |
| Server/native data | TanStack Query (caching, pagination, stale-while-revalidate) |
| UI filters/search | Zustand |
| Virtualized rendering | TanStack Virtual |

### 5.3 Components

- `SearchBar` — 150ms debounced input
- `FilterBar` — kind selector + trackable-only toggle
- `CatalogueGrid` — virtualized grid with responsive columns
- `CataloguePage` — browse/search mode toggle, infinite scroll

## 6. Performance design

- Catalogue never loaded entirely into JS memory
- SQLite handles filtering/search (indexes + FTS5)
- Virtualized grid renders only visible rows
- Paginated queries with bounded result sets
- TanStack Query caches pages, avoids redundant invokes

## 7. Data flow

```
User input
  → Zustand store (filter state)
  → TanStack Query key change
  → Tauri invoke (Rust)
  → SQLite query (indexed / FTS5)
  → JSON response
  → Runtime validation
  → React state → virtualized render
```

## 8. See also

- `DEVELOPMENT.md` — full development record
- `PERFORMANCE.md` — benchmark environment and targets
- `AGENTS.md` — autonomous development contract
