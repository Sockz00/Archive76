/**
 * Data-fetching hooks for the Archive76 catalogue.
 *
 * These hooks wrap the Tauri invoke bridge with TanStack Query, providing
 * caching, stale-while-revalidate, automatic refetching, and error handling.
 * All queries take `&Connection`-equivalent one-shot calls in the backend,
 * so we paginate on the frontend and never load the entire catalogue into JS
 * memory (AGENTS.md §7/UI Performance, §12/State Management).
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  getCatalogueItem,
  listCatalogueItems,
  searchCatalogue,
} from '@/lib/tauri';
import type {
  CatalogueItem,
  CataloguePage,
  ItemKind,
} from '@/lib/tauri';

/** Page size for catalogue list/search pagination. */
export const PAGE_SIZE = 50;

/** Maximum number of pages to keep cached before garbage collection. */
const CACHE_PAGES = 5;

/**
 * Infinite-scroll query for the catalogue listing.
 *
 * Uses `useInfiniteQuery` so the catalogue grid can implement smooth
 * infinite scrolling. Each page is a separate Tauri invoke, so memory
 * stays bounded regardless of catalogue size.
 *
 * @param kind          Optional item-kind filter. `null` = all kinds.
 * @param trackableOnly If true, exclude non-trackable items.
 * @returns Infinite query result with `fetchNextPage`, `hasNextPage`, etc.
 */
export function useCatalogueList(
  kind: ItemKind | null,
  trackableOnly: boolean,
) {
  return useInfiniteQuery<CataloguePage, Error>({
    // Query key changes when filters change — TanStack Query invalidates
    // and refetches automatically, giving us stale-while-revalidate.
    queryKey: ['catalogue', kind, trackableOnly],
    queryFn: async ({ pageParam }) => {
      const offset = ((pageParam as number | undefined) ?? 0) * PAGE_SIZE;
      const page = await listCatalogueItems({
        offset,
        limit: PAGE_SIZE,
        kind,
        trackable_only: trackableOnly,
      });
      return page;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const fetched = lastPage.offset + lastPage.items.length;
      // If we haven't fetched everything, there's a next page.
      if (fetched < lastPage.total_count) {
        return lastPage.offset / PAGE_SIZE + 1;
      }
      return undefined;
    },
    // Keep a few pages cached for smooth back-scroll.
    maxPages: CACHE_PAGES,
    // Stale after 5 seconds — a quick refetch on refocus keeps data fresh
    // without hammering the backend.
    staleTime: 5_000,
    gcTime: 60_000,
  });
}

/**
 * Search query using FTS5. Debounced at the call site (SearchBar) so every
 * keystroke doesn't trigger a query.
 *
 * @param query         The FTS5 query string. Empty = no results (by design in Rust).
 * @param options       Optional pagination overrides.
 * @returns Query result with the current page of matches.
 */
export function useCatalogueSearch(
  query: string,
  options?: { enabled?: boolean },
) {
  return useQuery<CataloguePage, Error>({
    queryKey: ['search', query, PAGE_SIZE],
    queryFn: () => searchCatalogue({ query, offset: 0, limit: PAGE_SIZE }),
    // Don't fire the query until we have a non-empty string.
    enabled: options?.enabled ?? query.trim().length > 0,
    staleTime: 5_000,
    gcTime: 60_000,
  });
}

/**
 * Detail query for a single catalogue item by id.
 *
 * @param id  UUID string of the item, or `null` when no item is selected.
 */
export function useCatalogueItem(id: string | null) {
  return useQuery<CatalogueItem | null, Error>({
    queryKey: ['item', id],
    // Return null immediately when no id is selected — avoids an unnecessary
    // Tauri invoke that would just fail.
    queryFn: id ? () => getCatalogueItem(id) : () => null,
    enabled: id !== null,
    staleTime: 30_000,
    gcTime: 120_000,
  });
}
