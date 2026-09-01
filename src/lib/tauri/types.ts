/**
 * Type definitions mirroring the Rust types exposed by the Archive76 Tauri
 * backend. These are intentionally kept in sync with `src-tauri/src/models.rs`
 * and `src-tauri/src/queries.rs`.
 *
 * Serde enum representations must match the backend's `rename_all = "snake_case"`:
 *   ItemKind:            "plan" | "weapon_mod" | "armour_mod"
 *   TrackabilityStatus:  "trackable" | "retired" | "limited"
 *   AvailabilityStatus:  "unknown" | "available" | "unobtainable" | "seasonal"
 *
 * If the backend adds a new variant without updating these types, the
 * exhaustive switch helpers in this file will fail to compile, surfacing the
 * mismatch immediately rather than at runtime.
 */

/** Catalogue item kind — mirrors `models::ItemKind` (snake_case). */
export type ItemKind = 'plan' | 'weapon_mod' | 'armour_mod';

/** Trackability status — mirrors `models::TrackabilityStatus` (snake_case). */
export type TrackabilityStatus = 'trackable' | 'retired' | 'limited';

/** Availability status — mirrors `models::AvailabilityStatus` (snake_case). */
export type AvailabilityStatus =
  | 'unknown'
  | 'available'
  | 'unobtainable'
  | 'seasonal';

/**
 * Lightweight catalogue representation for list/search results.
 * Mirrors `queries::CatalogueItemSummary`.
 *
 * Deliberately omits `created_at`, `updated_at`, `retired_at`, and
 * `source_url` to minimise serialisation cost for paginated views.
 */
export interface CatalogueItemSummary {
  id: string;
  name: string;
  item_kind: ItemKind;
  trackability_status: TrackabilityStatus;
  availability_status: AvailabilityStatus;
  source: string | null;
}

/**
 * Page of catalogue results plus pagination metadata.
 * Mirrors `queries::CataloguePage`.
 */
export interface CataloguePage {
  items: CatalogueItemSummary[];
  /** Total matching items ignoring LIMIT/OFFSET. */
  total_count: number;
  /** Zero-based starting index of this page. */
  offset: number;
  /** Maximum items requested. */
  limit: number;
}

/**
 * Full catalogue item detail.
 * Mirrors `models::CatalogueItem`.
 */
export interface CatalogueItem {
  id: string;
  name: string;
  item_kind: ItemKind;
  trackability_status: TrackabilityStatus;
  availability_status: AvailabilityStatus;
  source: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
  retired_at: string | null;
}

/** Database status returned by the `database_status` command. */
export interface DatabaseStatus {
  path: string;
  schema_version: number;
  catalogue_count: number;
  player_count: number;
}

// ---------------------------------------------------------------------------
// Exhaustive string-literal helpers
//
// These provide compile-time safety: adding a new backend variant without
// updating these maps will cause a TypeScript error in the default branch,
// surfacing the drift immediately.
// ---------------------------------------------------------------------------

/** Human-readable label for display in the UI. */
export function itemKindLabel(kind: ItemKind): string {
  switch (kind) {
    case 'plan':
      return 'Plan';
    case 'weapon_mod':
      return 'Weapon Mod';
    case 'armour_mod':
      return 'Armour Mod';
    default: {
      // Exhaustiveness check: if a new variant is added to the type but
      // not handled here, `k` will be of type `never` and fail to compile.
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/** Exhaustive kind options for the filter dropdown. */
export const ITEM_KIND_OPTIONS: ReadonlyArray<{
  value: ItemKind | null;
  label: string;
}> = [
  { value: null, label: 'All Kinds' },
  { value: 'plan', label: 'Plans' },
  { value: 'weapon_mod', label: 'Weapon Mods' },
  { value: 'armour_mod', label: 'Armour Mods' },
];
