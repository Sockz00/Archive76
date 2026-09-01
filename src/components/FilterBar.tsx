/**
 * Filter bar for catalogue items.
 *
 * Provides:
 *  - Kind selector: All Kinds / Plans / Weapon Mods / Armour Mods
 *  - Trackable-only toggle: hides retired items (per-backend filter)
 *
 * The `availability` filter mentioned in the ROADMAP is not yet backed by a
 * Tauri command — the backend `list_catalogue_items` only accepts `kind` and
 * `trackable_only`. When the backend adds an availability filter, wire it
 * here. For now we expose what the contract supports.
 *
 * @see src/lib/tauri/invoke.ts — `listCatalogueItems`
 */

import React from 'react';

import type { ItemKind } from '@/lib/tauri';
import { ITEM_KIND_OPTIONS } from '@/lib/tauri';

export interface FilterBarProps {
  /** Currently selected item kind filter. `null` = all kinds. */
  selectedKind: ItemKind | null;
  /** Whether only trackable items are shown. */
  trackableOnly: boolean;
  /** Called when the kind filter changes. */
  onKindChange: (kind: ItemKind | null) => void;
  /** Called when the trackable-only toggle changes. */
  onTrackableChange: (only: boolean) => void;
}

function KindSelect({
  value,
  onChange,
}: {
  value: ItemKind | null;
  onChange: (kind: ItemKind | null) => void;
}): React.ReactElement {
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      onChange(v === '__all__' ? null : (v as ItemKind));
    },
    [onChange],
  );

  // Use the canonical string representation for the value attribute.
  const selectedValue = value ?? '__all__';

  return (
    <label className="filter-control kind-select">
      <span className="filter-label">Kind</span>
      <select
        value={selectedValue}
        onChange={handleChange}
        aria-label="Filter by item kind"
      >
        {ITEM_KIND_OPTIONS.map((opt) => {
          const val = opt.value ?? '__all__';
          return (
            <option key={val} value={val}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export function FilterBar({
  selectedKind,
  trackableOnly,
  onKindChange,
  onTrackableChange,
}: FilterBarProps): React.ReactElement {
  const handleTrackableToggle = React.useCallback(() => {
    onTrackableChange(!trackableOnly);
  }, [trackableOnly, onTrackableChange]);

  return (
    <div className="filter-bar" role="group" aria-label="Filter catalogue">
      <KindSelect value={selectedKind} onChange={onKindChange} />

      <label className="filter-control trackable-toggle">
        <span className="filter-label">Trackable only</span>
        <button
          type="button"
          className={`toggle-switch ${trackableOnly ? 'on' : ''}`}
          onClick={handleTrackableToggle}
          aria-pressed={trackableOnly}
          aria-label={
            trackableOnly
              ? 'Showing only trackable items. Click to show all.'
              : 'Showing all items. Click to show only trackable.'
          }
        >
          <span className="toggle-knob" aria-hidden="true" />
        </button>
      </label>
    </div>
  );
}
