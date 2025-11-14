// app/auth/create-account.tsx
// Create account form with email + profile info.
// Gender + Year of Study use fixed option pickers (no free text).
// BACKEND TODO: hook onCreate into /auth/register.

import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
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
const DEV_QUICK_REGISTER = false; // Set to false to perform real registration against the backend.

const MAROON = "#A2172C";
const BG = "#FFF7F7";
const TEXT = "#231F20";
const INPUT_BG = "#F5EAEA";
const SUBTEXT = "#7A6F6F";

const { width: W } = Dimensions.get("window");
const WRAP_W = Math.min(420, W * 0.92);
const RADIUS = 20;

const GENDER_OPTIONS = ["Male", "Female"];
const YEAR_OPTIONS = ["1", "2", "3", "4", "5", "Masters", "PhD"];

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
  const [email, setEmail] = useState("");
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
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [yearOfStudy, setYearOfStudy] =
    useState<"" | (typeof YEAR_OPTIONS)[number]>("");
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
   * API CALL (PUT /users/profile)
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
    try {
      // eslint-disable-next-line no-console
      if ((globalThis as any).__DEV__)
        console.log("[submitProfile] stored token present:", Boolean(token));
    } catch (e) {}

    // Defensive: if a non-JWT token (for example a leftover dev token like
    // "dev-token-...") is stored, clear it so we don't send it to the
    // backend where jwt.verify will throw a 'jwt malformed' error. A JWT
    // typically has three dot-separated segments.
    if (token && typeof token === "string") {
      const parts = token.split(".");
      if (parts.length !== 3) {
        try {
          // eslint-disable-next-line no-console
          if ((globalThis as any).__DEV__)
            console.warn(
              "[submitProfile] stored token is not a JWT; clearing stored token"
            );
        } catch (e) {}
        try {
          await storageSetItem("token", "");
        } catch (e) {
          // ignore storage errors
        }
        token = null;
      }
    }

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
          const registerRes = await (() => {
            const url = `${API_BASE}/api/auth/register`;
            const body = {
              email: emailInput.trim(),
              password: passwordInput,
              firstName: safeFirst,
              ...(last.trim() ? { lastName: last.trim() } : {}),
            };
            // Debug: log exact request target and body in dev
            try {
              // eslint-disable-next-line no-console
              console.log("[register] POST", url, body);
            } catch (e) {}
            return axios.post(url, body, { timeout: 15000 });
          })();

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

          const registerRes = await (() => {
            const url = `${API_BASE}/api/auth/register`;
            const body = {
              username: usernameCandidate,
              ...(email ? { email } : {}),
              password: randomPassword,
              firstName: safeFirst,
              ...(last.trim() ? { lastName: last.trim() } : {}),
            };
            try {
              // eslint-disable-next-line no-console
              console.log("[register] POST", url, body);
            } catch (e) {}
            return axios.post(url, body, { timeout: 15000 });
          })();

          token = registerRes.data?.token;
          if (token) {
            await storageSetItem("token", token as string);
          }
        }
      } catch (regErr: any) {
        // Log details for debugging (do not show raw tokens in UI)
        // eslint-disable-next-line no-console
        console.error("Register error details:", {
          message: regErr?.message,
          status: regErr?.response?.status,
          response: regErr?.response?.data,
        });
        // bubble a helpful error to the UI including status when available
        const status = regErr?.response?.status;
        const serverMsg = regErr?.response?.data?.message || regErr?.message;
        throw new Error(status ? `Status ${status}: ${serverMsg}` : serverMsg);
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

    // Note: backend mounts user routes at /api/users and exposes the
    // current-user profile endpoints at /profile (not /me/profile).
    const res = await axios.put(`${API_BASE}/api/users/profile`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      timeout: 15000,
    });

    try {
      // eslint-disable-next-line no-console
      if ((globalThis as any).__DEV__)
        console.log(
          "[submitProfile] PUT",
          `${API_BASE}/api/users/profile`,
          payload
        );
    } catch (e) {}

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
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert("Missing email", "Please enter your email.");
      return;
    }
    if (!trimmedEmail.includes("@")) {
      Alert.alert("Check email", "Please enter a valid email address.");
      return;
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
        contentContainerStyle={[styles.content, { width: WRAP_W }]}
        keyboardShouldPersistTaps="handled"
      >
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

        {/* Email */}
        <TextInput
          placeholder="Email"
          placeholderTextColor={SUBTEXT}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Name row */}
        <View style={styles.row}>
          <TextInput
            placeholder="First Name"
            placeholderTextColor={SUBTEXT}
            style={[styles.input, styles.half]}
            value={first}
            onChangeText={setFirst}
            autoCapitalize="words"
          />
          <TextInput
            placeholder="Surname"
            placeholderTextColor={SUBTEXT}
            style={[styles.input, styles.half]}
            value={last}
            onChangeText={setLast}
            autoCapitalize="words"
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

            {/* Year of study */}
            <Text style={styles.label}>Year of Study</Text>
            <View style={styles.chipRowWrap}>
              {YEAR_OPTIONS.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[
                    styles.chip,
                    yearOfStudy === y && styles.chipActive,
                  ]}
                  onPress={() =>
                    setYearOfStudy((prev) => (prev === y ? "" : y))
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      yearOfStudy === y && styles.chipTextActive,
                    ]}
                  >
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

        <TextInput
          placeholder="Major"
          placeholderTextColor={SUBTEXT}
          style={styles.input}
          value={major}
          onChangeText={setMajor}
        />

        <TextInput
          placeholder="Minor"
          placeholderTextColor={SUBTEXT}
          style={styles.input}
          value={minor}
          onChangeText={setMinor}
        />

        {/* DOB */}
        <Text style={styles.label}>Date of Birth</Text>
        <View style={styles.row}>
          <TextInput
            placeholder="DD"
            placeholderTextColor={SUBTEXT}
            style={[styles.input, styles.third]}
            keyboardType="number-pad"
            maxLength={2}
            value={day}
            onChangeText={(t) => setDay(t.replace(/[^0-9]/g, ""))}
          />
          <TextInput
            placeholder="MM"
            placeholderTextColor={SUBTEXT}
            style={[styles.input, styles.third]}
            keyboardType="number-pad"
            maxLength={2}
            value={month}
            onChangeText={(t) => setMonth(t.replace(/[^0-9]/g, ""))}
          />
          <TextInput
            placeholder="YYYY"
            placeholderTextColor={SUBTEXT}
            style={[styles.input, styles.third]}
            keyboardType="number-pad"
            maxLength={4}
            value={year}
            onChangeText={(t) => setYear(t.replace(/[^0-9]/g, ""))}
          />
        </View>

        {/* Gender */}
        <Text style={styles.label}>Gender</Text>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.chip,
                gender === g && styles.chipActive,
              ]}
              onPress={() =>
                setGender((prev) => (prev === g ? "" : (g as any)))
              }
            >
              <Text
                style={[
                  styles.chipText,
                  gender === g && styles.chipTextActive,
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, { width: WRAP_W }]}
          activeOpacity={0.9}
          onPress={onCreate}
        >
          <Text style={styles.btnText}>Create Account</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By creating an account, you agree to our Terms and{"\n"}Conditions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    marginBottom: 4,
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
  chipRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  chipRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: MAROON,
    borderColor: MAROON,
  },
  chipText: {
    fontSize: 14,
    color: TEXT,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  btn: {
    backgroundColor: MAROON,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  terms: {
    color: SUBTEXT,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
});
