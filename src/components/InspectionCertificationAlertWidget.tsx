import React, { useState, useMemo } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { TubularItem, HoleSection } from '../types/drilling';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Filter, 
  Award, 
  FileCheck2, 
  ChevronRight, 
  ExternalLink,
  Zap,
  Layers,
  MapPin,
  RefreshCw,
  Info
} from 'lucide-react';

interface InspectionCertificationAlertWidgetProps {
  onSelectItem?: (item: TubularItem) => void;
  onNavigateTab: (tab: string) => void;
  onOpenAlerts: () => void;
}

export type AlertFilterCategory = 'ALL' | 'OVERDUE' | 'NEXT_7_DAYS' | 'NEXT_30_DAYS' | 'CERT_EXPIRING';

export const InspectionCertificationAlertWidget: React.FC<InspectionCertificationAlertWidgetProps> = ({
  onSelectItem,
  onNavigateTab,
  onOpenAlerts,
}) => {
  const { items, setSelectedStatus, setSelectedHoleSection, addInspectionRecord } = useDrilling();
  
  const [activeFilter, setActiveFilter] = useState<AlertFilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [recertifyingId, setRecertifyingId] = useState<string | null>(null);

  // Today reference calculation
  const today = useMemo(() => new Date(), []);

  // Compute alert classification for each item
  const analyzedAlertItems = useMemo(() => {
    return items.map(item => {
      const isStatusOverdue = item.status === 'Inspection Overdue';
      const isStatusDue = item.status === 'Due for Inspection';
      
      let diffDays: number | null = null;
      if (item.nextInspectionDue) {
        try {
          const dueDate = new Date(item.nextInspectionDue);
          // Set to start of day for clean calculation
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
          const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
          diffDays = Math.ceil((dueStart - todayStart) / (1000 * 3600 * 24));
        } catch {
          diffDays = null;
        }
      }

      // Determine severity & alert reasons
      const isOverdue = isStatusOverdue || (diffDays !== null && diffDays < 0);
      const isCritical7d = !isOverdue && (isStatusDue || (diffDays !== null && diffDays >= 0 && diffDays <= 7));
      const isUpcoming30d = !isOverdue && !isCritical7d && (diffDays !== null && diffDays > 7 && diffDays <= 30);
      const isCertExpiring = (diffDays !== null && diffDays <= 30) || isStatusDue || isStatusOverdue;

      const isAlert = isOverdue || isCritical7d || isUpcoming30d || isStatusDue;

      let severity: 'critical' | 'high' | 'warning' | 'none' = 'none';
      if (isOverdue) severity = 'critical';
      else if (isCritical7d) severity = 'high';
      else if (isUpcoming30d) severity = 'warning';

      return {
        item,
        diffDays,
        isOverdue,
        isCritical7d,
        isUpcoming30d,
        isCertExpiring,
        isAlert,
        severity,
      };
    }).filter(record => record.isAlert);
  }, [items, today]);

  // Overall counts for badges & visual meters
  const overdueCount = analyzedAlertItems.filter(a => a.isOverdue).length;
  const critical7dCount = analyzedAlertItems.filter(a => a.isCritical7d).length;
  const upcoming30dCount = analyzedAlertItems.filter(a => a.isUpcoming30d).length;
  const certExpiringCount = analyzedAlertItems.filter(a => a.isCertExpiring).length;
  const totalAlerts = analyzedAlertItems.length;

  // Filtered subset based on UI controls
  const filteredList = useMemo(() => {
    return analyzedAlertItems.filter(({ item, isOverdue, isCritical7d, isUpcoming30d, isCertExpiring }) => {
      // Category tab filter
      if (activeFilter === 'OVERDUE' && !isOverdue) return false;
      if (activeFilter === 'NEXT_7_DAYS' && !isCritical7d) return false;
      if (activeFilter === 'NEXT_30_DAYS' && !isUpcoming30d) return false;
      if (activeFilter === 'CERT_EXPIRING' && !isCertExpiring) return false;

      // Hole Section filter
      if (selectedSectionFilter !== 'ALL' && item.holeSection !== selectedSectionFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tagMatch = item.tagNumber.toLowerCase().includes(q);
        const nameMatch = item.name.toLowerCase().includes(q);
        const serialMatch = item.serialNumber.toLowerCase().includes(q);
        const locMatch = item.currentLocation.toLowerCase().includes(q);
        const certMatch = item.inspectionCertNumber?.toLowerCase().includes(q);
        const sectionMatch = item.holeSection.toLowerCase().includes(q);
        if (!tagMatch && !nameMatch && !serialMatch && !locMatch && !certMatch && !sectionMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by urgency: overdue first (most overdue first), then earliest due date
      const daysA = a.diffDays ?? (a.isOverdue ? -999 : 999);
      const daysB = b.diffDays ?? (b.isOverdue ? -999 : 999);
      return daysA - daysB;
    });
  }, [analyzedAlertItems, activeFilter, selectedSectionFilter, searchQuery]);

  // Quick QA Inspection Recertification Handler
  const handleQuickRecertify = async (item: TubularItem) => {
    setRecertifyingId(item.id);
    try {
      const certNum = `CERT-QA-${Math.floor(1000 + Math.random() * 9000)}`;
      const nextDue = new Date();
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      const nextDueStr = nextDue.toISOString().split('T')[0];

      addInspectionRecord(item.id, {
        date: new Date().toISOString().split('T')[0],
        inspectorName: 'Field QA Inspector',
        inspectionType: 'NDT (Magnetic Particle)',
        result: 'Pass',
        certNumber: certNum,
        nextInspectionDue: nextDueStr,
        remarks: 'Direct 30-Day Inspection Widget Recertification (Visual Thread & MPI).',
      });
    } finally {
      setTimeout(() => setRecertifyingId(null), 500);
    }
  };

  const handleGoToInventory = (status?: string) => {
    if (status) {
      setSelectedStatus(status as any);
    }
    onNavigateTab('inventory');
  };

  return (
    <div 
      id="inspection-certification-alert-widget"
      className="rounded-2xl border border-white/10 bg-[#121216] shadow-xl overflow-hidden"
    >
      {/* Widget Header with Industrial Visual Alert Styling */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-950/40 via-[#141418] to-rose-950/30 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-start space-x-3.5">
          <div className={`p-3 rounded-2xl border shrink-0 ${
            overdueCount > 0 
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/10' 
              : totalAlerts > 0
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}>
            {overdueCount > 0 ? (
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            ) : totalAlerts > 0 ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Inspection & Certification Alert Radar</span>
                {totalAlerts > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {totalAlerts} Action Required
                  </span>
                )}
              </h2>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              Active monitoring for OCTG tubulars & drilling tools due for inspection or expiring certification within the next 30 days.
            </p>
          </div>
        </div>

        {/* Global Action Header Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            id="widget-open-full-qa-modal-btn"
            onClick={onOpenAlerts}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 hover:border-white/20 transition flex items-center space-x-1.5 cursor-pointer"
            title="Open comprehensive Inspection & Compliance QA modal"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Full QA Center</span>
          </button>

          <button
            id="widget-view-inventory-alerts-btn"
            onClick={() => handleGoToInventory('Due for Inspection')}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition flex items-center space-x-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <span>Filter in Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Visual Urgency Breakdown Meter & Counters */}
      <div className="p-4 sm:p-5 border-b border-white/5 bg-[#16161b]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Card 1: Critical Overdue */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeFilter === 'OVERDUE'
                ? 'bg-rose-950/50 border-rose-500 text-white shadow-md'
                : overdueCount > 0 
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-300 hover:border-rose-500/60'
                  : 'bg-white/5 border-white/5 text-gray-400 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${overdueCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-gray-600'}`}></span>
                <span>Critical Overdue</span>
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-rose-400">{overdueCount}</span>
              <span className="text-[10px] text-rose-400/80">Immediate NDT</span>
            </div>
          </button>

          {/* Card 2: High Urgency (1-7 Days) */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'NEXT_7_DAYS' ? 'ALL' : 'NEXT_7_DAYS')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeFilter === 'NEXT_7_DAYS'
                ? 'bg-orange-950/50 border-orange-500 text-white shadow-md'
                : critical7dCount > 0
                  ? 'bg-orange-950/20 border-orange-500/30 text-orange-300 hover:border-orange-500/60'
                  : 'bg-white/5 border-white/5 text-gray-400 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${critical7dCount > 0 ? 'bg-orange-500' : 'bg-gray-600'}`}></span>
                <span>Due in &le; 7 Days</span>
              </span>
              <Clock className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-orange-400">{critical7dCount}</span>
              <span className="text-[10px] text-orange-400/80">High Priority</span>
            </div>
          </button>

          {/* Card 3: Due in 8-30 Days */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'NEXT_30_DAYS' ? 'ALL' : 'NEXT_30_DAYS')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeFilter === 'NEXT_30_DAYS'
                ? 'bg-amber-950/50 border-amber-500 text-white shadow-md'
                : upcoming30dCount > 0
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-300 hover:border-amber-500/60'
                  : 'bg-white/5 border-white/5 text-gray-400 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${upcoming30dCount > 0 ? 'bg-amber-500' : 'bg-gray-600'}`}></span>
                <span>Due in 8&ndash;30 Days</span>
              </span>
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-amber-400">{upcoming30dCount}</span>
              <span className="text-[10px] text-amber-400/80">Pre-Job Window</span>
            </div>
          </button>

          {/* Card 4: Expiring Certifications */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'CERT_EXPIRING' ? 'ALL' : 'CERT_EXPIRING')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeFilter === 'CERT_EXPIRING'
                ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-md'
                : certExpiringCount > 0
                  ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300 hover:border-cyan-500/60'
                  : 'bg-white/5 border-white/5 text-gray-400 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${certExpiringCount > 0 ? 'bg-cyan-500' : 'bg-gray-600'}`}></span>
                <span>Expiring Certs (&le;30d)</span>
              </span>
              <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-cyan-400">{certExpiringCount}</span>
              <span className="text-[10px] text-cyan-400/80">COC / NDT Refresh</span>
            </div>
          </button>

        </div>

        {/* Visual Progress Bar Ratio */}
        {totalAlerts > 0 && (
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
              <span>Alert Distribution Ratio</span>
              <span className="font-mono">{totalAlerts} Total Flagged Assets</span>
            </div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden flex border border-white/5">
              {overdueCount > 0 && (
                <div 
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${(overdueCount / totalAlerts) * 100}%` }}
                  title={`${overdueCount} Overdue Items`}
                />
              )}
              {critical7dCount > 0 && (
                <div 
                  className="bg-orange-500 h-full transition-all duration-300"
                  style={{ width: `${(critical7dCount / totalAlerts) * 100}%` }}
                  title={`${critical7dCount} Due within 7 days`}
                />
              )}
              {upcoming30dCount > 0 && (
                <div 
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${(upcoming30dCount / totalAlerts) * 100}%` }}
                  title={`${upcoming30dCount} Due within 8-30 days`}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 bg-[#141418] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            All 30d Alerts ({totalAlerts})
          </button>

          <button
            onClick={() => setActiveFilter('OVERDUE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1 ${
              activeFilter === 'OVERDUE'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-white/5 text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            <span>Overdue ({overdueCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('NEXT_7_DAYS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeFilter === 'NEXT_7_DAYS'
                ? 'bg-orange-500 text-black font-bold'
                : 'bg-white/5 text-orange-300 hover:bg-orange-500/10'
            }`}
          >
            &le; 7 Days ({critical7dCount})
          </button>

          <button
            onClick={() => setActiveFilter('NEXT_30_DAYS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeFilter === 'NEXT_30_DAYS'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-white/5 text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            8&ndash;30 Days ({upcoming30dCount})
          </button>
        </div>

        {/* Search & Section Filter Dropdown */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search tag, serial, S/N..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <select
            value={selectedSectionFilter}
            onChange={(e) => setSelectedSectionFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300 focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            <option value="ALL">All Hole Sections</option>
            <option value='36" Conductor'>36" Conductor</option>
            <option value='26" Surface Hole'>26" Surface Hole</option>
            <option value='17-1/2" Intermediate'>17-1/2" Intermediate</option>
            <option value='12-1/4" Main Hole'>12-1/4" Main Hole</option>
            <option value='8-1/2" Reservoir'>8-1/2" Reservoir</option>
            <option value='6" Liner / Workover'>6" Liner / Workover</option>
          </select>

        </div>

      </div>

      {/* Alert Items List */}
      <div className="p-4 sm:p-6 space-y-3 max-h-[460px] overflow-y-auto">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white/5 rounded-2xl border border-white/5">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-white">No Items Pending Inspection in this Filter</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              All OCTG tubulars and drilling tools in this category have active, up-to-date certifications and valid inspection windows.
            </p>
          </div>
        ) : (
          filteredList.map(({ item, diffDays, isOverdue, isCritical7d, severity }) => {
            const isRecertifying = recertifyingId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60 shadow-sm'
                    : severity === 'high'
                      ? 'bg-orange-950/20 border-orange-500/30 hover:border-orange-500/60 shadow-sm'
                      : 'bg-amber-950/15 border-amber-500/20 hover:border-amber-500/50'
                }`}
              >
                {/* Left: Item Identity, Technical Specs & Badges */}
                <div className="space-y-2 flex-1">
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Severity Visual Alert Chip */}
                    {isOverdue ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>OVERDUE {diffDays !== null ? `(${Math.abs(diffDays)}d ago)` : ''}</span>
                      </span>
                    ) : isCritical7d ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/50">
                        <Clock className="w-3 h-3" />
                        <span>DUE IN {diffDays} DAY{diffDays === 1 ? '' : 'S'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Calendar className="w-3 h-3" />
                        <span>DUE IN {diffDays} DAYS</span>
                      </span>
                    )}

                    {/* Tag Number */}
                    <span className="font-mono font-bold text-sm text-white px-2 py-0.5 rounded bg-black/40 border border-white/10">
                      {item.tagNumber}
                    </span>

                    {/* Item Name */}
                    <span className="font-semibold text-xs text-gray-200">
                      {item.name}
                    </span>

                    {/* Category */}
                    <span className="text-[11px] text-gray-400 font-medium px-2 py-0.5 rounded bg-white/5 border border-white/5">
                      {item.category}
                    </span>
                  </div>

                  {/* Secondary Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 font-mono">
                    <span>OD: <strong className="text-gray-300">{item.outerDiameter}</strong></span>
                    <span>Grade: <strong className="text-gray-300">{item.grade}</strong></span>
                    <span>Section: <strong className="text-amber-400">{item.holeSection}</strong></span>
                    <span>Serial #: <strong className="text-gray-300">{item.serialNumber}</strong></span>
                    <span className="flex items-center gap-1 text-gray-300 font-sans">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      {item.currentLocation}
                    </span>
                  </div>

                  {/* Inspection & Certification Timeline Bar */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 text-gray-300">
                    <div className="flex items-center space-x-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cert #: <strong className="font-mono text-white">{item.inspectionCertNumber || 'PENDING'}</strong></span>
                    </div>

                    <div className="hidden sm:inline text-gray-600">•</div>

                    <div>
                      <span>Last Inspected: <strong className="font-mono text-gray-200">{item.lastInspectionDate || 'N/A'}</strong></span>
                    </div>

                    <div className="hidden sm:inline text-gray-600">•</div>

                    <div>
                      <span>Next Due Date: </span>
                      <strong className={`font-mono font-bold ${
                        isOverdue ? 'text-rose-400 underline decoration-rose-500/50' : 'text-amber-300'
                      }`}>
                        {item.nextInspectionDue || 'Unscheduled'}
                      </strong>
                    </div>

                    {item.isSurplus && (
                      <>
                        <div className="hidden sm:inline text-gray-600">•</div>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-sans">
                          Surplus ({item.monthsAtYard || 0}m at yard)
                        </span>
                      </>
                    )}
                  </div>

                </div>

                {/* Right: Quick Action Controls */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                  
                  {/* Quick NDT Recertify Button */}
                  <button
                    onClick={() => handleQuickRecertify(item)}
                    disabled={isRecertifying}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    title="Log instant QA pass and extend inspection due date by 1 year"
                  >
                    <Zap className={`w-3.5 h-3.5 text-emerald-400 ${isRecertifying ? 'animate-spin' : ''}`} />
                    <span>{isRecertifying ? 'Logging...' : 'Quick Pass (1Y)'}</span>
                  </button>

                  {/* View Asset Details Drawer */}
                  {onSelectItem && (
                    <button
                      onClick={() => onSelectItem(item)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-semibold transition cursor-pointer"
                      title="Inspect complete technical specs, tallies and maintenance records"
                    >
                      <span>Details</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </button>
                  )}

                  {/* Filter Single Item in Table */}
                  <button
                    onClick={() => {
                      setSelectedHoleSection(item.holeSection);
                      onNavigateTab('inventory');
                    }}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-amber-400 border border-white/10 transition cursor-pointer"
                    title="View this section in inventory list"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Widget Footer Info */}
      <div className="px-5 py-3 bg-[#141418] border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-amber-500" />
          <span>NDT & Ultrasonic inspection validity is governed by API RP 7G-2 & DS-1 Standard.</span>
        </div>
        <span className="font-mono text-[11px] text-gray-500">
          Showing {filteredList.length} of {totalAlerts} Flagged Assets
        </span>
      </div>

    </div>
  );
};
