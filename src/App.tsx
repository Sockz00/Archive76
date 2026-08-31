import React from 'react';

/**
 * Root application component for the M2 scaffold.
 *
 * This is intentionally minimal: it confirms the React → Tauri pipeline by
 * calling the backend `ping` command and rendering a "pong" status line. As the
 * application grows, this component becomes the shell for the catalogue UI
 * (catalogue grid, search bar, player/collection state) described in
 * DEVELOPMENT.md §6-7 and AGENTS.md §7-8.
 */
function App() {
  const [backendStatus, setBackendStatus] = React.useState<string>('checking…');

  React.useEffect(() => {
    // @ts-expect-error — tauri API is available only in the Tauri shell.
    const invoke = window.__TAURI__?.invoke;
    if (invoke) {
      invoke('ping')
        .then((result: string) => setBackendStatus(`backend: ${result}`))
        .catch(() => setBackendStatus('backend: error'));
    } else {
      setBackendStatus('backend: not available (vite dev)');
    }
  }, []);

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Archive76</h1>
        <p className="status">{backendStatus}</p>
      </header>
    </div>
  );
}

export default App;
