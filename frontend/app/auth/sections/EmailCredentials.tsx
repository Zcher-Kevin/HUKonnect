import React, { useEffect, useState } from "react";
import { View, TextInput, StyleSheet, Text } from "react-native";
import axios from 'axios';
import { API_BASE } from '../../lib/config';

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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Debounce email checks so we don't spam the API on every keystroke
  useEffect(() => {
    setEmailError(null);
    if (!emailInput) return;
    // basic client-side format check
    const simpleEmailRegex = /\S+@\S+\.\S+/;
    if (!simpleEmailRegex.test(emailInput)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    const t = setTimeout(async () => {
      try {
        setChecking(true);
        const res = await axios.get(`${API_BASE}/api/auth/check-email`, { params: { email: emailInput } });
        if (res && res.data && res.data.available === false) {
          setEmailError('Email already in use');
        } else {
          setEmailError(null);
        }
      } catch (e) {
        // network or server error — don't block the user but surface a hint
        setEmailError(null);
      } finally {
        setChecking(false);
      }
    }, 600);

    return () => clearTimeout(t);
  }, [emailInput]);
  return (
    <>
      <TextInput
        placeholder="Email"
        placeholderTextColor={SUBTEXT}
        style={styles.input}
        value={emailInput}
        onChangeText={setEmailInput}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
      />
      {emailError ? (
        <Text style={{ color: '#D9534F', marginTop: 6, marginLeft: 4 }}>{emailError}</Text>
      ) : null}

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
