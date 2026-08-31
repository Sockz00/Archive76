# Archive76 — Agent Operating Contract

## 1. Mission

Archive76 is a local-first desktop application for cataloguing Fallout 76 plans, weapon modifications, armour modifications, and related game data.

The primary engineering objective is:

> Build an exceptionally fast, responsive, reliable and maintainable Fallout 76 catalogue application.

Performance is a core product requirement, not a later optimization phase.

The application should feel instantaneous during normal use, including searching, filtering, browsing, changing collection state, opening plan details, and navigating large datasets.

Agents are expected to continue development autonomously without requiring human direction for routine engineering decisions.

---

## 2. Repository

Canonical public repository:

https://github.com/Sockz00/Archive76

Local working directory:

C:\ai\Archive76

The local repository and Git history are the primary source of truth for implementation state.

Do not reconstruct the project from this document alone.

Before making substantial changes:

1. Inspect the current repository.
2. Read the existing project documentation.
3. Inspect Git history.
4. Inspect the current branch and working tree.
5. Determine what has already been implemented.
6. Preserve useful existing work.

Never assume that an earlier plan, specification, or architecture document is still correct without checking the current implementation.

---

## 3. Autonomous Development

Agents are expected to operate autonomously.

Do not ask the human what task should be performed next when useful engineering work is available.

When the current task is complete:

1. Inspect the repository.
2. Inspect open issues and outstanding work.
3. Inspect CI status.
4. Inspect recent commits.
5. Inspect performance benchmarks.
6. Identify the highest-value unfinished task.
7. Implement it.
8. Test it.
9. Review it.
10. Document it.
11. Commit it.
12. Push it when appropriate.
13. Continue.

If the backlog becomes empty, perform a project audit.

Look for:

* bugs
* missing functionality
* incomplete requirements
* performance problems
* poor UX
* accessibility problems
* missing tests
* weak error handling
* technical debt
* documentation drift
* security problems
* inefficient database queries
* unnecessary allocations
* unnecessary rendering
* oversized assets
* startup-time regressions
* memory leaks
* dependency problems

Create useful work rather than becoming idle.

---

## 4. Human Interaction

The human should not need to supervise routine development.

Do not stop merely because:

* a feature has been completed
* the current task is finished
* the backlog is empty
* a test failed
* a build failed
* a performance regression was discovered

Instead, investigate and resolve the problem.

Ask the human only when a decision genuinely requires information that cannot reasonably be obtained from:

* the repository
* Git history
* project documentation
* GitHub
* existing data
* established architecture
* external documentation
* tests
* benchmarks

When blocked, document the blocker precisely and continue with independent work.

---

# 5. Architecture

Preferred frontend technologies:

- React
- TypeScript
- Vite
- TanStack Virtual where virtualization requires it
- TanStack Query where asynchronous server/native data caching benefits from it
- Zustand where shared client state is actually required

Agents must not introduce these dependencies merely because they are listed here.
Choose the simplest architecture that meets measured requirements.

However, the existing repository must be inspected before changing architecture.

Do not blindly rewrite working code simply because this document specifies a target architecture.

Architecture decisions must be justified by the actual requirements and current implementation.

---

## 6. Performance Is a Product Requirement

Archive76 must prioritize performance throughout development.

Do not treat performance as something to fix at the end.

Performance must influence:

* architecture
* database design
* query design
* state management
* component structure
* rendering
* image handling
* caching
* filesystem operations
* background processing
* startup behavior
* application packaging

The application should remain responsive with large datasets.

Design for substantially more records than the initial dataset requires.

---

## 7. UI Performance

The React UI must remain responsive.

Rules:

* Do not render thousands of catalogue cards simultaneously.
* Catalogue lists and grids must use virtualization where appropriate.
* Avoid unnecessary React renders.
* Keep frequently changing state localized.
* Do not put large datasets into global reactive state unnecessarily.
* Avoid expensive computations during render.
* Memoize only where measurement or architecture justifies it.
* Prefer derived data from efficient sources over duplicating large datasets.
* Avoid synchronous filesystem operations from the UI.
* Avoid synchronous database operations from the UI.
* Keep animations lightweight.
* Do not introduce unnecessary UI libraries that increase bundle size or runtime work.

The catalogue should be designed around viewport-sized rendering.

A dataset containing 100,000 records should not result in 100,000 mounted React components.

---

## 8. Database Performance

SQLite is the primary local persistence layer.

Database operations must be designed for performance.

Rules:

* Use appropriate indexes.
* Inspect query plans for important queries.
* Avoid unnecessary full-table scans.
* Use prepared statements where appropriate.
* Use transactions for batches.
* Avoid N+1 queries.
* Keep database schemas normalized where appropriate.
* Denormalize only when there is a measurable reason.
* Use FTS5 for catalogue search where appropriate.
* Never load the entire database into memory merely to perform filtering that SQLite can perform efficiently.

Important operations such as search and filtering should have measurable latency targets.

---

## 9. Search

Search is a core feature.

Search should be:

* local
* fast
* deterministic
* responsive while typing
* tolerant of reasonable user input
* capable of handling large catalogues

Prefer SQLite FTS5 for full-text search where appropriate.

Do not implement catalogue search by repeatedly filtering a huge JavaScript array unless measurement demonstrates that this is superior for the specific operation.

Search queries should be benchmarked using realistic dataset sizes.

---

## 10. Image Architecture

Images are expected to be one of the largest sources of unnecessary I/O and memory usage.

Use a local image cache.

Where appropriate, maintain multiple representations:

* thumbnail
* medium
* full resolution

Catalogue grids should use thumbnails.

Detail views should use appropriately sized images.

Do not load full-resolution images into catalogue grids unnecessarily.

Avoid repeatedly downloading or processing the same image.

Prefer local cached assets after initial acquisition.

Image processing should not block the UI.

---

## 11. Rust / Native Layer

Rust should handle operations where native execution provides architectural or performance benefits, including where appropriate:

* SQLite access
* filesystem operations
* image cache management
* data ingestion
* data normalization
* background processing
* expensive computation
* import pipelines

React should primarily handle:

* presentation
* interaction
* navigation
* visual state
* user input
* application composition

Do not move work into Rust merely for the sake of using Rust.

Use measurement and architectural boundaries to determine where work belongs.

---

## 12. State Management

Use the smallest appropriate state mechanism.

General responsibility:

Zustand:

* local/global UI state
* preferences
* transient application state

TanStack Query:

* asynchronous application data
* caching
* invalidation
* request lifecycle

SQLite:

* persistent catalogue and collection data

Do not duplicate the same large dataset across multiple state systems without a clear reason.

---

## 13. Data Pipeline

Archive76 should support a robust data ingestion architecture.

External data sources must be treated as adapters rather than tightly coupling the application to one website or dataset.

Data ingestion should:

1. Acquire source data.
2. Validate it.
3. Normalize it.
4. Map it into the Archive76 schema.
5. Detect conflicts or duplicates.
6. Record provenance where appropriate.
7. Update the local database transactionally.
8. Update search indexes.
9. Process/cache images where applicable.
10. Report failures without corrupting existing data.

Never silently replace trusted data with questionable data.

Source reliability must be documented.

---

## 14. Shared Catalogue vs Player Collection

The catalogue represents the known Fallout 76 plans/modifications.

Collection state represents what an individual player owns or has collected.

Do not conflate:

* existence of a plan in the catalogue
* ownership of a plan
* availability of a plan
* source information about a plan

The data model should preserve this distinction.

---

## 15. Git

Git is the primary development history.

Rules:

* Make coherent commits.
* Use descriptive commit messages.
* Do not rewrite shared history.
* Do not force-push main.
* Do not delete useful branches or history.
* Do not commit secrets.
* Do not commit credentials.
* Do not commit unnecessary generated artifacts.
* Inspect `git diff` before committing.
* Inspect `git status` before and after significant operations.

When working in parallel, use isolated branches/worktrees.

Never modify another agent's worktree.

---

## 16. Branching

The main branch must remain usable.

Normal development should occur on feature/fix branches.

Examples:

feature/search-fts5
feature/catalogue-grid
feature/image-cache
fix/search-ranking
perf/catalogue-rendering
perf/sqlite-indexes

Merge work only after appropriate verification.

Do not use force pushes to resolve ordinary conflicts.

---

## 17. Testing

Every meaningful feature must have appropriate tests.

Use the appropriate testing level:

* unit tests
* integration tests
* database tests
* importer tests
* UI tests
* end-to-end tests
* performance benchmarks

A feature is not complete merely because it compiles.

Tests must cover important failure paths as well as successful paths.

---

## 18. Performance Benchmarks

Maintain reproducible performance benchmarks.

At minimum, benchmark:

* application startup
* database startup
* catalogue query latency
* search latency
* filter latency
* large dataset handling
* image loading/cache behavior
* memory usage
* catalogue scrolling/rendering where practical

Use realistic datasets.

Do not benchmark only tiny development datasets.

Record important benchmark results in the repository.

Performance regressions should be treated as bugs.

---

## 19. Initial Performance Budgets

These are engineering targets, not absolute guarantees.

Warm application startup:

Target: <500 ms

Cold application startup:

Target: <1 second

Catalogue search:

Target: <50 ms p95

Common filtering:

Target: <50 ms p95

UI interaction response:

Target: <50 ms where practical

Catalogue scrolling:

Target: sustained 60 FPS on supported hardware

Normal catalogue memory usage:

Target: remain bounded as catalogue size increases

If a target cannot be met, investigate the actual bottleneck before weakening the target.

Do not optimize blindly.

---

## 20. Performance Regression Policy

Before and after significant performance-sensitive changes:

1. Benchmark the relevant operation.
2. Record the result.
3. Compare against previous results.
4. Investigate significant regressions.
5. Do not merge known regressions without documenting the reason.

A feature that makes the application slower must provide a sufficiently strong product benefit to justify the regression.

---

## 21. Error Handling

Errors must be handled deliberately.

Do not:

* silently swallow errors
* use empty catch blocks
* silently corrupt data
* hide failed imports
* report success when an operation failed

Errors should provide useful diagnostic information.

User-facing errors should be understandable.

Developer-facing logs should contain enough context to diagnose failures.

---

## 22. Documentation

Documentation is part of implementation.

Keep these documents synchronized with the actual project:

* README.md
* PROJECT_SPEC.md
* ARCHITECTURE.md
* DEVELOPMENT.md
* PERFORMANCE.md
* CHANGELOG.md

Create architecture decision records for important architectural decisions.

Do not allow documentation to describe an architecture that no longer exists.

Documentation updates should be included in the same development cycle as the change they describe.

---

## 23. Releases

Releases should be automated where safely possible.

Before creating a release:

* tests pass
* lint passes
* type checking passes
* application builds
* relevant performance benchmarks pass
* documentation is updated
* changelog is updated
* version is correct
* packaging succeeds

Release artifacts must correspond to the committed source tree.

Never publish a release known to be broken merely to maintain release frequency.

---

## 24. Continuous Autonomous Development

The project should continue improving after a release.

After completing a release:

1. Inspect the current implementation.
2. Review recent changes.
3. Review issues.
4. Review benchmarks.
5. Review user-facing functionality.
6. Identify the next highest-value improvement.
7. Begin the next development cycle.

An empty backlog is not a reason to stop.

The agent should perform an engineering audit and create additional work when appropriate.

---

## 25. Delegation

Use subagents when parallel work provides a genuine advantage.

Suitable delegation areas include:

* React/UI implementation
* Rust/database implementation
* data pipeline work
* testing
* performance analysis
* documentation
* code review

Prefer isolated worktrees for parallel implementation.

The parent/supervisor agent remains responsible for integration.

Do not delegate a task merely to increase the number of agents.

Parallelism must improve throughput without compromising correctness.

---

## 26. Code Review

Implementation should be independently reviewed where practical.

Review for:

* correctness
* maintainability
* security
* performance
* architecture
* testing
* error handling
* unnecessary complexity

A passing build is not equivalent to a successful review.

---

## 27. Security

Never commit:

* API keys
* passwords
* private SSH keys
* GitHub tokens
* credentials
* personal secrets
* environment-specific secrets

Use environment variables or secure credential stores.

Treat external data as untrusted input.

Validate imported data before persistence.

Do not execute arbitrary downloaded data.

---

## 28. Dependency Management

Prefer mature, well-maintained dependencies.

Before introducing a dependency:

1. Determine whether it is actually necessary.
2. Consider its maintenance status.
3. Consider bundle/runtime impact.
4. Consider security.
5. Consider whether existing platform functionality is sufficient.

Do not introduce large libraries for trivial functionality.

Periodically audit dependencies.

---

## 29. Decision Making

When multiple technically valid approaches exist:

1. Prefer the simplest approach that satisfies requirements.
2. Prefer measurable performance.
3. Prefer maintainability.
4. Prefer fewer moving parts.
5. Prefer local-first operation.
6. Prefer established ecosystem conventions.
7. Preserve compatibility with existing project work when reasonable.

Do not over-engineer hypothetical future requirements!

---

## 30. Completion Criteria

A task is complete only when:

* implementation is complete
* relevant tests pass
* build succeeds
* error handling is appropriate
* documentation is updated
* performance impact has been considered
* relevant benchmarks pass
* Git changes are coherent
* the result has been reviewed

Then commit the work.

After committing, continue to the next useful task.

---

## 31. Autonomous Operating Principle

The overarching rule for all Archive76 agents is:

> Do useful engineering work continuously, verify the result, preserve the project, document what changed, and leave the repository in a better state than you found it.

Do not optimize for appearing busy.

Optimize for producing verified, maintainable, fast software.

Do not stop because nobody is watching.

Do not wait for instructions when the next useful action can be determined from the repository and project requirements.

The objective is a production-quality Archive76 application that can continuously evolve with minimal human intervention.
