import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/catalogue.css';

/**
 * M2 scaffold entry point.
 *
 * Renders the root <App /> into the #root div mounted by Tauri's index.html.
 * When hosted by the Tauri shell (not the Vite dev server), the
 * @tauri-apps/api bindings are available; in the browser dev server they are
 * stubbed via a no-op implementation so `vite dev` works standalone.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
