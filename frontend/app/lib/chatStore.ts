// app/lib/chatStore.ts
import { useSyncExternalStore } from "react";

export type Message = {
  id: string;
  chatId: string;       // "dm:<userId>"
  peerId: string;
  senderId: string;     // "u_me" or peerId
  text: string;
  createdAt: number;
  editedAt?: number;
  replyToId?: string;
};

export type Thread = {
  chatId: string;       // "dm:<userId>"
  peerId: string;
  peerName: string;
  peerAvatar?: string | null;
  lastMessageAt: number;
  lastMessageText: string;
  unread: number;
};

const ME = "u_me";

// ---- single stable state object (important!) ----
const state = {
  threads: new Map<string, Thread>(),
  messages: new Map<string, Message[]>(),
};
const subs = new Set<() => void>();
const emit = () => subs.forEach((fn) => fn());

export const chat = {
  // React subscription
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
  // MUST return a stable reference, not a new object each time
  getSnapshot() {
    return state;
  },

  // ----- queries -----
  listThreads(): Thread[] {
    return [...state.threads.values()].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
  getMessages(chatId: string): Message[] {
    return (state.messages.get(chatId) || []).slice().sort((a, b) => a.createdAt - b.createdAt);
  },

  // ----- mutations -----
  ensureThread(peerId: string, peerName: string, peerAvatar?: string | null) {
    const chatId = `dm:${peerId}`;
    let created = false;
    if (!state.threads.has(chatId)) {
      state.threads.set(chatId, {
        chatId,
        peerId,
        peerName,
        peerAvatar: peerAvatar || null,
        lastMessageAt: 0,
        lastMessageText: "",
        unread: 0,
      });
      created = true;
    }
    if (!state.messages.has(chatId)) {
      state.messages.set(chatId, []);
      created = true;
    }
    if (created) emit();
    return chatId;
  },

  send(peerId: string, peerName: string, text: string, opts?: { replyToId?: string }) {
    const chatId = this.ensureThread(peerId, peerName);
    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      chatId,
      peerId,
      senderId: ME,
      text,
      createdAt: Date.now(),
      replyToId: opts?.replyToId,
    };
    state.messages.get(chatId)!.push(msg);
    const th = state.threads.get(chatId)!;
    th.lastMessageAt = msg.createdAt;
    th.lastMessageText = text;
    emit();
    return msg;
  },

  edit(chatId: string, id: string, newText: string) {
    const arr = state.messages.get(chatId) || [];
    const m = arr.find((x) => x.id === id);
    if (!m) return;
    m.text = newText;
    m.editedAt = Date.now();
    if (arr[arr.length - 1]?.id === id) {
      const th = state.threads.get(chatId);
      if (th) th.lastMessageText = newText;
    }
    emit();
  },

  remove(chatId: string, id: string) {
    const arr = state.messages.get(chatId) || [];
    const idx = arr.findIndex((x) => x.id === id);
    if (idx >= 0) arr.splice(idx, 1);
    const last = arr[arr.length - 1];
    const th = state.threads.get(chatId);
    if (th) {
      th.lastMessageAt = last?.createdAt || 0;
      th.lastMessageText = last?.text || "";
    }
    emit();
  },
};

// Hooks
export function useThreads() {
  useSyncExternalStore(chat.subscribe, chat.getSnapshot, chat.getSnapshot);
  return chat.listThreads();
}
export function useMessages(chatId: string) {
  useSyncExternalStore(chat.subscribe, chat.getSnapshot, chat.getSnapshot);
  return chat.getMessages(chatId);
}

/* BACKEND (concise):
  GET /chats                      → Thread[]
  GET /chats/dm/:peerId           → { thread, messages }
  POST /chats/dm/:peerId/messages { text, replyToId? } → Message
  PATCH /chats/:chatId/messages/:id { text }          → Message (editedAt)
  DELETE /chats/:chatId/messages/:id
  Auth: Bearer <JWT>
*/
