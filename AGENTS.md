# Archive76 agent instructions

## Read first

Read [PROJECT_SPEC.md](PROJECT_SPEC.md), [DEVELOPMENT.md](DEVELOPMENT.md), and this file before changing code. `PROJECT_SPEC.md` is the functional authority; `DEVELOPMENT.md` records the current implementation state and decisions.

## Project identity

Archive76 is a local-first Windows desktop catalogue for two people's Fallout 76 C.A.M.P. plans and equipment modifications. It is not a web application and must work offline after data and images are cached.

## Architectural rules

- Keep UI, application, domain, infrastructure, ingestion, and image-cache concerns separate.
- UI components use application services/view models only. They never query SQLite or call the network directly.
- Keep shared catalogue data separate from player-specific state. Never add a player's collection state to a catalogue entity.
- Treat plan ownership/knowledge, mod knowledge, loose-mod possession, and current applicability as separate concepts unless verified game mechanics justify joining them.
- Add external sources through source adapters and the ingestion pipeline. Do not scrape, redistribute, or bundle third-party data/images without an approved usage basis recorded in `DEVELOPMENT.md`.
- Preserve source provenance, identifiers, validation results, and import history. Failed imports must leave the last valid catalogue usable.

## Development rules

- Target the approved stack in `PROJECT_SPEC.md`; do not create a web backend or cloud dependency.
- Make small, reviewable changes. Do not silently replace the architecture, schema, or UI framework; document and discuss material changes first.
- Use asynchronous, cancellable I/O. Network and image work must never block the UI thread.
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
