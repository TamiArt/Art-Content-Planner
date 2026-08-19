import type { AppData } from '../types';
import { mergeAppData } from './mergeAppData';

/**
 * Resolves an optimistic-lock conflict without dropping the edit that caused it.
 * Remote entities are the base; the local snapshot wins for matching ids while
 * unique entities from both devices are preserved.
 *
 * Deletions cannot be represented by the current snapshot model (no tombstones),
 * so this intentionally does not claim delete-conflict resolution.
 */
export const mergeSyncConflict = (remote: AppData | null, local: AppData): AppData =>
  remote ? mergeAppData(remote, local) : local;
