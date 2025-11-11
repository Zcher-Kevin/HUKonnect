// app/_layout.tsx
import { Stack } from "expo-router";
// Setup axios logging early so requests/responses are visible in Metro logs
import setupAxiosLogging from "./lib/axiosSetup";

setupAxiosLogging();

export default function RootLayout() {
  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="user/[id]" /> {/* Profile detail (no bottom bar) */}
      <Stack.Screen name="index" /> {/* Welcome */}
      <Stack.Screen name="auth/login" /> {/* Google login */}
      <Stack.Screen name="auth/create-account" /> {/* Create account */}
      <Stack.Screen name="(tabs)" /> {/* existing app tabs */}
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="messages/[id]" /> {/* DM chat */}
      <Stack.Screen name="user/[id]/schedule" />{" "}
      {/* Profile → View Full Schedule */}
    </Stack>
  );
}
