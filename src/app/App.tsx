import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';
import { initializeDemoData } from './utils/initializeDemo';
import { useAuth } from './context/AuthContext';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  useEffect(() => {
    initializeDemoData();
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
