import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { LocationType, MaterialTransferTicket } from '../types/drilling';
import { X, Truck, Ship, Check, MapPin, Send, Lock } from 'lucide-react';

interface CreateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedItemIds?: string[];
}

const LOCATIONS: LocationType[] = [
  'Main Supply Base Yard',
  'Offshore Rig Alpha',
  'Machine Shop & Testing Facility',
  'Vendor Warehouse',
];

export const CreateTransferModal: React.FC<CreateTransferModalProps> = ({
  isOpen,
  onClose,
  initialSelectedItemIds = [],
}) => {
  const { items, createTransfer, lockItemForTransfer, currentUser, availableLocations, availableCarrierTypes } = useDrilling();

  const [originLocation, setOriginLocation] = useState<LocationType>('Main Supply Base Yard');
  const [destinationLocation, setDestinationLocation] = useState<LocationType>('Offshore Rig Alpha');
  const [carrierType, setCarrierType] = useState<MaterialTransferTicket['carrierType']>('Supply Vessel');
  const [carrierName, setCarrierName] = useState('MV Crest Sentinel (Voyage 105)');
  const [notes, setNotes] = useState('');

  const [selectedItemMap, setSelectedItemMap] = useState<{ [itemId: string]: number }>(() => {
    const map: { [itemId: string]: number } = {};
    initialSelectedItemIds.forEach(id => {
      const found = items.find(i => i.id === id);
      map[id] = found ? found.quantityJoints : 1;
    });
    return map;
  });

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

    const ticket = createTransfer(originLocation, destinationLocation, carrierType, carrierName, itemEntries, notes);
    
    // Apply Booking Lock to items
    itemEntries.forEach(ie => {
      lockItemForTransfer(ie.itemId, ticket.id, 'Material Transfer Ticket', destinationLocation);
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 text-xs text-gray-200">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-white">Create Material Transfer Ticket (MTT Waybill)</h2>
              <p className="text-xs text-gray-400">Generate shipping manifest for tubulars/tools with dispatch signature</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Section 1: Movement Route & Carrier */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400 border-b border-white/5 pb-2">
              1. Movement Route & Transport Carrier
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Origin Location *</label>
                <select
                  value={originLocation}
                  onChange={e => setOriginLocation(e.target.value as LocationType)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-medium focus:border-amber-500"
                >
                  {availableLocations.map(loc => (
                    <option key={loc} value={loc} className="bg-[#141417]">{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Destination Location *</label>
                <select
                  value={destinationLocation}
                  onChange={e => setDestinationLocation(e.target.value as LocationType)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-cyan-300 font-medium focus:border-amber-500"
                >
                  {availableLocations.map(loc => (
                    <option key={loc} value={loc} className="bg-[#141417]">{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Carrier Type</label>
                <select
                  value={carrierType}
                  onChange={e => setCarrierType(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
                >
                  {availableCarrierTypes.map(ct => (
                    <option key={ct} value={ct} className="bg-[#141417]">{ct}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Carrier / Vessel Name *</label>
                <input
                  type="text"
                  required
                  value={carrierName}
                  onChange={e => setCarrierName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-medium focus:border-amber-500"
                  placeholder="e.g. MV Crest Sentinel (Voyage 105)"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Select Items to Transfer */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400 border-b border-white/5 pb-2">
              2. Select Tubulars & Tools to Include in Manifest
            </h3>

            <div className="bg-white/5 border border-white/5 rounded-xl max-h-60 overflow-y-auto divide-y divide-white/5 p-2">
              {items.map((item) => {
                const isChecked = selectedItemMap[item.id] !== undefined;
                return (
                  <div key={item.id} className="p-2.5 flex items-center justify-between hover:bg-white/5 transition rounded-xl">
                    <label className="flex items-center space-x-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleItem(item.id, item.quantityJoints)}
                        className="rounded border-white/10 bg-black/40 text-amber-500 focus:ring-amber-500/20"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-semibold text-amber-400">{item.tagNumber}</span>
                          <span className="text-gray-200 font-medium">{item.name}</span>
                          {item.bookingLock?.isBooked && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Booked
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 block">{item.outerDiameter} • {item.grade} • {item.connectionType} • [{item.currentLocation}]</span>
                      </div>
                    </label>

                    {isChecked && (
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] text-gray-400">Joints:</span>
                        <input
                          type="number"
                          min="1"
                          max={item.quantityJoints}
                          value={selectedItemMap[item.id]}
                          onChange={e => handleQtyChange(item.id, Number(e.target.value))}
                          className="w-16 bg-black/40 border border-white/10 rounded-xl p-1.5 text-center text-white font-bold"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Sender Notes & Signature */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400 border-b border-white/5 pb-2">
              3. Sender Dispatch Notes & Digital Stamp
            </h3>

            <div>
              <label className="block text-gray-400 mb-1">Dispatch Instructions / Deck Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Ensure heavy wooden dunnage on supply boat deck. All thread protectors greased."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500"
              />
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 text-gray-300">
              <p className="text-[11px]"><strong>Dispatching User:</strong> {currentUser.name} ({currentUser.role})</p>
              <p className="text-[10px] text-gray-400 mt-0.5">By clicking Dispatch, an electronic waybill manifest will be created and item statuses set to In Transit.</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition shadow flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Dispatch Transfer Manifest</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
