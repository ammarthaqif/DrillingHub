import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot, setDoc, getDocs, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson?.apiKey || '',
  authDomain: firebaseConfigJson?.authDomain || '',
  projectId: firebaseConfigJson?.projectId || '',
  storageBucket: firebaseConfigJson?.storageBucket || '',
  messagingSenderId: firebaseConfigJson?.messagingSenderId || '',
  appId: firebaseConfigJson?.appId || '',
};

let app: any;
let dbInstance: any;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  dbInstance = getFirestore(app, firebaseConfigJson?.firestoreDatabaseId || '(default)');
} catch (e) {
  console.error('Firebase initialization error, falling back to local database:', e);
}

export const db = dbInstance;

export { collection, doc, onSnapshot, setDoc, getDocs, updateDoc, deleteDoc, writeBatch };
