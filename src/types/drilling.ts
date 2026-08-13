export type HoleSection = 
  | '36" Conductor'
  | '26" Surface Hole'
  | '17-1/2" Intermediate'
  | '12-1/4" Main Hole'
  | '8-1/2" Reservoir'
  | '6" Liner / Workover'
  | 'Unassigned / General';

export type ItemCategory = 
  | 'Casing'
  | 'Tubing'
  | 'Drill Pipe'
  | 'Heavy Weight Drill Pipe (HWDP)'
  | 'Drill Collar'
  | 'Liner'
  | 'Pup Joint'
  | 'Crossover Sub'
  | 'Float Equipment'
  | 'Centralizer & Stop Collar'
  | 'Running & Setting Tool'
  | 'Downhole Drilling Tool'
  | 'Jar & Stabilizer'
  | 'Wellhead & Safety Equipment';

export type MaintenanceStatus = 
  | 'Serviceable (Field Ready)'
  | 'Due for Inspection'
  | 'Inspection Overdue'
  | 'In Refurbishment'
  | 'Quarantined / Damaged'
  | 'Scrapped';

export type EquipmentCondition = 'New Purchased' | 'Used - Good' | 'Used - Minor Wear' | 'Backloaded - Pending Recert' | 'Damaged / Reject';

export type LocationType = 
  | 'Main Supply Base Yard'
  | 'Offshore Rig Alpha'
  | 'Machine Shop & Testing Facility'
  | 'In Transit (Supply Vessel)'
  | 'In Transit (Road Truck)'
  | 'Vendor Warehouse';

export type UserRole = 
  | 'System Administrator'
  | 'Drilling Engineer'
  | 'Logistics Coordinator'
  | 'Materials Coordinator (Supply Base)'
  | 'Rig Toolpusher / Materials Specialist'
  | 'QA/QC Inspector'
  | 'Auditor / Management';

export type UserAccountStatus = 
  | 'Pending Email Verification'
  | 'Pending Admin Approval'
  | 'Active Approved'
  | 'Suspended'
  | 'Deactivated';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  location: LocationType;
  email: string;
  passwordHash?: string;
  password?: string;
  msAuthenticatorEnabled?: boolean;
  msAuthenticatorSecret?: string;
  isFirstLogin?: boolean;
  status?: UserAccountStatus;
  verificationToken?: string;
  verificationSentAt?: string;
  registeredAt?: string;
  approvedBy?: string;
  isCorporateVerified?: boolean;
  corporateDomain?: string;
  permissions?: string[];
}

export interface ActiveSessionData {
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  loginTime: number;
  lastHeartbeat: number;
}

export interface ConcurrentLoginRequestData {
  requestId: string;
  requestingUser: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
  timestamp: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

export interface InspectionRecord {
  id: string;
  date: string;
  inspectorName: string;
  inspectionType: 'NDT (Magnetic Particle)' | 'Visual Thread Inspection' | 'Full Length Ultrasonic' | 'Drift Test' | 'Torque & Bucking Test' | 'Pressure Test';
  result: 'Pass' | 'Pass with Condition' | 'Fail';
  certNumber: string;
  certFileUrl?: string;
  nextInspectionDue: string;
  remarks: string;
}

export interface MaintenanceLog {
  id: string;
  date: string;
  performedBy: string;
  action: 'Washing & Thread Coating' | 'Thread Protector Replacement' | 'Refurbishment' | 'Bucking Unit Torque' | 'Hardbanding Repair' | 'Recertification';
  notes: string;
  costEstimateUsd?: number;
}

export interface ItemPhotoRecord {
  id: string;
  capturedAt: string; // ISO timestamp
  capturedBy: string; // Matco or Inspector Name
  role?: string;
  photoUrl: string; // base64 Data URL or image URL
  caption: string;
  photoType: 'Thread & Pin Inspection' | 'Tally Tag & Serial Stencil' | 'Storage Yard Rack' | 'Damage / Wear Defect' | 'Vessel Loading / Backload';
  gpsLocation?: string;
}

export interface WellDefinition {
  id: string;
  name: string; // e.g. "Well Alpha-01", "Well Baram-104"
  code: string; // e.g. "W-ALP-01"
  type: 'Exploration' | 'Development' | 'Appraisal' | 'Workover / Abandonment';
  status: 'Planning' | 'Active Drilling' | 'Completed' | 'Suspended';
  targetDepthFt?: number;
  afeCode?: string;
  assignedRigId?: string;
  assignedRigName?: string;
}

export interface PersonnelFocal {
  id: string;
  name: string;
  email: string;
  roleTitle: 'Drilling Engineer' | 'Materials Coordinator (Matco)' | 'Materials Management Focal' | 'Logistics Focal' | 'QA/QC Lead';
  assignedLocation?: string;
}

export interface DrillingCampaign {
  id: string; // e.g. "CMP-2026-NORTH"
  code: string; // e.g. "CAM-PETRONAS-01"
  name: string; // e.g. "Offshore North Malay Basin Campaign 2026"
  operator: string; // e.g. "Petronas Carigali / Shell Malaysia"
  clientCompany?: string;
  status: 'Planning' | 'Active Execution' | 'Completed' | 'On Hold';
  startDate: string;
  endDate?: string;
  budgetUsd?: number;
  
  // Multi-structure relationships
  wells: WellDefinition[];
  rigs: { id: string; name: string; location: LocationType }[];
  supplyBases: { id: string; name: string; location: LocationType }[];
  focals: PersonnelFocal[];
  
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseBackupRecord {
  id: string; // e.g. BKP-20260812-1402
  timestamp: string;
  createdByName: string;
  createdByRole: string;
  backupType: 'Daily Scheduled Auto-Backup' | 'Weekly Scheduled Backup' | 'Monthly Snapshot' | 'Manual On-Demand Backup';
  version: string;
  summary: {
    itemsCount: number;
    transfersCount: number;
    usersCount: number;
    backloadsCount: number;
    campaignsCount: number;
    auditLogsCount: number;
  };
  dataJson?: string; // Full database payload stringified
  notes?: string;
}

export interface ItemBookingLock {
  isBooked: boolean;
  bookedForManifestId?: string;
  manifestType?: 'Material Transfer Ticket' | 'Rig Backload Manifest' | 'Surplus Requisition';
  bookedForRigOrBase?: string;
  bookedBy?: string;
  bookedAt?: string;
}

export interface OwnershipTransferRecord {
  id: string;
  transferDate: string;
  previousProjectOwner: string;
  newProjectOwner: string;
  transferReason: string;
  approvedBy: string;
  wellChargeCode?: string;
  referenceDocNumber?: string;
  notes?: string;
}

export interface TubularItem {
  id: string;
  tagNumber: string; // e.g. CSG-1338-001 or DP-500-104
  serialNumber: string;
  heatNumber: string;
  name: string;
  category: ItemCategory;
  holeSection: HoleSection;
  
  // Technical Specifications
  outerDiameter: string; // e.g. "13 3/8\"" or "5\""
  innerDiameter?: string;
  weightLbFt: string; // e.g. "68 lb/ft"
  grade: string; // e.g. "L-80", "P-110", "S-135", "13Cr"
  connectionType: string; // e.g. "VAM TOP", "TenarisHydril Wedge 563", "NC50", "API EUE"
  lengthFt: number; // e.g. 30.5 or total tally length
  quantityJoints: number; // For tally items, joint count
  
  // Status & Location
  condition: EquipmentCondition;
  status: MaintenanceStatus;
  currentLocation: LocationType;
  rackLocation?: string; // e.g. "Rack B-04" or "Rig Catwalk"
  
  // Campaign & Well Linkage
  campaignId?: string;
  campaignName?: string;
  wellId?: string;
  wellName?: string;

  // Real-time Booking / Anti-Double Booking Guard
  bookingLock?: ItemBookingLock;

  // Photos & Inspection Visual Proof (Real-time Upload)
  photos?: ItemPhotoRecord[];

  // Purchase, ERP & Tracking Identifiers
  cocNumber?: string; // Certificate of Conformance
  poNumber?: string; // Purchase Order #
  poApproved?: boolean; // Approved PO flag for vendor service delivery
  vendorServicePoDetails?: {
    poNumber: string;
    vendorName: string;
    serviceScope: string;
    approvedBy: string;
    approvedAt: string;
    costUsd?: number;
  };
  doNumber?: string; // Delivery Order #
  wellChargeCode?: string; // Well / AFE Charge Code
  vismaNumber?: string; // VISMA ERP #
  tsrNumber?: string; // Technical Service Request #
  projectOwner?: string; // Current Project / Asset Owner
  ownershipHistory?: OwnershipTransferRecord[];

  // Purchase & Surplus Management
  isNewPurchased: boolean;
  isSurplus: boolean;
  backloadedDate?: string; // Date returned from well
  monthsAtYard?: number; // Calculated or recorded
  surplusReason?: 'Campaign Excess' | 'Well Abandoned Variant' | 'Rig Return' | 'Cancellation Reserve';
  
  // Inspection Tracking
  lastInspectionDate: string;
  nextInspectionDue: string;
  inspectionCertNumber: string;
  inspectionHistory: InspectionRecord[];
  maintenanceLogs: MaintenanceLog[];

  // QRCode / Barcode
  qrCodeData: string;
  notes?: string;
  updatedAt: string;
}

export interface MaterialTransferItem {
  itemId: string;
  tagNumber: string;
  name: string;
  quantityJoints: number;
  conditionAtDispatch: EquipmentCondition;
  conditionAtReceipt?: EquipmentCondition;
  discrepancyNote?: string;
}

export type TransferStatus = 'Draft' | 'Dispatched (In Transit)' | 'Received & Verified' | 'Discrepancy Flagged';

export interface MaterialTransferTicket {
  id: string; // e.g. MTT-2026-089
  manifestNumber: string;
  createdDate: string;
  originLocation: LocationType;
  destinationLocation: LocationType;
  carrierType: 'Supply Vessel' | 'Truck Transport' | 'Helicopter' | 'Third-Party Freight';
  carrierName: string; // e.g. "MV Crest Sentinel" or "TransLog Truck #4"
  items: MaterialTransferItem[];
  status: TransferStatus;
  
  // Dual Validation - Sender
  senderUserId: string;
  senderName: string;
  senderRole: UserRole;
  senderValidatedAt?: string;
  senderSignature?: string;

  // Dual Validation - Receiver
  receiverUserId?: string;
  receiverName?: string;
  receiverRole?: UserRole;
  receiverValidatedAt?: string;
  receiverSignature?: string;

  notes?: string;
}

export interface OfflineQueueItem {
  id: string;
  timestamp: string;
  actionType: 'UPDATE_ITEM' | 'CREATE_TRANSFER' | 'VALIDATE_TRANSFER_SENDER' | 'VALIDATE_TRANSFER_RECEIVER' | 'LOG_INSPECTION';
  payload: any;
  description: string;
}

export interface AlertSummary {
  overdueCount: number;
  dueSoonCount: number; // due in <= 30 days
  surplusAlertCount: number; // yard sitting >= 6 months needing re-inspection
  pendingTransferCount: number; // transfers awaiting receipt verification
}

// Workflow Types for Drilling Engineer & Materials Coordinator

export type SurplusBookingStatus = 
  | 'Pending Cost Controller Validation'
  | 'Pending Material Management Focal Review'
  | 'Pending Supply Base Focal Approval'
  | 'Approved (Ownership Transferred)'
  | 'Rejected';

export interface SurplusBookingItem {
  itemId: string;
  tagNumber: string;
  name: string;
  quantityJointsRequested: number;
  availableYardJoints: number;
}

export interface SurplusBookingRequest {
  id: string; // e.g. SBR-2026-001
  createdAt: string;
  drillingEngineerId: string;
  drillingEngineerName: string;
  targetProject: string;
  holeSection: HoleSection;
  afeChargeCode: string;
  items: SurplusBookingItem[];
  status: SurplusBookingStatus;
  
  // Stage 1: Cost Controller
  costControllerValidatedAt?: string;
  costControllerName?: string;
  costControllerNotes?: string;
  
  // Stage 2: Material Management Focal
  mmFocalValidatedAt?: string;
  mmFocalName?: string;
  mmFocalNotes?: string;
  
  // Stage 3: Supply Base Focal
  supplyBaseFocalApprovedAt?: string;
  supplyBaseFocalName?: string;
  supplyBaseFocalNotes?: string;
  
  // Vendor Services & PO Issuance Flag
  flaggedForInspection?: boolean;
  flaggedForRetreading?: boolean;
  flaggedForOtherServices?: string;
  poNumber?: string;
  poIssuedAt?: string;
  vendorName?: string;
  estimatedServiceCostUsd?: number;
}

export interface MaterialRequisitionForm {
  id: string; // e.g. MSRF-2026-104
  reqNumber: string;
  createdDate: string;
  drillingEngineerName: string;
  projectName: string;
  afeChargeCode: string;
  holeSection: HoleSection;
  requestType: 'Surplus Booking & Service' | 'New Order Material Purchase' | 'Combined Requisition';
  casingSpecs: {
    outerDiameter: string;
    weightLbFt: string;
    grade: string;
    connectionType: string;
    requiredJoints: number;
    targetLengthFt: number;
    safetyFactorPct: number;
  };
  requiredVendorServices?: string[];
  status: 'Draft' | 'Submitted for Approval' | 'Approved' | 'PO Issued' | 'Fulfilled';
  notes?: string;
}

export interface RigMaterialCallout {
  id: string; // e.g. RMC-2026-088
  requestNumber: string;
  createdDate: string;
  rigLocation: LocationType;
  requestedBy: string; // Rig Matco / Toolpusher
  requiredDeliveryDate: string;
  holeSection: HoleSection;
  urgency: 'Routine' | 'Urgent Drilling Callout' | 'Rig Stop Emergency';
  items: {
    tagNumber?: string;
    description: string;
    category: ItemCategory;
    quantityJoints: number;
    notes?: string;
  }[];
  status: 'Submitted to Supply Base' | 'Staged for Vessel Loading' | 'Dispatched' | 'Received on Rig';
  preparedBySupplyBaseMatco?: string;
}

export type BackloadActionType = 'PENDING_DECISION' | 'SENT_FOR_INSPECTION' | 'SENT_FOR_DISPOSAL' | 'STORED_IN_YARD';

export type BackloadKpiStatus = 'On Track' | 'Near Breach' | 'SLA Breached' | 'Completed On Time' | 'Completed Overdue';

export interface RigBackloadItem {
  itemId?: string;
  tagNumber: string;
  serialNumber?: string;
  heatNumber?: string;
  name: string;
  category?: ItemCategory;
  holeSection?: HoleSection;
  outerDiameter?: string;
  weightLbFt?: string;
  grade?: string;
  connectionType?: string;
  lengthFt?: number;
  quantityJoints: number;
  conditionOnRig: EquipmentCondition;
  reasonForBackload: 'Campaign Finished' | 'Damaged Thread / BHA' | 'Inspection Due' | 'Excess Stock' | 'Damaged / Reject';
  
  // Next course of action taken by Matco Base / Warehouseman
  actionType?: BackloadActionType;
  actionTakenAt?: string;
  actionTakenBy?: string;
  actionNotes?: string;
  
  // Automated Queue Routing (Age-Based Criteria)
  routingQueue?: 'INSPECTION_REQUIRED' | 'DIRECT_DISPOSAL' | 'UNROUTED';
  ageYears?: number;
  routingReason?: string;

  // Vendor Service Purchase Order (PO) Requirements
  poNumber?: string;
  poApproved?: boolean;
  poVendorName?: string;
  poApprovedBy?: string;
  
  // Inspection Action Details
  inspectionType?: 'NDT (Magnetic Particle)' | 'Visual Thread Inspection' | 'Full Length Ultrasonic' | 'Drift Test' | 'Torque & Bucking Test' | 'Hardbanding Repair' | 'Recertification';
  inspectionFacility?: string;
  
  // Disposal Action Details
  scrapCertId?: string;
  disposalReason?: string;
  disposalYardLocation?: string;
}

export interface RigBackloadList {
  id: string; // e.g. RBL-2026-012 or BLM-2026-8841
  manifestNumber: string;
  createdDate: string;
  createdTimestamp?: string;
  rigLocation: LocationType;
  preparedBy: string; // Rig Toolpusher / Matco
  vesselName: string;
  vesselEta?: string; // Estimated arrival time e.g. "2026-08-11T16:00"
  vesselArrivedAt?: string; // Actual arrival timestamp
  items: RigBackloadItem[];
  status: 'Dispatched from Rig' | 'Arrived at Supply Base Quay' | 'Received at Supply Base Quay' | 'Action Completed (Inspected)' | 'Action Completed (Disposed)' | 'Reconciled & Racked';
  receivedBySupplyBaseMatco?: string;
  quaysideInspectionNotes?: string;

  // Preset KPI Timeliness Tracking
  kpiSlaTargetHours: number; // e.g., 24 or 48 hours default preset KPI
  slaDeadlineTime?: string; // Calculated deadline by when next action MUST be performed
  actionCompletedAt?: string; // Timestamp when next action was processed
  kpiStatus?: BackloadKpiStatus;
}

export interface AuditTrailLog {
  id: string;
  timestamp: string; // ISO String
  formattedTimestamp: string; // Readable e.g. "2026-08-11 14:02:11 UTC"
  userId: string;
  userName: string;
  userRole: UserRole;
  location: LocationType;
  actionType: 
    | 'CREATE_BACKLOAD_MANIFEST'
    | 'VESSEL_ARRIVAL_CONFIRMED'
    | 'DISPOSITION_SENT_FOR_INSPECTION'
    | 'DISPOSITION_SENT_FOR_DISPOSAL'
    | 'ITEM_CREATED'
    | 'ITEM_UPDATED'
    | 'OWNERSHIP_TRANSFERRED'
    | 'MATERIAL_TRANSFER_DISPATCHED'
    | 'MATERIAL_TRANSFER_RECEIVED'
    | 'INSPECTION_RECORDED'
    | 'USER_PROFILE_UPDATED'
    | 'USER_REGISTERED'
    | 'USER_STATUS_UPDATED'
    | 'USER_ROLE_UPDATED'
    | 'USER_DELETED'
    | 'SYSTEM_CONFIG_UPDATED';
  referenceId: string; // e.g. Manifest # "BLM-2026-8841", Item # "CSG-1338-001"
  details: string;
  notes?: string;
}

