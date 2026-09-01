/**
 * Virtualized catalogue grid.
 *
 * Uses @tanstack/react-virtual to render only the items visible in the
 * viewport plus a small overscan, keeping React's mounted-component count
 * bounded regardless of catalogue size (AGENTS.md §7, AD-007).
 *
 * The grid computes a responsive column count based on container width and
 * a fixed `CARD_MIN_WIDTH` so it degrades gracefully from 1 column on narrow
 * windows to many columns on wide displays.
 */

import React from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';

import type { CatalogueItemSummary } from '@/lib/tauri';
import { itemKindLabel } from '@/lib/tauri';

/** Minimum card width before a new column is added. */
const CARD_MIN_WIDTH = 240;

/** Number of extra rows rendered above/below the viewport for scroll smoothness. */
const OVERSCAN = 5;

export interface CatalogueGridProps {
  /** Items to display. */
  items: CatalogueItemSummary[];
  /** Total count of items matching the current query (for empty-state). */
  totalCount: number;
  /** Optional selected item id (for highlight/aria). */
  selectedId?: string | null;
  /** Callback when a card is clicked. */
  onSelect?: (id: string) => void;
  /** Estimated row height for virtual row measurement. */
  rowHeight?: number;
}

// A simple hash for stable item keys — avoids importing a hashing library
// for a function this simple. Uses string length + char codes.
function stableKey(str: string, index: number): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return `${hash >>> 0}-${index}`;
}

/**
 * Render a single catalogue summary card. Memoized so it only re-renders
 * when its own data changes, not when sibling cards scroll.
 */
const CatalogueCard = React.memo(function CatalogueCard({
  item,
  isSelected,
  onSelect,
}: {
  item: CatalogueItemSummary;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const handleClick = React.useCallback(() => {
    onSelect(item.id);
  }, [item.id, onSelect]);

  // Use the item kind label for accessibility — the color badge alone is
  // not sufficient for screen reader users.
  const kindLabel = itemKindLabel(item.item_kind);

  return (
    <button
      type="button"
      className={`catalogue-card ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      aria-label={`${item.name}, ${kindLabel}, source ${item.source ?? 'unknown'}`}
    >
      <div className="card-kind-badge" aria-hidden="true">
        {kindLabel}
      </div>
      <div className="card-name">{item.name}</div>
      {item.source && <div className="card-source">{item.source}</div>}
    </button>
  );
});

CatalogueCard.displayName = 'CatalogueCard';

export function CatalogueGrid({
  items,
  totalCount,
  selectedId = null,
  onSelect = () => {},
  rowHeight = 120,
}: CatalogueGridProps): React.ReactElement {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Measure the container width so we can compute columns dynamically.
  const [containerWidth, setContainerWidth] = React.useState(800);

  const resizeObserver = React.useRef<ResizeObserver | null>(null);
  React.useEffect(() => {
    if (!parentRef.current) return;
    const updateWidth = () => {
      if (parentRef.current) {
        setContainerWidth(parentRef.current.clientWidth);
      }
    };
    updateWidth();
    resizeObserver.current = new ResizeObserver(updateWidth);
    resizeObserver.current.observe(parentRef.current);
    return () => {
      resizeObserver.current?.disconnect();
    };
  }, []);

  // Compute how many columns fit in the current container width.
  const columnCount = Math.max(1, Math.floor(containerWidth / CARD_MIN_WIDTH));

  // Build rows from items: each row has `columnCount` items.
  const rows: CatalogueItemSummary[][] = React.useMemo(() => {
    const result: CatalogueItemSummary[][] = [];
    for (let i = 0; i < items.length; i += columnCount) {
      result.push(items.slice(i, i + columnCount));
    }
    return result;
  }, [items, columnCount]);

  // Virtualize the ROW dimension (not individual cards). This is more
  // efficient for grids: O(rows) virtual items instead of O(cards).
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: React.useCallback(() => rowHeight, [rowHeight]),
    overscan: OVERSCAN,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // If we're still measuring and have no rows, show the empty state.
  if (rows.length === 0) {
    if (totalCount === 0) {
      return (
        <div
          ref={parentRef}
          className="catalogue-grid-container"
          role="feed"
          aria-label="Catalogue grid — no items found"
        >
          <div className="empty-state">
            <p>No items match your search or filters.</p>
          </div>
        </div>
      );
    }
    // totalCount > 0 but rows empty: data is still loading.
    return (
      <div
        ref={parentRef}
        className="catalogue-grid-container"
        role="feed"
        aria-label="Catalogue grid — loading"
      >
        <div className="loading-state">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="catalogue-grid-container"
      role="feed"
      aria-label={`Catalogue grid — ${totalCount} items`}
      aria-rowcount={rows.length}
    >
      <div
        ref={rowVirtualizer.measureElement}
        style={{
          height: '100%',
          width: '100%',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (!row) return null;
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'flex',
                  gap: 'var(--card-gap, 1rem)',
                  padding: '0.25rem',
                }}
                className="catalogue-row"
              >
                {row.map((item, colIdx) => (
                  <CatalogueCard
                    key={stableKey(item.id, colIdx)}
                    item={item}
                    isSelected={selectedId === item.id}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
