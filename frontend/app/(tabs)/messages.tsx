// app/(tabs)/messages.tsx
// Recent conversations list (bottom bar -> Messages)

import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import { TabTransitionView } from "../../components/TabTransitionView";
import { router } from "expo-router";
import { useThreads } from "../lib/chatStore";

const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUB = "#7A6F6F";
const MAROON = "#A2172C";

const { width: W } = Dimensions.get("window");
const WRAP_W = Math.min(600, W * 0.96);

export default function MessagesListScreen() {
  const threads = useThreads();

  const open = (peerId: string) => {
    router.push(`/messages/${peerId}`);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <TabTransitionView style={[styles.inner, { width: WRAP_W }]}>
        <Text style={styles.title}>Messages</Text>

        {threads.length === 0 && (
          <Text style={styles.empty}>
            You have no conversations yet. Start by messaging someone from
            their profile.
          </Text>
        )}

        <FlatList
          data={threads}
          keyExtractor={(t) => t.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => open(item.peerId)}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {item.peerName.charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.peerName}</Text>
                <Text
                  style={styles.last}
                  numberOfLines={1}
                >
                  {item.lastMessage || "Tap to continue the conversation"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </TabTransitionView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    paddingTop: Platform.select({ ios: 8, android: 8, web: 16 }),
  },
  inner: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 12,
  },
  empty: {
    color: SUB,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FDECEF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: MAROON,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
  },
  last: {
    fontSize: 12,
    color: SUB,
    marginTop: 2,
  },
});
