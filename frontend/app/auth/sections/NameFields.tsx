import React from "react";
import { View, TextInput } from "react-native";

type Props = {
  first: string;
  setFirst: (v: string) => void;
  last: string;
  setLast: (v: string) => void;
  styles: any;
};

export default function NameFields({
  first,
  setFirst,
  last,
  setLast,
  styles,
}: Props) {
  return (
    <View style={styles.row}>
      <TextInput
        placeholder="First Name"
        placeholderTextColor={styles?.SUBTEXT || "#7A6F6F"}
        style={[styles.input, styles.half]}
        value={first}
        onChangeText={setFirst}
        autoCapitalize="words"
      />
      <TextInput
        placeholder="Surname"
        placeholderTextColor={styles?.SUBTEXT || "#7A6F6F"}
        style={[styles.input, styles.half]}
        value={last}
        onChangeText={setLast}
        autoCapitalize="words"
      />
    </View>
  );
}
