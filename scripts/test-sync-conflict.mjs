import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'art-content-planner-sync-tests-'));

const loadTypeScriptModule = async (entryPoint, outputName) => {
  const result = await build({ entryPoints: [entryPoint], bundle: true, format: 'esm', platform: 'node', write: false });
  const outputPath = join(temporaryDirectory, outputName);
  await writeFile(outputPath, result.outputFiles[0].contents);
  return import(pathToFileURL(outputPath).href);
};

const entity = (id, topic) => ({ id, topic });

try {
  const { mergeSyncConflict } = await loadTypeScriptModule('src/utils/syncConflict.ts', 'sync-conflict.mjs');
  const {
    applySyncDeleted,
    fromSyncData,
    markSyncDeleted,
    mergeSyncDeleted,
    toSyncData,
  } = await loadTypeScriptModule('src/utils/syncTombstones.ts', 'sync-tombstones.mjs');

  const base = {
    version: '2.0.0', settings: { language: 'ru' }, monthlyPlans: [], posts: [], ideas: [], paintings: [], services: [], offers: [],
    campaigns: [], hookLibrary: [], storySequences: [], rubrics: [], contentBalance: {}, seoCluster: [], lastUpdated: '2026-08-19T00:00:00.000Z',
  };
  const remote = { ...base, posts: [entity('shared', 'remote edit'), entity('remote-only', 'remote addition')], settings: { language: 'en' } };
  const local = { ...base, posts: [entity('shared', 'local edit'), entity('local-only', 'local addition')], settings: { language: 'ru' } };
  const resolved = mergeSyncConflict(remote, local);

  assert.equal(resolved.posts.length, 3, 'conflict merge must keep unique entities from both devices');
  assert.equal(resolved.posts.find((post) => post.id === 'shared').topic, 'local edit', 'pending local edit must win for the same id');
  assert.ok(resolved.posts.some((post) => post.id === 'remote-only'), 'remote-only entity must survive conflict resolution');
  assert.ok(resolved.posts.some((post) => post.id === 'local-only'), 'local-only entity must survive conflict resolution');
  assert.deepEqual(resolved.settings, local.settings, 'pending local settings must win');
  assert.strictEqual(mergeSyncConflict(null, local), local, 'missing remote snapshot must preserve local data');

  const remoteDeleted = markSyncDeleted({}, 'posts', ['shared']);
  const localDeleted = markSyncDeleted({}, 'ideas', ['idea-1']);
  const deleted = mergeSyncDeleted(remoteDeleted, localDeleted, { posts: ['shared', 'remote-only'] });
  assert.deepEqual(deleted.posts.sort(), ['remote-only', 'shared'], 'tombstones from devices must be unioned without duplicates');
  assert.deepEqual(deleted.ideas, ['idea-1'], 'tombstones for other collections must be preserved');

  const withDeleted = {
    ...resolved,
    ideas: [{ id: 'idea-1' }, { id: 'idea-2' }],
  };
  const filtered = applySyncDeleted(withDeleted, deleted);
  assert.deepEqual(filtered.posts.map((post) => post.id), ['local-only'], 'deleted posts must not be resurrected by conflict merge');
  assert.deepEqual(filtered.ideas.map((idea) => idea.id), ['idea-2'], 'deleted ideas must stay deleted');

  const envelope = toSyncData(filtered, deleted);
  assert.ok(envelope.__syncDeleted, 'sync payload must carry tombstones');
  const restored = fromSyncData(envelope);
  assert.deepEqual(restored.deleted, deleted, 'tombstones must survive server snapshot round-trip');
  assert.equal('__syncDeleted' in restored.data, false, 'internal sync metadata must not leak into AppData state');

  console.log('Sync conflict and tombstone regression checks passed.');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
