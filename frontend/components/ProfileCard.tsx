import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform } from "react-native";
import axios from "axios";
import { getItem as storageGetItem } from "../app/lib/storage";
import { API_BASE } from "../app/lib/config";

const MAROON = "#A2172C";
const TEXT = "#231F20";
const SUBTEXT = "#7A6F6F";

const FALLBACK_USER = {
  firstName: "Charlotte",
  lastName: "Chan",
  email: "charlotte.chan@example.edu",
  major: "Computer Science",
  yearOfStudy: "3",
};

export default function ProfileCard({ user: userProp }: { user?: any }) {
  const [user, setUser] = useState<any | null>(userProp || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (userProp) return; // already provided via props
      setLoading(true);
      try {
        const token = (await storageGetItem("token")) || undefined;
        if (
          token &&
          typeof token === "string" &&
          token.split(".").length === 3
        ) {
          const res = await axios.get(`${API_BASE}/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          });
          const u = res.data?.user;
          if (mounted && u) setUser(u);
        }
      } catch (e) {
        // ignore network errors - we'll show fallback
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userProp]);

  const display = user || FALLBACK_USER;
  const initials =
    (display.firstName?.[0] || "") + (display.lastName?.[0] || "");

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
      </View>
      <View style={styles.userCardWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{initials || "U"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>
            {display.firstName} {display.lastName}
          </Text>
          <Text style={styles.userMeta}>
            {display.major}
            {display.yearOfStudy ? ` • Year ${display.yearOfStudy}` : ""}
          </Text>
          <Text style={styles.userEmail}>{display.email}</Text>
        </View>
        {loading && (
          <View style={{ paddingRight: 12 }}>
            <ActivityIndicator size="small" color={MAROON} />
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
      paddingHorizontal: 16,
      paddingTop: Platform.select({ ios: 4, android: 8, web: 12 }),
      paddingBottom: 8,
      alignItems: "center",
    },
  
    headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT },
  
  userCardWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F5EAEA",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "800",
    color: MAROON,
  },
  userName: { fontSize: 16, fontWeight: "700", color: TEXT },
  userMeta: { fontSize: 13, color: SUBTEXT, marginTop: 2 },
  userEmail: { fontSize: 11, color: SUBTEXT, marginTop: 1 },
});
