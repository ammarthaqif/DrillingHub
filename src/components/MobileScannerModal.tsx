import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { TubularItem } from '../types/drilling';
import { QrCode, X, Search, CheckCircle2, MapPin, Camera, Sparkles } from 'lucide-react';

interface MobileScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: TubularItem) => void;
}

export const MobileScannerModal: React.FC<MobileScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectItem,
}) => {
  const { items } = useDrilling();
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<TubularItem | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = (tag: string) => {
    const found = items.find(i => i.tagNumber.toLowerCase() === tag.toLowerCase() || i.serialNumber.toLowerCase() === tag.toLowerCase());
    if (found) {
      setScannedResult(found);
    } else {
      alert(`No item found matching tag/serial: "${tag}"`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8 text-xs text-gray-200">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Mobile Tag & QR Code Scanner</h3>
              <p className="text-[11px] text-gray-400">Offline field scanning for rig catwalk & base yard</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Graphic */}
        <div className="p-6 text-center space-y-4">
          <div className="relative w-full aspect-square max-w-[240px] mx-auto bg-black/40 border-2 border-dashed border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center p-4 shadow-inner">
            <Camera className="w-12 h-12 text-cyan-400/80 animate-pulse mb-2" />
            <p className="text-[11px] font-medium text-gray-300">Align Pipe Stencil / QR Tag within Box</p>
            <div className="absolute inset-0 border-2 border-cyan-400 rounded-2xl pointer-events-none opacity-20"></div>
          </div>

          {/* Quick Preset Buttons for Testing */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase text-gray-400">Tap Sample Field Tag to Simulate Scan:</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {items.slice(0, 5).map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSimulateScan(item.tagNumber)}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 font-mono font-semibold text-[11px] border border-white/10 transition"
                >
                  {item.tagNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input */}
          <div className="flex items-center space-x-2 pt-3 border-t border-white/10">
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="Or enter tag/serial # manually..."
              className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono focus:border-amber-500"
            />
            <button
              onClick={() => handleSimulateScan(manualCode)}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition"
            >
              Scan
            </button>
          </div>

          {/* Scanned Result Card */}
          {scannedResult && (
            <div className="bg-[#141417] border border-emerald-500/50 p-4 rounded-xl text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-amber-400 text-sm">{scannedResult.tagNumber}</span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  Tag Validated
                </span>
              </div>

              <p className="font-semibold text-white text-xs">{scannedResult.name}</p>
              <p className="text-[11px] text-gray-400">
                OD: {scannedResult.outerDiameter} • Grade: {scannedResult.grade} • Conn: <span className="text-cyan-300 font-mono">{scannedResult.connectionType}</span>
              </p>
              <p className="text-[11px] text-gray-300 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Location: {scannedResult.currentLocation}</span>
              </p>

              <button
                onClick={() => {
                  onClose();
                  onSelectItem(scannedResult);
                }}
                className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition shadow"
              >
                Open Full Item File
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
