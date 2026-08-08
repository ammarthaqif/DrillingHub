import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { TubularItem, HoleSection, ItemCategory, LocationType, EquipmentCondition, MaintenanceStatus } from '../types/drilling';
import { X, Plus, HardHat, Save } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: TubularItem | null;
}

const HOLE_SECTIONS: HoleSection[] = [
  '36" Conductor',
  '26" Surface Hole',
  '17-1/2" Intermediate',
  '12-1/4" Main Hole',
  '8-1/2" Reservoir',
  '6" Liner / Workover',
  'Unassigned / General',
];

const CATEGORIES: ItemCategory[] = [
  'Casing',
  'Tubing',
  'Drill Pipe',
  'Heavy Weight Drill Pipe (HWDP)',
  'Drill Collar',
  'Liner',
  'Pup Joint',
  'Crossover Sub',
  'Float Equipment',
  'Centralizer & Stop Collar',
  'Running & Setting Tool',
  'Downhole Drilling Tool',
  'Jar & Stabilizer',
  'Wellhead & Safety Equipment',
];

const LOCATIONS: LocationType[] = [
  'Main Supply Base Yard',
  'Offshore Rig Alpha',
  'Machine Shop & Testing Facility',
  'Vendor Warehouse',
];

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  editItem,
}) => {
  const { addItem, updateItem } = useDrilling();

  const [tagNumber, setTagNumber] = useState(editItem ? editItem.tagNumber : `CSG-${Math.floor(100 + Math.random() * 900)}`);
  const [serialNumber, setSerialNumber] = useState(editItem ? editItem.serialNumber : `SN-${Date.now().toString().slice(-6)}`);
  const [heatNumber, setHeatNumber] = useState(editItem ? editItem.heatNumber : 'HT-99011A');
  const [name, setName] = useState(editItem ? editItem.name : '');
  const [category, setCategory] = useState<ItemCategory>(editItem ? editItem.category : 'Casing');
  const [holeSection, setHoleSection] = useState<HoleSection>(editItem ? editItem.holeSection : '12-1/4" Main Hole');
  
  const [outerDiameter, setOuterDiameter] = useState(editItem ? editItem.outerDiameter : '9 5/8"');
  const [innerDiameter, setInnerDiameter] = useState(editItem ? editItem.innerDiameter || '' : '8.535"');
  const [weightLbFt, setWeightLbFt] = useState(editItem ? editItem.weightLbFt : '53.5 lb/ft');
  const [grade, setGrade] = useState(editItem ? editItem.grade : 'P-110');
  const [connectionType, setConnectionType] = useState(editItem ? editItem.connectionType : 'TenarisHydril Wedge 563');
  const [lengthFt, setLengthFt] = useState(editItem ? editItem.lengthFt : 4000);
  const [quantityJoints, setQuantityJoints] = useState(editItem ? editItem.quantityJoints : 100);

  const [condition, setCondition] = useState<EquipmentCondition>(editItem ? editItem.condition : 'New Purchased');
  const [status, setStatus] = useState<MaintenanceStatus>(editItem ? editItem.status : 'Serviceable (Field Ready)');
  const [currentLocation, setCurrentLocation] = useState<LocationType>(editItem ? editItem.currentLocation : 'Main Supply Base Yard');
  const [rackLocation, setRackLocation] = useState(editItem ? editItem.rackLocation || '' : 'Yard Rack C-01');

  const [isNewPurchased, setIsNewPurchased] = useState(editItem ? editItem.isNewPurchased : true);
  const [isSurplus, setIsSurplus] = useState(editItem ? editItem.isSurplus : false);
  const [monthsAtYard, setMonthsAtYard] = useState(editItem ? editItem.monthsAtYard || 0 : 0);
  const [surplusReason, setSurplusReason] = useState<TubularItem['surplusReason']>(editItem ? editItem.surplusReason : 'Campaign Excess');

  const [lastInspectionDate, setLastInspectionDate] = useState(editItem ? editItem.lastInspectionDate : '2026-07-01');
  const [nextInspectionDue, setNextInspectionDue] = useState(editItem ? editItem.nextInspectionDue : '2027-01-01');
  const [inspectionCertNumber, setInspectionCertNumber] = useState(editItem ? editItem.inspectionCertNumber : 'CERT-2026-881');

  // ERP & Commercial Tracking Identifiers
  const [cocNumber, setCocNumber] = useState(editItem?.cocNumber || '');
  const [poNumber, setPoNumber] = useState(editItem?.poNumber || '');
  const [doNumber, setDoNumber] = useState(editItem?.doNumber || '');
  const [wellChargeCode, setWellChargeCode] = useState(editItem?.wellChargeCode || 'AFE-2026-ALPHA-01');
  const [vismaNumber, setVismaNumber] = useState(editItem?.vismaNumber || '');
  const [tsrNumber, setTsrNumber] = useState(editItem?.tsrNumber || '');
  const [projectOwner, setProjectOwner] = useState(editItem?.projectOwner || 'Project Deepwater Alpha');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tagNumber.trim()) return;

    if (editItem) {
      updateItem(editItem.id, {
        tagNumber,
        serialNumber,
        heatNumber,
        name,
        category,
        holeSection,
        outerDiameter,
        innerDiameter,
        weightLbFt,
        grade,
        connectionType,
        lengthFt: Number(lengthFt),
        quantityJoints: Number(quantityJoints),
        condition,
        status,
        currentLocation,
        rackLocation,
        isNewPurchased,
        isSurplus,
        monthsAtYard: isSurplus ? Number(monthsAtYard) : undefined,
        surplusReason: isSurplus ? surplusReason : undefined,
        lastInspectionDate,
        nextInspectionDue,
        inspectionCertNumber,
        cocNumber,
        poNumber,
        doNumber,
        wellChargeCode,
        vismaNumber,
        tsrNumber,
        projectOwner,
      });
    } else {
      addItem({
        tagNumber,
        serialNumber,
        heatNumber,
        name,
        category,
        holeSection,
        outerDiameter,
        innerDiameter,
        weightLbFt,
        grade,
        connectionType,
        lengthFt: Number(lengthFt),
        quantityJoints: Number(quantityJoints),
        condition,
        status,
        currentLocation,
        rackLocation,
        isNewPurchased,
        isSurplus,
        monthsAtYard: isSurplus ? Number(monthsAtYard) : undefined,
        surplusReason: isSurplus ? surplusReason : undefined,
        lastInspectionDate,
        nextInspectionDue,
        inspectionCertNumber,
        cocNumber,
        poNumber,
        doNumber,
        wellChargeCode,
        vismaNumber,
        tsrNumber,
        projectOwner,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{editItem ? 'Edit Tubular / Equipment Spec' : 'Add New Tubular or Tool to Inventory'}</h2>
              <p className="text-xs text-gray-400">Register newly purchased items or record backloaded surplus equipment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs text-gray-200">
          
          {/* Section 1: Identification & General Info */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400 mb-3 border-b border-white/5 pb-2">
              1. Tag & Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Tag Number *</label>
                <input
                  type="text"
                  required
                  value={tagNumber}
                  onChange={e => setTagNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-mono"
                  placeholder="e.g. CSG-1338-09"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-mono"
                  placeholder="e.g. SN-99120"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Heat Number</label>
                <input
                  type="text"
                  value={heatNumber}
                  onChange={e => setHeatNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-mono"
                  placeholder="e.g. HT-7721A"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-gray-400 mb-1">Item Title / Description *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                placeholder='e.g. 13-3/8" Intermediate Casing 68 lb/ft L-80 VAM TOP'
              />
            </div>
          </div>

          {/* Section 2: Technical Specifications & Hole Section */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400 mb-3 border-b border-white/5 pb-2">
              2. Technical Specs & Hole Section Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ItemCategory)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-[#141417]">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Target Hole Section</label>
                <select
                  value={holeSection}
                  onChange={e => setHoleSection(e.target.value as HoleSection)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-amber-400 font-semibold focus:border-amber-500"
                >
                  {HOLE_SECTIONS.map(sec => (
                    <option key={sec} value={sec} className="bg-[#141417]">{sec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Outer Diameter (OD)</label>
                <input
                  type="text"
                  value={outerDiameter}
                  onChange={e => setOuterDiameter(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                  placeholder='e.g. 13 3/8"'
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Weight (lb/ft)</label>
                <input
                  type="text"
                  value={weightLbFt}
                  onChange={e => setWeightLbFt(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                  placeholder="e.g. 68 lb/ft"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Steel Grade</label>
                <input
                  type="text"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                  placeholder="e.g. L-80, P-110, S-135"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Thread / Connection Type</label>
                <input
                  type="text"
                  value={connectionType}
                  onChange={e => setConnectionType(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-mono"
                  placeholder="e.g. VAM TOP, NC50"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Joint Count (Qty)</label>
                <input
                  type="number"
                  min="1"
                  value={quantityJoints}
                  onChange={e => setQuantityJoints(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Total Length (ft)</label>
                <input
                  type="number"
                  min="0"
                  value={lengthFt}
                  onChange={e => setLengthFt(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Location, Condition & Surplus Status */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400 mb-3 border-b border-white/5 pb-2">
              3. Location & Surplus / Backload Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Current Location</label>
                <select
                  value={currentLocation}
                  onChange={e => setCurrentLocation(e.target.value as LocationType)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc} className="bg-[#141417]">{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Rack / Deck Position</label>
                <input
                  type="text"
                  value={rackLocation}
                  onChange={e => setRackLocation(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                  placeholder="e.g. Yard Rack C-04"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Maintenance Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as MaintenanceStatus)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-semibold"
                >
                  <option value="Serviceable (Field Ready)" className="bg-[#141417]">Serviceable (Field Ready)</option>
                  <option value="Due for Inspection" className="bg-[#141417]">Due for Inspection</option>
                  <option value="Inspection Overdue" className="bg-[#141417]">Inspection Overdue</option>
                  <option value="In Refurbishment" className="bg-[#141417]">In Refurbishment</option>
                  <option value="Quarantined / Damaged" className="bg-[#141417]">Quarantined / Damaged</option>
                </select>
              </div>
            </div>

            {/* Surplus Checkboxes */}
            <div className="mt-3 bg-white/5 border border-white/5 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewPurchased}
                    onChange={e => setIsNewPurchased(e.target.checked)}
                    className="rounded border-white/10 bg-black/40 text-amber-500 focus:ring-amber-500/20"
                  />
                  <span className="font-semibold text-gray-200">Newly Purchased Item</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSurplus}
                    onChange={e => setIsSurplus(e.target.checked)}
                    className="rounded border-white/10 bg-black/40 text-amber-500 focus:ring-amber-500/20"
                  />
                  <span className="font-semibold text-amber-400">Backloaded / Yard Surplus Item</span>
                </label>
              </div>

              {isSurplus && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-gray-400 mb-1">Months Sitting at Yard</label>
                    <input
                      type="number"
                      min="0"
                      value={monthsAtYard}
                      onChange={e => setMonthsAtYard(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-amber-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Surplus Reason</label>
                    <select
                      value={surplusReason}
                      onChange={e => setSurplusReason(e.target.value as TubularItem['surplusReason'])}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white"
                    >
                      <option value="Campaign Excess" className="bg-[#141417]">Campaign Excess</option>
                      <option value="Rig Return" className="bg-[#141417]">Rig Return / Backload</option>
                      <option value="Well Abandoned Variant" className="bg-[#141417]">Well Abandoned Variant</option>
                      <option value="Cancellation Reserve" className="bg-[#141417]">Cancellation Reserve</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Initial Inspection Dates */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400 mb-3 border-b border-white/5 pb-2">
              4. Inspection Certificate & Expiry Deadline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Last Inspection Date</label>
                <input
                  type="date"
                  value={lastInspectionDate}
                  onChange={e => setLastInspectionDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Next Inspection Due Date *</label>
                <input
                  type="date"
                  required
                  value={nextInspectionDue}
                  onChange={e => setNextInspectionDue(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-amber-400 font-bold focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Cert / NDT Report #</label>
                <input
                  type="text"
                  value={inspectionCertNumber}
                  onChange={e => setInspectionCertNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-mono"
                  placeholder="e.g. CERT-NDT-8821"
                />
              </div>
            </div>
          </div>

          {/* Section 5: ERP & Commercial Identifiers */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400 mb-3 border-b border-white/5 pb-2">
              5. ERP Tracking & Commercial Identifiers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Certificate of Conformance (COC #)</label>
                <input
                  type="text"
                  value={cocNumber}
                  onChange={e => setCocNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-mono"
                  placeholder="e.g. COC-2026-NIPPON-881"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Purchase Order (PO #)</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={e => setPoNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-mono"
                  placeholder="e.g. PO-45009821"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Delivery Order (DO #)</label>
                <input
                  type="text"
                  value={doNumber}
                  onChange={e => setDoNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-mono"
                  placeholder="e.g. DO-992101"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Well / AFE Charge Code</label>
                <input
                  type="text"
                  value={wellChargeCode}
                  onChange={e => setWellChargeCode(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-amber-300 font-mono focus:border-amber-500"
                  placeholder="e.g. AFE-2026-ALPHA-01"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">VISMA ERP Number</label>
                <input
                  type="text"
                  value={vismaNumber}
                  onChange={e => setVismaNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-mono"
                  placeholder="e.g. VIS-99412"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Technical Service Request (TSR #)</label>
                <input
                  type="text"
                  value={tsrNumber}
                  onChange={e => setTsrNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 font-mono"
                  placeholder="e.g. TSR-3301"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-gray-400 mb-1">Project / Asset Owner</label>
                <input
                  type="text"
                  value={projectOwner}
                  onChange={e => setProjectOwner(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-emerald-300 font-semibold focus:border-amber-500"
                  placeholder="e.g. Project Deepwater Alpha / Central Asset Pool"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition shadow flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{editItem ? 'Save Changes' : 'Create Inventory Record'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
