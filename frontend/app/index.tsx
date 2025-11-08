import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import Icon from "./../components/icon";
import { router } from "expo-router";

const MAROON = "#A2172C";
const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUB = "#424242";

const { width: W } = Dimensions.get("window");
const CARD_W = Math.min(420, W * 0.92);

export default function Welcome() {
  return (
    <SafeAreaView style={styles.screen}>
      <Icon />
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
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
    marginTop: -20,
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
