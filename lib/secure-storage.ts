import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

// expo-secure-store is not available on web; fall back to in-memory storage
let webToken: string | null = null;

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    webToken = token;
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webToken;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    webToken = null;
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
