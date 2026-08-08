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
  status?: UserAccountStatus;
  verificationToken?: string;
  verificationSentAt?: string;
  registeredAt?: string;
  approvedBy?: string;
  isCorporateVerified?: boolean;
  corporateDomain?: string;
  permissions?: string[];
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
  
  // Purchase, ERP & Tracking Identifiers
  cocNumber?: string; // Certificate of Conformance
  poNumber?: string; // Purchase Order #
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
