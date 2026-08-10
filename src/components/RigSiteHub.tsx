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
  const [selectedRigItemId, setSelectedRigItemId] = useState<string>('');
  const [backloadReason, setBackloadReason] = useState<'Campaign Finished' | 'Damaged Thread / BHA' | 'Inspection Due' | 'Excess Stock'>('Campaign Finished');
  const [backloadCondition, setBackloadCondition] = useState<EquipmentCondition>('Used - Good');
  const [backloadSuccessMsg, setBackloadSuccessMsg] = useState<string | null>(null);

  // Rig Items on Deck
  const rigItems = items.filter(i => i.currentLocation === 'Offshore Rig Alpha');

  // Handle Material Callout Submission
  const handleCreateCallout = (e: React.FormEvent) => {
    e.preventDefault();
    setCalloutSuccessMsg(null);

    createRigCallout({
      requestNumber: `RMC-2026-${Math.floor(100 + Math.random() * 900)}`,
      createdDate: new Date().toISOString().slice(0, 10),
      rigLocation: 'Offshore Rig Alpha',
      requestedBy: `${currentUser.name} (${currentUser.role})`,
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

    setCalloutSuccessMsg('Material Call-Out submitted to Supply Base Matco queue for staging and loading!');
  };

  // Handle Rig Backload List Submission
  const handleCreateBackload = (e: React.FormEvent) => {
    e.preventDefault();
    setBackloadSuccessMsg(null);

    const targetItem = items.find(i => i.id === selectedRigItemId);
    if (!targetItem) return;

    createRigBackload({
      manifestNumber: `RBL-2026-${Math.floor(100 + Math.random() * 900)}`,
      createdDate: new Date().toISOString().slice(0, 10),
      rigLocation: 'Offshore Rig Alpha',
      preparedBy: `${currentUser.name} (Rig Toolpusher)`,
      vesselName: backloadVessel,
      items: [
        {
          itemId: targetItem.id,
          tagNumber: targetItem.tagNumber,
          name: targetItem.name,
          quantityJoints: targetItem.quantityJoints || 1,
          conditionOnRig: backloadCondition,
          reasonForBackload: backloadReason,
        }
      ],
      status: 'Dispatched from Rig',
    });

    setBackloadSuccessMsg(`Backload manifest issued for ${targetItem.tagNumber}! Dispatched via ${backloadVessel} to Supply Base.`);
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
          
          {/* Backload Manifest Creator */}
          <form onSubmit={handleCreateBackload} className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Prepare Rig Equipment Backload Manifest</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Select items on rig pipe deck returning to supply base (pulled drill pipe, campaign surplus, or damaged tools).
              </p>
            </div>

            {backloadSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {backloadSuccessMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Select Equipment Currently on Rig</label>
              <select
                value={selectedRigItemId}
                onChange={(e) => setSelectedRigItemId(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Choose Equipment on Rig Pipe Deck --</option>
                {rigItems.map(item => (
                  <option key={item.id} value={item.id} className="bg-[#141417] text-white">
                    {item.tagNumber} - {item.name} ({item.quantityJoints} Jts)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Assigned Supply Vessel</label>
              <input
                type="text"
                value={backloadVessel}
                onChange={(e) => setBackloadVessel(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Reason for Backloading</label>
              <select
                value={backloadReason}
                onChange={(e) => setBackloadReason(e.target.value as any)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Campaign Finished">Section / Campaign Finished</option>
                <option value="Damaged Thread / BHA">Damaged Thread / BHA Inspection Required</option>
                <option value="Inspection Due">Inspection Certificate Due / Overdue</option>
                <option value="Excess Stock">Excess Rig Deck Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Condition Tag on Rig</label>
              <select
                value={backloadCondition}
                onChange={(e) => setBackloadCondition(e.target.value as any)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Used - Good">Green Tag: Used - Good</option>
                <option value="Backloaded - Pending Recert">Yellow Tag: Backloaded - Pending Recert</option>
                <option value="Damaged / Reject">Red Tag: Damaged / Reject</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedRigItemId}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
            >
              <Ship className="w-4 h-4" />
              <span>Dispatch Backload Manifest to Base</span>
            </button>
          </form>

          {/* Active Backload Dispatches List */}
          <div className="lg:col-span-2 bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="border-b border-white/10 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Ship className="w-4 h-4 text-amber-400" />
                <span>Dispatched Backload Manifests</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {rigBackloads.length} Manifests
              </span>
            </div>

            <div className="space-y-3">
              {rigBackloads.map((rbl) => (
                <div key={rbl.id} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-amber-400">
                    <span>{rbl.manifestNumber}</span>
                    <span className="text-emerald-400">{rbl.status}</span>
                  </div>
                  <p className="text-white font-medium">Vessel: {rbl.vesselName}</p>
                  <p className="text-gray-400">Prepared By: {rbl.preparedBy} • Date: {rbl.createdDate}</p>
                  <div className="pt-2 border-t border-white/5 space-y-1">
                    {rbl.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-gray-300">
                        <span>{it.tagNumber} - {it.name} ({it.reasonForBackload})</span>
                        <strong className="text-white font-mono">{it.quantityJoints} Jts</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
