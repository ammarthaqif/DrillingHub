import React, { useState, useMemo } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { safeJsonParse } from '../utils/safeJson';
import { WellChargeCode, TubularItem, AssignedWellInfo, WellDefinition } from '../types/drilling';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Building2, 
  FileSpreadsheet, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Search, 
  Filter, 
  Layers, 
  Download, 
  Upload, 
  ShieldCheck, 
  ShieldAlert,
  Calculator, 
  Receipt, 
  ArrowUpRight, 
  Briefcase,
  Sparkles,
  ChevronRight,
  Link2,
  Check,
  Zap,
  Info,
  X
} from 'lucide-react';

interface CostControllerHubProps {
  onSelectItem?: (item: TubularItem) => void;
  onNavigateTab?: (tab: string) => void;
}

export const CostControllerHub: React.FC<CostControllerHubProps> = ({ onSelectItem, onNavigateTab }) => {
  const { 
    chargeCodes, 
    addChargeCode, 
    updateChargeCode, 
    deleteChargeCode, 
    importChargeCodes, 
    assignWellToChargeCode,
    getChargeCodeForWell,
    getAllAssignedWells,
    items, 
    campaigns, 
    currentUser 
  } = useDrilling();

  const isAuthorized = currentUser?.role === 'Cost Controller' || currentUser?.role === 'System Administrator';

  const [activeSubTab, setActiveSubTab] = useState<'afeOverview' | 'wellAssignments' | 'inventoryValuation' | 'costAllocation' | 'savingsAnalysis'>('afeOverview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedOperatorFilter, setSelectedOperatorFilter] = useState<string>('ALL');

  // Modal State for Add / Edit Charge Code
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<WellChargeCode | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Quick Assign Well Modal State
  const [isAssignWellModalOpen, setIsAssignWellModalOpen] = useState(false);
  const [assignWellForm, setAssignWellForm] = useState({
    chargeCodeId: '',
    wellName: '',
    wellCode: '',
    wellType: 'Development' as WellDefinition['type'],
    targetDepthFt: '',
    rigName: 'Offshore Rig Alpha (Deepwater Champion)',
    notes: ''
  });
  const [assignFeedback, setAssignFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    projectName: '',
    wellName: '',
    wellCode: '',
    operator: 'Petronas Carigali',
    allocatedBudgetUsd: 5000000,
    committedCostUsd: 0,
    actualSpendUsd: 0,
    currency: 'USD' as 'USD' | 'MYR' | 'EUR' | 'GBP',
    status: 'Active' as WellChargeCode['status'],
    costCenter: 'CC-OFFSHORE-01',
    costControllerOwner: currentUser?.name || 'Cost Controller',
    description: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '2026-12-31',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Assigned wells aggregated directory
  const assignedWellsDirectory = useMemo(() => {
    return getAllAssignedWells ? getAllAssignedWells() : [];
  }, [chargeCodes, getAllAssignedWells]);

  // Aggregated Cost Metrics
  const costMetrics = useMemo(() => {
    const totalAllocated = chargeCodes.reduce((acc, c) => acc + (c.allocatedBudgetUsd || 0), 0);
    const totalCommitted = chargeCodes.reduce((acc, c) => acc + (c.committedCostUsd || 0), 0);
    const totalActual = chargeCodes.reduce((acc, c) => acc + (c.actualSpendUsd || 0), 0);

    // Total book value and purchase value of inventory
    const totalPurchaseCost = items.reduce((acc, it) => acc + (it.purchaseCostUsd || 0), 0);
    const totalBookValue = items.reduce((acc, it) => acc + (it.currentBookValueUsd || it.purchaseCostUsd || 0), 0);
    const totalInspectionCost = items.reduce((acc, it) => acc + (it.inspectionCostUsd || 0), 0);
    const totalMaintenanceCost = items.reduce((acc, it) => acc + (it.maintenanceCostUsd || 0), 0);
    const totalRefurbishmentCost = items.reduce((acc, it) => acc + (it.refurbishmentCostUsd || 0), 0);
    const totalMobilizationCost = items.reduce((acc, it) => acc + (it.mobilizationCostUsd || 0), 0);

    // Surplus Cost Savings (Estimated value saved by reallocating surplus vs purchasing new)
    const surplusItems = items.filter(it => it.isSurplus);
    const estimatedSavingsUsd = surplusItems.reduce((acc, it) => acc + (it.purchaseCostUsd || 150000) * 0.85, 0);

    return {
      totalAllocated,
      totalCommitted,
      totalActual,
      totalPurchaseCost,
      totalBookValue,
      totalInspectionCost,
      totalMaintenanceCost,
      totalRefurbishmentCost,
      totalMobilizationCost,
      estimatedSavingsUsd,
      surplusCount: surplusItems.length,
      utilizationRate: totalAllocated > 0 ? (totalActual / totalAllocated) * 100 : 0,
      commitmentRate: totalAllocated > 0 ? (totalCommitted / totalAllocated) * 100 : 0,
    };
  }, [chargeCodes, items]);

  // Unique Operators for filtering
  const uniqueOperators = useMemo(() => {
    const ops = new Set<string>();
    chargeCodes.forEach(c => {
      if (c.operator) ops.add(c.operator);
    });
    return Array.from(ops);
  }, [chargeCodes]);

  // Filtered Charge Codes
  const filteredChargeCodes = useMemo(() => {
    return chargeCodes.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchCode = c.code.toLowerCase().includes(q);
        const matchProject = c.projectName.toLowerCase().includes(q);
        const matchWell = c.wellName?.toLowerCase().includes(q) || false;
        const matchAssignedWell = c.assignedWells?.some(w => {
          const name = typeof w === 'string' ? w : w.wellName;
          return name.toLowerCase().includes(q);
        }) || false;
        const matchOperator = c.operator.toLowerCase().includes(q);
        const matchCostCenter = c.costCenter.toLowerCase().includes(q);
        if (!matchCode && !matchProject && !matchWell && !matchAssignedWell && !matchOperator && !matchCostCenter) return false;
      }
      if (selectedStatusFilter !== 'ALL' && c.status !== selectedStatusFilter) return false;
      if (selectedOperatorFilter !== 'ALL' && c.operator !== selectedOperatorFilter) return false;
      return true;
    });
  }, [chargeCodes, searchQuery, selectedStatusFilter, selectedOperatorFilter]);

  // Filtered Assigned Wells Directory
  const filteredAssignedWells = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return assignedWellsDirectory.filter(w => {
      if (!q) return true;
      return (
        w.wellName.toLowerCase().includes(q) ||
        (w.wellCode && w.wellCode.toLowerCase().includes(q)) ||
        w.afeCode.toLowerCase().includes(q) ||
        w.operator.toLowerCase().includes(q) ||
        w.projectName.toLowerCase().includes(q)
      );
    });
  }, [assignedWellsDirectory, searchQuery]);

  // Handle open modal for create / edit
  const handleOpenModal = (codeToEdit?: WellChargeCode) => {
    setFormError(null);
    if (codeToEdit) {
      setEditingCode(codeToEdit);
      setFormData({
        code: codeToEdit.code,
        projectName: codeToEdit.projectName,
        wellName: codeToEdit.wellName || '',
        wellCode: codeToEdit.wellCode || '',
        operator: codeToEdit.operator,
        allocatedBudgetUsd: codeToEdit.allocatedBudgetUsd,
        committedCostUsd: codeToEdit.committedCostUsd,
        actualSpendUsd: codeToEdit.actualSpendUsd,
        currency: codeToEdit.currency || 'USD',
        status: codeToEdit.status,
        costCenter: codeToEdit.costCenter,
        costControllerOwner: codeToEdit.costControllerOwner,
        description: codeToEdit.description || '',
        validFrom: codeToEdit.validFrom,
        validTo: codeToEdit.validTo,
      });
    } else {
      setEditingCode(null);
      setFormData({
        code: `AFE-2026-CAMP-${Math.floor(100 + Math.random() * 900)}`,
        projectName: '',
        wellName: '',
        wellCode: '',
        operator: 'Petronas Carigali',
        allocatedBudgetUsd: 4500000,
        committedCostUsd: 0,
        actualSpendUsd: 0,
        currency: 'USD',
        status: 'Active',
        costCenter: 'CC-EXP-9001',
        costControllerOwner: currentUser?.name || 'Rachel Lee (Cost Controller)',
        description: 'Tubular & OCTG allocation for exploration well section.',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '2026-12-31',
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenAssignModal = (targetChargeCodeId?: string, defaultWellName?: string) => {
    setAssignFeedback(null);
    setAssignWellForm({
      chargeCodeId: targetChargeCodeId || (chargeCodes[0]?.id || ''),
      wellName: defaultWellName || '',
      wellCode: defaultWellName ? `WEL-${defaultWellName.replace(/\s+/g, '-').toUpperCase()}` : '',
      wellType: 'Development',
      targetDepthFt: '',
      rigName: 'Offshore Rig Alpha (Deepwater Champion)',
      notes: ''
    });
    setIsAssignWellModalOpen(true);
  };

  const handleExecuteWellAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignWellForm.chargeCodeId || !assignWellForm.wellName.trim()) {
      setAssignFeedback({ success: false, message: 'Please select a Charge Code and specify the Well Name.' });
      return;
    }

    const res = assignWellToChargeCode(assignWellForm.chargeCodeId, {
      wellName: assignWellForm.wellName.trim(),
      wellCode: assignWellForm.wellCode.trim() || undefined,
      wellType: assignWellForm.wellType,
      targetDepthFt: assignWellForm.targetDepthFt ? parseFloat(assignWellForm.targetDepthFt) : undefined,
      rigName: assignWellForm.rigName,
      notes: assignWellForm.notes
    });

    if (res.success) {
      setAssignFeedback({ success: true, message: res.message });
      setTimeout(() => {
        setIsAssignWellModalOpen(false);
        setAssignFeedback(null);
      }, 1200);
    } else {
      setAssignFeedback({ success: false, message: res.message });
    }
  };

  const handleSaveChargeCode = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.code.trim()) {
      setFormError('AFE / Charge Code identifier is required.');
      return;
    }
    if (!formData.projectName.trim()) {
      setFormError('Project / Campaign name is required.');
      return;
    }

    const payload: Partial<WellChargeCode> = {
      code: formData.code.trim().toUpperCase(),
      projectName: formData.projectName.trim(),
      wellName: formData.wellName.trim() || undefined,
      wellCode: formData.wellCode.trim() || undefined,
      operator: formData.operator,
      allocatedBudgetUsd: Number(formData.allocatedBudgetUsd) || 0,
      committedCostUsd: Number(formData.committedCostUsd) || 0,
      actualSpendUsd: Number(formData.actualSpendUsd) || 0,
      currency: formData.currency,
      status: formData.status,
      costCenter: formData.costCenter.trim().toUpperCase(),
      costControllerOwner: formData.costControllerOwner,
      description: formData.description,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    };

    if (editingCode) {
      const res = updateChargeCode(editingCode.id, payload);
      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormError(res.message);
      }
    } else {
      const res = addChargeCode(payload as any);
      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormError(res.message);
      }
    }
  };

  const handleDeleteChargeCode = (id: string, codeStr: string) => {
    if (window.confirm(`Are you sure you want to remove Charge Code ${codeStr}?`)) {
      const res = deleteChargeCode(id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleExportCsv = () => {
    const headers = ['Charge Code', 'Project Name', 'Well Name', 'Operator', 'Cost Center', 'Allocated Budget USD', 'Committed Cost USD', 'Actual Spend USD', 'Remaining Budget USD', 'Status', 'Valid From', 'Valid To'];
    const rows = chargeCodes.map(c => [
      `"${c.code}"`,
      `"${c.projectName}"`,
      `"${c.wellName || ''}"`,
      `"${c.operator}"`,
      `"${c.costCenter}"`,
      c.allocatedBudgetUsd,
      c.committedCostUsd,
      c.actualSpendUsd,
      c.allocatedBudgetUsd - c.actualSpendUsd,
      `"${c.status}"`,
      `"${c.validFrom}"`,
      `"${c.validTo}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drillcore_charge_codes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkImportJson = () => {
    const parsed = safeJsonParse(importJsonText, null);
    if (!parsed || !Array.isArray(parsed)) {
      setImportFeedback({ success: false, message: 'Invalid JSON: Expected an array of charge code records.' });
      return;
    }
    const res = importChargeCodes(parsed);
    if (res.success) {
      setImportFeedback({ success: true, message: `Successfully imported ${res.importedCount} charge codes.` });
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportFeedback(null);
        setImportJsonText('');
      }, 1500);
    } else {
      setImportFeedback({ success: false, message: `Import error: ${res.errors.join('; ')}` });
    }
  };

  // RBAC Unauthorized Screen
  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-[#121319] border border-rose-500/30 rounded-3xl p-8 sm:p-10 max-w-lg w-full text-center space-y-5 shadow-2xl shadow-rose-950/20">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider font-mono">
              Access Restricted
            </span>
            <h2 className="text-2xl font-extrabold text-white">Cost Controller Hub</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              This module is exclusively accessible by <strong>Cost Controller Personnel</strong> and <strong>System Administrators</strong> only.
            </p>
          </div>

          <div className="p-3.5 bg-black/50 border border-white/10 rounded-2xl text-xs space-y-1 text-left">
            <div className="flex justify-between text-gray-400">
              <span>Logged In User:</span>
              <span className="text-white font-semibold">{currentUser?.name || 'Unknown'}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Current Role:</span>
              <span className="text-amber-400 font-semibold">{currentUser?.role || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Required Role:</span>
              <span className="text-emerald-400 font-semibold">Cost Controller / System Administrator</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab?.('dashboard')}
            className="w-full py-3 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            Return to Operational Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-[#0e0e11] to-black border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <Receipt className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Cost Controller & AFE Financial Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Cost Controller & Admin Exclusive
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
                Assign AFE charge codes for respective wells, establish automated campaign charge-code population, and monitor inventory asset valuations and capital spend.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenAssignModal()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center space-x-2"
            >
              <Link2 className="w-4 h-4" />
              <span>Assign Well Charge Code</span>
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create AFE Code</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/15 text-xs font-semibold rounded-xl transition flex items-center space-x-2"
              title="Export Charge Codes to CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/15 text-xs font-semibold rounded-xl transition flex items-center space-x-2"
              title="Batch Import Charge Codes"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Bulk Import</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
              <span>Total Allocated Budget (AFE)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              ${(costMetrics.totalAllocated / 1000000).toFixed(2)}M
            </div>
            <div className="text-[11px] text-gray-400 flex items-center space-x-1">
              <span>Across {chargeCodes.length} Registered AFEs</span>
            </div>
          </div>

          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
              <span>Assigned Wells (Auto-Populate)</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400 tracking-tight">
              {assignedWellsDirectory.length} Wells
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              <span>✓ Auto-populated on Campaign Creation</span>
            </div>
          </div>

          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
              <span>Actual Spend & Committed</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-cyan-400 tracking-tight">
              ${(costMetrics.totalActual / 1000000).toFixed(2)}M
            </div>
            <div className="text-[11px] text-gray-400">
              <span className="text-white font-mono font-bold">{costMetrics.utilizationRate.toFixed(1)}%</span> of allocated AFE budget
            </div>
          </div>

          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
              <span>Surplus Cost Avoidance</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-purple-300 tracking-tight">
              ${(costMetrics.estimatedSavingsUsd / 1000).toFixed(0)}k
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              <span>{costMetrics.surplusCount} Surplus Items Saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-white/10 bg-[#0e0e11] rounded-2xl p-1.5 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('afeOverview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'afeOverview'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>AFE Charge Codes Directory ({chargeCodes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('wellAssignments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'wellAssignments'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Well & AFE Charge Code Assignment Matrix ({assignedWellsDirectory.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('inventoryValuation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'inventoryValuation'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Inventory Asset Valuation & Cost Tally</span>
        </button>

        <button
          onClick={() => setActiveSubTab('savingsAnalysis')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'savingsAnalysis'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Surplus Cost Recovery & Savings</span>
        </button>
      </div>

      {/* TAB 1: AFE Charge Codes Directory */}
      {activeSubTab === 'afeOverview' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0e0e11] border border-white/10 rounded-2xl p-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search AFE code, project, well, cost center..."
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Near Limit">Near Limit</option>
                <option value="Over Budget">Over Budget</option>
                <option value="Closed">Closed</option>
                <option value="Draft">Draft</option>
              </select>

              <select
                value={selectedOperatorFilter}
                onChange={(e) => setSelectedOperatorFilter(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Operators</option>
                {uniqueOperators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Charge Codes Table */}
          <div className="bg-[#0e0e11] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-black/60 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
                  <tr>
                    <th className="px-4 py-3">AFE Code & Cost Center</th>
                    <th className="px-4 py-3">Project & Assigned Well(s)</th>
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3">Allocated Budget</th>
                    <th className="px-4 py-3">Actual Spend / Committed</th>
                    <th className="px-4 py-3">Budget Utilization</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredChargeCodes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-xs">
                        No AFE charge codes found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredChargeCodes.map(code => {
                      const utilPercent = code.allocatedBudgetUsd > 0 ? (code.actualSpendUsd / code.allocatedBudgetUsd) * 100 : 0;
                      const remainingUsd = code.allocatedBudgetUsd - code.actualSpendUsd;
                      const isNearLimit = utilPercent >= 85 && utilPercent < 100;
                      const isOverBudget = utilPercent >= 100;

                      return (
                        <tr key={code.id} className="hover:bg-white/5 transition group">
                          <td className="px-4 py-3 font-mono">
                            <div className="font-bold text-white flex items-center space-x-1.5">
                              <span>{code.code}</span>
                            </div>
                            <div className="text-[11px] text-gray-400">{code.costCenter}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{code.projectName}</div>
                            {code.wellName && (
                              <div className="text-[11px] text-amber-400 font-mono flex items-center gap-1 mt-0.5">
                                <span>📍 {code.wellName}</span>
                              </div>
                            )}
                            {code.assignedWells && code.assignedWells.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {code.assignedWells.map((w, idx) => {
                                  const name = typeof w === 'string' ? w : w.wellName;
                                  return (
                                    <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                                      {name}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {code.operator}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-white">
                            ${code.allocatedBudgetUsd.toLocaleString()} {code.currency}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            <div className="font-bold text-emerald-400">
                              ${code.actualSpendUsd.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Committed: ${code.committedCostUsd.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-4 py-3 min-w-[160px]">
                            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                              <span className={isOverBudget ? 'text-rose-400 font-bold' : isNearLimit ? 'text-amber-400 font-bold' : 'text-gray-300'}>
                                {utilPercent.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                Rem: ${(remainingUsd / 1000).toFixed(0)}k
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isOverBudget
                                    ? 'bg-rose-500'
                                    : isNearLimit
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(utilPercent, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              code.status === 'Active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : code.status === 'Near Limit'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : code.status === 'Over Budget'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                            }`}>
                              {code.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleOpenAssignModal(code.id, code.wellName)}
                                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[11px] font-bold transition flex items-center gap-1"
                                title="Assign Well to this Charge Code"
                              >
                                <Link2 className="w-3 h-3" />
                                <span>Assign Well</span>
                              </button>
                              <button
                                onClick={() => handleOpenModal(code)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
                                title="Edit Charge Code"
                              >
                                <Edit className="w-3.5 h-3.5 text-amber-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteChargeCode(code.id, code.code)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 transition"
                                title="Delete Charge Code"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* TAB: Well & AFE Charge Code Assignment Matrix */}
      {activeSubTab === 'wellAssignments' && (
        <div className="space-y-4">
          
          {/* Info Header Banner */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Automated Campaign Charge Code Provisioning Engine
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    Zero-Manual Entry Active
                  </span>
                </h4>
                <p className="text-xs text-gray-300 mt-0.5">
                  Cost Controllers can assign and bind AFE Charge Codes to respective wells. When creating new drilling campaigns or adding wells, these charge codes are automatically detected and populated instantly.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenAssignModal()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center space-x-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Assign New Well</span>
            </button>
          </div>

          {/* Table of Well Mappings */}
          <div className="bg-[#0e0e11] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter well name, AFE code, operator..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-xs text-gray-400 font-mono">
                Total Well-AFE Bindings: <strong className="text-white">{filteredAssignedWells.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-black/60 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
                  <tr>
                    <th className="px-4 py-3">Well Name & Code</th>
                    <th className="px-4 py-3">Assigned AFE Charge Code</th>
                    <th className="px-4 py-3">Operating Company</th>
                    <th className="px-4 py-3">Project / Campaign</th>
                    <th className="px-4 py-3">Allocated AFE Budget</th>
                    <th className="px-4 py-3">Auto-Populate Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredAssignedWells.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-xs">
                        No wells registered in Cost Controller repository yet. Click "Assign New Well" to link a well to a charge code.
                      </td>
                    </tr>
                  ) : (
                    filteredAssignedWells.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition group">
                        <td className="px-4 py-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>📍 {item.wellName}</span>
                          </div>
                          {item.wellCode && (
                            <div className="text-[11px] text-gray-400 font-mono">{item.wellCode} {item.wellType && `• ${item.wellType}`}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <div className="font-bold text-emerald-400 flex items-center gap-1">
                            <Receipt className="w-3.5 h-3.5" />
                            <span>{item.afeCode}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {item.operator}
                        </td>
                        <td className="px-4 py-3 text-gray-300 font-medium">
                          {item.projectName}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          ${item.budgetUsd.toLocaleString()} USD
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Auto-Populated on Campaign
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenAssignModal(item.chargeCodeId, item.wellName)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-400 text-[11px] font-semibold transition"
                          >
                            Reassign
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Inventory Asset Valuation & Cost Tally */}
      {activeSubTab === 'inventoryValuation' && (
        <div className="space-y-6">
          <div className="bg-[#0e0e11] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>OCTG & Tubular Asset Capitalization Breakdown</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Real-time balance sheet valuation of active tubular stock, casing strings, drill pipes, and accessories categorized by maintenance and book values.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-black/50 border border-white/10">
                <div className="text-xs text-gray-400 font-semibold mb-1">Total Acquisition / Purchase Cost</div>
                <div className="text-xl font-mono font-bold text-white">${costMetrics.totalPurchaseCost.toLocaleString()} USD</div>
              </div>
              <div className="p-4 rounded-xl bg-black/50 border border-white/10">
                <div className="text-xs text-gray-400 font-semibold mb-1">Current Depreciated Book Value</div>
                <div className="text-xl font-mono font-bold text-emerald-400">${costMetrics.totalBookValue.toLocaleString()} USD</div>
              </div>
              <div className="p-4 rounded-xl bg-black/50 border border-white/10">
                <div className="text-xs text-gray-400 font-semibold mb-1">Total OPEX (Inspection & Refurb)</div>
                <div className="text-xl font-mono font-bold text-amber-400">
                  ${(costMetrics.totalInspectionCost + costMetrics.totalMaintenanceCost + costMetrics.totalRefurbishmentCost).toLocaleString()} USD
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Surplus Cost Recovery & Savings */}
      {activeSubTab === 'savingsAnalysis' && (
        <div className="space-y-6">
          <div className="bg-[#0e0e11] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Surplus Asset Reutilization & Cost Recovery</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Total estimated capital expenditure savings generated by reallocating backloaded and surplus tubulars into active drilling campaigns instead of procurement of new inventory.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Estimated CAPEX Savings</span>
                <div className="text-3xl font-extrabold text-white mt-1 font-mono">
                  ${(costMetrics.estimatedSavingsUsd / 1000).toFixed(1)}k USD
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Calculated based on 85% average replacement cost recovery for {costMetrics.surplusCount} active surplus items.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">AFE Budget Preservation</span>
                <div className="text-3xl font-extrabold text-white mt-1 font-mono">
                  {costMetrics.totalAllocated > 0 ? ((costMetrics.estimatedSavingsUsd / costMetrics.totalAllocated) * 100).toFixed(2) : '0.00'}%
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Portion of total campaign AFE budget conserved through disciplined yard surplus utilization.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN WELL MODAL */}
      {isAssignWellModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e0e12] border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Assign Charge Code to Well</h3>
                  <p className="text-xs text-gray-400">Creates automatic AFE mapping for campaign setup</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAssignWellModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignFeedback && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${assignFeedback.success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'}`}>
                {assignFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                <span>{assignFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleExecuteWellAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Target AFE Charge Code *
                </label>
                <select
                  required
                  value={assignWellForm.chargeCodeId}
                  onChange={(e) => setAssignWellForm({ ...assignWellForm, chargeCodeId: e.target.value })}
                  className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono focus:border-amber-500"
                >
                  <option value="">-- Select AFE Charge Code --</option>
                  {chargeCodes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.projectName} ({c.operator} - ${c.allocatedBudgetUsd.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Well Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={assignWellForm.wellName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setAssignWellForm({ 
                        ...assignWellForm, 
                        wellName: name,
                        wellCode: assignWellForm.wellCode || (name ? `WEL-${name.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}` : '')
                      });
                    }}
                    placeholder="e.g. Well Alpha-03 or Bokor-08"
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Well Code
                  </label>
                  <input
                    type="text"
                    value={assignWellForm.wellCode}
                    onChange={(e) => setAssignWellForm({ ...assignWellForm, wellCode: e.target.value })}
                    placeholder="e.g. WEL-ALP-03"
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Well Type
                  </label>
                  <select
                    value={assignWellForm.wellType}
                    onChange={(e) => setAssignWellForm({ ...assignWellForm, wellType: e.target.value as any })}
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500"
                  >
                    <option value="Exploration">Exploration</option>
                    <option value="Development">Development</option>
                    <option value="Appraisal">Appraisal</option>
                    <option value="Workover / Abandonment">Workover / Abandonment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Target Depth (FT)
                  </label>
                  <input
                    type="number"
                    value={assignWellForm.targetDepthFt}
                    onChange={(e) => setAssignWellForm({ ...assignWellForm, targetDepthFt: e.target.value })}
                    placeholder="e.g. 14500"
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Once assigned, entering <strong>{assignWellForm.wellName || 'this well'}</strong> in any new drilling campaign will auto-populate its AFE Charge Code and operator details.
                </span>
              </div>

              <div className="flex justify-end space-x-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAssignWellModalOpen(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-xl shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save Well Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CHARGE CODE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0e0e12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingCode ? `Edit Charge Code (${editingCode.code})` : 'Create New AFE Well Charge Code'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Track AFE budget, cost center, and equipment commitments
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveChargeCode} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Charge Code / AFE # *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. AFE-2026-ALPHA-01"
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Cost Center #
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.costCenter}
                    onChange={(e) => setFormData({ ...formData, costCenter: e.target.value.toUpperCase() })}
                    placeholder="e.g. CC-EXP-9001"
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Project / Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    placeholder="e.g. Offshore Alpha Deepwater Campaign"
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Well Name / Identification
                  </label>
                  <input
                    type="text"
                    value={formData.wellName}
                    onChange={(e) => setFormData({ ...formData, wellName: e.target.value })}
                    placeholder="e.g. Well Alpha-01"
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Operator
                  </label>
                  <input
                    type="text"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    placeholder="e.g. Petronas Carigali"
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Allocated Budget (USD) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="10000"
                    value={formData.allocatedBudgetUsd}
                    onChange={(e) => setFormData({ ...formData, allocatedBudgetUsd: Number(e.target.value) })}
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Actual Spend (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.actualSpendUsd}
                    onChange={(e) => setFormData({ ...formData, actualSpendUsd: Number(e.target.value) })}
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Near Limit">Near Limit</option>
                    <option value="Over Budget">Over Budget</option>
                    <option value="Closed">Closed</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Description / OCTG Allocation Scope
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Drilling casing strings and chrome tubing allocation..."
                  className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
                >
                  {editingCode ? 'Save Changes' : 'Create AFE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0e0e12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-extrabold text-white">Bulk Import AFE Charge Codes (JSON)</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
            </div>

            {importFeedback && (
              <div className={`p-3 rounded-xl text-xs ${importFeedback.success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'}`}>
                {importFeedback.message}
              </div>
            )}

            <p className="text-xs text-gray-400">
              Paste an array of charge code objects below.
            </p>

            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder={`[\n  {\n    "code": "AFE-2026-NEW-01",\n    "projectName": "New Deepwater Campaign",\n    "allocatedBudgetUsd": 5000000,\n    "costCenter": "CC-EXP-9901"\n  }\n]`}
              className="w-full bg-black/80 border border-white/15 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-500"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-white/5 text-gray-300 text-xs rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImportJson}
                className="px-4 py-2 bg-cyan-500 text-black font-bold text-xs rounded-xl hover:bg-cyan-400 transition"
              >
                Execute Bulk Import
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
