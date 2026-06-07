import type { AppData } from '../types';
import { DEFAULT_CONTENT_BALANCE, DEFAULT_RUBRICS, DEFAULT_SETTINGS, DEFAULT_SEO_CLUSTERS } from '../types';
import { logger } from './logger';
import { parseAppData } from './storageSchema';

const STORAGE_KEY = 'art-content-planner-data';
const STORAGE_VERSION = '1.0.0';

export const getDefaultAppData = (): AppData => ({
  version: STORAGE_VERSION,
  settings: DEFAULT_SETTINGS,
  monthlyPlans: [],
  posts: [],
  ideas: [],
  paintings: [],
  services: [],
  offers: [],
  campaigns: [],
  hookLibrary: [],
  storySequences: [],
  rubrics: DEFAULT_RUBRICS,
  contentBalance: DEFAULT_CONTENT_BALANCE,
  seoCluster: DEFAULT_SEO_CLUSTERS,
  lastUpdated: new Date().toISOString(),
});

export const loadAppData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultAppData();
    }
    const data = JSON.parse(stored) as unknown;
    return parseAppData(data, STORAGE_VERSION);
  } catch (error) {
    logger.error('Failed to load app data:', error);
    return getDefaultAppData();
  }
};

export const saveAppData = (data: AppData): void => {
  try {
    const dataToSave: AppData = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave, null, 2));
  } catch (error) {
    logger.error('Failed to save app data:', error);
    throw new Error('Failed to save data to localStorage');
  }
};

export const exportToJSON = (data: AppData): void => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.href = url;
    link.download = `art-content-planner-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    logger.error('Failed to export JSON:', error);
    throw new Error('Failed to export data');
  }
};

export const importFromJSON = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text) as unknown;
        resolve(parseAppData(data, STORAGE_VERSION));
      } catch (error) {
        logger.error('Failed to import JSON:', error);
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
