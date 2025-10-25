import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";

const MAROON = "#A2172C";
const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUBTEXT = "#7A6F6F";
const CARD = "#ffffff";

export default function SettingsScreen() {
  const [visibleToOthers, setVisibleToOthers] = useState(false);
  const [notifications, setNotifications] = useState(false); // placeholder toggle

  const logout = () => {
    // later: clear any tokens/AsyncStorage here
    router.replace("/auth/login"); // back to Google login
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Make schedule visible to others</Text>
            <Text style={styles.sub}>This toggle does nothing yet.</Text>
          </View>
          <Switch
            value={visibleToOthers}
            onValueChange={setVisibleToOthers}
            thumbColor={Platform.OS === "android" ? "#fff" : undefined}
            trackColor={{ false: "#ddd", true: MAROON }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Enable notifications</Text>
            <Text style={styles.sub}>Placeholder (no-op for now).</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            thumbColor={Platform.OS === "android" ? "#fff" : undefined}
            trackColor={{ false: "#ddd", true: MAROON }}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logout} activeOpacity={0.9} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, padding: 16 },
  header: { alignItems: "center", marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { color: TEXT, fontSize: 16, fontWeight: "700" },
  sub: { color: SUBTEXT, fontSize: 12, marginTop: 2 },

  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 6,
  },

  logout: {
    marginTop: 16,
    backgroundColor: MAROON,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
