import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'art-content-planner-tests-'));

const loadTypeScriptModule = async (entryPoint, outputName) => {
  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
  });
  const outputPath = join(temporaryDirectory, outputName);
  await writeFile(outputPath, result.outputFiles[0].contents);
  return import(pathToFileURL(outputPath).href);
};

try {
  const { migrateAppData } = await loadTypeScriptModule(
    'src/data/migrations/migrateAppData.ts',
    'migrate-app-data.mjs',
  );
  const { parseAppData } = await loadTypeScriptModule('src/utils/storageSchema.ts', 'storage-schema.mjs');
  const { mergeAppData, countImportConflicts } = await loadTypeScriptModule(
    'src/utils/mergeAppData.ts',
    'merge-app-data.mjs',
  );

  const legacyData = {
    version: '1.0.0',
    settings: {},
    posts: [],
    ideas: [{
      id: 'idea-1',
      createdAt: '2026-08-03T12:00:00.000Z',
      title: 'Эскиз',
      description: '',
      tags: [],
    }],
  };

  const migrated = migrateAppData(legacyData, '2.0.0');
  assert.equal(migrated.version, '2.0.0', 'migration must update the schema version');
  assert.deepEqual(migrated.ideas[0].images, [], 'migration must initialize idea images');
  assert.equal(Object.hasOwn(legacyData.ideas[0], 'images'), false, 'migration must not mutate imported data');
  assert.throws(
    () => migrateAppData({ version: '3.0.0' }, '2.0.0'),
    /newer than supported/,
    'future schema versions must be rejected',
  );

  const image = 'data:image/png;base64,aW1hZ2U=';
  const parsed = parseAppData({
    ...legacyData,
    version: '2.0.0',
    ideas: [{ ...legacyData.ideas[0], images: [image] }],
  }, '2.0.0');
  assert.deepEqual(parsed.ideas[0].images, [image], 'validation must preserve idea attachments');
  assert.throws(
    () => parseAppData({ ...legacyData, version: '2.0.0', ideas: [{ ...legacyData.ideas[0], images: [42] }] }, '2.0.0'),
    /expected string array/,
    'invalid attachment data must be rejected',
  );

  const current = { ...parsed, posts: [{ id: 'shared', topic: 'Локальная версия' }], ideas: [] };
  const imported = {
    ...parsed,
    posts: [{ id: 'shared', topic: 'Версия из файла' }, { id: 'new', topic: 'Новый пост' }],
    ideas: parsed.ideas,
  };
  const combined = mergeAppData(current, imported);
  assert.equal(combined.posts.length, 2, 'merge must retain unique entities');
  assert.equal(combined.posts.find((post) => post.id === 'shared').topic, 'Версия из файла', 'imported conflicts must win');
  assert.equal(combined.ideas.length, 1, 'merge must add imported ideas');
  assert.equal(countImportConflicts(current, imported), 1, 'conflicts must be reported before import');

  console.log('Data migration and JSON round-trip checks passed.');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
