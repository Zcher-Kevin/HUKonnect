import { SafeAreaView, View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Platform } from "react-native";
import { router } from "expo-router";

const MAROON = "#A2172C";
const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUB = "#424242";

const { width: W } = Dimensions.get("window");
const CARD_W = Math.min(420, W * 0.92);
const CARD_H = CARD_W * 0.86;
const LOGO_SIZE = Math.min(CARD_W * 0.65, 280);

export default function Welcome() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.card, { width: CARD_W, height: CARD_H }]}>
        <Image
          source={require("../assets/images/logo.png")}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Connect on Campus</Text>
      <Text style={styles.sub}>Find groups, events, and study buddies.</Text>

      <TouchableOpacity
        style={[styles.cta, { width: CARD_W }]}
        activeOpacity={0.9}
        onPress={() => router.push("/auth/login")}
      >
        <Text style={styles.ctaText}>Get Started</Text>
      </TouchableOpacity>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
    marginTop: 8,
  },
  sub: {
    fontSize: 16,
    color: SUB,
    textAlign: "center",
    marginBottom: 6,
  },
  cta: {
    backgroundColor: MAROON,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 10,
  },
  ctaText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
