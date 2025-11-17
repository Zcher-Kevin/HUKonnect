// app/(tabs)/index.tsx

import React from "react";
import { SafeAreaView } from "react-native";
import ProfileCard from "../../components/ProfileCard";
import Schedule from "../../components/Schedule";
import { TabTransitionView } from "../../components/TabTransitionView";


export default function HomeIndex() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TabTransitionView style={{ flex: 1 }}>
        <ProfileCard />
        <Schedule />
      </TabTransitionView>
    </SafeAreaView>
  );
}
