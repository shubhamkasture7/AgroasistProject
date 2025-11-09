import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  limit,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, firestore } from '../firebase';

export type PesticideLog = {
  id?: string;
  pesticideName: string;
  description?: string;
  imageDataUrl?: string;   // <-- stored in Firestore
  farmerName: string;
  dateISO: string;
  createdAt?: any;
};

export async function createLog(input: {
  pesticideName: string;
  description?: string;
  imageDataUrl?: string;   // may be undefined
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const colRef = collection(firestore, 'pesticideLogs', user.uid, 'logs');
  const payload = {
    pesticideName: input.pesticideName,
    description: input.description || '',
    imageDataUrl: input.imageDataUrl || '', // string field in doc
    farmerName: user.displayName || 'Anonymous Farmer',
    dateISO: new Date().toISOString().slice(0, 10),
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
}

export async function getRecentLogs(limitCount = 10) {
  const user = auth.currentUser;
  if (!user) return [];

  const colRef = collection(firestore, 'pesticideLogs', user.uid, 'logs');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);

  const logs: PesticideLog[] = [];
  snap.forEach((doc) => logs.push({ id: doc.id, ...(doc.data() as PesticideLog) }));
  return logs;
}
