import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return getSystemTheme();
  return mode;
}

// 从 localStorage 读取初始值
const savedMode = (localStorage.getItem('mcpilot_theme') as ThemeMode) || 'system';

export const useThemeStore = create<ThemeState>((set) => ({
  mode: savedMode,
  resolved: resolveTheme(savedMode),
  setMode: (mode: ThemeMode) => {
    localStorage.setItem('mcpilot_theme', mode);
    set({ mode, resolved: resolveTheme(mode) });
    // 同步更新 HTML 属性
    document.documentElement.dataset.theme = resolveTheme(mode);
  },
}));

// 监听系统主题变化
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', () => {
  const state = useThemeStore.getState();
  if (state.mode === 'system') {
    const resolved = getSystemTheme();
    useThemeStore.setState({ resolved });
    document.documentElement.dataset.theme = resolved;
  }
});
