// src-tauri/src/db.rs — SQLite connection management for Archive76.
//
// M2 owns a single connection-per-thread model. The Tauri runtime is
// multi-threaded and we expect most reads to be one-shot from invoke
// commands; we open a fresh connection per call. This avoids the
// `Send` complications of `rusqlite::Connection` (which is `!Sync`)
// while still being fast enough for the typical FTS5 + indexed
// query latency budget (<50ms p95 per DEVELOPMENT.md §8).
//
// The database lives at $LOCALAPPDATA/Archive76/archive76.db on
// Windows and $XDG_DATA_HOME/Archive76/archive76.db on Linux/macOS.

use std::path::{Path, PathBuf};

use rusqlite::Connection;
use thiserror::Error;

use crate::schema;

#[derive(Debug, Error)]
pub enum DbError {
    #[error("could not determine data directory: {0}")]
    NoDataDir(String),
    #[error("sqlite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

/// Resolve the per-user Archive76 data directory. Created if missing.
pub fn data_dir() -> Result<PathBuf, DbError> {
    let home = std::env::var_os("HOME")
        .map(PathBuf::from)
        .ok_or_else(|| DbError::NoDataDir("HOME not set".into()))?;
    let base = if cfg!(target_os = "windows") {
        std::env::var_os("LOCALAPPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(|| home.join("AppData").join("Local"))
    } else if cfg!(target_os = "macos") {
        home.join("Library").join("Application Support")
    } else {
        std::env::var_os("XDG_DATA_HOME")
            .map(PathBuf::from)
            .unwrap_or_else(|| home.join(".local").join("share"))
    };
    let dir = base.join("Archive76");
    if !dir.exists() {
        std::fs::create_dir_all(&dir)?;
    }
    Ok(dir)
}

/// Default database file path. Callers may pass a different path for tests.
pub fn default_db_path() -> Result<PathBuf, DbError> {
    Ok(data_dir()?.join("archive76.db"))
}

/// Open the database at `path`, run pending migrations, and return the
/// connection. The connection is configured for the local-first, single-user
/// use case: WAL journaling for fast concurrent reads, foreign keys ON, and
/// a 30-second busy timeout so brief contention with another process
/// (e.g. a background ingestion) doesn't error out.
pub fn open(path: &Path) -> Result<Connection, DbError> {
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)?;
        }
    }
    let conn = Connection::open(path)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "synchronous", "NORMAL")?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    conn.pragma_update(None, "busy_timeout", 30_000_i64)?;
    schema::apply_migrations(&conn, schema::MIGRATIONS)?;
    Ok(conn)
}

// ---------------------------------------------------------------------------
// Tests
//
// Tests use rusqlite::Connection::open_in_memory() so they never touch the
// real user database at $LOCALAPPDATA/Archive76/archive76.db. Each test gets
// its own fresh in-memory database with migrations applied.
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;

    /// Create a fresh in-memory database with all migrations applied.
    fn fresh_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        schema::apply_migrations(&conn, schema::MIGRATIONS).unwrap();
        conn
    }

    #[test]
    fn migrations_create_all_core_tables() {
        let conn = fresh_db();
        let mut stmt = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .unwrap();
        let tables: Vec<String> = stmt
            .query_map([], |row| row.get::<_, String>(0))
            .unwrap()
            .map(|r| r.unwrap())
            .collect();

        for expected in &[
            "migrations",
            "players",
            "catalogue_items",
            "player_collection",
        ] {
            assert!(
                tables.iter().any(|t| t == expected),
                "missing table: {expected}"
            );
        }
    }

    #[test]
    fn migrations_create_fts_virtual_table() {
        let conn = fresh_db();
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='catalogue_items_fts'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn migrations_create_expected_indexes() {
        let conn = fresh_db();
        let mut stmt = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='index' AND sql IS NOT NULL")
            .unwrap();
        let indexes: Vec<String> = stmt
            .query_map([], |row| row.get::<_, String>(0))
            .unwrap()
            .map(|r| r.unwrap())
            .collect();

        for expected in &[
            "idx_catalogue_items_kind",
            "idx_catalogue_items_retired_at",
            "idx_players_active",
            "idx_player_collection_player",
        ] {
            assert!(
                indexes.iter().any(|i| i == expected),
                "missing index: {expected}"
            );
        }
    }

    #[test]
    fn migrations_set_user_version() {
        let conn = fresh_db();
        let version: i64 = conn
            .query_row("PRAGMA user_version", [], |row| row.get(0))
            .unwrap();
        assert_eq!(version, schema::CURRENT_SCHEMA_VERSION);
    }

    #[test]
    fn migrations_record_all_in_migrations_table() {
        let conn = fresh_db();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM migrations", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, schema::MIGRATIONS.len() as i64);
    }

    #[test]
    fn migrations_are_idempotent() {
        let conn = fresh_db();
        // Re-applying must not error and must not duplicate migration rows.
        schema::apply_migrations(&conn, schema::MIGRATIONS).unwrap();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM migrations", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, schema::MIGRATIONS.len() as i64);
    }

    #[test]
    fn fresh_database_has_zero_counts() {
        let conn = fresh_db();
        let catalogue: i64 = conn
            .query_row("SELECT COUNT(*) FROM catalogue_items", [], |row| row.get(0))
            .unwrap();
        let players: i64 = conn
            .query_row("SELECT COUNT(*) FROM players", [], |row| row.get(0))
            .unwrap();
        assert_eq!(catalogue, 0);
        assert_eq!(players, 0);
    }

    #[test]
    fn insert_and_query_player() {
        let conn = fresh_db();
        let inserted = conn
            .execute(
                "INSERT INTO players (id, display_name, is_active, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
                params![
                    "p1",
                    "TestPlayer",
                    1,
                    "2026-01-01T00:00:00Z",
                    "2026-01-01T00:00:00Z"
                ],
            )
            .unwrap();
        assert_eq!(inserted, 1);

        let name: String = conn
            .query_row(
                "SELECT display_name FROM players WHERE id = ?1",
                ["p1"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(name, "TestPlayer");
    }

    #[test]
    fn fts_search_returns_matching_items() {
        let conn = fresh_db();
        let ts = "2026-01-01T00:00:00Z";
        conn.execute(
            "INSERT INTO catalogue_items
                (id, name, item_kind, trackability_status, availability_status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params!["c1", "Power Armor Station", 0, 0, 1, ts, ts],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO catalogue_items
                (id, name, item_kind, trackability_status, availability_status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params!["c2", "Weapon Workbench", 0, 0, 1, ts, ts],
        )
        .unwrap();

        // FTS5 with porter + unicode61 stemmer: "power" matches "Power Armor Station".
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM catalogue_items_fts WHERE catalogue_items_fts MATCH ?",
                params!["power"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn foreign_key_enforcement_prevents_orphan_collection() {
        let conn = fresh_db();
        // Inserting into player_collection with a non-existent player_id
        // must fail because foreign_keys is ON.
        let result = conn.execute(
            "INSERT INTO player_collection (player_id, catalogue_item_id, status)
             VALUES (?1, ?2, ?3)",
            params!["nonexistent", "c1", 0i32],
        );
        assert!(
            result.is_err(),
            "foreign key constraint should have been violated"
        );
    }

    #[test]
    fn fts_trigger_keeps_search_index_in_sync_on_update() {
        let conn = fresh_db();
        let ts = "2026-01-01T00:00:00Z";
        conn.execute(
            "INSERT INTO catalogue_items
                (id, name, item_kind, trackability_status, availability_status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params!["c1", "Old Name", 0, 0, 1, ts, ts],
        )
        .unwrap();

        // Update the name — the FTS trigger should update the index.
        conn.execute(
            "UPDATE catalogue_items SET name = ?2 WHERE id = ?1",
            params!["c1", "New Name"],
        )
        .unwrap();

        // "Old" should no longer match; "New" should match.
        let old_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM catalogue_items_fts WHERE catalogue_items_fts MATCH ?",
                params!["old"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(old_count, 0);

        let new_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM catalogue_items_fts WHERE catalogue_items_fts MATCH ?",
                params!["new"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(new_count, 1);
    }

    #[test]
    fn fts_trigger_keeps_search_index_in_sync_on_delete() {
        let conn = fresh_db();
        let ts = "2026-01-01T00:00:00Z";
        conn.execute(
            "INSERT INTO catalogue_items
                (id, name, item_kind, trackability_status, availability_status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params!["c1", "Delete Me", 0, 0, 1, ts, ts],
        )
        .unwrap();

        // Before delete, the FTS index has the row.
        let before: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM catalogue_items_fts WHERE catalogue_items_fts MATCH ?",
                params!["delete"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(before, 1);

        // Delete the row — the FTS trigger should remove it.
        conn.execute("DELETE FROM catalogue_items WHERE id = ?1", params!["c1"])
            .unwrap();

        let after: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM catalogue_items_fts WHERE catalogue_items_fts MATCH ?",
                params!["delete"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(after, 0);
    }
}
