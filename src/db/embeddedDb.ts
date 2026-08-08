import { TubularItem, MaterialTransferTicket, UserProfile, MaintenanceStatus } from '../types/drilling';

export interface VerificationEmailRecord {
  id: string;
  recipientEmail: string;
  userName: string;
  corporateDomain: string;
  token: string;
  sentAt: string;
  status: 'Sent' | 'Delivered' | 'Verified' | 'Failed';
  verificationLink: string;
}

export interface SystemConfiguration {
  corporateDomains: string[];
  autoApproveVerifiedCorporateEmails: boolean;
  defaultInspectionIntervalDays: Record<string, number>;
  inspectionLeadAlertDays: number;
  vismaErpSyncEnabled: boolean;
  vismaEndpointUrl: string;
  vismaApiKey: string;
  defaultAfeCode: string;
  systemName: string;
  maintenanceMode: boolean;
  embeddedDbVersion: string;
}

const DB_NAME = 'DrillSpec_Embedded_Realtime_DB';
const DB_VERSION = 1;

class EmbeddedRealtimeDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(event: { type: string; payload?: any }) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDB();
      this.initBroadcastChannel();
    }
  }

  private initBroadcastChannel() {
    try {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('drillspec_realtime_channel');
        this.channel.onmessage = (event) => {
          this.listeners.forEach(cb => cb(event.data));
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in iframe environment, falling back to window storage events.', e);
    }
  }

  public subscribe(callback: (event: { type: string; payload?: any }) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  public notify(type: string, payload?: any) {
    const msg = { type, payload, timestamp: Date.now() };
    if (this.channel) {
      this.channel.postMessage(msg);
    }
    // Also dispatch custom local event for single window
    window.dispatchEvent(new CustomEvent('drillspec_db_change', { detail: msg }));
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB unavailable, using LocalStorage fallback');
        return resolve({} as any);
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        if (!db.objectStoreNames.contains('items')) {
          db.createObjectStore('items', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('transfers')) {
          db.createObjectStore('transfers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('email_outbox')) {
          db.createObjectStore('email_outbox', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // Save items snapshot to IndexedDB & LocalStorage
  public async saveItems(items: TubularItem[]) {
    try {
      localStorage.setItem('drillspec_items', JSON.stringify(items));
      const db = await this.initDB();
      if (db.transaction) {
        const tx = db.transaction('items', 'readwrite');
        const store = tx.objectStore('items');
        await store.clear();
        for (const item of items) {
          store.put(item);
        }
      }
    } catch (e) {
      console.warn('IndexedDB write error, saved to LocalStorage', e);
    }
  }

  // Save transfers snapshot
  public async saveTransfers(transfers: MaterialTransferTicket[]) {
    try {
      localStorage.setItem('drillspec_transfers', JSON.stringify(transfers));
      const db = await this.initDB();
      if (db.transaction) {
        const tx = db.transaction('transfers', 'readwrite');
        const store = tx.objectStore('transfers');
        await store.clear();
        for (const t of transfers) {
          store.put(t);
        }
      }
    } catch (e) {
      console.warn('IndexedDB write error', e);
    }
  }

  // Save users snapshot
  public async saveUsers(users: UserProfile[]) {
    try {
      localStorage.setItem('drillspec_users', JSON.stringify(users));
      const db = await this.initDB();
      if (db.transaction) {
        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        await store.clear();
        for (const u of users) {
          store.put(u);
        }
      }
    } catch (e) {
      console.warn('IndexedDB user save error', e);
    }
  }

  // Save verification email outbox log
  public async saveEmailOutbox(outbox: VerificationEmailRecord[]) {
    try {
      localStorage.setItem('drillspec_email_outbox', JSON.stringify(outbox));
      const db = await this.initDB();
      if (db.transaction) {
        const tx = db.transaction('email_outbox', 'readwrite');
        const store = tx.objectStore('email_outbox');
        await store.clear();
        for (const record of outbox) {
          store.put(record);
        }
      }
    } catch (e) {
      console.warn('IndexedDB outbox error', e);
    }
  }

  // Save system configuration
  public async saveConfig(config: SystemConfiguration) {
    try {
      localStorage.setItem('drillspec_config', JSON.stringify(config));
    } catch (e) {
      console.warn('Error saving config', e);
    }
  }

  // Loaders
  public loadItems(): TubularItem[] | null {
    try {
      const raw = localStorage.getItem('drillspec_items');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public loadTransfers(): MaterialTransferTicket[] | null {
    try {
      const raw = localStorage.getItem('drillspec_transfers');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public loadUsers(): UserProfile[] | null {
    try {
      const raw = localStorage.getItem('drillspec_users');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public loadEmailOutbox(): VerificationEmailRecord[] {
    try {
      const raw = localStorage.getItem('drillspec_email_outbox');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public loadConfig(): SystemConfiguration | null {
    try {
      const raw = localStorage.getItem('drillspec_config');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export const embeddedDb = new EmbeddedRealtimeDatabase();
