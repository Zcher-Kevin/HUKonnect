import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";

const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUB = "#7A6F6F";
const CARD = "#fff";
const MAROON = "#A2172C";

type Person = {
  id: string;
  name: string;
  major: string;
  bio: string;
  avatar: string; // local asset later; for now use a placeholder URL
};

const MOCK = [
  { id: "charlotte", name: "Charlotte Chan", major: "Computer Science", bio: "...", avatar: "https://i.pravatar.cc/200?img=5" },
  { id: "sam",       name: "Sam Patel",       major: "Physics",           bio: "...", avatar: "https://i.pravatar.cc/200?img=11" },
  { id: "muller",    name: "Lena Muller",     major: "Chemistry",         bio: "...", avatar: "https://i.pravatar.cc/200?img=32" },
];

export default function PeopleDirectory() {
  const [q, setQ] = useState("");
  const data = useMemo(
    () => MOCK.filter(p => (p.name + " " + p.major).toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Find Students</Text>

      <TextInput
        style={styles.search}
        placeholder="Search by name or major"
        placeholderTextColor={SUB}
        value={q}
        onChangeText={setQ}
      />

      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: "/user/[id]", params: { id: item.id } })}
          >
            <Image source={{ uri: item.avatar }} style={styles.ava} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.major}>{item.major}</Text>
              <Text numberOfLines={2} style={styles.bio}>{item.bio}</Text>
            </View>
            <View style={styles.viewBtn}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>View</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: "800", color: TEXT },
  search: {
    backgroundColor: "#F5EAEA",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TEXT,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginTop: 10,
  },
  ava: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#eee" },
  name: { fontSize: 16, fontWeight: "800", color: TEXT },
  major: { color: MAROON, fontWeight: "700", marginTop: 2 },
  bio: { color: SUB, marginTop: 2 },
  viewBtn: {
    backgroundColor: MAROON,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
