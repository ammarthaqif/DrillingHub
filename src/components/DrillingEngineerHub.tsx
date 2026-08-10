import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { HoleSection, TubularItem, SurplusBookingRequest, MaterialRequisitionForm } from '../types/drilling';
import { 
  Calculator, 
  Layers, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Plus, 
  Wrench, 
  Send, 
  ArrowRight, 
  Building2, 
  DollarSign, 
  Tag, 
  Search, 
  Package, 
  Printer, 
  Sparkles,
  ChevronRight,
  Shield,
  FileSpreadsheet
} from 'lucide-react';

export const DrillingEngineerHub: React.FC = () => {
  const { 
    currentUser, 
    items, 
    surplusBookings, 
    createSurplusBooking, 
    validateSurplusBookingStage, 
    flagSurplusForVendorServiceAndPO,
    materialRequisitions,
    createMaterialRequisition,
    availableHoleSections
  } = useDrilling();

  const [activeTab, setActiveTab] = useState<'octgCalc' | 'surplusBooking' | 'vendorServices' | 'newOrder' | 'msrfForm'>('octgCalc');

  // OCTG Requirement Calculator State
  const [selectedSection, setSelectedSection] = useState<HoleSection>('12-1/4" Main Hole');
  const [casingOd, setCasingOd] = useState('9 5/8"');
  const [casingWeight, setCasingWeight] = useState('53.5 lb/ft');
  const [casingGrade, setCasingGrade] = useState('P-110 EC');
  const [casingConn, setCasingConn] = useState('TenarisHydril Wedge 563');
  const [targetDepthFt, setTargetDepthFt] = useState(7500);
  const [safetyMarginPct, setSafetyMarginPct] = useState(10);
  const [targetProject, setTargetProject] = useState('Project Deepwater Alpha - Well Alpha-06');
  const [afeCode, setAfeCode] = useState('AFE-2026-ALPHA-03');

  // Calculation Results
  const totalRequiredFt = Math.ceil(targetDepthFt * (1 + safetyMarginPct / 100));
  const avgJointLengthFt = 40; // Range 3 average ~40 ft
  const estimatedJointsNeeded = Math.ceil(totalRequiredFt / avgJointLengthFt);
  const totalWeightLbs = Math.round(totalRequiredFt * parseFloat(casingWeight) || 53.5);
  const totalTonnageMetric = (totalWeightLbs / 2204.62).toFixed(1);

  // Available Surplus in Yard
  const matchingSurplusItems = items.filter(i => 
    i.isSurplus && 
    (i.status === 'Serviceable (Field Ready)' || i.status === 'Inspection Overdue' || i.status === 'In Refurbishment')
  );

  // Selected Surplus Item for Booking
  const [selectedSurplusItemId, setSelectedSurplusItemId] = useState<string>(matchingSurplusItems[0]?.id || '');
  const [bookingQtyJoints, setBookingQtyJoints] = useState<number>(30);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Vendor Service & PO Request Modal/Form State
  const [selectedBookingForPo, setSelectedBookingForPo] = useState<SurplusBookingRequest | null>(null);
  const [vendorServiceType, setVendorServiceType] = useState<'Inspection' | 'Thread Retreading' | 'Hardbanding' | 'Pressure Test & Recert'>('Inspection');
  const [poVendorName, setPoVendorName] = useState('Tenaris Technical Services');
  const [poEstCost, setPoEstCost] = useState(12500);
  const [poSuccessMsg, setPoSuccessMsg] = useState<string | null>(null);

  // MSRF Form Generator State
  const [selectedMsrf, setSelectedMsrf] = useState<MaterialRequisitionForm | null>(materialRequisitions[0] || null);

  // Handle Surplus Booking Submission
  const handleCreateSurplusBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccessMsg(null);

    const targetItem = items.find(i => i.id === selectedSurplusItemId);
    if (!targetItem) return;

    createSurplusBooking({
      drillingEngineerId: currentUser.id,
      drillingEngineerName: `${currentUser.name} (${currentUser.role})`,
      targetProject: targetProject,
      holeSection: selectedSection,
      afeChargeCode: afeCode,
      items: [
        {
          itemId: targetItem.id,
          tagNumber: targetItem.tagNumber,
          name: targetItem.name,
          quantityJointsRequested: Number(bookingQtyJoints),
          availableYardJoints: targetItem.quantityJoints || 1,
        }
      ],
      flaggedForInspection: true,
      flaggedForRetreading: false,
    });

    setBookingSuccessMsg(`Surplus booking submitted! Item ${targetItem.tagNumber} is now pending Cost Controller validation.`);
  };

  // Handle PO Issuance Request Submission
  const handleIssuePoRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPo) return;

    flagSurplusForVendorServiceAndPO(
      selectedBookingForPo.id,
      vendorServiceType,
      poVendorName,
      Number(poEstCost)
    );

    setPoSuccessMsg(`Vendor Service & PO Requisition issued for Booking #${selectedBookingForPo.id}! PO Number: PO-SERVICE-2026-${Math.floor(100 + Math.random() * 900)}`);
    setSelectedBookingForPo(null);
  };

  // Handle New Material Requisition
  const handleCreateNewRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    createMaterialRequisition({
      reqNumber: `MSRF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdDate: new Date().toISOString().slice(0, 10),
      drillingEngineerName: currentUser.name,
      projectName: targetProject,
      afeChargeCode: afeCode,
      holeSection: selectedSection,
      requestType: 'New Order Material Purchase',
      casingSpecs: {
        outerDiameter: casingOd,
        weightLbFt: casingWeight,
        grade: casingGrade,
        connectionType: casingConn,
        requiredJoints: estimatedJointsNeeded,
        targetLengthFt: totalRequiredFt,
        safetyFactorPct: safetyMarginPct,
      },
      requiredVendorServices: ['Full Length NDT Inspection', 'Special Drift Test'],
      status: 'Submitted for Approval',
      notes: `Fresh purchase requisition for ${selectedSection} string.`,
    });

    setActiveTab('msrfForm');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Calculator className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-extrabold text-white">Drilling Engineer OCTG & Requisition Workspace</h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Role: Drilling Engineer
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Calculate section casing requirements, book surplus items for multi-stage approval (Cost Controller → MM Focal → Supply Base Focal), request vendor services & PO issuance, and generate MSRF forms.
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/10 self-start lg:self-auto">
          <button
            onClick={() => setActiveTab('octgCalc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'octgCalc' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>OCTG Calculator</span>
          </button>

          <button
            onClick={() => setActiveTab('surplusBooking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'surplusBooking' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Surplus Booking & Approvals</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-black/30 rounded-full font-mono">
              {surplusBookings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('vendorServices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'vendorServices' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Vendor Services & PO</span>
          </button>

          <button
            onClick={() => setActiveTab('msrfForm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'msrfForm' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>MSRF Requisition Forms</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-black/30 rounded-full font-mono">
              {materialRequisitions.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: OCTG REQUIREMENT CALCULATOR */}
      {activeTab === 'octgCalc' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Section Input Parameters */}
          <div className="lg:col-span-2 bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Hole Section & Tubular Design Specification Inputs</span>
              </h3>
              <span className="text-[11px] text-gray-400 font-mono">API Spec 5CT Guidelines</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Target Hole Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value as HoleSection)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {availableHoleSections.map(sec => (
                    <option key={sec} value={sec} className="bg-[#141417] text-white">{sec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Project Name / Asset Owner</label>
                <input
                  type="text"
                  value={targetProject}
                  onChange={(e) => setTargetProject(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">AFE Charge Code</label>
                <input
                  type="text"
                  value={afeCode}
                  onChange={(e) => setAfeCode(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Target Section Depth / Length (ft)</label>
                <input
                  type="number"
                  value={targetDepthFt}
                  onChange={(e) => setTargetDepthFt(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Outer Diameter (OD)</label>
                <input
                  type="text"
                  value={casingOd}
                  onChange={(e) => setCasingOd(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Linear Weight (lb/ft)</label>
                <input
                  type="text"
                  value={casingWeight}
                  onChange={(e) => setCasingWeight(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Steel Grade</label>
                <input
                  type="text"
                  value={casingGrade}
                  onChange={(e) => setCasingGrade(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Connection Type</label>
                <input
                  type="text"
                  value={casingConn}
                  onChange={(e) => setCasingConn(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Excess / Safety Factor Allowance (%)</label>
                <input
                  type="number"
                  value={safetyMarginPct}
                  onChange={(e) => setSafetyMarginPct(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Generated Calculation Output Box */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Calculated Tubular Requirement Summary</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 text-center">
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-400">Total Required Footage</p>
                  <p className="text-base font-extrabold text-white font-mono mt-0.5">{totalRequiredFt.toLocaleString()} ft</p>
                  <p className="text-[9px] text-gray-500">Includes {safetyMarginPct}% contingency</p>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-400">Estimated Joint Count</p>
                  <p className="text-base font-extrabold text-amber-400 font-mono mt-0.5">{estimatedJointsNeeded} Jts</p>
                  <p className="text-[9px] text-gray-500">Based on Range 3 (~40ft/jt)</p>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-400">Total String Weight</p>
                  <p className="text-base font-extrabold text-cyan-400 font-mono mt-0.5">{totalWeightLbs.toLocaleString()} lbs</p>
                  <p className="text-[9px] text-gray-500">{totalTonnageMetric} Metric Tons</p>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-400">Target Section</p>
                  <p className="text-xs font-bold text-emerald-400 mt-1 truncate">{selectedSection}</p>
                  <p className="text-[9px] text-gray-500">{afeCode}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreateNewRequisition}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Generate New Order Material Requisition</span>
              </button>
            </div>
          </div>

          {/* Available Surplus Matching Sidebar */}
          <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Matching Surplus Inventory</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {matchingSurplusItems.length} Available
                </span>
              </div>

              {bookingSuccessMsg && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  {bookingSuccessMsg}
                </div>
              )}

              <form onSubmit={handleCreateSurplusBooking} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Select Surplus Item from Yard</label>
                  <select
                    value={selectedSurplusItemId}
                    onChange={(e) => setSelectedSurplusItemId(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {matchingSurplusItems.map(item => (
                      <option key={item.id} value={item.id} className="bg-[#141417] text-white">
                        {item.tagNumber} - {item.name} ({item.quantityJoints} Jts)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSurplusItemId && (() => {
                  const item = items.find(i => i.id === selectedSurplusItemId);
                  if (!item) return null;
                  return (
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-amber-400">
                        <span>Tag: {item.tagNumber}</span>
                        <span className="text-emerald-400">{item.status}</span>
                      </div>
                      <p className="text-gray-300">{item.name}</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 pt-1 border-t border-white/5">
                        <span>Location: {item.currentLocation}</span>
                        <span>Rack: {item.rackLocation || 'Yard'}</span>
                        <span>Available Jts: <strong className="text-white font-mono">{item.quantityJoints}</strong></span>
                        <span>Grade/Conn: {item.grade} {item.connectionType}</span>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Joints to Book for Project</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={bookingQtyJoints}
                    onChange={(e) => setBookingQtyJoints(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedSurplusItemId}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Book Surplus & Submit for Validation</span>
                </button>
              </form>
            </div>

            <div className="pt-4 border-t border-white/10 text-[11px] text-gray-400 space-y-1">
              <p className="font-semibold text-gray-300">Approval Workflow Sequence:</p>
              <p>1. Cost Controller Validation (AFE Budget)</p>
              <p>2. Material Management Focal Review</p>
              <p>3. Supply Base Focal Final Approval & Ownership Transfer</p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: SURPLUS BOOKING & MULTI-STAGE APPROVAL WORKFLOW */}
      {activeTab === 'surplusBooking' && (
        <div className="space-y-6">
          <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Surplus Material Booking & Multi-Stage Approval Tracker</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Track surplus items requested by Drilling Engineer and run validation checkpoints through Cost Controller, MM Focal, and Supply Base Focal.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                  {surplusBookings.filter(b => b.status !== 'Approved (Ownership Transferred)').length} Pending Approvals
                </span>
              </div>
            </div>

            {/* List of Surplus Bookings */}
            <div className="space-y-4">
              {surplusBookings.map((req) => {
                const isApproved = req.status === 'Approved (Ownership Transferred)';

                return (
                  <div 
                    key={req.id} 
                    className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-500/30 transition space-y-4 shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-amber-400">{req.id}</span>
                          <span className="text-xs text-white font-bold">{req.targetProject}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-300 font-mono">{req.afeChargeCode}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Engineer: <strong>{req.drillingEngineerName}</strong> • Hole Section: <strong>{req.holeSection}</strong> • Created: {new Date(req.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isApproved ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Approved & Ownership Transferred</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            <span>{req.status}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Booked Line Items */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Booked Surplus Items:</p>
                      {req.items.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="font-bold text-white">{item.tagNumber}</span> - <span className="text-gray-300">{item.name}</span>
                          </div>
                          <div className="text-gray-400">
                            Requested: <strong className="text-amber-400 font-mono">{item.quantityJointsRequested} Jts</strong> (from {item.availableYardJoints} Jts in yard)
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 3-Stage Approval Stepper Pipeline */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      
                      {/* Stage 1: Cost Controller */}
                      <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        req.costControllerValidatedAt ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Stage 1: Cost Controller</span>
                          {req.costControllerValidatedAt ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
                        </div>
                        {req.costControllerValidatedAt ? (
                          <div className="text-[11px] space-y-0.5">
                            <p className="text-white font-semibold">{req.costControllerName}</p>
                            <p className="text-gray-400">{req.costControllerNotes}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{req.costControllerValidatedAt}</p>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] text-gray-400">Pending AFE budget validation...</p>
                            <button
                              onClick={() => validateSurplusBookingStage(req.id, 'costController', 'AFE budget validated and approved by Cost Control.')}
                              className="w-full py-1.5 px-3 bg-amber-500 text-black font-bold text-[11px] rounded-lg hover:bg-amber-400 transition"
                            >
                              Validate (Cost Controller)
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Stage 2: MM Focal */}
                      <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        req.mmFocalValidatedAt ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Stage 2: Material Management Focal</span>
                          {req.mmFocalValidatedAt ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
                        </div>
                        {req.mmFocalValidatedAt ? (
                          <div className="text-[11px] space-y-0.5">
                            <p className="text-white font-semibold">{req.mmFocalName}</p>
                            <p className="text-gray-400">{req.mmFocalNotes}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{req.mmFocalValidatedAt}</p>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] text-gray-400">Pending Material Management Review...</p>
                            <button
                              disabled={!req.costControllerValidatedAt}
                              onClick={() => validateSurplusBookingStage(req.id, 'mmFocal', 'Material specs and surplus availability verified.')}
                              className="w-full py-1.5 px-3 bg-amber-500 disabled:opacity-40 text-black font-bold text-[11px] rounded-lg hover:bg-amber-400 transition"
                            >
                              Validate (MM Focal)
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Stage 3: Supply Base Focal */}
                      <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        req.supplyBaseFocalApprovedAt ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Stage 3: Supply Base Focal Approval</span>
                          {req.supplyBaseFocalApprovedAt ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
                        </div>
                        {req.supplyBaseFocalApprovedAt ? (
                          <div className="text-[11px] space-y-0.5">
                            <p className="text-white font-semibold">{req.supplyBaseFocalName}</p>
                            <p className="text-gray-400">{req.supplyBaseFocalNotes}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{req.supplyBaseFocalApprovedAt}</p>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] text-gray-400">Pending Supply Base Approval...</p>
                            <button
                              disabled={!req.mmFocalValidatedAt}
                              onClick={() => validateSurplusBookingStage(req.id, 'supplyBaseFocal', 'Approved for campaign ownership transfer and vendor service inspection.')}
                              className="w-full py-1.5 px-3 bg-emerald-500 disabled:opacity-40 text-black font-bold text-[11px] rounded-lg hover:bg-emerald-400 transition"
                            >
                              Final Approve & Transfer Ownership
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* PO Requisition Action for Approved Items */}
                    {isApproved && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-amber-400">Ownership Transferred to {req.targetProject}</p>
                          {req.poNumber ? (
                            <p className="text-[11px] text-gray-300">
                              PO Issued: <strong className="text-white font-mono">{req.poNumber}</strong> ({req.vendorName} • Est: ${req.estimatedServiceCostUsd?.toLocaleString()})
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-400">Ready to flag for Vendor Services (Inspection / Retreading) and Issue PO Requisition.</p>
                          )}
                        </div>

                        {!req.poNumber && (
                          <button
                            onClick={() => {
                              setSelectedBookingForPo(req);
                              setActiveTab('vendorServices');
                            }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow transition shrink-0"
                          >
                            Flag Services & Request PO
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VENDOR SERVICES & PO REQUISITION */}
      {activeTab === 'vendorServices' && (
        <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-5">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Vendor Yard Services & PO Issuance Requisition</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Select booked surplus items already transferred to engineer's project and flag them for NDT Inspection, Thread Retreading, Machining, or Pressure Testing.
            </p>
          </div>

          {poSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{poSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Form to Request PO for Booked Surplus */}
            <form onSubmit={handleIssuePoRequest} className="space-y-4 bg-black/40 p-5 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Create PO Requisition for Booked Surplus
              </h4>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Select Approved Surplus Booking</label>
                <select
                  value={selectedBookingForPo?.id || ''}
                  onChange={(e) => {
                    const b = surplusBookings.find(sb => sb.id === e.target.value);
                    setSelectedBookingForPo(b || null);
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Approved Surplus Request --</option>
                  {surplusBookings
                    .filter(b => b.status === 'Approved (Ownership Transferred)')
                    .map(b => (
                      <option key={b.id} value={b.id} className="bg-[#141417] text-white">
                        {b.id} - {b.targetProject} ({b.items[0]?.tagNumber})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Vendor Service Required</label>
                <select
                  value={vendorServiceType}
                  onChange={(e) => setVendorServiceType(e.target.value as any)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Inspection">NDT Inspection & Recertification</option>
                  <option value="Thread Retreading">Thread Retreading & Machining</option>
                  <option value="Hardbanding">Hardbanding & Tool Joint Repair</option>
                  <option value="Pressure Test & Recert">Pressure Testing & Hydro-Recertification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Assigned Vendor Yard / Service Contractor</label>
                <input
                  type="text"
                  value={poVendorName}
                  onChange={(e) => setPoVendorName(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Estimated Service Cost (USD)</label>
                <input
                  type="number"
                  value={poEstCost}
                  onChange={(e) => setPoEstCost(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedBookingForPo}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow transition flex items-center justify-center space-x-2"
              >
                <DollarSign className="w-4 h-4" />
                <span>Issue Purchase Order (PO) Requisition</span>
              </button>
            </form>

            {/* Issued POs List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Active Vendor PO Requisitions ({surplusBookings.filter(b => b.poNumber).length})
              </h4>

              {surplusBookings.filter(b => b.poNumber).map((b) => (
                <div key={b.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-amber-400">
                    <span>PO #: {b.poNumber}</span>
                    <span className="text-emerald-400 font-mono">${b.estimatedServiceCostUsd?.toLocaleString()}</span>
                  </div>
                  <p className="text-white font-medium">{b.vendorName}</p>
                  <p className="text-gray-400">Project: {b.targetProject} • Item: {b.items[0]?.tagNumber}</p>
                  <div className="text-[10px] text-gray-500 font-mono pt-1 border-t border-white/5">
                    Issued At: {b.poIssuedAt}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: MSRF REQUISITION FORMS */}
      {activeTab === 'msrfForm' && (
        <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Material & Services Requisition Form (MSRF) Center</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Generate, view, and export printable Material & Services Requisition Forms for formal AFE procurement and audit compliance.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/10 transition flex items-center space-x-2 self-start sm:self-auto"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print / Export MSRF</span>
            </button>
          </div>

          {/* Printable MSRF Form Sheet */}
          {selectedMsrf && (
            <div className="bg-white text-black p-8 rounded-2xl shadow-2xl space-y-6 font-sans print:p-0">
              
              {/* Form Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-4">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight">MATERIAL & SERVICES REQUISITION FORM (MSRF)</h1>
                  <p className="text-xs text-gray-600 font-semibold">DRILLCORE OPERATIONAL SYSTEM • WELLS ENGINEERING DIVISION</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <p className="font-bold text-base text-black">{selectedMsrf.reqNumber}</p>
                  <p className="text-gray-600">Date: {selectedMsrf.createdDate}</p>
                  <p className="text-amber-800 font-bold uppercase">{selectedMsrf.status}</p>
                </div>
              </div>

              {/* Project Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-gray-100 p-4 rounded-xl border border-gray-300">
                <div>
                  <span className="text-gray-500 font-semibold block">Drilling Engineer:</span>
                  <strong className="text-black">{selectedMsrf.drillingEngineerName}</strong>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block">Project Name:</span>
                  <strong className="text-black">{selectedMsrf.projectName}</strong>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block">AFE Charge Code:</span>
                  <strong className="font-mono text-black">{selectedMsrf.afeChargeCode}</strong>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block">Hole Section:</span>
                  <strong className="text-black">{selectedMsrf.holeSection}</strong>
                </div>
              </div>

              {/* Tubular Specs Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">1. Tubular Specification Breakdown</h4>
                <table className="w-full text-xs text-left border border-gray-300">
                  <thead className="bg-gray-200 text-black uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border border-gray-300">Outer Diameter</th>
                      <th className="p-2 border border-gray-300">Linear Wt</th>
                      <th className="p-2 border border-gray-300">Steel Grade</th>
                      <th className="p-2 border border-gray-300">Connection Type</th>
                      <th className="p-2 border border-gray-300 text-right">Target Length (ft)</th>
                      <th className="p-2 border border-gray-300 text-right">Required Joints</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-gray-300 font-bold">{selectedMsrf.casingSpecs.outerDiameter}</td>
                      <td className="p-2 border border-gray-300">{selectedMsrf.casingSpecs.weightLbFt}</td>
                      <td className="p-2 border border-gray-300 font-bold">{selectedMsrf.casingSpecs.grade}</td>
                      <td className="p-2 border border-gray-300">{selectedMsrf.casingSpecs.connectionType}</td>
                      <td className="p-2 border border-gray-300 text-right font-mono">{selectedMsrf.casingSpecs.targetLengthFt.toLocaleString()}</td>
                      <td className="p-2 border border-gray-300 text-right font-mono font-bold">{selectedMsrf.casingSpecs.requiredJoints}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Vendor Services Requirements */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">2. Required Vendor Services & Inspection Protocols</h4>
                <ul className="list-disc list-inside text-xs text-gray-800 space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {selectedMsrf.requiredVendorServices?.map((srv, idx) => (
                    <li key={idx} className="font-medium">{srv}</li>
                  ))}
                </ul>
              </div>

              {/* Authorization Signatures Footer */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-300 text-xs text-center">
                <div className="border-t border-black pt-2">
                  <p className="font-bold">{selectedMsrf.drillingEngineerName}</p>
                  <p className="text-[10px] text-gray-500">Drilling Engineer (Originator)</p>
                </div>

                <div className="border-t border-black pt-2">
                  <p className="font-bold">Michael Chen</p>
                  <p className="text-[10px] text-gray-500">Cost Controller Lead</p>
                </div>

                <div className="border-t border-black pt-2">
                  <p className="font-bold">Ahmad Al-Mansoor</p>
                  <p className="text-[10px] text-gray-500">Supply Base Focal</p>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};
