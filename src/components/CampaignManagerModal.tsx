import React, { useState } from 'react';
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
  Check
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
    availableLocations
  } = useDrilling();

  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'wells'>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<DrillingCampaign | null>(null);
  
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

  // New Well Form State
  const [wellName, setWellName] = useState('');
  const [wellCode, setWellCode] = useState('');
  const [wellType, setWellType] = useState<WellDefinition['type']>('Development');
  const [wellStatus, setWellStatus] = useState<WellDefinition['status']>('Planning');
  const [targetDepthFt, setTargetDepthFt] = useState('');
  const [afeCode, setAfeCode] = useState('');
  const [assignedRigName, setAssignedRigName] = useState('Offshore Rig Alpha (Deepwater Champion)');

  if (!isOpen) return null;

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !operator.trim()) return;

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
      wells: [],
      rigs: [
        { id: 'RIG-01', name: 'Offshore Rig Alpha (Deepwater Champion)', location: 'Offshore Rig Alpha' }
      ],
      supplyBases: [
        { id: 'BASE-01', name: 'Main Supply Base Yard (Kemaman)', location: 'Main Supply Base Yard' }
      ],
      focals: [
        { id: 'FOC-01', name: 'Ammar Thaqif', email: 'ammarthaqif.ar@gmail.com', roleTitle: 'Materials Management Focal', assignedLocation: 'Main Supply Base Yard' },
        { id: 'FOC-02', name: 'Farhan Matco', email: 'farhan.matco@petronas.com', roleTitle: 'Materials Coordinator (Matco)', assignedLocation: 'Offshore Rig Alpha' }
      ]
    });

    // Reset Form
    setName('');
    setCode('');
    setOperator('');
    setClientCompany('');
    setDescription('');
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
    
    // Refresh selected campaign reference
    const updated = campaigns.find(c => c.id === selectedCampaign.id);
    if (updated) setSelectedCampaign(updated);
  };

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
              <p className="text-xs text-gray-400 mt-0.5">
                Manage campaigns, wells, rigs, supply bases, and key personnel focal points across operations
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-3 bg-[#14151d] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'list' 
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              All Campaigns ({campaigns.length})
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'create' 
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Plus className="w-4 h-4" />
              New Drilling Campaign
            </button>
            {selectedCampaign && (
              <button
                onClick={() => setActiveTab('wells')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                  activeTab === 'wells' 
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Layers className="w-4 h-4" />
                Manage Wells & Focals ({selectedCampaign.code})
              </button>
            )}
          </div>

          {/* Global Filter Trigger */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Active View Context:</span>
            <select
              value={activeCampaignId}
              onChange={(e) => setActiveCampaignId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#1a1c26] text-amber-400 font-semibold border border-amber-500/30 rounded-xl focus:outline-none"
            >
              <option value="ALL">🌐 All Campaigns & Projects (Global View)</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* LIST TAB */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((camp) => {
                  const isActive = activeCampaignId === camp.id;
                  return (
                    <div 
                      key={camp.id}
                      className={`p-5 rounded-2xl border transition-all relative ${
                        isActive 
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5' 
                          : 'bg-[#181a22] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {camp.code}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                              camp.status === 'Active Execution' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              camp.status === 'Planning' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              {camp.status}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white mt-2">{camp.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Operator: <span className="text-gray-200 font-medium">{camp.operator}</span> {camp.clientCompany && `• Client: ${camp.clientCompany}`}</p>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setActiveCampaignId(camp.id);
                            }}
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

                      {/* Well List Badges */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {camp.wells.map(w => (
                          <span key={w.id} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/10">
                            📍 {w.name} ({w.type})
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
                            Manage Wells & Personnel <ChevronRight className="w-3.5 h-3.5" />
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
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Setup New Drilling Campaign or Multi-Well Project
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Campaign Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAM-PETRONAS-02 or CAM-SHELL-BARAM"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
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
                      <p className="text-gray-400">Code: <span className="text-gray-200">{w.code}</span> | AFE: <span className="text-gray-200">{w.afeCode || 'N/A'}</span></p>
                      <p className="text-gray-400">Rig: <span className="text-amber-300">{w.assignedRigName}</span></p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Well Form */}
              <form onSubmit={handleAddWell} className="bg-[#181a22] p-5 rounded-2xl border border-white/10 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  Add Well to {selectedCampaign.code}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Well Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Well Alpha-03"
                      value={wellName}
                      onChange={(e) => setWellName(e.target.value)}
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
                      className="w-full px-3 py-1.5 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
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
                    <label className="block text-xs text-gray-300 mb-1">AFE Charge Code</label>
                    <input
                      type="text"
                      placeholder="e.g. AFE-2026-DP-903"
                      value={afeCode}
                      onChange={(e) => setAfeCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
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
