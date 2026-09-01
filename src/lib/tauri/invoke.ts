/**
 * Tauri invoke bridge layer.
 *
 * Wraps `window.__TAURI__?.invoke(...)` with typed, testable helpers.
 * In a Vite dev-server preview (no Tauri shell), `__TAURI__` is undefined;
 * all invoke helpers reject with a descriptive `TauriNotAvailableError`
 * so callers can render a graceful fallback instead of crashing.
 *
 * Each helper maps 1:1 to a `#[tauri::command]` in `src-tauri/src/lib.rs`.
 */

import type {
  AvailabilityStatus,
  CatalogueItem,
  CatalogueItemSummary,
  CataloguePage,
  DatabaseStatus,
  ItemKind,
  TrackabilityStatus,
} from './types';

/** Thrown when `window.__TAURI__` is absent (running outside the Tauri shell). */
export class TauriNotAvailableError extends Error {
  constructor(
    public readonly command: string,
    message = 'Tauri invoke bridge is not available (running in browser).',
  ) {
    super(`${message} Command: ${command}`);
    this.name = 'TauriNotAvailableError';
  }
}

/** Resolve the invoke function or throw a typed error. */
function getInvoke(): (command: string, args?: Record<string, unknown>) => Promise<unknown> {
  // @ts-expect-error — __TAURI__ is injected by the Tauri runtime at build time.
  const invoke = window.__TAURI__?.invoke;
  if (typeof invoke !== 'function') {
    throw new TauriNotAvailableError('(resolve)');
  }
  return invoke;
}

/**
 * Generic invoke wrapper that coerces the result through a validator.
 * Using a validator function keeps the bridge decoupled from the real backend
 * types — tests can inject mock data easily.
 */
function invokeTyped<T>(
  command: string,
  args: Record<string, unknown> | undefined,
  validate: (v: unknown) => T,
): Promise<T> {
  const invoke = getInvoke();
  return invoke(command, args).then(validate);
}

// ---------------------------------------------------------------------------
// Ping — health check
// ---------------------------------------------------------------------------

export async function ping(): Promise<string> {
  return invokeTyped('ping', undefined, (v): string => {
    if (typeof v !== 'string') {
      throw new Error(`ping: expected string, got ${typeof v}`);
    }
    return v;
  });
}

// ---------------------------------------------------------------------------
// Database status
// ---------------------------------------------------------------------------

export async function databaseStatus(): Promise<DatabaseStatus> {
  return invokeTyped('database_status', undefined, (v): DatabaseStatus => {
    if (v === null || typeof v !== 'object') {
      throw new Error('database_status: expected object');
    }
    const r = v as Record<string, unknown>;
    return {
      path: typeof r.path === 'string' ? r.path : '',
      schema_version: typeof r.schema_version === 'number' ? r.schema_version : 0,
      catalogue_count: typeof r.catalogue_count === 'number' ? r.catalogue_count : 0,
      player_count: typeof r.player_count === 'number' ? r.player_count : 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Catalogue listing
// ---------------------------------------------------------------------------

const VALID_ITEM_KINDS = new Set(['plan', 'weapon_mod', 'armour_mod']);
const VALID_TRACKABILITY = new Set(['trackable', 'retired', 'limited']);
const VALID_AVAILABILITY = new Set([
  'unknown',
  'available',
  'unobtainable',
  'seasonal',
]);

export function validateItemKind(v: unknown): ItemKind {
  if (typeof v !== 'string' || !VALID_ITEM_KINDS.has(v)) {
    throw new Error(`item_kind: invalid value ${JSON.stringify(v)}`);
  }
  return v as ItemKind;
}

export function validateTrackability(v: unknown): TrackabilityStatus {
  if (typeof v !== 'string' || !VALID_TRACKABILITY.has(v)) {
    throw new Error(`trackability_status: invalid value ${JSON.stringify(v)}`);
  }
  return v as TrackabilityStatus;
}

function validateAvailability(v: unknown): AvailabilityStatus {
  if (typeof v !== 'string' || !VALID_AVAILABILITY.has(v)) {
    throw new Error(`availability_status: invalid value ${JSON.stringify(v)}`);
  }
  return v as AvailabilityStatus;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object';
}

function isCatalogueItemSummary(v: unknown): v is CatalogueItemSummary {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.item_kind === 'string' &&
    typeof v.trackability_status === 'string' &&
    typeof v.availability_status === 'string'
    // source: string | null — both are acceptable
  );
}

function validateItemSummary(v: unknown): CatalogueItemSummary {
  if (!isCatalogueItemSummary(v)) {
    throw new Error(`CatalogueItemSummary: invalid shape ${JSON.stringify(v)}`);
  }
  return {
    id: v.id,
    name: v.name,
    item_kind: validateItemKind(v.item_kind),
    trackability_status: validateTrackability(v.trackability_status),
    availability_status: validateAvailability(v.availability_status),
    source: v.source === null || typeof v.source === 'string' ? v.source : null,
  };
}

function validatePage(v: unknown): CataloguePage {
  if (v === null || typeof v !== 'object') {
    throw new Error('CataloguePage: expected object');
  }
  const r = v as Record<string, unknown>;
  const itemsRaw = r.items;
  if (!Array.isArray(itemsRaw)) {
    throw new Error('CataloguePage.items: expected array');
  }
  const items = itemsRaw.map(validateItemSummary);
  return {
    items,
    total_count: typeof r.total_count === 'number' ? r.total_count : 0,
    offset: typeof r.offset === 'number' ? r.offset : 0,
    limit: typeof r.limit === 'number' ? r.limit : 0,
  };
}

export interface ListCatalogueArgs {
  offset?: number;
  limit?: number;
  kind?: ItemKind | null;
  trackable_only?: boolean;
}

/**
 * Paginated catalogue listing.
 * Mirrors the `list_catalogue_items` Tauri command.
 */
export async function listCatalogueItems(args: ListCatalogueArgs = {}): Promise<CataloguePage> {
  const {
    offset = 0,
    limit = 50,
    kind = null,
    trackable_only = false,
  } = args;
  return invokeTyped(
    'list_catalogue_items',
    { offset, limit, kind, trackable_only },
    validatePage,
  );
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchCatalogueArgs {
  query: string;
  offset?: number;
  limit?: number;
}

/**
 * FTS5 search over catalogue item names and sources.
 * Mirrors the `search_catalogue` Tauri command.
 */
export async function searchCatalogue(args: SearchCatalogueArgs): Promise<CataloguePage> {
  const { query, offset = 0, limit = 50 } = args;
  return invokeTyped(
    'search_catalogue',
    { query, offset, limit },
    validatePage,
  );
}

// ---------------------------------------------------------------------------
// Item detail
// ---------------------------------------------------------------------------

function validateItem(v: unknown): CatalogueItem | null {
  if (v === null) return null;
  if (typeof v !== 'object') {
    throw new Error('CatalogueItem: expected object or null');
  }
  const r = v as Record<string, unknown>;
  return {
    id: typeof r.id === 'string' ? r.id : '',
    name: typeof r.name === 'string' ? r.name : '',
    item_kind: validateItemKind(r.item_kind),
    trackability_status: validateTrackability(r.trackability_status),
    availability_status: validateAvailability(r.availability_status),
    source: r.source === null || typeof r.source === 'string' ? r.source : null,
    source_url:
      r.source_url === null || typeof r.source_url === 'string'
        ? r.source_url
        : null,
    created_at: typeof r.created_at === 'string' ? r.created_at : '',
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : '',
    retired_at:
      r.retired_at === null || typeof r.retired_at === 'string'
        ? r.retired_at
        : null,
  };
}

/**
 * Fetch full detail for a single catalogue item by UUID id.
 * Mirrors the `get_catalogue_item` Tauri command.
 * Returns `null` when no item matches.
 */
export async function getCatalogueItem(id: string): Promise<CatalogueItem | null> {
  return invokeTyped('get_catalogue_item', { id }, validateItem);
}
