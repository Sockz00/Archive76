# Archive76 Development Record

**Last updated:** 31 August 2026 (AWST)
**Current milestone:** M2 — Performance-First Architecture Transition
**Repository:** https://github.com/Sockz00/Archive76
**Development model:** Autonomous-first
**Primary engineering constraint:** Performance

---

## 1. Project Objective

Archive76 is a local-first desktop application for cataloguing Fallout 76 plans, weapon modifications, armour modifications, and related game data.

The primary product objective is to create an application that feels extremely fast and remains responsive as the catalogue grows.

Performance is a core architectural requirement.

Archive76 should provide:

* near-instant catalogue search
* responsive filtering
* smooth catalogue scrolling
* fast plan detail navigation
* efficient image loading
* local-first operation
* reliable offline behaviour
* independent local player/profile state
* robust data ingestion
* reproducible releases

The application must be designed for substantially larger datasets than the initial catalogue.

---

# 2. Development Model

Archive76 is being developed with autonomous AI agents as a primary development mechanism.

The repository itself is the durable source of project state.

Agents are expected to:

* inspect existing implementation before changing it
* maintain documentation
* create and complete granular tasks
* write tests
* benchmark performance
* review implementation
* commit coherent changes
* push successful work
* maintain the changelog
* maintain architectural documentation
* continue development when the existing backlog is exhausted

Human intervention should be limited to decisions that genuinely require information unavailable to the agents.

See `AGENTS.md` for the complete autonomous development contract.

---

# 3. Current Architecture

The target architecture is:

```text
Archive76
│
├── Tauri 2
│   └── Native desktop shell
│
├── React + TypeScript
│   └── User interface
│
├── Vite
│   └── Frontend build/development tooling
│
├── Rust
│   ├── SQLite access
│   ├── filesystem operations
│   ├── image cache
│   ├── ingestion
│   └── background processing
│
└── SQLite
    ├── catalogue
    ├── player/profile state
    ├── metadata
    └── FTS5 search index
```

The exact implementation may evolve as performance measurements and engineering requirements provide better information.

Architecture changes must be documented and justified.

---

# 4. Historical Architecture

The initial architecture was:

* C# / .NET 10 LTS
* Avalonia
* MVVM
* Entity Framework Core
* SQLite
* clean architecture layers
* filesystem image cache

This architecture was implemented through M1.

The project subsequently identified performance and application architecture as higher priorities and decided to transition toward Tauri + React + Rust while retaining SQLite and the local-first data model.

The existing M1 implementation must be treated as historical work, not discarded blindly.

Before replacing existing code, agents must inspect it and preserve useful domain knowledge, tests, schema decisions and research.

---

# 5. Historical Milestones

## M0 — Research and Architecture

**Status: Complete**

Completed:

* repository research
* source/data discovery
* architecture evaluation
* local-first requirements
* catalogue/player separation
* image/cache architecture research
* data-source assessment
* initial project specification
* initial development documentation
* initial agent instructions

The original architecture baseline was C#/.NET + Avalonia + EF Core/SQLite.

Important product decisions established during M0:

* each computer has an independent local database
* one installation supports multiple local characters/profiles
* personal collection state is local
* no cross-machine synchronization
* catalogue updates are periodic/manual
* personal data does not leave the machine
* source data must be validated before entering the catalogue
* source-specific provenance and approval information must be retained

---

## M1 — Solution Foundation

**Status: Complete historically**

The original M1 implementation created:

* `Archive76.sln`
* .NET 10 configuration
* clean architecture project structure
* Domain layer
* Application layer
* Infrastructure layer
* Ingestion scaffold
* Avalonia desktop bootstrap
* EF Core/SQLite database
* initial migration
* SQLite test infrastructure
* 12 passing tests
* GitHub Actions CI

The initial database contained:

* `players`
* `catalogue_items`

The original application used:

```text
%LOCALAPPDATA%\Archive76\archive76.db
```

M1 also established the initial module-based dependency/composition approach.

---

# 6. M2 — Performance-First Architecture Transition

**Status: In progress**

M2 replaces the original Avalonia/.NET UI direction with the target performance-first architecture.

Primary goals:

1. Establish Tauri 2 application shell.
2. Establish React + TypeScript frontend.
3. Establish Rust backend/native layer.
4. Establish SQLite database layer.
5. Establish FTS5 search.
6. Establish high-performance catalogue queries.
7. Establish virtualized catalogue rendering.
8. Establish image caching.
9. Establish benchmark infrastructure.
10. Preserve validated Archive76 domain requirements.
11. Establish automated testing and CI.
12. Establish autonomous development workflow.

M2 should not become a speculative rewrite.

Every architectural change should be justified against the application's actual requirements.

---

# 7. M2 Workstreams

## 7.1 Tauri Foundation

Tasks:

* create Tauri 2 application
* establish Rust backend
* establish React frontend
* establish development/build workflow
* establish application packaging
* establish native filesystem boundaries
* establish Rust ↔ frontend command interface

Acceptance criteria:

* application launches successfully
* production build succeeds
* development workflow is documented
* Rust and React communicate correctly
* no unnecessary runtime dependencies are introduced

---

## 7.2 SQLite Foundation

Tasks:

* establish SQLite schema
* migrate useful validated M1 schema concepts
* implement migrations
* implement database initialization
* establish transaction handling
* establish indexes
* establish backup/recovery strategy
* establish database tests

The database must remain local-first.

No remote database is required for normal application operation.

---

## 7.3 Search

Use SQLite FTS5 where appropriate.

Search requirements:

* local
* fast
* deterministic
* prefix-friendly where appropriate
* capable of handling large datasets
* suitable for interactive searching

Search must not require loading the entire catalogue into React memory.

Search performance must be benchmarked.

---

## 7.4 Catalogue Rendering

Use React for the catalogue interface.

Large catalogue views must use virtualization.

The application must not mount thousands of catalogue cards merely because thousands of records exist.

Target model:

```text
SQLite
  ↓
efficient query
  ↓
small result window
  ↓
virtualized React grid
  ↓
visible cards
```

Catalogue rendering must be benchmarked using realistic dataset sizes.

---

## 7.5 Image System

Establish a local image cache.

The image pipeline should support appropriately sized assets, such as:

```text
thumbnail
medium
full
```

Catalogue grids should use thumbnails.

Detail pages should use appropriately sized images.

Full-resolution assets should only be loaded when necessary.

Image acquisition and processing must not block normal UI interaction.

---

## 7.6 Data Ingestion

Implement the ingestion layer independently of individual sources.

Source adapters should:

1. acquire source data
2. validate source data
3. normalize source data
4. map data to Archive76's canonical model
5. detect duplicates/conflicts
6. record provenance
7. stage changes
8. validate the staged dataset
9. promote changes atomically
10. update indexes/cache where required

External source failures must not corrupt an existing valid catalogue.

---

# 8. Performance Requirements

Performance is a product requirement.

Initial engineering targets:

| Operation              |           Target |
| ---------------------- | ---------------: |
| Warm startup           |          <500 ms |
| Cold startup           |             <1 s |
| Search p95             |           <50 ms |
| Common filtering p95   |           <50 ms |
| Typical UI interaction |           <50 ms |
| Catalogue scrolling    | sustained 60 FPS |
| Catalogue memory usage |          bounded |

These are engineering targets rather than guarantees.

If a target cannot be met, the agent must investigate the actual bottleneck.

Do not weaken a target merely because it is inconvenient.

---

# 9. Performance Methodology

Performance work must follow:

```text
measure
↓
identify bottleneck
↓
change implementation
↓
measure again
↓
compare
↓
document
```

Do not perform speculative optimization without measurement.

Important benchmark categories:

* startup
* SQLite initialization
* search
* filtering
* catalogue loading
* catalogue rendering
* image loading
* cache access
* memory usage
* ingestion
* migration
* large-dataset behaviour

Use realistic datasets.

A benchmark containing only a few hundred records is insufficient to validate a catalogue intended to scale significantly beyond that.

---

# 10. Testing Strategy

Archive76 should maintain multiple levels of testing.

## Unit tests

Test:

* domain behaviour
* parsing
* normalization
* validation
* search logic
* utility functions

## Integration tests

Test:

* SQLite
* migrations
* transactions
* ingestion
* Tauri commands
* cache behaviour

## UI tests

Test:

* catalogue behaviour
* search
* filtering
* navigation
* collection state
* important user workflows

## End-to-end tests

Test critical complete workflows where practical.

## Performance tests

Test realistic datasets and record measurable results.

---

# 11. CI

GitHub Actions should automatically validate changes.

CI should include, where applicable:

```text
Rust formatting
Rust linting
Rust tests
TypeScript type checking
frontend linting
frontend tests
production build
integration tests
database tests
performance regression checks
Tauri packaging
```

The exact pipeline may evolve as the project grows.

A successful local build is not sufficient evidence that a change is production-ready.

---

# 12. Release Pipeline

Releases should be increasingly automated.

Target release pipeline:

```text
implementation
    ↓
tests
    ↓
review
    ↓
build
    ↓
performance validation
    ↓
documentation
    ↓
version update
    ↓
commit
    ↓
tag
    ↓
GitHub Actions
    ↓
Tauri package
    ↓
GitHub Release
```

Do not publish a release when required validation fails.

Release notes should be generated/maintained from actual repository changes.

---

# 13. Documentation

The following documents are authoritative project artifacts:

* `README.md`
* `AGENTS.md`
* `PROJECT_SPEC.md`
* `DEVELOPMENT.md`
* `ARCHITECTURE.md`
* `PERFORMANCE.md`
* `CHANGELOG.md`

Documentation must describe the implementation that actually exists.

Agents must update relevant documentation when architecture or behaviour changes.

Documentation drift is considered a defect.

---

# 14. Architectural Decisions

## AD-001 — Local-first application

Archive76 operates primarily against local data.

Rationale:

* offline availability
* low latency
* privacy
* simple deployment
* predictable performance

---

## AD-002 — SQLite

SQLite remains the primary persistent database.

Rationale:

* local-first requirements
* low operational complexity
* excellent read performance
* transactions
* mature ecosystem
* FTS5 support
* no database server required

---

## AD-003 — React

React is the target UI framework.

Rationale:

* component-based architecture
* mature ecosystem
* strong tooling
* suitable for highly interactive catalogue interfaces
* strong virtualization ecosystem
* efficient incremental UI updates when correctly architected

React itself is not treated as the source of performance.

Application architecture, query efficiency, virtualization, caching and state management are responsible for overall performance.

---

## AD-004 — Tauri

Tauri 2 is the target desktop shell.

Rationale:

* native desktop integration
* Rust backend
* lower overhead than Electron
* suitable for a local-first desktop application
* clear separation between UI and native operations

---

## AD-005 — Rust

Rust is the target native/backend implementation language.

Use Rust where it provides clear architectural or performance benefits.

Potential responsibilities:

* database access
* filesystem operations
* image cache
* ingestion
* normalization
* background processing
* expensive computation

---

## AD-006 — FTS5

SQLite FTS5 is the preferred search mechanism for full-text catalogue search where appropriate.

Rationale:

* local execution
* indexed search
* ranking
* prefix/search capabilities
* avoids transferring the entire catalogue into JavaScript

---

## AD-007 — Virtualized catalogue

Large catalogue views must use virtualization.

Rationale:

Rendering only the visible portion of the catalogue keeps DOM/component count and rendering work bounded as dataset size increases.

---

## AD-008 — Local image cache

Images are stored/cached locally with metadata in SQLite where appropriate.

Rationale:

* offline operation
* lower repeated I/O
* predictable performance
* source independence
* reduced network dependency

---

## AD-009 — Independent player/profile state

Catalogue data and player-specific collection state remain separate.

One installation may contain multiple local characters/profiles.

Personal data remains local to that installation.

---

## AD-010 — Source adapters

External sources must be isolated behind source-specific adapters.

Rationale:

* source independence
* easier validation
* easier replacement
* provenance
* controlled ingestion
* protection against source changes

---

## AD-011 — Autonomous development

The repository is designed to support continuous autonomous development.

Agents should independently:

* identify work
* implement work
* test work
* benchmark work
* document work
* commit work
* push work
* release validated work

See `AGENTS.md`.

---

# 15. Current State

The M2 performance-first architecture is implemented and verified:

- Tauri 2 native shell with Rust backend
- React 19 + TypeScript + Vite 6 frontend
- SQLite schema with FTS5 full-text search, sync triggers, and migrations
- Paginated catalogue listing, search, and item detail Tauri commands
- 27 passing Rust unit/integration tests
- Type-safe Tauri invoke bridge with runtime validation
- TanStack Query for async data, TanStack Virtual for grid virtualization, Zustand for UI state
- ESLint, clippy, `tsc --noEmit`, and production build all clean

The next implementation work should continue the M2 workstreams: image caching, data ingestion, and the complete catalogue vertical slice.

---

# 16. Immediate Next Tasks

Priority order:

1. Audit the existing repository against this document.
2. Audit the existing `.NET/Avalonia` implementation.
3. Determine which domain/schema/test work is reusable.
4. Establish the Tauri 2 + React + TypeScript foundation.
5. Establish the Rust workspace/backend.
6. Establish SQLite and migration strategy.
7. Establish benchmark infrastructure.
8. Establish the initial canonical data model.
9. Implement FTS5 search.
10. Implement the virtualized catalogue.
11. Implement the image cache.
12. Implement the first complete catalogue vertical slice.
13. Establish automated CI.
14. Establish automated release packaging.
15. Continue iterative performance and feature development.

Tasks should be broken into smaller independently verifiable units.

---

# 17. Change Log

| Date       | Change                                                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-26 | Created research/architecture documentation baseline.                                                                                                                      |
| 2026-08-27 | Recorded source/data requirements, local installation model, multiple local profiles, privacy boundary and staged catalogue updates.                                       |
| 2026-08-27 | M1 completed: .NET solution, clean architecture layers, EF Core/SQLite, Avalonia bootstrap, tests and CI.                                                                  |
| 2026-08-27 | Replaced `EnsureCreated` with migrations and created initial SQLite migration.                                                                                             |
| 2026-09-01 | M2 stabilization: fixed `vite.config.ts` ESM lint error, fixed LIMIT/OFFSET parameter order bug in `list_catalogue_items`, fixed seed data (UUID ids + retired_at), fixed test expectations, added missing TS imports and fixed TanStack Query v5 types, fixed `HTMLSelect` → `HTMLSelectElement` and `NodeJS.Timeout` → `ReturnType<typeof setTimeout>` type errors. Added `ARCHITECTURE.md`. Updated `README.md`, `CHANGELOG.md`, and `DEVELOPMENT.md` current state. |
| 2026-08-31 | Archive76 architecture redirected toward performance-first Tauri 2 + React + TypeScript + Rust + SQLite + FTS5 + virtualization architecture. |
| 2026-08-31 | Autonomous-first development model established. `AGENTS.md` updated to define continuous agent development, testing, benchmarking, documentation and release requirements. |
