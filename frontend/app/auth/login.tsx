// app/auth/login.tsx
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { router } from "expo-router";

const MAROON = "#A2172C";
const BG = "#FFF7F7";
const TEXT = "#231F20";

const { width: W } = Dimensions.get("window");
const WRAP_W = Math.min(420, W * 0.92);
const CARD_W = WRAP_W;
const CARD_H = CARD_W * 0.86;
const LOGO_SIZE = Math.min(CARD_W * 0.60, 260);

// ===========================================================
// 🔒 BACKEND + GOOGLE OAUTH (COMMENTED OUT FOR NOW)
// ===========================================================
/**
 * When backend is ready:
 * 1) Install deps:
 *    - expo install expo-auth-session
 *    - npm i axios
 *    - (optional) expo install expo-secure-store
 *
 * 2) Uncomment ALL of the imports + code in this section.
 * 3) Fill in the Google client IDs and your backend URL.
 * 4) Remove the mock `router.replace(...)` line in onPress below.
 */

// import axios from "axios";
// import * as WebBrowser from "expo-web-browser";
// import * as Google from "expo-auth-session/providers/google";
// import * as SecureStore from "expo-secure-store";

// WebBrowser.maybeCompleteAuthSession();

// const BACKEND_BASE_URL = "http://localhost:3000"; // <— change to your server
// const IOS_CLIENT_ID = "<YOUR_IOS_CLIENT_ID>";
// const ANDROID_CLIENT_ID = "<YOUR_ANDROID_CLIENT_ID>";
// const WEB_CLIENT_ID = "<YOUR_WEB_CLIENT_ID>";

// type BackendAuthResponse = {
//   token: string;  // your app JWT/session token
//   user: { id: string; email: string; name?: string };
// };

// export default function GoogleLogin() {
//   // Hook creates a request and gives you a prompt function + response
//   const [request, response, promptAsync] = Google.useAuthRequest({
//     iosClientId: IOS_CLIENT_ID,
//     androidClientId: ANDROID_CLIENT_ID,
//     webClientId: WEB_CLIENT_ID,
//     responseType: "id_token", // we want an ID token from Google
//   });

//   React.useEffect(() => {
//     (async () => {
//       if (response?.type === "success") {
//         const idToken = response.authentication?.idToken;
//         if (!idToken) return;
//         // Send Google ID token to your backend to verify/login
//         const { data } = await axios.post<BackendAuthResponse>(
//           `${BACKEND_BASE_URL}/auth/google`,
//           { idToken }
//         );
//         // Save your session token (optional but recommended)
//         await SecureStore.setItemAsync("token", data.token);
//         // Navigate into the app
//         router.replace("/(tabs)");
//       }
//     })();
//   }, [response]);

//   const onPress = async () => {
//     // Opens Google sheet (web-view) for the user to sign in
//     await promptAsync();
//   };

//   // ---- UI below remains exactly the same ----
//   return ( ...same UI as below... );
// }

// ===========================================================
// MOCK / CURRENT VERSION — navigates to next screen immediately
// ===========================================================
export default function GoogleLogin() {
  const onPress = async () => {
    // 🧪 MOCK: skip OAuth for now — go straight to next screen
    router.replace("/auth/create-account");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.wrap, { width: WRAP_W }]}>
        <Text style={styles.h1}>Welcome to{"\n"}HUKonnect</Text>

        <View style={[styles.logoCard, { width: CARD_W, height: CARD_H }]}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, { width: WRAP_W }]}
          activeOpacity={0.9}
          onPress={onPress}
        >
          <Text style={styles.btnText}>Login via Google</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    paddingTop: Platform.select({ ios: 12, android: 12, web: 24 }),
  },
  wrap: {
    alignItems: "center",
    gap: 24,
  },
  h1: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
  },
  logoCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  btn: {
    backgroundColor: MAROON,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 6,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
