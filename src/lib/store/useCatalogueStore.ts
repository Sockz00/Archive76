/**
 * Zustand store for UI state that doesn't belong in TanStack Query.
 *
 * This covers:
 *  - Active filters (item kind, trackable-only)
 *  - Current search query
 *  - View preferences
 *
 * Catalogue data itself lives in TanStack Query (async server/native data);
 * this store only holds the user's filter/search selections.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { ItemKind } from '@/lib/tauri';

export interface CatalogueUIState {
  /** Selected item-kind filter. `null` = all kinds. */
  kind: ItemKind | null;
  /** Whether only trackable items are shown. */
  trackableOnly: boolean;
  /** Current search query string. */
  searchQuery: string;
  /** Currently selected player id (future use). */
  activePlayerId: string | null;
}

export interface CatalogueUIActions {
  setKind: (kind: ItemKind | null) => void;
  setTrackableOnly: (only: boolean) => void;
  setSearchQuery: (query: string) => void;
  /** Reset all filters to defaults. */
  resetFilters: () => void;
  setActivePlayerId: (id: string | null) => void;
}

export type CatalogueUIStore = CatalogueUIState & CatalogueUIActions;

export const useCatalogueStore = create<CatalogueUIStore>()(
  subscribeWithSelector((set) => ({
    kind: null,
    trackableOnly: false,
    searchQuery: '',
    activePlayerId: null,

    setKind: (kind) => set({ kind }),
    setTrackableOnly: (only) => set({ trackableOnly: only }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    resetFilters: () =>
      set({ kind: null, trackableOnly: false, searchQuery: '' }),
    setActivePlayerId: (id) => set({ activePlayerId: id }),
  })),
);

/**
 * Selectors — using individual selectors avoids unnecessary re-renders
 * when only one slice of state changes.
 */
export const useCatalogueFilters = (): {
  kind: ItemKind | null;
  trackableOnly: boolean;
  searchQuery: string;
  setKind: (kind: ItemKind | null) => void;
  setTrackableOnly: (only: boolean) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
} => {
  const kind = useCatalogueStore((s) => s.kind);
  const trackableOnly = useCatalogueStore((s) => s.trackableOnly);
  const searchQuery = useCatalogueStore((s) => s.searchQuery);
  const setKind = useCatalogueStore((s) => s.setKind);
  const setTrackableOnly = useCatalogueStore((s) => s.setTrackableOnly);
  const setSearchQuery = useCatalogueStore((s) => s.setSearchQuery);
  const resetFilters = useCatalogueStore((s) => s.resetFilters);
  return { kind, trackableOnly, searchQuery, setKind, setTrackableOnly, setSearchQuery, resetFilters };
};

export const useActivePlayerId = (): string | null =>
  useCatalogueStore((s) => s.activePlayerId);

export const useSetActivePlayerId = (): ((id: string | null) => void) =>
  useCatalogueStore((s) => s.setActivePlayerId);
