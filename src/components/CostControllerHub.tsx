import React, { useState, useMemo } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { WellChargeCode, TubularItem } from '../types/drilling';
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
  Calculator, 
  Receipt, 
  ArrowUpRight, 
  Briefcase,
  Sparkles,
  ChevronRight
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
    items, 
    campaigns, 
    currentUser 
  } = useDrilling();

  const [activeSubTab, setActiveSubTab] = useState<'afeOverview' | 'inventoryValuation' | 'costAllocation' | 'savingsAnalysis'>('afeOverview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedOperatorFilter, setSelectedOperatorFilter] = useState<string>('ALL');

  // Modal State for Add / Edit Charge Code
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<WellChargeCode | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    projectName: '',
    wellName: '',
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
        const matchOperator = c.operator.toLowerCase().includes(q);
        const matchCostCenter = c.costCenter.toLowerCase().includes(q);
        if (!matchCode && !matchProject && !matchWell && !matchOperator && !matchCostCenter) return false;
      }
      if (selectedStatusFilter !== 'ALL' && c.status !== selectedStatusFilter) return false;
      if (selectedOperatorFilter !== 'ALL' && c.operator !== selectedOperatorFilter) return false;
      return true;
    });
  }, [chargeCodes, searchQuery, selectedStatusFilter, selectedOperatorFilter]);

  // Handle open modal for create / edit
  const handleOpenModal = (codeToEdit?: WellChargeCode) => {
    setFormError(null);
    if (codeToEdit) {
      setEditingCode(codeToEdit);
      setFormData({
        code: codeToEdit.code,
        projectName: codeToEdit.projectName,
        wellName: codeToEdit.wellName || '',
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

    if (editingCode) {
      const res = updateChargeCode(editingCode.id, formData);
      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormError(res.message);
      }
    } else {
      const res = addChargeCode(formData);
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
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
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
    } catch (err: any) {
      setImportFeedback({ success: false, message: `JSON Parse error: ${err.message}` });
    }
  };

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
              <div className="flex items-center space-x-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Cost Controller & AFE Financial Hub
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ERP & Cost Control
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
                Track AFE well charge codes, inventory asset valuation, capital expenditure commitments, and surplus reutilization cost savings across all drilling campaigns.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create AFE Charge Code</span>
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
              <span>Actual Spend & Committed</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400 tracking-tight">
              ${(costMetrics.totalActual / 1000000).toFixed(2)}M
            </div>
            <div className="text-[11px] text-gray-400">
              <span className="text-white font-mono font-bold">{costMetrics.utilizationRate.toFixed(1)}%</span> of allocated AFE budget
            </div>
          </div>

          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
              <span>Total Inventory Asset Value</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-cyan-300 tracking-tight">
              ${(costMetrics.totalBookValue / 1000000).toFixed(2)}M
            </div>
            <div className="text-[11px] text-gray-400">
              <span>{items.length} Tracked OCTG & Tool Assets</span>
            </div>
          </div>

          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
              <span>Surplus Reutilization Savings</span>
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
                    <th className="px-4 py-3">Project & Well Linkage</th>
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
                              <div className="text-[11px] text-amber-400 font-mono">{code.wellName}</div>
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
                <div className="text-xs text-gray-400 font-semibold mb-1">Total Maintenance & Inspection Cost</div>
                <div className="text-xl font-mono font-bold text-cyan-400">${(costMetrics.totalInspectionCost + costMetrics.totalMaintenanceCost).toLocaleString()} USD</div>
              </div>
            </div>
          </div>

          {/* Items Valuation Table */}
          <div className="bg-[#0e0e11] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Tubular Asset Cost Register ({items.length} Items)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-black/60 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
                  <tr>
                    <th className="px-4 py-3">Tag & Name</th>
                    <th className="px-4 py-3">Category & Size</th>
                    <th className="px-4 py-3">Charge Code (AFE)</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3">Acquisition Cost</th>
                    <th className="px-4 py-3">Book Value</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {items.slice(0, 30).map(item => (
                    <tr 
                      key={item.id} 
                      onClick={() => onSelectItem && onSelectItem(item)}
                      className="hover:bg-white/5 transition cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono">
                        <div className="font-bold text-white">{item.tagNumber}</div>
                        <div className="text-[11px] text-gray-400">{item.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-200">{item.category}</div>
                        <div className="text-[11px] text-amber-400 font-mono">{item.outerDiameter} • {item.grade}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-400">
                        {item.wellChargeCode || 'Unallocated Pool'}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {item.vendorName || 'Direct Mill'}
                      </td>
                      <td className="px-4 py-3 font-mono text-white font-semibold">
                        ${(item.purchaseCostUsd || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-300 font-semibold">
                        ${(item.currentBookValueUsd || item.purchaseCostUsd || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-gray-300">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Surplus Cost Recovery & Savings */}
      {activeSubTab === 'savingsAnalysis' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-950/40 via-[#0e0e11] to-black border border-purple-500/30 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Surplus Reutilization & Circular Economy Cost Savings</span>
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
              By refurbishing and reallocating surplus OCTG tubulars rather than purchasing newly milled pipe, the drilling campaign achieves measurable CAPEX savings and reduces carbon emissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0e0e11] border border-white/10 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Financial Savings Summary
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Total Surplus Tubular Items:</span>
                  <span className="font-mono font-bold text-white">{costMetrics.surplusCount} items</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Baseline New Procurement Cost:</span>
                  <span className="font-mono font-bold text-gray-300">${(costMetrics.estimatedSavingsUsd / 0.85).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Refurbishment & Re-cert Spend:</span>
                  <span className="font-mono font-bold text-amber-400">${costMetrics.totalRefurbishmentCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 text-emerald-400 font-bold text-sm">
                  <span>Net Estimated Cost Avoidance:</span>
                  <span className="font-mono">${costMetrics.estimatedSavingsUsd.toLocaleString()} USD</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0e0e11] border border-white/10 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Surplus Reutilization Policy
              </h4>
              <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside leading-relaxed">
                <li>Surplus casing with API Spec 5CT Level 4 NDT recertification qualifies for tier-1 reservoir casing strings.</li>
                <li>Transfer charges between well AFEs are credited to the releasing project owner.</li>
                <li>All scrap / non-conforming tubulars are booked to scrap scrap cert accounts.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CHARGE CODE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0e0e12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  {editingCode ? 'Edit AFE Charge Code' : 'Register New AFE Charge Code'}
                </h3>
                <p className="text-xs text-gray-400">Drilling campaign financial allocation & ERP linkage</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-white text-xs font-mono"
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
