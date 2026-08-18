import React, { useState, useMemo } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { DrillingCampaign, WellDefinition, LocationType } from '../types/drilling';
import { 
  FolderKanban, 
  Plus, 
  Layers, 
  Anchor, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  Calendar, 
  ChevronRight, 
  X, 
  Edit3, 
  Trash2, 
  DollarSign,
  Search,
  Check,
  Receipt,
  Zap,
  Info,
  Link2,
  Sparkles
} from 'lucide-react';

interface CampaignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CampaignManagerModal: React.FC<CampaignManagerModalProps> = ({ isOpen, onClose }) => {
  const { 
    campaigns, 
    activeCampaignId, 
    setActiveCampaignId, 
    createCampaign, 
    updateCampaign, 
    deleteCampaign,
    addWellToCampaign,
    getChargeCodeForWell,
    getAllAssignedWells,
    availableLocations,
    chargeCodes
  } = useDrilling();

  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'wells'>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<DrillingCampaign | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Campaign Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [operator, setOperator] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [status, setStatus] = useState<DrillingCampaign['status']>('Active Execution');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [budgetUsd, setBudgetUsd] = useState('');
  const [description, setDescription] = useState('');

  // Initial list of wells during Campaign Creation
  const [campaignWells, setCampaignWells] = useState<Array<{
    name: string;
    code: string;
    type: WellDefinition['type'];
    status: WellDefinition['status'];
    targetDepthFt?: number;
    afeCode?: string;
    assignedRigName?: string;
    autoPopulated?: boolean;
    costCenter?: string;
  }>>([]);

  const [quickWellInput, setQuickWellInput] = useState('');
  const [quickWellAutoNotice, setQuickWellAutoNotice] = useState<string | null>(null);

  // New Well Form State (in Manage Wells tab)
  const [wellName, setWellName] = useState('');
  const [wellCode, setWellCode] = useState('');
  const [wellType, setWellType] = useState<WellDefinition['type']>('Development');
  const [wellStatus, setWellStatus] = useState<WellDefinition['status']>('Planning');
  const [targetDepthFt, setTargetDepthFt] = useState('');
  const [afeCode, setAfeCode] = useState('');
  const [assignedRigName, setAssignedRigName] = useState('Offshore Rig Alpha (Deepwater Champion)');
  const [wellAutoNotice, setWellAutoNotice] = useState<string | null>(null);

  const availableAssignedWells = useMemo(() => {
    return getAllAssignedWells ? getAllAssignedWells() : [];
  }, [getAllAssignedWells, chargeCodes]);

  // Handler when typing well in "Create Campaign" tab to auto-populate
  const handleQuickWellChange = (inputVal: string) => {
    setQuickWellInput(inputVal);
    if (!inputVal.trim()) {
      setQuickWellAutoNotice(null);
      return;
    }

    if (getChargeCodeForWell) {
      const match = getChargeCodeForWell(inputVal.trim());
      if (match) {
        setQuickWellAutoNotice(`Found Cost Controller AFE: ${match.code} (${match.operator} - ${match.projectName})`);
        if (!operator) setOperator(match.operator);
      } else {
        setQuickWellAutoNotice(null);
      }
    }
  };

  const handleAddWellToNewCampaign = () => {
    if (!quickWellInput.trim()) return;

    let targetAfe = '';
    let targetCode = `WEL-${quickWellInput.trim().replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}`;
    let targetType: WellDefinition['type'] = 'Development';
    let targetDepth: number | undefined = undefined;
    let isAuto = false;

    if (getChargeCodeForWell) {
      const match = getChargeCodeForWell(quickWellInput.trim());
      if (match) {
        targetAfe = match.code;
        const matchingWell = match.assignedWells?.find(w => {
          const name = typeof w === 'string' ? w : w.wellName;
          return name.toLowerCase().trim() === quickWellInput.trim().toLowerCase();
        });
        const wellInfoObj = typeof matchingWell === 'object' ? matchingWell : undefined;

        if (wellInfoObj?.wellCode || match.wellCode) targetCode = wellInfoObj?.wellCode || match.wellCode!;
        if (wellInfoObj?.wellType) targetType = wellInfoObj.wellType;
        if (wellInfoObj?.targetDepthFt) targetDepth = wellInfoObj.targetDepthFt;
        isAuto = true;
        if (!operator) setOperator(match.operator);
      }
    }

    setCampaignWells([
      ...campaignWells,
      {
        name: quickWellInput.trim(),
        code: targetCode,
        type: targetType,
        status: 'Planning',
        targetDepthFt: targetDepth,
        afeCode: targetAfe,
        assignedRigName: 'Offshore Rig Alpha (Deepwater Champion)',
        autoPopulated: isAuto
      }
    ]);

    setQuickWellInput('');
    setQuickWellAutoNotice(null);
  };

  const handleSelectPreassignedWell = (assigned: any) => {
    // Check if already added
    if (campaignWells.some(w => w.name.toLowerCase() === assigned.wellName.toLowerCase())) return;

    setCampaignWells([
      ...campaignWells,
      {
        name: assigned.wellName,
        code: assigned.wellCode || `WEL-${assigned.wellName.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}`,
        type: assigned.wellType || 'Development',
        status: 'Planning',
        targetDepthFt: assigned.targetDepthFt,
        afeCode: assigned.afeCode,
        assignedRigName: assigned.rigName || 'Offshore Rig Alpha (Deepwater Champion)',
        autoPopulated: true
      }
    ]);

    if (!operator && assigned.operator) setOperator(assigned.operator);
  };

  const handleRemoveWellFromNewCampaign = (index: number) => {
    setCampaignWells(campaignWells.filter((_, i) => i !== index));
  };

  // Handler when typing well in "Manage Wells" tab
  const handleWellNameChangeInWellsTab = (nameVal: string) => {
    setWellName(nameVal);
    if (!nameVal.trim()) {
      setWellAutoNotice(null);
      return;
    }

    if (getChargeCodeForWell) {
      const match = getChargeCodeForWell(nameVal.trim());
      if (match) {
        setAfeCode(match.code);
        const matchingWell = match.assignedWells?.find(w => {
          const name = typeof w === 'string' ? w : w.wellName;
          return name.toLowerCase().trim() === nameVal.trim().toLowerCase();
        });
        const wellInfoObj = typeof matchingWell === 'object' ? matchingWell : undefined;

        if (wellInfoObj?.wellCode || match.wellCode) setWellCode(wellInfoObj?.wellCode || match.wellCode!);
        if (wellInfoObj?.wellType) setWellType(wellInfoObj.wellType);
        if (wellInfoObj?.targetDepthFt) setTargetDepthFt(String(wellInfoObj.targetDepthFt));
        setWellAutoNotice(`Auto-populated from Cost Controller AFE: ${match.code} (${match.operator})`);
      } else {
        if (!wellCode) {
          setWellCode(`WEL-${nameVal.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}`);
        }
        setWellAutoNotice(null);
      }
    }
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !operator.trim()) return;

    const initialWells: WellDefinition[] = campaignWells.map((w, idx) => ({
      id: `WELL-${Date.now()}-${idx}`,
      name: w.name,
      code: w.code,
      type: w.type,
      status: w.status,
      targetDepthFt: w.targetDepthFt,
      afeCode: w.afeCode,
      assignedRigName: w.assignedRigName || 'Offshore Rig Alpha (Deepwater Champion)'
    }));

    createCampaign({
      name,
      code: code.toUpperCase(),
      operator,
      clientCompany,
      status,
      startDate,
      endDate: endDate || undefined,
      budgetUsd: budgetUsd ? parseFloat(budgetUsd) : undefined,
      description,
      wells: initialWells,
      rigs: [
        { id: 'RIG-01', name: 'Offshore Rig Alpha (Deepwater Champion)', location: 'Offshore Rig Alpha' }
      ],
      supplyBases: [
        { id: 'BASE-01', name: 'Main Supply Base Yard (Kemaman)', location: 'Main Supply Base Yard' }
      ],
      focals: [
        { id: 'FOC-01', name: 'Zulhairi Azman', email: 'zulhairi.materials@apexdrilling.com', roleTitle: 'Materials Management Focal', assignedLocation: 'Main Supply Base Yard' },
        { id: 'FOC-02', name: 'Farhan Matco', email: 'farhan.matco@petronas.com', roleTitle: 'Materials Coordinator (Matco)', assignedLocation: 'Offshore Rig Alpha' }
      ]
    });

    // Reset Form
    setName('');
    setCode('');
    setOperator('');
    setClientCompany('');
    setDescription('');
    setCampaignWells([]);
    setActiveTab('list');
  };

  const handleAddWell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !wellName.trim() || !wellCode.trim()) return;

    addWellToCampaign(selectedCampaign.id, {
      name: wellName,
      code: wellCode.toUpperCase(),
      type: wellType,
      status: wellStatus,
      targetDepthFt: targetDepthFt ? parseFloat(targetDepthFt) : undefined,
      afeCode,
      assignedRigName
    });

    // Reset Well Form
    setWellName('');
    setWellCode('');
    setAfeCode('');
    setTargetDepthFt('');
    setWellAutoNotice(null);
    
    // Refresh selected campaign reference
    const updated = campaigns.find(c => c.id === selectedCampaign.id);
    if (updated) setSelectedCampaign(updated);
  };

  const filteredCampaigns = campaigns.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.operator.toLowerCase().includes(q) ||
      c.wells.some(w => w.name.toLowerCase().includes(q) || (w.afeCode && w.afeCode.toLowerCase().includes(q)))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#121319] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#181a22] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Drilling Projects & Campaign Hub
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                  Multi-Rig / Multi-Base Architecture
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Setup campaigns with automatic Cost Controller AFE Charge Code population for respective wells.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#151720] px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'list' 
                ? 'border-amber-400 text-amber-400' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Active Campaigns ({campaigns.length})
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'create' 
                ? 'border-amber-400 text-amber-400' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            Create New Campaign & Populate Wells
          </button>

          {selectedCampaign && (
            <button
              onClick={() => setActiveTab('wells')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'wells' 
                  ? 'border-amber-400 text-amber-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Anchor className="w-4 h-4" />
              Manage Wells: {selectedCampaign.code}
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* LIST TAB */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search campaign, operator, well..."
                    className="w-full pl-9 pr-4 py-2 bg-[#181a22] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={() => setActiveTab('create')}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Campaign
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredCampaigns.map((camp) => {
                  const isActive = activeCampaignId === camp.id;
                  return (
                    <div 
                      key={camp.id} 
                      className={`p-5 rounded-2xl border transition ${
                        isActive 
                          ? 'bg-[#1a1c26] border-amber-500/40 shadow-lg shadow-amber-500/10' 
                          : 'bg-[#181a22] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                              {camp.code}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              camp.status === 'Active Execution'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {camp.status}
                            </span>
                            {isActive && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500 text-black">
                                Current Active Workspace
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-white mt-1.5">{camp.name}</h3>
                          <p className="text-xs text-gray-400">Operator: <strong className="text-gray-200">{camp.operator}</strong> {camp.clientCompany && `| Partner: ${camp.clientCompany}`}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setActiveCampaignId(camp.id)}
                            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                              isActive 
                                ? 'bg-amber-500 text-black font-bold' 
                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                            title={isActive ? 'Currently Active Campaign Context' : 'Set as Active Campaign Context'}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {isActive ? 'Active Context' : 'Select'}
                          </button>
                        </div>
                      </div>

                      {camp.description && (
                        <p className="text-xs text-gray-300 bg-black/30 p-2.5 rounded-xl mt-3 border border-white/5">
                          {camp.description}
                        </p>
                      )}

                      {/* Multi-Structure Indicators */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/5 text-xs text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span><strong>{camp.wells.length}</strong> Well(s)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Anchor className="w-3.5 h-3.5 text-blue-400" />
                          <span><strong>{camp.rigs.length}</strong> Rig(s)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span><strong>{camp.supplyBases.length}</strong> Supply Base(s)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                          <span><strong>{camp.focals.length}</strong> Key Focal(s)</span>
                        </div>
                      </div>

                      {/* Well List Badges with AFE Charge Codes */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {camp.wells.map(w => (
                          <span key={w.id} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/10 flex items-center gap-1">
                            <span>📍 {w.name}</span>
                            {w.afeCode && (
                              <span className="text-emerald-400 font-mono font-bold">[{w.afeCode}]</span>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Action Bar */}
                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          Started: {camp.startDate}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCampaign(camp);
                              setActiveTab('wells');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition text-xs font-semibold flex items-center gap-1"
                          >
                            Manage Wells & Charge Codes <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCampaign(camp.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CREATE CAMPAIGN TAB */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateCampaign} className="space-y-5 bg-[#181a22] p-6 rounded-2xl border border-white/10">
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Setup New Drilling Campaign or Multi-Well Project
                </h3>
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                  <Zap className="w-3.5 h-3.5" />
                  Auto-Populate Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Campaign Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAM-PETRONAS-02 or CAM-SHELL-BARAM"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Campaign Title / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. North Malay Basin HPHT Deepwater Drilling"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Operating Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Petronas Carigali Sdn Bhd / Shell / ExxonMobil"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Joint Venture / Client Partner</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarawak Shell Berhad / PTTEP"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active Execution">Active Execution</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* LIST OF WELLS WITH ZERO-MANUAL AUTO-POPULATION */}
              <div className="bg-[#121319] border border-amber-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Campaign Wells & Automated Charge Codes ({campaignWells.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Type a well name or pick from Cost Controller assigned wells below.
                  </span>
                </div>

                {/* Quick Add Well Input with Auto Detection */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={quickWellInput}
                      onChange={(e) => handleQuickWellChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddWellToNewCampaign();
                        }
                      }}
                      placeholder="Enter well name (e.g. Well Alpha-01, Bokor-08, Seligi-04)..."
                      className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddWellToNewCampaign}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition shrink-0"
                  >
                    Add Well
                  </button>
                </div>

                {quickWellAutoNotice && (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{quickWellAutoNotice}</span>
                  </div>
                )}

                {/* Pre-assigned quick pick chips from Cost Controller */}
                {availableAssignedWells.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-amber-400" />
                      <span>Available Cost Controller Assigned Wells (Click to add):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableAssignedWells.map((assigned, idx) => {
                        const isAdded = campaignWells.some(w => w.name.toLowerCase() === assigned.wellName.toLowerCase());
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectPreassignedWell(assigned)}
                            disabled={isAdded}
                            className={`text-[10px] px-2 py-1 rounded-lg border font-mono transition flex items-center gap-1 ${
                              isAdded
                                ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            <span>📍 {assigned.wellName}</span>
                            <span className="font-bold">[{assigned.afeCode}]</span>
                            {isAdded ? <Check className="w-3 h-3 text-gray-500" /> : <Plus className="w-3 h-3 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Current Wells Table in Campaign */}
                {campaignWells.length > 0 && (
                  <div className="mt-3 border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-black/50 text-gray-400 text-[10px] uppercase font-mono border-b border-white/10">
                        <tr>
                          <th className="px-3 py-2">Well Name & Code</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">AFE Charge Code</th>
                          <th className="px-3 py-2">Provisioning</th>
                          <th className="px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {campaignWells.map((w, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="px-3 py-2">
                              <span className="font-bold text-white">{w.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono ml-2">{w.code}</span>
                            </td>
                            <td className="px-3 py-2 text-gray-300">{w.type}</td>
                            <td className="px-3 py-2 font-mono font-bold text-emerald-400">
                              {w.afeCode ? w.afeCode : <span className="text-gray-500 font-normal">Unassigned</span>}
                            </td>
                            <td className="px-3 py-2">
                              {w.autoPopulated ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  ✓ Auto-Populated
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400">
                                  Manual Entry
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveWellFromNewCampaign(idx)}
                                className="text-gray-400 hover:text-rose-400 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Campaign Scope & Objective Notes</label>
                <textarea
                  rows={3}
                  placeholder="Describe well program objectives, tubular CRA specifications, supply base routing, and focal responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save & Launch Campaign
                </button>
              </div>
            </form>
          )}

          {/* MANAGE WELLS TAB */}
          {activeTab === 'wells' && selectedCampaign && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-400">{selectedCampaign.code}</span>
                  <h3 className="text-base font-bold text-white">{selectedCampaign.name}</h3>
                  <p className="text-xs text-gray-400">Operator: {selectedCampaign.operator}</p>
                </div>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="px-3 py-1.5 bg-white/5 text-xs text-gray-300 rounded-xl hover:bg-white/10"
                >
                  Switch Campaign
                </button>
              </div>

              {/* Existing Wells List */}
              <div className="bg-[#181a22] p-5 rounded-2xl border border-white/10">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Assigned Wells ({selectedCampaign.wells.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCampaign.wells.map(w => (
                    <div key={w.id} className="p-3 bg-[#121319] border border-white/10 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{w.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {w.type}
                        </span>
                      </div>
                      <p className="text-gray-400">
                        Code: <span className="text-gray-200">{w.code}</span> | AFE: <span className="text-emerald-400 font-mono font-bold">{w.afeCode || 'N/A'}</span>
                      </p>
                      <p className="text-gray-400">Rig: <span className="text-amber-300">{w.assignedRigName}</span></p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Well Form */}
              <form onSubmit={handleAddWell} className="bg-[#181a22] p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-400" />
                    Add Well to {selectedCampaign.code}
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    Auto AFE Detection
                  </span>
                </div>

                {wellAutoNotice && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{wellAutoNotice}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Well Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Well Alpha-03 or Bokor-08"
                      value={wellName}
                      onChange={(e) => handleWellNameChangeInWellsTab(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Well Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WEL-ALP-03"
                      value={wellCode}
                      onChange={(e) => setWellCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#121319] border border-white/10 rounded-xl text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Well Type</label>
                    <select
                      value={wellType}
                      onChange={(e) => setWellType(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Exploration">Exploration</option>
                      <option value="Development">Development</option>
                      <option value="Appraisal">Appraisal</option>
                      <option value="Workover / Abandonment">Workover / Abandonment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-300 mb-1">AFE Charge Code (Auto-Populated)</label>
                    <input
                      type="text"
                      placeholder="e.g. AFE-2026-DP-903"
                      value={afeCode}
                      onChange={(e) => setAfeCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#121319] border border-white/10 rounded-xl text-emerald-400 font-mono font-bold text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add Well to Campaign
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
