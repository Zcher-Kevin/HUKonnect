// Lightweight in-memory auth pending flag to coordinate UI during
// registration flows. Using an in-memory flag avoids timing/race issues
// with async storage writes/read across components in the same JS runtime.

let _pending = false;

export const setAuthPending = (v: boolean) => {
  _pending = !!v;
};

export const isAuthPending = () => _pending;

export default { setAuthPending, isAuthPending };
