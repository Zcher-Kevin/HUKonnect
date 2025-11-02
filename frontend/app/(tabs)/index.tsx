// app/(tabs)/Schedule.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Platform,
  Alert,
  Pressable,
} from "react-native";
import ScheduleScreen from "../../components/Schedule";

const MAROON = "#A2172C";
const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUBTEXT = "#7A3F3F";
const INPUT_BG = "#F5EAEA";

export default function Index() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScheduleScreen />
    </SafeAreaView>
  );
}
  
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 12, android: 12, web: 24 }),
    gap: 12,
  },
});