import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { MaterialTransferTicket, LocationType, EquipmentCondition } from '../types/drilling';
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
  X
} from 'lucide-react';

interface MaterialMovementTrackerProps {
  onOpenCreateTransferModal: () => void;
}

export const MaterialMovementTracker: React.FC<MaterialMovementTrackerProps> = ({
  onOpenCreateTransferModal,
}) => {
  const { transfers, validateSenderDispatch, validateReceiverArrival, currentUser } = useDrilling();

  const [selectedTicket, setSelectedTicket] = useState<MaterialTransferTicket | null>(transfers[0] || null);
  
  // Receiver Verification Modal State
  const [showReceiverModal, setShowReceiverModal] = useState(false);
  const [receiverConditions, setReceiverConditions] = useState<{ [itemId: string]: { condition: EquipmentCondition; discrepancyNote: string } }>({});
  const [receiverNotes, setReceiverNotes] = useState('');

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
      
      {/* Top Banner */}
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

        <button
          onClick={onOpenCreateTransferModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition text-xs flex items-center space-x-2 shrink-0 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Manifest (MTT)</span>
        </button>
      </div>

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

              {/* Items in Manifest Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Manifested Tubulars & Tools ({selectedTicket.items.length})
                </h4>

                <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[11px] font-medium uppercase text-gray-500 border-b border-white/5">
                        <th className="p-3.5">Tag #</th>
                        <th className="p-3.5">Item Description</th>
                        <th className="p-3.5 text-center">Dispatch Qty</th>
                        <th className="p-3.5">Condition at Dispatch</th>
                        <th className="p-3.5">Condition at Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {selectedTicket.items.map((item, idx) => (
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
                      <span className="font-mono font-semibold text-amber-400">{item.tagNumber}</span>
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
