/**
 * Catalogue page — the main browsing view.
 *
 * Combines SearchBar, FilterBar, and CatalogueGrid with:
 *  - Mode toggle: "Browse" (list + filters) vs "Search" (FTS5 search)
 *  - Infinite scrolling via React Query + IntersectionObserver
 *  - Loading, error, and empty states
 *  - Tauri-not-available graceful fallback for `vite dev`
 */

import React from 'react';

import { CatalogueGrid } from '@/components/CatalogueGrid';
import { FilterBar } from '@/components/FilterBar';
import { SearchBar } from '@/components/SearchBar';
import { useCatalogueList, useCatalogueSearch } from '@/lib/hooks/useCatalogue';
import type { ItemKind } from '@/lib/tauri';
import { TauriNotAvailableError } from '@/lib/tauri';

export interface CataloguePageProps {
  kind: ItemKind | null;
  setKind: (kind: ItemKind | null) => void;
  trackableOnly: boolean;
  setTrackableOnly: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

/**
 * A thin wrapper around a scroll-sentinel element that triggers
 * `onVisible` when it scrolls into the viewport via IntersectionObserver.
 */
function InfinityLoader({ onVisible }: { onVisible: () => void }): React.ReactElement {
  const ref = React.useRef<HTMLDivElement>(null);
  const [observer] = React.useState(() => {
    if (typeof IntersectionObserver === 'undefined') return null;
    return new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onVisible();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 },
    );
  });

  React.useEffect(() => {
    if (!observer || !ref.current) return;
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [observer, onVisible]);

  return <div ref={ref} className="infinity-loader" />;
}

export function CataloguePage({
  kind,
  setKind,
  trackableOnly,
  setTrackableOnly,
  searchQuery,
  setSearchQuery,
}: CataloguePageProps): React.ReactElement {
  const mode: 'browse' | 'search' = searchQuery.trim().length > 0 ? 'search' : 'browse';

  // --- Data queries ---
  const listQuery = useCatalogueList(kind, trackableOnly);
  const searchQ = useCatalogueSearch(searchQuery, {
    enabled: searchQuery.trim().length > 0,
  });

  // Select the active query based on mode.
  // In search mode, we use the search query (single page).
  // In browse mode, we use the infinite list query.
  const isLoadingInitial = mode === 'search' ? searchQ.isLoading : listQuery.isInitialLoading;
  const isErrorState = mode === 'search' ? searchQ.isError : listQuery.isError;
  const activeError = mode === 'search' ? searchQ.error : listQuery.error;

  // Flatten pages for browse mode, or extract single page for search mode.
  const allItems = React.useMemo(() => {
    if (mode === 'search') {
      // Search returns a single page of results.
      return searchQ.data?.items ?? [];
    }
    // Browse mode: flatten all pages.
    return listQuery.data?.pages.flatMap((p) => p.items) ?? [];
  }, [mode, listQuery.data, searchQ.data?.items]);

  const totalCount = React.useMemo(() => {
    if (mode === 'search') {
      return searchQ.data?.total_count ?? 0;
    }
    return listQuery.data?.pages[0]?.total_count ?? 0;
  }, [mode, listQuery.data, searchQ.data?.total_count]);

  // Infinite scroll controls (browse mode only).
  const hasNextPage = mode === 'browse' ? listQuery.hasNextPage : undefined;
  const isFetchingNextPage = mode === 'browse' ? listQuery.isFetchingNextPage : false;
  const fetchNextPage = listQuery.fetchNextPage;

  const handleLoadMore = React.useCallback(() => {
    if (mode === 'browse' && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [mode, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Check for Tauri-not-available errors.
  const tauriError = React.useMemo(() => {
    if (isErrorState && activeError instanceof TauriNotAvailableError) {
      return activeError;
    }
    return null;
  }, [isErrorState, activeError]);

  return (
    <section className="catalogue-page">
      <header className="catalogue-header">
        <SearchBar
          value={searchQuery}
          onSearch={setSearchQuery}
          resultCount={mode === 'search' ? totalCount : undefined}
        />
        {mode === 'browse' && (
          <FilterBar
            selectedKind={kind}
            trackableOnly={trackableOnly}
            onKindChange={setKind}
            onTrackableChange={setTrackableOnly}
          />
        )}
      </header>

      <main className="catalogue-content">
        {tauriError ? (
          <div className="error-state" role="alert">
            <p>Backend not available.</p>
            <p className="hint">
              Run the app from the Tauri shell (<code>npm run tauri:dev</code>)
              to access the local database.
            </p>
          </div>
        ) : isErrorState ? (
          <div className="error-state" role="alert">
            <p>Something went wrong while loading the catalogue.</p>
            <p className="hint">{activeError?.message}</p>
          </div>
        ) : isLoadingInitial ? (
          <div className="loading-state" role="status">
            <p>Loading catalogue…</p>
          </div>
        ) : allItems.length === 0 ? (
          <div className="empty-state" role="status">
            <p>
              {mode === 'search'
                ? 'No items match your search.'
                : 'No items match your current filters.'}
            </p>
          </div>
        ) : (
          <>
            <CatalogueGrid
              items={allItems}
              totalCount={totalCount}
              selectedId={null}
              onSelect={() => {}}
            />
            {/* Infinite scroll sentinel for browse mode */}
            {mode === 'browse' && hasNextPage !== undefined && hasNextPage && (
              <InfinityLoader onVisible={handleLoadMore} />
            )}
            {/* Loading more indicator */}
            {mode === 'browse' && listQuery.isFetching && (
              <div className="loading-more" role="status">
                <p>Loading more…</p>
              </div>
            )}
          </>
        )}
      </main>
    </section>
  );
}
