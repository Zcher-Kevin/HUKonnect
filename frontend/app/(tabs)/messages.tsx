// app/(tabs)/messages.tsx
import React from "react";
import { SafeAreaView, View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useThreads } from "../lib/chatStore";

const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUB = "#7A6F6F";
const MAROON = "#A2172C";

export default function MessagesList() {
  const threads = useThreads();

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Messages</Text>

      <FlatList
        data={threads}
        keyExtractor={(t) => t.chatId}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: "/messages/[id]", params: { id: item.peerId } })}
          >
            <Image
              source={{ uri: item.peerAvatar || "https://i.pravatar.cc/100?u=" + item.peerId }}
              style={styles.ava}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.top}>
                <Text style={styles.name} numberOfLines={1}>{item.peerName}</Text>
                <Text style={styles.time}>{new Date(item.lastMessageAt || Date.now()).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>{item.lastMessageText || "Start the conversation"}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 16 }}>
            <Text style={{ color: SUB }}>No conversations yet. Open a profile and tap “Message”.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: "800", color: TEXT, marginBottom: 4 },
  row: {
    backgroundColor: "#fff", padding: 12, borderRadius: 14, flexDirection: "row", gap: 12, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    marginBottom: 10,
  },
  ava: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#eee" },
  top: { flexDirection: "row", alignItems: "center" },
  name: { flex: 1, color: TEXT, fontWeight: "800", fontSize: 16 },
  time: { color: SUB, fontSize: 12 },
  preview: { color: SUB, marginTop: 2 },
});
