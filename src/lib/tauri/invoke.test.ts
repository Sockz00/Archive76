/**
 * Tests for the Tauri invoke bridge validators.
 *
 * These verify that the runtime validators in `invoke.ts` correctly
 * accept valid backend payloads and reject malformed ones, ensuring
 * type safety at the Rust→JS boundary.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  databaseStatus,
  getCatalogueItem,
  listCatalogueItems,
  ping,
  searchCatalogue,
  TauriNotAvailableError,
} from '@/lib/tauri/invoke';
import { mockTauriInvoke, restoreTauri } from '@/lib/test/mockTauri';

describe('invoke bridge', () => {
  afterEach(() => {
    restoreTauri();
  });

  describe('ping', () => {
    it('returns the ping result string', async () => {
      mockTauriInvoke((cmd) => {
        if (cmd === 'ping') return Promise.resolve('pong');
        return Promise.reject(new Error(`unexpected: ${cmd}`));
      });
      const result = await ping();
      expect(result).toBe('pong');
    });

    it('throws TauriNotAvailableError when __TAURI__ is absent', async () => {
      restoreTauri();
      await expect(ping()).rejects.toThrow(TauriNotAvailableError);
    });

    it('throws on non-string response', async () => {
      mockTauriInvoke(() => Promise.resolve(42));
      await expect(ping()).rejects.toThrow('expected string');
    });
  });

  describe('databaseStatus', () => {
    it('parses a valid response', async () => {
      mockTauriInvoke((cmd) => {
        if (cmd === 'database_status') {
          return Promise.resolve({
            path: '/data/archive76.db',
            schema_version: 1,
            catalogue_count: 42,
            player_count: 3,
          });
        }
        return Promise.reject(new Error(`unexpected: ${cmd}`));
      });
      const result = await databaseStatus();
      expect(result).toEqual({
        path: '/data/archive76.db',
        schema_version: 1,
        catalogue_count: 42,
        player_count: 3,
      });
    });

    it('defaults to zero for missing numeric fields', async () => {
      mockTauriInvoke((cmd) => {
        if (cmd === 'database_status') {
          return Promise.resolve({ path: '/x.db' });
        }
        return Promise.reject(new Error(`unexpected: ${cmd}`));
      });
      const result = await databaseStatus();
      expect(result.schema_version).toBe(0);
      expect(result.catalogue_count).toBe(0);
      expect(result.player_count).toBe(0);
    });

    it('throws on non-object response', async () => {
      mockTauriInvoke(() => Promise.resolve('not an object'));
      await expect(databaseStatus()).rejects.toThrow('expected object');
    });
  });

  describe('listCatalogueItems', () => {
    it('passes correct args to invoke', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        items: [],
        total_count: 0,
        offset: 0,
        limit: 50,
      });
      mockTauriInvoke(mockInvoke as unknown as (cmd: string, args?: Record<string, unknown>) => Promise<unknown>);

      await listCatalogueItems({ offset: 100, limit: 20, kind: 'weapon_mod', trackable_only: true });

      expect(mockInvoke).toHaveBeenCalledWith('list_catalogue_items', {
        offset: 100,
        limit: 20,
        kind: 'weapon_mod',
        trackable_only: true,
      });
    });

    it('uses defaults when args omitted', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        items: [],
        total_count: 0,
        offset: 0,
        limit: 50,
      });
      mockTauriInvoke(mockInvoke as unknown as (cmd: string, args?: Record<string, unknown>) => Promise<unknown>);

      await listCatalogueItems();

      expect(mockInvoke).toHaveBeenCalledWith('list_catalogue_items', {
        offset: 0,
        limit: 50,
        kind: null,
        trackable_only: false,
      });
    });

    it('validates CataloguePage shape', async () => {
      mockTauriInvoke(() =>
        Promise.resolve({
          items: [
            {
              id: 'a1',
              name: 'Test',
              item_kind: 'plan',
              trackability_status: 'trackable',
              availability_status: 'available',
              source: 'Bethesda',
            },
          ],
          total_count: 1,
          offset: 0,
          limit: 50,
        }),
      );
      const result = await listCatalogueItems();
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.item_kind).toBe('plan');
      expect(result.total_count).toBe(1);
    });

    it('throws on invalid item_kind', async () => {
      mockTauriInvoke(() =>
        Promise.resolve({
          items: [
            {
              id: 'a1',
              name: 'Test',
              item_kind: 'INVALID_KIND',
              trackability_status: 'trackable',
              availability_status: 'available',
              source: null,
            },
          ],
          total_count: 1,
          offset: 0,
          limit: 50,
        }),
      );
      await expect(listCatalogueItems()).rejects.toThrow('item_kind');
    });

    it('accepts null source', async () => {
      mockTauriInvoke(() =>
        Promise.resolve({
          items: [
            {
              id: 'a1',
              name: 'Test',
              item_kind: 'plan',
              trackability_status: 'trackable',
              availability_status: 'available',
              source: null,
            },
          ],
          total_count: 1,
          offset: 0,
          limit: 50,
        }),
      );
      const result = await listCatalogueItems();
      expect(result.items[0]?.source).toBeNull();
    });
  });

  describe('searchCatalogue', () => {
    it('passes query and pagination args', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        items: [],
        total_count: 0,
        offset: 0,
        limit: 50,
      });
      mockTauriInvoke(mockInvoke as unknown as (cmd: string, args?: Record<string, unknown>) => Promise<unknown>);

      await searchCatalogue({ query: 'power armor', offset: 0, limit: 10 });

      expect(mockInvoke).toHaveBeenCalledWith('search_catalogue', {
        query: 'power armor',
        offset: 0,
        limit: 10,
      });
    });
  });

  describe('getCatalogueItem', () => {
    it('returns null when backend returns null (not found)', async () => {
      mockTauriInvoke((cmd) => {
        if (cmd === 'get_catalogue_item') return Promise.resolve(null);
        return Promise.reject(new Error(`unexpected: ${cmd}`));
      });
      const result = await getCatalogueItem('nonexistent');
      expect(result).toBeNull();
    });

    it('parses a full CatalogueItem', async () => {
      mockTauriInvoke((cmd) => {
        if (cmd === 'get_catalogue_item') {
          return Promise.resolve({
            id: 'a1',
            name: 'Power Armor Station',
            item_kind: 'plan',
            trackability_status: 'trackable',
            availability_status: 'available',
            source: 'Bethesda',
            source_url: 'https://example.com',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
            retired_at: null,
          });
        }
        return Promise.reject(new Error(`unexpected: ${cmd}`));
      });
      const result = await getCatalogueItem('a1');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Power Armor Station');
      expect(result?.item_kind).toBe('plan');
      expect(result?.source_url).toBe('https://example.com');
    });
  });
});
