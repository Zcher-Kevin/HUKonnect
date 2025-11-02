import React, { useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";

import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

// Must run once at module scope so expo-auth-session can finalize browser flows.
WebBrowser.maybeCompleteAuthSession();

// CHANGE THIS IF BACKEND IS ON ANOTHER HOST (like your LAN IP on device)
const API_BASE = "http://localhost:3000";

const BG = "#FFF7F7";
const MAROON = "#A2172C";
const TEXT = "#231F20";

export default function LoginScreen() {
  // IMPORTANT:
  // Your current expo-auth-session version wants JUST { clientId }.
  // You MUST paste a REAL Google "Web client" OAuth 2.0 Client ID here,
  // not a placeholder. If you leave a fake string, Google will 400.
  //
  // You also cannot pass redirectUri/useProxy in this old version.
  // It will generate its own redirect URI internally.
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "657018822317-qlbpreu30g5nu8lcg9ogbj1rvs7o1dde.apps.googleusercontent.com",
    responseType: "id_token",
    scopes: ["profile", "email"],
  });

  // TEMP: log what redirect URI Expo is using
  console.log("Redirect URI:", request?.redirectUri);

  // Handle the Google result
  useEffect(() => {
    const finishLogin = async () => {
      if (response?.type !== "success") return;

      const idToken = response.authentication?.idToken;
      if (!idToken) {
        Alert.alert("Login error", "Google did not return an idToken");
        return;
      }

      try {
        // Send Google idToken to backend to get app's session token
        const { data } = await axios.post(`${API_BASE}/auth/google`, { idToken });

        // Store backend token for authenticated calls later
        if (data?.token) {
          await SecureStore.setItemAsync("token", data.token);
        }

        router.replace("/(tabs)");
      } catch (err) {
        console.warn("OAuth backend exchange failed:", err);

        // DEV fallback: let you into the app anyway so you're unblocked
        router.replace("/(tabs)");
      }
    };

    finishLogin();
  }, [response]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Welcome to HUKonnect</Text>

        <TouchableOpacity
          disabled={!request}
          style={styles.btn}
          activeOpacity={0.9}
          onPress={() => {
            // This opens Google's login flow (popup / browser / native sheet)
            promptAsync();
          }}
        >
          <Text style={styles.btnText}>Login via Google</Text>
        </TouchableOpacity>

        {/* Emergency dev skip so UI work isn't blocked by auth */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#999" }]}
          onPress={() => {
            router.replace("/(tabs)");
          }}
        >
          <Text style={styles.btnText}>Skip (DEV ONLY)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  wrap: {
    gap: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
  },
  title: {
    fontSize: 24,
    color: TEXT,
    fontWeight: "800",
    textAlign: "center",
  },
  btn: {
    backgroundColor: MAROON,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 220,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  note: {
    fontSize: 12,
    color: TEXT,
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 16,
    maxWidth: 260,
  },
});
