import { TubularItem, MaterialTransferTicket, UserProfile, MaintenanceStatus, DrillingCampaign, DatabaseBackupRecord } from '../types/drilling';
import { safeJsonStringify, safeJsonParse, safeClone } from '../utils/safeJson';

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

export type DropdownCategoryKey = 
  | 'roles' 
  | 'departments' 
  | 'locations' 
  | 'holeSections' 
  | 'itemCategories' 
  | 'equipmentConditions' 
  | 'maintenanceStatuses' 
  | 'carrierTypes';

export const INITIAL_CAMPAIGNS: DrillingCampaign[] = [
  {
    id: 'CMP-2026-NORTH',
    code: 'CAM-PETRONAS-01',
    name: 'Petronas Deepwater North Malay Campaign 2026',
    operator: 'Petronas Carigali Sdn Bhd',
    clientCompany: 'Shell / Petronas Joint Venture',
    status: 'Active Execution',
    startDate: '2026-01-15',
    endDate: '2026-11-30',
    budgetUsd: 45000000,
    description: 'High pressure high temperature (HPHT) exploration & development drilling campaign across 3 deepwater wells.',
    wells: [
      {
        id: 'WEL-NL-01',
        name: 'Well Alpha-01 (Exploration)',
        code: 'WEL-ALP-01',
        type: 'Exploration',
        status: 'Active Drilling',
        targetDepthFt: 14500,
        afeCode: 'AFE-2026-DP-901',
        assignedRigId: 'RIG-CHAMPION',
        assignedRigName: 'Offshore Rig Alpha (Deepwater Champion)'
      },
      {
        id: 'WEL-NL-02',
        name: 'Well Alpha-02 (Development)',
        code: 'WEL-ALP-02',
        type: 'Development',
        status: 'Planning',
        targetDepthFt: 12800,
        afeCode: 'AFE-2026-DP-902',
        assignedRigId: 'RIG-CHAMPION',
        assignedRigName: 'Offshore Rig Alpha (Deepwater Champion)'
      }
    ],
    rigs: [
      { id: 'RIG-CHAMPION', name: 'Offshore Rig Alpha (Deepwater Champion)', location: 'Offshore Rig Alpha' }
    ],
    supplyBases: [
      { id: 'BASE-KSB', name: 'Main Supply Base Yard (Kemaman)', location: 'Main Supply Base Yard' }
    ],
    focals: [
      { id: 'FOC-01', name: 'Farhan Nazmi', email: 'farhan.drilling@petronas.com', roleTitle: 'Drilling Engineer', assignedLocation: 'Main Supply Base Yard' },
      { id: 'FOC-02', name: 'Zulhairi Azman', email: 'zulhairi.materials@apexdrilling.com', roleTitle: 'Materials Management Focal', assignedLocation: 'Main Supply Base Yard' },
      { id: 'FOC-03', name: 'Hafiz Matco', email: 'hafiz.matco@petronas.com', roleTitle: 'Materials Coordinator (Matco)', assignedLocation: 'Offshore Rig Alpha' }
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-08-12'
  },
  {
    id: 'CMP-2026-BARAM',
    code: 'CAM-SHELL-02',
    name: 'Shell Baram Delta Infill Campaign',
    operator: 'Shell Malaysia Exploration & Production',
    clientCompany: 'Sarawak Shell Berhad',
    status: 'Active Execution',
    startDate: '2026-03-01',
    endDate: '2026-12-20',
    budgetUsd: 28000000,
    description: 'Shallow water infill production wells with 13Cr premium tubing and CRA liner completions.',
    wells: [
      {
        id: 'WEL-BAR-104',
        name: 'Well Baram Delta B-104',
        code: 'WEL-BAR-104',
        type: 'Development',
        status: 'Active Drilling',
        targetDepthFt: 9800,
        afeCode: 'AFE-2026-BAR-304',
        assignedRigId: 'RIG-NOBLE5',
        assignedRigName: 'Rig Noble 5 Jackup'
      }
    ],
    rigs: [
      { id: 'RIG-NOBLE5', name: 'Rig Noble 5 Jackup', location: 'Offshore Rig Alpha' }
    ],
    supplyBases: [
      { id: 'BASE-LABUAN', name: 'Labuan Integrated Supply Base Yard', location: 'Main Supply Base Yard' }
    ],
    focals: [
      { id: 'FOC-04', name: 'Sarah Lin', email: 'sarah.lin@shell.com', roleTitle: 'Drilling Engineer', assignedLocation: 'Machine Shop & Testing Facility' },
      { id: 'FOC-05', name: 'Zulkifli Matco', email: 'zulkifli.matco@shell.com', roleTitle: 'Materials Coordinator (Matco)', assignedLocation: 'Main Supply Base Yard' }
    ],
    createdAt: '2026-02-15',
    updatedAt: '2026-08-12'
  }
];

export const DEFAULT_ROLES = [
  'System Administrator',
  'Drilling Engineer',
  'Logistics Coordinator',
  'Materials Coordinator (Supply Base)',
  'Rig Toolpusher / Materials Specialist',
  'QA/QC Inspector',
  'Auditor / Management',
  'Field Maintenance Technician'
];

export const DEFAULT_DEPARTMENTS = [
  'Drilling Operations',
  'Supply Base Operations',
  'Offshore Drilling Rig',
  'Subsea & Wellhead Ops',
  'QA/QC & Asset Integrity',
  'Logistics & Marine Freight',
  'Executive Management'
];

export const DEFAULT_LOCATIONS = [
  'Main Supply Base Yard',
  'Offshore Rig Alpha',
  'Machine Shop & Testing Facility',
  'In Transit (Supply Vessel)',
  'In Transit (Road Truck)',
  'Vendor Warehouse'
];

export const DEFAULT_HOLE_SECTIONS = [
  '36" Conductor',
  '26" Surface Hole',
  '17-1/2" Intermediate',
  '12-1/4" Main Hole',
  '8-1/2" Reservoir',
  '6" Liner / Workover',
  'Unassigned / General'
];

export const DEFAULT_ITEM_CATEGORIES = [
  'Casing',
  'Tubing',
  'Drill Pipe',
  'Heavy Weight Drill Pipe (HWDP)',
  'Drill Collar',
  'Liner',
  'Pup Joint',
  'Crossover Sub',
  'Float Equipment',
  'Centralizer & Stop Collar',
  'Running & Setting Tool',
  'Downhole Drilling Tool',
  'Jar & Stabilizer',
  'Wellhead & Safety Equipment'
];

export const DEFAULT_EQUIPMENT_CONDITIONS = [
  'New Purchased',
  'Used - Good',
  'Used - Minor Wear',
  'Backloaded - Pending Recert',
  'Damaged / Reject'
];

export const DEFAULT_MAINTENANCE_STATUSES = [
  'Serviceable (Field Ready)',
  'Due for Inspection',
  'Inspection Overdue',
  'In Refurbishment',
  'Quarantined / Damaged',
  'Scrapped'
];

export const DEFAULT_CARRIER_TYPES = [
  'Supply Vessel',
  'Truck Transport',
  'Helicopter',
  'Third-Party Freight'
];

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

  // Customizable Dropdowns
  customRoles?: string[];
  customDepartments?: string[];
  customLocations?: string[];
  customHoleSections?: string[];
  customItemCategories?: string[];
  customEquipmentConditions?: string[];
  customMaintenanceStatuses?: string[];
  customCarrierTypes?: string[];
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
    try {
      const sanitizedPayload = payload ? safeClone(payload) : payload;
      const msg = { type, payload: sanitizedPayload, timestamp: Date.now() };
      if (this.channel) {
        this.channel.postMessage(msg);
      }
      // Also dispatch custom local event for single window
      window.dispatchEvent(new CustomEvent('drillspec_db_change', { detail: msg }));
    } catch (e) {
      console.warn('Broadcast notify warning:', e);
    }
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
      localStorage.setItem('drillspec_items', safeJsonStringify(items));
      const db = await this.initDB();
      if (db.transaction) {
        const tx = db.transaction('items', 'readwrite');
        const store = tx.objectStore('items');
        await store.clear();
        for (const item of items) {
          store.put(safeClone(item));
        }
      }
    } catch (e) {
      console.warn('IndexedDB write error, saved to LocalStorage', e);
    }
  }

  // Save transfers snapshot
  public async saveTransfers(transfers: MaterialTransferTicket[]) {
    try {
      localStorage.setItem('drillspec_transfers', safeJsonStringify(transfers));
      const db = await this.initDB();
      if (db.transaction) {
        const tx = db.transaction('transfers', 'readwrite');
        const store = tx.objectStore('transfers');
        await store.clear();
        for (const t of transfers) {
          store.put(safeClone(t));
        }
      }
    } catch (e) {
      console.warn('IndexedDB write error', e);
    }
  }

  // Save users snapshot
  public async saveUsers(users: UserProfile[]) {
    try {
      localStorage.setItem('drillspec_users', safeJsonStringify(users));
      const db = await this.initDB();
      if (db.transaction) {
        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        await store.clear();
        for (const u of users) {
          store.put(safeClone(u));
        }
      }
    } catch (e) {
      console.warn('IndexedDB user save error', e);
    }
  }

  // Save verification email outbox log
  public async saveEmailOutbox(outbox: VerificationEmailRecord[]) {
    try {
      localStorage.setItem('drillspec_email_outbox', safeJsonStringify(outbox));
      const db = await this.initDB();
      if (db.transaction) {
        const tx = db.transaction('email_outbox', 'readwrite');
        const store = tx.objectStore('email_outbox');
        await store.clear();
        for (const record of outbox) {
          store.put(safeClone(record));
        }
      }
    } catch (e) {
      console.warn('IndexedDB outbox error', e);
    }
  }

  // Save system configuration
  public async saveConfig(config: SystemConfiguration) {
    try {
      localStorage.setItem('drillspec_config', safeJsonStringify(config));
    } catch (e) {
      console.warn('Error saving config', e);
    }
  }

  // Save Audit Logs snapshot
  public async saveAuditLogs(logs: any[]) {
    try {
      localStorage.setItem('drillspec_audit_logs', safeJsonStringify(logs));
    } catch (e) {
      console.warn('Error saving audit logs', e);
    }
  }

  // Save Backload manifests snapshot
  public async saveBackloads(backloads: any[]) {
    try {
      localStorage.setItem('drillspec_backloads', safeJsonStringify(backloads));
    } catch (e) {
      console.warn('Error saving backloads', e);
    }
  }

  // Save campaigns snapshot
  public async saveCampaigns(campaigns: DrillingCampaign[]) {
    try {
      localStorage.setItem('drillspec_campaigns', safeJsonStringify(campaigns));
    } catch (e) {
      console.warn('Error saving campaigns', e);
    }
  }

  // Save backups snapshot vault
  public async saveBackups(backups: DatabaseBackupRecord[]) {
    try {
      localStorage.setItem('drillspec_backups_vault', safeJsonStringify(backups));
    } catch (e) {
      console.warn('Error saving backup vault', e);
    }
  }

  // Loaders
  public loadCampaigns(): DrillingCampaign[] | null {
    try {
      const raw = localStorage.getItem('drillspec_campaigns');
      return safeJsonParse(raw, null);
    } catch {
      return null;
    }
  }

  public loadBackups(): DatabaseBackupRecord[] | null {
    try {
      const raw = localStorage.getItem('drillspec_backups_vault');
      return safeJsonParse(raw, null);
    } catch {
      return null;
    }
  }

  public loadItems(): TubularItem[] | null {
    try {
      const raw = localStorage.getItem('drillspec_items');
      return safeJsonParse(raw, null);
    } catch {
      return null;
    }
  }

  public loadAuditLogs(): any[] | null {
    try {
      const raw = localStorage.getItem('drillspec_audit_logs');
      return safeJsonParse(raw, null);
    } catch {
      return null;
    }
  }

  public loadBackloads(): any[] | null {
    try {
      const raw = localStorage.getItem('drillspec_backloads');
      return safeJsonParse(raw, null);
    } catch {
      return null;
    }
  }

  public loadTransfers(): MaterialTransferTicket[] | null {
    try {
      const raw = localStorage.getItem('drillspec_transfers');
      return safeJsonParse(raw, null);
    } catch {
      return null;
    }
  }

  public loadUsers(): UserProfile[] | null {
    try {
      const raw = localStorage.getItem('drillspec_users');
      return safeJsonParse(raw, null);
    } catch {
      return null;
    }
  }

  public loadEmailOutbox(): VerificationEmailRecord[] {
    try {
      const raw = localStorage.getItem('drillspec_email_outbox');
      return safeJsonParse(raw, []);
    } catch {
      return [];
    }
  }

  public loadConfig(): SystemConfiguration | null {
    try {
      const raw = localStorage.getItem('drillspec_config');
      return safeJsonParse(raw, null);
    } catch {
      return null;
    }
  }
}

export const embeddedDb = new EmbeddedRealtimeDatabase();
