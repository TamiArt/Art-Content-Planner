import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import { router } from './routes';
import { registerServiceWorker } from '../utils/registerSW';
import '../styles/main.css';
import '../styles/auth.css';
import AuthScreen from '../components/AuthScreen';
import { useAppContext } from '../context/AppContext';

function AppContent() {
  const { user, authLoading } = useAppContext();
  if (authLoading) return <div className="app-loading"><div className="spinner" /><p>Загружаем ваши данные…</p></div>;
  return user ? <RouterProvider router={router} /> : <AuthScreen />;
}

function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
