// src/services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from '../types';
import { auth, firestore } from '../firebase';

const formatUser = (firebaseUser: FirebaseUser): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email!,
  displayName: firebaseUser.displayName || 'Anonymous Farmer',
});

const writeUserData = async (user: FirebaseUser, name?: string) => {
  const userDoc = doc(firestore, 'users', user.uid);
  await setDoc(
    userDoc,
    {
      displayName: name || user.displayName || 'Anonymous Farmer',
      email: user.email,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const register = async (name: string, email: string, pass: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const firebaseUser = userCredential.user;

  // set displayName on the Auth profile
  await updateProfile(firebaseUser, { displayName: name });

  // ensure a Firestore user doc exists
  await writeUserData(firebaseUser, name);

  return formatUser({ ...firebaseUser, displayName: name });
};

export const login = async (email: string, pass: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const firebaseUser = userCredential.user;

  // upsert Firestore user doc if missing (handy if account was created elsewhere)
  const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
  if (!userDoc.exists()) {
    await writeUserData(firebaseUser);
  }

  return formatUser(firebaseUser);
};

export const loginWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
    if (!userDoc.exists()) {
      await writeUserData(firebaseUser);
    }

    return formatUser(firebaseUser);
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider);
      // will navigate away; let caller know
      throw new Error('Redirecting to Google sign-in...');
    }
    throw error;
  }
};

// Call this on your auth landing page after redirect
export const handleGoogleRedirect = async (): Promise<User | null> => {
  const result = await getRedirectResult(auth);
  if (result && result.user) {
    const firebaseUser = result.user;

    const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
    if (!userDoc.exists()) {
      await writeUserData(firebaseUser);
    }

    return formatUser(firebaseUser);
  }
  return null;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};
