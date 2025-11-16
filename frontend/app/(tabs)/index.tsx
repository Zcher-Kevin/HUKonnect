// app/(tabs)/index.tsx

import React from "react";
import { SafeAreaView } from "react-native";
import ProfileCard from "../../components/ProfileCard";
import Schedule from "../../components/Schedule";

export default function HomeIndex() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      
      <ProfileCard />
      <Schedule />
    </SafeAreaView>
  );
}
