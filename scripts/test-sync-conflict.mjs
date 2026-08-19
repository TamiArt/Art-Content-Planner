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

  console.log('Sync conflict regression checks passed.');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
