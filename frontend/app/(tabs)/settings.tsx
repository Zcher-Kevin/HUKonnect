// app/(tabs)/settings.tsx
// Settings screen:
// - Make schedule visible to others (for CURRENT_USER_ID only)
// - Enable notifications (frontend flag only)
// - Change profile information button -> /edit-profile
// - Logout left as-is (handled elsewhere)

import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Switch,
  Dimensions,
  Platform,
} from "react-native";
import { BouncyButton } from "../../components/BouncyButton";
import { TabTransitionView } from "../../components/TabTransitionView";
import { router } from "expo-router";
import { setItem as storageSetItem } from "../lib/storage";
import { emitAuthChange } from "../lib/authEvents";
import {
  getCurrentScheduleVisible,
  setCurrentScheduleVisible,
  getNotificationsEnabled,
  setNotificationsEnabled,
  useStoreVersion,
} from "../lib/followStore";

const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUB = "#7A6F6F";
const MAROON = "#A2172C";

const { width: W } = Dimensions.get("window");
const WRAP_W = Math.min(900, W * 0.96);

export default function SettingsScreen() {
  // subscribe so toggles stay in sync if changed elsewhere
  useStoreVersion();

  const scheduleVisible = getCurrentScheduleVisible();
  const notifications = getNotificationsEnabled();

  const onToggleSchedule = (value: boolean) => {
    setCurrentScheduleVisible(value);
  };

  const onToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
  };

  const goEditProfile = () => {
    router.push("/(tabs)/edit-profile");
  };

  const logout = () => {
    // Clear stored token and notify app so in-memory state is reset.
    (async () => {
      try {
        await storageSetItem("token", "");
      } catch (e) {}
      try {
        emitAuthChange();
      } catch (e) {}
      router.replace("/auth/login");
    })();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <TabTransitionView style={[styles.wrap, { width: WRAP_W }]}>
        <Text style={styles.title}>Settings</Text>

        {/* Schedule visibility */}
        <View style={styles.row}>
          <View style={styles.textWrap}>
            <Text style={styles.label}>Make schedule visible to others</Text>
            <Text style={styles.help}>
              When enabled, other students can see your schedule on your
              profile.
            </Text>
          </View>
          <Switch
            value={scheduleVisible}
            onValueChange={onToggleSchedule}
            trackColor={{ false: "#ccc", true: MAROON }}
            thumbColor={scheduleVisible ? "#00A69C" : "#f4f3f4"}
          />
        </View>

        {/* Notifications */}
        <View style={styles.row}>
          <View style={styles.textWrap}>
            <Text style={styles.label}>Enable notifications</Text>
            <Text style={styles.help}>
              Allow HUKonnect to send updates about messages and events.
            </Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={onToggleNotifications}
            trackColor={{ false: "#ccc", true: MAROON }}
            thumbColor={notifications ? "#00A69C" : "#f4f3f4"}
          />
        </View>

        {/* Change profile info */}
        <BouncyButton style={styles.primaryBtn} onPress={goEditProfile}>
          <Text style={styles.primaryText}>Change profile information</Text>
        </BouncyButton>

        {/* Log out */}
        <BouncyButton style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </BouncyButton>
      </TabTransitionView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.select({ ios: 8, android: 8, web: 16 }),
    alignItems: "center",
  },
  wrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  textWrap: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT,
  },
  help: {
    fontSize: 13,
    color: SUB,
    marginTop: 2,
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: MAROON,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  logoutBtn: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  logoutText: {
    color: MAROON,
    fontWeight: "700",
    fontSize: 15,
  },
});
