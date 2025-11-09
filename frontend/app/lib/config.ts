import { Platform } from 'react-native';

// Avoid importing expo-constants at module-eval time because it can access
// native modules (which may be missing if the running client doesn't match
// the project's native bindings). We lazy-load it when needed.

function tryGetConstants() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-constants');
  } catch (e) {
    // expo-constants not available in this runtime
    return null;
  }
}

// Robust API host resolver for development across web, iOS simulator,
// Android emulator, and physical devices. Priority order:
// 1) runtime override: globalThis.__API_BASE__ (useful in browser console)
// 2) app manifest extra: Constants.manifest?.extra?.API_BASE or Constants.expoConfig?.extra?.API_BASE
// 3) web: use window.location (same host as the web app, port 3000 by default)
// 4) android emulator: 10.0.2.2
// 5) iOS / default: localhost

const DEFAULT_PORT = 3000;

function fromManifest() {
  // expo classic manifest or expo config
  const Constants = tryGetConstants();
  // @ts-ignore
  const m = Constants ? (Constants.manifest || Constants.expoConfig) : null;
  if (m && m.extra && m.extra.API_BASE) return m.extra.API_BASE;
  return null;
}

function webHost() {
  // window may not exist in native environments
  try {
    const host = (globalThis as any).location?.hostname;
    const protocol = (globalThis as any).location?.protocol || 'http:';
    if (!host) return null;
    // If you're serving web app on a specific port, change DEFAULT_PORT or
    // set an override. We intentionally preserve the page protocol (http/https).
    const port = DEFAULT_PORT;
    return `${protocol}//${host}:${port}`;
  } catch (e) {
    return null;
  }
}

export const API_BASE = (() => {
  // 1) runtime override (can set in browser console: window.__API_BASE__ = 'http://192.168.x.y:3000')
  if ((globalThis as any).__API_BASE__) return (globalThis as any).__API_BASE__;

  // 2) manifest / app config
  const manifestVal = fromManifest();
  if (manifestVal) return manifestVal;

  // 3) web
  if (Platform.OS === 'web') {
    const w = webHost();
    if (w) return w;
  }

  // 4) android emulator
  if (Platform.OS === 'android') {
    // 10.0.2.2 maps to host machine when using the standard Android emulator (AVD).
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  // 5) default to localhost for iOS simulator and other native targets
  return `http://localhost:${DEFAULT_PORT}`;
})();

export default {
  API_BASE,
};
