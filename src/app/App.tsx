import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import { router } from './routes';
import { registerServiceWorker } from '../utils/registerSW';
import '../styles/main.css';

function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}

export default App;