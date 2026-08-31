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
    let base = if cfg!(target_os = "windows") {
        std::env::var_os("LOCALAPPDATA")
            .ok_or_else(|| DbError::NoDataDir("LOCALAPPDATA not set".into()))
    } else if cfg!(target_os = "macos") {
        std::env::var_os("HOME")
            .map(|h| PathBuf::from(h).join("Library").join("Application Support"))
            .ok_or_else(|| DbError::NoDataDir("HOME not set".into()))
    } else {
        std::env::var_os("XDG_DATA_HOME")
            .map(PathBuf::from)
            .or_else(|| {
                std::env::var_os("HOME")
                    .map(|h| PathBuf::from(h).join(".local").join("share"))
            })
            .ok_or_else(|| DbError::NoDataDir("XDG_DATA_HOME / HOME not set".into()))
    }?;
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
    conn.pragma_update(None, "journal_mode", "WAL", |_| Ok(()))?;
    conn.pragma_update(None, "synchronous", "NORMAL", |_| Ok(()))?;
    conn.pragma_update(None, "foreign_keys", "ON", |_| Ok(()))?;
    conn.pragma_update(None, "busy_timeout", 30_000_i64, |_| Ok(()))?;
    schema::apply_migrations(&conn, schema::MIGRATIONS)?;
    Ok(conn)
}
