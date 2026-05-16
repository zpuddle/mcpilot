import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import router from './router';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const App: React.FC = () => {
  const { isAuthenticated, loadUser } = useAuthStore();
  const { resolved } = useThemeStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
