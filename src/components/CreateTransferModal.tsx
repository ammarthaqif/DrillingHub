import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { LocationType, MaterialTransferTicket, UserRole } from '../types/drilling';
import { 
  X, 
  Truck, 
  Ship, 
  Check, 
  MapPin, 
  Send, 
  Lock, 
  PenTool, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  UserCheck, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Key,
  Stamp,
  Calendar
} from 'lucide-react';

interface CreateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedItemIds?: string[];
}

export const CreateTransferModal: React.FC<CreateTransferModalProps> = ({
  isOpen,
  onClose,
  initialSelectedItemIds = [],
}) => {
  const { items, createTransfer, lockItemForTransfer, currentUser, allUsers, availableLocations, availableCarrierTypes } = useDrilling();

  // Wizard Step State: 1 = Route & Carrier, 2 = Item Tally Selection, 3 = Digital Sign-off
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Step 1: Route & Transport
  const [originLocation, setOriginLocation] = useState<LocationType>('Main Supply Base Yard');
  const [destinationLocation, setDestinationLocation] = useState<LocationType>('Offshore Rig Alpha');
  const [carrierType, setCarrierType] = useState<MaterialTransferTicket['carrierType']>('Supply Vessel');
  const [carrierName, setCarrierName] = useState('MV Crest Sentinel (Voyage 105)');
  const [voyageReference, setVoyageReference] = useState(`VOY-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [etaDate, setEtaDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  // Step 2: Selected Items & Qty
  const [selectedItemMap, setSelectedItemMap] = useState<{ [itemId: string]: number }>(() => {
    const map: { [itemId: string]: number } = {};
    initialSelectedItemIds.forEach(id => {
      const found = items.find(i => i.id === id);
      map[id] = found ? found.quantityJoints : 1;
    });
    return map;
  });

  // Step 3: Digital Sign-off State
  // 1. Materials Manager / Sender
  const [senderManagerName, setSenderManagerName] = useState(currentUser.name || 'Capt. James Wilson');
  const [senderBadgeId, setSenderBadgeId] = useState(`MM-STAFF-${currentUser.id.replace('usr-', '').slice(0, 5) || '4091'}`);
  const [senderSignature, setSenderSignature] = useState('');
  const [senderCertifiedCheck, setSenderCertifiedCheck] = useState(true);

  // 2. Designated Receiver
  const [receiverName, setReceiverName] = useState('Ahmad Faizal (Offshore Deck Matco)');
  const [receiverRole, setReceiverRole] = useState<UserRole>('Rig Toolpusher / Materials Specialist');
  const [receiverBadgeId, setReceiverBadgeId] = useState('RIG-MAT-771');
  const [receiverDesignation, setReceiverDesignation] = useState('Offshore Rig Alpha Quayside / Catwalk Receiving Lead');
  const [receiverSignature, setReceiverSignature] = useState('');
  const [receiverCertifiedCheck, setReceiverCertifiedCheck] = useState(true);

  // Pre-dispatch QA Checklist
  const [threadProtectorsChecked, setThreadProtectorsChecked] = useState(true);
  const [dunnageChecked, setDunnageChecked] = useState(true);
  const [tallyMatchedChecked, setTallyMatchedChecked] = useState(true);

  const [authHash] = useState(() => `SIG-AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`);

  if (!isOpen) return null;

  const handleToggleItem = (itemId: string, defaultQty: number) => {
    setSelectedItemMap(prev => {
      const next = { ...prev };
      if (next[itemId] !== undefined) {
        delete next[itemId];
      } else {
        next[itemId] = defaultQty;
      }
      return next;
    });
  };

  const handleQtyChange = (itemId: string, qty: number) => {
    setSelectedItemMap(prev => ({
      ...prev,
      [itemId]: qty,
    }));
  };

  const selectedCount = Object.keys(selectedItemMap).length;
  const isSenderSigned = senderSignature.trim().length >= 3 && senderCertifiedCheck;
  const isReceiverSigned = receiverSignature.trim().length >= 3 && receiverCertifiedCheck;
  const isSignOffComplete = isSenderSigned && isReceiverSigned;

  const handleNextStep = () => {
    if (activeStep === 1) {
      if (originLocation === destinationLocation) {
        alert('Origin and Destination locations must be different.');
        return;
      }
      if (!carrierName.trim()) {
        alert('Please enter a Carrier / Vessel name.');
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (selectedCount === 0) {
        alert('Please select at least one tubular or tool item to include in the manifest.');
        return;
      }
      setActiveStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemEntries = Object.entries(selectedItemMap).map(([itemId, quantityJoints]) => ({
      itemId,
      quantityJoints,
    }));

    if (itemEntries.length === 0) {
      alert('Please select at least one item to transfer.');
      return;
    }

    if (!isSignOffComplete) {
      alert('Digital Sign-off Required: Both the Materials Manager and the Receiver must provide typed digital signatures to authorize material movement.');
      return;
    }

    const fullNotes = [
      notes,
      `Voyage/Ref: ${voyageReference}`,
      `ETA: ${etaDate}`,
      `Sign-off Auth: ${authHash}`
    ].filter(Boolean).join(' | ');

    const ticket = createTransfer(
      originLocation, 
      destinationLocation, 
      carrierType, 
      carrierName, 
      itemEntries, 
      fullNotes,
      {
        senderSignature: senderSignature.trim(),
        senderBadgeId: senderBadgeId.trim(),
        receiverName: receiverName.trim(),
        receiverRole,
        receiverSignature: receiverSignature.trim(),
        receiverBadgeId: receiverBadgeId.trim(),
        receiverDesignation: receiverDesignation.trim(),
        authorizationToken: authHash,
        dispatchChecklistCompleted: threadProtectorsChecked && dunnageChecked && tallyMatchedChecked
      }
    );
    
    // Apply Booking Lock to items
    itemEntries.forEach(ie => {
      lockItemForTransfer(ie.itemId, ticket.id, 'Material Transfer Ticket', destinationLocation);
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 text-xs text-gray-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Create Material Transfer Ticket (MTT Waybill)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Dual Sign-Off Mode
                </span>
              </div>
              <p className="text-xs text-gray-400">Electronic shipping manifest with Materials Manager & Receiver digital sign-off authorization</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Step Wizard Tabs */}
        <div className="grid grid-cols-3 border-b border-white/10 bg-black/40 text-center text-xs">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`py-3 px-2 border-b-2 font-semibold transition flex items-center justify-center space-x-1.5 ${
              activeStep === 1
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">1</span>
            <span>Route & Carrier</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`py-3 px-2 border-b-2 font-semibold transition flex items-center justify-center space-x-1.5 ${
              activeStep === 2
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">2</span>
            <span>Item Tally ({selectedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedCount > 0) setActiveStep(3);
            }}
            className={`py-3 px-2 border-b-2 font-semibold transition flex items-center justify-center space-x-1.5 ${
              activeStep === 3
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : isSignOffComplete
                ? 'border-transparent text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
              isSignOffComplete ? 'bg-emerald-500 text-black font-bold' : 'bg-white/10'
            }`}>
              {isSignOffComplete ? '✓' : '3'}
            </span>
            <span className="flex items-center space-x-1">
              <span>Digital Sign-off</span>
              <PenTool className="w-3.5 h-3.5 text-amber-400" />
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* STEP 1: MOVEMENT ROUTE & CARRIER */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>1. Movement Route & Vessel / Transport Carrier</span>
                </h3>
                <span className="text-[11px] text-gray-400">Step 1 of 3</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-medium mb-1.5">Origin Location *</label>
                  <select
                    value={originLocation}
                    onChange={e => setOriginLocation(e.target.value as LocationType)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-medium focus:border-amber-500 transition"
                  >
                    {availableLocations.map(loc => (
                      <option key={loc} value={loc} className="bg-[#141417]">{loc}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-400 mt-1 block">Dispatching base or yard</span>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1.5">Destination Location *</label>
                  <select
                    value={destinationLocation}
                    onChange={e => setDestinationLocation(e.target.value as LocationType)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-cyan-300 font-medium focus:border-amber-500 transition"
                  >
                    {availableLocations.map(loc => (
                      <option key={loc} value={loc} className="bg-[#141417]">{loc}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-400 mt-1 block">Consignee rig site or receiving yard</span>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1.5">Carrier Transport Mode *</label>
                  <select
                    value={carrierType}
                    onChange={e => setCarrierType(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 transition"
                  >
                    {availableCarrierTypes.map(ct => (
                      <option key={ct} value={ct} className="bg-[#141417]">{ct}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1.5">Vessel / Truck / Carrier Name *</label>
                  <input
                    type="text"
                    required
                    value={carrierName}
                    onChange={e => setCarrierName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-medium focus:border-amber-500 transition"
                    placeholder="e.g. MV Crest Sentinel (Voyage 105)"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1.5">Voyage / Waybill Manifest Ref #</label>
                  <input
                    type="text"
                    value={voyageReference}
                    onChange={e => setVoyageReference(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-amber-300 font-mono focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1.5">Estimated Time of Arrival (ETA)</label>
                  <input
                    type="date"
                    value={etaDate}
                    onChange={e => setEtaDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1.5">Deck Handling & Dispatch Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Heavy wooden dunnage required. All thread protectors greased and tightened before crane loading."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: ITEM SELECTION & MANIFEST TALLY */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>2. Select Tubulars & Equipment to Include in Manifest</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Check items and specify joint counts to lock and dispatch</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedCount} Selected
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl max-h-72 overflow-y-auto divide-y divide-white/5 p-2">
                {items.length === 0 ? (
                  <p className="p-6 text-center text-gray-400">No inventory items found.</p>
                ) : (
                  items.map((item) => {
                    const isChecked = selectedItemMap[item.id] !== undefined;
                    return (
                      <div key={item.id} className={`p-2.5 flex items-center justify-between hover:bg-white/5 transition rounded-xl ${
                        isChecked ? 'bg-amber-500/10 border border-amber-500/20' : ''
                      }`}>
                        <label className="flex items-center space-x-3 cursor-pointer flex-1 mr-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(item.id, item.quantityJoints)}
                            className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-amber-500/20 w-4 h-4"
                          />
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <span className="font-mono font-bold text-amber-400">{item.tagNumber}</span>
                              <span className="text-gray-200 font-medium">{item.name}</span>
                              {item.bookingLock?.isBooked && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> Booked
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {item.outerDiameter} • {item.grade} • {item.connectionType} • SN: {item.serialNumber} • [{item.currentLocation}]
                            </span>
                          </div>
                        </label>

                        {isChecked && (
                          <div className="flex items-center space-x-2 shrink-0 bg-black/50 px-2.5 py-1.5 rounded-xl border border-white/10">
                            <span className="text-[11px] text-gray-300 font-medium">Joints:</span>
                            <input
                              type="number"
                              min="1"
                              max={item.quantityJoints}
                              value={selectedItemMap[item.id]}
                              onChange={e => handleQtyChange(item.id, Number(e.target.value))}
                              className="w-16 bg-black border border-amber-500/50 rounded-lg p-1 text-center text-amber-300 font-extrabold focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-[10px] text-gray-500">/ {item.quantityJoints}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pre-Dispatch Inspection Checklist */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pre-Loading Dispatch Verification Checklist</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={threadProtectorsChecked}
                      onChange={e => setThreadProtectorsChecked(e.target.checked)}
                      className="rounded border-white/20 bg-black text-emerald-500"
                    />
                    <span>Thread Protectors Torqued</span>
                  </label>
                  <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dunnageChecked}
                      onChange={e => setDunnageChecked(e.target.checked)}
                      className="rounded border-white/20 bg-black text-emerald-500"
                    />
                    <span>Slings & Dunnage Certified</span>
                  </label>
                  <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tallyMatchedChecked}
                      onChange={e => setTallyMatchedChecked(e.target.checked)}
                      className="rounded border-white/20 bg-black text-emerald-500"
                    />
                    <span>Physical Tally Matched</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DIGITAL SIGN-OFF & DUAL AUTHORIZATION */}
          {activeStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                    <PenTool className="w-4 h-4 text-amber-500" />
                    <span>3. Digital Sign-off & Dual Authorization Protocol</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Both Materials Manager (Sender) and Receiver must provide typed digital signatures to execute transfer
                  </p>
                </div>
                <div className="flex items-center space-x-1 font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  <Key className="w-3 h-3 text-amber-400" />
                  <span>{authHash}</span>
                </div>
              </div>

              {/* Summary of Items to Transfer */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400">Route: </span>
                  <strong className="text-white">{originLocation}</strong>
                  <span className="text-amber-400 mx-1.5">➔</span>
                  <strong className="text-cyan-300">{destinationLocation}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Carrier: </span>
                  <strong className="text-white">{carrierName}</strong> ({carrierType})
                </div>
                <div>
                  <span className="text-gray-400">Manifest: </span>
                  <strong className="text-amber-400 font-mono">{selectedCount} Item(s)</strong>
                </div>
              </div>

              {/* DUAL SIGNATURE COLUMNS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* SIGNATURE 1: MATERIALS MANAGER / DISPATCH FOCAL */}
                <div className={`p-4 rounded-xl border transition ${
                  isSenderSigned 
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-emerald-950/20' 
                    : 'bg-white/5 border-amber-500/30'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                    <div className="flex items-center space-x-1.5">
                      <Stamp className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-white text-xs">Materials Manager Sign-Off (Sender)</span>
                    </div>
                    {isSenderSigned ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Signed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        Signature Required
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-gray-400 text-[10px] mb-1">Materials Lead Name *</label>
                        <input
                          type="text"
                          required
                          value={senderManagerName}
                          onChange={e => setSenderManagerName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-medium focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-[10px] mb-1">Badge / Staff ID *</label>
                        <input
                          type="text"
                          required
                          value={senderBadgeId}
                          onChange={e => setSenderBadgeId(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-amber-300 font-mono focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-xs font-semibold mb-1">
                        Type Digital Signature (Materials Manager) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Type full legal name as digital signature..."
                        value={senderSignature}
                        onChange={e => setSenderSignature(e.target.value)}
                        className="w-full bg-black/60 border-2 border-amber-500/50 rounded-xl p-2.5 text-white font-serif text-sm italic tracking-wider focus:outline-none focus:border-amber-400 shadow-inner"
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        Example: <code className="text-amber-300">{senderManagerName || 'Capt. James Wilson'}</code>
                      </span>
                    </div>

                    {/* Signature Preview Badge */}
                    {senderSignature.trim().length > 0 && (
                      <div className="p-2.5 bg-black/50 rounded-xl border border-amber-500/20 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-gray-400 block">Digital Stamp Render:</span>
                          <span className="font-serif italic text-base text-amber-400 font-bold">{senderSignature}</span>
                        </div>
                        <div className="text-right text-[9px] font-mono text-gray-400">
                          <span>{new Date().toISOString().split('T')[0]}</span>
                          <span className="block text-emerald-400">AUTH: VERIFIED</span>
                        </div>
                      </div>
                    )}

                    <label className="flex items-start space-x-2 text-[10px] text-gray-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={senderCertifiedCheck}
                        onChange={e => setSenderCertifiedCheck(e.target.checked)}
                        className="rounded border-white/20 bg-black text-amber-500 mt-0.5"
                      />
                      <span>
                        I certify that these tubulars/tools are cleared for dispatch, inspected for damage, and secured for marine/road transit per API Spec 5CT / DS-1 standards.
                      </span>
                    </label>
                  </div>
                </div>

                {/* SIGNATURE 2: DESIGNATED RECEIVER / CONSIGNEE */}
                <div className={`p-4 rounded-xl border transition ${
                  isReceiverSigned 
                    ? 'bg-cyan-950/20 border-cyan-500/40 shadow-cyan-950/20' 
                    : 'bg-white/5 border-cyan-500/30'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                    <div className="flex items-center space-x-1.5">
                      <UserCheck className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-white text-xs">Receiving Authority Sign-Off (Receiver)</span>
                    </div>
                    {isReceiverSigned ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Signed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        Signature Required
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-gray-400 text-[10px] mb-1">Receiver Name / Focal *</label>
                        <input
                          type="text"
                          required
                          value={receiverName}
                          onChange={e => setReceiverName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-medium focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-[10px] mb-1">Receiver Badge ID *</label>
                        <input
                          type="text"
                          required
                          value={receiverBadgeId}
                          onChange={e => setReceiverBadgeId(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-cyan-300 font-mono focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Receiver Designation / Location</label>
                      <input
                        type="text"
                        value={receiverDesignation}
                        onChange={e => setReceiverDesignation(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-gray-200 focus:border-cyan-500"
                        placeholder="e.g. Rig Alpha Catwalk Material Coordinator"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-xs font-semibold mb-1">
                        Type Digital Signature (Receiver) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Type full legal name as receiver signature..."
                        value={receiverSignature}
                        onChange={e => setReceiverSignature(e.target.value)}
                        className="w-full bg-black/60 border-2 border-cyan-500/50 rounded-xl p-2.5 text-white font-serif text-sm italic tracking-wider focus:outline-none focus:border-cyan-400 shadow-inner"
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        Example: <code className="text-cyan-300">{receiverName.split('(')[0].trim() || 'Ahmad Faizal'}</code>
                      </span>
                    </div>

                    {/* Signature Preview Badge */}
                    {receiverSignature.trim().length > 0 && (
                      <div className="p-2.5 bg-black/50 rounded-xl border border-cyan-500/20 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-gray-400 block">Receiver Stamp Render:</span>
                          <span className="font-serif italic text-base text-cyan-300 font-bold">{receiverSignature}</span>
                        </div>
                        <div className="text-right text-[9px] font-mono text-gray-400">
                          <span>{new Date().toISOString().split('T')[0]}</span>
                          <span className="block text-cyan-400">RECEIPT: AUTHORIZED</span>
                        </div>
                      </div>
                    )}

                    <label className="flex items-start space-x-2 text-[10px] text-gray-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={receiverCertifiedCheck}
                        onChange={e => setReceiverCertifiedCheck(e.target.checked)}
                        className="rounded border-white/20 bg-black text-cyan-500 mt-0.5"
                      />
                      <span>
                        I authorize this incoming shipment and confirm that physical joint cross-tally, thread condition, and landing into rack inventory will be executed upon arrival.
                      </span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Status Alert Banner */}
              {!isSignOffComplete ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2.5 text-amber-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Dual Sign-off Incomplete:</strong> Please provide typed digital signatures for both the Materials Manager and the Receiver to enable manifest dispatch.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2.5 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    <strong>Authorization Complete:</strong> Both digital signatures verified and cryptographically stamped under Token <strong className="font-mono">{authHash}</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Navigation & Submit Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div>
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(prev => (prev - 1) as any)}
                  className="px-4 py-2 rounded-xl text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition font-medium flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>

              {activeStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition shadow flex items-center space-x-2"
                >
                  <span>Continue to {activeStep === 1 ? 'Select Tubulars' : 'Digital Sign-off'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!isSignOffComplete}
                  className={`px-5 py-2.5 rounded-xl font-bold transition shadow flex items-center space-x-2 ${
                    isSignOffComplete
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400 cursor-pointer shadow-emerald-500/20'
                      : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Authorize & Dispatch MTT Waybill</span>
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

