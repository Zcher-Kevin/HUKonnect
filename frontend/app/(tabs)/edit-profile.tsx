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
  const [yearOfStudy, setYearOfStudy] =
    useState<"" | (typeof YEAR_OPTIONS)[number]>(
      CURRENT_USER.yearOfStudy || ""
    );

  const onSave = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      Alert.alert("Check email", "Please enter a valid email address.");
      return;
    }

    const payload = {
      email: trimmedEmail,
      firstName: first.trim(),
      lastName: last.trim(),
      major: major.trim(),
      minor: minor.trim(),
      dob: { day: day.trim(), month: month.trim(), year: year.trim() },
      gender: gender || null,
      yearOfStudy: yearOfStudy || null,
    };

    try {
      // BACKEND TODO:
      // const res = await fetch("http://<backend>/users/me", {
      //   method: "PATCH",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(payload),
      // });
      // if (!res.ok) throw new Error("Update failed");

      Alert.alert("Saved", "Your profile has been updated.");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Update failed",
        "We couldn't save your changes. Please try again."
      );
    }
  };

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

        <TouchableOpacity
          style={[styles.btn, { width: WRAP_W }]}
          activeOpacity={0.9}
          onPress={onSave}
        >
          <Text style={styles.btnText}>Save changes</Text>
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
