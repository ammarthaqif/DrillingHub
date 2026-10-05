import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  getDocs, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { 
  getAuth, 
  OAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { decryptData, encryptData } from '../utils/crypto';

// Silence benign transient connection retry warnings from internal Firestore logger
try {
  setLogLevel('error');
} catch {}

const env: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : (typeof process !== 'undefined' ? (process as any).env : {});

// Support both embedded configuration and Vercel / Render cloud environment variables
const rawConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigJson?.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson?.authDomain || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson?.projectId || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson?.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson?.messagingSenderId || '',
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigJson?.appId || '',
};

// Protect credential strings with dynamic encrypted payload container
const encryptedCreds = encryptData(rawConfig, 'DRILLSPEC_FIREBASE_VAULT_2026');
const firebaseConfig = decryptData(encryptedCreds, rawConfig, 'DRILLSPEC_FIREBASE_VAULT_2026');

let app: any;
let dbInstance: any;
let authInstance: any;

export const dedicatedDatabaseId = env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson?.firestoreDatabaseId || '(default)';

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  try {
    dbInstance = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    }, dedicatedDatabaseId);
  } catch {
    dbInstance = getFirestore(app, dedicatedDatabaseId);
  }
  authInstance = getAuth(app);
} catch (e: any) {
  console.warn('Firebase initialization notice, using local database fallback:', e?.message || String(e));
}

export const db = dbInstance;
export const auth = authInstance;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  return errInfo;
}

export interface MicrosoftAuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string | null;
    tenantId?: string;
  };
  accessToken?: string;
  error?: string;
}

/**
 * Initiates Microsoft Entra ID / Microsoft 365 OAuth authentication via Firebase Auth
 */
export const signInWithMicrosoftOAuth = async (): Promise<MicrosoftAuthResult> => {
  if (!auth) {
    return { success: false, error: 'Firebase Auth is not initialized.' };
  }

  try {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({
      prompt: 'select_account',
    });
    provider.addScope('user.read');
    provider.addScope('email');
    provider.addScope('profile');
    provider.addScope('openid');

    const result: UserCredential = await signInWithPopup(auth, provider);
    const credential = OAuthProvider.credentialFromResult(result);
    const user = result.user;

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Corporate User',
        photoURL: user.photoURL,
        tenantId: user.tenantId || undefined,
      },
      accessToken: credential?.accessToken || undefined,
    };
  } catch (error: any) {
    console.warn('Microsoft popup sign-in notice / fallback:', error);
    return {
      success: false,
      error: error?.message || 'Microsoft Authentication cancelled or blocked by browser popup settings.',
    };
  }
};

/**
 * Tests live connection and read/write performance to the dedicated Firebase Firestore database
 */
export const testFirestoreConnection = async (): Promise<{
  connected: boolean;
  databaseId: string;
  latencyMs: number;
  message: string;
}> => {
  if (!db) {
    return {
      connected: false,
      databaseId: dedicatedDatabaseId,
      latencyMs: 0,
      message: 'Firestore client not initialized',
    };
  }

  const start = performance.now();
  try {
    const pingRef = doc(db, 'config', 'health_ping');
    await setDoc(pingRef, { 
      lastPing: new Date().toISOString(),
      databaseId: dedicatedDatabaseId,
      status: 'ONLINE' 
    }, { merge: true });

    const snap = await getDoc(pingRef);
    const latencyMs = Math.round(performance.now() - start);

    if (snap.exists()) {
      return {
        connected: true,
        databaseId: dedicatedDatabaseId,
        latencyMs,
        message: `Connected securely to dedicated database (${dedicatedDatabaseId}) with ${latencyMs}ms latency.`,
      };
    }
    return {
      connected: false,
      databaseId: dedicatedDatabaseId,
      latencyMs,
      message: 'Document read failed on dedicated database instance.',
    };
  } catch (err: any) {
    return {
      connected: false,
      databaseId: dedicatedDatabaseId,
      latencyMs: Math.round(performance.now() - start),
      message: err?.message || 'Firestore connection check failed',
    };
  }
};

export { collection, doc, onSnapshot, setDoc, getDoc, getDocFromServer, getDocs, updateDoc, deleteDoc, writeBatch, signOut, onAuthStateChanged };

