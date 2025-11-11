// app/auth/login.tsx
// Simple email login screen (no Google OAuth).
// FRONTEND:
//  - Collects email
//  - Calls backend login endpoint (TODO) or navigates on success
// BACKEND (todo):
//  - Implement POST /auth/login { email, password? } and return user + token.

import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";

const MAROON = "#A2172C";
const BG = "#FFF7F7";
const TEXT = "#231F20";

const { width: W } = Dimensions.get("window");
const WRAP_W = Math.min(420, W * 0.92);

// Match the welcome card proportions
const CARD_W = WRAP_W;
const CARD_H = CARD_W * 0.86;
const LOGO_SIZE = Math.min(CARD_W * 0.6, 260);

export default function EmailLogin() {
  const [email, setEmail] = useState("");

  const onLogin = async () => {
    const trimmed = email.trim();

    if (!trimmed) {
      Alert.alert("Missing email", "Please enter your university email.");
      return;
    }

    try {
      // BACKEND TODO:
      // const res = await fetch("http://<backend>/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email: trimmed }),
      // });
      // if (!res.ok) throw new Error("Login failed");
      // const data = await res.json();
      // Store auth token + user info here (e.g. AsyncStorage / context)
      // Then navigate into the app:

      router.replace("/(tabs)");
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Login failed",
        "We couldn't sign you in. Please check your email or try again."
      );
    }
  };

  const goToCreateAccount = () => {
    router.push("/auth/create-account");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.wrap, { width: WRAP_W }]}>
        <Text style={styles.h1}>Welcome to{"\n"}HUKonnect</Text>

        <View style={[styles.logoCard, { width: CARD_W, height: CARD_H }]}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
            resizeMode="contain"
          />
        </View>

        <View style={{ width: WRAP_W }}>
          <Text style={styles.label}>Sign in with your email</Text>
          <TextInput
            style={styles.input}
            placeholder="name@university.edu"
            placeholderTextColor="#7A6F6F"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, { width: WRAP_W }]}
          activeOpacity={0.9}
          onPress={onLogin}
        >
          <Text style={styles.btnText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkWrap}
          activeOpacity={0.7}
          onPress={goToCreateAccount}
        >
          <Text style={styles.linkText}>
            New here?{" "}
            <Text style={styles.linkTextBold}>Create an account</Text>
          </Text>
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
    paddingTop: Platform.select({ ios: 12, android: 12, web: 24 }),
  },
  wrap: {
    alignItems: "center",
    gap: 20,
  },
  h1: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
  },
  logoCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: "#7A6F6F",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F5EAEA",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: TEXT,
  },
  btn: {
    backgroundColor: MAROON,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 6,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  linkWrap: {
    marginTop: 4,
  },
  linkText: {
    color: "#7A6F6F",
    fontSize: 13,
  },
  linkTextBold: {
    color: MAROON,
    fontWeight: "700",
  },
});
