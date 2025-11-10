// src/services/userService.ts
import { auth, firestore } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Reads the current user's display name.
 * Order of precedence:
 * 1) Firestore: users/{uid}.fullName | name | displayName
 * 2) Firebase Auth: user.displayName
 * 3) Email prefix
 * 4) "Farmer"
 */
export async function getCurrentUserName(): Promise<string> {
  const user = auth.currentUser;
  if (!user) return 'Farmer';

  // Try Firestore profile first
  try {
    const snap = await getDoc(doc(firestore, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data() as Record<string, any>;
      const fromDb =
        clean(data.fullName) ||
        clean(data.name) ||
        clean(data.displayName);
      if (fromDb) return fromDb;
    }
  } catch {
    // ignore and fall through to auth fallback
  }

  // Fallbacks
  const fromAuth = clean(user.displayName);
  if (fromAuth) return fromAuth;

  if (user.email) {
    const prefix = user.email.split('@')[0];
    if (prefix) return toTitle(prefix.replace(/[._-]+/g, ' '));
  }

  return 'Farmer';
}

/** Optional: get any user's name by uid (same precedence as above). */
export async function getUserNameByUid(uid: string): Promise<string> {
  try {
    const snap = await getDoc(doc(firestore, 'users', uid));
    if (snap.exists()) {
      const data = snap.data() as Record<string, any>;
      const fromDb =
        clean(data.fullName) ||
        clean(data.name) ||
        clean(data.displayName);
      if (fromDb) return fromDb;
    }
  } catch {}
  return 'Farmer';
}

/* ----------------- helpers ----------------- */
function clean(v?: string | null): string | null {
  if (!v) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function toTitle(s: string): string {
  return s
    .split(' ')
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');
}
