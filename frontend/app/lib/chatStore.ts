// app/lib/chatStore.ts
// Tiny in-memory chat store used by:
// - (tabs)/messages.tsx  (thread list)
// - messages/[id].tsx    (DM view)
// - user/[id].tsx        (sending invites)
//
// BACKEND NOTES:
// Replace internals with real API calls, but keep the public functions
// so the frontend does not need to change.

import { useEffect, useState } from "react";

export const ME_ID = "u_me"; // placeholder current-user id

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: number;
  editedAt?: number;
  replyToId?: string;
};

export type Thread = {
  id: string;        // chatId, e.g. "dm:sam-patel"
  peerId: string;
  peerName: string;
  lastMessage?: string;
  updatedAt: number;
};

type Store = {
  messagesByChat: Record<string, Message[]>;
  threads: Record<string, Thread>;
};

const store: Store = {
  messagesByChat: {},
  threads: {},
};

let version = 0;
const subs = new Set<(v: number) => void>();

function emit() {
  version += 1;
  subs.forEach((fn) => fn(version));
}

function ensureThread(peerId: string, peerName: string): Thread {
  const chatId = `dm:${peerId}`;
  const existing = store.threads[chatId];
  if (existing) {
    // Keep latest name
    if (existing.peerName !== peerName) existing.peerName = peerName;
    return existing;
  }
  const thread: Thread = {
    id: chatId,
    peerId,
    peerName,
    updatedAt: Date.now(),
  };
  store.threads[chatId] = thread;
  if (!store.messagesByChat[chatId]) store.messagesByChat[chatId] = [];
  return thread;
}

function upsertThreadFromMessage(msg: Message, peerId: string, peerName: string) {
  const chatId = msg.chatId;
  const thread = store.threads[chatId] ?? {
    id: chatId,
    peerId,
    peerName,
    updatedAt: msg.createdAt,
  };
  thread.lastMessage = msg.text;
  thread.updatedAt = msg.createdAt;
  store.threads[chatId] = thread;
}

// PUBLIC CHAT API

export const chat = {
  ensureThread(peerId: string, peerName: string): Thread {
    return ensureThread(peerId, peerName);
  },

  send(
    peerId: string,
    peerName: string,
    text: string,
    opts?: { replyToId?: string }
  ): Message {
    const chatId = `dm:${peerId}`;
    ensureThread(peerId, peerName);

    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      chatId,
      senderId: ME_ID,
      text,
      createdAt: Date.now(),
      ...(opts?.replyToId && { replyToId: opts.replyToId }),
    };

    if (!store.messagesByChat[chatId]) store.messagesByChat[chatId] = [];
    store.messagesByChat[chatId].push(msg);
    upsertThreadFromMessage(msg, peerId, peerName);

    // BACKEND TODO: POST /chats/{peerId}/messages { text, replyToId }
    emit();
    return msg;
  },

  edit(chatId: string, messageId: string, newText: string) {
    const msgs = store.messagesByChat[chatId];
    if (!msgs) return;
    const m = msgs.find((x) => x.id === messageId);
    if (!m) return;
    m.text = newText;
    m.editedAt = Date.now();
    // BACKEND TODO: PATCH /messages/{id} { text }
    emit();
  },

  remove(chatId: string, messageId: string) {
    const msgs = store.messagesByChat[chatId];
    if (!msgs) return;
    const idx = msgs.findIndex((x) => x.id === messageId);
    if (idx === -1) return;
    msgs.splice(idx, 1);
    // BACKEND TODO: DELETE /messages/{id}
    emit();
  },

  getMessages(chatId: string): Message[] {
    return store.messagesByChat[chatId] ?? [];
  },

  getThreads(): Thread[] {
    return Object.values(store.threads).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  },
};

// HOOKS

export function useMessages(chatId: string): Message[] {
  const [v, setV] = useState(version);
  useEffect(() => {
    const fn = (nv: number) => setV(nv);
    subs.add(fn);
    return () => subs.delete(fn);
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = v; // just to subscribe
  return chat.getMessages(chatId);
}

export function useThreads(): Thread[] {
  const [v, setV] = useState(version);
  useEffect(() => {
    const fn = (nv: number) => setV(nv);
    subs.add(fn);
    return () => subs.delete(fn);
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = v;
  return chat.getThreads();
}
