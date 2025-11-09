import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD2Eebucid6ICMSqr2HdgjkOP1UnoN1MAM",
  authDomain: "studio-103154807-a8989.firebaseapp.com",
  projectId: "studio-103154807-a8989",
  storageBucket: "studio-103154807-a8989.appspot.com",
  messagingSenderId: "782442672639",
  appId: "1:782442672639:web:228e7520a6b147074477ca",
};

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
