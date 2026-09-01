/**
 * Vitest setup file — runs before every test.
 *
 * Adds @testing-library/jest-dom custom matchers (toBeInTheDocument, etc.)
 * and mocks the global ResizeObserver / IntersectionObserver which are
 * not provided by jsdom but are required by the virtualizer and infinite
 * scroll components.
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// --- ResizeObserver mock (used by CatalogueGrid for responsive columns) ---
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Assign to global so components can use `new ResizeObserver(...)`.
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
  ResizeObserverMock;

// --- IntersectionObserver mock (used by InfinityLoader) ---
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  // Trigger a fake intersection entry.
  trigger = () => {
    // The callback is stored on the instance for testability.
  };
}

(globalThis as unknown as { IntersectionObserver: typeof IntersectionObserverMock }).IntersectionObserver =
  IntersectionObserverMock;
