// Simple validation helpers used by the app

/**
 * Lightweight email format validation.
 * This is intentionally permissive; do not rely on this for security.
 * Backend must always validate again.
 */
export function isValidEmail(email: string | undefined | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const s = email.trim();
  if (!s) return false;
  // Basic pattern: something@something.something
  // Good balance of correctness and simplicity for UX-level checks.
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(s);
}

export default {
  isValidEmail,
};
