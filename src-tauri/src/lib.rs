// src-tauri/src/lib.rs — M2 native shell.
//
// `run` sets up the Tauri window and command surface. The `#![cfg_attr]`
// suppresses the console window on release builds for a cleaner user
// experience on Windows.
#![cfg_attr(
    not(debug_assertions),
    // Hide the console window on release builds (Windows).
    windows_subsystem = "windows"
)]

pub mod db;
pub mod models;
pub mod queries;
pub mod schema;

use serde::Serialize;

/// Information returned by the `database_status` Tauri command. The frontend
/// uses this to confirm the SQLite layer is alive and reachable end-to-end.
#[derive(Debug, Serialize)]
pub struct DatabaseStatus {
    /// Absolute path to the SQLite file currently in use.
    pub path: String,
    /// Schema version (mirrors `PRAGMA user_version`).
    pub schema_version: i64,
    /// Number of catalogue items currently in the shared catalogue.
    pub catalogue_count: i64,
    /// Number of players currently registered.
    pub player_count: i64,
}

#[tauri::command]
fn ping() -> String {
    "pong".to_string()
}

/// Open (or initialize) the local SQLite database and return a status
/// snapshot. This is the first end-to-end vertical slice: React → Tauri
/// command → rusqlite → JSON.
#[tauri::command]
fn database_status() -> Result<DatabaseStatus, String> {
    let path = db::default_db_path().map_err(|e| e.to_string())?;
    let conn = db::open(&path).map_err(|e| e.to_string())?;
    let schema_version: i64 = conn
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let catalogue_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM catalogue_items", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let player_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM players", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(DatabaseStatus {
        path: path.to_string_lossy().to_string(),
        schema_version,
        catalogue_count,
        player_count,
    })
}

/// Paginated catalogue listing exposed to the frontend.
///
/// `kind` is an optional snake_case string ("plan", "weapon_mod", "armour_mod")
/// that Tauri deserializes directly into `ItemKind` via serde. Passing `null`
/// (or omitting) means "all kinds". `trackable_only` filters to items obtainable
/// in normal play (trackability_status = Trackable).
///
/// Each call opens a fresh SQLite connection (per `db.rs` design notes) — reads
/// are one-shot and WAL mode allows concurrent readers without contention.
#[tauri::command]
fn list_catalogue_items(
    offset: i64,
    limit: i64,
    kind: Option<models::ItemKind>,
    trackable_only: bool,
) -> Result<queries::CataloguePage, String> {
    let path = db::default_db_path().map_err(|e| e.to_string())?;
    let conn = db::open(&path).map_err(|e| e.to_string())?;
    queries::list_catalogue_items(&conn, offset, limit, kind, trackable_only)
        .map_err(|e| e.to_string())
}

/// FTS5 full-text search across catalogue item names and sources.
///
/// Returns matching items ordered by FTS `rank`, paginated. Empty or
/// whitespace-only queries return an empty result by design (avoids full-table
/// scans on accidental empty input).
#[tauri::command]
fn search_catalogue(
    query: String,
    offset: i64,
    limit: i64,
) -> Result<queries::CataloguePage, String> {
    let path = db::default_db_path().map_err(|e| e.to_string())?;
    let conn = db::open(&path).map_err(|e| e.to_string())?;
    queries::search_catalogue(&conn, &query, offset, limit).map_err(|e| e.to_string())
}

/// Fetch full detail for a single catalogue item by UUID string id.
///
/// Returns `Ok(None)` when no row matches, so the caller can distinguish
/// "not found" from a database error.
#[tauri::command]
fn get_catalogue_item(id: String) -> Result<Option<models::CatalogueItem>, String> {
    let path = db::default_db_path().map_err(|e| e.to_string())?;
    let conn = db::open(&path).map_err(|e| e.to_string())?;
    queries::get_catalogue_item(&conn, &id).map_err(|e| e.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            ping,
            database_status,
            list_catalogue_items,
            search_catalogue,
            get_catalogue_item
        ])
        .setup(|app| {
            // Eagerly initialize the local database so the first
            // `database_status` invoke is fast and the schema migration
            // runs in a predictable place rather than during user interaction.
            if let Err(e) = db::open(&db::default_db_path()?) {
                eprintln!("archive76: failed to initialize database: {e}");
            }
            let _ = app.handle();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
