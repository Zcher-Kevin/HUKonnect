// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />          {/* Welcome */}
      <Stack.Screen name="auth/login" />     {/* Google login */}
      <Stack.Screen name="auth/create-account" /> {/* Create account */}
      <Stack.Screen name="(tabs)" />         {/* existing app tabs */}
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}


