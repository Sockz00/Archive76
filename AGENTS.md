# Archive76 agent instructions

## Read first

Read [PROJECT_SPEC.md](PROJECT_SPEC.md), [DEVELOPMENT.md](DEVELOPMENT.md), and this file before changing code. `PROJECT_SPEC.md` is the functional authority; `DEVELOPMENT.md` records the current implementation state and decisions.

## Project identity

Archive76 is a local-first Windows desktop catalogue for Fallout 76 C.A.M.P. plans and equipment modifications. Each installation has its own local catalogue/database and supports multiple local characters/profiles; installations never synchronise with one another. It is not a web application and remains usable offline after data and images are cached. Approved network access is limited to catalogue/image update operations: automatic checks are approximately weekly and users can manually check for updates.

## Architectural rules

- Keep UI, application, domain, infrastructure, ingestion, and image-cache concerns separate.
- UI components use application services/view models only. They never query SQLite or call the network directly.
- Keep shared catalogue data separate from player-specific state. Never add a player's collection state to a catalogue entity.
- Keep every installation's catalogue and personal state local. Never add cross-machine synchronisation.
- Network I/O is only for approved catalogue/image sources. Never upload characters/profiles, collection/progress, favourites, notes, settings, or the personal database.
- Treat plan ownership/knowledge, mod knowledge, loose-mod possession, and current applicability as separate concepts unless verified game mechanics justify joining them.
- Add external sources through replaceable source adapters and the ingestion pipeline; never couple it to one XML format, website, or host. Source approval is source-specific and must be recorded in `DEVELOPMENT.md` and the future `docs/data-sources/` record; do not invent permissions or assume an unverified source is approved.
- Preserve source provenance, identifiers, versions, validation results, and import history. Failed updates must leave the last known-good catalogue usable.

## Development rules

- Target the approved stack in `PROJECT_SPEC.md`; do not create a web backend or cloud dependency.
- Make small, reviewable changes. Do not silently replace the architecture, schema, or UI framework; document and discuss material changes first.
- Use asynchronous, cancellable I/O. Network and image work must never block the UI thread.
- Update flow is staged: retrieve → preserve permitted snapshot → parse → normalise → validate → match/deduplicate → diff → review/promotion → atomic promotion. Never overwrite the live catalogue blindly.
- Prioritise reliable local image availability over aggressive cache eviction; the user accepts local cache disk usage.
- Keep local databases, caches, credentials, build output, and generated artefacts out of Git.
- Add or update tests for significant behaviour. External network operations must be mockable.
- Update `DEVELOPMENT.md` after significant work, decisions, or discovered risks.

## Git rules

- Do not rewrite history, force-push, or discard unrelated working-tree changes.
- Prefer small logical commits with clear messages. Inspect `git status` before committing.

## Do not do these things

- Do not build the GUI, production database, or importers until the corresponding milestone is approved.
- Do not invent game data, acquisition methods, prices, identifiers, or mechanics.
- Do not couple a UI screen to a particular community website or image host.
- Do not couple ingestion to one XML format, website, or source.
- Do not upload user data to an external service or implement synchronisation between installations.
