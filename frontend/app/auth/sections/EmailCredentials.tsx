import React from "react";
import { View, TextInput, StyleSheet } from "react-native";

type Props = {
  emailInput: string;
  setEmailInput: (v: string) => void;
  passwordInput: string;
  setPasswordInput: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  styles: any;
  SUBTEXT?: string;
};

export default function EmailCredentials({
  emailInput,
  setEmailInput,
  passwordInput,
  setPasswordInput,
  confirmPassword,
  setConfirmPassword,
  styles,
  SUBTEXT,
}: Props) {
  return (
    <>
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
    </>
  );
}
