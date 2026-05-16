// 科技感配色方案
export const lightTokens = {
  // Ant Design token
  colorPrimary: '#2563eb',
  colorBgContainer: '#ffffff',
  colorBgLayout: '#f8fafc',
  colorBgElevated: '#ffffff',
  borderRadius: 8,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',

  // Layout 组件 token
  siderBg: '#0f172a',
  headerBg: 'rgba(255, 255, 255, 0.85)',

  // 自定义（非 Ant Design token，用于 CSS 变量）
  cardShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 16px rgba(0, 0, 0, 0.04)',
  cardHoverShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06)',
};

export const darkTokens = {
  colorPrimary: '#3b82f6',
  colorBgContainer: '#1e293b',
  colorBgLayout: '#0f172a',
  colorBgElevated: '#334155',
  borderRadius: 8,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',

  siderBg: '#020617',
  headerBg: 'rgba(15, 23, 42, 0.85)',

  cardShadow: '0 1px 3px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.15)',
  cardHoverShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
};

export type ThemeTokens = typeof lightTokens;
