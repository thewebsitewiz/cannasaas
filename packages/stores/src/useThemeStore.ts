import { create } from 'zustand';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  textPrimary: string;
  textSecondary: string;
  sidebarBg: string;
  sidebarText: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  isDark: boolean;
}

const DEFAULT_COLORS: ThemeColors = {
  primary: '#2d6a4f',
  secondary: '#74956c',
  accent: '#c47820',
  bgPrimary: '#faf6f0',
  bgSecondary: '#f0ebe3',
  bgCard: '#ffffff',
  textPrimary: '#2c2418',
  textSecondary: '#6b5e4f',
  sidebarBg: '#1b3a2a',
  sidebarText: '#c8d8c4',
  success: '#27ae60',
  warning: '#d97706',
  error: '#c0392b',
  info: '#2e86ab',
  isDark: false,
};

interface ThemeState {
  colors: ThemeColors;
  activePreset: string;
  dirty: boolean;
  setPreset: (presetId: string, colors: ThemeColors) => void;
  setColor: (key: keyof ThemeColors, value: string | boolean) => void;
  setColors: (colors: ThemeColors) => void;
  markClean: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  colors: { ...DEFAULT_COLORS },
  activePreset: 'casual',
  dirty: false,

  setPreset: (presetId, colors) =>
    set({ colors: { ...colors }, activePreset: presetId, dirty: true }),

  setColor: (key, value) =>
    set((state) => ({
      colors: { ...state.colors, [key]: value },
      activePreset: 'custom',
      dirty: true,
    })),

  setColors: (colors) => set({ colors, dirty: false }),
  markClean: () => set({ dirty: false }),
}));
