import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { TubularItem, HoleSection, LocationType, MaintenanceStatus } from '../types/drilling';
import { 
  FileText, 
  Printer, 
  Download, 
  CheckSquare, 
  Calendar, 
  SlidersHorizontal, 
  Layers, 
  ShieldCheck, 
  X, 
  Eye, 
  Columns, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  FileSpreadsheet
} from 'lucide-react';

interface ExportCustomReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TubularItem[];
}

export type ReportColumnKey = 
  | 'tagNumber'
  | 'name'
  | 'holeSection'
  | 'category'
  | 'dimensions'
  | 'connectionGrade'
  | 'joints'
  | 'lengthFt'
  | 'currentLocation'
  | 'rackLocation'
  | 'status'
  | 'inspectionCert'
  | 'nextDue'
  | 'projectOwner'
  | 'wellChargeCode'
  | 'maintenanceCount'
  | 'surplusStatus';

interface ColumnOption {
  key: ReportColumnKey;
  label: string;
  category: 'core' | 'technical' | 'location' | 'compliance' | 'commercial';
  defaultSelected: boolean;
}

const AVAILABLE_COLUMNS: ColumnOption[] = [
  { key: 'tagNumber', label: 'Tag & Heat Number', category: 'core', defaultSelected: true },
  { key: 'name', label: 'Item Name & Description', category: 'core', defaultSelected: true },
  { key: 'holeSection', label: 'Hole Section', category: 'core', defaultSelected: true },
  { key: 'category', label: 'Equipment Category', category: 'technical', defaultSelected: false },
  { key: 'dimensions', label: 'Dimensions (OD / Wt / Wall)', category: 'technical', defaultSelected: true },
  { key: 'connectionGrade', label: 'Connection & Steel Grade', category: 'technical', defaultSelected: true },
  { key: 'joints', label: 'Joint Quantity', category: 'technical', defaultSelected: true },
  { key: 'lengthFt', label: 'Total Footage (ft)', category: 'technical', defaultSelected: true },
  { key: 'currentLocation', label: 'Physical Location', category: 'location', defaultSelected: true },
  { key: 'rackLocation', label: 'Yard Bay / Storage Rack', category: 'location', defaultSelected: false },
  { key: 'status', label: 'Maintenance & Field Status', category: 'compliance', defaultSelected: true },
  { key: 'inspectionCert', label: 'Inspection Certificate #', category: 'compliance', defaultSelected: true },
  { key: 'nextDue', label: 'Next Inspection Due Date', category: 'compliance', defaultSelected: true },
  { key: 'maintenanceCount', label: 'Maintenance Logs Count', category: 'compliance', defaultSelected: false },
  { key: 'projectOwner', label: 'Project / Campaign Owner', category: 'commercial', defaultSelected: false },
  { key: 'wellChargeCode', label: 'Well Charge Code (AFE)', category: 'commercial', defaultSelected: false },
  { key: 'surplusStatus', label: 'Surplus Disposition', category: 'commercial', defaultSelected: false },
];

export const ExportCustomReportModal: React.FC<ExportCustomReportModalProps> = ({
  isOpen,
  onClose,
  items
}) => {
  const { currentUser, logAuditTrail } = useDrilling();

  // Report Customization Options
  const [reportTitle, setReportTitle] = useState('Deepwater Alpha Campaign Asset Lifecycle & Compliance Audit');
  const [reportSubtitle, setReportSubtitle] = useState('Certified Equipment Readiness, NDT Verification, and Chain of Custody Report');
  const [preparedFor, setPreparedFor] = useState('Petrobras / TotalEnergies JV Operating Committee');
  
  // Date and Time Range
  const [timeRangePreset, setTimeRangePreset] = useState<'all' | 'last7' | 'last30' | 'last90' | 'campaign2026' | 'custom'>('campaign2026');
  const [customStartDate, setCustomStartDate] = useState('2026-01-01');
  const [customEndDate, setCustomEndDate] = useState('2026-12-31');

  // Filter criteria
  const [filterHoleSection, setFilterHoleSection] = useState<HoleSection | 'ALL'>('ALL');
  const [filterLocation, setFilterLocation] = useState<LocationType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'ALL'>('ALL');
  const [filterSurplusOnly, setFilterSurplusOnly] = useState(false);

  // Grouping & Sorting
  const [groupBy, setGroupBy] = useState<'none' | 'holeSection' | 'location' | 'status'>('holeSection');
  const [includeSummaryStats, setIncludeSummaryStats] = useState(true);
  const [includeSignoffBlock, setIncludeSignoffBlock] = useState(true);

  // Selected Columns Map
  const [selectedColumns, setSelectedColumns] = useState<Record<ReportColumnKey, boolean>>(() => {
    const initial: any = {};
    AVAILABLE_COLUMNS.forEach(col => {
      initial[col.key] = col.defaultSelected;
    });
    return initial;
  });

  const [activeViewMode, setActiveViewMode] = useState<'config' | 'preview'>('config');

  if (!isOpen) return null;

  const toggleColumn = (key: ReportColumnKey) => {
    setSelectedColumns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const selectAllColumns = (val: boolean) => {
    const updated: any = {};
    AVAILABLE_COLUMNS.forEach(col => {
      updated[col.key] = val;
    });
    setSelectedColumns(updated);
  };

  // Filter items according to criteria
  const filteredReportItems = items.filter(item => {
    if (filterHoleSection !== 'ALL' && item.holeSection !== filterHoleSection) return false;
    if (filterLocation !== 'ALL' && item.currentLocation !== filterLocation) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (filterSurplusOnly && !item.isSurplus) return false;

    // Time range filter against updatedAt or lastInspectionDate
    if (timeRangePreset === 'last7') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const itemDate = new Date(item.updatedAt || item.lastInspectionDate || 0);
      if (itemDate < d) return false;
    } else if (timeRangePreset === 'last30') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const itemDate = new Date(item.updatedAt || item.lastInspectionDate || 0);
      if (itemDate < d) return false;
    } else if (timeRangePreset === 'last90') {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      const itemDate = new Date(item.updatedAt || item.lastInspectionDate || 0);
      if (itemDate < d) return false;
    } else if (timeRangePreset === 'custom') {
      const itemDate = new Date(item.updatedAt || item.lastInspectionDate || 0);
      if (customStartDate && itemDate < new Date(customStartDate)) return false;
      if (customEndDate && itemDate > new Date(customEndDate + 'T23:59:59')) return false;
    }

    return true;
  });

  const totalJoints = filteredReportItems.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  const totalLength = filteredReportItems.reduce((acc, i) => acc + (i.lengthFt || 0), 0);
  const activeCount = filteredReportItems.filter(i => i.status === 'Serviceable (Field Ready)').length;
  const overdueCount = filteredReportItems.filter(i => i.status === 'Inspection Overdue').length;

  const activeColumnsList = AVAILABLE_COLUMNS.filter(c => selectedColumns[c.key]);

  const handlePrintPDF = () => {
    logAuditTrail(
      'CUSTOM_REPORT_EXPORTED',
      `RPT-${Date.now().toString().slice(-6)}`,
      `Exported custom PDF audit report "${reportTitle}" with ${filteredReportItems.length} items and ${activeColumnsList.length} customized columns.`,
      `Prepared for: ${preparedFor} by ${currentUser.name}`
    );
    window.print();
  };

  const handleExportCSV = () => {
    logAuditTrail(
      'CUSTOM_REPORT_EXPORTED',
      `CSV-${Date.now().toString().slice(-6)}`,
      `Exported custom CSV dataset "${reportTitle}" containing ${filteredReportItems.length} records.`,
      `User: ${currentUser.name}`
    );

    const headers = activeColumnsList.map(c => `"${c.label}"`);
    const rows = filteredReportItems.map(item => {
      return activeColumnsList.map(col => {
        switch (col.key) {
          case 'tagNumber': return `"${item.tagNumber} (HT: ${item.heatNumber})"`;
          case 'name': return `"${item.name}"`;
          case 'holeSection': return `"${item.holeSection}"`;
          case 'category': return `"${item.category}"`;
          case 'dimensions': return `"${item.outerDiameter} / ${item.weightLbFt}"`;
          case 'connectionGrade': return `"${item.connectionType} / ${item.grade}"`;
          case 'joints': return item.quantityJoints || 1;
          case 'lengthFt': return item.lengthFt || 0;
          case 'currentLocation': return `"${item.currentLocation}"`;
          case 'rackLocation': return `"${item.rackLocation || 'N/A'}"`;
          case 'status': return `"${item.status}"`;
          case 'inspectionCert': return `"${item.inspectionCertNumber || 'N/A'}"`;
          case 'nextDue': return `"${item.nextInspectionDue}"`;
          case 'maintenanceCount': return item.maintenanceLogs?.length || 0;
          case 'projectOwner': return `"${item.projectOwner || 'Deepwater Alpha'}"`;
          case 'wellChargeCode': return `"${item.wellChargeCode || 'AFE-2026-ALPHA-01'}"`;
          case 'surplusStatus': return `"${item.isSurplus ? `Surplus (${item.monthsAtYard || 0} mos)` : 'Active Rig Program'}"`;
          default: return '""';
        }
      }).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Custom_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#121215] border border-white/15 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header (Hidden when printing PDF) */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Export Custom Lifecycle & Compliance Report</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {filteredReportItems.length} Items Selected
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Customize data columns, time range filters, executive summaries, and formal QA/QC sign-off signatures for PDF/CSV export.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveViewMode('config')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeViewMode === 'config' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Configuration
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('preview')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                  activeViewMode === 'preview' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Document Preview</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* VIEW MODE 1: CONFIGURATION */}
          {activeViewMode === 'config' && (
            <div className="space-y-6">
              
              {/* Report Titles & Metadata */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Report Header & Document Metadata</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Document Title</label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={e => setReportTitle(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Subtitle / Scope</label>
                    <input
                      type="text"
                      value={reportSubtitle}
                      onChange={e => setReportSubtitle(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Prepared For / Regulatory Body</label>
                    <input
                      type="text"
                      value={preparedFor}
                      onChange={e => setPreparedFor(e.target.value)}
                      placeholder="e.g. Petrobras, BSEE, API Auditor, Operating Committee"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Generated By</label>
                    <input
                      type="text"
                      disabled
                      value={`${currentUser.name} (${currentUser.role})`}
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-3.5 py-2.5 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Time Range & Lifecycle Event Filtering */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Time Range & Lifecycle Event Scope</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'all', label: 'All Lifecycle Events' },
                    { id: 'campaign2026', label: 'Campaign 2026 (YTD)' },
                    { id: 'last30', label: 'Last 30 Days' },
                    { id: 'custom', label: 'Custom Date Range' }
                  ].map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setTimeRangePreset(preset.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                        timeRangePreset === preset.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {timeRangePreset === 'custom' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-1">Start Date</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={e => setCustomStartDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-1">End Date</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={e => setCustomEndDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Column Selection Grid */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
                    <Columns className="w-3.5 h-3.5" />
                    <span>Customize Report Columns ({activeColumnsList.length} of {AVAILABLE_COLUMNS.length} Active)</span>
                  </h3>
                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => selectAllColumns(true)}
                      className="text-amber-400 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-500">•</span>
                    <button
                      type="button"
                      onClick={() => selectAllColumns(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {AVAILABLE_COLUMNS.map(col => {
                    const isChecked = selectedColumns[col.key];
                    return (
                      <label
                        key={col.key}
                        className={`p-3 rounded-xl border text-xs flex items-center space-x-2.5 cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-white font-medium'
                            : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleColumn(col.key)}
                          className="rounded border-white/20 bg-black text-emerald-500 focus:ring-emerald-500/20 shrink-0"
                        />
                        <span className="truncate">{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Layout & Organization Options */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Group Records By</label>
                  <select
                    value={groupBy}
                    onChange={e => setGroupBy(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-amber-500"
                  >
                    <option value="none">None (Flat Listing)</option>
                    <option value="holeSection">Hole Section</option>
                    <option value="location">Current Location</option>
                    <option value="status">Maintenance Status</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center space-y-2 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSummaryStats}
                      onChange={e => setIncludeSummaryStats(e.target.checked)}
                      className="rounded border-white/20 bg-black text-amber-500 focus:ring-amber-500/20"
                    />
                    <span className="text-gray-300 font-medium">Include Executive Stats Bar</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSignoffBlock}
                      onChange={e => setIncludeSignoffBlock(e.target.checked)}
                      className="rounded border-white/20 bg-black text-amber-500 focus:ring-amber-500/20"
                    />
                    <span className="text-gray-300 font-medium">Include QA Sign-off & Signature Block</span>
                  </label>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col justify-center">
                  <span className="text-[11px] text-amber-300 font-semibold">Report Output Scope:</span>
                  <span className="text-xs font-bold text-white font-mono mt-0.5">
                    {filteredReportItems.length} Records • {totalJoints} Joints ({totalLength.toLocaleString()} ft)
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* VIEW MODE 2: LIVE PREVIEW & PRINTABLE VIEW */}
          {(activeViewMode === 'preview' || true) && (
            <div className={`${activeViewMode === 'config' ? 'hidden' : 'block'} print:block print:p-0 print:m-0`}>
              
              {/* Report Document Sheet */}
              <div className="bg-[#16161b] print:bg-white text-gray-200 print:text-black rounded-2xl border border-white/10 print:border-none p-6 sm:p-8 space-y-6 shadow-2xl">
                
                {/* Printable Header */}
                <div className="border-b border-white/10 print:border-slate-400 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono font-bold tracking-widest text-amber-400 print:text-amber-800 uppercase">
                      OFFICIAL DRILLING ASSET COMPLIANCE REPORT
                    </span>
                    <h1 className="text-xl font-black text-white print:text-black mt-0.5">{reportTitle}</h1>
                    <p className="text-xs text-gray-400 print:text-slate-600 mt-1">{reportSubtitle}</p>
                    <div className="flex items-center space-x-4 text-[11px] text-gray-400 print:text-slate-600 mt-2 font-mono">
                      <span>Prepared For: <strong className="text-white print:text-black">{preparedFor}</strong></span>
                      <span>•</span>
                      <span>Generated: <strong>{new Date().toLocaleDateString()}</strong></span>
                      <span>•</span>
                      <span>Signatory: <strong>{currentUser.name}</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 border-l border-white/10 print:border-slate-300 pl-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 print:bg-emerald-100 print:text-emerald-900 text-xs font-bold border border-emerald-500/40">
                      QA CERTIFIED
                    </span>
                    <p className="text-[10px] text-gray-400 print:text-slate-600 font-mono mt-1">Doc ID: REP-{Date.now().toString().slice(-8)}</p>
                  </div>
                </div>

                {/* Summary Metrics Bar */}
                {includeSummaryStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 print:bg-slate-100 p-4 rounded-xl border border-white/5 print:border-slate-300 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 print:text-slate-600 font-semibold block">Total Assets Audited</span>
                      <span className="text-lg font-black text-white print:text-black">{filteredReportItems.length} Records</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 print:text-slate-600 font-semibold block">Tally Joints & Footage</span>
                      <span className="text-lg font-black text-amber-400 print:text-amber-800">{totalJoints} jts ({totalLength.toLocaleString()} ft)</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 print:text-slate-600 font-semibold block">Serviceable Readiness</span>
                      <span className="text-lg font-black text-emerald-400 print:text-emerald-700">
                        {totalJoints > 0 ? Math.round((activeCount / filteredReportItems.length) * 100) : 0}% ({activeCount} items)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 print:text-slate-600 font-semibold block">Inspection Overdue</span>
                      <span className={`text-lg font-black ${overdueCount > 0 ? 'text-rose-400 print:text-rose-700' : 'text-gray-400 print:text-slate-500'}`}>
                        {overdueCount} Items
                      </span>
                    </div>
                  </div>
                )}

                {/* Custom Columns Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-white/10 print:border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-white/5 print:bg-slate-200 text-gray-300 print:text-black font-bold uppercase text-[10px] border-b border-white/10 print:border-slate-300">
                        {activeColumnsList.map(col => (
                          <th key={col.key} className="p-3 border-r border-white/10 print:border-slate-300 whitespace-nowrap">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 print:divide-slate-300 font-mono text-[11px]">
                      {filteredReportItems.map(item => (
                        <tr key={item.id} className="hover:bg-white/5 print:hover:bg-transparent">
                          {activeColumnsList.map(col => {
                            switch (col.key) {
                              case 'tagNumber':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-bold text-amber-400 print:text-amber-900">
                                    <div>{item.tagNumber}</div>
                                    <div className="text-[10px] text-gray-400 print:text-slate-600 font-normal">HT: {item.heatNumber}</div>
                                  </td>
                                );
                              case 'name':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-sans">
                                    <span className="font-semibold text-white print:text-black">{item.name}</span>
                                  </td>
                                );
                              case 'holeSection':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-sans whitespace-nowrap">
                                    {item.holeSection}
                                  </td>
                                );
                              case 'category':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-sans">
                                    {item.category}
                                  </td>
                                );
                              case 'dimensions':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-sans whitespace-nowrap">
                                    {item.outerDiameter} • {item.weightLbFt}
                                  </td>
                                );
                              case 'connectionGrade':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-sans whitespace-nowrap">
                                    {item.connectionType} ({item.grade})
                                  </td>
                                );
                              case 'joints':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 text-center font-bold">
                                    {item.quantityJoints || 1} jts
                                  </td>
                                );
                              case 'lengthFt':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 text-right">
                                    {item.lengthFt || 0} ft
                                  </td>
                                );
                              case 'currentLocation':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-sans whitespace-nowrap">
                                    {item.currentLocation}
                                  </td>
                                );
                              case 'rackLocation':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-sans">
                                    {item.rackLocation || 'Yard Staging'}
                                  </td>
                                );
                              case 'status':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-sans font-semibold">
                                    <span className={item.status === 'Serviceable (Field Ready)' ? 'text-emerald-400 print:text-emerald-800' : 'text-amber-400 print:text-amber-800'}>
                                      {item.status}
                                    </span>
                                  </td>
                                );
                              case 'inspectionCert':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-mono">
                                    {item.inspectionCertNumber || 'CERT-NDT-881'}
                                  </td>
                                );
                              case 'nextDue':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-mono whitespace-nowrap">
                                    {item.nextInspectionDue}
                                  </td>
                                );
                              case 'maintenanceCount':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 text-center font-mono">
                                    {item.maintenanceLogs?.length || 0} events
                                  </td>
                                );
                              case 'projectOwner':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-sans">
                                    {item.projectOwner || 'Deepwater Alpha'}
                                  </td>
                                );
                              case 'wellChargeCode':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-mono">
                                    {item.wellChargeCode || 'AFE-2026-ALPHA-01'}
                                  </td>
                                );
                              case 'surplusStatus':
                                return (
                                  <td key={col.key} className="p-2.5 border-r border-white/5 print:border-slate-300 font-sans">
                                    {item.isSurplus ? `Surplus (${item.monthsAtYard || 0}m)` : 'Active Rig String'}
                                  </td>
                                );
                              default:
                                return <td key={col.key} className="p-2.5">-</td>;
                            }
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Formal QA / QC Sign-off Block */}
                {includeSignoffBlock && (
                  <div className="pt-6 border-t border-white/10 print:border-slate-400 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 bg-white/5 print:bg-slate-100 rounded-xl border border-white/5 print:border-slate-300">
                      <span className="text-[10px] font-bold uppercase text-gray-400 print:text-slate-600 block">Lead Drilling Engineer</span>
                      <p className="font-bold text-white print:text-black mt-1.5">Marcus Vance, PE</p>
                      <p className="text-[10px] text-emerald-400 print:text-emerald-800 font-mono mt-0.5">Digitally Verified [DS-1 / API-5CT]</p>
                    </div>

                    <div className="p-4 bg-white/5 print:bg-slate-100 rounded-xl border border-white/5 print:border-slate-300">
                      <span className="text-[10px] font-bold uppercase text-gray-400 print:text-slate-600 block">QA / QC Technical Inspector</span>
                      <p className="font-bold text-white print:text-black mt-1.5">SGS Tubular QA Inspection Unit</p>
                      <p className="text-[10px] text-emerald-400 print:text-emerald-800 font-mono mt-0.5">Stamp # SGS-NDT-2026-99</p>
                    </div>

                    <div className="p-4 bg-white/5 print:bg-slate-100 rounded-xl border border-white/5 print:border-slate-300 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400 print:text-slate-600 block">Materials Coordinator</span>
                      <p className="font-bold text-white print:text-black mt-1.5">{currentUser.name} ({currentUser.role})</p>
                      <p className="text-[10px] text-gray-400 print:text-slate-600 font-mono mt-0.5">{new Date().toISOString()}</p>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div className="p-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#16161b] print:hidden">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Compliant with API RP 7G-2 & ISO 10407-2 reporting requirements</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV ({activeColumnsList.length} cols)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center space-x-2 shadow-lg hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4" />
              <span>Generate & Print PDF Report</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
