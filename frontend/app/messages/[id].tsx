// app/messages/[id].tsx
// One-to-one chat screen.

import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { chat, useMessages, useThreads, Message } from "../lib/chatStore";
import { getPerson } from "../lib/followStore";
import { getItem as storageGetItem } from "../lib/storage";
import axios from "axios";
import { API_BASE } from "../lib/config";
import MessageHeader from "../../components/MessageHeader";
import MessageInput from "../../components/MessageInput";
import MessageBubble from "../../components/MessageBubble";
import styles from "./messages.styles";

const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUB = "#7A6F6F";
const ACCENT = "#A2172C";
const BUBBLE_ME = "#D9FDD3";
const BUBBLE_THEM = "#FFFFFF";

export default function DMChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routeId = id!;
  // myId: derived from JWT in storage (if present)
  const [myId, setMyId] = useState<string | null>(null);

  // Resolve peerId from the route. The route `id` may be a raw user id
  // (peerId) or a canonical chat id like `dm:<idA>-<idB>`. If it's the
  // canonical form and we know `myId`, pick the other id. If myId is not
  // yet available we pick the second part as a stable default.
  const peerId = useMemo(() => {
    if (!routeId.startsWith("dm:")) return routeId;
    const body = routeId.slice(3);
    const parts = body.split("-");
    if (parts.length === 2) {
      if (myId) return parts[0] === myId ? parts[1] : parts[0];
      return parts[1];
    }
    return body;
  }, [routeId, myId]);

  const person = getPerson(peerId);
  // --- state and derived values ---
  const [canonicalChatId, setCanonicalChatId] = useState<string>(
    `dm:${peerId}`
  );
  const messages = useMessages(canonicalChatId);
  const threads = useThreads();
  // Prefer the thread entry that matches the peerId (not only the chatId)
  // because the store may hold the thread under a canonical id like
  // `dm:<idA>-<idB>` while we temporarily use `dm:<peerId>`.
  const peerNameFromStore = threads.find((t) => t.peerId === peerId)?.peerName;
  const peerName = peerNameFromStore || person?.name || peerId;

  const [loading, setLoading] = useState(false);
  // localDisplayName: a quick-resolved, human-friendly name used for header & reply snippets
  const [localDisplayName, setLocalDisplayName] = useState<string | null>(null);

  // Helper: decode JWT (very small, defensive) to extract userId from payload
  const decodeJwtUserId = (token?: string | null): string | null => {
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const pad = payload.length % 4;
      const padded = pad === 0 ? payload : payload + "=".repeat(4 - pad);
      // atob may be available; fall back to Buffer when not
      // @ts-ignore
      const decoded =
        typeof atob === "function"
          ? atob(padded)
          : // eslint-disable-next-line @typescript-eslint/no-var-requires
            require("buffer").Buffer.from(padded, "base64").toString("utf8");
      const obj = JSON.parse(decoded);
      return obj?.userId ? String(obj.userId) : null;
    } catch (e) {
      return null;
    }
  };

  // Load myId from token and ensure messages for this peer are fetched once on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = (await storageGetItem("token")) as string | null;
        if (mounted) setMyId(decodeJwtUserId(token));
      } finally {
        // continue regardless
      }
    })();

    (async () => {
      setLoading(true);
      try {
        await chat.fetchMessages(peerId);
      } catch (e) {
        // ignore fetch errors here; UI will still show whatever is cached
      }
      if (mounted) setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [peerId]);

  // When myId or localDisplayName changes we compute the canonical chat id
  // and call ensureThread so the thread list uses the canonical id and a
  // friendly display name when possible.
  useEffect(() => {
    const chatId = myId
      ? `dm:${[myId, peerId].sort().join("-")}`
      : `dm:${peerId}`;
    setCanonicalChatId(chatId);
    // pass a friendly name when we have one to avoid creating a thread with a raw id
    chat.ensureThread(peerId, localDisplayName || peerName, chatId);
    // also refresh messages for the canonical chat id (best-effort)
    chat.fetchMessages(peerId).catch(() => {});
  }, [myId, localDisplayName, peerId, peerName]);

  // Helper: simple objectId pattern check
  const looksLikeObjectId = (s?: string | null) =>
    !!s && /^[0-9a-fA-F]{24}$/.test(String(s));

  // Helper: fetch a user's display name from the API (returns fallback to id)
  const fetchUserDisplayName = async (idToFetch: string) => {
    try {
      const token = (await storageGetItem("token")) as string | null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE}/api/users/${idToFetch}`, {
        headers,
        timeout: 5000,
      });
      const u = res?.data?.user;
      if (!u) return idToFetch;
      return (
        [u.firstName, u.lastName].filter(Boolean).join(" ") ||
        u.username ||
        String(u._id || idToFetch)
      );
    } catch (e) {
      return idToFetch;
    }
  };

  // Resolve the header display name: prefer store, then person cache, then API lookup
  useEffect(() => {
    let mounted = true;
    const candidate = peerNameFromStore || person?.name;
    if (candidate && /[a-zA-Z]/.test(String(candidate))) {
      setLocalDisplayName(candidate);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      const name =
        candidate && !looksLikeObjectId(candidate)
          ? candidate
          : await fetchUserDisplayName(peerId);
      if (mounted) setLocalDisplayName(name);
    })();

    return () => {
      mounted = false;
    };
  }, [peerId, peerNameFromStore, person?.name]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [menuFor, setMenuFor] = useState<Message | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const send = () => {
    const t = text.trim();
    if (!t) return;

    if (editing) {
      chat.edit(editing.chatId, editing.id, t);
      setEditing(null);
      setText("");
    } else {
      // pass peerName (best-effort) and the canonical chat id to avoid races
      chat.send(peerId, peerName, t, {
        replyToId: replyTo?.id,
        chatIdOverride: canonicalChatId,
      });
      setReplyTo(null);
      setText("");
    }

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);
  };

  const onEdit = (m: Message) => {
    if (
      !(m.id?.toString().startsWith("temp-") || (myId && m.senderId === myId))
    )
      return;
    setEditing(m);
    setReplyTo(null);
    setText(m.text);
  };

  const onReply = (m: Message) => {
    setReplyTo(m);
    setEditing(null);
  };

  const onDelete = (m: Message) => {
    if (
      !(m.id?.toString().startsWith("temp-") || (myId && m.senderId === myId))
    )
      return;
    chat.remove(m.chatId, m.id);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const reply = item.replyToId
      ? messages.find((x) => x.id === item.replyToId)
      : undefined;
    return (
      <MessageBubble
        item={item}
        reply={reply}
        myId={myId}
        localDisplayName={localDisplayName}
        peerName={peerName}
        onLongPress={(m: any) => setMenuFor(m)}
      />
    );
  };

  // MessageBubble component moved to external file to keep this screen focused

  const headerDisplay = localDisplayName || peerName;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <MessageHeader title={headerDisplay} onBack={() => router.back()} />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={{
          padding: 12,
          paddingBottom: 96,
        }}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({
            animated: false,
          })
        }
      />

      {(replyTo || editing) && (
        <View style={styles.bar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.barTitle}>
              {editing ? "Editing message" : "Replying to"}
            </Text>
            <Text numberOfLines={1} style={styles.barSnippet}>
              {editing ? `“${editing.text}”` : replyTo?.text}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setReplyTo(null);
              setEditing(null);
              setText("");
            }}
            style={styles.barClose}
          >
            <Ionicons name="close" size={20} color={TEXT} />
          </TouchableOpacity>
        </View>
      )}

      <MessageInput
        text={text}
        setText={setText}
        onSend={send}
        editing={!!editing}
      />

      {/* Context menu */}
      <Modal
        visible={!!menuFor}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuFor(null)}
      >
        <Pressable style={styles.menuBack} onPress={() => setMenuFor(null)} />
        {menuFor && (
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onReply(menuFor);
                setMenuFor(null);
              }}
            >
              <Ionicons name="return-down-back" size={18} color={TEXT} />
              <Text style={styles.menuText}>Reply</Text>
            </TouchableOpacity>

            {(menuFor.id?.toString().startsWith("temp-") ||
              (myId && menuFor.senderId === myId)) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onEdit(menuFor);
                  setMenuFor(null);
                }}
              >
                <Ionicons name="create-outline" size={18} color={TEXT} />
                <Text style={styles.menuText}>Edit</Text>
              </TouchableOpacity>
            )}

            {(menuFor.id?.toString().startsWith("temp-") ||
              (myId && menuFor.senderId === myId)) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onDelete(menuFor);
                  setMenuFor(null);
                }}
              >
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

// styles moved to ./messages.styles.ts
