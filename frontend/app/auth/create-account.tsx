// app/auth/create-account.tsx
// Create account form with email + profile info.
// Gender + Year of Study use fixed option pickers (no free text).
// BACKEND TODO: hook onCreate into /auth/register.

import React, { useState, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  TextInput,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { BouncyButton } from "../../components/BouncyButton";
import { router, useLocalSearchParams } from "expo-router";
import EmailCredentials from "./sections/EmailCredentials";
import NameFields from "./sections/NameFields";
import MajorMinorYear from "./sections/MajorMinorYear";
import DateOfBirth from "./sections/DateOfBirth";

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
import { emitAuthChange } from "../lib/authEvents";
import { setAuthPending, isAuthPending } from "../lib/authFlag";
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

export default function email() {
  const params = useLocalSearchParams();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  // Local auth fields (optional). If provided we will register using these
  // credentials instead of generating a random password.
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [major, setMajor] = useState("");
  const [minor, setMinor] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [yearOfStudy, setYearOfStudy] = useState<
    "" | (typeof YEAR_OPTIONS)[number]
  >("");
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);

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
    // Prevent concurrent submissions from multiple rapid taps or re-renders.
    if (submittingRef.current) {
      try {
        if ((globalThis as any).__DEV__)
          console.warn(
            "[submitProfile] already submitting, ignoring duplicate call"
          );
      } catch (e) {}
      return;
    }
    submittingRef.current = true;
    // Mark that an auth flow is in progress so other components (for
    // example the Schedule autosave) don't accidentally send profile
    // updates using a stale token. Use the in-memory flag for immediate
    // coordination.
    try {
      setAuthPending(true);
    } catch (e) {}
    try {
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

      // If the user provided manual email/password on this screen, prefer
      // creating a fresh account regardless of any existing stored token.
      // This prevents updating another user's profile when trying to create a
      // new account on the same device.
      if (emailInput.trim() || passwordInput) {
        try {
          // Clear any existing stored token so intermediate profile PUTs
          // (including accidental ones) won't authenticate as the previous
          // user. We keep the in-memory `auth:pending` flag set so other
          // components will pause backend sync.
          try {
            await storageSetItem("token", "");
            token = null;
          } catch (e) {
            // ignore storage errors
          }
          // Client-side validation
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
          const url = `${API_BASE}/api/auth/register`;
          const body = {
            email: emailInput.trim(),
            password: passwordInput,
            firstName: safeFirst,
            ...(last.trim() ? { lastName: last.trim() } : {}),
            // Request a long-lived session for pre-login convenience
            remember: true,
            ...(yearOfStudy ? { yearOfStudy: yearOfStudy } : {}),
            ...(gender ? { gender } : {}),
            ...(dob ? { dob } : {}),
          };
          try {
            // eslint-disable-next-line no-console
            console.log("[register] POST", url, body);
          } catch (e) {}
          const registerRes = await axios.post(url, body, { timeout: 15000 });
          token = registerRes.data?.token;
          if (token) await storageSetItem("token", token as string);
          try {
            emitAuthChange();
          } catch (e) {}
        } catch (regErr: any) {
          const status = regErr?.response?.status;
          const serverMsg =
            regErr?.response?.data?.message || (regErr as any)?.message;
          throw new Error(
            status ? `Status ${status}: ${serverMsg}` : serverMsg
          );
        }
      }

      // If the user didn't supply manual credentials we still want to create
      // a fresh account for them (this screen's purpose is registration). If
      // a token is already stored for a different user, silently clearing it
      // and registering avoids mistakenly updating that other account.
      // Run generated-account registration when manual credentials are not
      // provided (regardless of whether a token was present).
      if (!emailInput.trim() && !passwordInput) {
        try {
          // Clear any previously stored token before creating a generated
          // account to avoid accidental updates being authenticated as the
          // old user.
          try {
            await storageSetItem("token", "");
            token = null;
          } catch (e) {}
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

          const safeFirst =
            first.trim() || `User${Date.now().toString().slice(-4)}`;
          const url = `${API_BASE}/api/auth/register`;
          const body = {
            username: usernameCandidate,
            ...(email ? { email } : {}),
            password: randomPassword,
            firstName: safeFirst,
            ...(last.trim() ? { lastName: last.trim() } : {}),
            // Request a long-lived session for pre-login convenience
            remember: true,
            ...(yearOfStudy ? { yearOfStudy } : {}),
            ...(gender ? { gender } : {}),
            ...(dob ? { dob } : {}),
          };
          try {
            // eslint-disable-next-line no-console
            console.log("[register] POST", url, body);
          } catch (e) {}
          const registerRes = await axios.post(url, body, { timeout: 15000 });
          token = registerRes.data?.token;
          if (token) await storageSetItem("token", token as string);
          try {
            emitAuthChange();
          } catch (e) {}
        } catch (regErr: any) {
          const status = regErr?.response?.status;
          const serverMsg =
            regErr?.response?.data?.message || (regErr as any)?.message;
          throw new Error(
            status ? `Status ${status}: ${serverMsg}` : serverMsg
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
      // Include yearOfStudy selection if provided. The backend will
      // normalize numeric or label values to the canonical enum.
      if (yearOfStudy && yearOfStudy.trim())
        payload.yearOfStudy = yearOfStudy.trim();
      if (dob) payload.dob = dob;
      if (gender.trim()) payload.gender = gender.trim();
      payload.termsAccepted = true;

      // Note: backend mounts user routes at /api/users and exposes the
      // current-user profile endpoints at /profile (not /me/profile).
      // (dev logging removed)
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
    } finally {
      // Clear the in-memory pending flag so other UI components resume
      // backend sync behavior.
      try {
        setAuthPending(false);
      } catch (e) {}
      submittingRef.current = false;
    }
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
      // If user provided an email, do a quick availability check so we can
      // show a friendly error before attempting full registration.
      if (emailInput && emailInput.trim()) {
        try {
          const chk = await axios.get(`${API_BASE}/api/auth/check-email`, { params: { email: emailInput.trim() } });
          if (chk?.data?.available === false) {
            Alert.alert('Create Account', 'This email is already registered. Please log in or use a different email.');
            return;
          }
        } catch (e) {
          // ignore check failures and proceed to allow server to validate
        }
      }

      // Call the backend to save the profile. submitProfile will throw on
      // validation or network errors which we catch below.
      await submitProfile();
      // On success, navigate into the app.
      router.replace("/(tabs)");
      return;
    } catch (err: any) {
      try {
        // Log full error for debugging
        console.error('[onCreate] registration error', err);
      } catch (e) {}
      const status = err?.response?.status;
      const serverBody = err?.response?.data;
      let serverMsg = serverBody?.message;
      if (!serverMsg && serverBody && typeof serverBody === 'object') {
        // Try common shapes: { errors: [...] } or raw object
        if (serverBody.errors) serverMsg = JSON.stringify(serverBody.errors);
        else serverMsg = JSON.stringify(serverBody);
      }
      const display = serverMsg || err?.message || 'Could not create your account. Please try again.';
      const alertMsg = status ? `Status ${status}: ${display}` : display;
      try {
        Alert.alert('Create Account', alertMsg);
      } catch (e) {
        // If Alert fails (rare), log as fallback
        try { console.error('[onCreate] Alert failed', e); } catch (er) {}
      }
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
          <EmailCredentials
            emailInput={emailInput}
            setEmailInput={setEmailInput}
            passwordInput={passwordInput}
            setPasswordInput={setPasswordInput}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            styles={styles}
            SUBTEXT={SUBTEXT}
          />

          <Text style={styles.sectionTitle}>Your Information</Text>

          <NameFields
            first={first}
            setFirst={setFirst}
            last={last}
            setLast={setLast}
            styles={styles}
          />
          <MajorMinorYear
            major={major}
            setMajor={setMajor}
            minor={minor}
            setMinor={setMinor}
            yearOfStudy={yearOfStudy}
            setYearOfStudy={setYearOfStudy}
            styles={styles}
            YEAR_OPTIONS={YEAR_OPTIONS}
            SUBTEXT={SUBTEXT}
          />

          {/* DOB */}
          <Text style={styles.label}>Date of Birth</Text>
          <DateOfBirth
            day={day}
            setDay={setDay}
            month={month}
            setMonth={setMonth}
            year={year}
            setYear={setYear}
            styles={styles}
            SUBTEXT={SUBTEXT}
          />

          {/* Gender */}
          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map((g) => (
              <BouncyButton
                key={g}
                style={[styles.chip, gender === g && styles.chipActive]}
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
              </BouncyButton>
            ))}
          </View>

          <BouncyButton
            style={[
              styles.btn,
              { width: WRAP_W, opacity: busy || !isFormValid ? 0.6 : 1 },
            ]}
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
          </BouncyButton>

          {!isFormValid ? (
            <Text style={{ color: SUBTEXT, textAlign: "center", marginTop: 6 }}>
              {hasManualCreds
                ? "Email + password required. Passwords must match and be at least 6 characters."
                : "Please enter your first name to continue (or provide email + password)."}
            </Text>
          ) : null}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    backgroundColor: BG,
    paddingTop: Platform.select({ ios: 12, android: 12, web: 24 }),
  },

  content: {
    alignContent: "center",
    alignItems: "center",
    paddingBottom: 24,
  },

  wrap: {
    width: "90%",
    alignSelf: "center",
    gap: 12,
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
    paddingVertical: 8,
    color: TEXT,
    fontSize: 16,
    flexGrow: 1,
  },
  half: {
    flexBasis: "48%",
  },

  third: {
    width: "31%",
    flexBasis: "31%",
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
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "Text",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemActive: {
    backgroundColor: MAROON,
  },
  navText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
  },
  navTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  yearToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  yearToggleActive: {
    borderWidth: 1,
    borderColor: MAROON,
  },
  yearToggleText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
  },
  caret: {
    color: SUBTEXT,
    fontSize: 14,
    marginLeft: 8,
  },
  yearListItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 6,
  },
  yearSelectorWrap: {
    position: "relative",
    width: "100%",
  },
  yearListContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 8,
    maxHeight: 220,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  modalWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalPanel: {
    width: "100%",
    maxHeight: 360,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
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
