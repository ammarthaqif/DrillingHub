import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { HoleSection, EquipmentCondition, LocationType, ItemCategory } from '../types/drilling';
import { 
  HardHat, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Plus, 
  AlertTriangle, 
  Ship, 
  Package, 
  Layers, 
  FileCheck2,
  Trash2,
  ListFilter
} from 'lucide-react';

export const RigSiteHub: React.FC = () => {
  const { 
    currentUser, 
    items, 
    rigCallouts, 
    createRigCallout, 
    rigBackloads, 
    createRigBackload,
    availableHoleSections,
    availableCategories
  } = useDrilling();

  const [activeTab, setActiveTab] = useState<'materialCallout' | 'prepareBackload'>('materialCallout');

  // Material Callout Request State
  const [calloutHoleSection, setCalloutHoleSection] = useState<HoleSection>('17-1/2" Intermediate');
  const [calloutUrgency, setCalloutUrgency] = useState<'Routine' | 'Urgent Drilling Callout' | 'Rig Stop Emergency'>('Urgent Drilling Callout');
  const [requiredDate, setRequiredDate] = useState('2026-08-10');
  const [calloutDesc, setCalloutDesc] = useState('13-3/8" Intermediate Casing string accessories and centralizers');
  const [calloutCategory, setCalloutCategory] = useState<ItemCategory>('Casing');
  const [calloutJoints, setCalloutJoints] = useState(40);
  const [calloutSuccessMsg, setCalloutSuccessMsg] = useState<string | null>(null);

  // Rig Backload Preparation State
  const [backloadVessel, setBackloadVessel] = useState('MV Crest Sentinel (Voyage 104)');
  const [backloadVesselEta, setBackloadVesselEta] = useState('2026-08-12T14:00');
  const [backloadKpiSlaHours, setBackloadKpiSlaHours] = useState<number>(24);
  const [backloadSuccessMsg, setBackloadSuccessMsg] = useState<string | null>(null);

  // Backload Item Selection & Form Mode
  const [itemEntryMode, setItemEntryMode] = useState<'selectFromRig' | 'manualEntry'>('selectFromRig');
  const [selectedRigItemId, setSelectedRigItemId] = useState<string>('');
  
  // Manual Tubular Detail Form State
  const [manualTagNumber, setManualTagNumber] = useState('');
  const [manualSerialNumber, setManualSerialNumber] = useState('');
  const [manualHeatNumber, setManualHeatNumber] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState<ItemCategory>('Casing');
  const [manualHoleSection, setManualHoleSection] = useState<HoleSection>('17-1/2" Intermediate');
  const [manualOD, setManualOD] = useState('13 3/8"');
  const [manualWeight, setManualWeight] = useState('68 lb/ft');
  const [manualGrade, setManualGrade] = useState('L-80 13Cr');
  const [manualConnection, setManualConnection] = useState('VAM TOP');
  const [manualLengthFt, setManualLengthFt] = useState(4200);
  const [manualJoints, setManualJoints] = useState(100);
  const [backloadReason, setBackloadReason] = useState<'Campaign Finished' | 'Damaged Thread / BHA' | 'Inspection Due' | 'Excess Stock' | 'Damaged / Reject'>('Campaign Finished');
  const [backloadCondition, setBackloadCondition] = useState<EquipmentCondition>('Used - Good');

  // Staged Items in Manifest Batch
  const [stagedBackloadItems, setStagedBackloadItems] = useState<any[]>([]);

  // Submit Rig Material Call-Out Request
  const handleCreateCallout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calloutDesc) return;

    const reqNo = `RMC-2026-${Math.floor(100 + Math.random() * 900)}`;

    createRigCallout({
      requestNumber: reqNo,
      createdDate: new Date().toISOString().slice(0, 10),
      rigLocation: 'Offshore Rig Alpha',
      requestedBy: `${currentUser?.name || 'Rig Matco'} (${currentUser?.role || 'Toolpusher'})`,
      requiredDeliveryDate: requiredDate,
      holeSection: calloutHoleSection,
      urgency: calloutUrgency,
      items: [
        {
          description: calloutDesc,
          category: calloutCategory,
          quantityJoints: Number(calloutJoints),
        }
      ],
      status: 'Submitted to Supply Base',
    });

    setCalloutSuccessMsg(`Material Call-out ${reqNo} successfully submitted to Supply Base Matco!`);
  };

  // Add Item to Staged Manifest Batch
  const handleAddStagedItem = (e: React.FormEvent) => {
    e.preventDefault();
    setBackloadSuccessMsg(null);

    if (itemEntryMode === 'selectFromRig') {
      const targetItem = items.find(i => i.id === selectedRigItemId);
      if (!targetItem) return;

      const newItem = {
        itemId: targetItem.id,
        tagNumber: targetItem.tagNumber,
        serialNumber: targetItem.serialNumber,
        heatNumber: targetItem.heatNumber,
        name: targetItem.name,
        category: targetItem.category,
        holeSection: targetItem.holeSection,
        outerDiameter: targetItem.outerDiameter,
        weightLbFt: targetItem.weightLbFt,
        grade: targetItem.grade,
        connectionType: targetItem.connectionType,
        lengthFt: targetItem.lengthFt,
        quantityJoints: targetItem.quantityJoints || 1,
        conditionOnRig: backloadCondition,
        reasonForBackload: backloadReason,
        actionType: 'PENDING_DECISION' as const,
      };

      setStagedBackloadItems(prev => [...prev, newItem]);
      setSelectedRigItemId('');
    } else {
      if (!manualTagNumber || !manualName) return;

      const newItem = {
        tagNumber: manualTagNumber,
        serialNumber: manualSerialNumber || `SN-${manualTagNumber}`,
        heatNumber: manualHeatNumber || 'HT-VAR-01',
        name: manualName,
        category: manualCategory,
        holeSection: manualHoleSection,
        outerDiameter: manualOD,
        weightLbFt: manualWeight,
        grade: manualGrade,
        connectionType: manualConnection,
        lengthFt: Number(manualLengthFt),
        quantityJoints: Number(manualJoints),
        conditionOnRig: backloadCondition,
        reasonForBackload: backloadReason,
        actionType: 'PENDING_DECISION' as const,
      };

      setStagedBackloadItems(prev => [...prev, newItem]);
      
      // Reset manual form
      setManualTagNumber('');
      setManualSerialNumber('');
      setManualHeatNumber('');
      setManualName('');
    }
  };

  const handleRemoveStagedItem = (index: number) => {
    setStagedBackloadItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Dispatch Final Manifest
  const handleDispatchBackloadManifest = () => {
    if (stagedBackloadItems.length === 0) return;

    const manifestNo = `BLM-2026-${Math.floor(8000 + Math.random() * 1900)}`;

    createRigBackload({
      manifestNumber: manifestNo,
      createdDate: new Date().toISOString().slice(0, 10),
      rigLocation: 'Offshore Rig Alpha',
      preparedBy: `${currentUser.name} (${currentUser.role})`,
      vesselName: backloadVessel,
      vesselEta: backloadVesselEta,
      kpiSlaTargetHours: backloadKpiSlaHours,
      items: stagedBackloadItems,
      status: 'Dispatched from Rig',
    });

    setBackloadSuccessMsg(`Backload Manifest ${manifestNo} containing ${stagedBackloadItems.length} tubular line items dispatched via ${backloadVessel}! Preset KPI SLA set to ${backloadKpiSlaHours}h.`);
    setStagedBackloadItems([]);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <HardHat className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-extrabold text-white">Rig Site Materials Coordinator & Toolpusher Hub</h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Location: Offshore Rig Alpha
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Submit material call-outs to Supply Base Matco, track vessel load-out status, and prepare backload lists for equipment returning from the rig.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-2 bg-black/40 p-1.5 rounded-xl border border-white/10 self-start lg:self-auto">
          <button
            onClick={() => setActiveTab('materialCallout')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'materialCallout' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Material Call-Outs ({rigCallouts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('prepareBackload')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'prepareBackload' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Prepare Rig Backload ({rigBackloads.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MATERIAL CALL-OUT REQUESTS */}
      {activeTab === 'materialCallout' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Call-Out Submission Form */}
          <form onSubmit={handleCreateCallout} className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Send className="w-4 h-4 text-amber-400" />
                <span>Submit Rig Material Call-Out Request</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Sent directly to Supply Base Matco queue to prepare, rack-pick, stage, and manifest onto supply vessel.
              </p>
            </div>

            {calloutSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {calloutSuccessMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Target Hole Section</label>
              <select
                value={calloutHoleSection}
                onChange={(e) => setCalloutHoleSection(e.target.value as HoleSection)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {availableHoleSections.map(sec => (
                  <option key={sec} value={sec} className="bg-[#141417] text-white">{sec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Urgency Level</label>
              <select
                value={calloutUrgency}
                onChange={(e) => setCalloutUrgency(e.target.value as any)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Routine">Routine (Next Scheduled Vessel)</option>
                <option value="Urgent Drilling Callout">Urgent Drilling Callout (Hot Shot Vessel)</option>
                <option value="Rig Stop Emergency">Rig Stop Emergency (NPT Alert)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Required Delivery Date on Rig</label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Equipment Description</label>
              <input
                type="text"
                value={calloutDesc}
                onChange={(e) => setCalloutDesc(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Category</label>
                <select
                  value={calloutCategory}
                  onChange={(e) => setCalloutCategory(e.target.value as ItemCategory)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat} className="bg-[#141417] text-white">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Joints / Qty</label>
                <input
                  type="number"
                  min="1"
                  value={calloutJoints}
                  onChange={(e) => setCalloutJoints(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Call-Out to Supply Base</span>
            </button>
          </form>

          {/* Active Call-Outs Status List */}
          <div className="lg:col-span-2 bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="border-b border-white/10 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Rig Site Call-Out Status Dashboard</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {rigCallouts.length} Requests
              </span>
            </div>

            <div className="space-y-3">
              {rigCallouts.map((rmc) => (
                <div key={rmc.id} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-amber-400 text-xs">{rmc.requestNumber}</span>
                        <span className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                          rmc.urgency === 'Rig Stop Emergency' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {rmc.urgency}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Section: <strong>{rmc.holeSection}</strong> • Required: <strong>{rmc.requiredDeliveryDate}</strong>
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 self-start sm:self-auto">
                      {rmc.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    {rmc.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between p-2 rounded bg-white/5 text-gray-300">
                        <span>{it.description} ({it.category})</span>
                        <strong className="text-white font-mono">{it.quantityJoints} Jts</strong>
                      </div>
                    ))}
                  </div>

                  {rmc.preparedBySupplyBaseMatco && (
                    <p className="text-[10px] text-gray-500 font-mono">
                      Staged at Supply Base by Matco: {rmc.preparedBySupplyBaseMatco}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PREPARE RIG BACKLOAD LIST */}
      {activeTab === 'prepareBackload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Backload Manifest Creator & Staging Panel */}
          <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-5">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Prepare Rig Equipment Backload Manifest</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Select from rig inventory OR manually specify tubular details to backload onto supply vessel.
              </p>
            </div>

            {backloadSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{backloadSuccessMsg}</span>
              </div>
            )}

            {/* Entry Mode Selector */}
            <div className="flex rounded-xl bg-black/50 p-1 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setItemEntryMode('selectFromRig')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                  itemEntryMode === 'selectFromRig' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Pick from Rig Deck
              </button>
              <button
                type="button"
                onClick={() => setItemEntryMode('manualEntry')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                  itemEntryMode === 'manualEntry' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                + Manual Tubular Entry
              </button>
            </div>

            {/* Add Item Form */}
            <form onSubmit={handleAddStagedItem} className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                {itemEntryMode === 'selectFromRig' ? 'Select Active Equipment on Rig' : 'Enter Tubular Technical Specifications'}
              </p>

              {itemEntryMode === 'selectFromRig' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Equipment on Rig Pipe Deck</label>
                  <select
                    value={selectedRigItemId}
                    onChange={(e) => setSelectedRigItemId(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Equipment on Rig Deck --</option>
                    {items.filter(i => i.currentLocation === 'Offshore Rig Alpha').map(item => (
                      <option key={item.id} value={item.id} className="bg-[#141417] text-white">
                        {item.tagNumber} - {item.name} ({item.quantityJoints} Jts)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Tag Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. CSG-1338-901"
                        value={manualTagNumber}
                        onChange={(e) => setManualTagNumber(e.target.value)}
                        required
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Serial Number</label>
                      <input
                        type="text"
                        placeholder="e.g. SN-90011"
                        value={manualSerialNumber}
                        onChange={(e) => setManualSerialNumber(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Tubular Description / Name *</label>
                    <input
                      type="text"
                      placeholder='e.g. 13-3/8" Casing 68# L-80 VAM TOP'
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">OD Size</label>
                      <input
                        type="text"
                        value={manualOD}
                        onChange={(e) => setManualOD(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Grade</label>
                      <input
                        type="text"
                        value={manualGrade}
                        onChange={(e) => setManualGrade(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Connection</label>
                      <input
                        type="text"
                        value={manualConnection}
                        onChange={(e) => setManualConnection(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Quantity Joints</label>
                      <input
                        type="number"
                        min="1"
                        value={manualJoints}
                        onChange={(e) => setManualJoints(Number(e.target.value))}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Tally Length (Ft)</label>
                      <input
                        type="number"
                        value={manualLengthFt}
                        onChange={(e) => setManualLengthFt(Number(e.target.value))}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Backload Reason</label>
                  <select
                    value={backloadReason}
                    onChange={(e) => setBackloadReason(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Campaign Finished">Campaign Finished</option>
                    <option value="Damaged Thread / BHA">Damaged Thread / BHA</option>
                    <option value="Inspection Due">Inspection Certificate Due</option>
                    <option value="Excess Stock">Excess Rig Stock</option>
                    <option value="Damaged / Reject">Damaged / Reject</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Condition Tag</label>
                  <select
                    value={backloadCondition}
                    onChange={(e) => setBackloadCondition(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Used - Good">Green Tag: Used - Good</option>
                    <option value="Backloaded - Pending Recert">Yellow Tag: Pending Recert</option>
                    <option value="Damaged / Reject">Red Tag: Damaged / Reject</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={itemEntryMode === 'selectFromRig' ? !selectedRigItemId : (!manualTagNumber || !manualName)}
                className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs uppercase rounded-lg shadow transition flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item to Manifest Staging List</span>
              </button>
            </form>

            {/* Vessel Header & SLA Target Setup */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Ship className="w-3.5 h-3.5 text-amber-400" />
                <span>Vessel Logistics & Preset KPI SLA Target</span>
              </h4>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Assigned Backload Vessel *</label>
                <input
                  type="text"
                  value={backloadVessel}
                  onChange={(e) => setBackloadVessel(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Vessel ETA at Base Quay</label>
                  <input
                    type="datetime-local"
                    value={backloadVesselEta}
                    onChange={(e) => setBackloadVesselEta(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Preset Action KPI SLA Target</label>
                  <select
                    value={backloadKpiSlaHours}
                    onChange={(e) => setBackloadKpiSlaHours(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value={12}>12 Hours SLA (Urgent Inspection / Disposal)</option>
                    <option value={24}>24 Hours SLA (Standard Base Protocol)</option>
                    <option value={48}>48 Hours SLA (Extended Campaign Backload)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Staged Items List & Dispatch Button */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Staged Items Batch ({stagedBackloadItems.length})</span>
                <span className="font-mono text-amber-400 font-bold">
                  Total Jts: {stagedBackloadItems.reduce((acc, i) => acc + (i.quantityJoints || 0), 0)}
                </span>
              </div>

              {stagedBackloadItems.length === 0 ? (
                <p className="text-[11px] text-gray-500 italic text-center py-4 bg-black/20 rounded-xl border border-dashed border-white/10">
                  No items added to backload manifest batch yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {stagedBackloadItems.map((st, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-black/60 border border-white/10 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-amber-300">{st.tagNumber}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300 font-mono">
                            {st.quantityJoints} Jts
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 line-clamp-1">{st.name}</p>
                        <p className="text-[10px] text-gray-400">Reason: {st.reasonForBackload}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStagedItem(idx)}
                        className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleDispatchBackloadManifest}
                disabled={stagedBackloadItems.length === 0}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center space-x-2 mt-2"
              >
                <Ship className="w-4 h-4" />
                <span>Issue & Dispatch Backload Manifest to Base</span>
              </button>
            </div>
          </div>

          {/* Active Dispatched Backload Manifests Table */}
          <div className="lg:col-span-2 bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="border-b border-white/10 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Ship className="w-4 h-4 text-amber-400" />
                <span>Dispatched Rig Backload Tracking Manifests</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {rigBackloads.length} Active Manifests
              </span>
            </div>

            <div className="space-y-4">
              {rigBackloads.map((rbl) => (
                <div key={rbl.id} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 text-xs shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-extrabold text-amber-400 text-sm">{rbl.manifestNumber}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          rbl.status.includes('Completed') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          rbl.status.includes('Arrived') ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {rbl.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 mt-0.5">
                        Vessel: <strong>{rbl.vesselName}</strong> • Dispatched: <strong>{rbl.createdDate}</strong> by <strong>{rbl.preparedBy}</strong>
                      </p>
                    </div>

                    <div className="text-right self-start sm:self-auto">
                      <span className="text-[10px] text-amber-400/90 font-mono block">
                        ETA: {rbl.vesselEta ? rbl.vesselEta.replace('T', ' ') : 'En Route'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono block">
                        Preset KPI Target: {rbl.kpiSlaTargetHours} Hours SLA
                      </span>
                    </div>
                  </div>

                  {/* Items Tally Table */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manifested Tubular Equipment:</p>
                    <div className="divide-y divide-white/5 border border-white/5 rounded-lg overflow-hidden">
                      {rbl.items.map((it, idx) => (
                        <div key={idx} className="p-2 bg-white/[0.02] flex items-center justify-between text-xs gap-2">
                          <div>
                            <span className="font-mono font-bold text-white mr-2">{it.tagNumber}</span>
                            <span className="text-gray-300">{it.name}</span>
                            <span className="text-[10px] text-gray-400 ml-2">({it.reasonForBackload})</span>
                          </div>
                          <div className="flex items-center space-x-3 shrink-0">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              it.conditionOnRig === 'Damaged / Reject' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {it.conditionOnRig}
                            </span>
                            <strong className="text-white font-mono">{it.quantityJoints} Jts</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {rbl.quaysideInspectionNotes && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                      <strong>Base Quayside Notes:</strong> {rbl.quaysideInspectionNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
