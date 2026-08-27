# Archive76 — Authoritative Project Specification

**Status:** Architecture baseline; no application implementation exists yet.  
**Last reviewed:** 27 August 2026 (AWST)  
**Audience:** maintainers and coding agents.

## 1. Product definition

Archive76 is a personal, local-first Windows desktop application for cataloguing Fallout 76 collection data for two people. Its first releases cover C.A.M.P. plans/buildable items, weapon modifications, and armour modifications.

It is **not** a website or online service. It has no accounts, authentication, web backend, cloud storage, multiplayer, monetisation, or public-deployment requirement. It must remain useful without an internet connection after a catalogue and its selected images have been cached locally.

The shared catalogue is factual/reference data. Each local player has independent collection state, favourites, and notes. The architecture must permit more local players later without changing catalogue tables.

### Product outcomes

- Let a selected player see their collection completion and recent activity quickly.
- Make a large catalogue searchable, filterable, and usable offline.
- Preserve the difference between game objects, unlock mechanisms, acquisition information, and a player's own state.
- Update external data cautiously, with provenance, validation, and safe failure behaviour.

## 2. Scope and milestones

### First functional release

- Local player profiles (initially Ben and Friend, but not hard-coded as a limit).
- Shared C.A.M.P. plan/buildable catalogue with categories, unlock conditions, provenance, identifiers, images, and acquisition information when verified.
- Separate Weapon Mods and Armour Mods navigation/catalogues, including the equipment each modification can apply to.
- Per-player collection/knowledge state, favourites, notes, dashboard statistics, database-side search and filters.
- Offline local SQLite data and an optional, explicit catalogue/image update operation.

### Explicitly out of scope

- Website, REST/GraphQL backend, accounts, authentication, cloud sync, public hosting, real-time multiplayer, automated market trading, or monetisation.
- Inferring a player's in-game inventory or automatically reading game state. Any later game-file/API integration is a separately approved feature.
- Claiming an acquisition route, price, availability, identifier, or game mechanic without recorded source and confidence.

### Milestone sequence

1. **M0 — Research and architecture (complete):** persistent project context and decision baseline.
2. **M1 — Solution foundation:** .NET solution, clean layers, migrations, empty schema, test harness; no live-source import.
3. **M2 — Catalogue foundation:** controlled seed fixture, profiles, plan/buildable browsing, search, collection state, dashboard.
4. **M3 — Modification model:** weapon/armour equipment/modification catalogues and explicitly separate player states.
5. **M4 — Images and controlled import:** image cache, one legally approved adapter, staging, validation and import reporting.
6. **M5 — usability, packaging, backups and release validation.**

No milestone authorises a later milestone merely because a preceding one is complete.

## 3. Functional behaviour

### 3.1 Player profiles and state isolation

The app persists a selected local profile and lets users switch it. A player may have an item marked collected/known while another player has no state or marks it missing. Application services must scope every personal read/write to `player_id` and reject unknown/deactivated players.

The catalogue never stores `is_collected`, `is_favourite`, a personal note, or a player name. “Missing” is normally derived from absence of a qualifying player state, rather than stored as a duplicate Boolean. An explicit `Excluded`/`NotApplicable` state is available where a user removes an item from their own denominator. Dashboard wording must show its denominator.

### 3.2 Dashboard

For the selected player, show database-calculated:

- total trackable catalogue items, collected/known items, missing items and completion percentage;
- C.A.M.P. progress;
- weapon and armour modification progress separately;
- category progress;
- favourites; and
- recently changed/collected items.

Counts must declare scope (for example, “collectible C.A.M.P. plans”), not say merely “all items”. Archived, duplicate, unreleased, unavailable, or personally excluded records must not silently distort completion.

### 3.3 C.A.M.P. plans and buildable items

The C.A.M.P. area is a searchable catalogue of buildable items and their unlocks. A plan and an item it makes available are distinct: one plan can unlock multiple buildable items, while an item can be unlocked by an entitlement, challenge, loot discovery, or other condition. The UI may group by plan but must not assume one plan equals one buildable object.

Show the following where supported by evidence: name, description, category/subcategory, plan/other unlock condition, acquisition methods, locations, vendors, prices, availability, images, external identifiers/Form IDs, source/provenance/confidence, and last-updated information. Users can search, filter, favourite, record appropriate collection/knowledge state, and add notes.

### 3.4 Weapon and armour modifications

Weapon and armour modifications have separate top-level navigation and type-specific fields. The model must represent equipment family/type/piece, modification slot/category, a modification’s many-to-many applicability to equipment pieces, plan/other unlock routes, sources, identifiers and image information.

The following are independent concepts, never automatically equated:

1. a modification exists in the catalogue;
2. a player owns an unlearned plan or other item;
3. a player has learned/knows a modification;
4. a player possesses a loose mod (if tracked); and
5. a player can currently apply it to a specific owned equipment instance.

“Can currently apply” requires equipment-instance context and can be `Unknown`; it must not be presented as an automatic game-state fact.

### 3.5 Offline and update behaviour

The UI reads only local SQLite data and the local image cache. It starts/browses offline. Updates are explicit, cancellable, reported, and isolated from routine UI work. They fetch, parse, stage, validate, diff and promote data atomically. A failed/cancelled/malformed/suspicious update must leave the last valid catalogue usable.

## 4. Production technology decision

### Recommendation

Use **C# / .NET 10 LTS**, **Avalonia 12.x (latest compatible stable version when M1 begins)**, **MVVM with CommunityToolkit.Mvvm**, **Microsoft.Extensions.DependencyInjection/Logging/Configuration**, **EF Core 10 with Microsoft.EntityFrameworkCore.Sqlite**, and **SQLite**. Use typed `HttpClient` adapters behind interfaces; presentation code never calls HTTP.

.NET 10 is supported through 14 November 2028; .NET 8 ends support 10 November 2026. [Microsoft support policy](https://dotnet.microsoft.com/en-us/platform/support/policy).

Avalonia is recommended because Archive76 does not need Windows App SDK-only features. It offers a mature XAML/MVVM desktop model, direct Win32 operation without an additional Windows workload/runtime, straightforward self-contained publication, and a credible future portability option. Avalonia documents Windows support and a .NET 8+ desktop minimum at [Supported platforms](https://docs.avaloniaui.net/docs/supported-platforms). Domain/application layers remain UI-neutral, so this decision is reversible.

| Candidate | Strengths | Costs / decision |
| --- | --- | --- |
| **Avalonia 12.x — recommended** | XAML/MVVM; direct Windows operation; no Windows App SDK deployment; self-contained distribution; potential future portability. | Less native Fluent/Windows-specific control set and Visual Studio designer integration. Validate accessibility, virtualization, image performance and installer behaviour in M1/M2. |
| **WinUI 3 + Windows App SDK** | Microsoft-recommended new Windows UI platform, native Fluent design, current Windows integration and MSIX path. | Adds Windows App SDK runtime/packaging/deployment complexity. Unpackaged apps must manage runtime and lose package-identity capabilities. Choose only if native integration/Store priorities become material. [Deployment guidance](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/unpackage-winui-app). |
| **WPF** | Very stable, Windows-native, extensive ecosystem and mature binding/tooling. | Older visual/control model; requires deliberate modern styling; Windows-only. Viable fallback if Avalonia validation fails. |
| **.NET MAUI** | Microsoft multi-platform framework. | Mobile workload/packaging complexity without a requirement; not justified for this desktop catalogue. |
| **WinForms** | Simple and proven. | Poor fit for a modern image-rich, highly-filtered catalogue. |

Pin NuGet versions centrally after M1 and reassess framework only through a documented architecture decision.

### Data access

EF Core owns mappings, migrations, transactions and routine CRUD. Repositories return explicit query DTOs, not `IQueryable`. Infrastructure may use parameterised SQL for FTS5, bulk staging and performance-critical projections, always behind repository interfaces. Tests use real temporary SQLite databases, not only EF’s in-memory provider.

SQLite/EF migrations need care: SQLite provider migrations may rebuild tables and cannot generate idempotent migration scripts. [Provider limitations](https://learn.microsoft.com/en-us/ef/core/providers/sqlite/limitations). Every migration needs a realistic upgrade fixture plus backup/recovery validation.

## 5. Architecture and dependency rules

```
Avalonia presentation (views, view-models)
                 │ application commands / query DTOs
                 ▼
Application (use cases, policies, interfaces, validation)
                 │ domain abstractions
                 ▼
Domain (entities, value objects, invariants; no UI/SQLite/HTTP)
                 ▲
Infrastructure (SQLite repositories, migrations, cache/filesystem, HTTP)
                 ▲
Ingestion (source adapters → staging → normalisation → validation → promotion)
```

- **Presentation:** navigation, accessibility, view state and commands only; no business rules, `DbContext`, SQL, `HttpClient`, or source parsing.
- **Application:** use cases, ports/interfaces, transaction boundaries, validation orchestration and DTOs.
- **Domain:** vocabulary, value objects, state-transition invariants and calculation policies; no Avalonia/EF/SQLite/HTTP references.
- **Infrastructure:** EF mappings/migrations, SQLite connection policy, repositories, filesystem cache, clock, logging, typed HTTP implementation.
- **Ingestion:** source adapters/normalisers that produce source-neutral candidate records/issues; no views.
- **Tools:** optional Python for research/validation/conversion only, never an app-runtime dependency.

## 6. Proposed repository structure

This is the M1 target, not an instruction to create it during M0.

```text
Archive76.slnx
Directory.Build.props
Directory.Packages.props
src/
  Archive76.Domain/             # no infrastructure/UI dependencies
  Archive76.Application/        # use cases, ports, DTOs
  Archive76.Infrastructure/     # SQLite, EF mappings/migrations, cache, HTTP
  Archive76.Ingestion/          # adapters, normalisation, validation, reports
  Archive76.Desktop/            # Avalonia app, views, view-models, composition root
tests/
  Archive76.Domain.Tests/
  Archive76.Application.Tests/
  Archive76.Infrastructure.Tests/
  Archive76.Ingestion.Tests/
  Archive76.Desktop.Tests/
  Archive76.Testing/            # fixtures/builders/fakes
tools/data/                     # optional Python and source tooling
docs/adr/                        # approved architecture decisions
docs/data-sources/               # source approval and field-mapping records
```

Installed databases/caches live outside Git, normally under `%LOCALAPPDATA%\\Archive76`. A portable release may use a documented sibling data folder. Both need backup/export support before broad use.

## 7. Proposed relational SQLite schema

This is a logical schema, not an instruction to create a production database during M0. Minor naming changes are allowed; relationship/player-state changes require an ADR and spec update.

### 7.1 Catalogue core/classification

| Table | Key fields and purpose |
| --- | --- |
| `catalogue_items` | UUID/ULID `id`, `item_kind`, canonical `name`, `description`, `trackability_status`, `availability_status`, created/updated/retired UTC. Common identity/search anchor; no player fields. |
| `catalogue_item_aliases` | Alternate/superseded/localised name, normalised text, source/confidence. |
| `categories` | Hierarchical `parent_category_id`, scope (CAMP/WeaponMod/ArmourMod/Equipment), display name, sort order. One table supports categories/subcategories. |
| `catalogue_item_categories` | Many-to-many primary/secondary category assignment. |
| `plans` | One-to-one `catalogue_item_id`; plan-specific type/learnability metadata. |
| `camp_build_items` | One-to-one `catalogue_item_id`; build-menu metadata, budget, placement facts. |
| `plan_unlocks` | Plan → unlocked catalogue item, sourced/confident; one plan may unlock many items. |
| `unlock_conditions` | Unlocked item, condition type (Plan/Entitlement/Challenge/Loot/Quest/etc.), optional plan, detail/status. It prevents false plan relationships. |

### 7.2 Equipment/modifications

| Table | Key fields and purpose |
| --- | --- |
| `equipment_families` | Weapon, armour, power armour and future distinctions. |
| `equipment_types` | Family-owned type/classification, optional parent. |
| `equipment_pieces` | One-to-one catalogue item, type, verified gameplay fields. |
| `modification_slots` | Equipment-family/type-specific attachment slot/category. |
| `modifications` | One-to-one catalogue item, slot, structured mod-effect facts where verified. |
| `modification_applicability` | Modification → equipment piece many-to-many; applicability status/source/confidence. |
| `modification_unlocks` | Modification → unlock condition/source-neutral unlock record; supports plan, scrapping/learning, loose item, quest, or unknown route. |

`item_kind` is a practical shared identity/FTS anchor; extension tables preserve semantics and each top-level catalogue queries its appropriate type.

### 7.3 Sources, acquisition, images, history

| Table | Key fields and purpose |
| --- | --- |
| `external_sources` | Name, home URL, class, usage-approval status, licence/terms URL, retrieval policy, review date. Adapter disabled until approved. |
| `external_identifiers` | Item, source, identifier scheme/value, game build/version, canonical flag, observed/verified time. Unique on source/scheme/value; Form IDs are versioned observations. |
| `acquisition_methods` | Normalised vocabulary: vendor, event, quest, drop, seasonal reward, etc. |
| `acquisition_offers` | Item/unlock, method, availability, probability/requirements/notes, source/confidence. Multiple offers are normal. |
| `locations` / `vendors` | Normalised locations/regions and named vendor/NPC/robot records. |
| `acquisition_offer_locations` / `acquisition_offer_vendors` | Offer-to-location/vendor many-to-many. |
| `prices` | Offer amount (integer), currency, exact/range, conditions, observed/effective dates, source. Market estimates remain estimates. |
| `image_assets` | Source URL, MIME/pixel metadata, content hash, cache/usage/licence/attribution status, source/verification time. |
| `catalogue_item_images` | Item-to-image relation, role (thumbnail/model/storefront), order/crop metadata. |
| `catalogue_revisions` / `catalogue_item_revisions` | Promoted version, game build, change/retirement history; supports non-destructive lifecycle. |
| `import_runs`, `import_issues`, `import_changes` | Adapter/version, payload hashes, outcome/counts/report and field diagnostics/diff decisions. |

Image bytes belong in a filesystem cache, not SQLite BLOBs by default; SQLite stores metadata/hashes.

### 7.4 Player-specific data

| Table | Key fields and purpose |
| --- | --- |
| `players` | ID, display name, active flag, created/updated UTC; no two-player constraint. |
| `player_item_tracking` | Player + catalogue item, state (`Collected`, `Unknown`, `Excluded`, etc.), changed time/source. Only for genuine item-level targets. |
| `player_plan_state` | Player + plan; separate ownership and knowledge status, timestamps/evidence. A plan may be held but unlearned. |
| `player_modification_state` | Player + modification; knowledge status, `has_loose_mod`, optional current applicability/verified time. No field is inferred from another. |
| `player_equipment_instances` | Future optional player inventory record: player + equipment piece + label/owned status. |
| `player_equipment_modification_state` | Future relation to an equipment instance: applicability/installed state/time. |
| `player_favourites` | Player + catalogue item + timestamp; separate from collection. |
| `player_notes` | Player + catalogue item + body + created/updated time; later UX decides one or multiple notes. |
| `player_activity` | Append-only audit/activity feed for dashboard recency. |

Use UTC ISO-8601 text or integer epoch consistently, integer currency values, `CHECK` constraints for enumerations, foreign keys enabled per connection, and `UNIQUE` constraints for natural relation keys. Avoid SQLite schemas/sequences/generated rowversion assumptions.

### 7.5 Essential indexes/FTS

- Index catalogue kind/trackability/availability and normalised name.
- Index both sides of every many-to-many table, especially unlocks, applicability, categories, offers and player relations.
- Index player state/favourite/activity, external identifiers and offer/vendor/location lookup paths.
- Add an SQLite **FTS5 external-content index** over canonical name, aliases, description, category name and stable identifier text. Keep it transactional with catalogue changes and test rebuilds.

## 8. Search and filtering architecture

Search is database-side, never an in-memory catalogue. `CatalogueSearchService` accepts a typed request (scope, selected player, query, category IDs, availability, acquisition method, collection/favourite flags, sort and page cursor) and returns a paged result-card projection. Details/images load on demand.

- Use parameterised FTS5 MATCH queries for tokenised name/alias/description search. Use B-tree paths for exact stable identifier lookup when preferable.
- Use indexed relational predicates/joins for filters and player state. Do not fetch candidates then filter in a view model.
- Use stable deterministic ordering and cursor/keyset pagination for large result sets; bounded offset paging is acceptable only for small lists.
- Debounce UI input, cancel superseded queries, bound page size, and do no network/image fetching during search.
- Dashboard aggregates use dedicated SQL/projections; cache only if profiling proves it necessary, and invalidate on player-state/catalogue-revision changes.
- Define a representative multi-thousand-record fixture and performance budget in M2. Record measured target hardware/thresholds rather than claiming untested fixed timings now.

## 9. External-data importer architecture

```
Source policy check → Adapter fetch → immutable raw snapshot
→ source-specific parse → source-neutral candidate records
→ normalise → validate → deduplicate/match → diff
→ review/promotion policy → atomic catalogue transaction → import report
```

Each adapter is an independent port such as `FetchAsync`, `Parse`, `DescribeCapabilities`, and `GetSourceVersion`; it has no UI reference. Fetches are cancellable, time-limited, rate-limited and conditional (`ETag`/`Last-Modified`) only where the source permits it.

- A source is disabled until terms/licence/retrieval permission are approved in `external_sources` and `docs/data-sources/`.
- Store immutable permitted raw snapshots with SHA-256, URL, retrieval time/version. If retention is not permitted, retain only permitted derived metadata/hash or accept a user-supplied local file.
- Parsing produces candidates plus field diagnostics and never mutates live data. Normalisation retains raw values/provenance.
- Match in this order: approved source identifier + version; verified Form ID; manually maintained crosswalk; candidate name/attributes requiring review. Never silently merge ambiguous name-only records.
- Validate required fields, enums, duplicate keys, relationships, source-version compatibility, URL/media constraints, missing IDs and suspicious deletion/change ratios.
- Promote from staging in one SQLite transaction. Retire records by lifecycle state; do not delete a valid record because a source omitted it.
- A failure, cancellation, threshold breach or database error preserves the current revision. Reports enumerate new, changed, retired, malformed, duplicate, unresolved-ID and broken-image outcomes.

## 10. Image/cache architecture

`IImageAssetService` resolves an image reference to a local cache result. Catalogue/domain code knows image IDs/metadata, never a particular image host.

1. UI requests thumbnail/detail image asynchronously.
2. Service checks content-addressed local cache plus hash/MIME/size/fetch/validation metadata and permitted ETag/Last-Modified.
3. A valid local image is decoded off the UI thread. On a miss/stale entry return a placeholder immediately and, only when approved online updates are enabled, enqueue bounded background refresh.
4. Download validates allowed scheme/host, MIME, size, decode safety and hash. Write temporary file then atomically rename; commit metadata only after file exists.
5. On failure preserve last-known-good cache, record diagnostic/backoff, and expose a non-blocking missing image state.

Use bounded concurrency, cancellation, in-flight request deduplication, lazy loading/virtualisation, eviction/pinned/last-used metadata, and appropriate thumbnail/detail dimensions. Never load all bitmaps into memory. Licence/attribution/caching permission is mandatory before image use.

## 11. Fallout 76 data-source assessment

**Research date:** 27 August 2026. Observed facts are distinct from decisions. Public access is not permission for automated retrieval, local persistent caching, redistribution, or image reuse. No source is approved for automatic import at M0.

| Source | Observed content / identifiers | Structure, API and freshness evidence | Automation, licensing and maintenance assessment |
| --- | --- | --- | --- |
| [MrsBlobby C.A.M.P. Item Database](https://mrsblobby.github.io/76-CAMPDatabase/PTS/index.html) | C.A.M.P. build-menu category/subcategory, placement/unlock conditions, plan/challenge/entitlement search, budget cost, technical **Form ID** search/display, detailed build information and model/storefront images. | Public GitHub Pages application. Its changelog reports v3.3.0 updated 10 Aug 2026, with model renders added in v3.2. M0 did not verify a documented data API/export contract or committed update cadence. | Highest-value CAMP reference candidate. Do not scrape UI/bulk-download images. Obtain author permission and documented export/attribution/cache agreement; otherwise manual verification only. Source shape may change with UI releases. |
| [FED76 / The Plan Collectors](https://fed76.info/plans/?class=CAMP&order=-price) | CAMP plan names, class/subclass, price ranges/notes. The page calls prices subjective trading guidance. | Public filterable HTML table/application. M0 found no documented API/download, licence/terms for reuse, or update schedule. | Optional market-estimate source only; not an authoritative acquisition/completion source. Do not automate/cache/redistribute pending permission. Maintenance high because market advice is volatile. |
| [Fallout Wiki (Fandom) weapon-mod plans](https://fallout.fandom.com/wiki/Fallout_76_plans/Weapon_mods) | Community tables include weapon-mod plan names, broad acquisition columns, weight/value and Form IDs; related pages may cover armour/plans. | Editable community pages. MediaWiki commonly provides APIs, but this site's API conditions, rate limits, attribution and reuse were not verified in M0. Content changes freely. | Useful discovery/cross-check source, weak primary authority. Treat as manual citation until specific API/scrape permission is reviewed; HTML scraping is brittle and high-maintenance. |
| [FWDekker fo76-dumps](https://github.com/FWDekker/fo76-dumps) | Structured release attachments: Form ID/keyword database, NPC CSV, armour/weapon/flora locations, other JSON/CSV/MediaWiki exports. | Releases are published for each game update, not an application API. Repository was active Aug 2026. README says dump contents are owned by Bethesda Softworks LLC. | Strong technical candidate for identifiers/diffing, but not approved to bundle/redistribute. Use for research, development validation or a user-supplied source only after legal review. Mapping/patch maintenance is material. |
| [arquxx fo76datamineTOOL](https://github.com/arquxx/fo76datamineTOOL) | Python parser for locally available `SeventySix.esm` and localisation BA2; versioned SQLite/CSV/JSON/HTML, Form IDs/editor IDs/records, diffs, workshop/model image extraction. | Tool source, not remote catalogue service; needs game/PTS data. README claims 478K+ parseable records, but Archive76 has not independently validated mappings/output. | Valuable prototype/reference or user-supplied adapter, never a production runtime dependency. Game-asset extraction/output redistribution and source/tool licences are unresolved; high patch-format maintenance. |
| [suglasp plans and recipes](https://github.com/suglasp/fallout76_plans_and_recipes) | CSV-oriented extraction of some Fallout 76 plans/recipes, with internal naming caveats. | Downloadable repository data; no API identified. Scope/completeness/licence not independently verified in M0. | Comparison fixture only until provenance/licence/completeness are verified. Never assume it is comprehensive. |
| Official client and patch notes | Patch notes provide change signals; client assets are closest to game content. | No official public comprehensive catalogue API was identified in M0. Game data changes with patches; a patch note is not a data export. | Use patch notes as change-notification evidence. Do not automate client extraction or redistribute assets pending Terms/EULA/legal review. |

### Conclusions

- No verified stable, open, authoritative public API covers all required plans, mods, acquisition, images and pricing.
- Form IDs are valuable matching evidence but must include source, game build/version, record type and confidence. They do not resolve display variants or one-to-many unlocks alone.
- “Price” means either fixed NPC/currency price or community/player-market estimate. Store source/type/currency/date/confidence separately; never merge them into one value.
- Acquisition is often incomplete, seasonal or ambiguous. Model multiple offers/conditions and unknown availability.
- M2 must use a small provenance-rich curated fixture from approved data, not a bulk scrape.

## 12. Testing strategy

| Layer | Required evidence |
| --- | --- |
| Domain | Invariants/state transitions; multiple plan unlocks; distinct mod states; completion denominator; availability/source confidence. |
| Application | Player isolation; collection/favourite/note actions; dashboard aggregate correctness; search/filter validation; selected-player switching/cancellation/error mapping. |
| Infrastructure | Fresh creation; migrations from historic fixtures; constraints/foreign keys; repository operations; real SQLite FTS/index plans; rollback; backup/recovery; cache metadata. |
| Ingestion | Adapter fixtures; malformed/partial payload; normalisation; exact/ambiguous matching; new/changed/removed data; missing IDs; source-policy refusal; atomic promotion/report/broken-image references. |
| Image cache | Hit/miss/stale; conditional requests; atomic write failure; corrupt/oversize/wrong MIME; cancellation; offline placeholder; retry/backoff/eviction. |
| Presentation | View-model commands/states, navigation/accessibility, no UI-thread blocking; only a small practical set of UI smoke tests. |
| Non-functional | Multi-thousand-record search/filter benchmark, scrolling-image memory check, offline-start, import-failure resilience and Windows publish/install smoke test. |

Use xUnit plus an assertion library, deterministic clock/fake HTTP/filesystem ports, temporary per-test files and captured source fixtures. Integration tests run real SQLite. Network tests are opt-in and never required for a normal build. CI after M1 restores, formats/checks style, builds, tests and publishes a test artefact.

## 13. Packaging strategy

Initial target is Windows x64. ARM64 is a later validation target, not a support claim until tested.

1. **Developer:** normal `dotnet build` / `dotnet test`.
2. **First personal distribution:** self-contained `win-x64` folder/portable package. Keep user database/cache outside the app folder by default. A single-file EXE can be evaluated, but a folder is safer for native dependencies and diagnosable data paths.
3. **Production install:** evaluate MSIX versus a signed traditional installer after application validation. It must create per-user data folders, preserve data by default on upgrade/uninstall, offer explicit data removal, and never package user databases/caches.
4. **MSIX gate:** choose it if clean uninstall, package identity, App Installer/Store updating and signing logistics are acceptable. Microsoft’s [packaging overview](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/packaging/) recommends MSIX in many new-app scenarios; prove chosen Avalonia tooling in a release rehearsal.

Code signing, automatic updates and Store submission are not early requirements. Test release output offline on a clean Windows profile/VM, including first-run database/migration/cache paths and upgrade/uninstall.

## 14. Risk register

| Risk | Impact | Mitigation / gate |
| --- | --- | --- |
| No approved comprehensive source | Cannot safely seed/update catalogue automatically. | Curated fixtures, permission, or user-supplied data; provenance everywhere. |
| Third-party terms/copyright/rate limits | Legal/source-blocking risk. | Approve terms first; no default scrape/cache/redistribution. |
| Patches/PTS/live/Form ID changes | Stale/misleading/mis-matched catalogue. | Versioned identifiers, diffing, source confidence, soft retirement/history. |
| Ambiguous plan/mod semantics | Incorrect completion/player state. | Preserve relationships/independent states; define denominators before UI. |
| Brittle client-rendered sites | Importer breaks silently. | Prefer exports/local inputs, contract fixtures, health checks, staged validation. |
| SQLite migration/cache failure | Personal data loss/startup failure. | Backup before migration/import, transaction, fixtures, recovery guidance. |
| Two PCs/no sync specification | Divergent collection states. | Expected in v1; no implicit cloud. Later explicit export/import or sync design. |
| Image host/size/memory issue | Broken/sluggish UI. | Source-independent local cache, lazy loading, limits, placeholders/eviction. |
| Multi-agent drift | Conflicting code/architecture. | AGENTS/spec/development log, small commits, ADR/review. |

## 15. Unresolved questions

1. Which sources explicitly permit automated retrieval, local cache, transformation, attribution and redistribution in a packaged personal app?
2. Is usage one shared PC, two independent PCs, or portable data movement? This determines backup/export/later sync.
3. What counts toward C.A.M.P., weapon-mod and armour-mod completion: learned plan, unlocked object, collectible only, all historical items, or configurable scope?
4. Does `Collected` mean physically owned, learned, available/buildable, or a personal checklist? Initial UI labels must be exact.
5. Which mods are in scope: learned mods, loose boxes, legendary-mod mechanics, power armour, all equipment, or only conventional weapon/armour mod plans?
6. Should Atomic Shop, SCORE, legacy, cut, PTS/unreleased and temporarily unavailable records display/count by default?
7. Which game platform/edition and live/PTS versions are in scope for data/identifiers?
8. Are local manual catalogue corrections/acquisition notes allowed, and must they survive external updates as overlays?
9. Which image forms matter and can their licences/caching rights be obtained?
10. Is portable distribution enough, or is signed installer/MSIX required? What minimum Windows version is supported?

## 16. Recommended roadmap

1. Resolve source permission, completion semantics and one-vs-two-machine usage.
2. Add source-approval/field-mapping templates under `docs/data-sources/`; obtain approval for one seed source.
3. Begin M1 with solution/layers/package management/migration/test/CI foundation only.
4. Create a tiny provenance-rich curated fixture; test real SQLite schema, player isolation and FTS before screens.
5. Build C.A.M.P. browse/search/state/dashboard vertical slice first.
6. Add weapon/armour model/tests, then approved image/import work.
7. Rehearse portable packaging, backup/migration and offline behaviour before release.

## 17. Evidence links

- [MrsBlobby C.A.M.P. Item Database](https://mrsblobby.github.io/76-CAMPDatabase/PTS/index.html)
- [FED76 Plan Pricing Tool](https://fed76.info/plans/?class=CAMP&order=-price)
- [Fallout Wiki weapon-mod plan table](https://fallout.fandom.com/wiki/Fallout_76_plans/Weapon_mods)
- [FWDekker Fallout 76 dumps](https://github.com/FWDekker/fo76-dumps)
- [arquxx Fallout 76 datamine tool](https://github.com/arquxx/fo76datamineTOOL)
- [Avalonia supported platforms](https://docs.avaloniaui.net/docs/supported-platforms)
- [.NET support policy](https://dotnet.microsoft.com/en-us/platform/support/policy)
- [WinUI unpackaged deployment](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/unpackage-winui-app)
- [Windows packaging overview](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/packaging/)
- [EF Core SQLite limitations](https://learn.microsoft.com/en-us/ef/core/providers/sqlite/limitations)
