import { View, Image, StyleSheet, Dimensions, Platform } from "react-native";

const BG = "#FFF7F7";

const { width: W } = Dimensions.get("window");
const CARD_W = Math.min(420, W * 0.92);
const CARD_H = CARD_W * 0.86;
const LOGO_SIZE = Math.min(CARD_W * 0.65, 280);

export default function Icon() {
  return (
    <View style={styles.container}>
      <View style={[styles.card, { width: CARD_W, height: CARD_H }]}>
        <Image
          source={require("../assets/images/logo.png")}
          style={{ width: 2 * LOGO_SIZE, height: 2 * LOGO_SIZE }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginTop: 10,
  },
});
