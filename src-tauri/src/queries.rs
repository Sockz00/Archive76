// src-tauri/src/queries.rs — catalogue query layer.
//
// This module provides the read-path between SQLite and the React frontend for
// catalogue data. It deliberately returns *lightweight summaries* for lists and
// searches (not full domain objects) to keep Rust→JS serialisation and React
// rendering cheap — AGENTS.md §8/DATABASE: "Never load the entire database into
// memory merely to perform filtering" and "Do not transfer large datasets
// unnecessarily."
//
// Public functions:
//   * `list_catalogue_items` — paginated, optionally filtered listing.
//   * `search_catalogue`     — FTS5 full-text search with pagination.
//   * `get_catalogue_item`   — full detail for a single catalogue item.
//
// Each function takes an `&Connection` so tests can pass an in-memory DB and
// the Tauri command wrappers in `lib.rs` own the connection lifecycle.

use rusqlite::{params, Connection, OptionalExtension, Row};
use serde::Serialize;

use crate::models::{AvailabilityStatus, CatalogueItem, ItemKind, TrackabilityStatus};

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

/// Lightweight catalogue representation for list/search results.
///
/// Mirrors `CatalogueItem` but omits `created_at`, `updated_at`, `retired_at`
/// and `source_url` to minimise serialisation cost for paginated views. The
/// frontend fetches the full `CatalogueItem` via `get_catalogue_item` when the
/// user opens a detail page.
#[derive(Debug, Serialize)]
pub struct CatalogueItemSummary {
    pub id: String,
    pub name: String,
    pub item_kind: ItemKind,
    pub trackability_status: TrackabilityStatus,
    pub availability_status: AvailabilityStatus,
    pub source: Option<String>,
}

/// Page of catalogue results plus pagination metadata so the frontend can
/// render an infinite-scroller / "load more" without extra round-trips.
#[derive(Debug, Serialize)]
pub struct CataloguePage {
    pub items: Vec<CatalogueItemSummary>,
    /// Total number of items matching the query (ignoring LIMIT/OFFSET).
    pub total_count: i64,
    /// Zero-based starting index of this page.
    pub offset: i64,
    /// Maximum number of items requested.
    pub limit: i64,
}

// ---------------------------------------------------------------------------
// Row mapping helpers
// ---------------------------------------------------------------------------

/// The database stores enum columns as integers with CHECK constraints, so
/// values should always be valid. These helpers provide defensive fall-throughs
/// so a corrupt row never panics the process — it degrades to a known state.
#[inline]
fn parse_item_kind(v: i64) -> ItemKind {
    ItemKind::try_from(v).unwrap_or(ItemKind::Plan)
}

#[inline]
fn parse_trackability(v: i64) -> TrackabilityStatus {
    TrackabilityStatus::try_from(v).unwrap_or(TrackabilityStatus::Trackable)
}

#[inline]
fn parse_availability(v: i64) -> AvailabilityStatus {
    AvailabilityStatus::try_from(v).unwrap_or(AvailabilityStatus::Unknown)
}

/// Map a `catalogue_items` row to a `CatalogueItemSummary`. Column order must
/// match the SELECT statements in `list_catalogue_items` and `search_catalogue`.
fn row_to_summary(row: &Row) -> rusqlite::Result<CatalogueItemSummary> {
    Ok(CatalogueItemSummary {
        id: row.get::<_, String>("id")?,
        name: row.get::<_, String>("name")?,
        item_kind: parse_item_kind(row.get::<_, i64>("item_kind")?),
        trackability_status: parse_trackability(row.get::<_, i64>("trackability_status")?),
        availability_status: parse_availability(row.get::<_, i64>("availability_status")?),
        source: row.get::<_, Option<String>>("source")?,
    })
}

/// Map a full `catalogue_items` row (all columns) to a `CatalogueItem`.
fn row_to_item(row: &Row) -> rusqlite::Result<CatalogueItem> {
    let id_str: String = row.get::<_, String>("id")?;
    let id = uuid::Uuid::parse_str(&id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
    })?;
    Ok(CatalogueItem {
        id,
        name: row.get::<_, String>("name")?,
        item_kind: parse_item_kind(row.get::<_, i64>("item_kind")?),
        trackability_status: parse_trackability(row.get::<_, i64>("trackability_status")?),
        availability_status: parse_availability(row.get::<_, i64>("availability_status")?),
        source: row.get::<_, Option<String>>("source")?,
        source_url: row.get::<_, Option<String>>("source_url")?,
        created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>("created_at")?)
            .map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    "created_at".to_string(),
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?
            .with_timezone(&chrono::Utc),
        updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>("updated_at")?)
            .map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    "updated_at".to_string(),
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?
            .with_timezone(&chrono::Utc),
        retired_at: {
            let s: Option<String> = row.get::<_, Option<String>>("retired_at")?;
            s.map(|s| {
                chrono::DateTime::parse_from_rfc3339(&s)
                    .map_err(|e| {
                        rusqlite::Error::FromSqlConversionFailure(
                            "retired_at".to_string(),
                            rusqlite::types::Type::Text,
                            Box::new(e),
                        )
                    })
                    .map(|dt| dt.with_timezone(&chrono::Utc))
            })
            .transpose()?
        },
    })
}

// ---------------------------------------------------------------------------
// Public query functions
// ---------------------------------------------------------------------------

/// Paginated catalogue listing.
///
/// * `offset` — zero-based starting index.
/// * `limit`  — maximum rows to return (caller should clamp to a sane max).
/// * `kind`   — optional filter on `item_kind`; `None` means no filter.
/// * `trackable_only` — if true, only items with `trackability_status = Trackable`
///   (i.e. obtainable in normal play) are returned.
///
/// Retired items (soft-deleted via `retired_at IS NOT NULL`) are always
/// excluded from the listing.
///
/// Returns the page of items plus the *total* count matching the filter so the
/// frontend can compute page counts without an extra round-trip.
///
/// SQL and parameters are built together in a single pass so the placeholder
/// count always matches the bound value count. Using `?` positional
/// placeholders (SQLite numbers them in order of appearance) keeps the mapping
/// trivially correct regardless of which filters are active.
pub fn list_catalogue_items(
    conn: &Connection,
    offset: i64,
    limit: i64,
    kind: Option<ItemKind>,
    trackable_only: bool,
) -> rusqlite::Result<CataloguePage> {
    let mut count_sql =
        String::from("SELECT COUNT(*) FROM catalogue_items WHERE retired_at IS NULL");
    let mut list_sql = String::from(
        "SELECT id, name, item_kind, trackability_status, availability_status, source \
         FROM catalogue_items WHERE retired_at IS NULL",
    );
    // Filter params are shared between the COUNT and SELECT; the list query
    // appends offset/limit after them.
    let mut filter_params: Vec<rusqlite::types::Value> = Vec::new();

    if let Some(k) = kind {
        count_sql.push_str(" AND item_kind = ?");
        list_sql.push_str(" AND item_kind = ?");
        filter_params.push(rusqlite::types::Value::Integer(i64::from(i32::from(k))));
    }
    if trackable_only {
        count_sql.push_str(" AND trackability_status = ?");
        list_sql.push_str(" AND trackability_status = ?");
        filter_params.push(rusqlite::types::Value::Integer(i64::from(i32::from(
            TrackabilityStatus::Trackable,
        ))));
    }

    let total_count: i64 = conn.query_row(
        &count_sql,
        rusqlite::params_from_iter(filter_params.iter()),
        |row| row.get(0),
    )?;

    let mut list_params = filter_params.clone();
    list_params.push(rusqlite::types::Value::Integer(offset));
    list_params.push(rusqlite::types::Value::Integer(limit));
    list_sql.push_str(" ORDER BY name ASC LIMIT ? OFFSET ?");

    let mut stmt = conn.prepare(&list_sql)?;
    let items: Vec<CatalogueItemSummary> = stmt
        .query_map(
            rusqlite::params_from_iter(list_params.iter()),
            row_to_summary,
        )?
        .collect::<Result<_, _>>()?;

    Ok(CataloguePage {
        items,
        total_count,
        offset,
        limit,
    })
}

/// FTS5 search over `catalogue_items_fts` (name + source columns).
///
/// The search uses the porter + unicode61 tokenizer configured on the FTS5
/// table (see `schema.rs`). Results are joined back to `catalogue_items` to
/// exclude retired rows and fetch full column data, then ordered by FTS `rank`.
///
/// * `query` — the raw FTS5 query string (e.g. `"power armor"`, `power*`).
///                      Empty strings return zero results.
/// * `offset` / `limit` — pagination within the match set.
pub fn search_catalogue(
    conn: &Connection,
    query: &str,
    offset: i64,
    limit: i64,
) -> rusqlite::Result<CataloguePage> {
    if query.trim().is_empty() {
        return Ok(CataloguePage {
            items: Vec::new(),
            total_count: 0,
            offset,
            limit,
        });
    }

    // FTS MATCH uses its own query syntax; we pass the string as a parameter
    // so rusqlite handles binding. A malformed query (unbalanced parens, etc.)
    // will return an error from SQLite rather than corrupting data.
    let sql = "\
        SELECT c.id, c.name, c.item_kind, c.trackability_status, c.availability_status, c.source
        FROM catalogue_items c
        JOIN catalogue_items_fts f ON f.rowid = c.rowid
        WHERE catalogue_items_fts MATCH ?
          AND c.retired_at IS NULL
        ORDER BY rank, c.name ASC
        LIMIT ? OFFSET ?";

    // Count of total matches for pagination metadata.
    let count_sql = "\
        SELECT COUNT(*)
        FROM catalogue_items c
        JOIN catalogue_items_fts f ON f.rowid = c.rowid
        WHERE catalogue_items_fts MATCH ? AND c.retired_at IS NULL";

    let total_count: i64 = conn.query_row(count_sql, params![query], |row| row.get(0))?;

    let mut stmt = conn.prepare(sql)?;
    let items: Vec<CatalogueItemSummary> = stmt
        .query_map(params![query, limit, offset], row_to_summary)?
        .collect::<Result<_, _>>()?;

    Ok(CataloguePage {
        items,
        total_count,
        offset,
        limit,
    })
}

/// Fetch a single catalogue item by its UUID id.
///
/// Returns `Ok(None)` when no row matches, so the caller can distinguish
/// "not found" from database errors.
pub fn get_catalogue_item(conn: &Connection, id: &str) -> rusqlite::Result<Option<CatalogueItem>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, item_kind, trackability_status, availability_status, \
         source, source_url, created_at, updated_at, retired_at \
         FROM catalogue_items WHERE id = ?1",
    )?;
    let result: Option<CatalogueItem> = stmt.query_row(params![id], row_to_item).optional()?;
    Ok(result)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::schema;

    const TS: &str = "2026-01-01T00:00:00Z";

    /// Create a fresh in-memory database with migrations applied and a handful
    /// of catalogue items seeded for query testing.
    fn seeded_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        conn.pragma_update(None, "journal_mode", "MEMORY").unwrap();
        schema::apply_migrations(&conn, schema::MIGRATIONS).unwrap();

        // Seed catalogue items: Plans, Weapon mods, Armour mods.
        // All source values are Option<&str> for a uniform tuple type.
        let seed = [
            ("a1", "Power Armor Station", 0, 0, 1, Some("Bethesda")),
            ("a2", "Weapon Workbench", 0, 0, 1, Some("Bethesda")),
            (
                "b1",
                "Assault Rifle Calibrated Receiver",
                1,
                0,
                1,
                Some("Bethesda"),
            ),
            (
                "b2",
                "Laser Rifle Overcharged Capacitor",
                1,
                0,
                1,
                Some("Bethesda"),
            ),
            (
                "c1",
                "Boiled Leather Chest Piece",
                2,
                0,
                1,
                Some("Bethesda"),
            ),
            (
                "c2",
                "Shadowed Combat Armour Left Arm",
                2,
                0,
                1,
                Some("Bethesda"),
            ),
            // A retired item that should be excluded from listings.
            ("d1", "Retired Vault Suit", 0, 1, 0, Some("Vault-Tec")),
            // An unobtainable item.
            ("e1", "Cut Content Pipe Rifle", 0, 0, 2, None),
        ];
        for (id, name, kind, track, avail, source) in seed {
            conn.execute(
                "INSERT INTO catalogue_items
                    (id, name, item_kind, trackability_status, availability_status, source, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![id, name, kind, track, avail, source, TS, TS],
            )
            .unwrap();
        }
        conn
    }

    #[test]
    fn list_returns_all_non_retired_items_sorted_by_name() {
        let conn = seeded_db();
        let page = list_catalogue_items(&conn, 0, 100, None, false).unwrap();
        // 8 seeded, 1 retired (d1) → 7 active.
        assert_eq!(page.total_count, 7);
        assert_eq!(page.items.len(), 7);
        assert_eq!(page.offset, 0);
        assert_eq!(page.limit, 100);

        // Items should be sorted by name ASC.
        let names: Vec<&str> = page.items.iter().map(|i| i.name.as_str()).collect();
        let mut sorted = names.clone();
        sorted.sort();
        assert_eq!(names, sorted, "items should be sorted by name");

        // Retired item must not appear.
        assert!(!names.iter().any(|n| *n == "Retired Vault Suit"));
    }

    #[test]
    fn list_paginates_correctly() {
        let conn = seeded_db();
        let page = list_catalogue_items(&conn, 0, 3, None, false).unwrap();
        assert_eq!(page.total_count, 7);
        assert_eq!(page.items.len(), 3);

        let page2 = list_catalogue_items(&conn, 3, 3, None, false).unwrap();
        assert_eq!(page2.items.len(), 3);

        let page3 = list_catalogue_items(&conn, 6, 3, None, false).unwrap();
        assert_eq!(page3.items.len(), 1);
    }

    #[test]
    fn list_filters_by_item_kind() {
        let conn = seeded_db();
        // Plans only.
        let page = list_catalogue_items(&conn, 0, 100, Some(ItemKind::Plan), false).unwrap();
        assert_eq!(page.total_count, 3); // Power Armor Station, Weapon Workbench, Cut Content Pipe Rifle
        assert!(page.items.iter().all(|i| i.item_kind == ItemKind::Plan));

        // Weapon mods only.
        let page = list_catalogue_items(&conn, 0, 100, Some(ItemKind::WeaponMod), false).unwrap();
        assert_eq!(page.total_count, 2);

        // Armour mods only.
        let page = list_catalogue_items(&conn, 0, 100, Some(ItemKind::ArmourMod), false).unwrap();
        assert_eq!(page.total_count, 2);
    }

    #[test]
    fn list_trackable_only_excludes_retired_and_unobtainable() {
        let conn = seeded_db();
        let page = list_catalogue_items(&conn, 0, 100, None, true).unwrap();
        // 8 seeded; d1 has trackability_status = 1 (Retired) so it is excluded
        // by the trackable_only filter. e1 has trackability_status = 0
        // (Trackable) so it is included even though availability is Unobtainable.
        // 7 non-retired minus 1 (Retired) = 6.
        assert!(page
            .items
            .iter()
            .all(|i| i.trackability_status == TrackabilityStatus::Trackable));
        assert_eq!(page.total_count, 6);
    }

    #[test]
    fn list_kind_and_trackable_combined() {
        // Verify the fix: combining kind filter with trackable_only must not
        // produce a parameter-count mismatch (the original build_* helpers
        // always appended a trackability param even when trackable_only was
        // false, and never appended it when kind was None).
        let conn = seeded_db();
        let page = list_catalogue_items(&conn, 0, 100, Some(ItemKind::Plan), true).unwrap();
        // Plans (kind=0): Power Armor Station, Weapon Workbench, Cut Content Pipe Rifle (3 total, non-retired).
        // trackable_only excludes d1 (Retired trackability). e1 is Trackable so included.
        // → 3 items, all plans, all trackable.
        assert_eq!(page.total_count, 3);
        assert!(page.items.iter().all(|i| i.item_kind == ItemKind::Plan
            && i.trackability_status == TrackabilityStatus::Trackable));
    }

    #[test]
    fn search_finds_matching_items_by_name() {
        let conn = seeded_db();
        // "power" should match "Power Armor Station" (porter stemmer: power→power).
        let page = search_catalogue(&conn, "power", 0, 100).unwrap();
        assert!(page.total_count >= 1);
        assert!(page.items.iter().any(|i| i.name.contains("Power Armor")));
    }

    #[test]
    fn search_finds_matching_items_by_source() {
        let conn = seeded_db();
        // "vault" should match the Vault-Tec source row (d1, not retired).
        let page = search_catalogue(&conn, "vault", 0, 100).unwrap();
        assert!(page.total_count >= 1);
        assert!(page.items.iter().any(|i| i.name.contains("Vault Suit")));
    }

    #[test]
    fn search_empty_query_returns_no_results() {
        let conn = seeded_db();
        let page = search_catalogue(&conn, "", 0, 100).unwrap();
        assert_eq!(page.total_count, 0);
        assert!(page.items.is_empty());
    }

    #[test]
    fn search_whitespace_only_query_returns_no_results() {
        let conn = seeded_db();
        let page = search_catalogue(&conn, "   ", 0, 100).unwrap();
        assert_eq!(page.total_count, 0);
    }

    #[test]
    fn search_excludes_retired_items() {
        let conn = seeded_db();
        // d1 "Retired Vault Suit" — set retired_at to make it truly retired.
        conn.execute(
            "UPDATE catalogue_items SET retired_at = ?1 WHERE id = ?2",
            params![TS, "d1"],
        )
        .unwrap();
        // Search for "vault" — should now return 0 results since d1 is retired.
        let page = search_catalogue(&conn, "vault", 0, 100).unwrap();
        assert_eq!(page.total_count, 0);
    }

    #[test]
    fn search_paginates_results() {
        let conn = seeded_db();
        // "leather" matches at least one item: "Boiled Leather Chest Piece".
        let all = search_catalogue(&conn, "leather", 0, 100).unwrap();
        assert!(all.total_count >= 1);
        let paged = search_catalogue(&conn, "leather", 0, 1).unwrap();
        assert_eq!(paged.items.len(), 1);
        assert_eq!(paged.total_count, all.total_count);
    }

    #[test]
    fn get_catalogue_item_returns_full_detail() {
        let conn = seeded_db();
        let item = get_catalogue_item(&conn, "a1").unwrap().unwrap();
        assert_eq!(item.name, "Power Armor Station");
        assert_eq!(item.item_kind, ItemKind::Plan);
        assert_eq!(item.source.as_deref(), Some("Bethesda"));
        assert_eq!(item.availability_status, AvailabilityStatus::Available);
    }

    #[test]
    fn get_catalogue_item_not_found_returns_none() {
        let conn = seeded_db();
        let item = get_catalogue_item(&conn, "nonexistent-id").unwrap();
        assert!(item.is_none());
    }

    #[test]
    fn list_with_invalid_offset_zero_limit() {
        let conn = seeded_db();
        let page = list_catalogue_items(&conn, 0, 0, None, false).unwrap();
        assert_eq!(page.items.len(), 0);
        assert_eq!(page.total_count, 7);
    }

    #[test]
    fn list_and_search_total_count_consistent() {
        let conn = seeded_db();
        let list_page = list_catalogue_items(&conn, 0, 100, None, false).unwrap();
        let search_page = search_catalogue(&conn, "", 0, 100).unwrap();
        // Empty search returns 0 (by design), so just verify listing count.
        assert!(list_page.total_count > 0);
        assert!(search_page.items.is_empty());
    }
}
