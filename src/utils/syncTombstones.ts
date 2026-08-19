import type { AppData } from '../types';

export type SyncDeleteCollection = 'posts' | 'ideas' | 'paintings' | 'services' | 'offers';
export type SyncDeleted = Partial<Record<SyncDeleteCollection, string[]>>;
export type SyncData = AppData & { __syncDeleted?: SyncDeleted };

const STORAGE_KEY = 'art-content-planner-sync-deleted';
const COLLECTIONS: SyncDeleteCollection[] = ['posts', 'ideas', 'paintings', 'services', 'offers'];

const unique = (values: string[] = []): string[] => Array.from(new Set(values.filter(Boolean)));

export const normalizeSyncDeleted = (value?: SyncDeleted | null): SyncDeleted => {
  const result: SyncDeleted = {};
  for (const collection of COLLECTIONS) {
    const ids = unique(value?.[collection]);
    if (ids.length) result[collection] = ids;
  }
  return result;
};

export const mergeSyncDeleted = (...values: Array<SyncDeleted | undefined>): SyncDeleted => {
  const merged: SyncDeleted = {};
  for (const collection of COLLECTIONS) {
    const ids = unique(values.flatMap((value) => value?.[collection] ?? []));
    if (ids.length) merged[collection] = ids;
  }
  return merged;
};

export const markSyncDeleted = (
  current: SyncDeleted,
  collection: SyncDeleteCollection,
  ids: string[],
): SyncDeleted => mergeSyncDeleted(current, { [collection]: ids });

export const applySyncDeleted = (data: AppData, deleted: SyncDeleted): AppData => {
  const posts = new Set(deleted.posts ?? []);
  const ideas = new Set(deleted.ideas ?? []);
  const paintings = new Set(deleted.paintings ?? []);
  const services = new Set(deleted.services ?? []);
  const offers = new Set(deleted.offers ?? []);

  return {
    ...data,
    posts: data.posts.filter((item) => !posts.has(item.id)),
    ideas: data.ideas.filter((item) => !ideas.has(item.id)),
    paintings: data.paintings.filter((item) => !paintings.has(item.id)),
    services: data.services.filter((item) => !services.has(item.id)),
    offers: data.offers.filter((item) => !offers.has(item.id)),
  };
};

export const toSyncData = (data: AppData, deleted: SyncDeleted): SyncData => ({
  ...data,
  __syncDeleted: normalizeSyncDeleted(deleted),
});

export const fromSyncData = (syncData: SyncData): { data: AppData; deleted: SyncDeleted } => {
  const { __syncDeleted, ...plainData } = syncData;
  const deleted = normalizeSyncDeleted(__syncDeleted);
  return { data: applySyncDeleted(plainData as AppData, deleted), deleted };
};

export const loadSyncDeleted = (): SyncDeleted => {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SyncDeleted;
    return normalizeSyncDeleted(parsed);
  } catch {
    return {};
  }
};

export const saveSyncDeleted = (deleted: SyncDeleted): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSyncDeleted(deleted)));
};

export const clearSyncDeleted = (): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};
