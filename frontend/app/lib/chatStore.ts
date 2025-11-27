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
import axios from 'axios';
import { io } from 'socket.io-client';
import { subscribeAuthChange } from './authEvents';
import { API_BASE } from './config';
import { getItem as storageGetItem } from './storage';

export const ME_ID = "u_me"; // placeholder current-user id

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  recipientId?: string;
  senderName?: string;
  recipientName?: string;
  text: string;
  createdAt: number;
  editedAt?: number;
  replyToId?: string;
  clientTempId?: string;
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

// Cache for resolved peer display names to avoid repeated network lookups
const peerNameCache = new Map<string, string>();
let currentUserDisplayName: string | null = null;
let currentUserId: string | null = null;

// Clear all in-memory chat state (used on auth changes to avoid leaking
// data between different logged-in users).
function clearStore() {
  // Close any active socket to avoid receiving messages for the previous user
  try {
    if (socket) {
      try { socket.disconnect(); } catch (e) {}
      socket = null;
    }
  } catch (e) {}

  Object.keys(store.messagesByChat).forEach((k) => delete store.messagesByChat[k]);
  Object.keys(store.threads).forEach((k) => delete store.threads[k]);
  peerNameCache.clear();
  currentUserDisplayName = null;
  currentUserId = null;
  emit();
}

async function fetchCurrentUserProfile() {
  try {
    const token = (await storageGetItem('token')) as string | null;
    if (!token || token.split('.').length !== 3) return;
    const res = await axios.get(`${API_BASE}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
    const u = res?.data?.user;
    if (u) {
      const display = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username;
      currentUserDisplayName = display;
      if (u._id) {
        currentUserId = String(u._id);
        peerNameCache.set(currentUserId, display);
      }
    }
  } catch (e) {
    // ignore failures
  }
}

// Allow manual update of current user profile info (used after edits)
export function setCurrentUserProfile(u: any) {
  try {
    const display = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username;
    currentUserDisplayName = display;
    if (u._id) {
      currentUserId = String(u._id);
      peerNameCache.set(currentUserId, display);
    }
    // Also cache any provided names for peers
    if (u._id && u.firstName) peerNameCache.set(String(u._id), display);
  } catch (e) {}
}

function getDisplayForId(id: string) {
  return peerNameCache.get(id) || id;
}

function isFriendlyName(name: string | undefined | null) {
  if (!name) return false;
  // consider a name friendly if it contains letters (not just hex id) and has reasonable length
  return /[a-zA-Z]/.test(name) && String(name).length > 2;
}

function normalizeMessage(m: any): Message {
  const id = String(m.id ?? m._id ?? m.messageId ?? '');
  const chatId = m.chatId ?? m.chat_id ?? m.chat ?? (m.peerId ? `dm:${m.peerId}` : m.chatId);
  const senderId = m.senderId ?? m.from ?? m.authorId ?? m.author ?? m.sender ?? m.userId ?? m.user;
  const recipientId = m.recipientId ?? m.to ?? m.recipient ?? undefined;
  const first = m.senderFirstName ?? m.firstName ?? m.senderFirstName;
  const last = m.senderLastName ?? m.lastName ?? m.senderLastName;
  let senderName = m.senderName ?? m.name ?? ((first || last) ? [first, last].filter(Boolean).join(' ') : undefined);
  const recipientName = m.recipientName ?? m.recipient_name ?? undefined;
  if (!senderName && senderId) senderName = peerNameCache.get(String(senderId)) || undefined;
  const createdAt = m.createdAt ? new Date(m.createdAt).getTime() : m.created_at ? new Date(m.created_at).getTime() : (m.ts ? Number(m.ts) : Date.now());
  const out: Message = {
    id,
    chatId,
    senderId: String(senderId ?? ''),
    recipientId: recipientId ? String(recipientId) : undefined,
    senderName,
    recipientName,
    text: m.text ?? m.body ?? m.message ?? '',
    createdAt: createdAt || Date.now(),
    replyToId: m.replyToId ?? m.reply_to_id ?? m.replyTo ?? undefined,
    clientTempId: m.clientTempId ?? m.client_temp_id ?? undefined,
  };
  // Cache names when present
  try { if (out.senderId && out.senderName) peerNameCache.set(String(out.senderId), out.senderName); } catch (e) {}
  try { if (out.recipientId && out.recipientName) peerNameCache.set(String(out.recipientId), out.recipientName); } catch (e) {}
  return out;
}

let version = 0;
const subs = new Set<(v: number) => void>();

function emit() {
  version += 1;
  subs.forEach((fn) => fn(version));
}

function ensureThread(peerId: string, peerName: string, chatIdOverride?: string): Thread {
  const chatId = chatIdOverride || `dm:${peerId}`;
  const existing = store.threads[chatId];
  if (existing) {
    // Keep latest name, but avoid overwriting a friendly cached name with a raw id.
    if (existing.peerName !== peerName) {
      if (isFriendlyName(peerName) || !isFriendlyName(existing.peerName)) {
        existing.peerName = peerName;
      }
      // if peerName is not friendly (likely raw id) and we have a cached display name, keep it
    }
    return existing;
  }
  const thread: Thread = {
    id: chatId,
    peerId,
    peerName: isFriendlyName(peerName) ? peerName : getDisplayForId(peerId),
    updatedAt: Date.now(),
  };
  try { console.log('[chatStore] ensureThread created', chatId, peerId); } catch (e) {}
  store.threads[chatId] = thread;
  try { console.log('[chatStore] thread.created', { chatId, peerId, peerName: thread.peerName }); } catch (e) {}
  if (!store.messagesByChat[chatId]) store.messagesByChat[chatId] = [];
  // If the chosen peerName looks like an id (no letters) try to resolve it
  // from the server and update the thread entry so the UI shows a friendly name.
  (async () => {
    try {
      const looksLikeId = (s: string) => !/[a-zA-Z]/.test(String(s));
      if (looksLikeId(thread.peerName)) {
        const token = (await storageGetItem('token')) as string | null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/users/${peerId}`, { headers, timeout: 5000 });
        const u = res?.data?.user;
        if (u) {
          const display = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || String(u._id || peerId);
          peerNameCache.set(String(peerId), display);
          const existingThread = store.threads[chatId];
          if (existingThread && existingThread.peerName !== display) {
            const old = existingThread.peerName;
            existingThread.peerName = display;
            try { console.log('[chatStore] thread.name.updated', { chatId, from: old, to: display, source: 'ensureThread.resolve' }); } catch (e) {}
            emit();
          }
        }
      }
    } catch (e) {
      // ignore failures
    }
  })();
  // Fetch persisted messages for this thread from the backend (best-effort).
  (async () => {
    try {
      const token = (await storageGetItem('token')) as string | null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE}/api/chats/${peerId}/messages`, { headers, timeout: 5000 });
      if (res && res.data && Array.isArray(res.data.messages)) {
  const msgs = res.data.messages.map((m: any) => normalizeMessage(m));
        // merge messages using upsert logic so we replace temp messages
        msgs.forEach((sm: Message) => upsertServerMessage(sm));
  try { console.log('[chatStore] fetched thread messages', { chatId, count: msgs.length }); } catch (e) {}
        // update thread's last-known time
        const arr = store.messagesByChat[chatId] || [];
        if (arr.length) thread.updatedAt = arr[arr.length - 1].createdAt;
        emit();
      }
    } catch (e) {
      // verbose debug logging for fetch failures
      try { console.warn('[chatStore] fetch thread messages failed for', peerId, (e as any)?.message || e); } catch (err) {}
    }
  })();
  return thread;
}

function upsertThreadFromMessage(msg: Message, peerId: string, peerName: string) {
  const chatId = msg.chatId;
  // Defensive: sometimes incoming `peerName` can be noisy or equal to
  // the message text (for example when an upstream payload is malformed).
  // If `peerName` looks like a message (long text, punctuation) or equals
  // the message text, ignore it and prefer cached/derived names.
  const candidateName = (peerName && String(peerName)) || '';
  const looksLikeMessageText = (s: string) => {
    if (!s) return false;
    // very long or contains multiple punctuation chars -> likely not a name
    if (s.length > 120) return true;
    const punctuationCount = (s.match(/[.,!?;:\-()"']/g) || []).length;
    if (punctuationCount > 3) return true;
    return false;
  };
  const safePeerName = (candidateName && candidateName === msg.text) || looksLikeMessageText(candidateName) ? undefined : candidateName;

  const thread = store.threads[chatId] ?? {
    id: chatId,
    peerId,
    peerName: isFriendlyName(safePeerName) ? safePeerName : getDisplayForId(peerId),
    updatedAt: msg.createdAt,
  };
  thread.lastMessage = msg.text;
  thread.updatedAt = msg.createdAt;
  // If an existing thread exists, avoid replacing a friendly name with a raw id
  if (store.threads[chatId]) {
    const existing = store.threads[chatId];
    if (existing.peerName !== thread.peerName) {
      const old = existing.peerName;
      if (isFriendlyName(thread.peerName) || !isFriendlyName(existing.peerName)) {
        existing.peerName = thread.peerName;
        try { console.log('[chatStore] thread.name.updated', { chatId, from: old, to: existing.peerName, source: 'message' }); } catch (e) {}
      } else {
        try { console.log('[chatStore] thread.name.keeping', { chatId, kept: existing.peerName, candidate: thread.peerName }); } catch (e) {}
      }
    }
    existing.lastMessage = thread.lastMessage;
    existing.updatedAt = thread.updatedAt;
    store.threads[chatId] = existing;
  } else {
    store.threads[chatId] = thread;
    try { console.log('[chatStore] thread.insertedFromMessage', { chatId, peerId, peerName: thread.peerName }); } catch (e) {}
  }
}

// Merge/insert a server-saved message into the store while handling
// optimistic temp messages. If a temp message likely corresponds to the
// server message, replace the temp with server copy. Otherwise dedupe
// by id and keep messages sorted by createdAt.
function upsertServerMessage(serverMsg: Message) {
  const chatId = serverMsg.chatId;
  try { console.log('[chatStore] upsertServerMessage', chatId, serverMsg.id); } catch (e) {}
  if (!store.messagesByChat[chatId]) store.messagesByChat[chatId] = [];
  const arr = store.messagesByChat[chatId];

  // If server id already present, update/replace it
  const existingIdx = arr.findIndex((x) => x.id === serverMsg.id);
  if (existingIdx !== -1) {
    try { console.debug('[chatStore] upsert replace existing by id', { chatId, serverId: serverMsg.id, idx: existingIdx }); } catch (e) {}
    arr[existingIdx] = serverMsg;
  } else {
    // If server included a clientTempId, prefer matching the temp message by that id.
    if (serverMsg.clientTempId) {
      const tempByClientIdx = arr.findIndex((x) => x.id === String(serverMsg.clientTempId));
      if (tempByClientIdx !== -1) {
        try { console.debug('[chatStore] upsert replace temp by clientTempId', { chatId, tempIdx: tempByClientIdx, tempId: arr[tempByClientIdx]?.id, serverId: serverMsg.id }); } catch (e) {}
        arr[tempByClientIdx] = serverMsg;
        // sort and return early
        arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        return;
      }
    }
    // Try to find an optimistic temp match: same sender, same text, and
    // very close timestamps (within 5 seconds). If found, replace it.
    const tempIdx = arr.findIndex((x) => {
      if (!x.id.startsWith('temp-')) return false;
      // Allow matching when temp message uses the placeholder ME_ID or
      // when senderId matches the server message. This helps when the
      // optimistic message was created before currentUserId was known.
      if (!(x.senderId === serverMsg.senderId || x.senderId === ME_ID)) return false;
      if (!x.text || !serverMsg.text) return false;
      if (x.text.trim() !== serverMsg.text.trim()) return false;
      const dt = Math.abs((x.createdAt || 0) - (serverMsg.createdAt || 0));
      return dt < 5000; // 5 seconds
    });
    if (tempIdx !== -1) {
      try { console.debug('[chatStore] upsert replace temp', { chatId, tempIdx, tempId: arr[tempIdx]?.id, serverId: serverMsg.id }); } catch (e) {}
      arr[tempIdx] = serverMsg;
    } else {
      try { console.debug('[chatStore] upsert push new', { chatId, serverId: serverMsg.id }); } catch (e) {}
      arr.push(serverMsg);
    }
  }

  // Sort by createdAt ascending
  arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

// PUBLIC CHAT API

let socket: any = null;
// Recent sends cache to prevent duplicate rapid POSTs for same chat+text
const recentSends = new Map<string, { text: string; tempId: string; ts: number }>();

async function ensureSocket() {
  if (socket) return socket;
  try {
    const token = (await storageGetItem('token')) as string | null;
    if (!token || token.split('.').length !== 3) return null;
    socket = io(API_BASE, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      try { console.log('[socket] connected', socket?.id, 'userId=', (socket as any).userId); } catch (e) {}
    });

    socket.on('connect_error', (err: any) => {
      try { console.warn('[socket] connect_error', (err as any)?.message || err); } catch (e) {}
    });

    socket.on('message', (m: any) => {
      try {
        const msg = normalizeMessage(m);
        console.log('[socket] message recv', msg.chatId, msg.id, msg.senderId, msg.text && msg.text.slice(0,40));
        // Cache any server-provided names
        try { if (msg.senderId && msg.senderName) peerNameCache.set(String(msg.senderId), msg.senderName); } catch (e) {}
        try { if (msg.recipientId && msg.recipientName) peerNameCache.set(String(msg.recipientId), msg.recipientName); } catch (e) {}
        upsertServerMessage(msg);
        // Derive peerId/peerName for the thread consistently from normalized msg
        const peerIdForThread = msg.senderId === currentUserId ? (msg.recipientId || msg.senderId) : msg.senderId;
        const peerNameForThread = msg.senderId === currentUserId ? (msg.recipientName || peerNameCache.get(String(peerIdForThread)) || String(peerIdForThread)) : (msg.senderName || peerNameCache.get(String(peerIdForThread)) || String(peerIdForThread));
        upsertThreadFromMessage(msg, peerIdForThread, peerNameForThread);
        emit();
      } catch (e) { console.warn('socket message handler error', e); }
    });

    socket.on('message:edit', (m: any) => {
      try {
        const msg = normalizeMessage(m);
        const chat = store.messagesByChat[msg.chatId] || [];
        const idx = chat.findIndex((x) => x.id === String(msg.id));
        if (idx !== -1) {
          chat[idx].text = msg.text;
          chat[idx].editedAt = msg.editedAt ? new Date(msg.editedAt).getTime() : Date.now();
        }
        // Cache any names if provided
        try { if (msg.senderId && msg.senderName) peerNameCache.set(String(msg.senderId), msg.senderName); } catch (e) {}
        try { if (msg.recipientId && msg.recipientName) peerNameCache.set(String(msg.recipientId), msg.recipientName); } catch (e) {}
        // Update thread metadata
        const peerIdForThread = msg.senderId === currentUserId ? (msg.recipientId || msg.senderId) : msg.senderId;
        const peerNameForThread = msg.senderId === currentUserId ? (msg.recipientName || peerNameCache.get(String(peerIdForThread)) || String(peerIdForThread)) : (msg.senderName || peerNameCache.get(String(peerIdForThread)) || String(peerIdForThread));
        upsertThreadFromMessage(msg, peerIdForThread, peerNameForThread);
        emit();
      } catch (e) { console.warn('socket edit handler error', e); }
    });

    socket.on('message:delete', (m: any) => {
      try {
        const id = m.id ?? m._id ?? m.messageId;
        const chatId = m.chatId ?? m.chat_id;
        if (chatId && store.messagesByChat[chatId]) {
          const arr = store.messagesByChat[chatId];
          const idx = arr.findIndex((x) => x.id === String(id));
          if (idx !== -1) { arr.splice(idx, 1); emit(); }
        } else {
          Object.keys(store.messagesByChat).forEach((cid) => {
            const arr = store.messagesByChat[cid];
            const idx = arr.findIndex((x) => x.id === String(id));
            if (idx !== -1) {
              arr.splice(idx, 1);
              emit();
            }
          });
        }
      } catch (e) { console.warn('socket delete handler error', e); }
    });

    return socket;
  } catch (e) {
    console.warn('ensureSocket failed', e);
    return null;
  }
}

export const chat = {
  ensureThread(peerId: string, peerName: string, chatIdOverride?: string): Thread {
    return ensureThread(peerId, peerName, chatIdOverride);
  },

  send(
    peerId: string,
    peerName: string,
    text: string,
    opts?: { replyToId?: string; chatIdOverride?: string }
  ): Message {
    const chatId = opts?.chatIdOverride || `dm:${peerId}`;
    const now = Date.now();
    const recentKey = `${chatId}::${String(text || '')}`;
    const recent = recentSends.get(recentKey);
    if (recent && now - recent.ts < 1500) {
      // A very recent send of the same text to the same chat occurred —
      // avoid sending a duplicate request. If the optimistic message
      // still exists in the store, return it so the caller sees a message.
      const existing = (store.messagesByChat[chatId] || []).find((m) => m.id === recent.tempId);
      if (existing) return existing;
      // otherwise fallthrough to create a new optimistic message
    }
    ensureThread(peerId, peerName);

    // optimistic local message
    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const tempMsg: Message = {
      id: tempId,
      chatId,
      // Use the resolved current user id when available so optimistic
      // messages can be matched to the server message by senderId.
      senderId: currentUserId || ME_ID,
      senderName: currentUserDisplayName || 'You',
      text,
      createdAt: Date.now(),
      ...(opts?.replyToId && { replyToId: opts?.replyToId }),
    };

    try {
      // Debug: log optimistic insertion with temp id and sender info
      console.debug('[chatStore] optimistic insert', { tempId, chatId, senderId: tempMsg.senderId, text: (text || '').slice(0, 64), ts: Date.now() });
    } catch (e) {}

    if (!store.messagesByChat[chatId]) store.messagesByChat[chatId] = [];
    store.messagesByChat[chatId].push(tempMsg);
    // record recent send to prevent duplicates within a short window
    try {
      recentSends.set(`${chatId}::${String(text || '')}`, { text, tempId, ts: Date.now() });
      // schedule cleanup after 5s to avoid memory growth
      setTimeout(() => {
        const ent = recentSends.get(`${chatId}::${String(text || '')}`);
        if (ent && ent.tempId === tempId) recentSends.delete(`${chatId}::${String(text || '')}`);
      }, 5000);
    } catch (e) {}
    upsertThreadFromMessage(tempMsg, peerId, peerName);
    emit();

    // Fire-and-forget server call; on success replace temporary message
    (async () => {
      try {
        const token = (await storageGetItem('token')) as string | null;
        await ensureSocket(); // ensure we can receive broadcasts
        const res = await axios.post(
          `${API_BASE}/api/chats/${peerId}/messages`,
          { text, replyToId: opts?.replyToId, clientTempId: tempId },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const m = res.data && res.data.message ? res.data.message : null;
        if (m) {
          // Normalize server message and upsert it into the store. Use
          // upsertServerMessage to avoid duplicates when the same message
          // may also be delivered via the socket (race between HTTP
          // response and socket event).
          const serverMsg = normalizeMessage(m);
          try {
            console.debug('[chatStore] http response recv', { tempId, serverId: serverMsg.id, chatId: serverMsg.chatId, senderId: serverMsg.senderId, text: (serverMsg.text || '').slice(0,64), ts: Date.now() });
          } catch (e) {}
          if (serverMsg.senderId && serverMsg.senderName) peerNameCache.set(String(serverMsg.senderId), serverMsg.senderName);
          upsertServerMessage(serverMsg);
          upsertThreadFromMessage(serverMsg, peerId, peerName);
          emit();
          // remove recent send marker for this chat+text
          try { recentSends.delete(`${chatId}::${String(text || '')}`); } catch (e) {}
        }
      } catch (e) {
        console.warn('Failed to send message to server', (e as any)?.message || e);
        // mark temp message as failed (append text) or remove
        try {
          const arr = store.messagesByChat[chatId] || [];
          const idx = arr.findIndex((x) => x.id === tempId);
          if (idx !== -1) {
            arr[idx].text = `${arr[idx].text} (failed)`;
            emit();
          }
        } catch (er) {}
      }
    })();

    return tempMsg;
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
    const idx = msgs.findIndex((x) => x.id === String(messageId));
    if (idx === -1) return;

    // Keep a backup in case delete fails and we need to restore
    const backup = msgs[idx];

    // If this is an optimistic (temp) message that never persisted, just
    // remove it locally and return (no server call necessary).
    if (String(messageId).startsWith('temp-')) {
      msgs.splice(idx, 1);
      // update thread metadata
      const thread = store.threads[chatId];
      if (thread) {
        const last = msgs[msgs.length - 1];
        thread.lastMessage = last ? last.text : undefined;
        thread.updatedAt = last ? last.createdAt : Date.now();
      }
      emit();
      return;
    }

    // Optimistically remove the message locally so UI updates immediately.
    msgs.splice(idx, 1);
    // update thread metadata
    const thread = store.threads[chatId];
    if (thread) {
      const last = msgs[msgs.length - 1];
      thread.lastMessage = last ? last.text : undefined;
      thread.updatedAt = last ? last.createdAt : Date.now();
    }
    emit();

    // Fire-and-forget server delete. If it fails, restore the message and
    // notify via console.warn. We keep this non-blocking to avoid UI stalls.
    (async () => {
      try {
        const token = (await storageGetItem('token')) as string | null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.delete(`${API_BASE}/api/messages/${messageId}`, { headers });
        // Success: server will emit 'message:delete' to the recipient(s).
      } catch (e) {
        try { console.warn('[chatStore] delete failed, restoring message', messageId, (e as any)?.message || e); } catch (er) {}
        // Restore backup if still appropriate
        try {
          const arr = store.messagesByChat[chatId] || [];
          // If message not present, re-insert at original index (clamped)
          const exists = arr.findIndex((x) => x.id === backup.id);
          if (exists === -1) {
            const insertAt = Math.min(Math.max(0, idx), arr.length);
            arr.splice(insertAt, 0, backup);
            // restore thread metadata
            const t = store.threads[chatId];
            if (t) {
              const last = arr[arr.length - 1];
              t.lastMessage = last ? last.text : undefined;
              t.updatedAt = last ? last.createdAt : Date.now();
            }
            emit();
          }
        } catch (err) {
          // ignore
        }
      }
    })();
  },

  getMessages(chatId: string): Message[] {
    return store.messagesByChat[chatId] ?? [];
  },

  getThreads(): Thread[] {
    // De-duplicate threads by peerId. It's possible the store contains
    // multiple thread entries for the same peer (for example when the
    // canonical server chatId `dm:<idA>-<idB>` differs from a local
    // temporary key `dm:<peerId>`). To avoid repeated chat boxes in the
    // UI we keep the most recently-updated thread per peer.
    const byPeer = new Map<string, Thread>();
    Object.values(store.threads).forEach((t) => {
      const existing = byPeer.get(t.peerId);
      if (!existing || (t.updatedAt || 0) > (existing.updatedAt || 0)) {
        byPeer.set(t.peerId, t);
      }
    });
    return Array.from(byPeer.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  },
  // Fetch messages for a peer from the server and upsert them into the store.
  async fetchMessages(peerId: string) {
    try {
      const token = (await storageGetItem('token')) as string | null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE}/api/chats/${peerId}/messages`, { headers, timeout: 5000 });
      if (res && res.data && Array.isArray(res.data.messages)) {
        const msgs = res.data.messages.map((m: any) => normalizeMessage(m));
        msgs.forEach((sm: Message) => {
          if (sm.senderId && sm.senderName) peerNameCache.set(String(sm.senderId), sm.senderName);
          upsertServerMessage(sm);
        });
        emit();
        return msgs;
      }
    } catch (e) {
      // ignore
    }
    return [] as Message[];
  }
};

// Load thread list from server for the current user and populate store. This
// shows message channels immediately after login.
async function loadThreadsFromServer() {
  try {
    const token = (await storageGetItem('token')) as string | null;
    if (!token || token.split('.').length !== 3) return;
    const headers = { Authorization: `Bearer ${token}` };
    const res = await axios.get(`${API_BASE}/api/chats`, { headers, timeout: 5000 });
    if (res && res.data && Array.isArray(res.data.threads)) {
      // Rebuild threads map
      const threads = res.data.threads as any[];
      threads.forEach((t) => {
        const chatId = t.chatId || t._id || `dm:${t.peerId}`;
        const initialName = t.peerName || getDisplayForId(t.peerId);
        // If we already have a thread locally with a friendly name, avoid
        // overwriting it with a non-friendly incoming name (raw id). Only
        // update the name if the incoming name looks friendly or we don't
        // have a friendly name yet.
        const existing = store.threads[chatId];
        let finalName = initialName || t.peerId;
        if (existing && existing.peerName) {
          // keep existing friendly name unless incoming is friendlier
          if (isFriendlyName(existing.peerName)) {
            if (isFriendlyName(initialName)) {
              finalName = initialName;
            } else {
              finalName = existing.peerName;
            }
          } else {
            finalName = initialName || existing.peerName || t.peerId;
          }
        } else {
          finalName = initialName || t.peerId;
        }
        if (t.peerId && finalName && finalName !== t.peerId) peerNameCache.set(t.peerId, finalName);
        store.threads[chatId] = {
          id: chatId,
          peerId: t.peerId,
          peerName: finalName,
          lastMessage: t.lastMessage,
          updatedAt: t.updatedAt || Date.now(),
        } as Thread;
        if (!store.messagesByChat[chatId]) store.messagesByChat[chatId] = [];
      });

      // Resolve friendly peer names for threads that currently only have an id.
      try {
        const token = (await storageGetItem('token')) as string | null;
        const toResolve = Object.values(store.threads).filter((t) => {
          // if peerName looks like an id (no letters) then resolve
          return !/[a-zA-Z]/.test(String(t.peerName));
        });
        await Promise.all(
          toResolve.map(async (t) => {
            try {
              const resUser = await axios.get(`${API_BASE}/api/users/${t.peerId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                timeout: 5000,
              });
              const u = resUser?.data?.user;
              if (u) {
                const display = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || String(u._id || t.peerId);
                peerNameCache.set(String(t.peerId), display);
                const threadObj = store.threads[t.id];
                if (threadObj) threadObj.peerName = display;
              }
            } catch (e) {
              // ignore
            }
          })
        );
      } catch (e) {
        // ignore
      }
      emit();
    }
  } catch (e) {
    // ignore failures (offline etc.)
  }
}

// Subscribe to auth changes so when the user logs in we open socket and
// load their threads so message channels show immediately in the UI.
subscribeAuthChange(() => {
  // On auth changes (login/logout) clear previous user's in-memory state
  // to avoid showing threads/messages from another account.
  clearStore();
  (async () => {
    try {
      await ensureSocket();
      await fetchCurrentUserProfile();
      await loadThreadsFromServer();
    } catch (e) {}
  })();
});

// On module init, attempt to load threads and connect if token present.
(async () => {
  try {
    // On module init: clear any leftover in-memory state (safe-guard)
    clearStore();
    await ensureSocket();
    await fetchCurrentUserProfile();
    await loadThreadsFromServer();
  } catch (e) {}
})();

// HOOKS

export function useMessages(chatId: string): Message[] {
  const [v, setV] = useState(version);
  useEffect(() => {
    const fn = (nv: number) => setV(nv);
    subs.add(fn);
    return () => { subs.delete(fn); };
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
    return () => { subs.delete(fn); };
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = v;
  return chat.getThreads();
}
