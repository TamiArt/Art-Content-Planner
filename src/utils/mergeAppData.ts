import type { AppData } from '../types';

type Entity = { id: string };

const mergeEntities = <T extends Entity>(current: T[], imported: T[]): T[] => {
  const merged = new Map(current.map((entity) => [entity.id, entity]));
  imported.forEach((entity) => merged.set(entity.id, entity));
  return Array.from(merged.values());
};

/**
 * Combines exports created on different devices. Imported entities win when
 * both files contain the same id; unique local entities are kept.
 */
export const mergeAppData = (current: AppData, imported: AppData): AppData => ({
  ...current,
  settings: imported.settings,
  monthlyPlans: mergeEntities(current.monthlyPlans, imported.monthlyPlans),
  posts: mergeEntities(current.posts, imported.posts),
  ideas: mergeEntities(current.ideas, imported.ideas),
  paintings: mergeEntities(current.paintings, imported.paintings),
  services: mergeEntities(current.services, imported.services),
  offers: mergeEntities(current.offers, imported.offers),
  campaigns: mergeEntities(current.campaigns, imported.campaigns),
  hookLibrary: mergeEntities(current.hookLibrary, imported.hookLibrary),
  storySequences: mergeEntities(current.storySequences, imported.storySequences),
  rubrics: mergeEntities(current.rubrics, imported.rubrics),
  contentBalance: imported.contentBalance,
  seoCluster: mergeEntities(current.seoCluster, imported.seoCluster),
  version: imported.version,
  lastUpdated: new Date().toISOString(),
});

export const countImportConflicts = (current: AppData, imported: AppData): number => {
  const count = <T extends Entity>(currentEntities: T[], importedEntities: T[]) => {
    const currentIds = new Set(currentEntities.map((entity) => entity.id));
    return importedEntities.filter((entity) => currentIds.has(entity.id)).length;
  };

  return count(current.monthlyPlans, imported.monthlyPlans)
    + count(current.posts, imported.posts)
    + count(current.ideas, imported.ideas)
    + count(current.paintings, imported.paintings)
    + count(current.services, imported.services)
    + count(current.offers, imported.offers)
    + count(current.campaigns, imported.campaigns)
    + count(current.hookLibrary, imported.hookLibrary)
    + count(current.storySequences, imported.storySequences);
};
