import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyValueStorage } from './themeStorage';

export const asyncStorageAdapter: KeyValueStorage = {
  async getItem(key) {
    return AsyncStorage.getItem(key);
  },
  async setItem(key, value) {
    await AsyncStorage.setItem(key, value);
  },
};