import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import { router } from './routes';
import { registerServiceWorker } from '../utils/registerSW';
import '../styles/main.css';

function App() {
  useEffect(() => {
    registerServiceWorker();

    // Add PWA manifest link
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.json';
    document.head.appendChild(link);

    // Add theme color
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#6366f1';
    document.head.appendChild(meta);
  }, []);

  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}

export default App;