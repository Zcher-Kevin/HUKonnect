// app/auth/create-account.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";

/**
 * ================================
 * BACKEND WIRING – CONFIG
 * ================================
 * 1) When the backend endpoint is live, set API_BASE below.
 * 2) If you store your JWT after Google Sign-In, uncomment SecureStore import
 *    and the token retrieval line inside submitProfile().
 * 3) Uncomment the axios import and npm install it if you haven't:
 *      npm i axios
 */
import axios from "axios";
// import * as SecureStore from "expo-secure-store";
const API_BASE = "http://localhost:3000"; // <— change to your server

const MAROON = "#A2172C";
const BG = "#FFF7F7";
const TEXT = "#231F20";
const INPUT_BG = "#F5EAEA";
const SUBTEXT = "#7A6F6F";

const { width: W } = Dimensions.get("window");
const WRAP_W = Math.min(420, W * 0.92);

export default function CreateAccount() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [major, setMajor] = useState("");
  const [minor, setMinor] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");
  const [busy, setBusy] = useState(false);

  /**
   * Build DOB in ISO (YYYY-MM-DD) from the three inputs.
   */
  const buildDob = () => {
    const DD = day.padStart(2, "0");
    const MM = month.padStart(2, "0");
    const YYYY = year;
    return `${YYYY}-${MM}-${DD}`;
  };

  /**
   * =================================
   * API CALL (PUT /users/me/profile)
   * =================================
   * Sends the profile to the backend using the app's session token.
   * The backend should:
   *  - validate + normalize data
   *  - attach the profile to the authenticated user
   *  - return the canonical user object (optional)
   */
  const submitProfile = async () => {
    // --- Client-side minimal checks (server will re-validate) ---
    if (!first.trim() || !last.trim()) {
      throw new Error("Please enter your first and last name.");
    }
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) {
      throw new Error("Please enter a valid date (DD/MM/YYYY).");
    }

    const dob = buildDob();

    // Retrieve your JWT created during Google sign-in (if you saved one)
    // const token = await SecureStore.getItemAsync("token");
    const token = undefined; // <— keep undefined for now if auth not wired yet

    const res = await axios.put(
      `${API_BASE}/users/me/profile`,
      {
        firstName: first.trim(),
        lastName: last.trim(),
        major: major.trim() || null,
        minor: minor.trim() || null,
        dob, // YYYY-MM-DD
        gender: gender.trim() || null,
        termsAccepted: true,
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 15000,
      }
    );

    return res.data; // expected { user: {...} } (shape up to your backend)
  };

  /**
   * ============================
   * BUTTON HANDLER
   * ============================
   * TODAY: keep the mock navigation (first return).
   * LATER: comment out the mock, then uncomment the real call.
   */
  const onCreate = async () => {
    try {
      setBusy(true);

      // ====== TODAY (no backend): mock navigation, remove later ======
      router.replace("/(tabs)");
      return;

      // ====== LATER (backend live): uncomment this block ======
      // await submitProfile();
      // router.replace("/(tabs)");
      // return;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not create your account. Please try again.";
      Alert.alert("Create Account", msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={{ alignSelf: "stretch" }}
        contentContainerStyle={[styles.content, { width: WRAP_W }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Create Account</Text>

        <Text style={styles.sectionTitle}>Your Information</Text>

        {/* Name row */}
        <View style={styles.row}>
          <TextInput
            placeholder="First Name"
            placeholderTextColor={SUBTEXT}
            style={[styles.input, styles.half]}
            value={first}
            onChangeText={setFirst}
            autoCapitalize="words"
            returnKeyType="next"
          />
          <TextInput
            placeholder="Surname"
            placeholderTextColor={SUBTEXT}
            style={[styles.input, styles.half]}
            value={last}
            onChangeText={setLast}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        <TextInput
          placeholder="Major"
          placeholderTextColor={SUBTEXT}
          style={styles.input}
          value={major}
          onChangeText={setMajor}
          returnKeyType="next"
        />

        <TextInput
          placeholder="Minor"
          placeholderTextColor={SUBTEXT}
          style={styles.input}
          value={minor}
          onChangeText={setMinor}
          returnKeyType="next"
        />

        {/* Age split into Day / Month / Year */}
        <Text style={styles.label}>Age</Text>
        <View style={styles.row}>
          <TextInput
            placeholder="DD"
            placeholderTextColor={SUBTEXT}
            style={[styles.input, styles.third]}
            keyboardType="number-pad"
            maxLength={2}
            value={day}
            onChangeText={(t) => setDay(t.replace(/[^0-9]/g, ""))}
            returnKeyType="next"
          />
          <TextInput
            placeholder="MM"
            placeholderTextColor={SUBTEXT}
            style={[styles.input, styles.third]}
            keyboardType="number-pad"
            maxLength={2}
            value={month}
            onChangeText={(t) => setMonth(t.replace(/[^0-9]/g, ""))}
            returnKeyType="next"
          />
          <TextInput
            placeholder="YYYY"
            placeholderTextColor={SUBTEXT}
            style={[styles.input, styles.third]}
            keyboardType="number-pad"
            maxLength={4}
            value={year}
            onChangeText={(t) => setYear(t.replace(/[^0-9]/g, ""))}
            returnKeyType="next"
          />
        </View>

        <TextInput
          placeholder="Gender"
          placeholderTextColor={SUBTEXT}
          style={styles.input}
          value={gender}
          onChangeText={setGender}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[styles.btn, { width: WRAP_W, opacity: busy ? 0.8 : 1 }]}
          activeOpacity={0.9}
          onPress={onCreate}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>
          By creating an account, you agree to our Terms and{"\n"}Conditions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const RADIUS = 20;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    paddingTop: Platform.select({ ios: 8, android: 8, web: 24 }),
  },
  content: {
    alignItems: "stretch",
    gap: 12,
    paddingBottom: 24,
  },
  header: {
    alignSelf: "center",
    fontSize: 18,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT,
    marginTop: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: SUBTEXT,
    marginTop: 6,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: TEXT,
    fontSize: 16,
    flexGrow: 1,
  },
  half: {
    flexBasis: "48%",
  },
  third: {
    flexBasis: (WRAP_W - 24) / 3,
    flexGrow: 0,
  },
  btn: {
    backgroundColor: MAROON,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  terms: {
    color: SUBTEXT,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
});
