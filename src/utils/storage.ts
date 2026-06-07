import type { AppData } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_SEO_CLUSTERS } from '../types';

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
  seoCluster: DEFAULT_SEO_CLUSTERS,
  lastUpdated: new Date().toISOString(),
});

export const loadAppData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultAppData();
    }
    const data = JSON.parse(stored) as AppData;
    // Validate and merge with defaults if needed
    return {
      ...getDefaultAppData(),
      ...data,
      version: STORAGE_VERSION,
    };
  } catch (error) {
    console.error('Failed to load app data:', error);
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
    console.error('Failed to save app data:', error);
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
    console.error('Failed to export JSON:', error);
    throw new Error('Failed to export data');
  }
};

export const importFromJSON = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text) as AppData;
        // Validate structure
        if (!data.settings || !data.posts || !Array.isArray(data.posts)) {
          throw new Error('Invalid data structure');
        }
        resolve(data);
      } catch (error) {
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
