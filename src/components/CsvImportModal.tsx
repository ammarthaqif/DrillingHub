import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useDrilling } from '../context/DrillingContext';
import { 
  TubularItem, 
  ItemCategory, 
  HoleSection, 
  LocationType, 
  MaintenanceStatus, 
  EquipmentCondition 
} from '../types/drilling';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Layers, 
  FileText, 
  Copy, 
  Check, 
  Settings2, 
  Filter, 
  Search, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Building2, 
  Anchor, 
  Database, 
  Sparkles,
  ArrowRight,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tag,
  Hash
} from 'lucide-react';

interface CsvImportModalProps {
  onClose: () => void;
  defaultCampaignId?: string;
}

type ImportSourceTab = 'upload' | 'paste' | 'demo';
type DuplicateStrategy = 'skip' | 'update' | 'append_suffix';

interface ParsedRowItem extends Omit<TubularItem, 'id' | 'updatedAt' | 'qrCodeData' | 'inspectionHistory' | 'maintenanceLogs'> {
  _rowId: string;
  _selected: boolean;
  _status: 'valid' | 'warning' | 'error';
  _issues: string[];
  _isDuplicate: boolean;
  _existingItemId?: string;
}

// Field definitions for smart mapping
interface TargetFieldDef {
  key: string;
  label: string;
  required?: boolean;
  aliases: string[];
  description: string;
}

const TARGET_FIELDS: TargetFieldDef[] = [
  { key: 'tagNumber', label: 'Tag Number / Asset ID', required: true, aliases: ['tag number', 'tag', 'tagno', 'tag_number', 'asset tag', 'asset id', 'item tag', 'barcode'], description: 'Unique asset tag number' },
  { key: 'name', label: 'Item Description / Name', required: true, aliases: ['item description', 'description', 'name', 'item name', 'title'], description: 'Full description of the tubular / tool' },
  { key: 'category', label: 'Item Category', required: true, aliases: ['category', 'type', 'item category', 'equipment type'], description: 'Casing, Drill Pipe, Tubing, etc.' },
  { key: 'holeSection', label: 'Hole Section', aliases: ['hole section', 'holesection', 'section', 'hole size'], description: 'Applicable hole section' },
  { key: 'serialNumber', label: 'Serial Number', aliases: ['serial number', 'serial', 'sn', 'serialno', 'serial_number'], description: 'Manufacturer serial number' },
  { key: 'heatNumber', label: 'Heat Number', aliases: ['heat number', 'heat', 'ht', 'heatno', 'heat_number', 'mtr heat'], description: 'MTR mill heat number' },
  { key: 'outerDiameter', label: 'Outer Diameter (OD)', aliases: ['outer diameter', 'od', 'size', 'diameter', 'outerdiameter'], description: 'Outer diameter e.g. 13 3/8" or 5"' },
  { key: 'innerDiameter', label: 'Inner Diameter (ID)', aliases: ['inner diameter', 'id', 'innerdiameter', 'nominal id'], description: 'Inner diameter' },
  { key: 'weightLbFt', label: 'Weight (lb/ft)', aliases: ['weight (lb/ft)', 'weight', 'weightlbft', 'wt', 'nominal weight', 'ppf'], description: 'Nominal weight e.g. 68 lb/ft' },
  { key: 'grade', label: 'Material Grade', aliases: ['grade', 'steel grade', 'material grade', 'api grade'], description: 'Steel grade e.g. L-80, S-135, P-110' },
  { key: 'connectionType', label: 'Connection Type', aliases: ['connection', 'connectiontype', 'thread', 'thread type', 'end connection'], description: 'Premium thread or API connection' },
  { key: 'quantityJoints', label: 'Joint Count / Quantity', aliases: ['joint count', 'joints', 'quantity', 'qty', 'count'], description: 'Number of joints (default 1)' },
  { key: 'lengthFt', label: 'Length (ft)', aliases: ['length (ft)', 'length', 'lengthft', 'total length', 'tally length'], description: 'Total footage or joint length' },
  { key: 'currentLocation', label: 'Current Location', aliases: ['location', 'current location', 'yard', 'storage location', 'facility'], description: 'Current base yard or rig location' },
  { key: 'rackLocation', label: 'Rack / Bay Location', aliases: ['rack location', 'rack', 'bay', 'bin', 'yard rack', 'slot'], description: 'Rack or catwalk bay identifier' },
  { key: 'status', label: 'Maintenance Status', aliases: ['status', 'maintenance status', 'condition status'], description: 'Serviceable, Due for Inspection, etc.' },
  { key: 'condition', label: 'Equipment Condition', aliases: ['condition', 'equipment condition', 'physical condition'], description: 'New Purchased, Used - Good, etc.' },
  { key: 'cocNumber', label: 'COC Number', aliases: ['coc number', 'coc', 'certificate of conformance', 'mtr cert', 'coc #'], description: 'Certificate of Conformance' },
  { key: 'poNumber', label: 'PO Number', aliases: ['po number', 'po', 'purchase order', 'po #'], description: 'Purchase Order number' },
  { key: 'doNumber', label: 'DO Number', aliases: ['do number', 'do', 'delivery order', 'do #', 'manifest ref'], description: 'Delivery Order number' },
  { key: 'wellChargeCode', label: 'Well Charge Code / AFE', aliases: ['well charge code', 'charge code', 'afe', 'afe code', 'cost center', 'afe number'], description: 'AFE / Financial Cost Code' },
  { key: 'vismaNumber', label: 'VISMA ERP Number', aliases: ['visma number', 'visma', 'erp number', 'erp code', 'sap code'], description: 'ERP inventory code' },
  { key: 'tsrNumber', label: 'TSR Number', aliases: ['tsr number', 'tsr', 'technical service request'], description: 'Technical Service Request reference' },
  { key: 'projectOwner', label: 'Project Owner', aliases: ['project owner', 'project', 'owner', 'operator', 'client'], description: 'Operating asset owner' },
  { key: 'purchaseCostUsd', label: 'Unit Purchase Cost (USD)', aliases: ['purchase cost (usd)', 'purchase cost', 'cost', 'unit cost', 'unit price', 'cost (usd)', 'price (usd)'], description: 'Acquisition / purchase value' },
  { key: 'purchaseCurrency', label: 'Currency', aliases: ['currency', 'cost currency'], description: 'e.g. USD, MYR, EUR, GBP' },
  { key: 'lastInspectionDate', label: 'Last Inspection Date', aliases: ['last inspection date', 'last inspection', 'inspection date', 'inspected on'], description: 'YYYY-MM-DD inspection date' },
  { key: 'nextInspectionDue', label: 'Next Inspection Due', aliases: ['next inspection due', 'inspection due', 'next due', 'due date', 'expiry date'], description: 'YYYY-MM-DD recertification deadline' },
  { key: 'inspectionCertNumber', label: 'Inspection Cert #', aliases: ['inspection cert #', 'inspection cert', 'cert number', 'cert #', 'ndt cert'], description: 'Third-party QA/QC cert identifier' },
];

const SAMPLE_CSV_DATA = `Tag Number,Item Description,Category,Hole Section,Outer Diameter,Weight (lb/ft),Grade,Connection,Joint Count,Length (ft),Serial Number,Heat Number,Location,Rack Location,Status,Condition,Last Inspection Date,Next Inspection Due,Inspection Cert #,COC Number,PO Number,DO Number,Well Charge Code,Project Owner,Purchase Cost (USD)
CSG-1338-801,13-3/8" Casing 68# L-80 VAM TOP,Casing,17-1/2" Intermediate,13 3/8",68 lb/ft,L-80,VAM TOP,120,4800,SN-13CSG-9901,HT-88120A,Main Supply Base Yard,Yard Rack D-01,Serviceable (Field Ready),New Purchased,2026-07-01,2027-07-01,CERT-QA-8810,COC-2026-NIPPON-01,PO-45009123,DO-992301,AFE-2026-ALPHA-01,Petronas Carigali Sdn Bhd,245000
CSG-958-401,9-5/8" Casing 47# P-110 TenarisHydril Wedge 563,Casing,12-1/4" Main Hole,9 5/8",47 lb/ft,P-110,TenarisHydril Wedge 563,160,6400,SN-958CSG-7712,HT-44109B,Main Supply Base Yard,Yard Rack C-04,Serviceable (Field Ready),New Purchased,2026-06-15,2027-06-15,CERT-QA-8812,COC-2026-TENARIS-88,PO-45009155,DO-992350,AFE-2026-ALPHA-01,Petronas Carigali Sdn Bhd,312000
DP-500-701,5" Drill Pipe 19.5# S-135 NC50 Range 2,Drill Pipe,12-1/4" Main Hole,5",19.5 lb/ft,S-135,NC50,250,7750,SN-DP500-6601,HT-55102Z,Main Supply Base Yard,Rack Bay B-08,Due for Inspection,Used - Good,2025-08-10,2026-08-15,CERT-TUBOSCOPE-99,COC-2026-NOV-44,PO-45007788,DO-991244,AFE-2026-ALPHA-02,Petronas Carigali Sdn Bhd,189000
HWDP-500-201,5" Heavy Weight Drill Pipe 50# Spiral S-135 NC50,Heavy Weight Drill Pipe (HWDP),12-1/4" Main Hole,5",50 lb/ft,S-135,NC50,30,930,SN-HWDP-3310,HT-99211X,Main Supply Base Yard,Rack Bay B-12,Serviceable (Field Ready),Used - Good,2026-05-20,2027-05-20,CERT-NDT-5512,COC-2026-VAM-33,PO-45008810,DO-991800,AFE-2026-ALPHA-02,Petronas Carigali Sdn Bhd,84000
DC-800-101,8" Spiral Drill Collar 150# 4145H 6-5/8" Reg,Drill Collar,17-1/2" Intermediate,8",150 lb/ft,4145H,6-5/8" Reg,12,372,SN-DC800-1102,HT-11099K,Main Supply Base Yard,Collar Skid A-02,Serviceable (Field Ready),Used - Good,2026-04-10,2027-04-10,CERT-VTI-9911,COC-2026-HUNTING-12,PO-45006622,DO-990912,AFE-2026-ALPHA-01,Petronas Carigali Sdn Bhd,62000
TBG-312-301,3-1/2" Tubing 9.2# 13Cr-80 VAM 21,Tubing,8-1/2" Reservoir,3 1/2",9.2 lb/ft,13Cr,VAM 21,220,6820,SN-312TBG-4401,HT-77299M,Main Supply Base Yard,Tubing Shed E-01,Serviceable (Field Ready),New Purchased,2026-07-20,2027-07-20,CERT-QA-9022,COC-2026-VAM-90,PO-45009400,DO-992500,AFE-2026-ALPHA-01,Petronas Carigali Sdn Bhd,198000
PUP-1338-01,13-3/8" Casing Pup Joint 10ft 68# L-80 VAM TOP,Pup Joint,17-1/2" Intermediate,13 3/8",68 lb/ft,L-80,VAM TOP,4,40,SN-PUP13-001,HT-88120A,Main Supply Base Yard,Pup Rack D-02,Serviceable (Field Ready),New Purchased,2026-07-01,2027-07-01,CERT-QA-8810,COC-2026-NIPPON-01,PO-45009123,DO-992301,AFE-2026-ALPHA-01,Petronas Carigali Sdn Bhd,18000
XO-800-658,Crossover Sub 8" OD x 6-5/8" Reg Box x 4-1/2" IF Pin,Crossover Sub,17-1/2" Intermediate,8",120 lb/ft,4145H,6-5/8" Reg x NC50,3,12,SN-XO-9912,HT-33011B,Main Supply Base Yard,Sub Basket S-01,Serviceable (Field Ready),Used - Good,2026-06-01,2027-06-01,CERT-NDT-8819,COC-2026-NOV-77,PO-45007700,DO-991500,AFE-2026-ALPHA-01,Petronas Carigali Sdn Bhd,14500`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ onClose, defaultCampaignId }) => {
  const { 
    items, 
    bulkAddItems, 
    updateItem, 
    campaigns, 
    activeCampaignId, 
    availableHoleSections, 
    availableLocations, 
    availableCategories, 
    availableEquipmentConditions, 
    availableMaintenanceStatuses,
    logAuditTrail,
    currentUser,
    addSystemNotification
  } = useDrilling();

  const [activeSourceTab, setActiveSourceTab] = useState<ImportSourceTab>('upload');
  const [pastedCsvText, setPastedCsvText] = useState('');
  const [selectedDelimiter, setSelectedDelimiter] = useState<'auto' | ',' | ';' | '\t' | '|'>('auto');
  
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Column Mapping State
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [showMappingDrawer, setShowMappingDrawer] = useState(false);

  // Parsed Items
  const [parsedRows, setParsedRows] = useState<ParsedRowItem[]>([]);
  const [importFilter, setImportFilter] = useState<'all' | 'valid' | 'warning' | 'error' | 'duplicate'>('all');
  const [gridSearchQuery, setGridSearchQuery] = useState('');

  // Target Settings
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(defaultCampaignId || (activeCampaignId !== 'ALL' ? activeCampaignId : ''));
  const [selectedWellId, setSelectedWellId] = useState<string>('');
  const [defaultLocationOverride, setDefaultLocationOverride] = useState<LocationType | ''>('');
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip');

  // Copy Feedback
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [importSuccessResult, setImportSuccessResult] = useState<{
    addedCount: number;
    updatedCount: number;
    skippedCount: number;
    totalCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect delimiter from text
  const detectDelimiter = (text: string): string => {
    if (selectedDelimiter !== 'auto') return selectedDelimiter;
    const firstLine = text.split('\n')[0] || '';
    const commas = (firstLine.match(/,/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const pipes = (firstLine.match(/\|/g) || []).length;

    if (tabs > commas && tabs > semicolons) return '\t';
    if (semicolons > commas && semicolons > tabs) return ';';
    if (pipes > commas && pipes > semicolons) return '|';
    return ',';
  };

  // Helper to map header name to field key
  const autoMapHeaders = (headers: string[]): Record<string, string> => {
    const mappings: Record<string, string> = {};
    const usedHeaders = new Set<string>();

    TARGET_FIELDS.forEach(fieldDef => {
      // Find matching header
      const matchedHeader = headers.find(h => {
        if (usedHeaders.has(h)) return false;
        const normalized = h.toLowerCase().trim();
        return fieldDef.aliases.some(alias => alias === normalized || normalized.replace(/[^a-z0-9]/g, '') === alias.replace(/[^a-z0-9]/g, ''));
      });

      if (matchedHeader) {
        mappings[fieldDef.key] = matchedHeader;
        usedHeaders.add(matchedHeader);
      }
    });

    return mappings;
  };

  // Parse Raw JSON/Object rows into ParsedRowItem[]
  const processRawDataRows = (rows: any[], mappings: Record<string, string>) => {
    const existingTags = new Map<string, TubularItem>();
    const existingSerials = new Map<string, TubularItem>();

    items.forEach(it => {
      if (it.tagNumber) existingTags.set(it.tagNumber.trim().toLowerCase(), it);
      if (it.serialNumber) existingSerials.set(it.serialNumber.trim().toLowerCase(), it);
    });

    const parsed: ParsedRowItem[] = rows.map((rawRow, idx) => {
      const issues: string[] = [];
      let rowStatus: 'valid' | 'warning' | 'error' = 'valid';

      const getValue = (fieldKey: string): string => {
        const headerKey = mappings[fieldKey];
        if (!headerKey || rawRow[headerKey] === undefined || rawRow[headerKey] === null) return '';
        return String(rawRow[headerKey]).trim();
      };

      // 1. Tag Number
      let tagNumber = getValue('tagNumber');
      if (!tagNumber) {
        tagNumber = `TAG-IMP-${Date.now().toString().slice(-4)}-${idx + 101}`;
        issues.push('Auto-generated tag # (original was blank)');
        rowStatus = 'warning';
      }

      // 2. Name / Description
      let name = getValue('name');
      if (!name) {
        name = `Tubular Item (${getValue('category') || 'OCTG'})`;
        issues.push('Defaulted description');
        if (rowStatus === 'valid') rowStatus = 'warning';
      }

      // 3. Category
      let category = getValue('category') as ItemCategory;
      if (!category || !availableCategories.includes(category)) {
        category = 'Casing';
        issues.push('Category defaulted to "Casing"');
        if (rowStatus === 'valid') rowStatus = 'warning';
      }

      // 4. Hole Section
      let holeSection = getValue('holeSection') as HoleSection;
      if (!holeSection || !availableHoleSections.includes(holeSection)) {
        holeSection = '17-1/2" Intermediate';
      }

      // 5. Technical specs
      const outerDiameter = getValue('outerDiameter') || '13 3/8"';
      const innerDiameter = getValue('innerDiameter') || undefined;
      const weightLbFt = getValue('weightLbFt') || '68 lb/ft';
      const grade = getValue('grade') || 'L-80';
      const connectionType = getValue('connectionType') || 'VAM TOP';
      
      const rawJoints = getValue('quantityJoints');
      const quantityJoints = Math.max(1, parseInt(rawJoints.replace(/[^0-9]/g, '') || '1', 10));

      const rawLength = getValue('lengthFt');
      let lengthFt = parseFloat(rawLength.replace(/[^0-9.]/g, '') || '0');
      if (lengthFt <= 0) {
        lengthFt = quantityJoints * 40;
      }

      // 6. Serial & Heat
      const serialNumber = getValue('serialNumber') || `SN-${tagNumber.replace(/[^A-Za-z0-9]/g, '')}-${idx + 1}`;
      const heatNumber = getValue('heatNumber') || `HT-M${Date.now().toString().slice(-4)}`;

      // 7. Location & Status
      let currentLocation = (defaultLocationOverride || getValue('currentLocation') || 'Main Supply Base Yard') as LocationType;
      if (!availableLocations.includes(currentLocation)) {
        currentLocation = 'Main Supply Base Yard';
      }
      const rackLocation = getValue('rackLocation') || 'Main Stacking Bay';
      
      let itemStatus = getValue('status') as MaintenanceStatus;
      if (!itemStatus || !availableMaintenanceStatuses.includes(itemStatus)) {
        itemStatus = 'Serviceable (Field Ready)';
      }

      let condition = getValue('condition') as EquipmentCondition;
      if (!condition || !availableEquipmentConditions.includes(condition)) {
        condition = 'New Purchased';
      }

      // 8. Documentation & Finance
      const cocNumber = getValue('cocNumber');
      const poNumber = getValue('poNumber');
      const doNumber = getValue('doNumber');
      const wellChargeCode = getValue('wellChargeCode');
      const vismaNumber = getValue('vismaNumber');
      const tsrNumber = getValue('tsrNumber');
      const projectOwner = getValue('projectOwner') || 'Petronas Carigali / Drilling Asset Pool';
      
      const rawCost = getValue('purchaseCostUsd');
      const purchaseCostUsd = parseFloat(rawCost.replace(/[^0-9.]/g, '') || '0') || undefined;
      const purchaseCurrency = getValue('purchaseCurrency') || 'USD';

      // 9. Inspection
      const lastInspectionDate = getValue('lastInspectionDate') || new Date().toISOString().split('T')[0];
      const nextInspectionDue = getValue('nextInspectionDue') || '2027-07-01';
      const inspectionCertNumber = getValue('inspectionCertNumber') || `CERT-IMP-${idx + 100}`;

      // Duplicate detection against existing inventory
      const existingTagMatch = existingTags.get(tagNumber.toLowerCase());
      const existingSerialMatch = serialNumber ? existingSerials.get(serialNumber.toLowerCase()) : null;
      const isDuplicate = Boolean(existingTagMatch || existingSerialMatch);
      const existingItemId = existingTagMatch?.id || existingSerialMatch?.id;

      if (isDuplicate) {
        issues.push(`Duplicate tag/serial in inventory (${existingTagMatch ? 'Tag exists' : 'Serial exists'})`);
        if (rowStatus === 'valid') rowStatus = 'warning';
      }

      return {
        _rowId: `parsed-row-${idx}-${Date.now()}`,
        _selected: true,
        _status: rowStatus,
        _issues: issues,
        _isDuplicate: isDuplicate,
        _existingItemId: existingItemId,
        tagNumber,
        name,
        category,
        holeSection,
        outerDiameter,
        innerDiameter,
        weightLbFt,
        grade,
        connectionType,
        quantityJoints,
        lengthFt,
        serialNumber,
        heatNumber,
        currentLocation,
        rackLocation,
        status: itemStatus,
        condition,
        isNewPurchased: condition === 'New Purchased',
        isSurplus: false,
        cocNumber,
        poNumber,
        doNumber,
        wellChargeCode,
        vismaNumber,
        tsrNumber,
        projectOwner,
        purchaseCostUsd,
        purchaseCurrency,
        lastInspectionDate,
        nextInspectionDue,
        inspectionCertNumber,
        campaignId: selectedCampaignId || undefined,
        wellId: selectedWellId || undefined,
      };
    });

    setParsedRows(parsed);
  };

  // Parse File (Excel, CSV, TSV)
  const handleParseFile = (file: File) => {
    setParseError(null);
    setFileName(file.name);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse JSON
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          setParseError('The uploaded file does not contain any data rows.');
          setIsParsing(false);
          return;
        }

        const headers = Object.keys(rawJson[0]);
        setRawHeaders(headers);
        const mapped = autoMapHeaders(headers);
        setColumnMappings(mapped);
        processRawDataRows(rawJson, mapped);
        setIsParsing(false);
      } catch (err: any) {
        setParseError(`Error parsing spreadsheet: ${err?.message || 'Invalid file format.'}`);
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read file.');
      setIsParsing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // Parse Raw Pasted Text
  const handleParsePastedText = () => {
    if (!pastedCsvText.trim()) {
      setParseError('Please paste your CSV or spreadsheet text first.');
      return;
    }
    setParseError(null);
    setIsParsing(true);
    setFileName('Pasted-Spreadsheet-Data.csv');

    try {
      const delimiter = detectDelimiter(pastedCsvText);
      const lines = pastedCsvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
      
      if (lines.length < 2) {
        setParseError('Pasted data must contain at least 1 header line and 1 data line.');
        setIsParsing(false);
        return;
      }

      // Simple robust CSV line splitter handling quoted strings
      const splitCsvLine = (line: string, delim: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === delim && !inQuotes) {
            result.push(cur.trim().replace(/^["']|["']$/g, ''));
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        return result;
      };

      const headers = splitCsvLine(lines[0], delimiter);
      setRawHeaders(headers);
      const mapped = autoMapHeaders(headers);
      setColumnMappings(mapped);

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = splitCsvLine(lines[i], delimiter);
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }

      processRawDataRows(rows, mapped);
      setIsParsing(false);
    } catch (err: any) {
      setParseError(`Error parsing pasted CSV text: ${err?.message || 'Format error.'}`);
      setIsParsing(false);
    }
  };

  // Load Demo Data
  const handleLoadDemoData = () => {
    setPastedCsvText(SAMPLE_CSV_DATA);
    setFileName('DrillCore_Standard_Tubular_Sample.csv');
    setParseError(null);
    setIsParsing(true);

    setTimeout(() => {
      const lines = SAMPLE_CSV_DATA.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      setRawHeaders(headers);
      const mapped = autoMapHeaders(headers);
      setColumnMappings(mapped);

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }

      processRawDataRows(rows, mapped);
      setIsParsing(false);
    }, 150);
  };

  // Re-map column handler
  const handleColumnMappingChange = (fieldKey: string, headerName: string) => {
    const updated = { ...columnMappings, [fieldKey]: headerName };
    setColumnMappings(updated);

    // Re-process parsed data if rows exist
    if (parsedRows.length > 0) {
      // Re-extract raw objects
      const rawRows = parsedRows.map(r => {
        const raw: Record<string, any> = {};
        rawHeaders.forEach(h => {
          // Find matching field
          const entry = Object.entries(columnMappings).find(([_, hdr]) => hdr === h);
          if (entry) {
            raw[h] = (r as any)[entry[0]];
          } else {
            raw[h] = '';
          }
        });
        return raw;
      });
      processRawDataRows(rawRows, updated);
    }
  };

  // Inline Cell Edit
  const handleUpdateRowCell = (rowId: string, field: keyof TubularItem, value: any) => {
    setParsedRows(prev => prev.map(r => {
      if (r._rowId === rowId) {
        return {
          ...r,
          [field]: value
        };
      }
      return r;
    }));
  };

  // Toggle Row Selection
  const handleToggleRowSelection = (rowId: string) => {
    setParsedRows(prev => prev.map(r => r._rowId === rowId ? { ...r, _selected: !r._selected } : r));
  };

  const handleSelectAllRows = (checked: boolean) => {
    setParsedRows(prev => prev.map(r => ({ ...r, _selected: checked })));
  };

  // Filtered Display Rows in Preview Grid
  const displayRows = useMemo(() => {
    return parsedRows.filter(row => {
      if (importFilter === 'valid' && row._status !== 'valid') return false;
      if (importFilter === 'warning' && row._status !== 'warning') return false;
      if (importFilter === 'error' && row._status !== 'error') return false;
      if (importFilter === 'duplicate' && !row._isDuplicate) return false;

      if (gridSearchQuery.trim()) {
        const q = gridSearchQuery.toLowerCase();
        const tagMatch = row.tagNumber?.toLowerCase().includes(q);
        const nameMatch = row.name?.toLowerCase().includes(q);
        const serialMatch = row.serialNumber?.toLowerCase().includes(q);
        const gradeMatch = row.grade?.toLowerCase().includes(q);
        const connMatch = row.connectionType?.toLowerCase().includes(q);
        return tagMatch || nameMatch || serialMatch || gradeMatch || connMatch;
      }
      return true;
    });
  }, [parsedRows, importFilter, gridSearchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = parsedRows.length;
    const selected = parsedRows.filter(r => r._selected).length;
    const valid = parsedRows.filter(r => r._status === 'valid').length;
    const warning = parsedRows.filter(r => r._status === 'warning').length;
    const error = parsedRows.filter(r => r._status === 'error').length;
    const duplicates = parsedRows.filter(r => r._isDuplicate).length;

    return { total, selected, valid, warning, error, duplicates };
  }, [parsedRows]);

  // Download Sample Templates
  const handleDownloadCsvTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_DATA], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'DrillCore_Tubular_Inventory_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcelTemplate = () => {
    const lines = SAMPLE_CSV_DATA.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const dataRows = lines.slice(1).map(l => {
      const values = l.split(',').map(v => v.trim());
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || '';
      });
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tubular_Template');
    XLSX.writeFile(workbook, 'DrillCore_Tubular_Inventory_Template.xlsx');
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_CSV_DATA);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  // Commit Import
  const handleExecuteImport = () => {
    const selectedRows = parsedRows.filter(r => r._selected);
    if (selectedRows.length === 0) return;

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const itemsToAdd: Omit<TubularItem, 'id' | 'updatedAt' | 'qrCodeData' | 'inspectionHistory' | 'maintenanceLogs'>[] = [];

    // Find campaign and well objects for auto-naming
    const activeCamp = campaigns.find(c => c.id === selectedCampaignId);
    const activeWell = activeCamp?.wells.find(w => w.id === selectedWellId);

    selectedRows.forEach(row => {
      // Check if duplicate
      if (row._isDuplicate && row._existingItemId) {
        if (duplicateStrategy === 'skip') {
          skippedCount++;
          return;
        }

        if (duplicateStrategy === 'update') {
          // Update existing item
          updateItem(row._existingItemId, {
            name: row.name,
            category: row.category,
            holeSection: row.holeSection,
            outerDiameter: row.outerDiameter,
            innerDiameter: row.innerDiameter,
            weightLbFt: row.weightLbFt,
            grade: row.grade,
            connectionType: row.connectionType,
            quantityJoints: row.quantityJoints,
            lengthFt: row.lengthFt,
            serialNumber: row.serialNumber,
            heatNumber: row.heatNumber,
            currentLocation: row.currentLocation,
            rackLocation: row.rackLocation,
            status: row.status,
            condition: row.condition,
            cocNumber: row.cocNumber,
            poNumber: row.poNumber,
            doNumber: row.doNumber,
            wellChargeCode: row.wellChargeCode,
            vismaNumber: row.vismaNumber,
            tsrNumber: row.tsrNumber,
            projectOwner: row.projectOwner,
            purchaseCostUsd: row.purchaseCostUsd,
            purchaseCurrency: row.purchaseCurrency,
            campaignId: selectedCampaignId || row.campaignId,
            campaignName: activeCamp?.name || row.campaignName,
            wellId: selectedWellId || row.wellId,
            wellName: activeWell?.name || row.wellName,
          });
          updatedCount++;
          return;
        }

        if (duplicateStrategy === 'append_suffix') {
          row.tagNumber = `${row.tagNumber}-IMP${Math.floor(100 + Math.random() * 900)}`;
        }
      }

      // Add as new item
      itemsToAdd.push({
        tagNumber: row.tagNumber,
        name: row.name,
        category: row.category,
        holeSection: row.holeSection,
        outerDiameter: row.outerDiameter,
        innerDiameter: row.innerDiameter,
        weightLbFt: row.weightLbFt,
        grade: row.grade,
        connectionType: row.connectionType,
        quantityJoints: row.quantityJoints,
        lengthFt: row.lengthFt,
        serialNumber: row.serialNumber,
        heatNumber: row.heatNumber,
        currentLocation: row.currentLocation,
        rackLocation: row.rackLocation,
        status: row.status,
        condition: row.condition,
        isNewPurchased: row.condition === 'New Purchased',
        isSurplus: false,
        cocNumber: row.cocNumber,
        poNumber: row.poNumber,
        doNumber: row.doNumber,
        wellChargeCode: row.wellChargeCode,
        vismaNumber: row.vismaNumber,
        tsrNumber: row.tsrNumber,
        projectOwner: row.projectOwner,
        purchaseCostUsd: row.purchaseCostUsd,
        purchaseCurrency: row.purchaseCurrency,
        lastInspectionDate: row.lastInspectionDate,
        nextInspectionDue: row.nextInspectionDue,
        inspectionCertNumber: row.inspectionCertNumber,
        campaignId: selectedCampaignId || undefined,
        campaignName: activeCamp?.name || undefined,
        wellId: selectedWellId || undefined,
        wellName: activeWell?.name || undefined,
      });
      addedCount++;
    });

    if (itemsToAdd.length > 0) {
      bulkAddItems(itemsToAdd);
    }

    logAuditTrail(
      'ITEM_CREATED',
      `IMPORT-${Date.now().toString().slice(-6)}`,
      `Bulk imported ${addedCount} new items, updated ${updatedCount} existing items from ${fileName || 'CSV data'}. Strategy: ${duplicateStrategy}.`,
      `User: ${currentUser?.name} (${currentUser?.role})`
    );

    addSystemNotification({
      title: 'CSV Inventory Import Completed',
      message: `Successfully processed ${selectedRows.length} tubular records: ${addedCount} new additions, ${updatedCount} updates, ${skippedCount} skipped.`,
      category: 'GENERAL',
      severity: 'success',
      linkNav: 'inventory',
    });

    setImportSuccessResult({
      addedCount,
      updatedCount,
      skippedCount,
      totalCount: selectedRows.length,
    });
  };

  const selectedCampaignObj = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">Tubular Inventory CSV & Spreadsheet Importer</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  API Spec 5CT / DS-1
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Mass-upload casing, drill pipe, tubing, and tool records from CSV, Excel, or tabular clipboard data
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
            title="Close Importer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner View */}
        {importSuccessResult ? (
          <div className="p-8 space-y-6 text-center max-w-xl mx-auto my-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Import Successfully Processed</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Your spreadsheet records have been verified, standardized, and synchronized into the live inventory database and Firestore vault.
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-white/5 border border-white/10 rounded-xl text-center">
              <div className="p-3 bg-black/40 rounded-lg">
                <span className="text-2xl font-bold text-emerald-400">{importSuccessResult.addedCount}</span>
                <p className="text-[11px] text-gray-400 mt-1">New Items Added</p>
              </div>
              <div className="p-3 bg-black/40 rounded-lg">
                <span className="text-2xl font-bold text-cyan-400">{importSuccessResult.updatedCount}</span>
                <p className="text-[11px] text-gray-400 mt-1">Existing Updated</p>
              </div>
              <div className="p-3 bg-black/40 rounded-lg">
                <span className="text-2xl font-bold text-amber-400">{importSuccessResult.skippedCount}</span>
                <p className="text-[11px] text-gray-400 mt-1">Duplicates Skipped</p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => {
                  setImportSuccessResult(null);
                  setParsedRows([]);
                  setFileName(null);
                  setPastedCsvText('');
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-semibold transition flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Import Another File</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-lg shadow-amber-500/20 flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Done & Return to Inventory</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* Top Step Banner & Download Bar */}
            <div className="bg-gradient-to-r from-amber-500/10 via-[#15151a] to-emerald-500/10 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-black font-extrabold text-[10px] uppercase">
                    Step 1
                  </span>
                  <p className="text-xs font-bold text-white">Choose Ingestion Source or Use Pre-formatted Template</p>
                </div>
                <p className="text-[11px] text-gray-400">
                  Supports automated header matching for Tag, Serial, Heat, Grade, Connection, OD, Weight, Length, COC, PO, DO, and AFE codes.
                </p>
              </div>

              {/* Template Actions */}
              <div className="flex items-center space-x-2 flex-wrap gap-1.5 shrink-0">
                <button
                  onClick={handleDownloadCsvTemplate}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-semibold transition flex items-center space-x-1.5 border border-white/10 shadow-sm"
                  title="Download standard CSV spreadsheet template"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download .CSV</span>
                </button>
                <button
                  onClick={handleDownloadExcelTemplate}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-semibold transition flex items-center space-x-1.5 border border-white/10 shadow-sm"
                  title="Download standard Excel .xlsx spreadsheet template"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download .XLSX</span>
                </button>
                <button
                  onClick={handleCopyTemplate}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-semibold transition flex items-center space-x-1.5 border border-white/10 shadow-sm"
                  title="Copy sample CSV format to clipboard"
                >
                  {copiedTemplate ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Copy Headers</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ingestion Mode Selector Tabs */}
            <div className="flex border-b border-white/10 space-x-2">
              <button
                onClick={() => setActiveSourceTab('upload')}
                className={`pb-3 px-4 text-xs font-semibold transition flex items-center space-x-2 border-b-2 ${
                  activeSourceTab === 'upload'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload File (.csv / .xlsx / .tsv)</span>
              </button>
              <button
                onClick={() => setActiveSourceTab('paste')}
                className={`pb-3 px-4 text-xs font-semibold transition flex items-center space-x-2 border-b-2 ${
                  activeSourceTab === 'paste'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Paste Raw CSV / Table Text</span>
              </button>
              <button
                onClick={() => setActiveSourceTab('demo')}
                className={`pb-3 px-4 text-xs font-semibold transition flex items-center space-x-2 border-b-2 ${
                  activeSourceTab === 'demo'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Sample Tubular Dataset</span>
              </button>
            </div>

            {/* Ingestion Tab 1: File Upload */}
            {activeSourceTab === 'upload' && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleParseFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center space-y-3 cursor-pointer ${
                  isDragOver 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'border-white/15 bg-white/[0.02] hover:border-amber-500/50 hover:bg-white/[0.04]'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".csv, .tsv, .txt, .xlsx, .xls" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleParseFile(e.target.files[0]);
                    }
                  }} 
                  className="hidden" 
                />

                <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {fileName ? `Selected file: ${fileName}` : 'Drag & drop your CSV or Excel file here'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Accepts standard delimited spreadsheets (<code className="text-amber-400 font-mono">.csv</code>, <code className="text-emerald-400 font-mono">.xlsx</code>, <code className="text-cyan-400 font-mono">.tsv</code>, <code className="text-purple-400 font-mono">.xls</code>)
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition pointer-events-none inline-flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  <span>Browse Local Files</span>
                </button>
              </div>
            )}

            {/* Ingestion Tab 2: Paste Raw CSV */}
            {activeSourceTab === 'paste' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Paste spreadsheet or CSV text content below:</span>
                  </label>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-400">Delimiter:</span>
                    <select
                      value={selectedDelimiter}
                      onChange={(e) => setSelectedDelimiter(e.target.value as any)}
                      className="bg-black/50 border border-white/10 text-gray-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
                    >
                      <option value="auto">Auto-detect</option>
                      <option value=",">Comma (,)</option>
                      <option value=";">Semicolon (;)</option>
                      <option value="	">Tab (\t)</option>
                      <option value="|">Pipe (|)</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={pastedCsvText}
                  onChange={(e) => setPastedCsvText(e.target.value)}
                  placeholder="Tag Number, Item Description, Category, Outer Diameter, Grade, Connection, Length (ft)..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-gray-200 font-mono placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                />

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setPastedCsvText('')}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Clear Text
                  </button>
                  <button
                    onClick={handleParsePastedText}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition flex items-center space-x-2 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Parse Pasted Content</span>
                  </button>
                </div>
              </div>
            )}

            {/* Ingestion Tab 3: Demo Data */}
            {activeSourceTab === 'demo' && (
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Pre-built Offshore Drilling Tubular Dataset</span>
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Instantly populate realistic 13-3/8" Casing, 9-5/8" Casing, 5" Drill Pipe, Heavy Weight Drill Pipe, 8" Drill Collars, 3-1/2" 13Cr Tubing, Pup Joints, and Crossover Subs with valid heat numbers, MTR certificates, PO numbers, and AFE codes.
                    </p>
                  </div>
                  <button
                    onClick={handleLoadDemoData}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition flex items-center space-x-2 shrink-0 shadow"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Load Demo Dataset</span>
                  </button>
                </div>

                <div className="p-3 bg-black/40 border border-white/5 rounded-xl font-mono text-[11px] text-gray-300 max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{SAMPLE_CSV_DATA.split('\n').slice(0, 4).join('\n') + '\n...'}</pre>
                </div>
              </div>
            )}

            {/* Parse Error Banner */}
            {parseError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Target Settings & Campaign Assignment Bar */}
            {parsedRows.length > 0 && (
              <div className="bg-[#15151a] border border-white/10 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500 text-black font-extrabold text-[10px] uppercase">
                      Step 2
                    </span>
                    <h3 className="text-xs font-bold text-white">Import Configuration & Duplicate Handling</h3>
                  </div>

                  <button
                    onClick={() => setShowMappingDrawer(!showMappingDrawer)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>{showMappingDrawer ? 'Hide Column Mapping' : 'Adjust Column Mapping'}</span>
                    {showMappingDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Column Mapping Accordion */}
                {showMappingDrawer && (
                  <div className="p-4 bg-black/50 border border-white/10 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-gray-300">
                        Mapped Detected Columns ({Object.keys(columnMappings).length} fields auto-assigned)
                      </p>
                      <span className="text-[10px] text-gray-400">Match raw spreadsheet headers to Tubular system attributes</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                      {TARGET_FIELDS.map(field => {
                        const currentHeader = columnMappings[field.key] || '';
                        return (
                          <div key={field.key} className="p-2 bg-white/5 border border-white/5 rounded-lg space-y-1">
                            <label className="text-[10px] font-semibold text-gray-300 flex items-center justify-between">
                              <span>{field.label}</span>
                              {field.required && <span className="text-amber-400">*</span>}
                            </label>
                            <select
                              value={currentHeader}
                              onChange={(e) => handleColumnMappingChange(field.key, e.target.value)}
                              className="w-full bg-black/80 border border-white/10 text-gray-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                            >
                              <option value="">-- Not Mapped --</option>
                              {rawHeaders.map(hdr => (
                                <option key={hdr} value={hdr}>{hdr}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  
                  {/* Campaign Linkage */}
                  <div className="space-y-1">
                    <label className="text-gray-400 font-medium flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Assign to Campaign:</span>
                    </label>
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => {
                        setSelectedCampaignId(e.target.value);
                        setSelectedWellId('');
                      }}
                      className="w-full bg-black/50 border border-white/10 text-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- General Inventory Pool --</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.code} ({c.name})</option>
                      ))}
                    </select>
                  </div>

                  {/* Well Linkage */}
                  <div className="space-y-1">
                    <label className="text-gray-400 font-medium flex items-center space-x-1">
                      <Anchor className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Assign to Well:</span>
                    </label>
                    <select
                      value={selectedWellId}
                      disabled={!selectedCampaignId}
                      onChange={(e) => setSelectedWellId(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        selectedCampaignId
                          ? 'bg-black/50 border-white/10 text-gray-200 focus:border-amber-500'
                          : 'bg-black/20 border-white/5 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <option value="">-- All Campaign Wells --</option>
                      {selectedCampaignObj?.wells.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                      ))}
                    </select>
                  </div>

                  {/* Location Override */}
                  <div className="space-y-1">
                    <label className="text-gray-400 font-medium flex items-center space-x-1">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Default Storage Yard:</span>
                    </label>
                    <select
                      value={defaultLocationOverride}
                      onChange={(e) => setDefaultLocationOverride(e.target.value as any)}
                      className="w-full bg-black/50 border border-white/10 text-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Keep Spreadsheet Location</option>
                      {availableLocations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Duplicate Strategy */}
                  <div className="space-y-1">
                    <label className="text-gray-400 font-medium flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Duplicate Tag / Serial:</span>
                    </label>
                    <select
                      value={duplicateStrategy}
                      onChange={(e) => setDuplicateStrategy(e.target.value as any)}
                      className="w-full bg-black/50 border border-white/10 text-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="skip">Skip Duplicates (Recommended)</option>
                      <option value="update">Update Existing Items</option>
                      <option value="append_suffix">Append Unique Suffix</option>
                    </select>
                  </div>

                </div>

              </div>
            )}

            {/* Parsed Pre-Import Data Grid */}
            {parsedRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/10">
                  
                  {/* Step & Filter Tabs */}
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-black font-extrabold text-[10px] uppercase mr-1">
                      Step 3
                    </span>
                    <span className="text-xs font-bold text-white mr-2">Verified Records Grid:</span>

                    <button
                      onClick={() => setImportFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        importFilter === 'all' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      All ({stats.total})
                    </button>
                    <button
                      onClick={() => setImportFilter('valid')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        importFilter === 'valid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-emerald-400'
                      }`}
                    >
                      Valid ({stats.valid})
                    </button>
                    {stats.warning > 0 && (
                      <button
                        onClick={() => setImportFilter('warning')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          importFilter === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-amber-400'
                        }`}
                      >
                        Warnings ({stats.warning})
                      </button>
                    )}
                    {stats.duplicates > 0 && (
                      <button
                        onClick={() => setImportFilter('duplicate')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          importFilter === 'duplicate' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-purple-400'
                        }`}
                      >
                        Duplicates ({stats.duplicates})
                      </button>
                    )}
                  </div>

                  {/* Search inside preview */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={gridSearchQuery}
                      onChange={(e) => setGridSearchQuery(e.target.value)}
                      placeholder="Search preview records..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                </div>

                {/* Table Data Container */}
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/40">
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="sticky top-0 bg-[#141417] text-gray-400 border-b border-white/10 uppercase text-[10px] tracking-wider z-10">
                        <tr>
                          <th className="p-2.5 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={parsedRows.length > 0 && parsedRows.every(r => r._selected)}
                              onChange={(e) => handleSelectAllRows(e.target.checked)}
                              className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0 cursor-pointer"
                            />
                          </th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Tag Number</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Hole Section</th>
                          <th className="p-2.5">OD / Wt / Grade</th>
                          <th className="p-2.5">Connection</th>
                          <th className="p-2.5">Qty / Footage</th>
                          <th className="p-2.5">Serial / Heat #</th>
                          <th className="p-2.5">Storage Location</th>
                          <th className="p-2.5">AFE / PO / COC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-200 font-mono">
                        {displayRows.map((row) => (
                          <tr key={row._rowId} className={`hover:bg-white/5 transition ${!row._selected ? 'opacity-40' : ''}`}>
                            
                            {/* Checkbox */}
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={row._selected}
                                onChange={() => handleToggleRowSelection(row._rowId)}
                                className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0 cursor-pointer"
                              />
                            </td>

                            {/* Status Badge */}
                            <td className="p-2.5 whitespace-nowrap font-sans">
                              {row._isDuplicate ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30" title={row._issues.join(', ')}>
                                  <Layers className="w-3 h-3" />
                                  <span>Duplicate</span>
                                </span>
                              ) : row._status === 'valid' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Valid</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30" title={row._issues.join(', ')}>
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Warning</span>
                                </span>
                              )}
                            </td>

                            {/* Tag Number (Editable) */}
                            <td className="p-2.5 font-bold text-amber-400 whitespace-nowrap">
                              <input
                                type="text"
                                value={row.tagNumber}
                                onChange={(e) => handleUpdateRowCell(row._rowId, 'tagNumber', e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-amber-500/50 focus:border-amber-500 focus:outline-none text-amber-400 font-bold w-28 px-1 py-0.5 rounded"
                              />
                            </td>

                            {/* Description (Editable) */}
                            <td className="p-2.5 font-sans font-medium text-white max-w-xs truncate">
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => handleUpdateRowCell(row._rowId, 'name', e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-amber-500 focus:outline-none text-white w-48 px-1 py-0.5 rounded"
                              />
                            </td>

                            {/* Category (Select) */}
                            <td className="p-2.5 font-sans whitespace-nowrap">
                              <select
                                value={row.category}
                                onChange={(e) => handleUpdateRowCell(row._rowId, 'category', e.target.value as any)}
                                className="bg-black/50 border border-white/10 text-gray-200 text-[11px] rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500"
                              >
                                {availableCategories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </td>

                            {/* Hole Section (Select) */}
                            <td className="p-2.5 font-sans whitespace-nowrap">
                              <select
                                value={row.holeSection}
                                onChange={(e) => handleUpdateRowCell(row._rowId, 'holeSection', e.target.value as any)}
                                className="bg-black/50 border border-white/10 text-gray-200 text-[11px] rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500"
                              >
                                {availableHoleSections.map(sec => (
                                  <option key={sec} value={sec}>{sec}</option>
                                ))}
                              </select>
                            </td>

                            {/* OD / Wt / Grade */}
                            <td className="p-2.5 whitespace-nowrap text-gray-300">
                              <span>{row.outerDiameter}</span> • <span>{row.weightLbFt}</span> • <span className="font-semibold text-white">{row.grade}</span>
                            </td>

                            {/* Connection */}
                            <td className="p-2.5 whitespace-nowrap text-cyan-300 font-sans">
                              {row.connectionType}
                            </td>

                            {/* Qty & Length */}
                            <td className="p-2.5 whitespace-nowrap">
                              <span className="font-bold text-white">{row.quantityJoints} jts</span>
                              <span className="text-gray-400 ml-1">({row.lengthFt} ft)</span>
                            </td>

                            {/* Serial & Heat */}
                            <td className="p-2.5 whitespace-nowrap text-gray-300 font-mono text-[10px]">
                              <div>SN: {row.serialNumber || 'N/A'}</div>
                              <div>HT: {row.heatNumber || 'N/A'}</div>
                            </td>

                            {/* Storage Location */}
                            <td className="p-2.5 font-sans whitespace-nowrap text-gray-300">
                              <div className="text-white font-medium">{row.currentLocation}</div>
                              <div className="text-[10px] text-gray-400">{row.rackLocation}</div>
                            </td>

                            {/* AFE / PO / COC */}
                            <td className="p-2.5 font-sans whitespace-nowrap text-[10px] text-gray-400">
                              {row.wellChargeCode && <div>AFE: <span className="text-amber-300 font-mono">{row.wellChargeCode}</span></div>}
                              {row.poNumber && <div>PO: <span className="text-cyan-300 font-mono">{row.poNumber}</span></div>}
                              {row.cocNumber && <div>COC: <span className="text-gray-300 font-mono">{row.cocNumber}</span></div>}
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                  <span>
                    Showing {displayRows.length} of {parsedRows.length} total records ({stats.selected} selected for import)
                  </span>
                  {stats.duplicates > 0 && (
                    <span className="text-amber-400">
                      {duplicateStrategy === 'skip' ? 'Note: Duplicates will be skipped on import.' : duplicateStrategy === 'update' ? 'Note: Duplicates will update existing items in inventory.' : 'Note: Duplicates will be assigned unique suffixed tags.'}
                    </span>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

        {/* Footer Actions */}
        {!importSuccessResult && (
          <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.03] flex items-center justify-between shrink-0">
            <div className="text-xs text-gray-400 hidden sm:block">
              {parsedRows.length > 0 ? (
                <span>Ready to process <strong className="text-white">{stats.selected}</strong> selected tubular records</span>
              ) : (
                <span>Upload a spreadsheet file or paste CSV rows to begin</span>
              )}
            </div>

            <div className="flex items-center space-x-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={stats.selected === 0}
                onClick={handleExecuteImport}
                className={`px-5 py-2.5 rounded-xl text-black text-xs font-bold transition shadow-lg flex items-center space-x-2 ${
                  stats.selected > 0 
                    ? 'bg-amber-500 hover:bg-amber-400 cursor-pointer shadow-amber-500/20' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Import {stats.selected > 0 ? `${stats.selected} Items` : 'Items'} to Inventory</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
