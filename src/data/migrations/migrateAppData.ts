import { migrateV1ToV2 } from './v1ToV2';

const LEGACY_VERSION = '1.0.0';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getMajorVersion = (version: string): number => {
  const major = Number.parseInt(version.split('.')[0], 10);
  if (!Number.isInteger(major) || major < 1) {
    throw new Error(`Unsupported data version: ${version}`);
  }
  return major;
};

export const migrateAppData = (value: unknown, currentVersion: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error('Invalid app data: expected object');
  }

  const sourceVersion = value.version === undefined ? LEGACY_VERSION : value.version;
  if (typeof sourceVersion !== 'string') {
    throw new Error('Invalid version: expected string');
  }

  const currentMajor = getMajorVersion(currentVersion);
  let sourceMajor = getMajorVersion(sourceVersion);
  if (sourceMajor > currentMajor) {
    throw new Error(`Data version ${sourceVersion} is newer than supported version ${currentVersion}`);
  }

  let migrated = value;
  while (sourceMajor < currentMajor) {
    if (sourceMajor === 1) {
      migrated = migrateV1ToV2(migrated);
      sourceMajor = 2;
      continue;
    }

    throw new Error(`No migration available for data version ${sourceMajor}`);
  }

  return { ...migrated, version: currentVersion };
};
