// app/(tabs)/edit-profile.tsx
// Edit profile info screen, mirroring create-account but prefilled.
// Uses the same Gender + Year of Study option pickers.
// BACKEND TODO: load current user + PATCH on save.

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
  Alert,
} from "react-native";
import { router } from "expo-router";
import axios from "axios";
import { getItem as storageGetItem } from "../lib/storage";
import { API_BASE } from "../lib/config";
import { publish } from "../lib/events";
import { setCurrentUserProfile } from "../lib/chatStore";
import { updateCurrentUserData } from "../lib/followStore";

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

// FRONTEND: placeholder current user.
// BACKEND TODO: replace with data from auth/user context or API.
const CURRENT_USER = {
  email: "you@example.edu",
  firstName: "Your",
  lastName: "Name",
  major: "Computer Science",
  minor: "",
  dob: { day: "01", month: "09", year: "2000" },
  gender: "Male" as "Male" | "Female" | "",
  yearOfStudy: "3" as (typeof YEAR_OPTIONS)[number] | "",
};

export default function EditProfile() {
  const [email, setEmail] = useState(CURRENT_USER.email);
  const [first, setFirst] = useState(CURRENT_USER.firstName);
  const [last, setLast] = useState(CURRENT_USER.lastName);
  const [major, setMajor] = useState(CURRENT_USER.major);
  const [minor, setMinor] = useState(CURRENT_USER.minor);
  const [day, setDay] = useState(CURRENT_USER.dob.day);
  const [month, setMonth] = useState(CURRENT_USER.dob.month);
  const [year, setYear] = useState(CURRENT_USER.dob.year);
  const [gender, setGender] = useState<"Male" | "Female" | "">(
    CURRENT_USER.gender || ""
  );
  const [yearOfStudy, setYearOfStudy] = useState<
    "" | (typeof YEAR_OPTIONS)[number]
  >(CURRENT_USER.yearOfStudy || "");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const onSave = async () => {
    // Prepare payload (do not attempt to change email here)
    const payload: any = {
      firstName: first.trim() || undefined,
      lastName: last.trim() || undefined,
      major: major.trim() || undefined,
      minor: minor.trim() || undefined,
      gender: gender || undefined,
      yearOfStudy: yearOfStudy || undefined,
    };

    // Build DOB as ISO date string if fields look valid
    const dd = String(day || "")
      .trim()
      .padStart(2, "0");
    const mm = String(month || "")
      .trim()
      .padStart(2, "0");
    const yyyy = String(year || "").trim();
    if (/^\d{4}$/.test(yyyy) && /^\d{2}$/.test(mm) && /^\d{2}$/.test(dd)) {
      // YYYY-MM-DD
      payload.dob = `${yyyy}-${mm}-${dd}`;
    }

    setIsSaving(true);
    try {
      const token = (await storageGetItem("token")) as string | null;
      // debug: log payload
      console.log("[edit-profile] sending payload", payload);
      const res = await axios.put(`${API_BASE}/api/users/profile`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 8000,
      });
      console.log("[edit-profile] response", res?.status, res?.data);

      if (res?.data?.success) {
        // Update chat store cache and notify other parts of the app to refresh profile displays
        try {
          setCurrentUserProfile(res.data.user);
        } catch (e) {}
        try {
          updateCurrentUserData({
            name: res.data.user.firstName
              ? `${res.data.user.firstName} ${
                  res.data.user.lastName || ""
                }`.trim()
              : undefined,
            major: res.data.user.major,
          });
        } catch (e) {}
        try {
          publish("profile:updated", res.data.user);
        } catch (e) {}
        Alert.alert("Saved", "Your profile has been updated.");
        router.back();
      } else {
        throw new Error(res?.data?.message || "Update failed");
      }
    } catch (err: any) {
      console.error("Profile save error", err);
      const serverMsg = err?.response?.data?.message || err?.message;
      const status = err?.response?.status;
      Alert.alert(
        "Update failed",
        serverMsg || `Request failed${status ? ` (status ${status})` : ""}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // If the user's email is a Gmail address (Google sign-in), do not allow
  // editing it from this screen. This prevents users from changing a Google-linked email here.
  const isGmail =
    String(email || "")
      .toLowerCase()
      .endsWith("@gmail.com") ||
    String(email || "")
      .toLowerCase()
      .endsWith("@googlemail.com");

  // Fetch current user's profile from backend and prefill the form when available
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = (await storageGetItem("token")) as string | null;
        if (!token) return;
        const res = await axios.get(`${API_BASE}/api/users/profile`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          timeout: 8000,
        });
        const u = res?.data?.user;
        if (!u || !mounted) return;
        // Map server fields to local form state (safe defaults)
        if (u.email) setEmail(String(u.email));
        else if (u.username) setEmail(String(u.username));
        if (u.firstName) setFirst(String(u.firstName));
        if (u.lastName) setLast(String(u.lastName));
        if (u.major) setMajor(String(u.major));
        if (u.minor) setMinor(String(u.minor));
        if (u.dob && typeof u.dob === "object") {
          if (u.dob.day) setDay(String(u.dob.day));
          if (u.dob.month) setMonth(String(u.dob.month));
          if (u.dob.year) setYear(String(u.dob.year));
        }
        if (u.gender)
          setGender(
            u.gender === "Male" ? "Male" : u.gender === "Female" ? "Female" : ""
          );
        if (u.yearOfStudy) setYearOfStudy(String(u.yearOfStudy) as any);
      } catch (e) {
        // ignore errors — keep placeholders
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={{ alignSelf: "stretch" }}
        contentContainerStyle={[styles.content, { width: WRAP_W }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back + title */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.sectionTitle}>Your Information</Text>

        {/* Email */}
        <TextInput
          placeholder="Email"
          placeholderTextColor={SUBTEXT}
          style={[styles.input, styles.inputDisabled]}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={false}
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
              style={[styles.chip, gender === g && styles.chipActive]}
              onPress={() =>
                setGender((prev) => (prev === g ? "" : (g as any)))
              }
            >
              <Text
                style={[styles.chipText, gender === g && styles.chipTextActive]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Year of study */}
        <Text style={styles.label}>Year of Study</Text>
        <View style={styles.chipRowWrap}>
          {YEAR_OPTIONS.map((y) => (
            <TouchableOpacity
              key={y}
              style={[styles.chip, yearOfStudy === y && styles.chipActive]}
              onPress={() => setYearOfStudy((prev) => (prev === y ? "" : y))}
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

        <TouchableOpacity
          style={[styles.btn, { width: WRAP_W, opacity: isSaving ? 0.6 : 1 }]}
          activeOpacity={0.9}
          onPress={onSave}
          disabled={isSaving}
        >
          <Text style={styles.btnText}>
            {isSaving ? "Saving..." : "Save changes"}
          </Text>
        </TouchableOpacity>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  backBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 22,
    color: TEXT,
  },
  header: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: TEXT,
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
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: "#F0F0F0",
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
    marginTop: 12,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
