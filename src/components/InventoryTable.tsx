import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { TubularItem, HoleSection, LocationType, MaintenanceStatus } from '../types/drilling';
import { ExcelUploadModal } from './ExcelUploadModal';
import { InventoryPhotoModal } from './InventoryPhotoModal';
import { 
  Search, 
  Filter, 
  MapPin, 
  Tag, 
  Layers, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Truck, 
  Eye, 
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Calendar,
  FileSpreadsheet,
  CheckSquare,
  Building2,
  FileCheck,
  History,
  Camera,
  Lock,
  X
} from 'lucide-react';

interface InventoryTableProps {
  onSelectItem: (item: TubularItem) => void;
  onOpenTransferModalWithItems: (itemIds: string[]) => void;
}

const HOLE_SECTIONS: (HoleSection | 'ALL')[] = [
  'ALL',
  '36" Conductor',
  '26" Surface Hole',
  '17-1/2" Intermediate',
  '12-1/4" Main Hole',
  '8-1/2" Reservoir',
  '6" Liner / Workover',
  'Unassigned / General',
];

const LOCATIONS: (LocationType | 'ALL')[] = [
  'ALL',
  'Main Supply Base Yard',
  'Offshore Rig Alpha',
  'Machine Shop & Testing Facility',
  'In Transit (Supply Vessel)',
  'Vendor Warehouse',
];

const STATUSES: (MaintenanceStatus | 'ALL')[] = [
  'ALL',
  'Serviceable (Field Ready)',
  'Due for Inspection',
  'Inspection Overdue',
  'In Refurbishment',
  'Quarantined / Damaged',
];

export const InventoryTable: React.FC<InventoryTableProps> = ({
  onSelectItem,
  onOpenTransferModalWithItems,
}) => {
  const { 
    filteredItems, 
    searchQuery, 
    setSearchQuery, 
    selectedHoleSection, 
    setSelectedHoleSection,
    selectedLocation,
    setSelectedLocation,
    selectedStatus,
    setSelectedStatus,
    showSurplusOnly,
    setShowSurplusOnly,
    bulkUpdateStatus,
    availableHoleSections,
    availableLocations,
    availableMaintenanceStatuses,
    selectedTubularIdsForTransfer,
    toggleTubularSelectionForTransfer,
    setSelectedTubularIdsForTransfer,
    clearTubularSelectionForTransfer,
    rigBackloads,
    bulkAssignToBackloadManifest
  } = useDrilling();

  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [isBackloadModalOpen, setIsBackloadModalOpen] = useState(false);
  const [photoModalItem, setPhotoModalItem] = useState<TubularItem | null>(null);
  const [selectedBackloadManifestId, setSelectedBackloadManifestId] = useState(rigBackloads[0]?.id || '');
  const [bulkStatusTarget, setBulkStatusTarget] = useState<MaintenanceStatus>('Serviceable (Field Ready)');
  const [bulkNotes, setBulkNotes] = useState('');

  const selectedItemIds = selectedTubularIdsForTransfer;

  const handleApplyBulkStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemIds.length === 0) return;
    bulkUpdateStatus(selectedItemIds, bulkStatusTarget, bulkNotes);
    setIsBulkStatusModalOpen(false);
    setBulkNotes('');
    clearTubularSelectionForTransfer();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTubularIdsForTransfer(filteredItems.map(i => i.id));
    } else {
      clearTubularSelectionForTransfer();
    }
  };

  const handleToggleSelectItem = (id: string) => {
    toggleTubularSelectionForTransfer(id);
  };

  const getStatusBadge = (status: MaintenanceStatus, nextDue: string) => {
    switch (status) {
      case 'Serviceable (Field Ready)':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Field Ready</span>
          </span>
        );
      case 'Due for Inspection':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>Due Soon</span>
          </span>
        );
      case 'Inspection Overdue':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>Overdue</span>
          </span>
        );
      case 'In Refurbishment':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            <Clock className="w-3 h-3" />
            <span>Refurbishing</span>
          </span>
        );
      case 'Quarantined / Damaged':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            <XCircle className="w-3 h-3 text-purple-400" />
            <span>Quarantined</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Filter Header Bar */}
      <div className="rounded-2xl border border-white/10 bg-[#111114] p-5 shadow-lg space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tag #, heat #, serial #, connection, grade, cert..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Location Dropdown */}
          <div className="flex items-center space-x-2 shrink-0">
            <MapPin className="w-4 h-4 text-cyan-400 hidden sm:inline" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value as LocationType | 'ALL')}
              className="bg-white/5 border border-white/10 text-gray-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL" className="bg-[#141417]">All Locations</option>
              {availableLocations.map(loc => (
                <option key={loc} value={loc} className="bg-[#141417]">{loc}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as MaintenanceStatus | 'ALL')}
              className="bg-white/5 border border-white/10 text-gray-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL" className="bg-[#141417]">All Statuses</option>
              {availableMaintenanceStatuses.map(stat => (
                <option key={stat} value={stat} className="bg-[#141417]">{stat}</option>
              ))}
            </select>

            {/* Surplus Toggle */}
            <button
              onClick={() => setShowSurplusOnly(!showSurplusOnly)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
                showSurplusOnly 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                  : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Surplus Only</span>
            </button>

            {/* Excel / CSV Bulk Upload Button */}
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition flex items-center space-x-1.5 shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Bulk Upload (Excel)</span>
            </button>
          </div>

        </div>

        {/* Hole Section Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 pr-2 shrink-0 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Hole Section:</span>
          </span>
          {['ALL', ...availableHoleSections].map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedHoleSection(sec as HoleSection | 'ALL')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedHoleSection === sec
                  ? 'bg-amber-500 text-black font-semibold shadow-sm'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

      </div>

      {/* Bulk Action Bar if Items Selected (Persists Across Tabs) */}
      {selectedItemIds.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{selectedItemIds.length} tubulars selected (Persists across navigation tabs)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsBulkStatusModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 transition flex items-center space-x-1.5 shadow"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Bulk Status ({selectedItemIds.length})</span>
            </button>
            <button
              onClick={() => onOpenTransferModalWithItems(selectedItemIds)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition flex items-center space-x-1.5 shadow"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Assign to Vessel Manifest ({selectedItemIds.length})</span>
            </button>
            <button
              onClick={() => setIsBackloadModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-500 text-white hover:bg-purple-400 transition flex items-center space-x-1.5 shadow"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Assign to Backload Manifest ({selectedItemIds.length})</span>
            </button>
            <button
              onClick={() => clearTubularSelectionForTransfer()}
              className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-white"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Main Inventory Table */}
      <div className="rounded-2xl border border-white/10 bg-[#111114] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-xs font-medium uppercase text-gray-500">
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedItemIds.length > 0 && selectedItemIds.length === filteredItems.length}
                    className="rounded border-white/20 bg-black text-amber-500 focus:ring-amber-500/20"
                  />
                </th>
                <th className="p-4">Tag & Serial #</th>
                <th className="p-4">Tubular / Tool Specs</th>
                <th className="p-4">Hole Section</th>
                <th className="p-4">Current Location</th>
                <th className="p-4 text-center">Tally / Qty</th>
                <th className="p-4">Inspection Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400">
                    <p className="font-semibold text-gray-300">No tubulars or tools found matching query</p>
                    <p className="text-xs mt-1 text-gray-500">Try clearing filters or search terms</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-white/5 transition group ${
                        isSelected ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectItem(item.id)}
                          className="rounded border-white/20 bg-black text-amber-500 focus:ring-amber-500/20"
                        />
                      </td>

                      {/* Tag & Serial */}
                      <td className="p-4">
                        <div className="font-semibold text-amber-400 flex items-center space-x-1.5 flex-wrap gap-1">
                          <span>{item.tagNumber}</span>
                          {item.isSurplus && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              Surplus ({item.monthsAtYard || 0}m)
                            </span>
                          )}
                          {item.bookingLock?.isBooked && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1" title={`Booked for ${item.bookingLock.bookedForRigOrBase}`}>
                              <Lock className="w-2.5 h-2.5" /> Booked
                            </span>
                          )}
                          {item.photos && item.photos.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                              <Camera className="w-2.5 h-2.5 text-blue-400" /> {item.photos.length}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">SN: {item.serialNumber}</p>
                        <p className="text-[10px] text-gray-500 font-mono">HT: {item.heatNumber}</p>
                        {(item.poNumber || item.cocNumber || item.projectOwner) && (
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                            {item.poNumber && <span className="bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">PO: {item.poNumber}</span>}
                            {item.cocNumber && <span className="bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20 font-mono">COC: {item.cocNumber}</span>}
                            {item.projectOwner && <span className="bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20">Owner: {item.projectOwner}</span>}
                          </div>
                        )}
                      </td>

                      {/* Name & Specs */}
                      <td className="p-4 max-w-xs">
                        <p className="font-medium text-white truncate" title={item.name}>{item.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1 text-[11px] text-gray-400">
                          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{item.outerDiameter}</span>
                          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{item.weightLbFt}</span>
                          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{item.grade}</span>
                          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono text-cyan-300">{item.connectionType}</span>
                        </div>
                      </td>

                      {/* Hole Section */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/5 text-gray-300 text-[11px] font-medium border border-white/5">
                          {item.holeSection}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="p-4 whitespace-nowrap">
                        <p className="font-medium text-gray-200 flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{item.currentLocation}</span>
                        </p>
                        {item.rackLocation && (
                          <p className="text-[11px] text-gray-400 mt-0.5">{item.rackLocation}</p>
                        )}
                      </td>

                      {/* Tally / Qty */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <p className="font-extrabold text-sm text-white">{item.quantityJoints}</p>
                        <p className="text-[10px] text-gray-400">{item.lengthFt} ft total</p>
                      </td>

                      {/* Inspection Status & Expiry */}
                      <td className="p-4 whitespace-nowrap">
                        <div>{getStatusBadge(item.status, item.nextInspectionDue)}</div>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span>Due: {item.nextInspectionDue || 'N/A'}</span>
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => setPhotoModalItem(item)}
                            title="Take or Upload Real-time Inspection Photo (Matco)"
                            className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/30 transition font-semibold text-xs inline-flex items-center space-x-1"
                          >
                            <Camera className="w-3.5 h-3.5 text-blue-400" />
                            <span>Photo</span>
                          </button>
                          <button
                            onClick={() => onSelectItem(item)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 text-amber-400 hover:bg-white/10 border border-white/10 transition font-semibold text-xs inline-flex items-center space-x-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => onSelectItem(item)}
                            title="View Chronological Change History"
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition font-semibold text-xs inline-flex items-center space-x-1"
                          >
                            <History className="w-3.5 h-3.5 text-amber-400" />
                            <span>History</span>
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

        {/* Footer Summary Bar */}
        <div className="bg-white/5 border-t border-white/5 p-4 text-xs text-gray-400 flex items-center justify-between">
          <span>Displaying <strong className="text-white">{filteredItems.length}</strong> items in inventory</span>
          <span>Total Selected Joints: <strong className="text-white">{filteredItems.reduce((acc, i) => acc + (i.quantityJoints || 1), 0)}</strong></span>
        </div>
      </div>

      {/* Excel / CSV Bulk Upload Modal */}
      {isExcelModalOpen && (
        <ExcelUploadModal onClose={() => setIsExcelModalOpen(false)} />
      )}

      {/* Bulk Status Update Modal */}
      {isBulkStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs text-gray-200">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Bulk Status Update</h3>
              </div>
              <button onClick={() => setIsBulkStatusModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyBulkStatus} className="p-5 space-y-4">
              <p className="text-gray-300">
                Updating inspection/maintenance status for <strong className="text-amber-400">{selectedItemIds.length}</strong> selected tubular items simultaneously.
              </p>

              <div>
                <label className="block text-gray-400 font-medium mb-1.5">New Maintenance Status</label>
                <select
                  value={bulkStatusTarget}
                  onChange={(e) => setBulkStatusTarget(e.target.value as MaintenanceStatus)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Serviceable (Field Ready)" className="bg-[#141417]">Serviceable (Field Ready)</option>
                  <option value="Due for Inspection" className="bg-[#141417]">Due for Inspection</option>
                  <option value="Inspection Overdue" className="bg-[#141417]">Inspection Overdue</option>
                  <option value="In Refurbishment" className="bg-[#141417]">In Refurbishment</option>
                  <option value="Quarantined / Damaged" className="bg-[#141417]">Quarantined / Damaged</option>
                  <option value="Scrapped / Retired" className="bg-[#141417]">Scrapped / Retired</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1.5">Batch Audit / Recertification Notes</label>
                <textarea
                  rows={3}
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="e.g. Visual thread inspection completed at yard bay #2. All passed NDT cert standards."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition"
                >
                  Apply Status Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Backload Manifest Assignment Modal */}
      {isBackloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs text-gray-200">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-sm">Bulk Assign to Backload Manifest</h3>
              </div>
              <button onClick={() => setIsBackloadModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-gray-300">
                Bulk assigning <strong className="text-purple-400">{selectedItemIds.length}</strong> selected tubulars to an offshore rig return / backload manifest.
              </p>

              <div>
                <label className="block text-gray-400 font-medium mb-1.5">Select Active Vessel / Backload Manifest</label>
                <select
                  value={selectedBackloadManifestId}
                  onChange={(e) => setSelectedBackloadManifestId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                >
                  {rigBackloads.map(rbl => (
                    <option key={rbl.id} value={rbl.id} className="bg-[#141417]">
                      {rbl.manifestNumber} - Vessel: {rbl.vesselName} ({rbl.rigLocation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-[11px] text-purple-300">
                <p><strong>Note:</strong> Items will be queued in the Backload Hub for automated age-based routing or manual inspection/disposal action.</p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBackloadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    bulkAssignToBackloadManifest(selectedBackloadManifestId, selectedItemIds);
                    setIsBackloadModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-400 transition"
                >
                  Confirm Bulk Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload & Gallery Modal */}
      {photoModalItem && (
        <InventoryPhotoModal
          item={photoModalItem}
          isOpen={!!photoModalItem}
          onClose={() => setPhotoModalItem(null)}
        />
      )}

    </div>
  );
};
