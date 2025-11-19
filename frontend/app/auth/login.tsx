import React, { useState } from "react";
import { Platform } from "react-native";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { BouncyButton } from "../../components/BouncyButton";
import { TextInput, ActivityIndicator, Alert } from "react-native";
import Icon from "./../../components/icon";
import { router } from "expo-router";
import axios from "axios";
import { setItem as storageSetItem } from "../lib/storage";
import { emitAuthChange } from "../lib/authEvents";
import { isValidEmail } from "../lib/validators";
import { API_BASE } from "../lib/config";

// Google OAuth removed: no browser auth flows needed for email/password flow.

const BG = "#FFF7F7";
const MAROON = "#A2172C";
const TEXT = "#231F20";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // API_BASE imported from lib/config

  const onLogin = async () => {
    console.log("Login button pressed", { email });
    if (!email.trim() || !password) {
      Alert.alert("Login", "Please enter both email and password.");
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert("Login", "Please enter a valid email address.");
      return;
    }
    try {
      setBusy(true);
      const res = await axios.post(
        `${API_BASE}/api/auth/login`,
        { email: email.trim(), password, remember: true },
        { timeout: 15000 }
      );
      // Log full response to console for debugging (do NOT show tokens in UI)
      console.log("Login response:", res.data);
      const token = res.data?.token;
      if (token) {
        // Use storage wrapper which falls back to localStorage on web
        await storageSetItem("token", token);
        try {
          emitAuthChange();
        } catch (e) {}
        router.replace("/(tabs)");
      } else {
        // Show a helpful alert and log the full response
        console.warn("Login succeeded but no token in response", res.data);
        Alert.alert(
          "Login",
          "Login succeeded but no token returned by server. Check server logs."
        );
        throw new Error("No token in response");
      }
    } catch (err: any) {
      // Extract useful info to show in the UI without exposing sensitive data
      const status = err?.response?.status;
      const serverMessage =
        err?.response?.data?.message || err?.response?.data || null;
      const userMessage = serverMessage
        ? `Server: ${
            typeof serverMessage === "string"
              ? serverMessage
              : JSON.stringify(serverMessage)
          }`
        : (err as any)?.message || "Unable to login";

      // Log full error/response to console for debugging
      console.error("Login error details:", {
        message: (err as any)?.message,
        status: status,
        responseData: err?.response?.data,
      });

      Alert.alert(
        "Login failed",
        `Status: ${status || "network/error"}\n${userMessage}`,
        [{ text: "OK" }],
        { cancelable: true }
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View
        style={styles.wrap}
        // responder to detect any pointer events on the container
        onStartShouldSetResponder={() => {
          console.log("wrap onStartShouldSetResponder");
          return false;
        }}
        onResponderStart={(e) => {
          console.log(
            "wrap onResponderStart",
            e.nativeEvent && e.nativeEvent.touches && e.nativeEvent.touches[0]
          );
        }}
      >
        <Icon />

        <View style={{ width: "100%" }}>
          <Text style={styles.title}>Welcome to HUKonnect</Text>

          {/* Email / password login */}
          <TextInput
            placeholder="Email"
            placeholderTextColor={"#7A6F6F"}
            style={[styles.input]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={"#7A6F6F"}
            style={[styles.input]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <BouncyButton
            style={styles.btn}
            onPress={onLogin}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Login</Text>
            )}
          </BouncyButton>

          {/* Web-only fallback native button to diagnose web event delivery */}
          {Platform.OS === "web" ? (
            <div style={{ marginTop: 8 }}>
              <button
                id="web-native-login"
                onClick={() => {
                  console.log("native web button clicked");
                  onLogin();
                }}
              >
                Login (web native)
              </button>
            </div>
          ) : null}

          <Text style={{ textAlign: "center", color: "#231F20", opacity: 0.7 }}>
            or
          </Text>

          {/* Link to create account */}
          <BouncyButton
            style={[styles.btn, { backgroundColor: "#999" }]}
            onPress={() => {
              router.push("/auth/create-account");
            }}
          >
            <Text style={styles.btnText}>Create account</Text>
          </BouncyButton>
        </View>
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
  input: {
    backgroundColor: "#F5EAEA",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: TEXT,
    fontSize: 16,
    width: "100%",
    marginTop: 8,
  },
});
