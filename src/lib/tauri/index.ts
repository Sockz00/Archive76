/**
 * Public API for the Tauri bridge layer.
 *
 * Re-exports all invoke helpers and types so consumers can import from a
 * single path: `import { listCatalogueItems } from '@/lib/tauri'`.
 */
export * from './types';
export {
  ping,
  databaseStatus,
  listCatalogueItems,
  searchCatalogue,
  getCatalogueItem,
  TauriNotAvailableError,
} from './invoke';
export type {
  ListCatalogueArgs,
  SearchCatalogueArgs,
} from './invoke';
