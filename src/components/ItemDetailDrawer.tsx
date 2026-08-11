import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { TubularItem, InspectionRecord, MaintenanceLog } from '../types/drilling';
import { 
  X, 
  QrCode, 
  ShieldCheck, 
  Wrench, 
  Clock, 
  MapPin, 
  Tag, 
  FileText, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Calendar,
  Building,
  Edit,
  Trash2,
  Building2,
  ArrowRightLeft,
  FileCheck2,
  UserCheck,
  History,
  FileCheck,
  Truck,
  ShieldAlert
} from 'lucide-react';

interface ItemDetailDrawerProps {
  item: TubularItem | null;
  onClose: () => void;
  onEdit: (item: TubularItem) => void;
  initialTab?: 'specs' | 'inspection' | 'maintenance' | 'surplus' | 'ownership' | 'history';
}

export const ItemDetailDrawer: React.FC<ItemDetailDrawerProps> = ({
  item,
  onClose,
  onEdit,
  initialTab = 'specs',
}) => {
  const { addInspectionRecord, addMaintenanceLog, transferOwnership, deleteItem, currentUser, auditTrailLogs, transfers, rigBackloads } = useDrilling();

  const [activeTab, setActiveTab] = useState<'specs' | 'inspection' | 'maintenance' | 'surplus' | 'ownership' | 'history'>(initialTab);
  
  // Ownership Transfer Form State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newProjectOwner, setNewProjectOwner] = useState('Project Deepwater Beta');
  const [transferReason, setTransferReason] = useState('Campaign Reallocation for Drilling Phase 2');
  const [transferChargeCode, setTransferChargeCode] = useState(item?.wellChargeCode || 'AFE-2026-BETA-02');
  const [transferRefDoc, setTransferRefDoc] = useState(`TSR-${Math.floor(1000 + Math.random() * 9000)}`);
  const [transferNotes, setTransferNotes] = useState('Authorized by Drilling Superintendents & Asset Lead.');
  
  // New Inspection Record Form State
  const [showAddInsp, setShowAddInsp] = useState(false);
  const [inspType, setInspType] = useState<InspectionRecord['inspectionType']>('NDT (Magnetic Particle)');
  const [inspInspector, setInspInspector] = useState('SGS Tubular Inspector');
  const [inspResult, setInspResult] = useState<InspectionRecord['result']>('Pass');
  const [inspCert, setInspCert] = useState(`CERT-NDT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [inspNextDue, setInspNextDue] = useState('2027-02-01');
  const [inspRemarks, setInspRemarks] = useState('Full visual thread, drift, and MPI inspection passed.');

  // New Maintenance Log Form State
  const [showAddMaint, setShowAddMaint] = useState(false);
  const [maintAction, setMaintAction] = useState<MaintenanceLog['action']>('Washing & Thread Coating');
  const [maintPerformedBy, setMaintPerformedBy] = useState('Base Operations Team');
  const [maintNotes, setMaintNotes] = useState('Freshwater wash & thread storage grease applied.');

  const handleTransferOwnership = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !newProjectOwner) return;
    transferOwnership(
      item.id,
      newProjectOwner,
      transferReason,
      transferChargeCode,
      transferRefDoc,
      transferNotes
    );
    setShowTransferModal(false);
  };

  if (!item) return null;

  const handleAddInspection = (e: React.FormEvent) => {
    e.preventDefault();
    addInspectionRecord(item.id, {
      date: new Date().toISOString().split('T')[0],
      inspectorName: inspInspector,
      inspectionType: inspType,
      result: inspResult,
      certNumber: inspCert,
      nextInspectionDue: inspNextDue,
      remarks: inspRemarks,
    });
    setShowAddInsp(false);
  };

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    addMaintenanceLog(item.id, {
      date: new Date().toISOString().split('T')[0],
      performedBy: maintPerformedBy,
      action: maintAction,
      notes: maintNotes,
    });
    setShowAddMaint(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove item ${item.tagNumber} from inventory?`)) {
      deleteItem(item.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#111114] border-l border-white/10 h-full flex flex-col shadow-2xl text-xs text-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold text-amber-400 font-mono">{item.tagNumber}</span>
                {item.isSurplus && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Yard Surplus ({item.monthsAtYard || 0} mos)
                  </span>
                )}
              </div>
              <p className="text-gray-200 font-medium truncate max-w-md">{item.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {(currentUser.role === 'Drilling Engineer' || currentUser.role === 'QA/QC Inspector') && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onEdit(item);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition"
                  title="Edit Item Specs"
                >
                  <Edit className="w-4 h-4 text-amber-400" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-950/50 text-gray-400 hover:text-rose-300 transition"
                  title="Delete Item"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-[#111114] px-4 pt-2 space-x-2">
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'specs' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Technical Specs
          </button>
          <button
            onClick={() => setActiveTab('inspection')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'inspection' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Certificates ({item.inspectionHistory.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'maintenance' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>Maintenance Logs ({item.maintenanceLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('surplus')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'surplus' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Backload & Surplus</span>
          </button>
          <button
            onClick={() => setActiveTab('ownership')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'ownership' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ERP & Ownership ({item.ownershipHistory?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'history' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Change History</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: TECHNICAL SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              
              {/* QR Code Tag Card */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Field Identification Tag & QR Code</p>
                  <p className="text-sm font-extrabold text-amber-400 font-mono mt-1">{item.qrCodeData}</p>
                  <p className="text-[11px] text-gray-400 mt-1">Scan via mobile scanner on cat-walk or supply base yard</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-white/10 shadow-md">
                  <QrCode className="w-12 h-12 text-black" />
                </div>
              </div>

              {/* Technical Grid */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400 border-b border-white/5 pb-2">
                  Tubular & Tool Parameters
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Outer Diameter (OD)</span>
                    <span className="font-bold text-white text-sm">{item.outerDiameter}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Inner Diameter (ID)</span>
                    <span className="font-bold text-white text-sm">{item.innerDiameter || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Nominal Weight</span>
                    <span className="font-bold text-white text-sm">{item.weightLbFt}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Steel Grade</span>
                    <span className="font-bold text-amber-400 text-sm">{item.grade}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Thread / Connection</span>
                    <span className="font-bold text-cyan-300 font-mono text-sm">{item.connectionType}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Category</span>
                    <span className="font-bold text-white">{item.category}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Serial Number</span>
                    <span className="font-mono font-semibold text-gray-200">{item.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Heat / Mill Number</span>
                    <span className="font-mono font-semibold text-gray-200">{item.heatNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Target Hole Section</span>
                    <span className="font-semibold text-amber-400">{item.holeSection}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Current Location</span>
                    <span className="font-semibold text-cyan-300 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{item.currentLocation}</span>
                    </span>
                    <span className="text-[10px] text-gray-400 block">{item.rackLocation || 'Rack Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Joint Count / Length</span>
                    <span className="font-extrabold text-white text-sm">{item.quantityJoints} joints ({item.lengthFt} ft total)</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INSPECTION & CERTIFICATES */}
          {activeTab === 'inspection' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">NDT Inspection & Compliance History</h3>
                  <p className="text-[11px] text-gray-400">Next mandatory inspection due: <strong className="text-amber-400">{item.nextInspectionDue}</strong></p>
                </div>
                <button
                  onClick={() => setShowAddInsp(!showAddInsp)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition flex items-center space-x-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Inspection</span>
                </button>
              </div>

              {/* Add Inspection Form */}
              {showAddInsp && (
                <form onSubmit={handleAddInspection} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
                  <h4 className="font-semibold text-amber-400 text-xs">Record New NDT / Visual Inspection</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1">Inspection Type</label>
                      <select
                        value={inspType}
                        onChange={e => setInspType(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white"
                      >
                        <option value="NDT (Magnetic Particle)" className="bg-[#141417]">NDT (Magnetic Particle)</option>
                        <option value="Visual Thread Inspection" className="bg-[#141417]">Visual Thread Inspection</option>
                        <option value="Full Length Ultrasonic" className="bg-[#141417]">Full Length Ultrasonic</option>
                        <option value="Drift Test" className="bg-[#141417]">Drift Test</option>
                        <option value="Torque & Bucking Test" className="bg-[#141417]">Torque & Bucking Test</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Inspection Result</label>
                      <select
                        value={inspResult}
                        onChange={e => setInspResult(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white font-semibold"
                      >
                        <option value="Pass" className="bg-[#141417]">Pass (Field Certified)</option>
                        <option value="Pass with Condition" className="bg-[#141417]">Pass with Condition</option>
                        <option value="Fail" className="bg-[#141417]">Fail (Quarantine)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Inspector / Company</label>
                      <input
                        type="text"
                        value={inspInspector}
                        onChange={e => setInspInspector(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Cert Number</label>
                      <input
                        type="text"
                        value={inspCert}
                        onChange={e => setInspCert(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Next Inspection Due</label>
                      <input
                        type="date"
                        value={inspNextDue}
                        onChange={e => setInspNextDue(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Remarks & Defect Notes</label>
                    <textarea
                      value={inspRemarks}
                      onChange={e => setInspRemarks(e.target.value)}
                      rows={2}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddInsp(false)}
                      className="px-3.5 py-1.5 rounded-xl text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 text-black font-semibold"
                    >
                      Save Inspection Log
                    </button>
                  </div>
                </form>
              )}

              {/* Log List */}
              <div className="space-y-3">
                {item.inspectionHistory.length === 0 ? (
                  <p className="text-gray-500 italic">No inspection history logged yet.</p>
                ) : (
                  item.inspectionHistory.map((insp) => (
                    <div key={insp.id} className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className={`w-4 h-4 ${insp.result === 'Pass' ? 'text-emerald-400' : 'text-rose-400'}`} />
                          <span className="font-semibold text-white">{insp.inspectionType}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          insp.result === 'Pass' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {insp.result}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-300 grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                        <p><strong>Inspector:</strong> {insp.inspectorName}</p>
                        <p><strong>Cert #:</strong> <span className="font-mono text-amber-400">{insp.certNumber}</span></p>
                        <p><strong>Date Performed:</strong> {insp.date}</p>
                        <p><strong>Next Due:</strong> {insp.nextInspectionDue}</p>
                      </div>

                      <p className="text-[11px] text-gray-400 bg-black/40 p-2.5 rounded-xl border border-white/5 italic">
                        "{insp.remarks}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MAINTENANCE LOGS */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">Maintenance, Washing & Refurbishment Logs</h3>
                  <p className="text-[11px] text-gray-400">Thread compound application, bucking torque & hardbanding records</p>
                </div>
                <button
                  onClick={() => setShowAddMaint(!showAddMaint)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition flex items-center space-x-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Maintenance Log</span>
                </button>
              </div>

              {/* Add Maintenance Form */}
              {showAddMaint && (
                <form onSubmit={handleAddMaintenance} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
                  <h4 className="font-semibold text-amber-400 text-xs">Record Maintenance Activity</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1">Action Type</label>
                      <select
                        value={maintAction}
                        onChange={e => setMaintAction(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white"
                      >
                        <option value="Washing & Thread Coating" className="bg-[#141417]">Washing & Thread Coating</option>
                        <option value="Thread Protector Replacement" className="bg-[#141417]">Thread Protector Replacement</option>
                        <option value="Refurbishment" className="bg-[#141417]">Refurbishment</option>
                        <option value="Bucking Unit Torque" className="bg-[#141417]">Bucking Unit Torque</option>
                        <option value="Hardbanding Repair" className="bg-[#141417]">Hardbanding Repair</option>
                        <option value="Recertification" className="bg-[#141417]">Recertification</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Performed By / Base Crew</label>
                      <input
                        type="text"
                        value={maintPerformedBy}
                        onChange={e => setMaintPerformedBy(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Work Notes</label>
                    <textarea
                      value={maintNotes}
                      onChange={e => setMaintNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMaint(false)}
                      className="px-3.5 py-1.5 rounded-xl text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 text-black font-semibold"
                    >
                      Save Maintenance Activity
                    </button>
                  </div>
                </form>
              )}

              {/* Maintenance List */}
              <div className="space-y-3">
                {item.maintenanceLogs.length === 0 ? (
                  <p className="text-gray-500 italic">No maintenance activities logged yet.</p>
                ) : (
                  item.maintenanceLogs.map((m) => (
                    <div key={m.id} className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Wrench className="w-4 h-4 text-cyan-400" />
                          <span className="font-semibold text-white">{m.action}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">{m.date}</span>
                      </div>
                      <p className="text-[11px] text-gray-300"><strong>By:</strong> {m.performedBy}</p>
                      <p className="text-[11px] text-gray-400 bg-black/40 p-2.5 rounded-xl border border-white/5 mt-1">
                        {m.notes}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SURPLUS & BACKLOAD TIMELINE */}
          {activeTab === 'surplus' && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Surplus & Storage Yard Lifecycle Status</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Is Backloaded / Surplus?</span>
                    <span className="font-semibold text-white">{item.isSurplus ? 'YES (Surplus Inventory)' : 'NO (Campaign Active String)'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Backload Date</span>
                    <span className="font-semibold text-white">{item.backloadedDate || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Duration Sitting at Yard</span>
                    <span className={`font-semibold text-sm ${(item.monthsAtYard || 0) >= 6 ? 'text-amber-400' : 'text-gray-200'}`}>
                      {item.monthsAtYard || 0} months
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Surplus Reason</span>
                    <span className="font-semibold text-white">{item.surplusReason || 'N/A'}</span>
                  </div>
                </div>

                {(item.monthsAtYard || 0) >= 6 && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                    <p className="font-semibold flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Shelf-life Inspection Alert triggered</span>
                    </p>
                    <p className="mt-1 text-[11px] text-gray-300">
                      This tubular/tool has been sitting at the supply base yard for <strong>{item.monthsAtYard} months</strong> post-backload. Recertification / drift test recommended before RIH.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ERP & PROJECT OWNERSHIP TRANSFER */}
          {activeTab === 'ownership' && (
            <div className="space-y-5">
              
              {/* Header card */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>ERP & Commercial Identifiers</span>
                  </h3>
                  <button
                    onClick={() => setShowTransferModal(!showTransferModal)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition flex items-center space-x-1.5 text-xs shadow"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transfer Ownership</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Project / Asset Owner</span>
                    <span className="font-bold text-emerald-400 text-sm">{item.projectOwner || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Well / AFE Charge Code</span>
                    <span className="font-bold text-amber-300 font-mono">{item.wellChargeCode || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Cert of Conformance (COC)</span>
                    <span className="font-mono font-semibold text-white">{item.cocNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Purchase Order (PO #)</span>
                    <span className="font-mono font-semibold text-white">{item.poNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Delivery Order (DO #)</span>
                    <span className="font-mono font-semibold text-white">{item.doNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">VISMA ERP Number</span>
                    <span className="font-mono font-semibold text-white">{item.vismaNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">TSR Number</span>
                    <span className="font-mono font-semibold text-white">{item.tsrNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Transfer Ownership Form Drawer Modal */}
              {showTransferModal && (
                <form onSubmit={handleTransferOwnership} className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold border-b border-emerald-500/20 pb-2">
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Reallocate Item to New Project / Owner</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1">New Project Owner *</label>
                      <input
                        type="text"
                        required
                        value={newProjectOwner}
                        onChange={e => setNewProjectOwner(e.target.value)}
                        placeholder="e.g. Project Deepwater Phase 2"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white focus:border-emerald-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">New Well / AFE Charge Code *</label>
                      <input
                        type="text"
                        required
                        value={transferChargeCode}
                        onChange={e => setTransferChargeCode(e.target.value)}
                        placeholder="e.g. AFE-2027-BETA-02"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-amber-300 font-mono focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Reallocation Reason</label>
                      <input
                        type="text"
                        value={transferReason}
                        onChange={e => setTransferReason(e.target.value)}
                        placeholder="e.g. Campaign excess transfer"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Reference Doc / TSR #</label>
                      <input
                        type="text"
                        value={transferRefDoc}
                        onChange={e => setTransferRefDoc(e.target.value)}
                        placeholder="e.g. TSR-8821"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white font-mono focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Transfer Notes & Approval References</label>
                    <textarea
                      rows={2}
                      value={transferNotes}
                      onChange={e => setTransferNotes(e.target.value)}
                      placeholder="e.g. Approved by Procurement & Drilling Lead for immediate well site deployment."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTransferModal(false)}
                      className="px-3.5 py-1.5 rounded-xl text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition"
                    >
                      Confirm Ownership Transfer
                    </button>
                  </div>
                </form>
              )}

              {/* Ownership Transfer History Timeline */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Historical Ownership Transfer Trail</span>
                </h4>

                {(!item.ownershipHistory || item.ownershipHistory.length === 0) ? (
                  <p className="text-gray-500 italic">No previous project ownership transfers recorded. Item remains with initial project owner.</p>
                ) : (
                  item.ownershipHistory.map((rec) => (
                    <div key={rec.id} className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                          <span>{rec.previousProjectOwner}</span>
                          <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-amber-400">{rec.newProjectOwner}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">{rec.transferDate}</span>
                      </div>

                      <div className="text-[11px] text-gray-300 grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                        <p><strong>Reason:</strong> {rec.transferReason}</p>

                        <p><strong>AFE Charge Code:</strong> <span className="font-mono text-amber-300">{rec.wellChargeCode}</span></p>
                        <p><strong>Ref Doc #:</strong> <span className="font-mono text-cyan-300">{rec.referenceDocNumber || 'N/A'}</span></p>
                        <p><strong>Approved By:</strong> {rec.approvedBy}</p>
                      </div>

                      {rec.notes && (
                        <p className="text-[11px] text-gray-400 bg-black/40 p-2.5 rounded-xl border border-white/5 italic">
                          "{rec.notes}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 6: DETAILED CHANGE HISTORY & AUDIT TRAIL TIMELINE */}
          {activeTab === 'history' && (() => {
            // Aggregate all history logs
            const historyItems: Array<{
              id: string;
              timestamp: string;
              title: string;
              category: 'STATUS_CHANGE' | 'MOVEMENT' | 'INSPECTION' | 'MAINTENANCE' | 'OWNERSHIP' | 'BACKLOAD' | 'AUDIT';
              user: string;
              role?: string;
              location?: string;
              details: string;
              notes?: string;
              badgeColor?: string;
            }> = [];

            // 1. Audit Trail Logs
            auditTrailLogs.forEach(log => {
              if (
                log.referenceId === item.tagNumber || 
                log.referenceId === item.id || 
                log.details.includes(item.tagNumber) || 
                (item.serialNumber && log.details.includes(item.serialNumber))
              ) {
                historyItems.push({
                  id: `audit-${log.id}`,
                  timestamp: log.formattedTimestamp || log.timestamp,
                  title: log.actionType.replace(/_/g, ' '),
                  category: 'AUDIT',
                  user: log.userName,
                  role: log.userRole,
                  location: log.location,
                  details: log.details,
                  notes: log.notes,
                  badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                });
              }
            });

            // 2. Material Transfers
            transfers.forEach(tr => {
              const matchedItem = tr.items.find(i => i.tagNumber === item.tagNumber || i.itemId === item.id);
              if (matchedItem) {
                historyItems.push({
                  id: `mtt-${tr.id}`,
                  timestamp: tr.createdDate,
                  title: `Material Transfer (${tr.manifestNumber})`,
                  category: 'MOVEMENT',
                  user: tr.senderName,
                  role: tr.senderRole,
                  location: `${tr.originLocation} → ${tr.destinationLocation}`,
                  details: `Dispatched via ${tr.carrierType} (${tr.carrierName}). Condition: ${matchedItem.conditionAtDispatch}`,
                  notes: tr.notes,
                  badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                });
                if (tr.receiverValidatedAt) {
                  historyItems.push({
                    id: `mtt-rec-${tr.id}`,
                    timestamp: tr.receiverValidatedAt,
                    title: `Transfer Verified & Received (${tr.manifestNumber})`,
                    category: 'MOVEMENT',
                    user: tr.receiverName || 'Receiver',
                    role: tr.receiverRole,
                    location: tr.destinationLocation,
                    details: `Verified at destination. Condition at receipt: ${matchedItem.conditionAtReceipt || matchedItem.conditionAtDispatch}`,
                    notes: matchedItem.discrepancyNote,
                    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                  });
                }
              }
            });

            // 3. Inspections
            item.inspectionHistory.forEach(insp => {
              historyItems.push({
                id: `insp-${insp.id}`,
                timestamp: insp.date,
                title: `${insp.inspectionType} - ${insp.result}`,
                category: 'INSPECTION',
                user: insp.inspectorName,
                details: `Cert #: ${insp.certNumber} | Next Due: ${insp.nextInspectionDue}`,
                notes: insp.remarks,
                badgeColor: insp.result === 'Pass' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30',
              });
            });

            // 4. Maintenance Logs
            item.maintenanceLogs.forEach(maint => {
              historyItems.push({
                id: `maint-${maint.id}`,
                timestamp: maint.date,
                title: maint.action,
                category: 'MAINTENANCE',
                user: maint.performedBy,
                details: `Maintenance / Service action performed at base or yard.`,
                notes: maint.notes,
                badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              });
            });

            // 5. Ownership History
            (item.ownershipHistory || []).forEach(own => {
              historyItems.push({
                id: `own-${own.id}`,
                timestamp: own.transferDate,
                title: `Ownership Reallocated: ${own.previousProjectOwner} → ${own.newProjectOwner}`,
                category: 'OWNERSHIP',
                user: own.approvedBy,
                details: `Reason: ${own.transferReason} | Charge Code: ${own.wellChargeCode}`,
                notes: own.notes,
                badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
              });
            });

            // 6. Backload Lists
            rigBackloads.forEach(rbl => {
              const matchedBackload = rbl.items.find(bi => bi.tagNumber === item.tagNumber);
              if (matchedBackload) {
                historyItems.push({
                  id: `rbl-${rbl.id}`,
                  timestamp: rbl.createdDate,
                  title: `Rig Backload Dispatched (${rbl.manifestNumber})`,
                  category: 'BACKLOAD',
                  user: rbl.preparedBy,
                  location: rbl.rigLocation,
                  details: `Backloaded via vessel ${rbl.vesselName}. Reason: ${matchedBackload.reasonForBackload}. Condition: ${matchedBackload.conditionOnRig}`,
                  notes: matchedBackload.actionNotes,
                  badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                });
              }
            });

            // Sort history by date descending
            historyItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            return (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <History className="w-4 h-4 text-amber-400" />
                      <span>Item Chronological Audit & Movement Timeline</span>
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Integrated log of all past status changes, physical location transfers, QA/QC NDT inspections, and system audit events for <strong className="text-amber-400">{item.tagNumber}</strong>.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {historyItems.length} Events
                  </span>
                </div>

                {historyItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 bg-white/5 rounded-xl border border-white/5 italic">
                    No change history logs found for this item.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                    {historyItems.map((log) => (
                      <div key={log.id} className="relative group">
                        {/* Timeline dot */}
                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-[#111114] shadow" />

                        <div className="bg-white/5 border border-white/10 hover:border-white/20 p-3.5 rounded-xl space-y-1.5 transition">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${log.badgeColor}`}>
                                {log.category}
                              </span>
                              <span className="font-bold text-white text-xs">{log.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">{log.timestamp}</span>
                          </div>

                          <div className="text-[11px] text-gray-300 space-y-0.5">
                            <p className="leading-relaxed">{log.details}</p>
                            
                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 pt-1">
                              {log.user && <span><strong>User:</strong> {log.user} {log.role ? `(${log.role})` : ''}</span>}
                              {log.location && <span><strong>Location:</strong> {log.location}</span>}
                            </div>
                          </div>

                          {log.notes && (
                            <p className="text-[10px] text-gray-400 bg-black/40 p-2 rounded-lg border border-white/5 italic mt-1">
                              "{log.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

        </div>

      </div>
    </div>
  );
};
