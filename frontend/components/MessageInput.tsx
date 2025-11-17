import React from "react";
import { 
  View,
  TextInput,
  StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BouncyButton } from "./BouncyButton";

interface Props {
  text: string;
  setText: (t: string) => void;
  onSend: () => void;
  editing?: boolean;
}

export default function MessageInput({
  text,
  setText,
  onSend,
  editing = false,
}: Props) {
  return (
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={editing ? "Edit message..." : "Message..."}
      />
      <BouncyButton
        onPress={onSend}
        style={styles.sendButton}
      >
        <Ionicons name="send" size={20} color="#fff" />
      </BouncyButton>
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f6f6f6",
    borderRadius: 20,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
