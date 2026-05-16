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
              colorText: isDark ? '#F1F5F9' : '#0F172A',
              colorTextSecondary: isDark ? '#94A3B8' : '#64748B',
            },
            components: {
              Layout: {
                siderBg: tokens.siderBg,
                headerBg: tokens.headerBg,
              },
              Menu: {
                itemBg: 'transparent',
                subMenuItemBg: 'transparent',
                itemColor: isDark ? '#94A3B8' : '#64748B',
                itemSelectedColor: tokens.colorPrimary,
                itemSelectedBg: isDark ? 'rgba(56, 189, 248, 0.10)' : 'rgba(14, 165, 233, 0.06)',
                itemHoverColor: tokens.colorPrimary,
                itemHoverBg: isDark ? 'rgba(56, 189, 248, 0.06)' : 'rgba(14, 165, 233, 0.04)',
                itemBorderRadius: 8,
                itemHeight: 40,
                iconSize: 18,
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
