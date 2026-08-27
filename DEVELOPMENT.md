# Archive76 Development Record

**Last updated:** 27 August 2026 (AWST)  
**Current milestone:** M0 — Research and architecture **complete**  
**Repository status:** Documentation-only baseline. No .NET solution, production database, GUI, importer, cache, tests, or application source has been created.

## Completed work

- Inspected repository: Git is initialised on `main`, remote is `https://github.com/Sockz00/Archive76.git`, and the only committed file was `.gitignore` from the initial setup.
- Researched available Fallout 76 C.A.M.P., plan, mod, identifier, pricing, data-dump and model/image candidates.
- Evaluated Avalonia, WinUI 3, WPF, .NET MAUI and WinForms for a Windows-local desktop application.
- Chosen architecture baseline: C#/.NET 10 LTS, Avalonia 12.x (latest compatible stable at implementation), MVVM, EF Core/SQLite, clean application boundaries, pluggable source adapters and filesystem image cache.
- Created `AGENTS.md`, `PROJECT_SPEC.md`, this record, and `README.md`.

## Active work

None. M0 deliberately stops before solution/database/UI/importer implementation.

## Architectural decisions

| ID | Decision | Rationale / consequence |
| --- | --- | --- |
| AD-001 | Use .NET 10 LTS as the production runtime target. | Active LTS support through 14 Nov 2028 at this review date. Pin/update dependencies deliberately. |
| AD-002 | Use Avalonia rather than prematurely selecting WinUI 3. | Archive76 does not require Windows App SDK features. Avalonia reduces deployment dependencies and preserves future portability. Validate its Windows UX/performance before M2; WPF/WinUI remain documented fallbacks. |
| AD-003 | Use SQLite with EF Core, and parameterised raw SQL only behind infrastructure for FTS/bulk/staging. | Local-first, single-user/personal use fits SQLite. EF migrations need explicit SQLite-upgrade tests and backup/recovery handling. |
| AD-004 | Model a plan, a C.A.M.P. buildable item, an equipment piece and a modification as related but distinct concepts. | One plan can unlock multiple build items; modifications apply to multiple pieces. Avoids irreversible simplification. |
| AD-005 | Keep player state in player-scoped tables only. | A shared catalogue cannot contain personal collection/favourite/note fields. |
| AD-006 | Keep plan ownership/knowledge, mod knowledge, loose-mod possession and current applicability independent. | Required game mechanics are not yet fully verified; forcing equivalence would create false progress. |
| AD-007 | No third-party source is enabled for automatic import at M0. | Public availability is not evidence of permission, stable API, cache rights or redistribution rights. |
| AD-008 | Store image bytes in a local filesystem cache and image metadata in SQLite. | Avoids database BLOB growth and keeps catalogue logic source-agnostic. |

## Known issues / constraints

- `.gitignore` initially lacked .NET `bin/` and `obj/` entries; it is corrected in this documentation change.
- The repository is intentionally implementation-free. Build/test commands do not yet exist.
- Data source licensing/terms and completion semantics are blockers for any real catalogue seed/importer, not reasons to scrape first.
- “Two people” does not specify whether they use one PC or two. Local-first does not imply synchronisation.

## Unresolved questions

See the authoritative list in [PROJECT_SPEC.md](PROJECT_SPEC.md#15-unresolved-questions). The immediate blockers are:

1. approved source permissions/licensing/caching basis;
2. completion denominator and meaning of “collected”; and
3. single-machine versus multi-machine usage.

## Next recommended tasks

1. Answer/document the three immediate blockers above.
2. Create source approval and field-mapping records for one legally acceptable seed source.
3. Start M1: create the solution/layer projects, package management, migration/test harness and CI build only.
4. Add a tiny curated provenance-rich test fixture; test real SQLite schema, player isolation and search before UI construction.
5. Implement one C.A.M.P. vertical slice; do not add bulk external ingestion until controlled validation/promotion is tested.

## Change log

| Date | Change |
| --- | --- |
| 2026-08-27 | Created research/architecture documentation baseline; no production code created. |
