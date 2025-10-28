// app/auth/login.tsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";

// GOOGLE_OAUTH: temporarily disabled. The imports below are commented out
// so the rest of the app can be worked on without OAuth configured.
// When you are ready to re-enable Google OAuth, uncomment these lines
// and remove the placeholders in this file marked with `GOOGLE_OAUTH`.
// import axios from "axios";
// import * as WebBrowser from "expo-web-browser";
// import * as Google from "expo-auth-session/providers/google";
// import * as SecureStore from "expo-secure-store";
// import { makeRedirectUri } from "expo-auth-session";

const MAROON = "#A2172C";
const BG = "#FFF7F7";
const TEXT = "#231F20";

const { width: W } = Dimensions.get("window");
const WRAP_W = Math.min(420, W * 0.92);
const CARD_W = WRAP_W;
const CARD_H = CARD_W * 0.86;
const LOGO_SIZE = Math.min(CARD_W * 0.6, 260);

// ===========================================================
// 🔒 BACKEND + GOOGLE OAUTH
// ===========================================================
// This implementation uses expo-auth-session to get a Google ID token,
// then sends it to the backend at POST /auth/google. The backend will
// verify the token with Google and either return a JWT for existing users
// or a profile blob for new users (so the frontend can navigate to create-account).
//
// To make this work:
// 1) Create OAuth client IDs in Google Cloud (Web, iOS, Android) and set them
//    in your `app.json` extras as EXPO_PUBLIC_GOOGLE_IOS_ID, EXPO_PUBLIC_GOOGLE_ANDROID_ID, EXPO_PUBLIC_GOOGLE_WEB_ID
// 2) Make sure your backend has POST /auth/google (this project includes one)
// 3) Optionally set BACKEND_BASE_URL in app.json extras, default is http://localhost:3000

// GOOGLE_OAUTH disabled: skip WebBrowser auth completion and client-id loading.
// When re-enabling, uncomment the WebBrowser.maybeCompleteAuthSession() call
// and the client ID extraction.
// WebBrowser.maybeCompleteAuthSession();

const extra = (Constants.expoConfig && Constants.expoConfig.extra) || {};
const BACKEND_BASE_URL = extra.BACKEND_BASE_URL || "http://localhost:3000";
const IOS_CLIENT_ID = extra.EXPO_PUBLIC_GOOGLE_IOS_ID || "";
const ANDROID_CLIENT_ID = extra.EXPO_PUBLIC_GOOGLE_ANDROID_ID || "";
const WEB_CLIENT_ID = extra.EXPO_PUBLIC_GOOGLE_WEB_ID || "";

type BackendAuthResponse = {
  token?: string; // your app JWT/session token
  user?: { id: string; email: string; name?: string };
  newUser?: boolean;
  profile?: { email?: string; firstName?: string; lastName?: string };
  needsProfile?: boolean;
};

export default function GoogleLogin() {
  // GOOGLE_OAUTH: Temporarily disabled.
  // The original implementation used expo-auth-session to obtain an id_token
  // then posted it to the backend. That logic is commented out so you can
  // work on the rest of the app without an OAuth configuration in place.

  // Simple placeholder flow: jump to create-account so devs can continue.
  const onPress = async () => {
    console.warn(
      "Google OAuth is temporarily disabled (placeholder). Redirecting to create-account."
    );
    router.replace("/auth/create-account");
  };
  // Render UI (same as the mock UI)
  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.wrap, { width: WRAP_W }]}>
        <Text style={styles.h1}>Welcome to{"\n"}HUKonnect</Text>

        <View style={[styles.logoCard, { width: CARD_W, height: CARD_H }]}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={{ width: 2 * LOGO_SIZE, height: 2 * LOGO_SIZE }}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, { width: WRAP_W }]}
          activeOpacity={0.9}
          onPress={onPress}
        >
          <Text style={styles.btnText}>Login via Google</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 12, android: 12, web: 24 }),
  },
  wrap: {
    alignItems: "center",
    gap: 24,
  },
  h1: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
  },
  logoCard: {
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  btn: {
    backgroundColor: MAROON,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 6,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
