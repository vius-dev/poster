
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { View, useColorScheme, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  Theme as NavigationTheme,
} from '@react-navigation/native';

import { semanticColors, SemanticTheme } from './colors';
import { asyncStorageAdapter } from '../storage/asyncStorageAdapter';
import { getSystemTheme } from '../utils/getSystemTheme';

const THEME_STORAGE_KEY = '@user_theme_preference';
const THEME_MODES = ['system', 'light', 'dark'] as const;

const THEME_MODE_KEY = '@user_theme_preference';
const RESOLVED_THEME_KEY = '@resolved_theme';

type ThemeMode = typeof THEME_MODES[number];

interface ThemeContextType {
  theme: SemanticTheme;
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  navigationTheme: NavigationTheme;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isInitialized, setIsInitialized] = useState(false);
  const [resolvedTheme, setResolvedTheme] =
  useState<'light' | 'dark'>('light');

  // ---- Load persisted theme (SSR safe) ----
  useEffect(() => {
    let mounted = true;

    asyncStorageAdapter
      .getItem(RESOLVED_THEME_KEY)
      .then(savedResolved => {
        if (
          mounted &&
          (savedResolved === 'light' || savedResolved === 'dark')
        ) {
          setResolvedTheme(savedResolved);
        }
      })
      .catch(() => {})
      .finally(() => setIsInitialized(true));

    asyncStorageAdapter
      .getItem(THEME_MODE_KEY)
      .then(savedMode => {
        if (
          savedMode &&
          THEME_MODES.includes(savedMode as ThemeMode)
        ) {
          setThemeModeState(savedMode as ThemeMode);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    asyncStorageAdapter
      .setItem(THEME_STORAGE_KEY, mode)
      .catch(console.warn);
  };

  const resolvedScheme =
    themeMode === 'system'
      ? systemScheme ?? getSystemTheme()
      : themeMode;

      useEffect(() => {
        if (
          resolvedScheme === 'light' ||
          resolvedScheme === 'dark'
        ) {
          setResolvedTheme(resolvedScheme);
          asyncStorageAdapter
            .setItem(RESOLVED_THEME_KEY, resolvedScheme)
            .catch(() => {});
        }
      }, [resolvedScheme]);

  const isDarkMode = resolvedScheme === 'dark';

  const theme: SemanticTheme = useMemo(
    () => (isDarkMode ? semanticColors.dark : semanticColors.light),
    [isDarkMode]
  );

  const navigationTheme: NavigationTheme = useMemo(() => {
    const base = isDarkMode
      ? NavigationDarkTheme
      : NavigationLightTheme;

    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.background,
        card: theme.surface,
        text: theme.textPrimary,
        border: theme.border,
        primary: theme.primary,
      },
    };
  }, [isDarkMode, theme]);

  const toggleTheme = () => {
    setThemeMode(isDarkMode ? 'light' : 'dark');
  };

  const value = useMemo(
    () => ({
      theme,
      isDarkMode,
      themeMode,
      setThemeMode,
      toggleTheme,
      navigationTheme,
    }),
    [theme, isDarkMode, themeMode, navigationTheme]
  );

  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor:
            resolvedTheme === 'dark' ? '#000' : '#fff',
        }}
      />
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {/* ✅ StatusBar auto-sync */}
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
