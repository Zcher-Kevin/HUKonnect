// app/messages/[id].tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView, View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Pressable, Platform, Modal
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { chat, useMessages, Message } from "../lib/chatStore";

/* ================== BACKEND NOTES (concise) ==================
Threads & DMs (suggested):
  GET    /chats                      → Thread[]
  GET    /chats/dm/:peerId           → { thread, messages: Message[] }
  POST   /chats/dm/:peerId/messages  { text, replyToId? } → Message
  PATCH  /chats/:chatId/messages/:id { text }             → Message (editedAt)
  DELETE /chats/:chatId/messages/:id
Auth: Bearer <JWT>

Swap points:
  - chat.ensureThread(peerId, name)    → bootstrap from GET /chats once ready
  - chat.send(...)                     → POST, then update store with response
  - chat.edit(chatId, id, text)        → PATCH, then update store
  - chat.remove(chatId, id)            → DELETE, then update store
=============================================================== */

const BG = "#FFF7F7", TEXT = "#231F20", SUB = "#7A6F6F", ACCENT = "#A2172C";
const BUBBLE_ME = "#D9FDD3", BUBBLE_THEM = "#FFFFFF";
const ME = "u_me"; // must match chatStore

export default function DMChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const peerId = id!;
  const peerName = useMemo(() => peerId.replace(/^./, s => s.toUpperCase()), [peerId]);

  // ensure thread exists (outside render to avoid re-render loops)
  useEffect(() => {
    chat.ensureThread(peerId, peerName);
  }, [peerId, peerName]);

  const data = useMessages(`dm:${peerId}`);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [menuFor, setMenuFor] = useState<Message | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const send = () => {
    const t = text.trim();
    if (!t) return;

    if (editing) {
      // BACKEND: PATCH /chats/:chatId/messages/:id { text }
      chat.edit(editing.chatId, editing.id, t);
      setEditing(null);
      setText("");
      return;
    }

    // BACKEND: POST /chats/dm/:peerId/messages { text, replyToId? }
    chat.send(peerId, peerName, t, { replyToId: replyTo?.id });
    setReplyTo(null);
    setText("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);
  };

  const onEdit = (m: Message) => {
    if (m.senderId !== ME) return; // only my own messages
    setEditing(m);
    setReplyTo(null);
    setText(m.text);
  };

  const onReply = (m: Message) => {
    setReplyTo(m);
    setEditing(null);
  };

  const onDelete = (m: Message) => {
    // BACKEND: DELETE /chats/:chatId/messages/:id
    chat.remove(m.chatId, m.id);
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{peerName}</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 96 }}
        renderItem={({ item }) => {
          const mine = item.senderId === ME;
          const reply = item.replyToId ? data.find(x => x.id === item.replyToId) : undefined;

          return (
            <View style={[styles.row, mine ? styles.right : styles.left]}>
              <Pressable
                style={[
                  styles.bubble,
                  { backgroundColor: mine ? BUBBLE_ME : BUBBLE_THEM, alignSelf: mine ? "flex-end" : "flex-start" },
                ]}
                onLongPress={() => setMenuFor(item)}
                onPress={() => { if (Platform.OS === "web") setMenuFor(item); }}
              >
                {reply && (
                  <View style={styles.replyWrap}>
                    <View style={styles.replyBar} />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={styles.replyName}>
                        {reply.senderId === ME ? "You" : peerName}
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
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        }}
      />

      {/* Reply/Edit bar */}
      {(replyTo || editing) && (
        <View style={styles.bar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.barTitle}>{editing ? "Editing message" : "Replying to"}</Text>
            <Text numberOfLines={1} style={styles.barSnippet}>
              {editing ? `“${editing.text}”` : replyTo?.text}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { setReplyTo(null); setEditing(null); setText(""); }}
            style={styles.barClose}
          >
            <Ionicons name="close" size={20} color={TEXT} />
          </TouchableOpacity>
        </View>
      )}

      {/* Composer */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={editing ? "Edit message..." : "Message"}
          placeholderTextColor={SUB}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.send} onPress={send}>
          <Ionicons name={editing ? "checkmark" : "send"} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Context menu */}
      <Modal visible={!!menuFor} transparent animationType="fade" onRequestClose={() => setMenuFor(null)}>
        <Pressable style={styles.menuBack} onPress={() => setMenuFor(null)}>
          <View />
        </Pressable>
        {menuFor && (
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { onReply(menuFor); setMenuFor(null); }}>
              <Ionicons name="return-down-back" size={18} color={TEXT} />
              <Text style={styles.menuText}>Reply</Text>
            </TouchableOpacity>
            {menuFor.senderId === ME && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { onEdit(menuFor); setMenuFor(null); }}>
                <Ionicons name="create-outline" size={18} color={TEXT} />
                <Text style={styles.menuText}>Edit</Text>
              </TouchableOpacity>
            )}
            {menuFor.senderId === ME && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { onDelete(menuFor); setMenuFor(null); }}>
                <Ionicons name="trash-outline" size={18} color={ACCENT} />
                <Text style={[styles.menuText, { color: ACCENT }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 },
  headerTitle: { flex: 1, textAlign: "center", fontWeight: "800", color: TEXT, fontSize: 16 },

  row: { paddingVertical: 4, paddingHorizontal: 8 },
  left: { alignItems: "flex-start" },
  right: { alignItems: "flex-end" },

  bubble: { maxWidth: "82%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, elevation: 1 },
  msgText: { color: TEXT, fontSize: 16, lineHeight: 20 },
  metaRow: { flexDirection: "row", alignSelf: "flex-end", gap: 6, marginTop: 4 },
  edited: { color: SUB, fontSize: 10 },
  time: { color: SUB, fontSize: 10 },

  replyWrap: { flexDirection: "row", gap: 8, marginBottom: 6, padding: 8, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.04)" },
  replyBar: { width: 3, borderRadius: 3, backgroundColor: ACCENT },
  replyName: { fontSize: 12, fontWeight: "700", color: TEXT },
  replySnippet: { fontSize: 12, color: SUB },

  bar: { position: "absolute", left: 12, right: 12, bottom: 72, backgroundColor: "#fff", borderRadius: 12, padding: 10, flexDirection: "row", alignItems: "center" },
  barTitle: { fontWeight: "800", color: TEXT },
  barSnippet: { color: SUB, marginTop: 2 },
  barClose: { padding: 6 },

  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: 10, gap: 8, backgroundColor: BG },
  input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: "#fff", borderRadius: 22, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, color: TEXT },
  send: { backgroundColor: ACCENT, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },

  menuBack: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.15)" },
  menu: { position: "absolute", left: 12, right: 12, bottom: 72, backgroundColor: "#fff", borderRadius: 16, padding: 8 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  menuText: { color: TEXT, fontWeight: "700" },
});
