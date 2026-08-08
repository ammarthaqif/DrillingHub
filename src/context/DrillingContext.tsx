import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  MaintenanceLog
} from '../types/drilling';
import { INITIAL_ITEMS, INITIAL_TRANSFERS, INITIAL_USERS } from '../data/initialData';
import { embeddedDb, VerificationEmailRecord, SystemConfiguration } from '../db/embeddedDb';

interface DrillingContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  setCurrentUserRole: (role: UserRole) => void;
  registerUser: (newUser: { name: string; email: string; role: UserRole; department: string; location: LocationType }) => { success: boolean; message: string; user?: UserProfile };
  updateUserStatus: (userId: string, status: UserAccountStatus) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  resendVerificationEmail: (userId: string) => void;
  verifyEmailWithToken: (token: string) => boolean;
  emailOutbox: VerificationEmailRecord[];
  systemConfig: SystemConfiguration;
  updateSystemConfig: (updates: Partial<SystemConfiguration>) => void;
  addCorporateDomain: (domain: string) => void;
  removeCorporateDomain: (domain: string) => void;
  exportDatabaseSnapshot: () => void;
  resetDatabaseToInitial: () => void;
  
  // Inventory
  items: TubularItem[];
  addItem: (item: Omit<TubularItem, 'id' | 'updatedAt' | 'qrCodeData' | 'inspectionHistory' | 'maintenanceLogs'>) => void;
  bulkAddItems: (newItemsData: Omit<TubularItem, 'id' | 'updatedAt' | 'qrCodeData' | 'inspectionHistory' | 'maintenanceLogs'>[]) => void;
  updateItem: (id: string, updates: Partial<TubularItem>) => void;
  bulkUpdateStatus: (itemIds: string[], status: MaintenanceStatus, notes?: string) => void;
  transferOwnership: (
    itemId: string, 
    newProjectOwner: string, 
    transferReason: string, 
    wellChargeCode?: string, 
    referenceDocNumber?: string, 
    notes?: string
  ) => void;
  deleteItem: (id: string) => void;
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
    notes?: string
  ) => void;
  validateSenderDispatch: (transferId: string, notes?: string) => void;
  validateReceiverArrival: (
    transferId: string, 
    itemConditions: { itemId: string; condition: EquipmentCondition; discrepancyNote?: string }[],
    notes?: string
  ) => void;

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
};

const DrillingContext = createContext<DrillingContextType | undefined>(undefined);

export const DrillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users state
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    return embeddedDb.loadUsers() || INITIAL_USERS.map(u => ({
      ...u,
      status: 'Active Approved',
      isCorporateVerified: true,
      registeredAt: '2026-08-01',
    }));
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    return allUsers[0] || INITIAL_USERS[0];
  });

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

  // Transfers state
  const [transfers, setTransfers] = useState<MaterialTransferTicket[]>(() => {
    return embeddedDb.loadTransfers() || INITIAL_TRANSFERS;
  });

  // Offline state & queue
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHoleSection, setSelectedHoleSection] = useState<HoleSection | 'ALL'>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<LocationType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus | 'ALL'>('ALL');
  const [showSurplusOnly, setShowSurplusOnly] = useState(false);

  // Sync state to Embedded Realtime Database & Broadcast channel
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

  // Real-time listener for multi-tab pub/sub
  useEffect(() => {
    const unsubscribe = embeddedDb.subscribe((event) => {
      if (event.type === 'ITEMS_UPDATED' && event.payload) {
        setItems(event.payload);
      } else if (event.type === 'TRANSFERS_UPDATED' && event.payload) {
        setTransfers(event.payload);
      } else if (event.type === 'USERS_UPDATED' && event.payload) {
        setAllUsers(event.payload);
      }
    });

    return unsubscribe;
  }, []);

  // Role Switching
  const setCurrentUserRole = (role: UserRole) => {
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

  // User Registration & Corporate Email Validation
  const registerUser = (newUser: { name: string; email: string; role: UserRole; department: string; location: LocationType }) => {
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

    const existingUser = allUsers.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existingUser) {
      return { success: false, message: `An account with email ${newUser.email} already exists.` };
    }

    const userId = `usr-${Date.now()}`;
    const token = `VERIFY-TOK-${Math.floor(100000 + Math.random() * 900000)}`;

    const userRecord: UserProfile = {
      id: userId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      location: newUser.location,
      status: 'Pending Email Verification',
      verificationToken: token,
      verificationSentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      registeredAt: new Date().toISOString().split('T')[0],
      isCorporateVerified: false,
      corporateDomain: domain,
    };

    setAllUsers(prev => [...prev, userRecord]);

    // Dispatch verification email record to outbox
    const emailRecord: VerificationEmailRecord = {
      id: `email-${Date.now()}`,
      recipientEmail: newUser.email,
      userName: newUser.name,
      corporateDomain: domain,
      token,
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Delivered',
      verificationLink: `${window.location.origin}/verify?token=${token}`,
    };

    setEmailOutbox(prev => [emailRecord, ...prev]);

    return { 
      success: true, 
      message: `Registration initiated. Validation token sent to ${newUser.email}.`, 
      user: userRecord 
    };
  };

  const updateUserStatus = (userId: string, status: UserAccountStatus) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status,
          approvedBy: status === 'Active Approved' ? currentUser.name : u.approvedBy,
        };
      }
      return u;
    }));
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, role };
      }
      return u;
    }));
  };

  const resendVerificationEmail = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const token = `VERIFY-TOK-${Math.floor(100000 + Math.random() * 900000)}`;
    const domain = user.email.split('@')[1] || 'corp.com';

    setAllUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      verificationToken: token,
      verificationSentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Pending Email Verification',
    } : u));

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
  };

  const verifyEmailWithToken = (token: string): boolean => {
    const user = allUsers.find(u => u.verificationToken === token);
    if (!user) return false;

    const autoApprove = systemConfig.autoApproveVerifiedCorporateEmails;
    const nextStatus: UserAccountStatus = autoApprove ? 'Active Approved' : 'Pending Admin Approval';

    setAllUsers(prev => prev.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          status: nextStatus,
          isCorporateVerified: true,
          verificationToken: undefined,
        };
      }
      return u;
    }));

    setEmailOutbox(prev => prev.map(e => e.token === token ? { ...e, status: 'Verified' } : e));

    return true;
  };

  const updateSystemConfig = (updates: Partial<SystemConfiguration>) => {
    setSystemConfig(prev => ({ ...prev, ...updates }));
  };

  const addCorporateDomain = (domain: string) => {
    const cleaned = domain.toLowerCase().replace('@', '').trim();
    if (cleaned && !systemConfig.corporateDomains.includes(cleaned)) {
      setSystemConfig(prev => ({
        ...prev,
        corporateDomains: [...prev.corporateDomains, cleaned],
      }));
    }
  };

  const removeCorporateDomain = (domain: string) => {
    setSystemConfig(prev => ({
      ...prev,
      corporateDomains: prev.corporateDomains.filter(d => d !== domain),
    }));
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
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DrillSpec_Database_Snapshot_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetDatabaseToInitial = () => {
    if (window.confirm('Reset embedded database to default campaign baseline? Custom items and users will be replaced.')) {
      setItems(INITIAL_ITEMS);
      setTransfers(INITIAL_TRANSFERS);
      setAllUsers(INITIAL_USERS.map(u => ({ ...u, status: 'Active Approved', isCorporateVerified: true })));
      setEmailOutbox([]);
      setSystemConfig(DEFAULT_CONFIG);
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
  };

  const updateItem = (id: string, updates: Partial<TubularItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    }));
  };

  const bulkUpdateStatus = (itemIds: string[], status: MaintenanceStatus, notes?: string) => {
    setItems(prev => prev.map(item => {
      if (itemIds.includes(item.id)) {
        const newMaintLog = notes ? {
          id: `maint-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          date: new Date().toISOString().split('T')[0],
          performedBy: currentUser.name,
          action: 'Recertification' as const,
          notes: `Batch status update to '${status}'. Notes: ${notes}`,
        } : null;

        return {
          ...item,
          status,
          updatedAt: new Date().toISOString(),
          maintenanceLogs: newMaintLog ? [newMaintLog, ...item.maintenanceLogs] : item.maintenanceLogs,
        };
      }
      return item;
    }));
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

        return {
          ...item,
          projectOwner: newProjectOwner,
          wellChargeCode: wellChargeCode || item.wellChargeCode,
          ownershipHistory: [newRecord, ...(item.ownershipHistory || [])],
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    }));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
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

        return {
          ...item,
          status: newStatus,
          lastInspectionDate: record.date,
          nextInspectionDue: record.nextInspectionDue,
          inspectionCertNumber: record.certNumber || item.inspectionCertNumber,
          inspectionHistory: [newRecord, ...item.inspectionHistory],
          updatedAt: new Date().toISOString(),
        };
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
        return {
          ...item,
          maintenanceLogs: [newLog, ...item.maintenanceLogs],
          updatedAt: new Date().toISOString(),
        };
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
    notes?: string
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
      senderValidatedAt: new Date().toISOString(),
      senderSignature: `${currentUser.name} (${currentUser.role})`,
      notes,
    };

    setItems(prev => prev.map(item => {
      if (selectedItemIds.some(s => s.itemId === item.id)) {
        return {
          ...item,
          currentLocation: 'In Transit (Supply Vessel)' as LocationType,
          rackLocation: `Onboard ${carrierName}`,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    }));

    setTransfers(prev => [newTransfer, ...prev]);
  };

  const validateSenderDispatch = (transferId: string, notes?: string) => {
    setTransfers(prev => prev.map(t => {
      if (t.id === transferId) {
        return {
          ...t,
          status: 'Dispatched (In Transit)',
          senderUserId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          senderValidatedAt: new Date().toISOString(),
          senderSignature: `${currentUser.name} (${currentUser.role} Stamp)`,
          notes: notes ? `${t.notes ? t.notes + ' | ' : ''}${notes}` : t.notes,
        };
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
        return {
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
      }
      return t;
    }));

    setItems(prev => prev.map(item => {
      const matchInTransfer = transfer.items.find(i => i.itemId === item.id);
      if (matchInTransfer) {
        const cond = itemConditions.find(c => c.itemId === item.id);
        return {
          ...item,
          currentLocation: transfer.destinationLocation,
          rackLocation: transfer.destinationLocation.includes('Rig') ? 'Rig Catwalk / Setback' : 'Yard Receiving Bay',
          condition: cond ? cond.condition : item.condition,
          status: cond && cond.condition === 'Damaged / Reject' ? 'Quarantined / Damaged' : item.status,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    }));
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
  }, [items, searchQuery, selectedHoleSection, selectedLocation, selectedStatus, showSurplusOnly]);

  return (
    <DrillingContext.Provider value={{
      currentUser,
      allUsers,
      setCurrentUserRole,
      registerUser,
      updateUserStatus,
      updateUserRole,
      resendVerificationEmail,
      verifyEmailWithToken,
      emailOutbox,
      systemConfig,
      updateSystemConfig,
      addCorporateDomain,
      removeCorporateDomain,
      exportDatabaseSnapshot,
      resetDatabaseToInitial,
      items,
      addItem,
      bulkAddItems,
      updateItem,
      bulkUpdateStatus,
      transferOwnership,
      deleteItem,
      addInspectionRecord,
      addMaintenanceLog,
      transfers,
      createTransfer,
      validateSenderDispatch,
      validateReceiverArrival,
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

