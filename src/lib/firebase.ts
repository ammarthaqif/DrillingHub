import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot, setDoc, getDocs, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use custom named database ID if provisioned, else default
export const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId || '(default)');

export { collection, doc, onSnapshot, setDoc, getDocs, updateDoc, deleteDoc, writeBatch };
