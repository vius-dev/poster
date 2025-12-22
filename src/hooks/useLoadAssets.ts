
import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

export const useLoadAssets = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        // Load fonts
        await Font.loadAsync({
          ...Ionicons.font,
        });
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setIsLoading(false);
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return isLoading;
};
