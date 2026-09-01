/**
 * Test utilities for Tauri bridge mocking.
 *
 * The `mockTauriInvoke` helper replaces `window.__TAURI__.invoke` with a
 * mock that resolves to the provided return value for each command.
 * This lets us test the full React + Query component tree without a real
 * Tauri runtime.
 */

import type { CatalogueItem, CatalogueItemSummary, CataloguePage, DatabaseStatus } from '@/lib/tauri';

export interface MockInvokeHandler {
  (command: string, args?: Record<string, unknown>): Promise<unknown>;
}

/** Install a mock `window.__TAURI__.invoke` on the global window. */
export function mockTauriInvoke(handler: MockInvokeHandler): void {
  (window as unknown as { __TAURI__?: { invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown> } }).__TAURI__ =
    { invoke: handler };
}

/** Remove the mock so subsequent tests see the real (absent) `__TAURI__`. */
export function restoreTauri(): void {
  (
    window as unknown as { __TAURI__?: { invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown> } }
  ).__TAURI__ = undefined;
}

/**
 * Build a realistic `CatalogueItemSummary`-shaped object for test data.
 * Uses a counter for stable unique IDs.
 */
let itemCounter = 0;
export function makeSummary(overrides: Partial<{
  id: string;
  name: string;
  item_kind: 'plan' | 'weapon_mod' | 'armour_mod';
  trackability_status: 'trackable' | 'retired' | 'limited';
  availability_status: 'unknown' | 'available' | 'unobtainable' | 'seasonal';
  source: string | null;
}> = {}): CatalogueItemSummary {
  itemCounter += 1;
  return {
    id: overrides.id ?? `test-item-${itemCounter}`,
    name: overrides.name ?? `Test Item ${itemCounter}`,
    item_kind: overrides.item_kind ?? 'plan',
    trackability_status: overrides.trackability_status ?? 'trackable',
    availability_status: overrides.availability_status ?? 'available',
    source: overrides.source ?? 'TestSource',
    ...overrides,
  };
}

/** Build a `CataloguePage` with the given items. */
export function makePage(items: CatalogueItemSummary[], total?: number): CataloguePage {
  return {
    items,
    total_count: total ?? items.length,
    offset: 0,
    limit: 50,
  };
}

/** Build a `DatabaseStatus` for mocking. */
export function makeDbStatus(overrides: Partial<DatabaseStatus> = {}): DatabaseStatus {
  return {
    path: '/test/archive76.db',
    schema_version: 1,
    catalogue_count: 0,
    player_count: 0,
    ...overrides,
  };
}

/** Build a full `CatalogueItem` for detail-page tests. */
export function makeItem(
  id: string = 'test-item',
  overrides: Partial<CatalogueItem> = {},
): CatalogueItem {
  return {
    id,
    name: overrides.name ?? 'Test Item',
    item_kind: overrides.item_kind ?? 'plan',
    trackability_status: overrides.trackability_status ?? 'trackable',
    availability_status: overrides.availability_status ?? 'available',
    source: overrides.source ?? 'TestSource',
    source_url: overrides.source_url ?? null,
    created_at: overrides.created_at ?? '2026-01-01T00:00:00Z',
    updated_at: overrides.updated_at ?? '2026-01-01T00:00:00Z',
    retired_at: overrides.retired_at ?? null,
  };
}
