import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeState {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  resolvedScheme: () => 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      colorScheme: 'system',

      setColorScheme: (scheme) => set({ colorScheme: scheme }),

      resolvedScheme: () => {
        const { colorScheme } = get();
        if (colorScheme !== 'system') return colorScheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      },
    }),
    {
      name: 'cannasaas-color-scheme',
    },
  ),
);
