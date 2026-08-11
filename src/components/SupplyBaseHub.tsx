import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { LocationType, MaintenanceStatus, EquipmentCondition, TubularItem, MaterialTransferTicket, BackloadActionType } from '../types/drilling';
import { 
  Building2, 
  Truck, 
  Wrench, 
  Ship, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Search, 
  Tag, 
  RotateCcw, 
  ArrowRight, 
  Send, 
  ShieldCheck, 
  PackageCheck, 
  Layers, 
  Anchor,
  FileCheck2,
  ListFilter,
  Trash2,
  AlertCircle,
  Timer
} from 'lucide-react';

export const SupplyBaseHub: React.FC = () => {
  const { 
    currentUser, 
    items, 
    updateItem, 
    transfers, 
    createTransfer, 
    validateSenderDispatch, 
    validateReceiverArrival,
    rigBackloads,
    receiveRigBackloadAtSupplyBase,
    confirmVesselArrivalAtBase,
    processBackloadActionAtBase,
    availableLocations,
    availableCarrierTypes
  } = useDrilling();

  const [activeTab, setActiveTab] = useState<'yardInventory' | 'vendorYard' | 'vesselStaging' | 'backloadReceipt'>('yardInventory');

  // Search & Filters for Yard Inventory
  const [yardQuery, setYardQuery] = useState('');
  const [selectedRackZone, setSelectedRackZone] = useState<string>('ALL');

  // Backload Processing State
  const [backloadSearchQuery, setBackloadSearchQuery] = useState('');
  const [actionNotesMap, setActionNotesMap] = useState<Record<string, string>>({});
  const [quaysideArrivalNotes, setQuaysideArrivalNotes] = useState<Record<string, string>>({});

  // Base Yard Filtered Items
  const yardItems = items.filter(i => i.currentLocation === 'Main Supply Base Yard');

  const filteredYardItems = yardItems.filter(item => {
    if (yardQuery.trim()) {
      const q = yardQuery.toLowerCase();
      const matchTag = item.tagNumber.toLowerCase().includes(q);
      const matchName = item.name.toLowerCase().includes(q);
      const matchRack = item.rackLocation ? item.rackLocation.toLowerCase().includes(q) : false;
      if (!matchTag && !matchName && !matchRack) return false;
    }
    if (selectedRackZone !== 'ALL' && !item.rackLocation?.includes(selectedRackZone)) {
      return false;
    }
    return true;
  });

  // Vendor Yard Items (Machine Shop & Vendor Warehouses)
  const vendorYardItems = items.filter(i => 
    i.currentLocation === 'Machine Shop & Testing Facility' || i.currentLocation === 'Vendor Warehouse'
  );

  // Staging for Supply Vessel State
  const [selectedStagingItemIds, setSelectedStagingItemIds] = useState<string[]>([]);
  const [vesselName, setVesselName] = useState('MV Crest Sentinel (Voyage 105)');
  const [carrierType, setCarrierType] = useState<any>('Supply Vessel');
  const [stagingNotes, setStagingNotes] = useState('Deck cargo manifest for Offshore Rig Alpha.');
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Quick Rack Location Updater State
  const [editingRackItemId, setEditingRackItemId] = useState<string | null>(null);
  const [newRackText, setNewRackText] = useState('');

  // Handle Quick Rack Assignment
  const handleUpdateRackLocation = (itemId: string) => {
    if (!newRackText.trim()) return;
    updateItem(itemId, { rackLocation: newRackText.trim() });
    setEditingRackItemId(null);
    setNewRackText('');
  };

  // Handle Return from Vendor Yard to Supply Base Yard
  const handleReturnFromVendorYard = (itemId: string) => {
    updateItem(itemId, {
      currentLocation: 'Main Supply Base Yard',
      rackLocation: 'Base Yard Recert Bay 1',
      status: 'Serviceable (Field Ready)',
      lastInspectionDate: new Date().toISOString().slice(0, 10),
      nextInspectionDue: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
      inspectionCertNumber: `CERT-RECERT-${Math.floor(1000 + Math.random() * 9000)}`
    });
  };

  // Handle Staging & Vessel Dispatch
  const handleDispatchVesselCargo = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStagingItemIds.length === 0) return;

    const stagedItemsPayload = selectedStagingItemIds.map(id => {
      const it = items.find(i => i.id === id);
      return {
        itemId: id,
        quantityJoints: it?.quantityJoints || 1,
      };
    });

    createTransfer(
      'Main Supply Base Yard',
      'Offshore Rig Alpha',
      carrierType,
      vesselName,
      stagedItemsPayload,
      stagingNotes
    );

    setDispatchSuccessMsg(`Deck cargo dispatched on ${vesselName}! Material Transfer Ticket created.`);
    setSelectedStagingItemIds([]);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-extrabold text-white">Supply Base Materials Coordinator Hub</h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Role: Base Materials Coordinator
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Manage base yard inventory, rack positions, items dispatched to vendor machine shops, vessel deck cargo staging, and quayside receipts for rig backloads.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/10 self-start lg:self-auto">
          <button
            onClick={() => setActiveTab('yardInventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'yardInventory' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Yard Inventory ({yardItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vendorYard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'vendorYard' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Vendor Yard / Service ({vendorYardItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vesselStaging')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'vesselStaging' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>Vessel Staging & Dispatch</span>
          </button>

          <button
            onClick={() => setActiveTab('backloadReceipt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'backloadReceipt' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Rig Backload Receipt ({rigBackloads.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BASE YARD INVENTORY MANAGER */}
      {activeTab === 'yardInventory' && (
        <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Base Yard Tubular & Equipment Rack Manager</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Manage rack assignments, inspect equipment status, and organize yard layout for Main Supply Base.
              </p>
            </div>

            {/* Search & Rack Zone Filter */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={yardQuery}
                  onChange={(e) => setYardQuery(e.target.value)}
                  placeholder="Filter tag / name / rack..."
                  className="bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={selectedRackZone}
                onChange={(e) => setSelectedRackZone(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Yard Zones</option>
                <option value="Zone A">Zone A</option>
                <option value="Rack C">Rack C</option>
                <option value="Rack D">Rack D</option>
                <option value="Clean Room">Clean Room</option>
                <option value="Quarantine">Quarantine Area</option>
              </select>
            </div>
          </div>

          {/* Yard Inventory Grid Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-black/40 text-gray-400 font-semibold uppercase text-[10px] border-b border-white/10">
                <tr>
                  <th className="p-3">Tag / Serial #</th>
                  <th className="p-3">Equipment Name</th>
                  <th className="p-3">Hole Section</th>
                  <th className="p-3">Yard Rack Location</th>
                  <th className="p-3">Joints</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredYardItems.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition">
                    <td className="p-3 font-mono font-bold text-amber-400">
                      <div>{item.tagNumber}</div>
                      <div className="text-[10px] text-gray-500 font-normal">{item.serialNumber}</div>
                    </td>
                    <td className="p-3 font-medium text-white max-w-[220px]">
                      {item.name}
                      {item.isSurplus && (
                        <span className="ml-2 text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded">
                          Surplus
                        </span>
                      )}
                    </td>
                    <td className="p-3">{item.holeSection}</td>
                    
                    {/* Yard Rack Assignment Editable Cell */}
                    <td className="p-3">
                      {editingRackItemId === item.id ? (
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={newRackText}
                            onChange={(e) => setNewRackText(e.target.value)}
                            placeholder="e.g. Rack B-02"
                            className="bg-black border border-amber-500 rounded px-2 py-1 text-xs text-white"
                          />
                          <button
                            onClick={() => handleUpdateRackLocation(item.id)}
                            className="px-2 py-1 bg-amber-500 text-black font-bold rounded text-[10px]"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => {
                            setEditingRackItemId(item.id);
                            setNewRackText(item.rackLocation || '');
                          }}
                          className="cursor-pointer hover:underline text-amber-300 font-mono flex items-center space-x-1"
                          title="Click to change rack location"
                        >
                          <Tag className="w-3 h-3 text-amber-400" />
                          <span>{item.rackLocation || 'Unassigned Rack'}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3 font-mono font-bold text-white">{item.quantityJoints}</td>
                    
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        item.status === 'Serviceable (Field Ready)'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : item.status === 'Quarantined / Damaged'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          updateItem(item.id, {
                            currentLocation: 'Machine Shop & Testing Facility',
                            rackLocation: 'Vendor Machine Shop Bay 1',
                            status: 'In Refurbishment'
                          });
                        }}
                        className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-200 text-[11px] font-semibold border border-white/10 transition"
                      >
                        Send to Vendor Shop
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR YARD & SERVICE MANAGEMENT */}
      {activeTab === 'vendorYard' && (
        <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-5">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Items at Vendor Yard & Machine Shop Facility ({vendorYardItems.length})</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Track equipment currently sent to third-party vendor machine shops for thread recutting, NDT inspection, or refurbishment, and log return to supply base.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendorYardItems.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono font-bold text-amber-400 text-xs">{item.tagNumber}</p>
                    <p className="font-bold text-white text-xs mt-0.5">{item.name}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.status}
                  </span>
                </div>

                <div className="text-[11px] text-gray-400 space-y-1 bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <p>Location: <strong className="text-white">{item.currentLocation}</strong></p>
                  <p>Rack/Bay: <strong className="text-white">{item.rackLocation}</strong></p>
                  <p>Joint Count: <strong className="text-white font-mono">{item.quantityJoints} Jts</strong></p>
                  <p>Cert #: <strong className="text-gray-300 font-mono">{item.inspectionCertNumber}</strong></p>
                </div>

                <button
                  onClick={() => handleReturnFromVendorYard(item.id)}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow transition flex items-center justify-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Receive Back at Base Yard & Recertify</span>
                </button>
              </div>
            ))}

            {vendorYardItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-gray-500">
                No items are currently offsite at vendor machine shops.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: VESSEL STAGING & CARGO DISPATCH */}
      {activeTab === 'vesselStaging' && (
        <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-5">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Anchor className="w-4 h-4 text-amber-400" />
              <span>Supply Vessel Quayside Staging & Deck Cargo Dispatch</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Select serviceable equipment staged on base quay, assign to supply vessel, and generate Material Transfer Ticket for offshore rig delivery.
            </p>
          </div>

          {dispatchSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{dispatchSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleDispatchVesselCargo} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Staging Equipment Selector */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                1. Select Equipment Staged for Deck Loading ({selectedStagingItemIds.length} Selected)
              </h4>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {yardItems.filter(i => i.status === 'Serviceable (Field Ready)').map((item) => {
                  const isSelected = selectedStagingItemIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedStagingItemIds(selectedStagingItemIds.filter(id => id !== item.id));
                        } else {
                          setSelectedStagingItemIds([...selectedStagingItemIds, item.id]);
                        }
                      }}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow'
                          : 'bg-black/40 border-white/5 text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-amber-500 text-black' : 'border border-white/20'
                        }`}>
                          {isSelected && '✓'}
                        </div>
                        <div>
                          <p className="font-mono font-bold text-xs text-amber-400">{item.tagNumber}</p>
                          <p className="font-semibold text-xs text-white">{item.name}</p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs text-gray-400">
                        <div>{item.quantityJoints} Jts</div>
                        <div className="text-[10px] text-gray-500">{item.rackLocation}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Vessel Dispatch Form */}
            <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-white/5 self-start">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                2. Manifest & Vessel Dispatch Details
              </h4>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Carrier Type</label>
                <select
                  value={carrierType}
                  onChange={(e) => setCarrierType(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {availableCarrierTypes.map(ct => (
                    <option key={ct} value={ct} className="bg-[#141417] text-white">{ct}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Vessel / Transport Name & Voyage #</label>
                <input
                  type="text"
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Manifest Notes / Instructions</label>
                <textarea
                  rows={3}
                  value={stagingNotes}
                  onChange={(e) => setStagingNotes(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={selectedStagingItemIds.length === 0}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Cargo & Sign Manifest</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TAB 4: RIG BACKLOAD RECEIPT & QUAYSIDE ACTION CENTER */}
      {activeTab === 'backloadReceipt' && (
        <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <PackageCheck className="w-4 h-4 text-amber-400" />
                <span>Rig Backload Quayside Receipt & Timeliness KPI Action Center</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Reference backload manifests / tracking numbers upon vessel arrival, track preset KPI action timeliness, and process items for inspection, disposal, or storage.
              </p>
            </div>

            {/* Backload Manifest Search */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={backloadSearchQuery}
                onChange={(e) => setBackloadSearchQuery(e.target.value)}
                placeholder="Search manifest #, vessel, tag..."
                className="bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 w-64"
              />
            </div>
          </div>

          <div className="space-y-5">
            {rigBackloads
              .filter(rbl => {
                if (!backloadSearchQuery.trim()) return true;
                const q = backloadSearchQuery.toLowerCase();
                return (
                  rbl.manifestNumber.toLowerCase().includes(q) ||
                  rbl.vesselName.toLowerCase().includes(q) ||
                  rbl.items.some(i => i.tagNumber.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
                );
              })
              .map((rbl) => {
                const isArrived = rbl.status.includes('Arrived') || rbl.vesselArrivalTimestamp;
                const isActionCompleted = rbl.status === 'Action Completed' || rbl.status === 'Reconciled & Racked';

                return (
                  <div key={rbl.id} className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4 shadow-md">
                    
                    {/* Manifest Header & Timeliness KPI Status */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-extrabold text-amber-400 text-sm">{rbl.manifestNumber}</span>
                          <span className="text-xs text-white font-bold bg-white/10 px-2 py-0.5 rounded">
                            <Ship className="w-3 h-3 inline mr-1 text-cyan-400" />
                            {rbl.vesselName}
                          </span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isActionCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            isArrived ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {rbl.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Origin: <strong>{rbl.rigLocation}</strong> • Dispatched By: <strong>{rbl.preparedBy}</strong> ({rbl.createdDate})
                        </p>
                      </div>

                      {/* Timeliness KPI Badge */}
                      <div className="flex items-center space-x-3 bg-black/50 p-2.5 rounded-xl border border-white/10 shrink-0">
                        <Timer className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="text-xs">
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-400 text-[10px]">Preset SLA Target:</span>
                            <span className="font-mono font-bold text-amber-300">{rbl.kpiSlaTargetHours || 24} Hours</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <span className="text-gray-400 text-[10px]">KPI SLA Status:</span>
                            <span className={`font-bold text-[11px] ${
                              rbl.kpiStatus === 'Completed On Time' ? 'text-emerald-400' :
                              rbl.kpiStatus === 'SLA Breached' ? 'text-rose-400' :
                              rbl.kpiStatus === 'Arrived at Quay - SLA Active' ? 'text-cyan-300 animate-pulse' :
                              'text-amber-300'
                            }`}>
                              {rbl.kpiStatus || 'In Transit'}
                            </span>
                          </div>
                        </div>

                        {/* Vessel Quayside Arrival Trigger */}
                        {!isArrived && (
                          <button
                            type="button"
                            onClick={() => {
                              const notes = quaysideArrivalNotes[rbl.id] || 'Vessel berthed at Base Quay 2. Quayside inspection initiated.';
                              confirmVesselArrivalAtBase(rbl.id, notes);
                            }}
                            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-lg shadow transition shrink-0 ml-2 flex items-center space-x-1"
                          >
                            <Anchor className="w-3.5 h-3.5" />
                            <span>Confirm Vessel Arrival at Quay</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Backloaded Line Items & Disposition Decision Controls */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[11px] font-extrabold text-gray-300 uppercase tracking-wider">
                          Manifest Tubular Items & Next Action Disposition:
                        </p>
                        {rbl.vesselArrivalTimestamp && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            Arrived Quay: {new Date(rbl.vesselArrivalTimestamp).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-black/20">
                        {rbl.items.map((item, idx) => {
                          const actionDone = item.actionType && item.actionType !== 'PENDING_DECISION';

                          return (
                            <div key={idx} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/[0.02]">
                              
                              {/* Left: Item Spec & Tag */}
                              <div className="space-y-1 max-w-md">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono font-extrabold text-amber-400 text-xs">{item.tagNumber}</span>
                                  {item.serialNumber && (
                                    <span className="font-mono text-[10px] text-gray-400">({item.serialNumber})</span>
                                  )}
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                    item.conditionOnRig === 'Damaged / Reject' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                                  }`}>
                                    {item.conditionOnRig}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-white">{item.name}</p>
                                <p className="text-[11px] text-gray-400">
                                  Reason for Backload: <strong className="text-amber-300">{item.reasonForBackload}</strong> • Joint Count: <strong className="text-white font-mono">{item.quantityJoints} Jts</strong>
                                </p>
                              </div>

                              {/* Right: Next Course of Action Decision Buttons */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                                {actionDone ? (
                                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-right">
                                    <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                                      item.actionType === 'SEND_TO_INSPECTION' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                      item.actionType === 'SEND_TO_DISPOSAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}>
                                      Action: {item.actionType?.replace(/_/g, ' ')}
                                    </span>
                                    {item.processedByMatco && (
                                      <p className="text-[9px] text-gray-400 font-mono mt-1">
                                        Processed by {item.processedByMatco} @ {item.processedTimestamp ? new Date(item.processedTimestamp).toLocaleTimeString() : ''}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {/* Action 1: Send to Inspection */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        processBackloadActionAtBase(
                                          rbl.id,
                                          item.tagNumber,
                                          'SEND_TO_INSPECTION',
                                          'Machine Shop & Testing Facility',
                                          'Vendor Inspection Bay 2',
                                          'Sent to vendor machine shop for NDT inspection and thread recutting.'
                                        );
                                      }}
                                      className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                                      title="Send for NDT inspection prior to yard storage"
                                    >
                                      <Wrench className="w-3 h-3" />
                                      <span>1. Send to Inspection</span>
                                    </button>

                                    {/* Action 2: Send for Disposal */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        processBackloadActionAtBase(
                                          rbl.id,
                                          item.tagNumber,
                                          'SEND_TO_DISPOSAL',
                                          'Scrap Yard / Disposal',
                                          'Disposal Bay D',
                                          'Classified as rejected beyond economic repair. Disposed/scrapped.'
                                        );
                                      }}
                                      className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                                      title="Send straight for scrapping and disposal"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>2. Send for Disposal</span>
                                    </button>

                                    {/* Action 3: Direct Field Ready Storage */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        processBackloadActionAtBase(
                                          rbl.id,
                                          item.tagNumber,
                                          'STORE_SERVICEABLE',
                                          'Main Supply Base Yard',
                                          'Base Yard Recert Bay 1',
                                          'Inspected good at quayside. Restocked in Base Yard.'
                                        );
                                      }}
                                      className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                                      title="Store directly as serviceable stock"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>3. Direct Serviceable Rack</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quayside Inspection Notes Logging */}
                    {rbl.quaysideInspectionNotes && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Quayside Tally Notes ({rbl.receivedBySupplyBaseMatco}):</p>
                          <p className="text-gray-300">{rbl.quaysideInspectionNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

    </div>
  );
};
