import { Platform } from 'react-native';

// Lazy-load expo-secure-store only when running in a native environment.
// This avoids importing native modules at module-evaluation time which can
// trigger TurboModule errors when the running client doesn't yet expose
// the native binding (e.g., mismatched Expo Go binary).
async function getSecureStore() {
  try {
    // use require to keep this synchronous in Metro transforms; it will
    // still be executed only when getSecureStore is called.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SecureStore = require('expo-secure-store');
    return SecureStore;
  } catch (e) {
    console.warn('expo-secure-store not available:', e);
    return null;
  }
}

export async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('localStorage setItem failed', e);
      return false;
    }
  }

  const SecureStore = await getSecureStore();
  if (!SecureStore || !SecureStore.setItemAsync) {
    console.warn('SecureStore.setItemAsync not available; falling back to in-memory');
    try {
      // best-effort fallback: use localStorage (if present) or noop
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }

  return SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage getItem failed', e);
      return null;
    }
  }

  const SecureStore = await getSecureStore();
  if (!SecureStore || !SecureStore.getItemAsync) {
    // fallback to localStorage where possible
    try {
      if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
    } catch (e) {
      // ignore
    }
    return null;
  }

  return SecureStore.getItemAsync(key);
}

export default { setItem, getItem };
