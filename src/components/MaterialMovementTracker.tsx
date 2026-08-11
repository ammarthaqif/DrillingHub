import React, { useState, useRef, useEffect } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { MaterialTransferTicket, LocationType, EquipmentCondition, MaterialTransferItem } from '../types/drilling';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  FileText, 
  UserCheck, 
  Send, 
  PackageCheck,
  Ship,
  X,
  Camera,
  QrCode,
  Wrench,
  Trash2,
  Filter,
  Sparkles,
  RefreshCw,
  Search,
  Check
} from 'lucide-react';

interface MaterialMovementTrackerProps {
  onOpenCreateTransferModal: () => void;
}

export const MaterialMovementTracker: React.FC<MaterialMovementTrackerProps> = ({
  onOpenCreateTransferModal,
}) => {
  const { transfers, validateSenderDispatch, validateReceiverArrival, currentUser, items } = useDrilling();

  const [selectedTicket, setSelectedTicket] = useState<MaterialTransferTicket | null>(transfers[0] || null);
  
  // Receiver Verification Modal State
  const [showReceiverModal, setShowReceiverModal] = useState(false);
  const [receiverConditions, setReceiverConditions] = useState<{ [itemId: string]: { condition: EquipmentCondition; discrepancyNote: string } }>({});
  const [receiverNotes, setReceiverNotes] = useState('');

  // Lifecycle Status Filter State
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('ALL');

  // Camera Barcode Scanner State
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [manualScanInput, setManualScanInput] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Helper to calculate Item Lifecycle Status & Badge
  const getItemLifecycleStatus = (item: MaterialTransferItem, ticketStatus: MaterialTransferTicket['status']) => {
    if (ticketStatus === 'Dispatched (In Transit)') {
      return {
        label: 'In Transit',
        colorClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        icon: Truck,
      };
    }

    const currentCondition = item.conditionAtReceipt || item.conditionAtDispatch;

    if (currentCondition === 'Damaged / Reject') {
      return {
        label: 'Awaiting Disposal',
        colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: Trash2,
      };
    }

    if (currentCondition === 'Backloaded - Pending Recert' || item.discrepancyNote) {
      return {
        label: 'Pending Inspection',
        colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: Wrench,
      };
    }

    return {
      label: 'Ready for Storage',
      colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: CheckCircle2,
    };
  };

  const renderItemLifecycleBadge = (item: MaterialTransferItem, ticketStatus: MaterialTransferTicket['status']) => {
    const statusInfo = getItemLifecycleStatus(item, ticketStatus);
    const IconComponent = statusInfo.icon;

    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center space-x-1 shrink-0 ${statusInfo.colorClass}`}>
        <IconComponent className="w-3 h-3" />
        <span>{statusInfo.label}</span>
      </span>
    );
  };

  // Camera stream activation
  useEffect(() => {
    if (isCameraScannerOpen) {
      setCameraError(null);
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setCameraError('Camera access denied or unavailable. You can tap a tag below to simulate a live camera scan.');
        });
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraScannerOpen]);

  // Handle Equipment Arrival Scan match via Camera / Code
  const handleTagScanned = (scannedTag: string) => {
    const cleanTag = scannedTag.trim().toLowerCase();
    
    // Find transfer ticket containing this tag
    let matchedTicket: MaterialTransferTicket | null = null;
    let matchedItem: MaterialTransferItem | null = null;

    for (const t of transfers) {
      const foundItem = t.items.find(i => i.tagNumber.toLowerCase() === cleanTag || i.itemId.toLowerCase() === cleanTag);
      if (foundItem) {
        matchedTicket = t;
        matchedItem = foundItem;
        break;
      }
    }

    if (matchedTicket && matchedItem) {
      setSelectedTicket(matchedTicket);
      setScanSuccessMessage(`Camera scan matched item ${matchedItem.tagNumber} in Manifest ${matchedTicket.manifestNumber}! Logged equipment arrival at Supply Base.`);
      
      // Auto-open receiver verification modal if in transit
      if (matchedTicket.status === 'Dispatched (In Transit)') {
        handleOpenReceiverModal(matchedTicket);
      }

      setIsCameraScannerOpen(false);
    } else {
      alert(`No active transfer manifest found containing tag: "${scannedTag}".`);
    }
  };

  const handleOpenReceiverModal = (ticket: MaterialTransferTicket) => {
    setSelectedTicket(ticket);
    const initialConds: { [itemId: string]: { condition: EquipmentCondition; discrepancyNote: string } } = {};
    ticket.items.forEach(i => {
      initialConds[i.itemId] = {
        condition: i.conditionAtDispatch,
        discrepancyNote: '',
      };
    });
    setReceiverConditions(initialConds);
    setReceiverNotes('');
    setShowReceiverModal(true);
  };

  const handleConfirmReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const formattedConditions = selectedTicket.items.map(i => ({
      itemId: i.itemId,
      condition: receiverConditions[i.itemId]?.condition || i.conditionAtDispatch,
      discrepancyNote: receiverConditions[i.itemId]?.discrepancyNote || '',
    }));

    validateReceiverArrival(selectedTicket.id, formattedConditions, receiverNotes);
    setShowReceiverModal(false);
    setScanSuccessMessage(`Equipment receipt and verification logged for Manifest ${selectedTicket.manifestNumber}!`);
  };

  const getStatusBadge = (status: MaterialTransferTicket['status']) => {
    switch (status) {
      case 'Dispatched (In Transit)':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center space-x-1 animate-pulse">
            <Truck className="w-3.5 h-3.5" />
            <span>In Transit</span>
          </span>
        );
      case 'Received & Verified':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified Received</span>
          </span>
        );
      case 'Discrepancy Flagged':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Discrepancy Flagged</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Actions */}
      <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Truck className="w-5 h-5 text-amber-500" />
            <span>Material Transfer Manifest & Chain-of-Custody Tracker</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Create, dispatch, and track tubular & equipment movements with dual validation from sender and receiver.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Camera QR/Barcode Arrival Scanner Button */}
          <button
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold hover:bg-cyan-400 transition text-xs flex items-center space-x-2 shadow-md"
            title="Scan equipment tag / barcode via camera to log supply base arrival"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Arrival (Camera)</span>
          </button>

          <button
            onClick={onOpenCreateTransferModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition text-xs flex items-center space-x-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>New Manifest (MTT)</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {scanSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{scanSuccessMessage}</span>
          </div>
          <button onClick={() => setScanSuccessMessage(null)} className="p-1 text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Ticket List vs Ticket Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ticket List (1 Column) */}
        <div className="rounded-2xl border border-white/10 bg-[#111114] p-5 space-y-4 shadow-lg">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 border-b border-white/5 pb-3">
            Transfer Manifests ({transfers.length})
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {transfers.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-4 text-center">No transfer tickets generated yet.</p>
            ) : (
              transfers.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 rounded-xl border transition cursor-pointer space-y-2.5 ${
                      isSelected ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-400 text-xs font-mono">{ticket.manifestNumber}</span>
                      {getStatusBadge(ticket.status)}
                    </div>

                    <div className="text-[11px] text-gray-300 space-y-1">
                      <div className="flex items-center space-x-1.5 text-gray-200 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="truncate">{ticket.originLocation}</span>
                        <span className="text-gray-500">➔</span>
                        <span className="truncate">{ticket.destinationLocation}</span>
                      </div>

                      <p className="text-[10px] text-gray-400 flex items-center space-x-1">
                        <Ship className="w-3.5 h-3.5 text-amber-500" />
                        <span>{ticket.carrierName} ({ticket.items.length} items)</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Ticket Details (2 Columns) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#111114] p-6 space-y-6 shadow-lg">
          {selectedTicket ? (
            <div className="space-y-6">
              
              {/* Manifest Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-extrabold text-amber-400 font-mono">{selectedTicket.manifestNumber}</span>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Logged on {new Date(selectedTicket.createdDate).toLocaleString()}</p>
                </div>

                {/* Receiver Action Trigger */}
                {selectedTicket.status === 'Dispatched (In Transit)' && (
                  <button
                    onClick={() => handleOpenReceiverModal(selectedTicket)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition text-xs flex items-center space-x-2 shadow shrink-0"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Validate Receipt & Condition</span>
                  </button>
                )}
              </div>

              {/* Chain of Custody Route Visualizer */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-medium uppercase tracking-wider text-amber-400">
                  Material Movement Route & Chain-of-Custody
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  
                  {/* Step 1: Origin */}
                  <div className="bg-[#141417] p-3.5 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-medium text-gray-400 uppercase">1. Origin Location</span>
                    <p className="font-semibold text-white flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{selectedTicket.originLocation}</span>
                    </p>
                    <p className="text-[10px] text-gray-400">Sender: {selectedTicket.senderName}</p>
                    <p className="text-[10px] text-emerald-400 font-mono">Dispatched: {new Date(selectedTicket.senderValidatedAt || selectedTicket.createdDate).toLocaleDateString()}</p>
                  </div>

                  {/* Step 2: Transit Carrier */}
                  <div className="bg-[#141417] p-3.5 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-medium text-gray-400 uppercase">2. Transport Carrier</span>
                    <p className="font-semibold text-white flex items-center space-x-1">
                      <Ship className="w-3.5 h-3.5 text-amber-400" />
                      <span>{selectedTicket.carrierName}</span>
                    </p>
                    <p className="text-[10px] text-gray-400">Type: {selectedTicket.carrierType}</p>
                    <p className="text-[10px] text-cyan-300 font-semibold">In Transit Manifest</p>
                  </div>

                  {/* Step 3: Destination */}
                  <div className="bg-[#141417] p-3.5 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-medium text-gray-400 uppercase">3. Destination Location</span>
                    <p className="font-semibold text-white flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{selectedTicket.destinationLocation}</span>
                    </p>
                    <p className="text-[10px] text-gray-400">Receiver: {selectedTicket.receiverName || 'Awaiting Verification'}</p>
                    <p className="text-[10px] font-mono text-amber-300">
                      {selectedTicket.receiverValidatedAt ? `Received: ${new Date(selectedTicket.receiverValidatedAt).toLocaleDateString()}` : 'Pending Arrival'}
                    </p>
                  </div>

                </div>
              </div>

              {/* Items in Manifest Table with Item Lifecycle Status Badges */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Manifested Tubulars & Tools ({selectedTicket.items.length})
                  </h4>

                  {/* Lifecycle Filter selector */}
                  <div className="flex items-center space-x-2 text-xs">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <select
                      value={lifecycleFilter}
                      onChange={e => setLifecycleFilter(e.target.value)}
                      className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-amber-500"
                    >
                      <option value="ALL">All Item Lifecycle Statuses</option>
                      <option value="Pending Inspection">Pending Inspection</option>
                      <option value="Ready for Storage">Ready for Storage</option>
                      <option value="Awaiting Disposal">Awaiting Disposal</option>
                      <option value="In Transit">In Transit</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[11px] font-medium uppercase text-gray-500 border-b border-white/5">
                        <th className="p-3.5">Tag #</th>
                        <th className="p-3.5">Item Description</th>
                        <th className="p-3.5 text-center">Dispatch Qty</th>
                        <th className="p-3.5">Condition at Dispatch</th>
                        <th className="p-3.5">Condition at Receipt</th>
                        <th className="p-3.5 text-center">Item Lifecycle Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {selectedTicket.items
                        .filter(item => {
                          if (lifecycleFilter === 'ALL') return true;
                          const st = getItemLifecycleStatus(item, selectedTicket.status);
                          return st.label === lifecycleFilter;
                        })
                        .map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="p-3.5 font-mono font-semibold text-amber-400">{item.tagNumber}</td>
                            <td className="p-3.5 font-medium">{item.name}</td>
                            <td className="p-3.5 text-center font-bold text-white">{item.quantityJoints} jts</td>
                            <td className="p-3.5 text-gray-300">{item.conditionAtDispatch}</td>
                            <td className="p-3.5">
                              {item.conditionAtReceipt ? (
                                <span className={`font-semibold ${item.discrepancyNote ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {item.conditionAtReceipt} {item.discrepancyNote && `(${item.discrepancyNote})`}
                                </span>
                              ) : (
                                <span className="text-gray-500 italic">Pending Arrival Check</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              {renderItemLifecycleBadge(item, selectedTicket.status)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dual Validation Signatures Display */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Sender Signature */}
                <div className="p-3.5 bg-[#141417] rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-medium text-gray-400 uppercase flex items-center space-x-1">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sender Dispatch Stamp</span>
                  </span>
                  <p className="font-semibold text-white">{selectedTicket.senderName} ({selectedTicket.senderRole})</p>
                  <p className="text-[10px] text-emerald-400 font-mono">Digital Signature: {selectedTicket.senderSignature}</p>
                </div>

                {/* Receiver Signature */}
                <div className="p-3.5 bg-[#141417] rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-medium text-gray-400 uppercase flex items-center space-x-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Receiver Verification Stamp</span>
                  </span>
                  {selectedTicket.receiverSignature ? (
                    <>
                      <p className="font-semibold text-white">{selectedTicket.receiverName} ({selectedTicket.receiverRole})</p>
                      <p className="text-[10px] text-emerald-400 font-mono">Digital Signature: {selectedTicket.receiverSignature}</p>
                    </>
                  ) : (
                    <p className="text-amber-400 italic text-[11px] pt-1">Awaiting receiver validation at destination</p>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <p>Select a material transfer ticket from the list to view route & validation details</p>
            </div>
          )}
        </div>

      </div>

      {/* Camera Barcode / QR Scanner Modal */}
      {isCameraScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#111114] border border-cyan-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8 text-xs text-gray-200">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">Camera Equipment Tag & Barcode Scanner</h3>
                  <p className="text-[11px] text-gray-400">Log equipment arrival at supply base via camera view</p>
                </div>
              </div>
              <button onClick={() => setIsCameraScannerOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Live Camera Viewfinder Window */}
              <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Animated Laser Scanner Frame Overlay */}
                <div className="absolute inset-4 border-2 border-dashed border-cyan-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between text-[10px] text-cyan-300 font-mono">
                    <span>SUPPLY BASE RECEIPT</span>
                    <span className="animate-pulse">CAM LIVE</span>
                  </div>
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_12px_#22d3ee]"></div>
                  <p className="text-center text-[10px] text-cyan-200 font-semibold bg-black/60 py-1 rounded">
                    Position Pipe Stencil / Barcode Label in Center
                  </p>
                </div>
              </div>

              {cameraError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  {cameraError}
                </div>
              )}

              {/* Sample In-Transit Tags for Instant Camera Scan Simulation */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tap Tag in Manifest to Simulate Live Camera Detection:</span>
                </p>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {transfers.flatMap(t => t.items.map(item => ({ item, manifest: t.manifestNumber, status: t.status }))).map(({ item, manifest, status }, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTagScanned(item.tagNumber)}
                      className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-500/50 border border-white/10 text-left transition flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-mono font-bold text-amber-300 group-hover:text-cyan-300">{item.tagNumber}</span>
                        <span className="text-[11px] text-gray-300 ml-2">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block font-mono">{manifest}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-cyan-300 uppercase font-bold">
                          {status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Barcode Tag Entry */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <label className="block text-gray-400 font-medium text-[11px]">Or Enter Barcode / Tag # Manually</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={manualScanInput}
                    onChange={e => setManualScanInput(e.target.value)}
                    placeholder="e.g. CSG-1338-001"
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => handleTagScanned(manualScanInput)}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold hover:bg-cyan-400 transition"
                  >
                    Scan
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Receiver Validation Modal */}
      {showReceiverModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 text-xs text-gray-200">
            
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center space-x-2">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Receiver Arrival Validation ({selectedTicket.manifestNumber})</h3>
                  <p className="text-xs text-gray-400">Verify delivered tubular/tool counts and condition at {selectedTicket.destinationLocation}</p>
                </div>
              </div>
              <button onClick={() => setShowReceiverModal(false)} className="p-1.5 rounded-xl text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReceipt} className="p-6 space-y-4">
              <div className="space-y-3">
                <label className="block text-gray-300 font-semibold uppercase tracking-wider text-[11px]">
                  Condition Inspection for Received Items
                </label>

                {selectedTicket.items.map((item) => (
                  <div key={item.itemId} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-semibold text-amber-400">{item.tagNumber}</span>
                        {renderItemLifecycleBadge(item, selectedTicket.status)}
                      </div>
                      <span className="text-gray-400 font-semibold">{item.quantityJoints} joints</span>
                    </div>
                    <p className="font-medium text-white">{item.name}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Condition Upon Arrival</label>
                        <select
                          value={receiverConditions[item.itemId]?.condition || item.conditionAtDispatch}
                          onChange={e => setReceiverConditions({
                            ...receiverConditions,
                            [item.itemId]: {
                              ...receiverConditions[item.itemId],
                              condition: e.target.value as EquipmentCondition,
                            }
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white font-medium focus:border-amber-500"
                        >
                          <option value="New Purchased" className="bg-[#141417]">New Purchased</option>
                          <option value="Used - Good" className="bg-[#141417]">Used - Good</option>
                          <option value="Used - Minor Wear" className="bg-[#141417]">Used - Minor Wear</option>
                          <option value="Backloaded - Pending Recert" className="bg-[#141417]">Backloaded - Pending Recert</option>
                          <option value="Damaged / Reject" className="bg-[#141417]">Damaged / Reject</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Discrepancy / Damage Note (Optional)</label>
                        <input
                          type="text"
                          value={receiverConditions[item.itemId]?.discrepancyNote || ''}
                          onChange={e => setReceiverConditions({
                            ...receiverConditions,
                            [item.itemId]: {
                              ...receiverConditions[item.itemId],
                              discrepancyNote: e.target.value,
                            }
                          })}
                          placeholder="e.g. Thread protector damaged in transit"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Receiver Final Signature Notes</label>
                <textarea
                  value={receiverNotes}
                  onChange={e => setReceiverNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Offloaded at Rig Alpha cat-walk. All tally counts verified."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowReceiverModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition shadow"
                >
                  Sign & Confirm Material Receipt
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
