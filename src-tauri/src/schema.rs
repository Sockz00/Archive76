// src-tauri/src/schema.rs — canonical Archive76 schema and migrations.
//
// The schema evolves the validated M1 baseline (catalogue_items + players)
// into the M2 canonical model:
//
//   * players            — local characters/profiles (id, display_name, is_active, ts)
//   * catalogue_items    — the shared reference catalogue (id, name, kind, statuses,
//                          provenance, lifecycle timestamps)
//   * player_collection  — joins a player to a catalogue item with collected/known
//                          status and free-form notes (per AD-009: catalogue and
//                          player state are separated)
//   * catalogue_items_fts — FTS5 virtual table for fast prefix/full-text search
//                          on (name, source) (per AD-006)
//
// Migration strategy: a `schema_version` PRAGMA + a `migrations` table. We do
// not delete or replace migrations after they ship (AGENTS.md: treat existing
// data as valuable). New migrations append.

use rusqlite::Connection;

/// The current schema version. Increment when adding a migration. Migrations
/// are applied in order, and each migration's id is recorded in the
/// `migrations` table; if the same id is already recorded, it is skipped.
pub const CURRENT_SCHEMA_VERSION: i64 = 1;

/// Initial schema. Adapted from the M1 EF Core migration with the following
/// deliberate changes for M2:
///
///   * All ids are stored as TEXT (UUID strings) for SQLite portability.
///   * Timestamps are ISO-8601 strings (chrono's RFC3339); SQLite has no native
///     date type and TEXT round-trips cleanly.
///   * `source` / `source_url` columns added on `catalogue_items` so the
///     ingestion adapter can record provenance (per AD-010).
///   * `retired_at` already present in M1, kept for soft-deletion.
///   * FTS5 virtual table mirrors (name, source) for the catalogue search.
pub const MIGRATION_001_INITIAL: &str = r#"
CREATE TABLE IF NOT EXISTS players (
    id            TEXT PRIMARY KEY NOT NULL,
    display_name  TEXT NOT NULL,
    is_active     INTEGER NOT NULL CHECK (is_active IN (0, 1)) DEFAULT 1,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalogue_items (
    id                    TEXT PRIMARY KEY NOT NULL,
    name                  TEXT NOT NULL,
    item_kind             INTEGER NOT NULL,
    trackability_status   INTEGER NOT NULL DEFAULT 0,
    availability_status   INTEGER NOT NULL DEFAULT 0,
    source                TEXT,
    source_url            TEXT,
    created_at            TEXT NOT NULL,
    updated_at            TEXT NOT NULL,
    retired_at            TEXT
);

-- AD-009: catalogue and player state are separated. The join table captures
-- per-player collection/knowledge state plus free-form notes.
CREATE TABLE IF NOT EXISTS player_collection (
    player_id         TEXT NOT NULL,
    catalogue_item_id TEXT NOT NULL,
    status            INTEGER NOT NULL DEFAULT 0,
    notes             TEXT,
    collected_at      TEXT,
    PRIMARY KEY (player_id, catalogue_item_id),
    FOREIGN KEY (player_id)         REFERENCES players(id)         ON DELETE CASCADE,
    FOREIGN KEY (catalogue_item_id) REFERENCES catalogue_items(id) ON DELETE CASCADE
);

-- AD-006: FTS5 for fast catalogue search. Kept in sync via triggers so the
-- FTS table is always consistent with the underlying catalogue_items rows.
CREATE VIRTUAL TABLE IF NOT EXISTS catalogue_items_fts
USING fts5(
    name,
    source,
    content='catalogue_items',
    content_rowid='rowid',
    tokenize='porter unicode61'
);

-- Sync triggers (DELETE / INSERT / UPDATE). Without these, FTS5 stays
-- consistent only after explicit INSERT/DELETE into the FTS table; we want
-- catalogue_items writes to keep FTS in lockstep automatically.
CREATE TRIGGER IF NOT EXISTS catalogue_items_ai AFTER INSERT ON catalogue_items BEGIN
    INSERT INTO catalogue_items_fts(rowid, name, source)
    VALUES (new.rowid, new.name, new.source);
END;

CREATE TRIGGER IF NOT EXISTS catalogue_items_ad AFTER DELETE ON catalogue_items BEGIN
    INSERT INTO catalogue_items_fts(catalogue_items_fts, rowid, name, source)
    VALUES ('delete', old.rowid, old.name, old.source);
END;

CREATE TRIGGER IF NOT EXISTS catalogue_items_au AFTER UPDATE ON catalogue_items BEGIN
    INSERT INTO catalogue_items_fts(catalogue_items_fts, rowid, name, source)
    VALUES ('delete', old.rowid, old.name, old.source);
    INSERT INTO catalogue_items_fts(rowid, name, source)
    VALUES (new.rowid, new.name, new.source);
END;

-- Indexes for the common query paths.
CREATE INDEX IF NOT EXISTS idx_catalogue_items_kind        ON catalogue_items(item_kind);
CREATE INDEX IF NOT EXISTS idx_catalogue_items_retired_at  ON catalogue_items(retired_at);
CREATE INDEX IF NOT EXISTS idx_players_active              ON players(is_active);
CREATE INDEX IF NOT EXISTS idx_player_collection_player    ON player_collection(player_id);
"#;

/// Apply pending migrations in order. `migrations` is a slice of `(id, sql)`
/// pairs in increasing id order. Migrations whose id is already in the
/// `migrations` table are skipped.
pub fn apply_migrations(conn: &Connection, migrations: &[(i64, &str)]) -> rusqlite::Result<()> {
    // The migrations table must exist before we can read it.
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS migrations (
            id         INTEGER PRIMARY KEY NOT NULL,
            applied_at TEXT NOT NULL
        );",
    )?;

    let mut stmt = conn.prepare("SELECT id FROM migrations")?;
    let applied: std::collections::HashSet<i64> = stmt
        .query_map([], |row| row.get::<_, i64>(0))?
        .filter_map(Result::ok)
        .collect();
    drop(stmt);

    for (id, sql) in migrations {
        if applied.contains(id) {
            continue;
        }
        let tx = conn.unchecked_transaction()?;
        tx.execute_batch(sql)?;
        tx.execute(
            "INSERT INTO migrations (id, applied_at) VALUES (?1, ?2)",
            rusqlite::params![id, chrono::Utc::now().to_rfc3339()],
        )?;
        tx.commit()?;
    }

    // Bump the user_version PRAGMA so tools can see the schema version
    // without parsing the migrations table.
    conn.pragma_update(None, "user_version", CURRENT_SCHEMA_VERSION)?;
    Ok(())
}

/// The migration list in order. Append new entries here, do not edit or
/// remove shipped ones (AGENTS.md: documentation drift / data corruption).
pub const MIGRATIONS: &[(i64, &str)] = &[(1, MIGRATION_001_INITIAL)];
