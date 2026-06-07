import { logger } from './logger';

// PWA service worker registration is intentionally kept as a placeholder.
// Offline support will be implemented in a future iteration after the core data flow is stable.
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    logger.debug('Service Worker registration is in development and currently disabled');
  }
};
