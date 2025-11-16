// Simple auth change pub/sub for the app.
// Other modules can subscribe to be notified when the auth token changes
// (for example after login/logout). This avoids polling storage.

type Callback = () => void;
const subs = new Set<Callback>();

export function subscribeAuthChange(cb: Callback) {
  subs.add(cb);
  return () => subs.delete(cb);
}

export function emitAuthChange() {
  subs.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      // ignore
    }
  });
}

export default { subscribeAuthChange, emitAuthChange };
