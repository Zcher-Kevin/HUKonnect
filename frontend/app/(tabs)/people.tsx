// app/(tabs)/people.tsx

import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { router } from "expo-router";
import {
  getPeople,
  isFollowing,
  useStoreVersion,
  Person,
} from "../lib/followStore";

const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUB = "#7A6F6F";
const MAROON = "#A2172C";
const CARD = "#FFFFFF";

const { width: W } = Dimensions.get("window");
const WRAP_W = Math.min(900, W * 0.98);

export default function PeopleScreen() {
  const [query, setQuery] = useState("");

  // re-render when follow / visibility / settings change
  useStoreVersion();

  const all = getPeople();

  const data: Person[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const anyFollowed = all.some((p) => isFollowing(p.id));

    if (!q) {
      if (!anyFollowed) return [];
      return all.filter((p) => isFollowing(p.id));
    }

    // search mode
    const matches = all.filter((p) => {
      const name = p.name.toLowerCase();
      const major = p.major.toLowerCase();
      return name.includes(q) || major.includes(q);
    });

    const followed = matches.filter((p) => isFollowing(p.id));
    const others = matches.filter((p) => !isFollowing(p.id));

    return [...followed, ...others];
  }, [all, query]);

  const renderItem = ({ item }: { item: Person }) => (
    <View style={styles.card}>
      <View style={styles.leftRow}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.major}>{item.major}</Text>
          <Text style={styles.bio} numberOfLines={1}>
            {item.bio || "…"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewBtn}
        activeOpacity={0.9}
        onPress={() => router.push(`/user/${item.id}`)}
      >
        <Text style={styles.viewText}>View</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.inner, { width: WRAP_W }]}>
        <Text style={styles.title}>Find Students</Text>

        <TextInput
          style={styles.search}
          placeholder="Search by name or major"
          placeholderTextColor={SUB}
          value={query}
          onChangeText={setQuery}
        />

        {data.length === 0 && !query && (
          <Text style={styles.empty}>
            You&apos;re not following anyone yet. Search to discover students.
          </Text>
        )}

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.select({ ios: 8, android: 8, web: 16 }),
    alignItems: "center",
  },
  inner: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 10,
  },
  search: {
    backgroundColor: "#F6EAEA",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 14,
    color: TEXT,
    marginBottom: 12,
  },
  empty: {
    marginTop: 12,
    color: SUB,
    fontSize: 13,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CARD,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#eee",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
  },
  major: {
    fontSize: 13,
    fontWeight: "600",
    color: MAROON,
  },
  bio: {
    fontSize: 11,
    color: SUB,
    marginTop: 2,
    maxWidth: 260,
  },
  viewBtn: {
    backgroundColor: MAROON,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  viewText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
