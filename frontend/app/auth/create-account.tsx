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
import {
  setItem as storageSetItem,
  getItem as storageGetItem,
} from "../lib/storage";
import { isValidEmail } from "../lib/validators";
import { API_BASE } from "../lib/config";
// Developer convenience: when true, clicking Create Account will skip
// real network registration and immediately let you into the app.
// WARNING: For production builds this MUST be false.
const DEV_QUICK_REGISTER = true;

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
  // Local auth fields (optional). If provided we will register using these
  // credentials instead of generating a random password.
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    // Dev shortcut: immediately return a fake user and token so testers can
    // enter the app without the backend. This is intentionally simple and
    // should be disabled before production.
    if (DEV_QUICK_REGISTER) {
      const devToken = `dev-token-${Date.now()}`;
      try {
        await storageSetItem("token", devToken);
      } catch (e) {
        // ignore SecureStore errors during quick dev flow
      }
      return { user: { id: "dev", firstName: first.trim() || "Dev User" } };
    }
    // NOTE: Relaxed validation to allow quick-start registration with no input.
    // If the user leaves fields blank we will auto-generate a minimal account
    // (username + random password) so they can enter the app immediately.
    // DOB is optional — only build it when all three parts are provided.
    let dob: string | undefined = undefined;
    if (day || month || year) {
      // Only require a full date if any part was provided
      if (day.length !== 2 || month.length !== 2 || year.length !== 4) {
        throw new Error(
          "Please enter a valid date (DD/MM/YYYY) or leave it blank."
        );
      }
      dob = buildDob();
    }

    // Retrieve your JWT created during Google sign-in (if you saved one)
    let token = (await storageGetItem("token")) as string | null;

    // If there's no token, attempt to register the user. Priority:
    // 1) If the user manually provided email+password on this screen, use that.
    // 2) Else try to use the profile passed from an OAuth flow (params.profile).
    // 3) Else fall back to auto-generated username + random password.
    if (!token) {
      try {
        // If user manually entered an email/password, use those
        if (emailInput.trim() || passwordInput) {
          // Client-side validation: ensur          npx expo start --dev-client -c          rm -rf /Users/kevin/Desktop/HUKonnect/frontend/node_modulese provided email looks valid
          if (emailInput && !isValidEmail(emailInput)) {
            throw new Error("Please enter a valid email address.");
          }
          if (!emailInput.trim() || !passwordInput) {
            throw new Error(
              "Please provide both email and password to register."
            );
          }
          if (passwordInput.length < 6) {
            throw new Error("Password must be at least 6 characters long.");
          }
          if (passwordInput !== confirmPassword) {
            throw new Error("Password and confirmation do not match.");
          }

          const safeFirst =
            first.trim() || `User${Date.now().toString().slice(-4)}`;
          const registerRes = await axios.post(
            `${API_BASE}/api/auth/register`,
            {
              email: emailInput.trim(),
              password: passwordInput,
              firstName: safeFirst,
              ...(last.trim() ? { lastName: last.trim() } : {}),
            },
            { timeout: 15000 }
          );

          token = registerRes.data?.token;
          if (token) {
            await storageSetItem("token", token as string);
          }
        } else {
          // No manual creds — try to use OAuth-provided profile or fallback to auto-generated
          const p = params.profile
            ? JSON.parse(params.profile as any as string)
            : null;
          const email = p?.email as string | undefined;

          // create a sensible username and random password for the local account
          const localBase = email
            ? email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "")
            : "user";
          const usernameCandidate = `${localBase}-${Date.now()
            .toString()
            .slice(-4)}`;
          const randomPassword = Math.random().toString(36).slice(2, 12);

          // Ensure we provide at least a firstName to satisfy the server; if
          // user didn't enter one we auto-generate a friendly name.
          const safeFirst =
            first.trim() || `User${Date.now().toString().slice(-4)}`;

          const registerRes = await axios.post(
            `${API_BASE}/api/auth/register`,
            {
              username: usernameCandidate,
              ...(email ? { email } : {}),
              password: randomPassword,
              firstName: safeFirst,
              ...(last.trim() ? { lastName: last.trim() } : {}),
            },
            { timeout: 15000 }
          );

          token = registerRes.data?.token;
          if (token) {
            await storageSetItem("token", token as string);
          }
        }
      } catch (regErr: any) {
        // Log details for debugging (do not show raw tokens in UI)
        console.error("Register error details:", {
          message: regErr?.message,
          response: regErr?.response?.data,
        });
        // bubble a helpful error to the UI
        throw new Error(
          regErr?.response?.data?.message ||
            regErr?.message ||
            "Failed to register user. Please sign in and try again."
        );
      }
    }

    // Build the payload only with fields the user actually provided so we
    // don't overwrite generated values (e.g., auto-generated firstName).
    const payload: any = {};
    if (first.trim()) payload.firstName = first.trim();
    if (last.trim()) payload.lastName = last.trim();
    if (major.trim()) payload.major = major.trim();
    if (minor.trim()) payload.minor = minor.trim();
    if (dob) payload.dob = dob;
    if (gender.trim()) payload.gender = gender.trim();
    payload.termsAccepted = true;

    const res = await axios.put(`${API_BASE}/api/users/me/profile`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      timeout: 15000,
    });

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

  // Form validation for enabling the Create Account button.
  // Rules:
  // - If the user starts entering manual credentials (email or password),
  //   require email, password and confirmPassword, a valid email, minimum
  //   password length, and matching confirmation.
  // - Otherwise require at least a first name so an account has an identity.
  const hasManualCreds = Boolean(
    (emailInput && emailInput.trim()) || passwordInput || confirmPassword
  );

  const manualCredsValid = Boolean(
    emailInput &&
      emailInput.trim() &&
      isValidEmail(emailInput) &&
      passwordInput &&
      passwordInput.length >= 6 &&
      confirmPassword &&
      passwordInput === confirmPassword
  );

  const isFormValid = hasManualCreds
    ? manualCredsValid
    : Boolean(first && first.trim());

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={{ alignSelf: "stretch" }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.wrap}>
          <Text style={styles.header}>Create Account</Text>

          <Text style={styles.sectionTitle}>Account</Text>

          <TextInput
            placeholder="Email (optional)"
            placeholderTextColor={SUBTEXT}
            style={styles.input}
            value={emailInput}
            onChangeText={setEmailInput}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <TextInput
            placeholder="Password (min 6 chars)"
            placeholderTextColor={SUBTEXT}
            style={styles.input}
            value={passwordInput}
            onChangeText={setPasswordInput}
            secureTextEntry
            returnKeyType="next"
          />

          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={SUBTEXT}
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            returnKeyType="next"
          />

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
            style={[
              styles.btn,
              { width: WRAP_W, opacity: busy || !isFormValid ? 0.6 : 1 },
            ]}
            activeOpacity={0.9}
            onPress={async () => {
              if (!isFormValid) {
                // Provide a friendly hint when user tries to submit an invalid form
                if (hasManualCreds) {
                  Alert.alert(
                    "Create Account",
                    "Please provide a valid email and matching password (min 6 characters)."
                  );
                } else {
                  Alert.alert(
                    "Create Account",
                    "Please enter your first name."
                  );
                }
                return;
              }
              await onCreate();
            }}
            disabled={busy || !isFormValid}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* When the form is disabled show a small hint about what's required */}
          {!isFormValid ? (
            <Text style={{ color: SUBTEXT, textAlign: "center", marginTop: 6 }}>
              {hasManualCreds
                ? "Email + password required. Passwords must match and be at least 6 characters."
                : "Please enter your first name to continue (or provide email + password)."}
            </Text>
          ) : null}

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

  // ensure children are centered horizontally inside the content area
  content: {
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
