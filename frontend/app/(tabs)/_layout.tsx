import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MAROON = "#A2172C";
const TEXT = "#231F20";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: MAROON,
        tabBarInactiveTintColor: "#777",
        tabBarStyle: {
          height: Platform.select({ ios: 84, android: 64, web: 64 }),
          paddingTop: 6,
          paddingBottom: Platform.select({ ios: 18, android: 10, web: 10 }),
        },
        tabBarLabelStyle: { fontWeight: "700" },
      }}
    >
      {/* Home (your schedule) — visible but disabled for now */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // keep it “no-op” for now
            e.preventDefault();
          },
        }}
      />

      {/* Events — placeholder, disabled */}
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: (e) => e.preventDefault() }}
      />

      {/* Groups/Clubs — placeholder, disabled */}
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: (e) => e.preventDefault() }}
      />

      {/* Settings — the only one that navigates */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

