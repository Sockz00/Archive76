import React from 'react';

/** Database status returned by the Rust `database_status` command. */
interface DatabaseStatus {
  path: string;
  schema_version: number;
  catalogue_count: number;
  player_count: number;
}

/**
 * Root application component for the M2 scaffold.
 *
 * This is the first end-to-end vertical slice: React calls the Rust
 * `ping` and `database_status` Tauri commands, proving the entire
 * Tauri shell + SQLite layer is wired correctly. The catalogue UI
 * (catalogue grid, search bar, player/collection state) replaces
 * the status lines as the M2 workstreams progress.
 */
function App() {
  const [backendStatus, setBackendStatus] = React.useState<string>('checking…');
  const [dbStatus, setDbStatus] = React.useState<DatabaseStatus | null>(null);
  const [dbError, setDbError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // The Tauri global is only available when running inside the
    // Tauri shell; vite dev in a plain browser lacks it.
    // @ts-expect-error — tauri API is available only in the Tauri shell.
    const invoke = window.__TAURI__?.invoke;
    if (!invoke) {
      setBackendStatus('backend: not available (vite dev)');
      return;
    }

    invoke('ping')
      .then((result: string) => setBackendStatus(`backend: ${result}`))
      .catch(() => setBackendStatus('backend: error'));

    invoke('database_status')
      .then((result: DatabaseStatus) => {
        setDbStatus(result);
        setDbError(null);
      })
      .catch((e: unknown) => setDbError(typeof e === 'string' ? e : JSON.stringify(e)));
  }, []);

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Archive76</h1>
        <p className="status">{backendStatus}</p>
      </header>
      <section className="db-panel">
        <h2>Database</h2>
        {dbError && <p className="status error">error: {dbError}</p>}
        {dbStatus && (
          <dl>
            <dt>path</dt>
            <dd>{dbStatus.path}</dd>
            <dt>schema version</dt>
            <dd>{dbStatus.schema_version}</dd>
            <dt>catalogue items</dt>
            <dd>{dbStatus.catalogue_count}</dd>
            <dt>players</dt>
            <dd>{dbStatus.player_count}</dd>
          </dl>
        )}
        {!dbStatus && !dbError && <p className="status">initializing…</p>}
      </section>
    </div>
  );
}

export default App;
