// Register service worker for PWA functionality
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // For now, we'll skip SW registration as we can't create .js files
      // The app will work as a SPA without offline capabilities
      console.log('Service Worker registration skipped - app works online');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};
