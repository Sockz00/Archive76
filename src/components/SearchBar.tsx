/**
 * Search bar with 150ms debounced input.
 *
 * The actual search invocation is handled via the `useCatalogueSearch` hook
 * (which fires only when the query is non-empty). This component manages only
 * the local text input state and fires `onSearch` after the debounce window.
 *
 * A 150ms debounce (per ROADMAP §1.3) strikes the right balance: short enough
 * to feel responsive while typing, long enough to avoid a Tauri invoke +
 * SQLite FTS5 query on every keystroke.
 */

import React from 'react';

export interface SearchBarProps {
  /** Current search query (controlled). */
  value: string;
  /** Called after the debounce window with the final query. */
  onSearch: (query: string) => void;
  /** Placeholder shown when the input is empty. */
  placeholder?: string;
  /** Optional search result count to display. */
  resultCount?: number;
}

/** Debounce delay in milliseconds. */
const DEBOUNCE_MS = 150;

export function SearchBar({
  value,
  onSearch,
  placeholder = 'Search plans, mods…',
  resultCount,
}: SearchBarProps): React.ReactElement {
  const [inputValue, setInputValue] = React.useState(value);

  // Keep the local input in sync if the parent changes `value` (e.g. user
  // clears via a "Reset filters" button).
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const emit = React.useCallback(
    (val: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onSearch(val);
      }, DEBOUNCE_MS);
    },
    [onSearch],
  );

  // Clean up the debounce timer on unmount to prevent a state update on an
  // unmounted component.
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      emit(val);
    },
    [emit],
  );

  const handleClear = React.useCallback(() => {
    setInputValue('');
    onSearch('');
  }, [onSearch]);

  const showClear = inputValue.length > 0;

  return (
    <div className="search-bar" role="search">
      <label htmlFor="catalogue-search" className="search-label">
        Search catalogue
      </label>
      <div className="search-input-wrapper">
        <svg
          className="search-icon"
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="15.636" y2="15.636" />
        </svg>
        <input
          id="catalogue-search"
          type="search"
          className="search-input"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label="Search catalogue items"
          aria-autocomplete="list"
          spellCheck={false}
        />
        {showClear && (
          <button
            type="button"
            className="search-clear"
            onClick={handleClear}
            aria-label="Clear search"
            tabIndex={0}
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      {/* Live region for screen readers: announce result count. */}
      {inputValue && resultCount !== undefined && (
        <div
          className="search-results-count"
          aria-live="polite"
          aria-atomic="true"
        >
          {resultCount === 0
            ? 'No matches found'
            : `${resultCount} match${resultCount === 1 ? '' : 'es'} found`}
        </div>
      )}
    </div>
  );
}
