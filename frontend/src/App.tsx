import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme as antTheme } from 'antd';
import router from './router';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { lightTokens, darkTokens } from './theme';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const { isAuthenticated, loadUser } = useAuthStore();
  const { resolved } = useThemeStore();
  const isDark = resolved === 'dark';
  const tokens = isDark ? darkTokens : lightTokens;

  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    }
  }, []);

  // 同步 data-theme 属性
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
            token: {
              colorPrimary: tokens.colorPrimary,
              colorBgContainer: tokens.colorBgContainer,
              colorBgLayout: tokens.colorBgLayout,
              colorBgElevated: tokens.colorBgElevated,
              borderRadius: tokens.borderRadius,
              fontFamily: tokens.fontFamily,
            },
            components: {
              Layout: {
                siderBg: tokens.siderBg,
                headerBg: tokens.headerBg,
              },
              Menu: {
                darkItemBg: tokens.siderBg,
                darkSubMenuItemBg: tokens.siderBg,
              },
            },
          }}
        >
          <RouterProvider router={router} />
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
