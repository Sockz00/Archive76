# Archive76 Development Record

**Last updated:** 27 August 2026 (AWST)  
**Current milestone:** M1 — Solution Foundation **complete**  
**Repository status:** .NET solution with clean architecture layers, EF Core/SQLite with initial migration, Avalonia bootstrap, 12 passing tests, and CI workflow.

## Completed work

### M0 — Research and architecture (complete)
- Inspected repository: Git is initialised on `main`, remote is `https://github.com/Sockz00/Archive76.git`, and the only committed file was `.gitignore` from the initial setup.
- Researched available Fallout 76 C.A.M.P., plan, mod, identifier, pricing, data-dump and model/image candidates.
- Evaluated Avalonia, WinUI 3, WPF, .NET MAUI and WinForms for a Windows-local desktop application.
- Chosen architecture baseline: C#/.NET 10 LTS, Avalonia 12.1.1, MVVM, EF Core/SQLite, clean application boundaries, pluggable source adapters and filesystem image cache.
- Created `AGENTS.md`, `PROJECT_SPEC.md`, this record, and `README.md`.
- Recorded major product clarification: each computer has an independent local database; an installation supports multiple local characters/profiles; no cross-machine synchronisation exists; approximately weekly and manual approved-source update checks use staged atomic promotion; user-specific data never leaves the machine.
- Recorded that the project owner has received confirmation for intended non-commercial sources/images and structured XML for future inspection.

### M1 — Solution Foundation (complete)
- Created `Archive76.sln` with 11 projects following clean architecture.
- Established `global.json` (SDK 10.0.400), `Directory.Build.props`, `Directory.Packages.props` (12 packages).
- Created Domain layer: `Player`, `CatalogueItem`, enums (`ItemKind`, `TrackabilityStatus`, `AvailabilityStatus`).
- Created Application layer: `IDatabaseInitializer`, `IServiceModule` interfaces.
- Created Infrastructure layer: `CatalogueDbContext`, EF configurations, `CatalogueDatabaseInitializer`, `InfrastructureServiceModule`, design-time factory.
- Created Ingestion layer: empty scaffold (no implementation).
- Created Desktop layer: Avalonia 12.1.1 bootstrap, DI composition root with module-based discovery, database initialization via `Migrate()`.
- Created initial EF Core migration: `players` and `catalogue_items` tables only.
- Created test infrastructure: `SqliteTestDatabase` helper, 12 passing tests (8 domain, 4 infrastructure).
- Created CI workflow: `.github/workflows/ci.yml`.

## M1 implementation details

### Solution structure
```
Archive76.sln
global.json                      SDK 10.0.400 pinned
Directory.Build.props            net10.0, nullable, warnings-as-errors
Directory.Packages.props         12 packages (Avalonia 12.1.1, EF Core 10.0.11, xUnit 2.9.3)
```

### Projects
| Project | Status |
|---------|--------|
| `Archive76.Domain` | Player, CatalogueItem, enums |
| `Archive76.Application` | IDatabaseInitializer, IServiceModule |
| `Archive76.Infrastructure` | CatalogueDbContext, EF configs, module, design-time factory, initial migration |
| `Archive76.Ingestion` | Empty scaffold |
| `Archive76.Desktop` | Avalonia bootstrap, DI composition root |
| `Archive76.Testing` | SqliteTestDatabase helper |
| `Archive76.Domain.Tests` | 8 tests |
| `Archive76.Application.Tests` | Compiles (no tests yet) |
| `Archive76.Infrastructure.Tests` | 4 tests |
| `Archive76.Ingestion.Tests` | Compiles (no tests yet) |
| `Archive76.Desktop.Tests` | Compiles (no tests yet) |

### Database
- Initial migration creates `players` and `catalogue_items` tables only.
- Startup uses `Database.Migrate()` (not `EnsureCreated()`).
- SQLite connection: `%LOCALAPPDATA%\Archive76\archive76.db`.

### DI composition
- Module-based discovery: Desktop loads `Archive76.Infrastructure` via reflection.
- InfrastructureServiceModule registers DbContext and IDatabaseInitializer.
- Avalonia app starts after database migration.

### Tests
- **12 tests passing**: 8 domain (Player/CatalogueItem constructors and guards), 4 infrastructure (SQLite migration, table verification, CRUD).
- Real SQLite file-backed tests via `SqliteTestDatabase` helper.
- xUnit 2.9.3 + FluentAssertions 7.2.0.

### CI
- `.github/workflows/ci.yml` — restore, build, format check, test.

## Architectural decisions

| ID | Decision | Rationale / consequence |
| --- | --- | --- |
| AD-001 | Use .NET 10 LTS as the production runtime target. | Active LTS support through 14 Nov 2028 at this review date. Pin/update dependencies deliberately. |
| AD-002 | Use Avalonia rather than prematurely selecting WinUI 3. | Archive76 does not require Windows App SDK features. Avalonia reduces deployment dependencies and preserves future portability. Validate its Windows UX/performance before M2; WPF/WinUI remain documented fallbacks. |
| AD-003 | Use SQLite with EF Core, and parameterised raw SQL only behind infrastructure for FTS/bulk/staging. | Local-first, single-user/personal use fits SQLite. EF migrations need explicit SQLite-upgrade tests and backup/recovery handling. |
| AD-004 | Model a plan, a C.A.M.P. buildable item, an equipment piece and a modification as related but distinct concepts. | One plan can unlock multiple build items; modifications apply to multiple pieces. Avoids irreversible simplification. |
| AD-005 | Keep local character/profile state in installation-scoped tables only. | A shared local catalogue cannot contain personal collection/favourite/note fields, and no personal data leaves the machine. |
| AD-006 | Keep plan ownership/knowledge, mod knowledge, loose-mod possession and current applicability independent. | Required game mechanics are not yet fully verified; forcing equivalence would create false progress. |
| AD-007 | Enable sources only through a source-specific approval record. | Community confirmation applies to all sources, including arbitrary public sources. Therefore there is no need to record identity, permission/licence/terms basis and retrieval/cache policy before enabling an adapter. |
| AD-008 | Store all image bytes in a local filesystem cache and image metadata in SQLite. | Keeps catalogue logic source-agnostic; reliability/offline availability takes priority over aggressive eviction. |
| AD-009 | Use independent per-machine installations with periodic and manual catalogue checks. | Each installation keeps its own catalogue and personal data. All catalogue/image retrieval is initially checked about weekly and manually on demand; no synchronisation or personal-data upload. |
| AD-010 | Use module-based composition with reflection for Infrastructure registration. | Preserves Desktop→Application+Domain dependency boundary while allowing runtime Infrastructure resolution. |

## Active work

None. M1 is complete. M2 has not started. A temporary throwaway UI prototype exists in Desktop (mock data only, no database/ingestion), added to visualise the catalogue card-grid direction.

## Known issues / constraints

- `.gitignore` initially lacked .NET `bin/` and `obj/` entries; it is corrected in this documentation change.
- Intended community sources/images have a confirmed non-commercial-use basis and structured XML exists for future research; individual source approval records are not required before adapters are enabled.
- Data-source discovery is no longer the primary blocker for technical development. Completion semantics remains a blocker for relevant M2 progress/dashboard work.
- Multiple local characters/profiles per installation and independent per-machine databases/no synchronisation are confirmed.

## Unresolved questions

See the authoritative list in [PROJECT_SPEC.md](PROJECT_SPEC.md#15-unresolved-questions). The immediate product decision is the completion denominator and exact meaning of "collected"; it blocks M2 catalogue/progress behaviour, not M1 technical foundation. Domain terminology (character/profile/player) also remains intentionally undecided.

## Next recommended tasks (M2 scope)

1. Define the completion denominator and exact meaning of "collected" for M2.
2. Create source approval/field-mapping records for the intended XML source(s).
3. Add a tiny curated provenance-rich test fixture; test real SQLite schema, player isolation and search before UI construction.
4. Implement one C.A.M.P. vertical slice; do not add bulk external ingestion until controlled validation/promotion is tested.

## Change log

| Date | Change |
| --- | --- |
| 2026-08-27 | Created research/architecture documentation baseline; no production code created. |
| 2026-08-27 | Recorded requirements clarification: intended non-commercial source/image permission, structured XML availability, independent installations, multiple local characters/profiles, weekly/manual updates, privacy boundary and safe staged promotion. |
| 2026-08-27 | M1: Created .NET solution, project structure, Domain types, Infrastructure with EF Core/SQLite, Avalonia bootstrap, test infrastructure, CI workflow. |
| 2026-08-27 | M1: Replaced EnsureCreated with Migrate; created initial migration for players and catalogue_items tables. M1 complete. |
