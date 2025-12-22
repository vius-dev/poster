import { Platform } from 'react-native';

export const getSystemTheme = (): 'light' | 'dark' => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  return 'light'; // safe default, overridden on native
};