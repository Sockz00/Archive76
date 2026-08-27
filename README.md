# Archive76

Archive76 is a planned local-first Windows desktop application for two people to catalogue Fallout 76 C.A.M.P. plans, weapon modifications, and armour modifications. It keeps a shared catalogue separate from each player’s collection state, favourites, and notes.

The repository is currently at its **research and architecture milestone**. There is no application, GUI, production database, importer, or buildable solution yet.

## Planned stack

- C# / .NET 10 LTS
- Avalonia UI with MVVM
- SQLite with EF Core
- Git
- Python only for optional data research/validation/conversion tooling—not the production application runtime

## Documentation

- [PROJECT_SPEC.md](PROJECT_SPEC.md) — authoritative functional specification, source research, architecture, schema and roadmap.
- [DEVELOPMENT.md](DEVELOPMENT.md) — current milestone, decisions, risks and next work.
- [AGENTS.md](AGENTS.md) — concise persistent rules for coding agents.

Read these before implementing or changing architecture.

## Planned layout

```text
src/        production layers: Domain, Application, Infrastructure, Ingestion, Desktop
tests/      unit, integration and UI-smoke tests
tools/      optional Python/data-maintenance tools
docs/       ADRs and approved source records
```

See the full proposed structure in [PROJECT_SPEC.md](PROJECT_SPEC.md#6-proposed-repository-structure).

## Prerequisites (when M1 begins)

- Windows 10/11 development machine
- .NET 10 SDK
- Git
- An IDE/editor with C# support (Visual Studio or VS Code/C# Dev Kit)

Avalonia, SQLite, EF Core, and test dependencies will be restored from the solution once it exists.

## Build and test

There is nothing to build or test yet by design. M1 will document the exact commands after creating the .NET solution and test projects.

## Working with AI agents

Agents must preserve the local-first desktop architecture, keep personal state out of the shared catalogue, avoid direct UI-to-SQL/network calls, and document material decisions in `DEVELOPMENT.md`. Do not scrape or bundle third-party Fallout 76 data or images without an approved usage basis. See [AGENTS.md](AGENTS.md).

## Data safety

Never delete, reset, overwrite, or recreate a user database, collection database,
or other persistent user state merely to resolve a development problem.

Never delete files merely because they are ignored by Git.

Before destructive operations on persistent data, verify that the operation is
intentional, required, and safe.

Use isolated test databases/fixtures for destructive testing.

## Repository safety

Treat existing files outside the current task as valuable.

Do not replace or regenerate project configuration files wholesale when a targeted
edit is sufficient.

Preserve existing .gitignore rules unless a specific project requirement makes
a change necessary.