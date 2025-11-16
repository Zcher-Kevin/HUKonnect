// Simple in-memory pub/sub for lightweight cross-component notifications
type Handler = (payload?: any) => void;
const subs: Map<string, Set<Handler>> = new Map();

export function subscribe(topic: string, handler: Handler) {
  if (!subs.has(topic)) subs.set(topic, new Set());
  subs.get(topic)!.add(handler);
  return () => subs.get(topic)!.delete(handler);
}

export function publish(topic: string, payload?: any) {
  const s = subs.get(topic);
  if (!s) return;
  s.forEach((h) => {
    try { h(payload); } catch (e) { /* swallow */ }
  });
}

export default { subscribe, publish };
