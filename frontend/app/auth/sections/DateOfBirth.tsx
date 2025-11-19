import React from "react";
import { View, TextInput } from "react-native";

type Props = {
  day: string;
  setDay: (v: string) => void;
  month: string;
  setMonth: (v: string) => void;
  year: string;
  setYear: (v: string) => void;
  styles: any;
  SUBTEXT?: string;
};

export default function DateOfBirth({
  day,
  setDay,
  month,
  setMonth,
  year,
  setYear,
  styles,
  SUBTEXT,
}: Props) {
  return (
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
  );
}
