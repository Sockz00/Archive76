/**
 * Root application component for Archive76 M2.
 *
 * Integrates the full catalogue browsing experience:
 *  - React Query provider wrapping all data fetching
 *  - Zustand-backed UI state for filters and search
 *  - SearchBar (150ms debounced FTS5 search)
 *  - FilterBar (kind + trackable-only)
 *  - Virtualized CatalogueGrid with infinite scroll
 *  - Loading / error / empty / Tauri-not-available states
 *
 * The database status panel from the scaffold is replaced by the catalogue
 * view when the backend is available; otherwise a setup banner is shown.
 */

import React from 'react';

import { CataloguePage } from '@/components/CataloguePage';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { useCatalogueStore } from '@/lib/store/useCatalogueStore';
import { databaseStatus } from '@/lib/tauri';

function AppContent(): React.ReactElement {
  const [dbStatus, setDbStatus] = React.useState<{
    loaded: boolean;
    error: string | null;
    count: number;
  }>({ loaded: false, error: null, count: 0 });

  React.useEffect(() => {
    void databaseStatus()
      .then((status) => {
        setDbStatus({ loaded: true, error: null, count: Number(status.catalogue_count) });
      })
      .catch((e: unknown) => {
        setDbStatus({
          loaded: true,
          error: e instanceof Error ? e.message : String(e),
          count: 0,
        });
      });
  }, []);

  const filters = useCatalogueStore((s) => ({
    kind: s.kind,
    trackableOnly: s.trackableOnly,
    searchQuery: s.searchQuery,
  }));
  const setKind = useCatalogueStore((s) => s.setKind);
  const setTrackableOnly = useCatalogueStore((s) => s.setTrackableOnly);
  const setSearchQuery = useCatalogueStore((s) => s.setSearchQuery);

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Archive76</h1>
        {dbStatus.loaded && (
          <p className="status">
            {dbStatus.error
              ? `database: ${dbStatus.error}`
              : `catalogue: ${dbStatus.count} items`}
          </p>
        )}
      </header>

      <CataloguePage
        kind={filters.kind}
        setKind={setKind}
        trackableOnly={filters.trackableOnly}
        setTrackableOnly={setTrackableOnly}
        searchQuery={filters.searchQuery}
        setSearchQuery={setSearchQuery}
      />
    </div>
  );
}

function App(): React.ReactElement {
  return (
    <QueryProvider>
      <AppContent />
    </QueryProvider>
  );
}

export default App;
