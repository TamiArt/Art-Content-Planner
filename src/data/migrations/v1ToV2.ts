const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Version 2 makes idea attachments part of the persisted data contract.
 * Older exports did not always contain `images`, so the migration supplies
 * an empty array without changing any other user data.
 */
export const migrateV1ToV2 = (value: Record<string, unknown>): Record<string, unknown> => {
  const ideas = Array.isArray(value.ideas)
    ? value.ideas.map((idea) => (isRecord(idea) ? { ...idea, images: idea.images ?? [] } : idea))
    : value.ideas;

  return {
    ...value,
    version: '2.0.0',
    ideas,
  };
};
