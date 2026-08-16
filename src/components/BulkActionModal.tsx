import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { TubularItem, LocationType, MaintenanceStatus, EquipmentCondition, HoleSection } from '../types/drilling';
import { 
  CheckSquare, 
  MapPin, 
  Clock, 
  Layers, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  SlidersHorizontal, 
  Building2, 
  Wrench, 
  ArrowRight,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItemIds: string[];
  items: TubularItem[];
  defaultTab?: 'status' | 'location' | 'combined';
}

export const BulkActionModal: React.FC<BulkActionModalProps> = ({
  isOpen,
  onClose,
  selectedItemIds,
  items,
  defaultTab = 'combined'
}) => {
  const { 
    currentUser,
    bulkUpdateStatus, 
    bulkUpdateLocation, 
    bulkUpdateItems,
    availableLocations,
    availableMaintenanceStatuses,
    availableEquipmentConditions,
    availableHoleSections
  } = useDrilling();

  const [activeTab, setActiveTab] = useState<'status' | 'location' | 'combined'>(defaultTab);

  // Selected items data
  const selectedItems = items.filter(i => selectedItemIds.includes(i.id));

  // Form states
  const [targetStatus, setTargetStatus] = useState<MaintenanceStatus>('Serviceable (Field Ready)');
  const [targetLocation, setTargetLocation] = useState<LocationType>('Main Supply Base Yard');
  const [targetRack, setTargetRack] = useState('');
  const [targetCondition, setTargetCondition] = useState<EquipmentCondition>('New Purchased');
  const [targetHoleSection, setTargetHoleSection] = useState<HoleSection | ''>('');
  const [targetProjectOwner, setTargetProjectOwner] = useState('');
  const [targetWellChargeCode, setTargetWellChargeCode] = useState('');
  
  // Update checkboxes for combined tab
  const [updateStatusCheck, setUpdateStatusCheck] = useState(true);
  const [updateLocationCheck, setUpdateLocationCheck] = useState(true);
  const [updateConditionCheck, setUpdateConditionCheck] = useState(false);
  const [updateHoleSectionCheck, setUpdateHoleSectionCheck] = useState(false);
  const [updateOwnerCheck, setUpdateOwnerCheck] = useState(false);

  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalJoints = selectedItems.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemIds.length === 0) return;

    setIsSubmitting(true);

    try {
      if (activeTab === 'status') {
        bulkUpdateStatus(selectedItemIds, targetStatus, actionReason || 'Bulk status change via Inventory Table');
        setSuccessMessage(`Successfully updated status to "${targetStatus}" for ${selectedItemIds.length} items.`);
      } else if (activeTab === 'location') {
        bulkUpdateLocation(selectedItemIds, targetLocation, targetRack || undefined, actionReason || 'Bulk location relocation');
        setSuccessMessage(`Successfully moved ${selectedItemIds.length} items to "${targetLocation}"${targetRack ? ` (${targetRack})` : ''}.`);
      } else {
        // Combined batch update
        const updates: any = {};
        if (updateStatusCheck) updates.status = targetStatus;
        if (updateLocationCheck) {
          updates.currentLocation = targetLocation;
          if (targetRack.trim()) updates.rackLocation = targetRack.trim();
        }
        if (updateConditionCheck) updates.condition = targetCondition;
        if (updateHoleSectionCheck && targetHoleSection) updates.holeSection = targetHoleSection;
        if (updateOwnerCheck && targetProjectOwner.trim()) updates.projectOwner = targetProjectOwner.trim();
        if (updateOwnerCheck && targetWellChargeCode.trim()) updates.wellChargeCode = targetWellChargeCode.trim();

        bulkUpdateItems(selectedItemIds, updates, actionReason || 'Batch modifications via Bulk Action toolbar');
        setSuccessMessage(`Successfully executed batch updates for ${selectedItemIds.length} items (${totalJoints} joints).`);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Bulk update error:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#141417] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Batch Bulk Action Tool</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500 text-black">
                  {selectedItemIds.length} Items Selected
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Quickly update status, physical location, yard bays, or technical attributes in a single batch operation.
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

        {/* Tab Selection */}
        <div className="flex items-center border-b border-white/10 px-5 pt-3 bg-black/20 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('combined')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 ${
              activeTab === 'combined'
                ? 'border-amber-500 text-amber-400 bg-white/5 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Combined Batch Edit</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 ${
              activeTab === 'location'
                ? 'border-amber-500 text-amber-400 bg-white/5 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Change Location & Yard Bay</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 ${
              activeTab === 'status'
                ? 'border-amber-500 text-amber-400 bg-white/5 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Change Maintenance Status</span>
            </span>
          </button>
        </div>

        {/* Selected Items Summary Strip */}
        <div className="px-5 py-3 bg-amber-500/5 border-b border-white/5 flex items-center justify-between text-xs text-gray-300">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-amber-400">Target Items:</span>
            <span className="text-gray-400">{selectedItemIds.length} tubular units ({totalJoints} total joints)</span>
          </div>
          <div className="flex items-center space-x-1 overflow-x-auto max-w-[280px] scrollbar-none">
            {selectedItems.slice(0, 4).map(i => (
              <span key={i.id} className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-mono text-gray-300 border border-white/5 whitespace-nowrap">
                {i.tagNumber}
              </span>
            ))}
            {selectedItems.length > 4 && (
              <span className="text-[10px] text-gray-500 font-mono">+{selectedItems.length - 4} more</span>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOCATION */}
          {activeTab === 'location' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <label className="block text-xs font-semibold text-gray-200">
                  Select New Physical Location <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableLocations.map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setTargetLocation(loc as LocationType)}
                      className={`p-3 rounded-xl text-left text-xs font-medium border transition flex items-center justify-between ${
                        targetLocation === loc
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                          : 'bg-black/30 border-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <MapPin className={`w-3.5 h-3.5 ${targetLocation === loc ? 'text-amber-400' : 'text-gray-500'}`} />
                        <span>{loc}</span>
                      </span>
                      {targetLocation === loc && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <label className="block text-xs font-semibold text-gray-200">
                  Yard Bay / Storage Rack Assignment <span className="text-gray-500 text-[10px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={targetRack}
                  onChange={e => setTargetRack(e.target.value)}
                  placeholder="e.g. Bay 2 - Rack B-04, Quayside Staging Deck, Rig Catwalk"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <label className="block text-xs font-semibold text-gray-200">
                  Select New Maintenance Status <span className="text-rose-400">*</span>
                </label>
                <div className="space-y-2">
                  {availableMaintenanceStatuses.map(stat => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setTargetStatus(stat as MaintenanceStatus)}
                      className={`w-full p-3 rounded-xl text-left text-xs font-medium border transition flex items-center justify-between ${
                        targetStatus === stat
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                          : 'bg-black/30 border-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {stat === 'Serviceable (Field Ready)' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {stat === 'Due for Inspection' && <Clock className="w-4 h-4 text-amber-400" />}
                        {stat === 'Inspection Overdue' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                        {stat === 'In Refurbishment' && <Wrench className="w-4 h-4 text-cyan-400" />}
                        {stat === 'Quarantined / Damaged' && <AlertTriangle className="w-4 h-4 text-purple-400" />}
                        <span>{stat}</span>
                      </div>
                      {targetStatus === stat && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMBINED */}
          {activeTab === 'combined' && (
            <div className="space-y-4">
              {/* Location selection block */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-xs font-bold text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateLocationCheck}
                      onChange={e => setUpdateLocationCheck(e.target.checked)}
                      className="rounded border-white/20 bg-black text-amber-500 focus:ring-amber-500/20"
                    />
                    <span className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Update Physical Location & Yard Rack</span>
                    </span>
                  </label>
                  <span className="text-[10px] text-gray-400">{updateLocationCheck ? 'Will be modified' : 'Keep existing'}</span>
                </div>

                {updateLocationCheck && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-1">New Location</span>
                      <select
                        value={targetLocation}
                        onChange={e => setTargetLocation(e.target.value as LocationType)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                      >
                        {availableLocations.map(loc => (
                          <option key={loc} value={loc} className="bg-[#141417]">{loc}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-1">Yard Rack / Bay</span>
                      <input
                        type="text"
                        value={targetRack}
                        onChange={e => setTargetRack(e.target.value)}
                        placeholder="e.g. Bay 1, Rack 04"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status selection block */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-xs font-bold text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateStatusCheck}
                      onChange={e => setUpdateStatusCheck(e.target.checked)}
                      className="rounded border-white/20 bg-black text-amber-500 focus:ring-amber-500/20"
                    />
                    <span className="flex items-center space-x-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Update Maintenance Status</span>
                    </span>
                  </label>
                  <span className="text-[10px] text-gray-400">{updateStatusCheck ? 'Will be modified' : 'Keep existing'}</span>
                </div>

                {updateStatusCheck && (
                  <div className="pt-2">
                    <select
                      value={targetStatus}
                      onChange={e => setTargetStatus(e.target.value as MaintenanceStatus)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                    >
                      {availableMaintenanceStatuses.map(stat => (
                        <option key={stat} value={stat} className="bg-[#141417]">{stat}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Hole Section & Condition Optional block */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-xs font-bold text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateHoleSectionCheck}
                      onChange={e => setUpdateHoleSectionCheck(e.target.checked)}
                      className="rounded border-white/20 bg-black text-amber-500 focus:ring-amber-500/20"
                    />
                    <span className="flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Re-assign Hole Section</span>
                    </span>
                  </label>
                  <span className="text-[10px] text-gray-400">{updateHoleSectionCheck ? 'Will be modified' : 'Keep existing'}</span>
                </div>

                {updateHoleSectionCheck && (
                  <div className="pt-2">
                    <select
                      value={targetHoleSection}
                      onChange={e => setTargetHoleSection(e.target.value as HoleSection)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                    >
                      <option value="">Select Hole Section...</option>
                      {availableHoleSections.map(sec => (
                        <option key={sec} value={sec} className="bg-[#141417]">{sec}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Project Owner & Well AFE allocation */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-xs font-bold text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateOwnerCheck}
                      onChange={e => setUpdateOwnerCheck(e.target.checked)}
                      className="rounded border-white/20 bg-black text-amber-500 focus:ring-amber-500/20"
                    />
                    <span className="flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Batch Project Owner & Well Charge Code (AFE)</span>
                    </span>
                  </label>
                  <span className="text-[10px] text-gray-400">{updateOwnerCheck ? 'Will be modified' : 'Keep existing'}</span>
                </div>

                {updateOwnerCheck && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-1">Project / Campaign Owner</span>
                      <input
                        type="text"
                        value={targetProjectOwner}
                        onChange={e => setTargetProjectOwner(e.target.value)}
                        placeholder="e.g. Deepwater Alpha Campaign"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-1">Well Charge Code (AFE)</span>
                      <input
                        type="text"
                        value={targetWellChargeCode}
                        onChange={e => setTargetWellChargeCode(e.target.value)}
                        placeholder="e.g. AFE-2026-ALPHA-01"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reason / Performer Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span>Operational Justification & Audit Notes</span>
              <span className="text-gray-500 font-normal text-[11px]">Logged under {currentUser.name} ({currentUser.role})</span>
            </label>
            <textarea
              value={actionReason}
              onChange={e => setActionReason(e.target.value)}
              rows={2}
              placeholder="Enter reason for batch modification (e.g., Pre-spud quayside staging, NDT completion recertification, Campaign reallocation)..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || selectedItemIds.length === 0}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center space-x-2 shadow-lg disabled:opacity-50"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Apply Batch Changes ({selectedItemIds.length} Items)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
