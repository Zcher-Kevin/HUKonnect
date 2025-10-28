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
import { router, useLocalSearchParams } from "expo-router";

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
import * as SecureStore from "expo-secure-store";
const API_BASE = "http://localhost:3000"; // <— change to your server

const MAROON = "#A2172C";
const BG = "#FFF7F7";
const TEXT = "#231F20";
const INPUT_BG = "#F5EAEA";
const SUBTEXT = "#7A6F6F";

const { width: W } = Dimensions.get("window");
const WRAP_W = Math.min(420, W * 0.92);

export default function CreateAccount() {
  const params = useLocalSearchParams();
  // If the login flow passed a profile (from Google), prefill first/last name
  React.useEffect(() => {
    try {
      const p = params.profile ? JSON.parse(params.profile as string) : null;
      if (p?.firstName) setFirst(p.firstName);
      if (p?.lastName) setLast(p.lastName);
    } catch (e) {
      // ignore parse errors
    }
  }, [params]);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [nickname, setNickname] = useState("");
  const [major, setMajor] = useState("");
  const [minor, setMinor] = useState("");
  const [studyYear, setStudyYear] = useState("");
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
    let token = await SecureStore.getItemAsync("token");

    // If there's no token, attempt to auto-register the user if we have
    // an email from the login flow (e.g., Google). This lets users who
    // signed in via Google proceed to fill their profile without a
    // separate registration step. If no email is available, throw an error
    // and require the user to sign in first.
    if (!token) {
      try {
        const p = params.profile ? JSON.parse(params.profile as string) : null;
        const email = p?.email;
        if (!email) {
          throw new Error(
            "No authenticated session found — please sign in first."
          );
        }

        // create a sensible username and random password for the local account
        const localPart = email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "");
        const usernameCandidate = `${localPart}-${Date.now()
          .toString()
          .slice(-4)}`;
        const randomPassword = Math.random().toString(36).slice(2, 12);

        const registerRes = await axios.post(
          `${API_BASE}/api/auth/register`,
          {
            username: usernameCandidate,
            email,
            password: randomPassword,
            firstName: first.trim(),
            lastName: last.trim(),
          },
          { timeout: 15000 }
        );

        token = registerRes.data?.token;
        if (token) {
          await SecureStore.setItemAsync("token", token);
        }
      } catch (regErr: any) {
        // bubble a helpful error to the UI
        throw new Error(
          regErr?.response?.data?.message ||
            regErr?.message ||
            "Failed to register user. Please sign in and try again."
        );
      }
    }

    const res = await axios.put(
      `${API_BASE}/api/users/me/profile`,
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
      // Call the backend to save the profile. submitProfile will throw on
      // validation or network errors which we catch below.
      await submitProfile();
      // On success, navigate into the app.
      router.replace("/(tabs)");
      return;
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
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.wrap}>
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
              placeholder="Last Name"
              placeholderTextColor={SUBTEXT}
              style={[styles.input, styles.half]}
              value={last}
              onChangeText={setLast}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
          <View style={styles.row}>
            <TextInput
              placeholder="Nickname (Optional)"
              placeholderTextColor={SUBTEXT}
              style={[styles.input, { flex: 2 }]}
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <TextInput
              placeholder="Gender"
              placeholderTextColor={SUBTEXT}
              style={[styles.input, { flex: 1 }]}
              value={gender}
              onChangeText={setGender}
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

          <View style={styles.row}>
            <TextInput
              placeholder="Minor (Optional)"
              placeholderTextColor={SUBTEXT}
              style={[styles.input, { flex: 2 }]}
              value={minor}
              onChangeText={setMinor}
              returnKeyType="next"
            />

            <TextInput
              placeholder="Year of Study"
              placeholderTextColor={SUBTEXT}
              style={[styles.input, { flex: 1 }]}
              value={studyYear}
              onChangeText={setStudyYear}
              returnKeyType="next"
            />
          </View>

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const RADIUS = 20;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    backgroundColor: BG,
    paddingTop: Platform.select({ ios: 12, android: 12, web: 24 }),
  },

  content: {
    // ensure children are centered horizontally inside the content area
    alignContent: "center",
    alignItems: "center",
    paddingBottom: 24,
  },

  // Fixed-width wrapper for the centered column
  wrap: {
    width: "90%",
    alignSelf: "center",
    gap: 12,
  },

  header: {
    alignSelf: "center",
    fontWeight: "700",
    fontSize: 18,
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
    width: "30%",
    flexBasis: "40%",
    flexGrow: 0,
  },

  // Increased horizontal size for the main button.
  // Using WRAP_W here makes the style adapt to the same base width used elsewhere;
  // adjust the multiplier to make it wider as needed.
  btn: {
    backgroundColor: MAROON,
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 8,
    width: WRAP_W * 1.5, // increased width (50% larger)
    alignSelf: "center",
    maxWidth: "100%",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  terms: {
    color: SUBTEXT,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
});
