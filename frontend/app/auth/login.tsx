import React, { useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "./../../components/icon";
import { router } from "expo-router";
import GoogleOAuth from "./GoogleOAuth";

import * as WebBrowser from "expo-web-browser";
// Must run once at module scope so expo-auth-session can finalize browser flows.
WebBrowser.maybeCompleteAuthSession();

const BG = "#FFF7F7";
const MAROON = "#A2172C";
const TEXT = "#231F20";

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.wrap}>
        <Icon />

        <div className="container">
          <Text style={styles.title}>Welcome to HUKonnect</Text>

          <GoogleOAuth />
          
          {/* Emergency dev skip so UI work isn't blocked by auth */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#999" }]}
            onPress={() => {
              router.replace("/(tabs)");
            }}
          >
            <Text style={styles.btnText}>Skip (DEV ONLY)</Text>
          </TouchableOpacity>
        </div>
        
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
