import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Message } from "../app/lib/chatStore";

interface Props {
  item: Message;
  reply?: Message | null;
  myId: string | null;
  localDisplayName: string | null;
  peerName: string;
  onLongPress: (m: Message) => void;
}

const MessageBubble: React.FC<Props> = (props) => {
  const { item, reply, myId, localDisplayName, peerName, onLongPress } = props;
  const mine =
    item.id?.toString().startsWith("temp-") || (myId && item.senderId === myId);

  return (
    <View style={[styles.row, mine ? styles.right : styles.left]}>
      <Pressable
        style={[
          styles.bubble,
          {
            backgroundColor: mine ? "#D9FDD3" : "#FFFFFF",
            alignSelf: mine ? "flex-end" : "flex-start",
          },
        ]}
        onLongPress={() => onLongPress(item)}
        onPress={() => {
          if (Platform.OS === "web") onLongPress(item);
        }}
      >
        {reply && (
          <View style={styles.replyWrap}>
            <View style={styles.replyBar} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.replyName}>
                {reply.id?.toString().startsWith("temp-") ||
                (myId && reply.senderId === myId)
                  ? "You"
                  : localDisplayName || peerName}
              </Text>
              <Text numberOfLines={1} style={styles.replySnippet}>
                {reply.text}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.msgText}>{item.text}</Text>
        <View style={styles.metaRow}>
          {item.editedAt && <Text style={styles.edited}>edited</Text>}
          <Text style={styles.time}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { paddingVertical: 4, paddingHorizontal: 8 },
  left: { alignItems: "flex-start" },
  right: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
  },
  msgText: { color: "#231F20", fontSize: 16, lineHeight: 20 },
  metaRow: {
    flexDirection: "row",
    alignSelf: "flex-end",
    gap: 6,
    marginTop: 4,
  },
  edited: { color: "#7A6F6F", fontSize: 10 },
  time: { color: "#7A6F6F", fontSize: 10 },
  replyWrap: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  replyBar: { width: 3, borderRadius: 3, backgroundColor: "#A2172C" },
  replyName: { fontSize: 12, fontWeight: "700", color: "#231F20" },
  replySnippet: { fontSize: 12, color: "#7A6F6F" },
});

export default MessageBubble;
