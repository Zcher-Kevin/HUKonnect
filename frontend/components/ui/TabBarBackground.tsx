import React from "react";
import { StyleSheet, View } from "react-native";

export default function TabBarBackground() {
  return <View style={[StyleSheet.absoluteFillObject, styles.background]} />;
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
});
