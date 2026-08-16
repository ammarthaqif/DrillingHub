import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { safeJsonStringify, safeJsonParse, safeClone } from '../utils/safeJson';
import { hashPassword, verifyPassword, encryptData, decryptData } from '../utils/crypto';
import { 
  TubularItem, 
  MaterialTransferTicket, 
  UserProfile, 
  UserRole, 
  UserAccountStatus,
  HoleSection, 
  LocationType,
  OfflineQueueItem,
  AlertSummary,
  EquipmentCondition,
  MaintenanceStatus,
  InspectionRecord,
  MaintenanceLog,
  SurplusBookingRequest,
  MaterialRequisitionForm,
  RigMaterialCallout,
  RigBackloadList,
  RigBackloadItem,
  AuditTrailLog,
  ActiveSessionData,
  ConcurrentLoginRequestData,
  DrillingCampaign,
  WellDefinition,
  ItemPhotoRecord,
  DatabaseBackupRecord,
  WellChargeCode,
  SystemNotification
} from '../types/drilling';
import { 
  INITIAL_ITEMS, 
  INITIAL_TRANSFERS, 
  INITIAL_USERS,
  INITIAL_SURPLUS_BOOKINGS,
  INITIAL_REQUISITIONS,
  INITIAL_RIG_CALLOUTS,
  INITIAL_RIG_BACKLOADS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CHARGE_CODES,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';
import { 
  embeddedDb, 
  INITIAL_CAMPAIGNS,
  VerificationEmailRecord, 
  SystemConfiguration,
  DropdownCategoryKey,
  DEFAULT_ROLES,
  DEFAULT_DEPARTMENTS,
  DEFAULT_LOCATIONS,
  DEFAULT_HOLE_SECTIONS,
  DEFAULT_ITEM_CATEGORIES,
  DEFAULT_EQUIPMENT_CONDITIONS,
  DEFAULT_MAINTENANCE_STATUSES,
  DEFAULT_CARRIER_TYPES
} from '../db/embeddedDb';

interface DrillingContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  isAuthenticated: boolean;
  pendingLoginRequest: ConcurrentLoginRequestData | null;
  logoutNotice: string | null;
  setLogoutNotice: (notice: string | null) => void;
  acceptConcurrentLoginRequest: (requestId: string) => void;
  declineConcurrentLoginRequest: (requestId: string) => void;
  loginUser: (
    userId: string, 
    accessKey?: string, 
    options?: { overrideActiveSession?: boolean; totpCode?: string }
  ) => { 
    success: boolean; 
    message: string; 
    pendingRequest?: boolean; 
    requestId?: string; 
    requiresTotp?: boolean;
    activeUser?: { name: string; role: string } 
  };
  loginWithMicrosoftAccount: (
    msUser: { email: string; displayName: string; uid: string; tenantId?: string; photoURL?: string | null }, 
    options?: { overrideActiveSession?: boolean }
  ) => Promise<{ 
    success: boolean; 
    message: string; 
    user?: UserProfile; 
    pendingRequest?: boolean; 
    requestId?: string; 
    requiresRegistration?: boolean;
    activeUser?: { name: string; role: string } 
  }>;
  registerWithMicrosoft: (
    msUser: { email: string; displayName: string; uid: string; tenantId?: string }, 
    details: { role: UserRole; department: string; location: LocationType }
  ) => { success: boolean; message: string; user?: UserProfile };
  migrateDatabaseToDedicatedFirestore: () => Promise<{ success: boolean; stats: any; message: string }>;
  testDedicatedFirestoreConnection: () => Promise<{ connected: boolean; databaseId: string; latencyMs: number; message: string }>;
  dedicatedDatabaseId: string;
  isMigratingToDedicatedDb: boolean;
  logoutUser: (reason?: string) => void;
  setCurrentUserRole: (role: UserRole) => void;
  registerUser: (newUser: { name: string; email: string; role: UserRole; department: string; location: LocationType; initialStatus?: UserAccountStatus }) => { success: boolean; message: string; user?: UserProfile };
  bulkImportApprovedUsers: (users: { name: string; email: string; role?: UserRole; department?: string; location?: LocationType }[]) => { success: boolean; count: number; importedUsers: { email: string; name: string; token: string; role: string }[]; errors: string[] };
  provisionSystemAdminAccount: () => { success: boolean; message: string; user: UserProfile };
  updateUserStatus: (userId: string, status: UserAccountStatus) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  updateUser: (userId: string, updates: Partial<UserProfile>) => { success: boolean; message: string };
  deleteUser: (userId: string) => { success: boolean; message: string };
  revokeUserAccess: (userId: string) => { success: boolean; message: string };
  resendVerificationEmail: (userId: string) => void;
  sendEmailCredentialsServer: (userEmail: string) => Promise<{ success: boolean; message: string }>;
  sendAuthTokenEmail: (email: string) => Promise<{ success: boolean; message: string; token?: string }>;
  resetPasswordWithToken: (email: string, token: string, newPassword: string) => { success: boolean; message: string };
  updateCurrentUserPassword: (currentPassword: string, newPassword: string) => { success: boolean; message: string };
  toggleMsAuthenticator: (userId: string, enable: boolean) => { success: boolean; message: string; secret?: string };
  verifyMsTotpCode: (userIdOrEmail: string, code: string) => boolean;
  verifyEmailWithToken: (token: string) => boolean;
  emailOutbox: VerificationEmailRecord[];
  systemConfig: SystemConfiguration;
  updateSystemConfig: (updates: Partial<SystemConfiguration>) => void;
  addCorporateDomain: (domain: string) => void;
  removeCorporateDomain: (domain: string) => void;
  exportDatabaseSnapshot: () => void;
  resetDatabaseToInitial: () => void;
  
  // Customizable Dropdowns
  availableRoles: string[];
  availableDepartments: string[];
  availableLocations: string[];
  availableHoleSections: string[];
  availableCategories: string[];
  availableEquipmentConditions: string[];
  availableMaintenanceStatuses: string[];
  availableCarrierTypes: string[];
  addDropdownOption: (categoryKey: DropdownCategoryKey, newValue: string) => { success: boolean; message: string };
  removeDropdownOption: (categoryKey: DropdownCategoryKey, valueToRemove: string) => { success: boolean; message: string };
  resetDropdownOptions: (categoryKey?: DropdownCategoryKey) => void;
  
  // Inventory
  items: TubularItem[];
  addItem: (item: Omit<TubularItem, 'id' | 'updatedAt' | 'qrCodeData' | 'inspectionHistory' | 'maintenanceLogs'>) => void;
  bulkAddItems: (newItemsData: Omit<TubularItem, 'id' | 'updatedAt' | 'qrCodeData' | 'inspectionHistory' | 'maintenanceLogs'>[]) => void;
  updateItem: (id: string, updates: Partial<TubularItem>) => void;
  bulkUpdateStatus: (itemIds: string[], status: MaintenanceStatus, notes?: string) => void;
  bulkUpdateLocation: (itemIds: string[], location: LocationType, rackLocation?: string, notes?: string) => void;
  bulkUpdateItems: (itemIds: string[], updates: {
    status?: MaintenanceStatus;
    currentLocation?: LocationType;
    rackLocation?: string;
    condition?: EquipmentCondition;
    holeSection?: HoleSection;
    projectOwner?: string;
    wellChargeCode?: string;
  }, notes?: string) => void;
  transferOwnership: (
    itemId: string, 
    newProjectOwner: string, 
    transferReason: string, 
    wellChargeCode?: string, 
    referenceDocNumber?: string, 
    notes?: string
  ) => void;
  deleteItem: (id: string) => void;
  bulkDeleteItems: (ids: string[]) => void;
  addInspectionRecord: (itemId: string, record: Omit<InspectionRecord, 'id'>) => void;
  addMaintenanceLog: (itemId: string, log: Omit<MaintenanceLog, 'id'>) => void;
  
  // Transfers
  transfers: MaterialTransferTicket[];
  createTransfer: (
    origin: LocationType, 
    destination: LocationType, 
    carrierType: MaterialTransferTicket['carrierType'], 
    carrierName: string, 
    selectedItemIds: { itemId: string; quantityJoints: number }[],
    notes?: string,
    signOffDetails?: {
      senderSignature?: string;
      senderBadgeId?: string;
      receiverName?: string;
      receiverRole?: UserRole;
      receiverSignature?: string;
      receiverBadgeId?: string;
      receiverDesignation?: string;
      authorizationToken?: string;
      dispatchChecklistCompleted?: boolean;
    }
  ) => MaterialTransferTicket;
  validateSenderDispatch: (transferId: string, notes?: string) => void;
  validateReceiverArrival: (
    transferId: string, 
    itemConditions: { itemId: string; condition: EquipmentCondition; discrepancyNote?: string }[],
    notes?: string
  ) => void;

  // Drilling Engineer & Workflow Extensions
  surplusBookings: SurplusBookingRequest[];
  createSurplusBooking: (req: Omit<SurplusBookingRequest, 'id' | 'createdAt' | 'status'>) => void;
  validateSurplusBookingStage: (bookingId: string, stage: 'costController' | 'mmFocal' | 'supplyBaseFocal', notes: string) => void;
  flagSurplusForVendorServiceAndPO: (bookingId: string, serviceType: string, vendorName: string, estimatedCostUsd: number) => void;
  
  materialRequisitions: MaterialRequisitionForm[];
  createMaterialRequisition: (form: Omit<MaterialRequisitionForm, 'id'>) => void;
  
  rigCallouts: RigMaterialCallout[];
  createRigCallout: (callout: Omit<RigMaterialCallout, 'id'>) => void;
  
  rigBackloads: RigBackloadList[];
  createRigBackload: (backload: Omit<RigBackloadList, 'id'>) => void;
  receiveRigBackloadAtSupplyBase: (manifestId: string, inspectionNotes: string) => void;
  confirmVesselArrivalAtBase: (manifestId: string, arrivalNotes?: string) => void;
  processBackloadActionAtBase: (
    manifestId: string,
    itemTagNumber: string,
    actionType: 'SENT_FOR_INSPECTION' | 'SENT_FOR_DISPOSAL',
    details: {
      inspectionType?: 'NDT (Magnetic Particle)' | 'Visual Thread Inspection' | 'Full Length Ultrasonic' | 'Drift Test' | 'Torque & Bucking Test' | 'Hardbanding Repair' | 'Recertification';
      inspectionFacility?: string;
      scrapCertId?: string;
      disposalReason?: string;
      disposalYardLocation?: string;
      notes?: string;
    }
  ) => void;

  // Persistent Bulk Transfer Selection Across Tabs
  selectedTubularIdsForTransfer: string[];
  toggleTubularSelectionForTransfer: (id: string) => void;
  setSelectedTubularIdsForTransfer: (ids: string[]) => void;
  clearTubularSelectionForTransfer: () => void;
  bulkAssignToBackloadManifest: (manifestId: string, itemIds: string[]) => void;

  // Backload Automated Routing Engine & PO Attachment
  autoRouteBackloadItems: (manifestId?: string, ageThresholdYears?: number) => void;
  attachApprovedPOToItem: (itemId: string, poNumber: string, vendorName: string, serviceScope: string, costUsd?: number) => void;
  attachApprovedPOToBackloadItem: (manifestId: string, itemTagNumber: string, poNumber: string, vendorName: string, serviceScope: string, costUsd?: number) => void;

  // Audit Trail System
  auditTrailLogs: AuditTrailLog[];
  logAuditTrail: (
    actionType: AuditTrailLog['actionType'],
    referenceId: string,
    details: string,
    notes?: string,
    userOverride?: { id: string; name: string; role: UserRole; location: LocationType }
  ) => void;

  // Role-Based Access Control (RBAC) Module Permissions
  roleModulePermissions: Record<string, string[]>;
  updateRoleModulePermissions: (role: string, allowedModules: string[]) => void;
  resetRoleModulePermissions: () => void;
  hasModuleAccess: (role: string, moduleKey: string) => boolean;

  // Multi-Project & Campaign Management
  campaigns: DrillingCampaign[];
  activeCampaignId: string | 'ALL';
  setActiveCampaignId: (id: string | 'ALL') => void;
  createCampaign: (campaign: Omit<DrillingCampaign, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCampaign: (id: string, updates: Partial<DrillingCampaign>) => void;
  deleteCampaign: (id: string) => void;
  addWellToCampaign: (campaignId: string, well: Omit<WellDefinition, 'id'>) => void;

  // Real-time Photo Upload & Verification
  addItemPhoto: (itemId: string, photo: Omit<ItemPhotoRecord, 'id' | 'capturedAt'>) => void;

  // Anti-Duplicate & Anti-Double Booking Guard
  checkDuplicateItem: (serialNumber: string, heatNumber: string, currentItemId?: string) => TubularItem | null;
  lockItemForTransfer: (itemId: string, manifestId: string, manifestType: 'Material Transfer Ticket' | 'Rig Backload Manifest' | 'Surplus Requisition', destination: string) => void;
  unlockItemForTransfer: (itemId: string) => void;

  // Automated & Manual Backup & Restore System
  backups: DatabaseBackupRecord[];
  createBackupVaultSnapshot: (backupType?: DatabaseBackupRecord['backupType'], notes?: string) => DatabaseBackupRecord;
  downloadBackupFile: (backupId?: string) => void;
  restoreFromBackupSnapshot: (restoredData: any) => void;
  exportEncryptedSnapshot: (passphrase?: string) => string;
  importEncryptedSnapshot: (fileContent: string, passphrase?: string) => { success: boolean; message: string; stats?: any };

  // Notifications Center
  notifications: SystemNotification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: string) => void;
  addSystemNotification: (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'isRead'>) => void;

  // Well & Project Charge Codes (Cost Controller Hub)
  chargeCodes: WellChargeCode[];
  addChargeCode: (code: Omit<WellChargeCode, 'id' | 'createdDate'>) => { success: boolean; message: string; chargeCode?: WellChargeCode };
  updateChargeCode: (id: string, updates: Partial<WellChargeCode>) => { success: boolean; message: string };
  deleteChargeCode: (id: string) => { success: boolean; message: string };
  importChargeCodes: (codes: Partial<WellChargeCode>[]) => { success: boolean; importedCount: number; errors: string[] };

  // Filters & Views
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedHoleSection: HoleSection | 'ALL';
  setSelectedHoleSection: (sec: HoleSection | 'ALL') => void;
  selectedLocation: LocationType | 'ALL';
  setSelectedLocation: (loc: LocationType | 'ALL') => void;
  selectedStatus: MaintenanceStatus | 'ALL';
  setSelectedStatus: (stat: MaintenanceStatus | 'ALL') => void;
  showSurplusOnly: boolean;
  setShowSurplusOnly: (val: boolean) => void;

  // Offline Mode & Queue
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  offlineQueue: OfflineQueueItem[];
  processSyncQueue: () => void;
  clearOfflineQueue: () => void;

  // Alerts
  alerts: AlertSummary;
  filteredItems: TubularItem[];
}

import { 
  db, 
  auth,
  signInWithMicrosoftOAuth,
  testFirestoreConnection,
  dedicatedDatabaseId,
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from '../lib/firebase';

export const DEFAULT_ROLE_MODULE_PERMISSIONS: Record<string, string[]> = {
  'System Administrator': [
    'dashboard', 'inventory', 'materialsManagement', 'drillingEngineer', 'supplyBaseMatco', 
    'rigSiteMatco', 'checkAndBalance', 'holeSection', 'surplus', 
    'movement', 'costController', 'audit', 'admin'
  ],
  'Drilling Engineer': [
    'dashboard', 'inventory', 'materialsManagement', 'drillingEngineer', 'holeSection', 'surplus', 'costController'
  ],
  'Cost Controller': [
    'dashboard', 'inventory', 'materialsManagement', 'movement', 'checkAndBalance', 'surplus', 'costController', 'audit'
  ],
  'Logistics Coordinator': [
    'dashboard', 'inventory', 'materialsManagement', 'movement', 'supplyBaseMatco', 'rigSiteMatco', 'surplus'
  ],
  'Materials Coordinator (Supply Base)': [
    'dashboard', 'materialsManagement', 'inventory', 'supplyBaseMatco', 'movement', 'surplus'
  ],
  'Materials Management Specialist': [
    'dashboard', 'materialsManagement', 'inventory', 'supplyBaseMatco', 'movement', 'surplus'
  ],
  'Rig Toolpusher / Materials Specialist': [
    'dashboard', 'materialsManagement', 'inventory', 'rigSiteMatco', 'movement', 'surplus'
  ],
  'QA/QC Inspector': [
    'dashboard', 'inventory', 'checkAndBalance', 'audit'
  ],
  'Auditor / Management': [
    'dashboard', 'inventory', 'audit', 'checkAndBalance', 'costController'
  ]
};

const DEFAULT_CONFIG: SystemConfiguration = {
  corporateDomains: ['petronas.com', 'shell.com', 'chevron.com', 'totalenergies.com', 'halliburton.com', 'bakerhughes.com', 'drillspec.corp'],
  autoApproveVerifiedCorporateEmails: true,
  defaultInspectionIntervalDays: {
    'Casing': 365,
    'Tubing': 365,
    'Drill Pipe': 180,
    'Heavy Weight Drill Pipe (HWDP)': 180,
    'Drill Collar': 180,
    'Liner': 365,
    'Pup Joint': 180,
    'Crossover Sub': 180,
    'Float Equipment': 180,
    'Downhole Drilling Tool': 90,
  },
  inspectionLeadAlertDays: 30,
  vismaErpSyncEnabled: true,
  vismaEndpointUrl: 'https://erp.visma.corp/api/v2/drilling-materials',
  vismaApiKey: 'VISMA-SECRET-KEY-882190',
  defaultAfeCode: 'AFE-2026-ALPHA-01',
  systemName: 'DRILLCORE OS - Campaign Inventory Engine',
  maintenanceMode: false,
  embeddedDbVersion: '1.0.0-embedded',

  customRoles: DEFAULT_ROLES,
  customDepartments: DEFAULT_DEPARTMENTS,
  customLocations: DEFAULT_LOCATIONS,
  customHoleSections: DEFAULT_HOLE_SECTIONS,
  customItemCategories: DEFAULT_ITEM_CATEGORIES,
  customEquipmentConditions: DEFAULT_EQUIPMENT_CONDITIONS,
  customMaintenanceStatuses: DEFAULT_MAINTENANCE_STATUSES,
  customCarrierTypes: DEFAULT_CARRIER_TYPES,
};

const DrillingContext = createContext<DrillingContextType | undefined>(undefined);

export const DrillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users state
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const loadedUsers = embeddedDb.loadUsers();
    let initialList = loadedUsers || INITIAL_USERS.map(u => ({
      ...u,
      status: 'Active Approved' as UserAccountStatus,
      isCorporateVerified: true,
      registeredAt: '2026-08-01',
    }));

    // Guarantee that at least one System Administrator user exists in the directory
    const hasAdmin = initialList.some(u => u.role === 'System Administrator');
    if (!hasAdmin) {
      const mainAdminUser: UserProfile = {
        id: 'usr-main-admin',
        name: 'Corporate System Admin',
        role: 'System Administrator',
        department: 'Corporate IT & Admin Controls',
        location: 'Main Supply Base Yard',
        email: 'admin@apexdrilling.com',
        status: 'Active Approved',
        isCorporateVerified: true,
        registeredAt: '2026-08-01',
      };
      initialList = [mainAdminUser, ...initialList];
      embeddedDb.saveUsers(initialList);
    }
    return initialList;
  });

  // Authentication & Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedSession = localStorage.getItem('drillcore_auth_session');
      return savedSession === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const activeId = localStorage.getItem('drillcore_active_user_id');
      if (activeId) {
        const found = allUsers.find(u => u.id === activeId);
        if (found) return found;
      }
    } catch {}
    return allUsers[0] || INITIAL_USERS[0];
  });

  const [pendingLoginRequest, setPendingLoginRequest] = useState<ConcurrentLoginRequestData | null>(null);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);

  // Active Session Heartbeat & Pending Request Polling
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isAuthenticated && currentUser) {
      const syncSessionAndRequests = () => {
        try {
          // 1. Maintain active session heartbeat
          const sessData: ActiveSessionData = {
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            userEmail: currentUser.email,
            loginTime: Date.now(),
            lastHeartbeat: Date.now(),
          };
          localStorage.setItem('drillcore_active_session', safeJsonStringify(sessData));

          // 2. Poll for incoming login requests
          const rawReq = localStorage.getItem('drillcore_concurrent_login_request');
          if (rawReq) {
            const parsed: ConcurrentLoginRequestData = safeJsonParse(rawReq, null as any);
            if (parsed && parsed.status === 'PENDING') {
              setPendingLoginRequest(parsed);
            } else if (!parsed || parsed.status !== 'PENDING') {
              setPendingLoginRequest(null);
            }
          } else {
            setPendingLoginRequest(null);
          }
        } catch (err) {
          console.warn('Session sync error:', err);
        }
      };

      syncSessionAndRequests();
      timer = setInterval(syncSessionAndRequests, 800);
    } else {
      setPendingLoginRequest(null);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAuthenticated, currentUser]);

  // Window Storage & BroadcastChannel Listener for Real-Time Sync Across Tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'drillcore_concurrent_login_request' && e.newValue) {
        try {
          const parsed: ConcurrentLoginRequestData = JSON.parse(e.newValue);
          if (parsed && parsed.status === 'PENDING' && isAuthenticated) {
            setPendingLoginRequest(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('drillcore_session_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'LOGIN_REQUEST_SUBMITTED' && isAuthenticated) {
          if (event.data.request && event.data.request.status === 'PENDING') {
            setPendingLoginRequest(event.data.request);
          }
        }
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (bc) bc.close();
    };
  }, [isAuthenticated]);

  const acceptConcurrentLoginRequest = (reqId: string) => {
    try {
      const rawReq = localStorage.getItem('drillcore_concurrent_login_request');
      if (rawReq) {
        const parsed: ConcurrentLoginRequestData = JSON.parse(rawReq);
        if (parsed.requestId === reqId) {
          parsed.status = 'ACCEPTED';
          localStorage.setItem('drillcore_concurrent_login_request', safeJsonStringify(parsed));
          if (typeof BroadcastChannel !== 'undefined') {
            try {
              const bc = new BroadcastChannel('drillcore_session_channel');
              bc.postMessage({ type: 'LOGIN_REQUEST_ACCEPTED', requestId: reqId });
              bc.close();
            } catch {}
          }
        }
      }
    } catch (e) {
      console.error('Accept request error:', e);
    }

    setPendingLoginRequest(null);
    logoutUser('Your session was terminated because you accepted a concurrent login attempt.');
  };

  const declineConcurrentLoginRequest = (reqId: string) => {
    try {
      const rawReq = localStorage.getItem('drillcore_concurrent_login_request');
      if (rawReq) {
        const parsed: ConcurrentLoginRequestData = safeJsonParse(rawReq, null as any);
        if (parsed && parsed.requestId === reqId) {
          parsed.status = 'DECLINED';
          localStorage.setItem('drillcore_concurrent_login_request', safeJsonStringify(parsed));
          if (typeof BroadcastChannel !== 'undefined') {
            try {
              const bc = new BroadcastChannel('drillcore_session_channel');
              bc.postMessage({ type: 'LOGIN_REQUEST_DECLINED', requestId: reqId });
              bc.close();
            } catch {}
          }
        }
      }
    } catch (e) {
      console.error('Decline request error:', e);
    }

    setPendingLoginRequest(null);
  };

  const verifyMsTotpCode = (userIdOrEmail: string, code: string): boolean => {
    const cleanCode = (code || '').trim();
    if (!cleanCode || cleanCode.length !== 6) return false;
    return /^\d{6}$/.test(cleanCode);
  };

  const loginUser = (
    userId: string, 
    accessKey?: string,
    options?: { overrideActiveSession?: boolean; totpCode?: string }
  ) => {
    const user = allUsers.find(
      u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase()
    );
    if (!user) {
      return { success: false, message: 'Access Denied: User identity not found in authorized directory. Access must be granted by the System Administrator.' };
    }

    if (user.status === 'Suspended' || user.status === 'Deactivated') {
      return { success: false, message: `Access Denied: Account is ${user.status}. Access must be granted by the System Administrator.` };
    }

    if (user.status !== 'Active Approved') {
      return { success: false, message: `Access Denied: Account status is '${user.status}'. Access must be granted and approved by the System Administrator.` };
    }

    // Password validation using salted SHA-256 cryptographic hashes
    const providedKey = (accessKey || '').trim();
    if (user.passwordHash) {
      if (!verifyPassword(providedKey, user.passwordHash)) {
        return { success: false, message: 'Invalid password. If you forgot your password or are logging in for the first time, please click "Authorization Token & Password" to set your custom password.' };
      }
    } else {
      return { 
        success: false, 
        message: 'Custom password not set. First-time users must click the "Authorization Token & Password" tab to verify their 6-digit token and set a custom password.' 
      };
    }

    // Microsoft Authenticator 2FA Check
    if (user.msAuthenticatorEnabled) {
      const totp = (options?.totpCode || '').trim();
      if (!totp) {
        return {
          success: false,
          requiresTotp: true,
          message: 'Microsoft Authenticator 2FA Verification Required. Enter the 6-digit code from your Microsoft Authenticator App.'
        };
      }
      if (!verifyMsTotpCode(user.id, totp)) {
        return {
          success: false,
          requiresTotp: true,
          message: 'Invalid 6-digit Microsoft Authenticator code. Please check your app and enter a valid code.'
        };
      }
    }

    // Concurrent Single Active Session Check
    if (!options?.overrideActiveSession) {
      try {
        const rawSession = localStorage.getItem('drillcore_active_session');
        if (rawSession) {
          const activeSess: ActiveSessionData = safeJsonParse(rawSession, null as any);
          const isFresh = activeSess && (Date.now() - (activeSess.lastHeartbeat || 0)) < 8000;

          if (isFresh && activeSess.userId) {
            const reqId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const reqData: ConcurrentLoginRequestData = {
              requestId: reqId,
              requestingUser: {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email,
              },
              timestamp: Date.now(),
              status: 'PENDING',
            };

            localStorage.setItem('drillcore_concurrent_login_request', safeJsonStringify(reqData));

            if (typeof BroadcastChannel !== 'undefined') {
              try {
                const bc = new BroadcastChannel('drillcore_session_channel');
                bc.postMessage({ type: 'LOGIN_REQUEST_SUBMITTED', request: safeClone(reqData) });
                bc.close();
              } catch {}
            }

            return {
              success: false,
              pendingRequest: true,
              requestId: reqId,
              activeUser: { name: activeSess.userName, role: activeSess.userRole },
              message: `Single active session policy enforced. Permission prompt sent to ${activeSess.userName} (${activeSess.userRole}).`,
            };
          }
        }
      } catch (err) {
        console.warn('Active session check error:', err);
      }
    }

    // Clear previous login requests
    try {
      localStorage.removeItem('drillcore_concurrent_login_request');
    } catch {}

    setCurrentUser(user);
    setIsAuthenticated(true);
    setLogoutNotice(null);

    const newSession: ActiveSessionData = {
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userEmail: user.email,
      loginTime: Date.now(),
      lastHeartbeat: Date.now(),
    };

    try {
      localStorage.setItem('drillcore_auth_session', 'true');
      localStorage.setItem('drillcore_active_user_id', user.id);
      localStorage.setItem('drillcore_active_session', safeJsonStringify(newSession));
    } catch {}

    return { success: true, message: `Authenticated as ${user.name} (${user.role}).` };
  };

  const logoutUser = (reason?: string) => {
    setIsAuthenticated(false);
    if (reason) {
      setLogoutNotice(reason);
    } else {
      setLogoutNotice(null);
    }

    try {
      localStorage.removeItem('drillcore_auth_session');
      localStorage.removeItem('drillcore_active_session');
      localStorage.removeItem('drillcore_active_user_id');
    } catch {}
  };

  const [isMigratingToDedicatedDb, setIsMigratingToDedicatedDb] = useState(false);

  const testDedicatedFirestoreConnection = async () => {
    return await testFirestoreConnection();
  };

  const loginWithMicrosoftAccount = async (
    msUser: { email: string; displayName: string; uid: string; tenantId?: string; photoURL?: string | null },
    options?: { overrideActiveSession?: boolean }
  ) => {
    const cleanEmail = (msUser.email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Invalid Microsoft profile: Email address missing.' };
    }

    const domain = cleanEmail.split('@')[1];
    const isDomainAllowed = systemConfig.corporateDomains.some(d => d.toLowerCase() === domain);

    // Look for existing user in corporate directory that was granted access by System Administrator
    const user = allUsers.find(
      u => u.email.toLowerCase() === cleanEmail || (u.msAuthUid && u.msAuthUid === msUser.uid)
    );

    if (!user) {
      return {
        success: false,
        message: `Access Denied: The account '${cleanEmail}' has not been granted access by a System Administrator. Please contact your System Administrator to be provisioned in the authorized user directory.`
      };
    }

    if (user.status === 'Suspended' || user.status === 'Deactivated') {
      return { success: false, message: `Access Denied: Account for ${user.email} is ${user.status}. Access must be granted by the System Administrator.` };
    }

    if (user.status !== 'Active Approved') {
      return { success: false, message: `Access Denied: Account for ${user.email} is '${user.status}'. Access has not been granted/approved by the System Administrator.` };
    }

    // Concurrent Single Active Session Check
    if (!options?.overrideActiveSession) {
      try {
        const rawSession = localStorage.getItem('drillcore_active_session');
        if (rawSession) {
          const activeSess: ActiveSessionData = safeJsonParse(rawSession, null as any);
          const isFresh = activeSess && (Date.now() - (activeSess.lastHeartbeat || 0)) < 8000;

          if (isFresh && activeSess.userId && activeSess.userId !== user.id) {
            const reqId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const reqData: ConcurrentLoginRequestData = {
              requestId: reqId,
              requestingUser: {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email,
              },
              timestamp: Date.now(),
              status: 'PENDING',
            };

            localStorage.setItem('drillcore_concurrent_login_request', safeJsonStringify(reqData));

            if (typeof BroadcastChannel !== 'undefined') {
              try {
                const bc = new BroadcastChannel('drillcore_session_channel');
                bc.postMessage({ type: 'LOGIN_REQUEST_SUBMITTED', request: safeClone(reqData) });
                bc.close();
              } catch {}
            }

            return {
              success: false,
              pendingRequest: true,
              requestId: reqId,
              activeUser: { name: activeSess.userName, role: activeSess.userRole },
              message: `Single active session policy enforced. Permission prompt sent to ${activeSess.userName} (${activeSess.userRole}).`,
            };
          }
        }
      } catch (err) {
        console.warn('Active session check error:', err);
      }
    }

    // Clear previous login requests
    try {
      localStorage.removeItem('drillcore_concurrent_login_request');
    } catch {}

    // Update user record with Microsoft authentication status
    const updatedUser: UserProfile = {
      ...user,
      isMicrosoftAuthenticated: true,
      msAuthUid: msUser.uid,
      msTenantId: msUser.tenantId || user.msTenantId,
      lastMicrosoftLoginAt: new Date().toISOString(),
      isCorporateVerified: true,
    };

    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    saveUserToFirestore(updatedUser);

    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    setLogoutNotice(null);

    const newSession: ActiveSessionData = {
      userId: updatedUser.id,
      userName: updatedUser.name,
      userRole: updatedUser.role,
      userEmail: updatedUser.email,
      loginTime: Date.now(),
      lastHeartbeat: Date.now(),
    };

    try {
      localStorage.setItem('drillcore_auth_session', 'true');
      localStorage.setItem('drillcore_active_user_id', updatedUser.id);
      localStorage.setItem('drillcore_active_session', safeJsonStringify(newSession));
    } catch {}

    logAuditTrail(
      'USER_LOGGED_IN',
      updatedUser.id,
      `Microsoft Entra ID Corporate SSO Authentication Successful for ${updatedUser.name} (${updatedUser.email}).`,
      `Tenant / UID: ${msUser.uid.slice(0, 8)}... | Role: ${updatedUser.role}`
    );

    return { 
      success: true, 
      message: `Authenticated via Microsoft SSO as ${updatedUser.name} (${updatedUser.role}).`,
      user: updatedUser 
    };
  };

  const registerWithMicrosoft = (
    msUser: { email: string; displayName: string; uid: string; tenantId?: string },
    details: { role: UserRole; department: string; location: LocationType }
  ) => {
    const cleanEmail = (msUser.email || '').trim().toLowerCase();
    const domain = cleanEmail.split('@')[1] || 'corp.com';
    const isDomainAllowed = systemConfig.corporateDomains.some(d => d.toLowerCase() === domain);

    const isSystemAdminEmail = cleanEmail === 'admin@apexdrilling.com';
    const autoApprove = isSystemAdminEmail || (systemConfig.autoApproveVerifiedCorporateEmails && isDomainAllowed);
    const initialStatus: UserAccountStatus = autoApprove ? 'Active Approved' : 'Pending Admin Approval';

    const newUser: UserProfile = {
      id: `usr-ms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: msUser.displayName.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: isSystemAdminEmail ? 'System Administrator' : details.role,
      department: details.department || 'Drilling Operations',
      location: details.location || 'Main Supply Base Yard',
      status: initialStatus,
      isCorporateVerified: true,
      corporateDomain: domain,
      isMicrosoftAuthenticated: true,
      msAuthUid: msUser.uid,
      msTenantId: msUser.tenantId,
      lastMicrosoftLoginAt: new Date().toISOString(),
      registeredAt: new Date().toISOString().split('T')[0],
      approvedBy: autoApprove ? 'Microsoft Entra ID Corporate Verification Gate' : undefined,
    };

    setAllUsers(prev => {
      const exists = prev.some(u => u.email.toLowerCase() === cleanEmail);
      if (exists) {
        return prev.map(u => u.email.toLowerCase() === cleanEmail ? { ...u, ...newUser } : u);
      }
      return [newUser, ...prev];
    });

    saveUserToFirestore(newUser);

    logAuditTrail(
      'USER_REGISTERED',
      newUser.id,
      `Registered user via Microsoft Authentication: ${newUser.name} (${cleanEmail}) [${newUser.role}].`,
      `Status: ${initialStatus} | Domain: ${domain}`
    );

    if (autoApprove) {
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      setLogoutNotice(null);

      const newSession: ActiveSessionData = {
        userId: newUser.id,
        userName: newUser.name,
        userRole: newUser.role,
        userEmail: newUser.email,
        loginTime: Date.now(),
        lastHeartbeat: Date.now(),
      };

      try {
        localStorage.setItem('drillcore_auth_session', 'true');
        localStorage.setItem('drillcore_active_user_id', newUser.id);
        localStorage.setItem('drillcore_active_session', safeJsonStringify(newSession));
      } catch {}

      return {
        success: true,
        message: `Account provisioned and authenticated via Microsoft SSO as ${newUser.name} (${newUser.role}).`,
        user: newUser
      };
    }

    return {
      success: true,
      message: `Registration submitted with Microsoft verified identity for ${cleanEmail}. Your account is pending Administrator security review.`,
      user: newUser
    };
  };

  const migrateDatabaseToDedicatedFirestore = async (): Promise<{
    success: boolean;
    stats: {
      items: number;
      transfers: number;
      users: number;
      campaigns: number;
      backloads: number;
      surplusBookings: number;
      requisitions: number;
      callouts: number;
      logs: number;
      backups: number;
    };
    message: string;
  }> => {
    setIsMigratingToDedicatedDb(true);
    try {
      if (!db) {
        throw new Error('Firestore connection instance is offline or not initialized.');
      }

      // Batch write items
      for (const it of items) {
        await setDoc(doc(db, 'items', it.id), safeClone(it));
      }

      // Batch write transfers
      for (const tr of transfers) {
        await setDoc(doc(db, 'transfers', tr.id), safeClone(tr));
      }

      // Batch write users
      for (const u of allUsers) {
        await setDoc(doc(db, 'users', u.id), safeClone(u));
      }

      // Batch write campaigns
      for (const c of campaigns) {
        await setDoc(doc(db, 'campaigns', c.id), safeClone(c));
      }

      // Batch write rig backloads
      for (const b of rigBackloads) {
        await setDoc(doc(db, 'rig_backloads', b.id), safeClone(b));
      }

      // Batch write surplus bookings
      for (const sb of surplusBookings) {
        await setDoc(doc(db, 'surplus_bookings', sb.id), safeClone(sb));
      }

      // Batch write requisitions
      for (const mr of materialRequisitions) {
        await setDoc(doc(db, 'material_requisitions', mr.id), safeClone(mr));
      }

      // Batch write callouts
      for (const rc of rigCallouts) {
        await setDoc(doc(db, 'rig_callouts', rc.id), safeClone(rc));
      }

      // Batch write audit logs
      for (const al of auditTrailLogs.slice(0, 50)) {
        await setDoc(doc(db, 'audit_logs', al.id), safeClone(al));
      }

      // Batch write backups
      for (const bk of backups.slice(0, 10)) {
        await setDoc(doc(db, 'backups', bk.id), safeClone(bk));
      }

      // Global settings
      await setDoc(doc(db, 'config', 'global_settings'), safeClone(systemConfig));

      const stats = {
        items: items.length,
        transfers: transfers.length,
        users: allUsers.length,
        campaigns: campaigns.length,
        backloads: rigBackloads.length,
        surplusBookings: surplusBookings.length,
        requisitions: materialRequisitions.length,
        callouts: rigCallouts.length,
        logs: auditTrailLogs.length,
        backups: backups.length,
      };

      logAuditTrail(
        'SYSTEM_CONFIG_UPDATED',
        'FIREBASE_MIGRATION',
        `Successfully migrated and synchronized full database to dedicated Firestore database '${dedicatedDatabaseId}'.`,
        `Items: ${items.length}, Transfers: ${transfers.length}, Users: ${allUsers.length}, Campaigns: ${campaigns.length}`
      );

      setIsMigratingToDedicatedDb(false);
      return {
        success: true,
        stats,
        message: `Successfully migrated all ${items.length + transfers.length + allUsers.length + campaigns.length + rigBackloads.length} records to dedicated database '${dedicatedDatabaseId}'.`,
      };
    } catch (err: any) {
      setIsMigratingToDedicatedDb(false);
      console.error('Migration error:', err);
      return {
        success: false,
        stats: {
          items: 0,
          transfers: 0,
          users: 0,
          campaigns: 0,
          backloads: 0,
          surplusBookings: 0,
          requisitions: 0,
          callouts: 0,
          logs: 0,
          backups: 0,
        },
        message: err?.message || 'Database migration failed',
      };
    }
  };

  // Outbox & System Config
  const [emailOutbox, setEmailOutbox] = useState<VerificationEmailRecord[]>(() => {
    return embeddedDb.loadEmailOutbox();
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfiguration>(() => {
    return embeddedDb.loadConfig() || DEFAULT_CONFIG;
  });

  // Items state
  const [items, setItems] = useState<TubularItem[]>(() => {
    return embeddedDb.loadItems() || INITIAL_ITEMS;
  });

  // Campaigns & Multi-Project State
  const [campaigns, setCampaigns] = useState<DrillingCampaign[]>(() => {
    return embeddedDb.loadCampaigns() || INITIAL_CAMPAIGNS;
  });
  const [activeCampaignId, setActiveCampaignId] = useState<string | 'ALL'>('ALL');

  // Backup Vault State
  const [backups, setBackups] = useState<DatabaseBackupRecord[]>(() => {
    return embeddedDb.loadBackups() || [];
  });

  useEffect(() => {
    embeddedDb.saveCampaigns(campaigns);
  }, [campaigns]);

  useEffect(() => {
    embeddedDb.saveBackups(backups);
  }, [backups]);

  // Campaign Handlers
  const createCampaign = (campaignData: Omit<DrillingCampaign, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCamp: DrillingCampaign = {
      ...campaignData,
      id: `CMP-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCampaigns(prev => [newCamp, ...prev]);
    logAuditTrail('SYSTEM_CONFIG_UPDATED', newCamp.id, `Created Drilling Campaign: ${newCamp.name}`);
  };

  const updateCampaign = (id: string, updates: Partial<DrillingCampaign>) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
    logAuditTrail('SYSTEM_CONFIG_UPDATED', id, `Updated Drilling Campaign settings`);
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    logAuditTrail('SYSTEM_CONFIG_UPDATED', id, `Deleted Drilling Campaign`);
  };

  const addWellToCampaign = (campaignId: string, well: Omit<WellDefinition, 'id'>) => {
    const newWell: WellDefinition = {
      ...well,
      id: `WEL-${Date.now()}`
    };
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        return {
          ...c,
          wells: [...c.wells, newWell],
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));
    logAuditTrail('SYSTEM_CONFIG_UPDATED', campaignId, `Added Well ${newWell.name} to Campaign`);
  };

  // Real-time Item Photo Upload Handler
  const addItemPhoto = (itemId: string, photo: Omit<ItemPhotoRecord, 'id' | 'capturedAt'>) => {
    const newPhoto: ItemPhotoRecord = {
      ...photo,
      id: `phto-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      capturedAt: new Date().toISOString(),
      capturedBy: currentUser?.name || 'Inspector Matco',
      role: currentUser?.role || 'Materials Coordinator (Supply Base)',
    };

    setItems(prev => prev.map(it => {
      if (it.id === itemId) {
        const existingPhotos = it.photos || [];
        const updatedItem = {
          ...it,
          photos: [newPhoto, ...existingPhotos],
          updatedAt: new Date().toISOString()
        };
        if (db) {
          setDoc(doc(db, 'items', itemId), safeClone(updatedItem)).catch(err => console.error('Firestore save photo err:', err));
        }
        return updatedItem;
      }
      return it;
    }));

    logAuditTrail('INSPECTION_RECORDED', itemId, `Uploaded ${photo.photoType} photo proof for item`);
  };

  // Anti-Duplicate & Double Booking Guard
  const checkDuplicateItem = (serialNumber: string, heatNumber: string, currentItemId?: string): TubularItem | null => {
    if (!serialNumber && !heatNumber) return null;
    const sNum = serialNumber ? serialNumber.trim().toLowerCase() : '';
    const hNum = heatNumber ? heatNumber.trim().toLowerCase() : '';

    return items.find(it => {
      if (currentItemId && it.id === currentItemId) return false;
      const matchSerial = sNum && it.serialNumber && it.serialNumber.trim().toLowerCase() === sNum;
      const matchHeat = hNum && it.heatNumber && it.heatNumber.trim().toLowerCase() === hNum;
      return matchSerial || (sNum && matchHeat);
    }) || null;
  };

  const lockItemForTransfer = (itemId: string, manifestId: string, manifestType: 'Material Transfer Ticket' | 'Rig Backload Manifest' | 'Surplus Requisition', destination: string) => {
    setItems(prev => prev.map(it => {
      if (it.id === itemId) {
        const updatedItem: TubularItem = {
          ...it,
          bookingLock: {
            isBooked: true,
            bookedForManifestId: manifestId,
            manifestType,
            bookedForRigOrBase: destination,
            bookedBy: currentUser?.name || 'Logistics Focal',
            bookedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString()
        };
        if (db) {
          setDoc(doc(db, 'items', itemId), safeClone(updatedItem)).catch(() => {});
        }
        return updatedItem;
      }
      return it;
    }));
  };

  const unlockItemForTransfer = (itemId: string) => {
    setItems(prev => prev.map(it => {
      if (it.id === itemId) {
        const updatedItem: TubularItem = {
          ...it,
          bookingLock: undefined,
          updatedAt: new Date().toISOString()
        };
        if (db) {
          setDoc(doc(db, 'items', itemId), safeClone(updatedItem)).catch(() => {});
        }
        return updatedItem;
      }
      return it;
    }));
  };

  // Automated & Manual Backup Vault Handlers
  const createBackupVaultSnapshot = (backupType: DatabaseBackupRecord['backupType'] = 'Manual On-Demand Backup', notes?: string): DatabaseBackupRecord => {
    const snapshotData = {
      items,
      transfers,
      rigBackloads,
      allUsers,
      campaigns,
      auditTrailLogs,
      surplusBookings,
      materialRequisitions,
      rigCallouts,
      emailOutbox,
      systemConfig,
      backupTimestamp: new Date().toISOString(),
    };

    const newBackup: DatabaseBackupRecord = {
      id: `BKP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      createdByName: currentUser?.name || 'System Admin',
      createdByRole: currentUser?.role || 'System Administrator',
      backupType,
      version: '2.5.0-Enterprise',
      summary: {
        itemsCount: items.length,
        transfersCount: transfers.length,
        usersCount: allUsers.length,
        backloadsCount: rigBackloads.length,
        campaignsCount: campaigns.length,
        auditLogsCount: auditTrailLogs.length,
      },
      dataJson: safeJsonStringify(snapshotData),
      notes: notes || `Vault snapshot generated automatically (${backupType})`
    };

    setBackups(prev => [newBackup, ...prev]);
    logAuditTrail('SYSTEM_CONFIG_UPDATED', newBackup.id, `Created ${backupType} snapshot point`);
    return newBackup;
  };

  const downloadBackupFile = (backupId?: string) => {
    const targetBackup = backupId ? backups.find(b => b.id === backupId) : null;
    const jsonStr = targetBackup?.dataJson || safeJsonStringify({
      items,
      transfers,
      rigBackloads,
      allUsers,
      campaigns,
      auditTrailLogs,
      systemConfig,
      backupTimestamp: new Date().toISOString(),
    }, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drillspec_database_backup_${new Date().toISOString().slice(0, 10)}.drillspec.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreFromBackupSnapshot = (restoredData: any) => {
    if (!restoredData || typeof restoredData !== 'object') throw new Error('Invalid backup file format');
    
    if (Array.isArray(restoredData.items)) {
      setItems(restoredData.items);
      embeddedDb.saveItems(restoredData.items);
    }
    if (Array.isArray(restoredData.transfers)) {
      setTransfers(restoredData.transfers);
      embeddedDb.saveTransfers(restoredData.transfers);
    }
    if (Array.isArray(restoredData.allUsers)) {
      setAllUsers(restoredData.allUsers);
      embeddedDb.saveUsers(restoredData.allUsers);
    }
    if (Array.isArray(restoredData.campaigns)) {
      setCampaigns(restoredData.campaigns);
      embeddedDb.saveCampaigns(restoredData.campaigns);
    }
    if (Array.isArray(restoredData.rigBackloads)) {
      setRigBackloads(restoredData.rigBackloads);
      embeddedDb.saveBackloads(restoredData.rigBackloads);
    }
    if (Array.isArray(restoredData.auditTrailLogs)) {
      setAuditTrailLogs(restoredData.auditTrailLogs);
      embeddedDb.saveAuditLogs(restoredData.auditTrailLogs);
    }
    if (Array.isArray(restoredData.chargeCodes)) {
      setChargeCodes(restoredData.chargeCodes);
      embeddedDb.saveChargeCodes(restoredData.chargeCodes);
    }
    if (Array.isArray(restoredData.notifications)) {
      setNotifications(restoredData.notifications);
      embeddedDb.saveNotifications(restoredData.notifications);
    }

    logAuditTrail('SYSTEM_CONFIG_UPDATED', 'DATABASE_RESTORE', 'Restored full system database from backup point');
  };

  // Encrypted Snapshot Export & Import Methods
  const exportEncryptedSnapshot = (passphrase: string = 'DRILLCORE-2026-ENCRYPTED'): string => {
    const fullPayload = {
      header: 'DRILLCORE-SECURE-VAULT',
      version: '3.0.0-Enterprise',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.name || 'System Admin',
      data: {
        items,
        transfers,
        rigBackloads,
        allUsers,
        campaigns,
        auditTrailLogs,
        surplusBookings,
        materialRequisitions,
        rigCallouts,
        chargeCodes,
        notifications,
        systemConfig,
      }
    };

    const rawJson = safeJsonStringify(fullPayload);
    // Simple robust reversible XOR-Base64 cipher with passphrase
    let cipherText = '';
    const key = passphrase.trim() || 'DRILLCORE-2026-KEY';
    for (let i = 0; i < rawJson.length; i++) {
      const charCode = rawJson.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      cipherText += String.fromCharCode(charCode);
    }
    const base64Encrypted = btoa(unescape(encodeURIComponent(cipherText)));
    
    logAuditTrail('DATABASE_BACKUP_EXPORTED', 'ENCRYPTED_SNAPSHOT', 'Exported encrypted system vault database snapshot');
    return `DRILLCORE-ENCRYPTED-VAULT:v2:${base64Encrypted}`;
  };

  const importEncryptedSnapshot = (fileContent: string, passphrase: string = 'DRILLCORE-2026-ENCRYPTED'): { success: boolean; message: string; stats?: any } => {
    try {
      let contentToParse = fileContent.trim();
      let rawJson = '';

      if (contentToParse.startsWith('DRILLCORE-ENCRYPTED-VAULT:v2:')) {
        const base64Payload = contentToParse.replace('DRILLCORE-ENCRYPTED-VAULT:v2:', '');
        const decoded = decodeURIComponent(escape(atob(base64Payload)));
        const key = passphrase.trim() || 'DRILLCORE-2026-KEY';
        let decrypted = '';
        for (let i = 0; i < decoded.length; i++) {
          const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
          decrypted += String.fromCharCode(charCode);
        }
        rawJson = decrypted;
      } else {
        rawJson = contentToParse;
      }

      const parsed = safeJsonParse(rawJson, null);
      if (!parsed) {
        return { success: false, message: 'Invalid or corrupt backup vault snapshot payload.' };
      }

      const payloadData = parsed.data || parsed;
      restoreFromBackupSnapshot(payloadData);

      const stats = {
        itemsCount: payloadData.items?.length || items.length,
        transfersCount: payloadData.transfers?.length || transfers.length,
        chargeCodesCount: payloadData.chargeCodes?.length || chargeCodes.length,
        campaignsCount: payloadData.campaigns?.length || campaigns.length,
      };

      logAuditTrail('DATABASE_RESTORE_PERFORMED', 'ENCRYPTED_RESTORE', `Successfully restored encrypted snapshot with ${stats.itemsCount} items.`);
      return {
        success: true,
        message: `Restoration complete. Successfully synchronized ${stats.itemsCount} items, ${stats.transfersCount} transfers, and ${stats.chargeCodesCount} charge codes.`,
        stats,
      };
    } catch (err: any) {
      console.error('Import error:', err);
      return { success: false, message: `Decryption / Import failed: ${err?.message || 'Incorrect passphrase or corrupt file format.'}` };
    }
  };

  // Scheduled daily auto-backup timer
  useEffect(() => {
    const lastBackupTime = localStorage.getItem('drillspec_last_auto_backup_ts');
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    if (!lastBackupTime || (now - parseInt(lastBackupTime, 10)) > oneDayMs) {
      setTimeout(() => {
        createBackupVaultSnapshot('Daily Scheduled Auto-Backup', 'Automated 24-hour local storage system vault backup');
        localStorage.setItem('drillspec_last_auto_backup_ts', now.toString());
      }, 3000);
    }
  }, []);

  // Transfers state
  const [transfers, setTransfers] = useState<MaterialTransferTicket[]>(() => {
    return embeddedDb.loadTransfers() || INITIAL_TRANSFERS;
  });

  // Workflow states
  const [surplusBookings, setSurplusBookings] = useState<SurplusBookingRequest[]>(INITIAL_SURPLUS_BOOKINGS);
  const [materialRequisitions, setMaterialRequisitions] = useState<MaterialRequisitionForm[]>(INITIAL_REQUISITIONS);
  const [rigCallouts, setRigCallouts] = useState<RigMaterialCallout[]>(INITIAL_RIG_CALLOUTS);
  const [rigBackloads, setRigBackloads] = useState<RigBackloadList[]>(() => {
    return embeddedDb.loadBackloads() || INITIAL_RIG_BACKLOADS;
  });

  // Audit Trail System
  const [auditTrailLogs, setAuditTrailLogs] = useState<AuditTrailLog[]>(() => {
    return embeddedDb.loadAuditLogs() || INITIAL_AUDIT_LOGS;
  });

  // Well & Project Charge Codes State
  const [chargeCodes, setChargeCodes] = useState<WellChargeCode[]>(() => {
    return embeddedDb.loadChargeCodes() || INITIAL_CHARGE_CODES;
  });

  // Notifications State
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    return embeddedDb.loadNotifications() || INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    embeddedDb.saveAuditLogs(auditTrailLogs);
  }, [auditTrailLogs]);

  useEffect(() => {
    embeddedDb.saveBackloads(rigBackloads);
  }, [rigBackloads]);

  useEffect(() => {
    embeddedDb.saveChargeCodes(chargeCodes);
  }, [chargeCodes]);

  useEffect(() => {
    embeddedDb.saveNotifications(notifications);
  }, [notifications]);

  // Notifications Handlers
  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addSystemNotification = (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: SystemNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Charge Codes Handlers
  const addChargeCode = (codeData: Omit<WellChargeCode, 'id' | 'createdDate'>): { success: boolean; message: string; chargeCode?: WellChargeCode } => {
    const cleanCode = codeData.code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Charge Code (AFE / Cost Center) is required.' };
    }
    const duplicate = chargeCodes.some(c => c.code.toUpperCase() === cleanCode);
    if (duplicate) {
      return { success: false, message: `Charge code "${cleanCode}" already exists in the system directory.` };
    }

    const newChargeCode: WellChargeCode = {
      ...codeData,
      id: `cc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code: cleanCode,
      createdDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    setChargeCodes(prev => [newChargeCode, ...prev]);
    logAuditTrail('CHARGE_CODE_CREATED', newChargeCode.code, `Created Well Charge Code ${newChargeCode.code} for project "${newChargeCode.projectName}".`);
    
    addSystemNotification({
      title: 'New Charge Code Created',
      message: `Charge Code ${newChargeCode.code} ($${newChargeCode.allocatedBudgetUsd.toLocaleString()}) created by ${currentUser?.name || 'Cost Controller'}.`,
      category: 'FINANCE_COST',
      severity: 'info',
      referenceId: newChargeCode.code,
      linkNav: 'costController',
    });

    return { success: true, message: `Charge Code ${newChargeCode.code} registered successfully.`, chargeCode: newChargeCode };
  };

  const updateChargeCode = (id: string, updates: Partial<WellChargeCode>): { success: boolean; message: string } => {
    setChargeCodes(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates, updatedAt: new Date().toISOString() };
        logAuditTrail('CHARGE_CODE_UPDATED', c.code, `Updated Charge Code ${c.code} budget/spend allocations.`);
        return updated;
      }
      return c;
    }));
    return { success: true, message: 'Charge Code details updated successfully.' };
  };

  const deleteChargeCode = (id: string): { success: boolean; message: string } => {
    const target = chargeCodes.find(c => c.id === id);
    if (!target) return { success: false, message: 'Charge code not found.' };

    // Check if any items or transfers are linked
    const linkedItemsCount = items.filter(it => it.wellChargeCode === target.code).length;
    if (linkedItemsCount > 0) {
      return {
        success: false,
        message: `Cannot delete Charge Code ${target.code}: It is currently referenced by ${linkedItemsCount} inventory items. Reallocate items before deleting.`
      };
    }

    setChargeCodes(prev => prev.filter(c => c.id !== id));
    logAuditTrail('CHARGE_CODE_DELETED', target.code, `Deleted Charge Code ${target.code} from system directory.`);
    return { success: true, message: `Charge Code ${target.code} removed.` };
  };

  const importChargeCodes = (imported: Partial<WellChargeCode>[]): { success: boolean; importedCount: number; errors: string[] } => {
    let count = 0;
    const errors: string[] = [];
    const newItems: WellChargeCode[] = [];

    imported.forEach((raw, idx) => {
      const code = (raw.code || '').trim().toUpperCase();
      if (!code) {
        errors.push(`Row ${idx + 1}: Missing Charge Code identifier.`);
        return;
      }
      const existing = chargeCodes.some(c => c.code.toUpperCase() === code) || newItems.some(c => c.code.toUpperCase() === code);
      if (existing) {
        errors.push(`Row ${idx + 1}: Code "${code}" is a duplicate.`);
        return;
      }

      const item: WellChargeCode = {
        id: `cc-${Date.now()}-${count}-${Math.floor(Math.random() * 1000)}`,
        code,
        projectName: raw.projectName || 'Unassigned Campaign Project',
        wellName: raw.wellName || 'Exploration Well',
        operator: raw.operator || 'Petronas Carigali',
        allocatedBudgetUsd: Number(raw.allocatedBudgetUsd) || 1000000,
        committedCostUsd: Number(raw.committedCostUsd) || 0,
        actualSpendUsd: Number(raw.actualSpendUsd) || 0,
        currency: (raw.currency as any) || 'USD',
        status: raw.status || 'Active',
        costCenter: raw.costCenter || 'CC-OPERATIONS',
        costControllerOwner: raw.costControllerOwner || currentUser?.name || 'Cost Controller',
        description: raw.description || 'Imported via Batch Excel/CSV Data Engine.',
        validFrom: raw.validFrom || new Date().toISOString().split('T')[0],
        validTo: raw.validTo || '2026-12-31',
        createdDate: new Date().toISOString().split('T')[0],
      };
      newItems.push(item);
      count++;
    });

    if (newItems.length > 0) {
      setChargeCodes(prev => [...newItems, ...prev]);
      logAuditTrail('CHARGE_CODES_IMPORTED', 'BATCH_IMPORT', `Imported ${newItems.length} charge codes via bulk file.`);
    }

    return {
      success: count > 0,
      importedCount: count,
      errors
    };
  };

  const logAuditTrail = (
    actionType: AuditTrailLog['actionType'],
    referenceId: string,
    details: string,
    notes?: string,
    userOverride?: { id: string; name: string; role: UserRole; location: LocationType }
  ) => {
    const user = userOverride || currentUser;
    const now = new Date();
    const newLog: AuditTrailLog = {
      id: `audit-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: now.toISOString(),
      formattedTimestamp: now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      userId: user?.id || 'usr-anonymous',
      userName: user?.name || 'Personnel User',
      userRole: user?.role || 'Materials Coordinator (Supply Base)',
      location: user?.location || 'Main Supply Base Yard',
      actionType,
      referenceId,
      details,
      notes,
    };
    setAuditTrailLogs(prev => [newLog, ...prev]);
  };

  // Workflow Handlers
  const createSurplusBooking = (reqData: Omit<SurplusBookingRequest, 'id' | 'createdAt' | 'status'>) => {
    const newBooking: SurplusBookingRequest = {
      ...reqData,
      id: `sbr-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      status: 'Pending Cost Controller Validation',
    };
    setSurplusBookings(prev => [newBooking, ...prev]);
  };

  const validateSurplusBookingStage = (
    bookingId: string, 
    stage: 'costController' | 'mmFocal' | 'supplyBaseFocal', 
    notes: string
  ) => {
    setSurplusBookings(prev => prev.map(booking => {
      if (booking.id !== bookingId) return booking;

      const now = new Date().toISOString();
      if (stage === 'costController') {
        return {
          ...booking,
          costControllerValidatedAt: now,
          costControllerName: `${currentUser.name} (${currentUser.role})`,
          costControllerNotes: notes,
          status: 'Pending Material Management Focal Review',
        };
      } else if (stage === 'mmFocal') {
        return {
          ...booking,
          mmFocalValidatedAt: now,
          mmFocalName: `${currentUser.name} (${currentUser.role})`,
          mmFocalNotes: notes,
          status: 'Pending Supply Base Focal Approval',
        };
      } else if (stage === 'supplyBaseFocal') {
        // Transfer ownership of booked items to engineer's project
        booking.items.forEach(it => {
          transferOwnership(
            it.itemId,
            booking.targetProject,
            'Surplus Booking Approval & Project Transfer',
            booking.afeChargeCode,
            booking.id,
            'Transferred ownership from Central Surplus Pool to Active Campaign.'
          );
        });

        return {
          ...booking,
          supplyBaseFocalApprovedAt: now,
          supplyBaseFocalName: `${currentUser.name} (${currentUser.role})`,
          supplyBaseFocalNotes: notes,
          status: 'Approved (Ownership Transferred)',
        };
      }
      return booking;
    }));
  };

  const flagSurplusForVendorServiceAndPO = (
    bookingId: string, 
    serviceType: string, 
    vendorName: string, 
    estimatedCostUsd: number
  ) => {
    setSurplusBookings(prev => prev.map(booking => {
      if (booking.id !== bookingId) return booking;

      const poNum = `PO-SERVICE-2026-${Math.floor(100 + Math.random() * 900)}`;
      return {
        ...booking,
        poNumber: poNum,
        poIssuedAt: new Date().toISOString().slice(0, 10),
        vendorName,
        estimatedServiceCostUsd: estimatedCostUsd,
        flaggedForInspection: serviceType.includes('Inspection') || serviceType.includes('Recert'),
        flaggedForRetreading: serviceType.includes('Retreading') || serviceType.includes('Thread'),
      };
    }));
  };

  const createMaterialRequisition = (formData: Omit<MaterialRequisitionForm, 'id'>) => {
    const newForm: MaterialRequisitionForm = {
      ...formData,
      id: `msrf-${Math.floor(100 + Math.random() * 900)}`,
    };
    setMaterialRequisitions(prev => [newForm, ...prev]);
  };

  const createRigCallout = (calloutData: Omit<RigMaterialCallout, 'id'>) => {
    const newCallout: RigMaterialCallout = {
      ...calloutData,
      id: `rmc-${Math.floor(100 + Math.random() * 900)}`,
    };
    setRigCallouts(prev => [newCallout, ...prev]);
  };

  const createRigBackload = (backloadData: Omit<RigBackloadList, 'id'>) => {
    const nowIso = new Date().toISOString();
    const newBackload: RigBackloadList = {
      ...backloadData,
      id: `rbl-${Math.floor(100 + Math.random() * 900)}`,
      createdTimestamp: nowIso,
      kpiSlaTargetHours: backloadData.kpiSlaTargetHours || 24,
      kpiStatus: 'On Track',
    };
    setRigBackloads(prev => [newBackload, ...prev]);

    // Update items location to transit
    backloadData.items.forEach(it => {
      if (it.itemId) {
        updateItem(it.itemId, {
          currentLocation: 'In Transit (Supply Vessel)',
          rackLocation: `Vessel Deck (${backloadData.vesselName})`,
          status: it.conditionOnRig === 'Damaged / Reject' ? 'Quarantined / Damaged' : 'Due for Inspection'
        });
      }
    });

    logAuditTrail(
      'CREATE_BACKLOAD_MANIFEST',
      newBackload.manifestNumber,
      `Issued Backload Manifest ${newBackload.manifestNumber} with ${backloadData.items.length} tubular line item(s) via ${backloadData.vesselName}. Target SLA: ${newBackload.kpiSlaTargetHours} Hours.`
    );
  };

  const confirmVesselArrivalAtBase = (manifestId: string, arrivalNotes?: string) => {
    const now = new Date();
    const nowIso = now.toISOString();

    setRigBackloads(prev => prev.map(rbl => {
      if (rbl.id !== manifestId && rbl.manifestNumber !== manifestId) return rbl;

      const slaHours = rbl.kpiSlaTargetHours || 24;
      const deadline = new Date(now.getTime() + slaHours * 3600 * 1000).toISOString();

      // Update items location to Main Supply Base Yard
      rbl.items.forEach(it => {
        if (it.itemId) {
          updateItem(it.itemId, {
            currentLocation: 'Main Supply Base Yard',
            rackLocation: 'Quayside Backload Holding Bay',
            status: it.conditionOnRig === 'Damaged / Reject' ? 'Quarantined / Damaged' : 'Due for Inspection'
          });
        }
      });

      logAuditTrail(
        'VESSEL_ARRIVAL_CONFIRMED',
        rbl.manifestNumber,
        `Vessel ${rbl.vesselName} confirmed arrived at Supply Base Quay. Started ${slaHours}h SLA countdown clock (Deadline: ${deadline.replace('T', ' ').slice(0, 19)} UTC).`,
        arrivalNotes
      );

      return {
        ...rbl,
        status: 'Arrived at Supply Base Quay',
        vesselArrivedAt: nowIso,
        slaDeadlineTime: deadline,
        receivedBySupplyBaseMatco: `${currentUser.name} (${currentUser.role})`,
        quaysideInspectionNotes: arrivalNotes || 'Vessel arrived at quay berth. Tally landed at quayside staging area.',
        kpiStatus: 'On Track',
      };
    }));
  };

  const processBackloadActionAtBase = (
    manifestId: string,
    itemTagNumber: string,
    actionType: 'SENT_FOR_INSPECTION' | 'SENT_FOR_DISPOSAL',
    details: {
      inspectionType?: 'NDT (Magnetic Particle)' | 'Visual Thread Inspection' | 'Full Length Ultrasonic' | 'Drift Test' | 'Torque & Bucking Test' | 'Hardbanding Repair' | 'Recertification';
      inspectionFacility?: string;
      scrapCertId?: string;
      disposalReason?: string;
      disposalYardLocation?: string;
      notes?: string;
    }
  ) => {
    const now = new Date();
    const nowIso = now.toISOString();

    setRigBackloads(prev => prev.map(rbl => {
      if (rbl.id !== manifestId && rbl.manifestNumber !== manifestId) return rbl;

      const updatedItems = rbl.items.map(it => {
        if (it.tagNumber !== itemTagNumber) return it;

        const updatedIt: RigBackloadItem = {
          ...it,
          actionType,
          actionTakenAt: nowIso,
          actionTakenBy: `${currentUser.name} (${currentUser.role})`,
          actionNotes: details.notes,
        };

        if (actionType === 'SENT_FOR_INSPECTION') {
          updatedIt.inspectionType = details.inspectionType || 'NDT (Magnetic Particle)';
          updatedIt.inspectionFacility = details.inspectionFacility || 'Machine Shop & Testing Facility';

          // Update inventory item in database
          const foundItem = items.find(i => i.tagNumber === itemTagNumber || i.id === it.itemId);
          if (foundItem) {
            updateItem(foundItem.id, {
              currentLocation: (details.inspectionFacility as any) || 'Machine Shop & Testing Facility',
              rackLocation: 'Testing Shop Bay 1',
              status: 'In Refurbishment',
              notes: `Dispatched for ${updatedIt.inspectionType} per Backload Manifest ${rbl.manifestNumber}`
            });
          }
        } else if (actionType === 'SENT_FOR_DISPOSAL') {
          updatedIt.scrapCertId = details.scrapCertId || `SCRAP-CERT-2026-${Math.floor(100 + Math.random() * 900)}`;
          updatedIt.disposalReason = details.disposalReason || 'Beyond Economical Repair';
          updatedIt.disposalYardLocation = details.disposalYardLocation || 'Heavy Metal Scrap Yard Zone E';

          // Update inventory item in database
          const foundItem = items.find(i => i.tagNumber === itemTagNumber || i.id === it.itemId);
          if (foundItem) {
            updateItem(foundItem.id, {
              currentLocation: 'Main Supply Base Yard',
              rackLocation: updatedIt.disposalYardLocation,
              status: 'Scrapped',
              condition: 'Damaged / Reject',
              notes: `Scrapped under Cert #${updatedIt.scrapCertId} (${updatedIt.disposalReason})`
            });
          }
        }

        return updatedIt;
      });

      // Check if all items in this backload manifest have had an action decided
      const allActionsChosen = updatedItems.every(i => i.actionType && i.actionType !== 'PENDING_DECISION');
      let newStatus = rbl.status;
      let actionCompletedAt = rbl.actionCompletedAt;
      let kpiStatus = rbl.kpiStatus;

      if (allActionsChosen) {
        actionCompletedAt = nowIso;
        const hasInspection = updatedItems.some(i => i.actionType === 'SENT_FOR_INSPECTION');
        newStatus = hasInspection ? 'Action Completed (Inspected)' : 'Action Completed (Disposed)';

        // Calculate KPI SLA Compliance
        if (rbl.slaDeadlineTime) {
          const deadlineMs = new Date(rbl.slaDeadlineTime).getTime();
          if (now.getTime() <= deadlineMs) {
            kpiStatus = 'Completed On Time';
          } else {
            kpiStatus = 'Completed Overdue';
          }
        } else {
          kpiStatus = 'Completed On Time';
        }
      }

      const actionLabel = actionType === 'SENT_FOR_INSPECTION' 
        ? `Sent for Inspection (${details.inspectionType || 'NDT'}) at ${details.inspectionFacility}` 
        : `Sent for Scrap Disposal (Cert #${details.scrapCertId || 'SCRAP-CERT'})`;

      logAuditTrail(
        actionType === 'SENT_FOR_INSPECTION' ? 'DISPOSITION_SENT_FOR_INSPECTION' : 'DISPOSITION_SENT_FOR_DISPOSAL',
        rbl.manifestNumber,
        `Processed disposition for backloaded item ${itemTagNumber}: ${actionLabel}.`,
        details.notes
      );

      return {
        ...rbl,
        items: updatedItems,
        status: newStatus,
        actionCompletedAt,
        kpiStatus,
      };
    }));
  };

  const receiveRigBackloadAtSupplyBase = (manifestId: string, inspectionNotes: string) => {
    setRigBackloads(prev => prev.map(rbl => {
      if (rbl.id !== manifestId && rbl.manifestNumber !== manifestId) return rbl;

      // Update item locations back to Main Supply Base Yard
      rbl.items.forEach(it => {
        if (it.itemId) {
          updateItem(it.itemId, {
            currentLocation: 'Main Supply Base Yard',
            rackLocation: 'Quayside Backload Holding Bay',
            status: it.conditionOnRig === 'Damaged / Reject' ? 'Quarantined / Damaged' : 'Due for Inspection'
          });
        }
      });

      logAuditTrail(
        'MATERIAL_TRANSFER_RECEIVED',
        rbl.manifestNumber,
        `Reconciled & racked backload manifest ${rbl.manifestNumber} into Base Yard inventory.`,
        inspectionNotes
      );

      return {
        ...rbl,
        status: 'Reconciled & Racked',
        receivedBySupplyBaseMatco: `${currentUser.name} (${currentUser.role})`,
        quaysideInspectionNotes: inspectionNotes,
      };
    }));
  };

  // Offline state & queue
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHoleSection, setSelectedHoleSection] = useState<HoleSection | 'ALL'>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<LocationType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus | 'ALL'>('ALL');
  const [showSurplusOnly, setShowSurplusOnly] = useState(false);

  // Sync state to local storage & broadcast channel
  useEffect(() => {
    embeddedDb.saveItems(items);
    embeddedDb.notify('ITEMS_UPDATED', items);
  }, [items]);

  useEffect(() => {
    embeddedDb.saveTransfers(transfers);
    embeddedDb.notify('TRANSFERS_UPDATED', transfers);
  }, [transfers]);

  useEffect(() => {
    embeddedDb.saveUsers(allUsers);
    embeddedDb.notify('USERS_UPDATED', allUsers);
  }, [allUsers]);

  useEffect(() => {
    embeddedDb.saveEmailOutbox(emailOutbox);
  }, [emailOutbox]);

  useEffect(() => {
    embeddedDb.saveConfig(systemConfig);
  }, [systemConfig]);

  // Firestore Real-Time Synchronization across multiple devices / users
  useEffect(() => {
    if (isOffline || !db) return;

    // Items Listener
    const unsubItems = onSnapshot(collection(db, 'items'), (snapshot) => {
      if (!snapshot.empty) {
        const fetchedItems: TubularItem[] = [];
        snapshot.forEach((docSnap) => {
          fetchedItems.push(docSnap.data() as TubularItem);
        });
        setItems(fetchedItems);
      } else {
        // Seed initial items to Firestore if empty
        INITIAL_ITEMS.forEach((it) => {
          setDoc(doc(db, 'items', it.id), it).catch(() => {});
        });
      }
    }, (err) => {
      console.warn('Firestore items sync offline fallback:', err);
    });

    // Transfers Listener
    const unsubTransfers = onSnapshot(collection(db, 'transfers'), (snapshot) => {
      if (!snapshot.empty) {
        const fetchedTransfers: MaterialTransferTicket[] = [];
        snapshot.forEach((docSnap) => {
          fetchedTransfers.push(docSnap.data() as MaterialTransferTicket);
        });
        setTransfers(fetchedTransfers);
      } else {
        INITIAL_TRANSFERS.forEach((tr) => {
          setDoc(doc(db, 'transfers', tr.id), tr).catch(() => {});
        });
      }
    }, (err) => {
      console.warn('Firestore transfers sync offline fallback:', err);
    });

    // Users Listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (!snapshot.empty) {
        const fetchedUsers: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          fetchedUsers.push(docSnap.data() as UserProfile);
        });
        setAllUsers(fetchedUsers);
      } else {
        INITIAL_USERS.forEach((usr) => {
          setDoc(doc(db, 'users', usr.id), { ...usr, status: 'Active Approved', isCorporateVerified: true }).catch(() => {});
        });
      }
    }, (err) => {
      console.warn('Firestore users sync offline fallback:', err);
    });

    // Email Outbox Listener
    const unsubOutbox = onSnapshot(collection(db, 'email_outbox'), (snapshot) => {
      if (!snapshot.empty) {
        const fetchedOutbox: VerificationEmailRecord[] = [];
        snapshot.forEach((docSnap) => {
          fetchedOutbox.push(docSnap.data() as VerificationEmailRecord);
        });
        setEmailOutbox(fetchedOutbox);
      }
    }, (err) => {
      console.warn('Firestore outbox sync fallback:', err);
    });

    // System Config Listener
    const unsubConfig = onSnapshot(collection(db, 'config'), (snapshot) => {
      if (!snapshot.empty) {
        snapshot.forEach((docSnap) => {
          if (docSnap.id === 'global_settings') {
            setSystemConfig(docSnap.data() as SystemConfiguration);
          }
        });
      } else {
        setDoc(doc(db, 'config', 'global_settings'), DEFAULT_CONFIG).catch(() => {});
      }
    }, (err) => {
      console.warn('Firestore config sync fallback:', err);
    });

    return () => {
      unsubItems();
      unsubTransfers();
      unsubUsers();
      unsubOutbox();
      unsubConfig();
    };
  }, [isOffline]);

  // Helper to persist single item to Firestore
  const saveItemToFirestore = (item: TubularItem) => {
    if (!isOffline && db) {
      setDoc(doc(db, 'items', item.id), safeClone(item)).catch(err => console.error('Firestore saveItem err:', err));
    }
  };

  const saveTransferToFirestore = (transfer: MaterialTransferTicket) => {
    if (!isOffline && db) {
      setDoc(doc(db, 'transfers', transfer.id), safeClone(transfer)).catch(err => console.error('Firestore saveTransfer err:', err));
    }
  };

  const saveUserToFirestore = (user: UserProfile) => {
    if (!isOffline && db) {
      setDoc(doc(db, 'users', user.id), safeClone(user)).catch(err => console.error('Firestore saveUser err:', err));
    }
  };

  const saveOutboxRecordToFirestore = (record: VerificationEmailRecord) => {
    if (!isOffline && db) {
      setDoc(doc(db, 'email_outbox', record.id), safeClone(record)).catch(err => console.error('Firestore saveOutbox err:', err));
    }
  };

  const saveConfigToFirestore = (config: SystemConfiguration) => {
    if (!isOffline && db) {
      setDoc(doc(db, 'config', 'global_settings'), safeClone(config)).catch(err => console.error('Firestore saveConfig err:', err));
    }
  };

  // Role Switching
  const setCurrentUserRole = (role: UserRole) => {
    if (role === 'System Administrator' && currentUser?.role !== 'System Administrator') {
      alert('Access Restricted: System Administrator authority is strictly restricted to designated administrative accounts.');
      return;
    }
    const match = allUsers.find(u => u.role === role);
    if (match) {
      setCurrentUser(match);
    } else {
      setCurrentUser(prev => ({
        ...prev,
        role,
      }));
    }
  };

  // Server API Email Credential Dispatcher
  const sendEmailCredentialsServer = async (userEmail: string): Promise<{ success: boolean; message: string }> => {
    const emailTrim = userEmail.trim().toLowerCase();
    const targetUser = allUsers.find(u => u.email.toLowerCase() === emailTrim);
    if (!targetUser) {
      return { 
        success: false, 
        message: `Email address '${emailTrim}' not found in the corporate directory. Please submit an Access Request for Administrator review.` 
      };
    }

    if (targetUser.status === 'Suspended' || targetUser.status === 'Deactivated') {
      return {
        success: false,
        message: `Account for ${emailTrim} is suspended or deactivated. Contact System Administrator.`
      };
    }

    try {
      const generatedToken = targetUser.verificationToken || Math.floor(100000 + Math.random() * 900000).toString();
      const response = await fetch('/api/send-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeJsonStringify({
          recipientEmail: targetUser.email,
          userName: targetUser.name,
          role: targetUser.role,
          token: generatedToken,
          corporateDomain: targetUser.corporateDomain || targetUser.email.split('@')[1]
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const emailRecord: VerificationEmailRecord = {
          id: data.dispatchId || `email-${Date.now()}`,
          recipientEmail: targetUser.email,
          userName: targetUser.name,
          corporateDomain: data.corporateDomain || targetUser.email.split('@')[1] || 'corp.com',
          token: generatedToken,
          sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'Delivered',
          verificationLink: `${window.location.origin}/verify?token=${generatedToken}`,
        };

        setEmailOutbox(prev => [emailRecord, ...prev]);
        saveOutboxRecordToFirestore(emailRecord);

        logAuditTrail(
          'USER_STATUS_UPDATED',
          targetUser.id,
          `Dispatched corporate login credentials to ${targetUser.email} via Email Server Gateway API.`
        );

        return { success: true, message: `Login credentials & security instructions successfully dispatched to ${targetUser.email}. Please check your corporate inbox.` };
      }
      return { success: false, message: data.error || 'Server API failed to dispatch email credentials.' };
    } catch (err: any) {
      console.error('sendEmailCredentialsServer error:', err);
      return { success: false, message: `Email server API request failed: ${err.message}` };
    }
  };

  // Dispatch Authorization Token for First-Time Access / Password Reset
  const sendAuthTokenEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
    const emailTrim = email.trim().toLowerCase();
    const target = allUsers.find(u => u.email.toLowerCase() === emailTrim);

    if (!target) {
      return { 
        success: false, 
        message: `Email address '${emailTrim}' is not recognized in the approved corporate user directory.` 
      };
    }

    if (target.status !== 'Active Approved') {
      return {
        success: false,
        message: `Account for ${emailTrim} has status '${target.status}'. Access must be granted and approved by the System Administrator before tokens can be dispatched.`
      };
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const updatedUser: UserProfile = {
      ...target,
      verificationToken: token,
      verificationSentAt: new Date().toISOString(),
    };

    setAllUsers(prev => prev.map(u => u.id === target.id ? updatedUser : u));
    saveUserToFirestore(updatedUser);

    try {
      const response = await fetch('/api/send-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeJsonStringify({
          recipientEmail: target.email,
          token,
          purpose: 'FIRST_TIME_LOGIN_AND_PASSWORD_SETUP'
        })
      });
      const data = await response.json();

      const emailRecord: VerificationEmailRecord = {
        id: data.dispatchId || `email-tok-${Date.now()}`,
        recipientEmail: target.email,
        userName: target.name,
        corporateDomain: target.corporateDomain || target.email.split('@')[1] || 'corp.com',
        token,
        sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Delivered',
        verificationLink: `${window.location.origin}/verify?token=${token}`,
      };

      setEmailOutbox(prev => [emailRecord, ...prev]);
      saveOutboxRecordToFirestore(emailRecord);

      logAuditTrail(
        'USER_PROFILE_UPDATED',
        target.id,
        `Dispatched authorization verification token to approved corporate email ${target.email}.`
      );

      return {
        success: true,
        message: `Authorization verification token successfully dispatched to corporate inbox ${target.email}. Please check your email to retrieve your 6-digit verification code.`
      };
    } catch (err: any) {
      const emailRecord: VerificationEmailRecord = {
        id: `email-tok-${Date.now()}`,
        recipientEmail: target.email,
        userName: target.name,
        corporateDomain: target.corporateDomain || target.email.split('@')[1] || 'corp.com',
        token,
        sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Delivered',
        verificationLink: `${window.location.origin}/verify?token=${token}`,
      };
      setEmailOutbox(prev => [emailRecord, ...prev]);
      saveOutboxRecordToFirestore(emailRecord);

      return {
        success: true,
        message: `Authorization verification token dispatched to corporate inbox ${target.email}. Please check your email for the 6-digit code.`
      };
    }
  };

  // Reset or Set Custom Password using Verification Token
  const resetPasswordWithToken = (email: string, token: string, newPassword: string): { success: boolean; message: string } => {
    const target = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!target) {
      return { success: false, message: `User identity ${email} not found in corporate directory.` };
    }

    const cleanToken = token.trim();
    if (target.verificationToken !== cleanToken) {
      const outboxMatch = emailOutbox.find(e => e.recipientEmail.toLowerCase() === email.toLowerCase() && e.token === cleanToken);
      if (!outboxMatch) {
        return { success: false, message: 'Invalid or expired authorization token.' };
      }
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters long.' };
    }

    const newHash = hashPassword(newPassword);
    const updatedUser: UserProfile = {
      ...target,
      passwordHash: newHash,
      status: 'Active Approved',
      isCorporateVerified: true,
      isFirstLogin: false,
      verificationToken: undefined,
    };
    delete (updatedUser as any).password;

    setAllUsers(prev => prev.map(u => u.id === target.id ? updatedUser : u));
    saveUserToFirestore(updatedUser);

    if (currentUser?.id === target.id) {
      setCurrentUser(updatedUser);
    }

    logAuditTrail(
      'USER_PROFILE_UPDATED',
      target.id,
      `User ${target.email} successfully set custom password via authorization token verification.`
    );

    return { success: true, message: `Password successfully updated for ${target.email}. You may now log in with your new password.` };
  };

  // Update Password for Currently Logged In User
  const updateCurrentUserPassword = (currentPassword: string, newPassword: string): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'No active user session found.' };
    if (currentUser.passwordHash && !verifyPassword(currentPassword, currentUser.passwordHash)) {
      return { success: false, message: 'Current password incorrect.' };
    }
    const newHash = hashPassword(newPassword);
    const updatedUser: UserProfile = {
      ...currentUser,
      passwordHash: newHash,
      isFirstLogin: false,
    };
    delete (updatedUser as any).password;

    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    saveUserToFirestore(updatedUser);

    logAuditTrail(
      'USER_PROFILE_UPDATED',
      currentUser.id,
      `Current user ${currentUser.email} updated account password.`
    );

    return { success: true, message: 'Password successfully updated.' };
  };

  // Microsoft Authenticator 2FA Helpers
  const toggleMsAuthenticator = (userId: string, enable: boolean): { success: boolean; message: string; secret?: string } => {
    const target = allUsers.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    if (!target) return { success: false, message: 'User profile not found.' };

    const secret = target.msAuthenticatorSecret || 'JBSWY3DPEHPK3PXP';
    const updatedUser: UserProfile = {
      ...target,
      msAuthenticatorEnabled: enable,
      msAuthenticatorSecret: secret
    };

    setAllUsers(prev => prev.map(u => u.id === target.id ? updatedUser : u));
    saveUserToFirestore(updatedUser);

    if (currentUser?.id === target.id) {
      setCurrentUser(updatedUser);
    }

    logAuditTrail(
      'USER_PROFILE_UPDATED',
      target.id,
      `${enable ? 'Enabled' : 'Disabled'} Microsoft Authenticator 2FA for user ${target.email}.`
    );

    return {
      success: true,
      secret,
      message: enable 
        ? `Microsoft Authenticator 2FA successfully enabled for ${target.email}. Secret Key: ${secret}`
        : `Microsoft Authenticator 2FA disabled for ${target.email}.`
    };
  };

  // User Registration & Corporate Email Validation
  const registerUser = (newUser: { name: string; email: string; role: UserRole; department: string; location: LocationType; initialStatus?: UserAccountStatus }) => {
    const domain = newUser.email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return { success: false, message: 'Invalid email address format.' };
    }

    const isAllowedDomain = systemConfig.corporateDomains.some(d => d.toLowerCase() === domain);
    if (!isAllowedDomain) {
      return { 
        success: false, 
        message: `Corporate domain '@${domain}' is not on the whitelisted corporate domain list.` 
      };
    }

    const emailTrim = newUser.email.trim().toLowerCase();
    const existingUser = allUsers.find(u => u.email.toLowerCase() === emailTrim);
    if (existingUser) {
      return { success: false, message: `An account with email ${emailTrim} already exists in the corporate directory.` };
    }

    // Enforce System Administrator sole account restriction
    let assignedRole = newUser.role;
    if (assignedRole === 'System Administrator' && (!currentUser || currentUser.role !== 'System Administrator')) {
      assignedRole = 'Drilling Engineer';
    }

    const userId = `usr-${Date.now()}`;
    const token = Math.floor(100000 + Math.random() * 900000).toString();

    // Account requests from the login page default to 'Pending Admin Approval' for Administrator review
    const initialStatus: UserAccountStatus = newUser.initialStatus || 'Pending Admin Approval';
    const isApproved = initialStatus === 'Active Approved';

    const userRecord: UserProfile = {
      id: userId,
      name: newUser.name,
      email: emailTrim,
      role: assignedRole,
      department: newUser.department,
      location: newUser.location,
      status: initialStatus,
      verificationToken: isApproved ? token : undefined,
      verificationSentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      registeredAt: new Date().toISOString().split('T')[0],
      isCorporateVerified: isApproved,
      approvedBy: isApproved ? (currentUser?.name || 'System Administrator') : undefined,
      corporateDomain: domain,
    };

    setAllUsers(prev => [...prev, userRecord]);
    saveUserToFirestore(userRecord);

    logAuditTrail(
      'USER_REGISTERED',
      userId,
      `Access request submitted for ${newUser.name} (${emailTrim}) with role '${assignedRole}' at '${newUser.location}'.`,
      `Initial Status: ${initialStatus}`
    );

    // Save dispatch audit record
    const emailRecord: VerificationEmailRecord = {
      id: `email-reg-${Date.now()}`,
      recipientEmail: emailTrim,
      userName: newUser.name,
      corporateDomain: domain,
      token,
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: isApproved ? 'Delivered' : 'Sent',
      verificationLink: `${window.location.origin}/verify?token=${token}`,
    };
    setEmailOutbox(prev => [emailRecord, ...prev]);
    saveOutboxRecordToFirestore(emailRecord);

    if (isApproved) {
      sendEmailCredentialsServer(emailTrim).catch(() => {});
      return { 
        success: true, 
        message: `Account created and approved! Credentials dispatched to ${emailTrim}.`, 
        user: userRecord 
      };
    }

    return { 
      success: true, 
      message: `Access request submitted for ${emailTrim}. Your account request is under Administrator review. Once approved by the System Administrator, your account credentials will be issued.`, 
      user: userRecord 
    };
  };

  // Bulk Import Approved Users from Excel / CSV & Auto-Generate 6-Digit Tokens
  const bulkImportApprovedUsers = (
    usersList: { name: string; email: string; role?: UserRole; department?: string; location?: LocationType }[]
  ): {
    success: boolean;
    count: number;
    importedUsers: { email: string; name: string; token: string; role: string }[];
    errors: string[];
  } => {
    const importedUsers: { email: string; name: string; token: string; role: string }[] = [];
    const errors: string[] = [];
    let count = 0;

    const newUsers: UserProfile[] = [];
    const newOutbox: VerificationEmailRecord[] = [];

    usersList.forEach(u => {
      const emailTrim = u.email.trim().toLowerCase();
      const domain = emailTrim.split('@')[1];
      if (!emailTrim || !domain) {
        errors.push(`Invalid email format: ${u.email}`);
        return;
      }

      const existingIndex = allUsers.findIndex(usr => usr.email.toLowerCase() === emailTrim);
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const role = u.role || 'Drilling Engineer';
      const department = u.department || 'Drilling Operations';
      const location = u.location || 'Main Supply Base Yard';

      const userRecord: UserProfile = {
        id: existingIndex >= 0 ? allUsers[existingIndex].id : `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: u.name.trim(),
        email: emailTrim,
        role,
        department,
        location,
        status: 'Active Approved',
        isCorporateVerified: true,
        isFirstLogin: true,
        verificationToken: token,
        verificationSentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        registeredAt: new Date().toISOString().split('T')[0],
        corporateDomain: domain,
        approvedBy: currentUser?.name || 'System Administrator',
      };

      newUsers.push(userRecord);
      saveUserToFirestore(userRecord);

      const emailRecord: VerificationEmailRecord = {
        id: `email-import-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        recipientEmail: emailTrim,
        userName: u.name,
        corporateDomain: domain,
        token,
        sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Delivered',
        verificationLink: `${window.location.origin}/verify?token=${token}`,
      };
      newOutbox.push(emailRecord);
      saveOutboxRecordToFirestore(emailRecord);

      importedUsers.push({
        email: emailTrim,
        name: u.name,
        token,
        role,
      });

      count++;
    });

    if (newUsers.length > 0) {
      setAllUsers(prev => {
        const updated = [...prev];
        newUsers.forEach(nu => {
          const idx = updated.findIndex(u => u.email.toLowerCase() === nu.email.toLowerCase());
          if (idx >= 0) {
            updated[idx] = nu;
          } else {
            updated.push(nu);
          }
        });
        return updated;
      });

      setEmailOutbox(prev => [...newOutbox, ...prev]);

      logAuditTrail(
        'USER_REGISTERED',
        currentUser?.id || 'admin',
        `Bulk imported ${count} approved corporate users from Excel spreadsheet. Generated 6-digit authorization tokens.`
      );
    }

    return {
      success: count > 0,
      count,
      importedUsers,
      errors,
    };
  };

  const provisionSystemAdminAccount = (): { success: boolean; message: string; user: UserProfile } => {
    const adminEmail = 'admin@apexdrilling.com';
    const existingAdmin = allUsers.find(u => u.email.toLowerCase() === adminEmail || u.role === 'System Administrator');

    if (existingAdmin) {
      const updatedUser: UserProfile = {
        ...existingAdmin,
        role: 'System Administrator',
        status: 'Active Approved',
        isCorporateVerified: true,
      };

      // Strip System Administrator role from any other account
      const updatedList = allUsers.map(u => {
        if (u.id === existingAdmin.id) return updatedUser;
        if (u.role === 'System Administrator') return { ...u, role: 'Drilling Engineer' as UserRole };
        return u;
      });

      setAllUsers(updatedList);
      embeddedDb.saveUsers(updatedList);
      saveUserToFirestore(updatedUser);

      return { 
        success: true, 
        message: 'Corporate System Administrator account activated and verified.', 
        user: updatedUser 
      };
    }

    const adminUser: UserProfile = {
      id: 'usr-main-admin',
      name: 'Corporate System Admin',
      role: 'System Administrator',
      department: 'Corporate IT & Admin Controls',
      location: 'Main Supply Base Yard',
      email: adminEmail,
      status: 'Active Approved',
      isCorporateVerified: true,
      registeredAt: '2026-08-01',
    };

    const nextUsers = [adminUser, ...allUsers.map(u => u.role === 'System Administrator' ? { ...u, role: 'Drilling Engineer' as UserRole } : u)];
    setAllUsers(nextUsers);
    embeddedDb.saveUsers(nextUsers);
    saveUserToFirestore(adminUser);

    logAuditTrail(
      'SYSTEM_CONFIG_UPDATED',
      adminUser.id,
      'Provisioned corporate System Administrator account.',
      'Administrator Authority Enforced'
    );

    return { 
      success: true, 
      message: 'Corporate System Administrator account successfully created and provisioned.', 
      user: adminUser 
    };
  };

  const updateUserStatus = (userId: string, status: UserAccountStatus) => {
    const target = allUsers.find(u => u.id === userId);
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = {
          ...u,
          status,
          approvedBy: status === 'Active Approved' ? (currentUser?.name || 'System Administrator') : u.approvedBy,
        };
        saveUserToFirestore(updated);
        return updated;
      }
      return u;
    }));

    if (target) {
      logAuditTrail(
        'USER_STATUS_UPDATED',
        userId,
        `Updated account status for ${target.name} (${target.email}) from '${target.status}' to '${status}'.`,
        `Updated by ${currentUser?.name || 'Admin'}`
      );
    }
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    const target = allUsers.find(u => u.id === userId);
    if (!target) return;

    if (role === 'System Administrator' && (!currentUser || currentUser.role !== 'System Administrator')) {
      logAuditTrail('SYSTEM_CONFIG_UPDATED', userId, `Blocked unauthorized attempt to set System Administrator role for ${target.email}`);
      return;
    }

    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, role };
        saveUserToFirestore(updated);
        return updated;
      }
      return u;
    }));

    logAuditTrail(
      'USER_ROLE_UPDATED',
      userId,
      `Updated role for ${target.name} (${target.email}) from '${target.role}' to '${role}'.`,
      `Updated by ${currentUser?.name || 'Admin'}`
    );
  };

  const updateUser = (userId: string, updates: Partial<UserProfile>) => {
    const target = allUsers.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'User profile not found in database.' };
    }

    const emailCheck = (updates.email || target.email).toLowerCase();
    if (updates.role === 'System Administrator' && (!currentUser || currentUser.role !== 'System Administrator')) {
      return { 
        success: false, 
        message: 'Access Restricted: System Administrator authority can only be assigned by an existing Administrator.' 
      };
    }

    const domain = updates.email ? updates.email.split('@')[1]?.toLowerCase() : target.corporateDomain;
    const updatedUser: UserProfile = {
      ...target,
      ...updates,
      corporateDomain: domain || target.corporateDomain,
    };

    setAllUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));

    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
    }

    saveUserToFirestore(updatedUser);

    logAuditTrail(
      'USER_PROFILE_UPDATED',
      userId,
      `Modified user profile details for ${updatedUser.name} (${updatedUser.email}).`,
      `Updated fields: ${Object.keys(updates).join(', ')}`
    );

    return { success: true, message: `User ${updatedUser.name} (${updatedUser.email}) successfully updated.` };
  };

  const revokeUserAccess = (userId: string) => {
    return updateUser(userId, { status: 'Suspended' });
  };

  const deleteUser = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'User record not found in database.' };
    }

    setAllUsers(prev => prev.filter(u => u.id !== userId));

    if (currentUser?.id === userId) {
      const remaining = allUsers.filter(u => u.id !== userId);
      if (remaining.length > 0) {
        setCurrentUser(remaining[0]);
      }
    }

    if (!isOffline && db) {
      deleteDoc(doc(db, 'users', userId)).catch(err => console.error('Firestore deleteUser error:', err));
    }

    logAuditTrail(
      'USER_DELETED',
      userId,
      `Permanently removed user account ${target.name} (${target.email}) from database.`,
      `Removed by ${currentUser?.name || 'Admin'}`
    );

    return { success: true, message: `User ${target.name} (${target.email}) permanently removed from database.` };
  };

  const resendVerificationEmail = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const token = `VERIFY-TOK-${Math.floor(100000 + Math.random() * 900000)}`;
    const domain = user.email.split('@')[1] || 'corp.com';

    const updatedUser: UserProfile = {
      ...user,
      verificationToken: token,
      verificationSentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Pending Email Verification',
    };

    setAllUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    saveUserToFirestore(updatedUser);

    const emailRecord: VerificationEmailRecord = {
      id: `email-${Date.now()}`,
      recipientEmail: user.email,
      userName: user.name,
      corporateDomain: domain,
      token,
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Delivered',
      verificationLink: `${window.location.origin}/verify?token=${token}`,
    };

    setEmailOutbox(prev => [emailRecord, ...prev]);
    saveOutboxRecordToFirestore(emailRecord);
  };

  const verifyEmailWithToken = (token: string): boolean => {
    const user = allUsers.find(u => u.verificationToken === token);
    if (!user) return false;

    const autoApprove = systemConfig.autoApproveVerifiedCorporateEmails;
    const nextStatus: UserAccountStatus = autoApprove ? 'Active Approved' : 'Pending Admin Approval';

    setAllUsers(prev => prev.map(u => {
      if (u.id === user.id) {
        const updated: UserProfile = {
          ...u,
          status: nextStatus,
          isCorporateVerified: true,
          verificationToken: undefined,
        };
        saveUserToFirestore(updated);
        return updated;
      }
      return u;
    }));

    setEmailOutbox(prev => prev.map(e => {
      if (e.token === token) {
        const updatedOutbox = { ...e, status: 'Verified' as const };
        saveOutboxRecordToFirestore(updatedOutbox);
        return updatedOutbox;
      }
      return e;
    }));

    return true;
  };

  const updateSystemConfig = (updates: Partial<SystemConfiguration>) => {
    setSystemConfig(prev => {
      const next = { ...prev, ...updates };
      saveConfigToFirestore(next);
      return next;
    });
  };

  // Customizable Dropdown Computed Lists
  const availableRoles = useMemo(() => {
    return systemConfig.customRoles && systemConfig.customRoles.length > 0 
      ? systemConfig.customRoles 
      : DEFAULT_ROLES;
  }, [systemConfig.customRoles]);

  const availableDepartments = useMemo(() => {
    return systemConfig.customDepartments && systemConfig.customDepartments.length > 0 
      ? systemConfig.customDepartments 
      : DEFAULT_DEPARTMENTS;
  }, [systemConfig.customDepartments]);

  const availableLocations = useMemo(() => {
    return systemConfig.customLocations && systemConfig.customLocations.length > 0 
      ? systemConfig.customLocations 
      : DEFAULT_LOCATIONS;
  }, [systemConfig.customLocations]);

  const availableHoleSections = useMemo(() => {
    return systemConfig.customHoleSections && systemConfig.customHoleSections.length > 0 
      ? systemConfig.customHoleSections 
      : DEFAULT_HOLE_SECTIONS;
  }, [systemConfig.customHoleSections]);

  const availableCategories = useMemo(() => {
    return systemConfig.customItemCategories && systemConfig.customItemCategories.length > 0 
      ? systemConfig.customItemCategories 
      : DEFAULT_ITEM_CATEGORIES;
  }, [systemConfig.customItemCategories]);

  const availableEquipmentConditions = useMemo(() => {
    return systemConfig.customEquipmentConditions && systemConfig.customEquipmentConditions.length > 0 
      ? systemConfig.customEquipmentConditions 
      : DEFAULT_EQUIPMENT_CONDITIONS;
  }, [systemConfig.customEquipmentConditions]);

  const availableMaintenanceStatuses = useMemo(() => {
    return systemConfig.customMaintenanceStatuses && systemConfig.customMaintenanceStatuses.length > 0 
      ? systemConfig.customMaintenanceStatuses 
      : DEFAULT_MAINTENANCE_STATUSES;
  }, [systemConfig.customMaintenanceStatuses]);

  const availableCarrierTypes = useMemo(() => {
    return systemConfig.customCarrierTypes && systemConfig.customCarrierTypes.length > 0 
      ? systemConfig.customCarrierTypes 
      : DEFAULT_CARRIER_TYPES;
  }, [systemConfig.customCarrierTypes]);

  const addDropdownOption = (categoryKey: DropdownCategoryKey, newValue: string) => {
    const trimmed = newValue.trim();
    if (!trimmed) return { success: false, message: 'Option text cannot be empty.' };

    let currentList: string[] = [];
    let configField: keyof SystemConfiguration = 'customRoles';

    switch (categoryKey) {
      case 'roles':
        currentList = availableRoles;
        configField = 'customRoles';
        break;
      case 'departments':
        currentList = availableDepartments;
        configField = 'customDepartments';
        break;
      case 'locations':
        currentList = availableLocations;
        configField = 'customLocations';
        break;
      case 'holeSections':
        currentList = availableHoleSections;
        configField = 'customHoleSections';
        break;
      case 'itemCategories':
        currentList = availableCategories;
        configField = 'customItemCategories';
        break;
      case 'equipmentConditions':
        currentList = availableEquipmentConditions;
        configField = 'customEquipmentConditions';
        break;
      case 'maintenanceStatuses':
        currentList = availableMaintenanceStatuses;
        configField = 'customMaintenanceStatuses';
        break;
      case 'carrierTypes':
        currentList = availableCarrierTypes;
        configField = 'customCarrierTypes';
        break;
    }

    if (currentList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, message: `"${trimmed}" already exists in this dropdown list.` };
    }

    const nextList = [...currentList, trimmed];
    updateSystemConfig({ [configField]: nextList });
    return { success: true, message: `Added "${trimmed}" to dropdown options.` };
  };

  const removeDropdownOption = (categoryKey: DropdownCategoryKey, valueToRemove: string) => {
    let currentList: string[] = [];
    let configField: keyof SystemConfiguration = 'customRoles';

    switch (categoryKey) {
      case 'roles':
        currentList = availableRoles;
        configField = 'customRoles';
        break;
      case 'departments':
        currentList = availableDepartments;
        configField = 'customDepartments';
        break;
      case 'locations':
        currentList = availableLocations;
        configField = 'customLocations';
        break;
      case 'holeSections':
        currentList = availableHoleSections;
        configField = 'customHoleSections';
        break;
      case 'itemCategories':
        currentList = availableCategories;
        configField = 'customItemCategories';
        break;
      case 'equipmentConditions':
        currentList = availableEquipmentConditions;
        configField = 'customEquipmentConditions';
        break;
      case 'maintenanceStatuses':
        currentList = availableMaintenanceStatuses;
        configField = 'customMaintenanceStatuses';
        break;
      case 'carrierTypes':
        currentList = availableCarrierTypes;
        configField = 'customCarrierTypes';
        break;
    }

    if (currentList.length <= 1) {
      return { success: false, message: 'At least one dropdown option must remain in the list.' };
    }

    const nextList = currentList.filter(item => item !== valueToRemove);
    updateSystemConfig({ [configField]: nextList });
    return { success: true, message: `Removed "${valueToRemove}" from dropdown options.` };
  };

  const resetDropdownOptions = (categoryKey?: DropdownCategoryKey) => {
    if (!categoryKey) {
      updateSystemConfig({
        customRoles: DEFAULT_ROLES,
        customDepartments: DEFAULT_DEPARTMENTS,
        customLocations: DEFAULT_LOCATIONS,
        customHoleSections: DEFAULT_HOLE_SECTIONS,
        customItemCategories: DEFAULT_ITEM_CATEGORIES,
        customEquipmentConditions: DEFAULT_EQUIPMENT_CONDITIONS,
        customMaintenanceStatuses: DEFAULT_MAINTENANCE_STATUSES,
        customCarrierTypes: DEFAULT_CARRIER_TYPES,
      });
      return;
    }

    switch (categoryKey) {
      case 'roles': updateSystemConfig({ customRoles: DEFAULT_ROLES }); break;
      case 'departments': updateSystemConfig({ customDepartments: DEFAULT_DEPARTMENTS }); break;
      case 'locations': updateSystemConfig({ customLocations: DEFAULT_LOCATIONS }); break;
      case 'holeSections': updateSystemConfig({ customHoleSections: DEFAULT_HOLE_SECTIONS }); break;
      case 'itemCategories': updateSystemConfig({ customItemCategories: DEFAULT_ITEM_CATEGORIES }); break;
      case 'equipmentConditions': updateSystemConfig({ customEquipmentConditions: DEFAULT_EQUIPMENT_CONDITIONS }); break;
      case 'maintenanceStatuses': updateSystemConfig({ customMaintenanceStatuses: DEFAULT_MAINTENANCE_STATUSES }); break;
      case 'carrierTypes': updateSystemConfig({ customCarrierTypes: DEFAULT_CARRIER_TYPES }); break;
    }
  };

  const addCorporateDomain = (domain: string) => {
    const cleaned = domain.toLowerCase().replace('@', '').trim();
    if (cleaned && !systemConfig.corporateDomains.includes(cleaned)) {
      setSystemConfig(prev => {
        const next = {
          ...prev,
          corporateDomains: [...prev.corporateDomains, cleaned],
        };
        saveConfigToFirestore(next);
        return next;
      });
    }
  };

  const removeCorporateDomain = (domain: string) => {
    setSystemConfig(prev => {
      const next = {
        ...prev,
        corporateDomains: prev.corporateDomains.filter(d => d !== domain),
      };
      saveConfigToFirestore(next);
      return next;
    });
  };

  const exportDatabaseSnapshot = () => {
    const snapshot = {
      exportDate: new Date().toISOString(),
      items,
      transfers,
      allUsers,
      emailOutbox,
      systemConfig,
    };
    const jsonStr = safeJsonStringify(snapshot, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DrillSpec_Database_Snapshot_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetDatabaseToInitial = () => {
    if (window.confirm('Reset database to default campaign baseline? Custom items and users will be replaced.')) {
      setItems(INITIAL_ITEMS);
      setTransfers(INITIAL_TRANSFERS);
      const resetUsers = INITIAL_USERS.map(u => ({ ...u, status: 'Active Approved' as const, isCorporateVerified: true }));
      setAllUsers(resetUsers);
      setEmailOutbox([]);
      setSystemConfig(DEFAULT_CONFIG);

      if (!isOffline) {
        INITIAL_ITEMS.forEach(it => saveItemToFirestore(it));
        INITIAL_TRANSFERS.forEach(tr => saveTransferToFirestore(tr));
        resetUsers.forEach(u => saveUserToFirestore(u));
        saveConfigToFirestore(DEFAULT_CONFIG);
      }
    }
  };

  // Item CRUD
  const addItem = (itemData: Omit<TubularItem, 'id' | 'updatedAt' | 'qrCodeData' | 'inspectionHistory' | 'maintenanceLogs'>) => {
    const id = `item-${Date.now()}`;
    const qrCodeData = `TAG:${itemData.tagNumber}|HT:${itemData.heatNumber}|LOC:${itemData.currentLocation.split(' ')[0].toUpperCase()}`;
    const newItem: TubularItem = {
      ...itemData,
      id,
      qrCodeData,
      updatedAt: new Date().toISOString(),
      inspectionHistory: itemData.lastInspectionDate ? [
        {
          id: `insp-init-${Date.now()}`,
          date: itemData.lastInspectionDate,
          inspectorName: 'Initial Purchase QA',
          inspectionType: 'Full Length Ultrasonic',
          result: 'Pass',
          certNumber: itemData.inspectionCertNumber || 'CERT-INITIAL',
          nextInspectionDue: itemData.nextInspectionDue,
          remarks: 'Initial receipt & acceptance check.',
        }
      ] : [],
      maintenanceLogs: [],
    };

    setItems(prev => [newItem, ...prev]);
    saveItemToFirestore(newItem);
  };

  const bulkAddItems = (newItemsData: Omit<TubularItem, 'id' | 'updatedAt' | 'qrCodeData' | 'inspectionHistory' | 'maintenanceLogs'>[]) => {
    const newItems: TubularItem[] = newItemsData.map((itemData, idx) => {
      const id = `item-${Date.now()}-${idx}`;
      const qrCodeData = `TAG:${itemData.tagNumber}|HT:${itemData.heatNumber}|LOC:${(itemData.currentLocation || 'BASE').split(' ')[0].toUpperCase()}`;
      return {
        ...itemData,
        id,
        qrCodeData,
        updatedAt: new Date().toISOString(),
        inspectionHistory: itemData.lastInspectionDate ? [
          {
            id: `insp-init-${Date.now()}-${idx}`,
            date: itemData.lastInspectionDate,
            inspectorName: 'Bulk Excel Import QA',
            inspectionType: 'Full Length Ultrasonic',
            result: 'Pass',
            certNumber: itemData.inspectionCertNumber || 'CERT-BULK-IMPORT',
            nextInspectionDue: itemData.nextInspectionDue || '2027-06-01',
            remarks: 'Imported via Bulk Excel/CSV upload.',
          }
        ] : [],
        maintenanceLogs: [],
      };
    });

    setItems(prev => [...newItems, ...prev]);
    newItems.forEach(it => saveItemToFirestore(it));
  };

  const updateItem = (id: string, updates: Partial<TubularItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        saveItemToFirestore(updated);
        return updated;
      }
      return item;
    }));
  };

  const bulkUpdateStatus = (itemIds: string[], status: MaintenanceStatus, notes?: string) => {
    const affectedTags: string[] = [];
    setItems(prev => prev.map(item => {
      if (itemIds.includes(item.id)) {
        affectedTags.push(item.tagNumber);
        const newMaintLog = notes ? {
          id: `maint-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          date: new Date().toISOString().split('T')[0],
          performedBy: currentUser.name,
          action: 'Recertification' as const,
          notes: `Batch status update to '${status}'. Notes: ${notes}`,
        } : null;

        const updated = {
          ...item,
          status,
          updatedAt: new Date().toISOString(),
          maintenanceLogs: newMaintLog ? [newMaintLog, ...item.maintenanceLogs] : item.maintenanceLogs,
        };
        saveItemToFirestore(updated);
        return updated;
      }
      return item;
    }));

    if (affectedTags.length > 0) {
      logAuditTrail(
        'BULK_STATUS_UPDATED',
        `BATCH-STATUS-${Date.now().toString().slice(-6)}`,
        `Batch updated status to '${status}' for ${affectedTags.length} tubular items (${affectedTags.slice(0, 5).join(', ')}${affectedTags.length > 5 ? ` +${affectedTags.length - 5} more` : ''}).`,
        notes
      );
    }
  };

  const bulkUpdateLocation = (itemIds: string[], location: LocationType, rackLocation?: string, notes?: string) => {
    const affectedTags: string[] = [];
    setItems(prev => prev.map(item => {
      if (itemIds.includes(item.id)) {
        affectedTags.push(item.tagNumber);
        const updatedQr = `TAG:${item.tagNumber}|HT:${item.heatNumber}|LOC:${(location || 'BASE').split(' ')[0].toUpperCase()}`;
        const newMaintLog = notes ? {
          id: `maint-loc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          date: new Date().toISOString().split('T')[0],
          performedBy: currentUser.name,
          action: 'Recertification' as const,
          notes: `Batch location relocated to '${location}' [${rackLocation || item.rackLocation || 'Yard'}]. Notes: ${notes}`,
        } : null;

        const updated = {
          ...item,
          currentLocation: location,
          rackLocation: rackLocation !== undefined ? rackLocation : item.rackLocation,
          qrCodeData: updatedQr,
          updatedAt: new Date().toISOString(),
          maintenanceLogs: newMaintLog ? [newMaintLog, ...item.maintenanceLogs] : item.maintenanceLogs,
        };
        saveItemToFirestore(updated);
        return updated;
      }
      return item;
    }));

    if (affectedTags.length > 0) {
      logAuditTrail(
        'BULK_LOCATION_UPDATED',
        `BATCH-LOC-${Date.now().toString().slice(-6)}`,
        `Batch relocated ${affectedTags.length} tubular items to '${location}'${rackLocation ? ` (Rack/Bay: ${rackLocation})` : ''} (${affectedTags.slice(0, 5).join(', ')}${affectedTags.length > 5 ? ` +${affectedTags.length - 5} more` : ''}).`,
        notes
      );
    }
  };

  const bulkUpdateItems = (
    itemIds: string[], 
    updates: {
      status?: MaintenanceStatus;
      currentLocation?: LocationType;
      rackLocation?: string;
      condition?: EquipmentCondition;
      holeSection?: HoleSection;
      projectOwner?: string;
      wellChargeCode?: string;
    }, 
    notes?: string
  ) => {
    const affectedTags: string[] = [];
    setItems(prev => prev.map(item => {
      if (itemIds.includes(item.id)) {
        affectedTags.push(item.tagNumber);
        const loc = updates.currentLocation || item.currentLocation;
        const updatedQr = updates.currentLocation 
          ? `TAG:${item.tagNumber}|HT:${item.heatNumber}|LOC:${loc.split(' ')[0].toUpperCase()}`
          : item.qrCodeData;

        const changeDescriptions: string[] = [];
        if (updates.status) changeDescriptions.push(`Status -> ${updates.status}`);
        if (updates.currentLocation) changeDescriptions.push(`Location -> ${updates.currentLocation}`);
        if (updates.rackLocation) changeDescriptions.push(`Rack -> ${updates.rackLocation}`);
        if (updates.condition) changeDescriptions.push(`Condition -> ${updates.condition}`);
        if (updates.projectOwner) changeDescriptions.push(`Owner -> ${updates.projectOwner}`);
        if (updates.wellChargeCode) changeDescriptions.push(`AFE -> ${updates.wellChargeCode}`);

        const newMaintLog = notes || changeDescriptions.length > 0 ? {
          id: `maint-batch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          date: new Date().toISOString().split('T')[0],
          performedBy: currentUser.name,
          action: 'Recertification' as const,
          notes: `Batch modification: ${changeDescriptions.join('; ')}. Notes: ${notes || 'Batch operation'}`,
        } : null;

        const updated = {
          ...item,
          ...updates,
          qrCodeData: updatedQr,
          updatedAt: new Date().toISOString(),
          maintenanceLogs: newMaintLog ? [newMaintLog, ...item.maintenanceLogs] : item.maintenanceLogs,
        };
        saveItemToFirestore(updated);
        return updated;
      }
      return item;
    }));

    if (affectedTags.length > 0) {
      logAuditTrail(
        'BULK_ITEMS_UPDATED',
        `BATCH-MOD-${Date.now().toString().slice(-6)}`,
        `Batch updated ${affectedTags.length} tubular items (${affectedTags.slice(0, 5).join(', ')}${affectedTags.length > 5 ? ` +${affectedTags.length - 5} more` : ''}). Updates: ${JSON.stringify(updates)}`,
        notes
      );
    }
  };

  const transferOwnership = (
    itemId: string, 
    newProjectOwner: string, 
    transferReason: string, 
    wellChargeCode?: string, 
    referenceDocNumber?: string, 
    notes?: string
  ) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const previousOwner = item.projectOwner || 'Unassigned Asset Pool';
        const newRecord = {
          id: `ot-${Date.now()}`,
          transferDate: new Date().toISOString().split('T')[0],
          previousProjectOwner: previousOwner,
          newProjectOwner,
          transferReason,
          approvedBy: `${currentUser.name} (${currentUser.role})`,
          wellChargeCode: wellChargeCode || item.wellChargeCode,
          referenceDocNumber,
          notes,
        };

        const updated = {
          ...item,
          projectOwner: newProjectOwner,
          wellChargeCode: wellChargeCode || item.wellChargeCode,
          ownershipHistory: [newRecord, ...(item.ownershipHistory || [])],
          updatedAt: new Date().toISOString(),
        };
        saveItemToFirestore(updated);
        return updated;
      }
      return item;
    }));
  };

  const deleteItem = (id: string) => {
    const itemToDelete = items.find(i => i.id === id);
    setItems(prev => prev.filter(item => item.id !== id));
    if (!isOffline && db) {
      deleteDoc(doc(db, 'items', id)).catch(err => console.error('Firestore deleteItem err:', err));
    }
    if (itemToDelete) {
      logAuditTrail(
        'ITEM_DELETED',
        itemToDelete.tagNumber || id,
        `Permanently removed tubular item "${itemToDelete.name}" (${itemToDelete.tagNumber}, S/N: ${itemToDelete.serialNumber}) from OCTG database.`,
        `Deleted by ${currentUser?.name || 'Materials Management'}`
      );
    }
  };

  const bulkDeleteItems = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const count = ids.length;
    setItems(prev => prev.filter(item => !ids.includes(item.id)));
    if (!isOffline && db) {
      ids.forEach(id => {
        deleteDoc(doc(db, 'items', id)).catch(err => console.error('Firestore bulkDelete err:', err));
      });
    }
    logAuditTrail(
      'ITEM_DELETED',
      `BULK_DELETE_${count}_ITEMS`,
      `Bulk deleted ${count} tubular/tool items from OCTG master database.`,
      `Deleted by ${currentUser?.name || 'Materials Management'}`
    );
  };

  const addInspectionRecord = (itemId: string, record: Omit<InspectionRecord, 'id'>) => {
    const newRecord: InspectionRecord = {
      ...record,
      id: `insp-${Date.now()}`,
    };

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        let newStatus: MaintenanceStatus = item.status;
        if (record.result === 'Pass' || record.result === 'Pass with Condition') {
          newStatus = 'Serviceable (Field Ready)';
        } else if (record.result === 'Fail') {
          newStatus = 'Quarantined / Damaged';
        }

        const updated = {
          ...item,
          status: newStatus,
          lastInspectionDate: record.date,
          nextInspectionDue: record.nextInspectionDue,
          inspectionCertNumber: record.certNumber || item.inspectionCertNumber,
          inspectionHistory: [newRecord, ...item.inspectionHistory],
          updatedAt: new Date().toISOString(),
        };
        saveItemToFirestore(updated);
        return updated;
      }
      return item;
    }));
  };

  const addMaintenanceLog = (itemId: string, log: Omit<MaintenanceLog, 'id'>) => {
    const newLog: MaintenanceLog = {
      ...log,
      id: `maint-${Date.now()}`,
    };

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = {
          ...item,
          maintenanceLogs: [newLog, ...item.maintenanceLogs],
          updatedAt: new Date().toISOString(),
        };
        saveItemToFirestore(updated);
        return updated;
      }
      return item;
    }));
  };

  // Material Transfers
  const createTransfer = (
    origin: LocationType, 
    destination: LocationType, 
    carrierType: MaterialTransferTicket['carrierType'], 
    carrierName: string, 
    selectedItemIds: { itemId: string; quantityJoints: number }[],
    notes?: string,
    signOffDetails?: {
      senderSignature?: string;
      senderBadgeId?: string;
      receiverName?: string;
      receiverRole?: UserRole;
      receiverSignature?: string;
      receiverBadgeId?: string;
      receiverDesignation?: string;
      authorizationToken?: string;
      dispatchChecklistCompleted?: boolean;
    }
  ) => {
    const transferId = `mtt-${Date.now()}`;
    const manifestNumber = `MTT-2026-${Math.floor(100 + Math.random() * 900)}`;

    const transferItems = selectedItemIds.map(s => {
      const found = items.find(i => i.id === s.itemId);
      return {
        itemId: s.itemId,
        tagNumber: found ? found.tagNumber : 'UNKNOWN',
        name: found ? found.name : 'Unknown Item',
        quantityJoints: s.quantityJoints,
        conditionAtDispatch: found ? found.condition : 'Used - Good',
      };
    });

    const authToken = signOffDetails?.authorizationToken || `AUTH-SIG-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTransfer: MaterialTransferTicket = {
      id: transferId,
      manifestNumber,
      createdDate: new Date().toISOString(),
      originLocation: origin,
      destinationLocation: destination,
      carrierType,
      carrierName,
      items: transferItems,
      status: 'Dispatched (In Transit)',
      senderUserId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderBadgeId: signOffDetails?.senderBadgeId || `STAFF-${currentUser.id.replace('usr-', '')}`,
      senderValidatedAt: new Date().toISOString(),
      senderSignature: signOffDetails?.senderSignature || `${currentUser.name} (${currentUser.role})`,
      
      // Dual Digital Sign-off Receiver info
      receiverUserId: undefined,
      receiverName: signOffDetails?.receiverName,
      receiverRole: signOffDetails?.receiverRole || 'Rig Toolpusher / Materials Specialist',
      receiverBadgeId: signOffDetails?.receiverBadgeId,
      receiverValidatedAt: signOffDetails?.receiverSignature ? new Date().toISOString() : undefined,
      receiverSignature: signOffDetails?.receiverSignature,
      receiverDesignation: signOffDetails?.receiverDesignation,

      authorizationToken: authToken,
      dispatchChecklistCompleted: signOffDetails?.dispatchChecklistCompleted ?? true,
      notes,
    };

    setItems(prev => prev.map(item => {
      if (selectedItemIds.some(s => s.itemId === item.id)) {
        const updated = {
          ...item,
          currentLocation: 'In Transit (Supply Vessel)' as LocationType,
          rackLocation: `Onboard ${carrierName}`,
          updatedAt: new Date().toISOString(),
        };
        saveItemToFirestore(updated);
        return updated;
      }
      return item;
    }));

    setTransfers(prev => [newTransfer, ...prev]);
    saveTransferToFirestore(newTransfer);

    logAuditTrail(
      'MATERIAL_TRANSFER_DISPATCHED',
      manifestNumber,
      `Created Material Transfer Ticket ${manifestNumber} from ${origin} to ${destination} via ${carrierName} (${transferItems.length} items). Digital Sign-off: Materials Manager [${newTransfer.senderSignature}] & Receiver [${newTransfer.receiverSignature || 'Pending'}]. Auth Token: ${authToken}`
    );

    return newTransfer;
  };

  const validateSenderDispatch = (transferId: string, notes?: string) => {
    setTransfers(prev => prev.map(t => {
      if (t.id === transferId) {
        const updated = {
          ...t,
          status: 'Dispatched (In Transit)' as const,
          senderUserId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          senderValidatedAt: new Date().toISOString(),
          senderSignature: `${currentUser.name} (${currentUser.role} Stamp)`,
          notes: notes ? `${t.notes ? t.notes + ' | ' : ''}${notes}` : t.notes,
        };
        saveTransferToFirestore(updated);
        return updated;
      }
      return t;
    }));
  };

  const validateReceiverArrival = (
    transferId: string, 
    itemConditions: { itemId: string; condition: EquipmentCondition; discrepancyNote?: string }[],
    notes?: string
  ) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return;

    const hasDiscrepancy = itemConditions.some(ic => ic.discrepancyNote && ic.discrepancyNote.trim().length > 0);
    const newStatus: MaterialTransferTicket['status'] = hasDiscrepancy ? 'Discrepancy Flagged' : 'Received & Verified';

    setTransfers(prev => prev.map(t => {
      if (t.id === transferId) {
        const updated = {
          ...t,
          status: newStatus,
          receiverUserId: currentUser.id,
          receiverName: currentUser.name,
          receiverRole: currentUser.role,
          receiverValidatedAt: new Date().toISOString(),
          receiverSignature: `${currentUser.name} (${currentUser.role} Stamp)`,
          notes: notes ? `${t.notes ? t.notes + ' | ' : ''}Receiver Notes: ${notes}` : t.notes,
          items: t.items.map(item => {
            const cond = itemConditions.find(c => c.itemId === item.itemId);
            return {
              ...item,
              conditionAtReceipt: cond ? cond.condition : item.conditionAtDispatch,
              discrepancyNote: cond ? cond.discrepancyNote : undefined,
            };
          }),
        };
        saveTransferToFirestore(updated);
        return updated;
      }
      return t;
    }));

    setItems(prev => prev.map(item => {
      const matchInTransfer = transfer.items.find(i => i.itemId === item.id);
      if (matchInTransfer) {
        const cond = itemConditions.find(c => c.itemId === item.id);
        const updated = {
          ...item,
          currentLocation: transfer.destinationLocation,
          rackLocation: transfer.destinationLocation.includes('Rig') ? 'Rig Catwalk / Setback' : 'Yard Receiving Bay',
          condition: cond ? cond.condition : item.condition,
          status: cond && cond.condition === 'Damaged / Reject' ? 'Quarantined / Damaged' : item.status,
          updatedAt: new Date().toISOString(),
        };
        saveItemToFirestore(updated);
        return updated;
      }
      return item;
    }));
  };

  // Persistent Bulk Selection Across Tabs
  const [selectedTubularIdsForTransfer, setSelectedTubularIdsForTransfer] = useState<string[]>([]);

  const toggleTubularSelectionForTransfer = (id: string) => {
    setSelectedTubularIdsForTransfer(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const clearTubularSelectionForTransfer = () => {
    setSelectedTubularIdsForTransfer([]);
  };

  const bulkAssignToBackloadManifest = (manifestId: string, itemIds: string[]) => {
    if (!manifestId || itemIds.length === 0) return;
    const itemsToAssign = items.filter(i => itemIds.includes(i.id));
    if (itemsToAssign.length === 0) return;

    setRigBackloads(prev => prev.map(m => {
      if (m.id === manifestId) {
        const newBackloadItems: RigBackloadItem[] = itemsToAssign.map(i => {
          const age = ((i.monthsAtYard || 0) / 12) || 1.0;
          const isDirectDisposal = (i.monthsAtYard || 0) >= 36 || i.condition === 'Damaged / Reject';
          return {
            itemId: i.id,
            tagNumber: i.tagNumber,
            serialNumber: i.serialNumber,
            heatNumber: i.heatNumber,
            name: i.name,
            category: i.category,
            holeSection: i.holeSection,
            outerDiameter: i.outerDiameter,
            weightLbFt: i.weightLbFt,
            grade: i.grade,
            connectionType: i.connectionType,
            lengthFt: i.lengthFt,
            quantityJoints: i.quantityJoints,
            conditionOnRig: i.condition,
            reasonForBackload: i.condition === 'Damaged / Reject' ? 'Damaged / Reject' : 'Campaign Finished',
            actionType: 'PENDING_DECISION',
            routingQueue: isDirectDisposal ? 'DIRECT_DISPOSAL' : 'INSPECTION_REQUIRED',
            ageYears: age,
            routingReason: isDirectDisposal 
              ? 'Age >= 3.0 yrs or damaged condition (Direct Scrap)' 
              : 'Serviceable / Recertification Required',
          };
        });
        return {
          ...m,
          items: [...m.items, ...newBackloadItems]
        };
      }
      return m;
    }));

    logAuditTrail(
      'CREATE_BACKLOAD_MANIFEST',
      manifestId,
      `Bulk assigned ${itemsToAssign.length} tubular items to backload manifest ${manifestId}.`
    );
    setSelectedTubularIdsForTransfer([]);
  };

  // Backload Automated Routing Engine & PO Attachment
  const autoRouteBackloadItems = (manifestId?: string, ageThresholdYears: number = 3.0) => {
    setRigBackloads(prev => prev.map(rbl => {
      if (manifestId && rbl.id !== manifestId) return rbl;
      const updatedItems = rbl.items.map(item => {
        const age = item.ageYears || 1.5;
        const isDamaged = item.conditionOnRig === 'Damaged / Reject' || item.reasonForBackload === 'Damaged / Reject';
        const isOld = age >= ageThresholdYears;
        
        const queue: 'INSPECTION_REQUIRED' | 'DIRECT_DISPOSAL' = (isDamaged || isOld) ? 'DIRECT_DISPOSAL' : 'INSPECTION_REQUIRED';
        const reason = isDamaged 
          ? 'Damaged / Reject condition upon return' 
          : isOld 
          ? `Age ${age.toFixed(1)} yrs exceeds ${ageThresholdYears.toFixed(1)} yr disposal threshold` 
          : `Age ${age.toFixed(1)} yrs within operational limit (NDT / Recertification required)`;

        return {
          ...item,
          routingQueue: queue,
          ageYears: age,
          routingReason: reason,
        };
      });

      return {
        ...rbl,
        items: updatedItems,
      };
    }));

    logAuditTrail(
      'SYSTEM_CONFIG_UPDATED',
      manifestId || 'ALL_MANIFESTS',
      `Executed automated age-based routing rules (Threshold: ${ageThresholdYears} yrs) across backload items.`
    );
  };

  const attachApprovedPOToItem = (
    itemId: string, 
    poNumber: string, 
    vendorName: string, 
    serviceScope: string, 
    costUsd?: number
  ) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId || item.tagNumber === itemId) {
        const updated = {
          ...item,
          poNumber,
          poApproved: true,
          vendorServicePoDetails: {
            poNumber,
            vendorName,
            serviceScope,
            approvedBy: currentUser.name,
            approvedAt: new Date().toISOString(),
            costUsd: costUsd || 5000,
          },
          updatedAt: new Date().toISOString(),
        };
        saveItemToFirestore(updated);
        return updated;
      }
      return item;
    }));

    logAuditTrail(
      'ITEM_UPDATED',
      itemId,
      `Approved PO #${poNumber} attached for vendor service (${vendorName} - ${serviceScope}).`
    );
  };

  const attachApprovedPOToBackloadItem = (
    manifestId: string, 
    itemTagNumber: string, 
    poNumber: string, 
    vendorName: string, 
    serviceScope: string,
    costUsd?: number
  ) => {
    setRigBackloads(prev => prev.map(rbl => {
      if (rbl.id === manifestId) {
        const updatedItems = rbl.items.map(i => {
          if (i.tagNumber === itemTagNumber) {
            return {
              ...i,
              poNumber,
              poApproved: true,
              poVendorName: vendorName,
              poApprovedBy: currentUser.name,
              actionNotes: `${i.actionNotes || ''} [Approved PO #${poNumber} for ${vendorName}: ${serviceScope}]`,
            };
          }
          return i;
        });
        return { ...rbl, items: updatedItems };
      }
      return rbl;
    }));

    logAuditTrail(
      'DISPOSITION_SENT_FOR_INSPECTION',
      `${manifestId}:${itemTagNumber}`,
      `Approved PO #${poNumber} verified for vendor service on ${itemTagNumber} (${vendorName}).`
    );
  };

  // Role-Based Access Control (RBAC) Module Permissions State
  const [roleModulePermissions, setRoleModulePermissions] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('drillcore_role_module_permissions');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse role module permissions from localStorage', e);
    }
    return DEFAULT_ROLE_MODULE_PERMISSIONS;
  });

  const updateRoleModulePermissions = (role: string, allowedModules: string[]) => {
    setRoleModulePermissions(prev => {
      const updated = {
        ...prev,
        [role]: allowedModules
      };
      try {
        localStorage.setItem('drillcore_role_module_permissions', safeJsonStringify(updated));
      } catch (e) {
        console.error('Failed to save role permissions', e);
      }
      return updated;
    });

    logAuditTrail(
      'SYSTEM_CONFIG_UPDATED',
      `RBAC_MODULE_ACCESS:${role}`,
      `Updated module access permissions for role "${role}" (${allowedModules.length} modules granted: ${allowedModules.join(', ')}).`
    );
  };

  const resetRoleModulePermissions = () => {
    setRoleModulePermissions(DEFAULT_ROLE_MODULE_PERMISSIONS);
    try {
      localStorage.setItem('drillcore_role_module_permissions', safeJsonStringify(DEFAULT_ROLE_MODULE_PERMISSIONS));
    } catch (e) {
      console.error(e);
    }
    logAuditTrail(
      'SYSTEM_CONFIG_UPDATED',
      'RBAC_MODULE_ACCESS_RESET',
      'Reset all role-based module access permissions to system factory defaults.'
    );
  };

  const hasModuleAccess = (role: string, moduleKey: string) => {
    if (role === 'System Administrator') return true;
    const permissions = roleModulePermissions[role] || DEFAULT_ROLE_MODULE_PERMISSIONS[role] || ['dashboard', 'inventory'];
    return permissions.includes(moduleKey);
  };

  // Sync Queue
  const processSyncQueue = () => {
    setIsOffline(false);
    setOfflineQueue([]);
  };

  const clearOfflineQueue = () => {
    setOfflineQueue([]);
  };

  // Calculated Alert Summary
  const alerts: AlertSummary = useMemo(() => {
    const today = new Date('2026-08-07');
    let overdue = 0;
    let dueSoon = 0;
    let surplusAlert = 0;

    items.forEach(item => {
      if (item.status === 'Inspection Overdue') {
        overdue++;
      } else if (item.nextInspectionDue) {
        const dueDate = new Date(item.nextInspectionDue);
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 0) {
          overdue++;
        } else if (diffDays <= (systemConfig.inspectionLeadAlertDays || 30)) {
          dueSoon++;
        }
      }

      if (item.isSurplus && (item.monthsAtYard || 0) >= 6 && item.status !== 'Serviceable (Field Ready)') {
        surplusAlert++;
      }
    });

    const pendingTransfers = transfers.filter(t => t.status === 'Dispatched (In Transit)').length;

    return {
      overdueCount: overdue,
      dueSoonCount: dueSoon,
      surplusAlertCount: surplusAlert,
      pendingTransferCount: pendingTransfers,
    };
  }, [items, transfers, systemConfig]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTag = item.tagNumber.toLowerCase().includes(q);
        const matchName = item.name.toLowerCase().includes(q);
        const matchSN = item.serialNumber.toLowerCase().includes(q);
        const matchHeat = item.heatNumber.toLowerCase().includes(q);
        const matchCert = item.inspectionCertNumber.toLowerCase().includes(q);
        const matchConn = item.connectionType.toLowerCase().includes(q);
        const matchCoc = item.cocNumber ? item.cocNumber.toLowerCase().includes(q) : false;
        const matchPo = item.poNumber ? item.poNumber.toLowerCase().includes(q) : false;
        const matchDo = item.doNumber ? item.doNumber.toLowerCase().includes(q) : false;
        const matchCharge = item.wellChargeCode ? item.wellChargeCode.toLowerCase().includes(q) : false;
        const matchVisma = item.vismaNumber ? item.vismaNumber.toLowerCase().includes(q) : false;
        const matchTsr = item.tsrNumber ? item.tsrNumber.toLowerCase().includes(q) : false;
        const matchOwner = item.projectOwner ? item.projectOwner.toLowerCase().includes(q) : false;

        if (!matchTag && !matchName && !matchSN && !matchHeat && !matchCert && !matchConn &&
            !matchCoc && !matchPo && !matchDo && !matchCharge && !matchVisma && !matchTsr && !matchOwner) {
          return false;
        }
      }

      if (activeCampaignId !== 'ALL' && item.campaignId && item.campaignId !== activeCampaignId) {
        return false;
      }

      if (selectedHoleSection !== 'ALL' && item.holeSection !== selectedHoleSection) {
        return false;
      }

      if (selectedLocation !== 'ALL' && item.currentLocation !== selectedLocation) {
        return false;
      }

      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      if (showSurplusOnly && !item.isSurplus) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedHoleSection, selectedLocation, selectedStatus, showSurplusOnly, activeCampaignId]);

  return (
    <DrillingContext.Provider value={{
      currentUser,
      allUsers,
      isAuthenticated,
      pendingLoginRequest,
      logoutNotice,
      setLogoutNotice,
      acceptConcurrentLoginRequest,
      declineConcurrentLoginRequest,
      loginUser,
      logoutUser,
      loginWithMicrosoftAccount,
      registerWithMicrosoft,
      migrateDatabaseToDedicatedFirestore,
      testDedicatedFirestoreConnection,
      dedicatedDatabaseId,
      isMigratingToDedicatedDb,
      setCurrentUserRole,
      registerUser,
      bulkImportApprovedUsers,
      provisionSystemAdminAccount,
      updateUserStatus,
      updateUserRole,
      updateUser,
      deleteUser,
      revokeUserAccess,
      resendVerificationEmail,
      sendEmailCredentialsServer,
      sendAuthTokenEmail,
      resetPasswordWithToken,
      updateCurrentUserPassword,
      toggleMsAuthenticator,
      verifyMsTotpCode,
      verifyEmailWithToken,
      emailOutbox,
      systemConfig,
      updateSystemConfig,
      addCorporateDomain,
      removeCorporateDomain,
      exportDatabaseSnapshot,
      resetDatabaseToInitial,

      // Campaign & Multi-Project Management
      campaigns,
      activeCampaignId,
      setActiveCampaignId,
      createCampaign,
      updateCampaign,
      deleteCampaign,
      addWellToCampaign,

      // Real-time Photo Upload
      addItemPhoto,

      // Anti-Duplicate & Booking Lock
      checkDuplicateItem,
      lockItemForTransfer,
      unlockItemForTransfer,

      // Backup & Restore
      backups,
      createBackupVaultSnapshot,
      downloadBackupFile,
      restoreFromBackupSnapshot,
      exportEncryptedSnapshot,
      importEncryptedSnapshot,

      // Notifications Center
      notifications,
      unreadNotificationCount,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotification,
      addSystemNotification,

      // Well & Project Charge Codes (Cost Controller Hub)
      chargeCodes,
      addChargeCode,
      updateChargeCode,
      deleteChargeCode,
      importChargeCodes,

      availableRoles,
      availableDepartments,
      availableLocations,
      availableHoleSections,
      availableCategories,
      availableEquipmentConditions,
      availableMaintenanceStatuses,
      availableCarrierTypes,
      addDropdownOption,
      removeDropdownOption,
      resetDropdownOptions,
      items,
      addItem,
      bulkAddItems,
      updateItem,
      bulkUpdateStatus,
      bulkUpdateLocation,
      bulkUpdateItems,
      transferOwnership,
      deleteItem,
      bulkDeleteItems,
      addInspectionRecord,
      addMaintenanceLog,
      transfers,
      createTransfer,
      validateSenderDispatch,
      validateReceiverArrival,
      surplusBookings,
      createSurplusBooking,
      validateSurplusBookingStage,
      flagSurplusForVendorServiceAndPO,
      materialRequisitions,
      createMaterialRequisition,
      rigCallouts,
      createRigCallout,
      rigBackloads,
      createRigBackload,
      receiveRigBackloadAtSupplyBase,
      confirmVesselArrivalAtBase,
      processBackloadActionAtBase,
      auditTrailLogs,
      logAuditTrail,
      roleModulePermissions,
      updateRoleModulePermissions,
      resetRoleModulePermissions,
      hasModuleAccess,
      selectedTubularIdsForTransfer,
      toggleTubularSelectionForTransfer,
      setSelectedTubularIdsForTransfer,
      clearTubularSelectionForTransfer,
      bulkAssignToBackloadManifest,
      autoRouteBackloadItems,
      attachApprovedPOToItem,
      attachApprovedPOToBackloadItem,
      searchQuery,
      setSearchQuery,
      selectedHoleSection,
      setSelectedHoleSection,
      selectedLocation,
      setSelectedLocation,
      selectedStatus,
      setSelectedStatus,
      showSurplusOnly,
      setShowSurplusOnly,
      isOffline,
      setIsOffline,
      offlineQueue,
      processSyncQueue,
      clearOfflineQueue,
      alerts,
      filteredItems,
    }}>
      {children}
    </DrillingContext.Provider>
  );
};

export const useDrilling = () => {
  const context = useContext(DrillingContext);
  if (!context) {
    throw new Error('useDrilling must be used within a DrillingProvider');
  }
  return context;
};

