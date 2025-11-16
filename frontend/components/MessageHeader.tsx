import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  title: string;
  onBack: () => void;
}

export default function MessageHeader({ title, onBack }: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={{ padding: 8 }}>
        <Ionicons name="chevron-back" size={22} color="#231F20" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 30 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "800",
    color: "#231F20",
    fontSize: 16,
  },
});
