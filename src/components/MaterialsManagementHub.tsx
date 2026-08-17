import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useDrilling } from '../context/DrillingContext';
import { CsvImportModal } from './CsvImportModal';
import { 
  TubularItem, 
  ItemCategory, 
  HoleSection, 
  LocationType, 
  MaintenanceStatus, 
  EquipmentCondition 
} from '../types/drilling';
import { 
  Package, 
  Plus, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Eye, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  ArrowUpDown, 
  RefreshCw, 
  X, 
  Layers, 
  Building2, 
  Truck, 
  SlidersHorizontal, 
  FileText, 
  DollarSign, 
  Scale, 
  AlertCircle, 
  FileCheck, 
  Copy, 
  ChevronRight,
  Database,
  Archive,
  QrCode
} from 'lucide-react';

interface MaterialsManagementHubProps {
  onSelectItem?: (item: TubularItem) => void;
  onOpenAddItem?: () => void;
  onOpenEditItem?: (item: TubularItem) => void;
}

export const MaterialsManagementHub: React.FC<MaterialsManagementHubProps> = ({
  onSelectItem,
  onOpenAddItem,
  onOpenEditItem
}) => {
  const { 
    items, 
    addItem, 
    bulkAddItems, 
    updateItem, 
    deleteItem, 
    bulkDeleteItems, 
    bulkUpdateStatus,
    campaigns, 
    activeCampaignId, 
    setActiveCampaignId,
    availableHoleSections,
    availableLocations,
    availableCategories,
    availableEquipmentConditions,
    availableMaintenanceStatuses,
    logAuditTrail,
    currentUser
  } = useDrilling();

  // Local Search and Filter States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [holeSectionFilter, setHoleSectionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'DUE_INSPECTION' | 'QUARANTINED' | 'SERVICEABLE' | 'SURPLUS' | 'HIGH_VALUE'>('ALL');

  // Sorting State
  const [sortField, setSortField] = useState<keyof TubularItem>('tagNumber');
  const [sortAsc, setSortAsc] = useState(true);

  // Selection for Batch Operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<TubularItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBatchStatusModalOpen, setIsBatchStatusModalOpen] = useState(false);
  const [isBatchLocationModalOpen, setIsBatchLocationModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TubularItem | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [quickStatusTarget, setQuickStatusTarget] = useState<MaintenanceStatus>('Serviceable (Field Ready)');
  const [batchLocationTarget, setBatchLocationTarget] = useState<LocationType>('Main Supply Base Yard');
  const [batchRackTarget, setBatchRackTarget] = useState('Yard Bay A-01');

  // Excel Import State
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<Omit<TubularItem, 'id' | 'updatedAt' | 'qrCodeData' | 'inspectionHistory' | 'maintenanceLogs'>[]>([]);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    const today = new Date('2026-08-07');

    return items.filter(item => {
      // Campaign Filter
      if (activeCampaignId !== 'ALL' && item.campaignId && item.campaignId !== activeCampaignId) {
        return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTag = item.tagNumber?.toLowerCase().includes(q);
        const matchName = item.name?.toLowerCase().includes(q);
        const matchSerial = item.serialNumber?.toLowerCase().includes(q);
        const matchHeat = item.heatNumber?.toLowerCase().includes(q);
        const matchConn = item.connectionType?.toLowerCase().includes(q);
        const matchGrade = item.grade?.toLowerCase().includes(q);
        const matchPo = item.poNumber?.toLowerCase().includes(q);
        const matchDo = item.doNumber?.toLowerCase().includes(q);
        const matchCharge = item.wellChargeCode?.toLowerCase().includes(q);
        const matchOwner = item.projectOwner?.toLowerCase().includes(q);
        const matchRack = item.rackLocation?.toLowerCase().includes(q);

        if (!matchTag && !matchName && !matchSerial && !matchHeat && !matchConn && 
            !matchGrade && !matchPo && !matchDo && !matchCharge && !matchOwner && !matchRack) {
          return false;
        }
      }

      // Dropdown Filters
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (locationFilter !== 'ALL' && item.currentLocation !== locationFilter) return false;
      if (holeSectionFilter !== 'ALL' && item.holeSection !== holeSectionFilter) return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (conditionFilter !== 'ALL' && item.condition !== conditionFilter) return false;

      // Quick Filter Badges
      if (quickFilter === 'SERVICEABLE' && item.status !== 'Serviceable (Field Ready)') return false;
      if (quickFilter === 'QUARANTINED' && item.status !== 'Quarantined / Damaged') return false;
      if (quickFilter === 'SURPLUS' && !item.isSurplus) return false;
      if (quickFilter === 'HIGH_VALUE' && ((item.purchaseCostUsd || 0) < 50000)) return false;
      if (quickFilter === 'DUE_INSPECTION') {
        if (item.status === 'Inspection Overdue' || item.status === 'Due for Inspection') {
          return true;
        }
        if (item.nextInspectionDue) {
          const diffDays = Math.ceil((new Date(item.nextInspectionDue).getTime() - today.getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 30) return true;
        }
        return false;
      }

      return true;
    }).sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [
    items, 
    activeCampaignId, 
    search, 
    categoryFilter, 
    locationFilter, 
    holeSectionFilter, 
    statusFilter, 
    conditionFilter, 
    quickFilter, 
    sortField, 
    sortAsc
  ]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalFootage = 0;
    let totalTonnage = 0;
    let totalValuation = 0;
    let serviceableCount = 0;
    let dueSoonCount = 0;
    let overdueCount = 0;
    let quarantinedCount = 0;
    let totalJoints = 0;

    const today = new Date('2026-08-07');

    filteredItems.forEach(item => {
      totalFootage += item.lengthFt || 0;
      totalJoints += item.quantityJoints || 1;
      totalValuation += item.purchaseCostUsd || 0;

      // Calculate approximate steel tonnage: (Length * WeightLbFt) / 2204.62 (lbs per MT)
      const wtNum = parseFloat(String(item.weightLbFt || '').replace(/[^0-9.]/g, '')) || 0;
      if (wtNum && item.lengthFt) {
        totalTonnage += (item.lengthFt * wtNum) / 2204.62;
      }

      if (item.status === 'Serviceable (Field Ready)') {
        serviceableCount++;
      } else if (item.status === 'Inspection Overdue') {
        overdueCount++;
      } else if (item.status === 'Due for Inspection') {
        dueSoonCount++;
      } else if (item.status === 'Quarantined / Damaged') {
        quarantinedCount++;
      }

      if (item.nextInspectionDue && item.status !== 'Inspection Overdue' && item.status !== 'Due for Inspection') {
        const diffDays = Math.ceil((new Date(item.nextInspectionDue).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 0) {
          overdueCount++;
        } else if (diffDays <= 30) {
          dueSoonCount++;
        }
      }
    });

    return {
      totalCount: filteredItems.length,
      totalFootage,
      totalTonnage: Math.round(totalTonnage),
      totalValuation,
      serviceableCount,
      dueSoonCount,
      overdueCount,
      quarantinedCount,
      totalJoints,
    };
  }, [filteredItems]);

  // Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const handleSort = (field: keyof TubularItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Export to Excel / CSV
  const handleExportData = (format: 'xlsx' | 'csv') => {
    const exportRows = filteredItems.map(item => ({
      'Tag Number': item.tagNumber,
      'Item Description': item.name,
      'Category': item.category,
      'Hole Section': item.holeSection,
      'Outer Diameter': item.outerDiameter,
      'Weight (lb/ft)': item.weightLbFt,
      'Grade': item.grade,
      'Connection': item.connectionType,
      'Joint Count': item.quantityJoints || 1,
      'Length (ft)': item.lengthFt,
      'Serial Number': item.serialNumber,
      'Heat Number': item.heatNumber,
      'Location': item.currentLocation,
      'Rack / Bay': item.rackLocation || 'Yard Bay',
      'Maintenance Status': item.status,
      'Condition': item.condition,
      'Last Inspection Date': item.lastInspectionDate || 'N/A',
      'Next Inspection Due': item.nextInspectionDue || 'N/A',
      'Inspection Cert #': item.inspectionCertNumber || 'N/A',
      'COC Number': item.cocNumber || 'N/A',
      'PO Number': item.poNumber || 'N/A',
      'DO Number': item.doNumber || 'N/A',
      'Well Charge Code': item.wellChargeCode || 'N/A',
      'Project Owner': item.projectOwner || 'N/A',
      'Surplus Flag': item.isSurplus ? 'Yes' : 'No',
      'Estimated Value (USD)': item.purchaseCostUsd || 0,
      'Last Updated': item.updatedAt ? item.updatedAt.split('T')[0] : '2026-08-07',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OCTG_Master_Inventory');

    const timestamp = new Date().toISOString().split('T')[0];
    if (format === 'xlsx') {
      XLSX.writeFile(workbook, `OCTG_Master_Inventory_${timestamp}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `OCTG_Master_Inventory_${timestamp}.csv`);
    }

    logAuditTrail(
      'AUDIT_REPORT_GENERATED',
      `EXPORT_${format.toUpperCase()}`,
      `Exported ${filteredItems.length} OCTG tubular records in ${format.toUpperCase()} format.`,
      `Triggered by ${currentUser.name} (${currentUser.role})`
    );
    setIsExportModalOpen(false);
  };

  // Download Sample Template for Excel Import
  const handleDownloadSampleTemplate = () => {
    const sampleRows = [
      {
        'Tag Number': 'CSG-1338-901',
        'Item Description': '13-3/8" Casing 68# L-80 VAM TOP',
        'Category': 'Casing',
        'Hole Section': '17-1/2" Intermediate',
        'Outer Diameter': '13 3/8"',
        'Weight (lb/ft)': '68 lb/ft',
        'Grade': 'L-80',
        'Connection': 'VAM TOP',
        'Joint Count': 120,
        'Length (ft)': 4800,
        'Serial Number': 'SN-13CSG-8801',
        'Heat Number': 'HT-99120A',
        'Location': 'Main Supply Base Yard',
        'Rack Location': 'Yard Rack D-01',
        'Status': 'Serviceable (Field Ready)',
        'Condition': 'New Purchased',
        'Last Inspection Date': '2026-07-15',
        'Next Inspection Due': '2027-07-15',
        'Inspection Cert #': 'CERT-QA-8812',
        'COC Number': 'COC-2026-NIPPON-01',
        'PO Number': 'PO-45009123',
        'DO Number': 'DO-992301',
        'Well Charge Code': 'AFE-2026-ALPHA-01',
        'Project Owner': 'Petronas Carigali Sdn Bhd',
        'Purchase Cost (USD)': 245000,
      },
      {
        'Tag Number': 'DP-500-801',
        'Item Description': '5" Drill Pipe 19.5# S-135 NC50 Range 2',
        'Category': 'Drill Pipe',
        'Hole Section': '12-1/4" Main Hole',
        'Outer Diameter': '5"',
        'Weight (lb/ft)': '19.5 lb/ft',
        'Grade': 'S-135',
        'Connection': 'NC50',
        'Joint Count': 280,
        'Length (ft)': 8680,
        'Serial Number': 'SN-DP500-7712',
        'Heat Number': 'HT-55102Z',
        'Location': 'Main Supply Base Yard',
        'Rack Location': 'Rack Bay B-08',
        'Status': 'Due for Inspection',
        'Condition': 'Used - Good',
        'Last Inspection Date': '2025-08-10',
        'Next Inspection Due': '2026-08-15',
        'Inspection Cert #': 'CERT-TUBOSCOPE-99',
        'COC Number': 'COC-2026-NOV-44',
        'PO Number': 'PO-45007788',
        'DO Number': 'DO-991244',
        'Well Charge Code': 'AFE-2026-ALPHA-02',
        'Project Owner': 'Petronas Carigali Sdn Bhd',
        'Purchase Cost (USD)': 189000,
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OCTG_Import_Template');
    XLSX.writeFile(workbook, 'OCTG_Master_Inventory_Import_Template.xlsx');
  };

  // Process Uploaded Excel / CSV
  const handleProcessImportFile = (file: File) => {
    setImportErrorMsg(null);
    setImportWarnings([]);
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rows.length === 0) {
          setImportErrorMsg('The uploaded file does not contain any data rows.');
          return;
        }

        const warnings: string[] = [];
        const existingTags = new Set(items.map(i => i.tagNumber.toLowerCase()));
        const existingSerials = new Set(items.map(i => i.serialNumber.toLowerCase()));

        const mapped: Omit<TubularItem, 'id' | 'updatedAt' | 'qrCodeData' | 'inspectionHistory' | 'maintenanceLogs'>[] = rows.map((row, idx) => {
          const getVal = (...keys: string[]) => {
            for (const key of keys) {
              const matchedKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          const tag = getVal('Tag Number', 'Tag', 'TagNo', 'Tag_Number') || `TAG-MM-${Date.now()}-${idx + 1}`;
          const name = getVal('Item Description', 'Name', 'Description', 'Item Name') || 'OCTG Tubular Item';
          const category = (getVal('Category', 'Type') || 'Casing') as ItemCategory;
          const holeSection = (getVal('Hole Section', 'Section', 'HoleSec') || '17-1/2" Intermediate') as HoleSection;
          const od = getVal('Outer Diameter', 'OD', 'OuterDiameter') || '9-5/8"';
          const weight = getVal('Weight (lb/ft)', 'Weight', 'WeightLbFt', 'PPF') || '47 lb/ft';
          const grade = getVal('Grade', 'Steel Grade', 'Material') || 'L-80';
          const connection = getVal('Connection', 'ConnectionType', 'Thread') || 'VAM TOP';
          const joints = parseInt(getVal('Joint Count', 'Joints', 'Quantity', 'Qty') || '1', 10) || 1;
          const length = parseFloat(getVal('Length (ft)', 'Length', 'Footage', 'Total Length') || '40') || 40;
          const serial = getVal('Serial Number', 'Serial', 'SN', 'SerialNo') || `SN-${Math.floor(10000 + Math.random() * 90000)}`;
          const heat = getVal('Heat Number', 'Heat', 'HT', 'HeatNo') || `HT-M9901`;
          const location = (getVal('Location', 'Yard', 'CurrentLocation') || 'Main Supply Base Yard') as LocationType;
          const rack = getVal('Rack Location', 'Rack', 'Bay', 'RackLocation') || 'Yard Bay A-01';
          const status = (getVal('Maintenance Status', 'Status', 'Condition Status') || 'Serviceable (Field Ready)') as MaintenanceStatus;
          const condition = (getVal('Condition', 'Equipment Condition') || 'New Purchased') as EquipmentCondition;
          const lastInsp = getVal('Last Inspection Date', 'LastInspDate', 'Inspection Date') || '2026-06-01';
          const nextInsp = getVal('Next Inspection Due', 'NextInspDue', 'Expiry Date') || '2027-06-01';
          const certNo = getVal('Inspection Cert #', 'CertNo', 'Cert #') || 'CERT-MM-BULK';
          const cocNo = getVal('COC Number', 'COC', 'Mill Cert') || '';
          const poNo = getVal('PO Number', 'PO', 'PONo') || '';
          const doNo = getVal('DO Number', 'DO', 'DONo') || '';
          const chargeCode = getVal('Well Charge Code', 'AFE', 'ChargeCode') || 'AFE-2026-ALPHA-01';
          const owner = getVal('Project Owner', 'Operator', 'Client') || 'Petronas Carigali Sdn Bhd';
          const cost = parseFloat(getVal('Purchase Cost (USD)', 'Purchase Cost', 'Cost', 'Value USD') || '0') || 0;

          if (existingTags.has(tag.toLowerCase())) {
            warnings.push(`Row #${idx + 2}: Tag "${tag}" already exists in the database. It will be created with a unique suffix.`);
          }
          if (existingSerials.has(serial.toLowerCase())) {
            warnings.push(`Row #${idx + 2}: Serial "${serial}" matches an existing tubular. Please verify traceability.`);
          }

          return {
            tagNumber: tag,
            name,
            category,
            holeSection,
            outerDiameter: od,
            weightLbFt: weight,
            grade,
            connectionType: connection,
            quantityJoints: joints,
            lengthFt: length,
            serialNumber: serial,
            heatNumber: heat,
            currentLocation: location,
            rackLocation: rack,
            status,
            condition,
            lastInspectionDate: lastInsp,
            nextInspectionDue: nextInsp,
            inspectionCertNumber: certNo,
            cocNumber: cocNo,
            poNumber: poNo,
            doNumber: doNo,
            wellChargeCode: chargeCode,
            projectOwner: owner,
            purchaseCostUsd: cost,
            campaignId: activeCampaignId !== 'ALL' ? activeCampaignId : undefined,
            isNewPurchased: condition === 'New Purchased',
            isSurplus: false,
            monthsAtYard: 1,
            isLockedForTransfer: false,
          };
        });

        setImportPreviewData(mapped);
        setImportWarnings(warnings);
      } catch (err: any) {
        setImportErrorMsg(`Failed to parse file: ${err.message || 'Invalid format'}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Commit Excel Import to Database
  const handleCommitImport = () => {
    if (importPreviewData.length === 0) return;
    bulkAddItems(importPreviewData);
    logAuditTrail(
      'ITEM_CREATED',
      `BULK_IMPORT_${importPreviewData.length}_ITEMS`,
      `Successfully imported ${importPreviewData.length} tubular records into OCTG database from file "${importFileName}".`,
      `Imported by ${currentUser.name} (${currentUser.role})`
    );
    setIsImportModalOpen(false);
    setImportPreviewData([]);
    setImportFileName(null);
    setImportWarnings([]);
  };

  // Batch Status Change
  const handleBatchStatusSubmit = () => {
    if (selectedIds.length === 0) return;
    bulkUpdateStatus(selectedIds, quickStatusTarget, `Batch updated via Materials Management Hub by ${currentUser.name}`);
    logAuditTrail(
      'ITEM_UPDATED',
      `BATCH_STATUS_${selectedIds.length}_ITEMS`,
      `Bulk updated status of ${selectedIds.length} tubular items to "${quickStatusTarget}".`,
      `Action performed by ${currentUser.name} (${currentUser.role})`
    );
    setIsBatchStatusModalOpen(false);
    setSelectedIds([]);
  };

  // Batch Location Reassignment
  const handleBatchLocationSubmit = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach(id => {
      updateItem(id, {
        currentLocation: batchLocationTarget,
        rackLocation: batchRackTarget,
      });
    });
    logAuditTrail(
      'ITEM_UPDATED',
      `BATCH_LOCATION_${selectedIds.length}_ITEMS`,
      `Bulk relocated ${selectedIds.length} items to "${batchLocationTarget}" (${batchRackTarget}).`,
      `Action performed by ${currentUser.name} (${currentUser.role})`
    );
    setIsBatchLocationModalOpen(false);
    setSelectedIds([]);
  };

  // Bulk Delete
  const handleBulkDeleteSubmit = () => {
    if (selectedIds.length === 0) return;
    bulkDeleteItems(selectedIds);
    setIsBulkDeleteModalOpen(false);
    setSelectedIds([]);
  };

  // Single Delete
  const handleSingleDeleteSubmit = () => {
    if (!itemToDelete) return;
    deleteItem(itemToDelete.id);
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Materials Management Title */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Materials Management Hub
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    OCTG Master Database
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Complete CRUD management, bulk Excel import/export, API Spec 5CT / DS-1 tracking, yard storage racks, and multi-campaign inventory reconciliation.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (onOpenAddItem) {
                  onOpenAddItem();
                } else {
                  setItemToEdit(null);
                  setIsAddModalOpen(true);
                }
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:from-emerald-400 hover:to-teal-400 transition shadow-lg flex items-center space-x-2 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Tubular / Tool</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition flex items-center space-x-2 active:scale-95"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Import Excel / CSV</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition flex items-center space-x-2 active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export OCTG Database</span>
            </button>
          </div>
        </div>

        {/* Real-time Inventory KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] font-medium text-gray-400">Total OCTG Units</div>
            <div className="text-xl font-bold text-white mt-1 flex items-baseline space-x-1">
              <span>{metrics.totalCount}</span>
              <span className="text-[11px] text-gray-500 font-normal">({metrics.totalJoints} jts)</span>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] font-medium text-gray-400">Total Footage</div>
            <div className="text-xl font-bold text-cyan-400 mt-1">
              {metrics.totalFootage.toLocaleString()} <span className="text-[11px] text-gray-400">ft</span>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] font-medium text-gray-400">Total Steel Weight</div>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {metrics.totalTonnage.toLocaleString()} <span className="text-[11px] text-gray-400">MT</span>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] font-medium text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Field Ready Pool</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {metrics.serviceableCount}
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] font-medium text-amber-400 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Due / Overdue</span>
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {metrics.dueSoonCount + metrics.overdueCount}
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] font-medium text-purple-400 flex items-center space-x-1">
              <DollarSign className="w-3 h-3" />
              <span>Asset Valuation</span>
            </div>
            <div className="text-xl font-bold text-purple-300 mt-1">
              ${(metrics.totalValuation / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Toolbar Area */}
      <div className="bg-[#121217] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
        
        {/* Top Search Bar & Multi-Select Status Banner */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Tag #, S/N, Heat #, OD, Grade, Connection, PO/DO, Rack Bay, Owner..."
              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setQuickFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                quickFilter === 'ALL' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setQuickFilter('SERVICEABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
                quickFilter === 'SERVICEABLE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-emerald-400 hover:bg-white/5'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Field Ready</span>
            </button>
            <button
              onClick={() => setQuickFilter('DUE_INSPECTION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
                quickFilter === 'DUE_INSPECTION' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-gray-400 hover:text-amber-400 hover:bg-white/5'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Inspection Alerts</span>
            </button>
            <button
              onClick={() => setQuickFilter('QUARANTINED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
                quickFilter === 'QUARANTINED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-gray-400 hover:text-red-400 hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span>Quarantined</span>
            </button>
            <button
              onClick={() => setQuickFilter('HIGH_VALUE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
                quickFilter === 'HIGH_VALUE' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-purple-400 hover:bg-white/5'
              }`}
            >
              <DollarSign className="w-3 h-3 text-purple-400" />
              <span>High Value</span>
            </button>
          </div>
        </div>

        {/* Detailed Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-white/5 text-xs">
          
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-emerald-500 text-xs"
            >
              <option value="ALL">All Categories ({availableCategories.length})</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Storage Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-emerald-500 text-xs"
            >
              <option value="ALL">All Locations ({availableLocations.length})</option>
              {availableLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Hole Section</label>
            <select
              value={holeSectionFilter}
              onChange={(e) => setHoleSectionFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-emerald-500 text-xs"
            >
              <option value="ALL">All Hole Sections ({availableHoleSections.length})</option>
              {availableHoleSections.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Maintenance Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-emerald-500 text-xs"
            >
              <option value="ALL">All Statuses</option>
              {availableMaintenanceStatuses.map(stat => (
                <option key={stat} value={stat}>{stat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Equipment Condition</label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-emerald-500 text-xs"
            >
              <option value="ALL">All Conditions</option>
              {availableEquipmentConditions.map(cond => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Batch Action Floating Tray */}
        {selectedIds.length > 0 && (
          <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-300">
              <CheckSquare className="w-4 h-4" />
              <span>{selectedIds.length} item(s) selected for batch operations</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsBatchStatusModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition"
              >
                Batch Status Change
              </button>

              <button
                onClick={() => setIsBatchLocationModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/20 text-white border border-white/20 transition"
              >
                Relocate / Move
              </button>

              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white"
                title="Clear Selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Master OCTG Inventory Grid */}
      <div className="bg-[#121217] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              OCTG Master Inventory Records
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              ({filteredItems.length} records displayed)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
            >
              {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Select All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-black/50 border-b border-white/10 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                    onChange={handleSelectAll}
                    className="rounded bg-black/50 border-white/20 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('tagNumber')}>
                  <div className="flex items-center space-x-1">
                    <span>Tag / RFID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Description & Category</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3">Specs (OD / Wt / Grade / Conn)</th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('lengthFt')}>
                  <div className="flex items-center space-x-1">
                    <span>Qty & Footage</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3">Traceability (S/N & Heat)</th>
                <th className="p-3">Location & Rack</th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                  <div className="flex items-center space-x-1">
                    <span>Status & Inspection</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3">Documentation</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-semibold text-gray-400">No OCTG inventory items match current filters</p>
                    <p className="text-xs text-gray-600 mt-1">Try resetting search filters or import records via Excel/CSV.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isSelected = selectedIds.includes(item.id);
                  const isOverdue = item.status === 'Inspection Overdue';
                  const isQuarantined = item.status === 'Quarantined / Damaged';
                  const isFieldReady = item.status === 'Serviceable (Field Ready)';

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-white/[0.03] transition ${isSelected ? 'bg-emerald-500/10' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded bg-black/50 border-white/20 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 font-mono font-bold text-white">
                        <div className="flex items-center space-x-1.5">
                          <span>{item.tagNumber}</span>
                          {item.isSurplus && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              SURPLUS
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                          {item.holeSection}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-gray-200">{item.name}</div>
                        <div className="text-[10px] text-emerald-400 font-medium">
                          {item.category}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="text-gray-300 font-medium">
                          {item.outerDiameter} • {item.weightLbFt}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {item.grade} • <span className="text-cyan-400">{item.connectionType}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-mono font-bold text-white">
                          {item.lengthFt?.toLocaleString()} ft
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {item.quantityJoints || 1} joint(s)
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[11px]">
                        <div className="text-gray-300">SN: {item.serialNumber}</div>
                        <div className="text-gray-500">HT: {item.heatNumber}</div>
                      </td>

                      <td className="p-3">
                        <div className="text-gray-200 flex items-center space-x-1">
                          <Building2 className="w-3 h-3 text-emerald-400" />
                          <span>{item.currentLocation}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Rack: {item.rackLocation || 'Yard Bay'}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isFieldReady
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isOverdue || isQuarantined
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        {item.nextInspectionDue && (
                          <div className="text-[10px] text-gray-400 mt-1 flex items-center space-x-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Due: {item.nextInspectionDue}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-[10px] text-gray-400 space-y-0.5">
                        {item.poNumber && <div>PO: <span className="text-gray-200 font-mono">{item.poNumber}</span></div>}
                        {item.doNumber && <div>DO: <span className="text-gray-200 font-mono">{item.doNumber}</span></div>}
                        {item.wellChargeCode && <div>AFE: <span className="text-cyan-400 font-mono">{item.wellChargeCode}</span></div>}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          
                          {/* View Drawer */}
                          <button
                            onClick={() => onSelectItem && onSelectItem(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                            title="View Full Item Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Modal */}
                          <button
                            onClick={() => {
                              if (onOpenEditItem) {
                                onOpenEditItem(item);
                              } else {
                                setItemToEdit(item);
                                setIsAddModalOpen(true);
                              }
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition"
                            title="Edit OCTG Item Specs"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Single Item Delete Confirmation */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181f] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Item Removal</h3>
                <p className="text-xs text-gray-400">OCTG Master Inventory Action</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">{itemToDelete.tagNumber}</strong> ({itemToDelete.name}) from the OCTG inventory database? This will remove its historical tracking and cannot be undone.
            </p>

            <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1 text-xs font-mono">
              <div className="text-gray-400">Tag Number: <span className="text-white">{itemToDelete.tagNumber}</span></div>
              <div className="text-gray-400">Serial Number: <span className="text-white">{itemToDelete.serialNumber}</span></div>
              <div className="text-gray-400">Heat Number: <span className="text-white">{itemToDelete.heatNumber}</span></div>
              <div className="text-gray-400">Location: <span className="text-white">{itemToDelete.currentLocation}</span></div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSingleDeleteSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-lg flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Delete Confirmation */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181f] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Batch Delete Warning</h3>
                <p className="text-xs text-gray-400">Multi-item permanent purge</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              You are about to delete <strong className="text-red-400">{selectedIds.length}</strong> tubular item(s) from the OCTG master inventory. An audit trail record will be logged with your administrator timestamp.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-lg flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Purge ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Batch Status Update */}
      {isBatchStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181f] border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Batch Status Update</span>
              </div>
              <button onClick={() => setIsBatchStatusModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Apply new operational status across <strong className="text-white">{selectedIds.length}</strong> selected tubulars:
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Target Maintenance Status</label>
              <select
                value={quickStatusTarget}
                onChange={(e) => setQuickStatusTarget(e.target.value as MaintenanceStatus)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                {availableMaintenanceStatuses.map(stat => (
                  <option key={stat} value={stat}>{stat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsBatchStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchStatusSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition"
              >
                Apply to {selectedIds.length} Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Batch Location / Rack Transfer */}
      {isBatchLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181f] border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                <Truck className="w-5 h-5" />
                <span>Batch Location & Rack Relocation</span>
              </div>
              <button onClick={() => setIsBatchLocationModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Reassign yard storage location and storage rack for <strong className="text-white">{selectedIds.length}</strong> items:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Target Location</label>
                <select
                  value={batchLocationTarget}
                  onChange={(e) => setBatchLocationTarget(e.target.value as LocationType)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  {availableLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Target Storage Rack / Bay</label>
                <input
                  type="text"
                  value={batchRackTarget}
                  onChange={(e) => setBatchRackTarget(e.target.value)}
                  placeholder="e.g. Yard Bay D-12 or Rig Catwalk"
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsBatchLocationModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchLocationSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 transition"
              >
                Update Locations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Export Format Choice */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181f] border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <Download className="w-5 h-5" />
                <span>Export OCTG Database</span>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Export all <strong className="text-white">{filteredItems.length}</strong> matching tubular items with comprehensive API Spec 5CT parameters:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleExportData('xlsx')}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-left transition space-y-2 group"
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition" />
                <div>
                  <div className="text-xs font-bold text-white">Excel Spreadsheet</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">.XLSX Format</div>
                </div>
              </button>

              <button
                onClick={() => handleExportData('csv')}
                className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-left transition space-y-2 group"
              >
                <FileText className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition" />
                <div>
                  <div className="text-xs font-bold text-white">Standard CSV</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Comma-Separated Values</div>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Excel / CSV Import Wizard */}
      {isImportModalOpen && (
        <CsvImportModal onClose={() => setIsImportModalOpen(false)} />
      )}

    </div>
  );
};
