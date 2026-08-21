import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Non-sensitive app preferences (theme choice, last-synced timestamps, etc).
// Unlike auth-token storage, these persist on web via localStorage rather than
// falling back to an in-memory value, since they aren't security-sensitive.

export async function getPreference(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setPreference(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore (e.g. private browsing storage restrictions)
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}
