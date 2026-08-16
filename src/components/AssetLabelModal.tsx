import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { TubularItem } from '../types/drilling';
import { useDrilling } from '../context/DrillingContext';
import { 
  X, 
  Printer, 
  Download, 
  QrCode, 
  Check, 
  FileText, 
  Sliders, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Copy, 
  Eye, 
  Sparkles,
  MapPin,
  Calendar,
  Building,
  Tag
} from 'lucide-react';

interface AssetLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TubularItem[];
  onOpenItemDetail?: (item: TubularItem) => void;
}

export const AssetLabelModal: React.FC<AssetLabelModalProps> = ({
  isOpen,
  onClose,
  items,
  onOpenItemDetail,
}) => {
  const { availableLocations, currentUser } = useDrilling();

  // Customizer Configuration State
  const [labelFormat, setLabelFormat] = useState<'pipe-band' | 'thermal-compact' | 'sheet-grid'>('pipe-band');
  const [includeSpecs, setIncludeSpecs] = useState(true);
  const [includeOwner, setIncludeOwner] = useState(true);
  const [includeInspection, setIncludeInspection] = useState(true);
  const [includeRackLoc, setIncludeRackLoc] = useState(true);
  const [companyHeader, setCompanyHeader] = useState('DRILLSPEC TUBULAR ASSET MGT');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // QR Code Data URLs cache
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Generate QR Code data URLs for each item
  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    let isMounted = true;
    const generateAllQrs = async () => {
      const urls: Record<string, string> = {};
      for (const itm of items) {
        try {
          const qrPayload = JSON.stringify({
            tag: itm.tagNumber,
            sn: itm.serialNumber,
            heat: itm.heatNumber,
            od: itm.outerDiameter,
            grade: itm.grade,
            conn: itm.connectionType,
            owner: itm.projectOwner || 'Unassigned',
            afe: itm.wellChargeCode || 'N/A',
            loc: itm.currentLocation,
            rack: itm.rackLocation || 'N/A',
            qrCode: itm.qrCodeData,
          });

          const dataUrl = await QRCode.toDataURL(qrPayload, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 256,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          urls[itm.id] = dataUrl;
        } catch (err) {
          console.error('Failed to generate QR code for item', itm.id, err);
        }
      }
      if (isMounted) {
        setQrCodeUrls(urls);
      }
    };

    generateAllQrs();
    return () => {
      isMounted = false;
    };
  }, [isOpen, items]);

  if (!isOpen || items.length === 0) return null;

  const activeItem = items[activeItemIndex] || items[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQrImage = (item: TubularItem) => {
    const url = qrCodeUrls[item.id];
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR-${item.tagNumber}-${item.serialNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTagData = (item: TubularItem) => {
    const text = `TAG: ${item.tagNumber} | SN: ${item.serialNumber} | OD: ${item.outerDiameter} | Grade: ${item.grade} | Conn: ${item.connectionType} | Loc: ${item.currentLocation} [${item.rackLocation || 'Yard'}]`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Printable CSS style injection for high-contrast crisp labels */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-label-sheet, #printable-label-sheet * {
            visibility: visible;
          }
          #printable-label-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0.5in;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 text-xs text-gray-200 flex flex-col max-h-[90vh] print:max-h-none print:w-full print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Modal Header (Hidden during Print) */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5 no-print shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Generate Asset Labels & QR Codes</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {items.length} {items.length === 1 ? 'Asset' : 'Assets Selected'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Produce weatherproof yard adhesive tags and scannable pipe band QR labels with direct links to technical specs
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Controls, Right Preview (Print view formats correctly) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:block print:p-0">
          
          {/* Controls Column (Hidden on Print) */}
          <div className="lg:col-span-5 space-y-4 no-print">
            
            {/* Format Selector */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Label Template & Format</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLabelFormat('pipe-band')}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    labelFormat === 'pipe-band'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="block font-semibold">Pipe Stencil</span>
                  <span className="text-[9px] text-gray-400">Heavy Band</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelFormat('thermal-compact')}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    labelFormat === 'thermal-compact'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="block font-semibold">Thermal 4x2</span>
                  <span className="text-[9px] text-gray-400">Barcode Tag</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelFormat('sheet-grid')}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    labelFormat === 'sheet-grid'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="block font-semibold">A4 / Batch</span>
                  <span className="text-[9px] text-gray-400">Multi-up Sheet</span>
                </button>
              </div>
            </div>

            {/* Customizer Toggles */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                Display Fields & Data
              </label>

              <div>
                <label className="block text-gray-400 text-[10px] mb-1">Company / Operator Banner</label>
                <input
                  type="text"
                  value={companyHeader}
                  onChange={e => setCompanyHeader(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-medium focus:border-amber-500"
                />
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSpecs}
                    onChange={e => setIncludeSpecs(e.target.checked)}
                    className="rounded border-white/20 bg-black text-amber-500"
                  />
                  <span>Technical Specs (OD, Grade, Connection, Weight)</span>
                </label>

                <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeOwner}
                    onChange={e => setIncludeOwner(e.target.checked)}
                    className="rounded border-white/20 bg-black text-amber-500"
                  />
                  <span>Project Ownership & Well Charge Code (AFE)</span>
                </label>

                <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeInspection}
                    onChange={e => setIncludeInspection(e.target.checked)}
                    className="rounded border-white/20 bg-black text-amber-500"
                  />
                  <span>Inspection Validity & Expiration Date</span>
                </label>

                <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRackLoc}
                    onChange={e => setIncludeRackLoc(e.target.checked)}
                    className="rounded border-white/20 bg-black text-amber-500"
                  />
                  <span>Current Yard Bay / Rack Location</span>
                </label>
              </div>
            </div>

            {/* If Multiple Items, Item Picker */}
            {items.length > 1 && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300">
                    Selected Items ({items.length})
                  </label>
                  <span className="text-[10px] text-gray-400">Click to focus preview</span>
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-white/5 pr-1">
                  {items.map((itm, idx) => (
                    <button
                      key={itm.id}
                      type="button"
                      onClick={() => setActiveItemIndex(idx)}
                      className={`w-full p-2 flex items-center justify-between text-left rounded-lg transition ${
                        activeItemIndex === idx ? 'bg-amber-500/20 text-amber-300 font-bold' : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="font-mono text-amber-400">{itm.tagNumber}</span>
                        <span className="text-gray-400 ml-1.5 text-[11px] truncate">{itm.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono shrink-0">SN: {itm.serialNumber}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleDownloadQrImage(activeItem)}
                className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-semibold transition flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Save QR (.PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyTagData(activeItem)}
                className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-semibold transition flex items-center justify-center space-x-1.5"
              >
                {copiedId === activeItem.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copy Specs</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Label Preview & Sheet Column */}
          <div className="lg:col-span-7 flex flex-col print:w-full">
            
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 no-print">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-amber-500" />
                <span>Live Label Sheet Preview ({labelFormat.replace('-', ' ')})</span>
              </h3>
              <span className="text-[10px] text-gray-400">High-DPI Vector QR Output</span>
            </div>

            {/* Printable Container */}
            <div 
              ref={printAreaRef} 
              id="printable-label-sheet"
              className="bg-zinc-900 border border-white/20 rounded-2xl p-6 shadow-inner print:bg-white print:border-none print:p-0 print:m-0 print:shadow-none print:text-black"
            >
              
              {/* RENDER MODE 1: PIPE BAND STENCIL (Single / Focused) */}
              {labelFormat === 'pipe-band' && (
                <div className="space-y-6">
                  {(items.length > 1 ? [activeItem] : items).map((item) => (
                    <div 
                      key={item.id}
                      className="bg-white text-black rounded-xl p-5 border-4 border-black shadow-2xl relative overflow-hidden print:shadow-none print:border-2"
                    >
                      {/* Top Header */}
                      <div className="border-b-2 border-black pb-2 mb-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-xs tracking-wider uppercase bg-black text-white px-2 py-0.5 rounded">
                            {companyHeader}
                          </span>
                          <span className="text-[10px] font-bold text-gray-700">API SPEC 5CT / DS-1</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-gray-600">ID: {item.qrCodeData}</span>
                      </div>

                      {/* Main Center Content: QR + Specs */}
                      <div className="flex items-start space-x-4">
                        {/* High-Resolution QR Code */}
                        <div className="shrink-0 bg-white border-2 border-black p-1.5 rounded-lg shadow-sm">
                          {qrCodeUrls[item.id] ? (
                            <img 
                              src={qrCodeUrls[item.id]} 
                              alt={`QR for ${item.tagNumber}`} 
                              className="w-28 h-28 object-contain"
                            />
                          ) : (
                            <div className="w-28 h-28 flex items-center justify-center bg-gray-100 font-mono text-xs">
                              Rendering QR...
                            </div>
                          )}
                          <span className="block text-[8px] text-center font-mono font-bold mt-1 text-gray-700 uppercase">
                            Scan via Matco App
                          </span>
                        </div>

                        {/* Text Metadata */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-gray-500 block">Asset Tag Number</span>
                            <span className="text-2xl font-black font-mono tracking-tight text-black block leading-tight">
                              {item.tagNumber}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase block">Serial Number:</span>
                              <strong className="font-mono text-black">{item.serialNumber}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase block">Heat / Melt Number:</span>
                              <strong className="font-mono text-black">{item.heatNumber}</strong>
                            </div>
                          </div>

                          {includeSpecs && (
                            <div className="bg-gray-100 p-2 rounded border border-gray-300 text-[10px] grid grid-cols-2 gap-1.5">
                              <div>
                                <span className="text-gray-500">OD x Weight:</span>{' '}
                                <strong>{item.outerDiameter} • {item.weightLbFt}</strong>
                              </div>
                              <div>
                                <span className="text-gray-500">Grade:</span>{' '}
                                <strong className="text-amber-800">{item.grade}</strong>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-500">Connection:</span>{' '}
                                <strong className="font-mono">{item.connectionType}</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Row */}
                      <div className="mt-3 pt-2 border-t-2 border-dashed border-gray-300 flex flex-wrap items-center justify-between text-[9px] text-gray-600 gap-2">
                        {includeOwner && (
                          <div>
                            <span className="font-bold">Owner: </span>{item.projectOwner || 'Operating Company'} | <span className="font-bold font-mono">AFE: </span>{item.wellChargeCode || 'GLOBAL-01'}
                          </div>
                        )}
                        {includeRackLoc && (
                          <div>
                            <span className="font-bold">Loc: </span>{item.currentLocation} ({item.rackLocation || 'Rack Yard'})
                          </div>
                        )}
                        {includeInspection && (
                          <div className="font-bold text-black">
                            INSP DUE: {item.nextInspectionDue || 'PASS'}
                          </div>
                        )}
                      </div>

                      {/* Link to Drawer Action (Hidden in print) */}
                      {onOpenItemDetail && (
                        <div className="mt-3 pt-2 border-t border-gray-200 flex justify-end no-print">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenItemDetail(item);
                            }}
                            className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center space-x-1 cursor-pointer"
                          >
                            <span>Open Detailed Spec Drawer for {item.tagNumber}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* RENDER MODE 2: THERMAL COMPACT 4x2 */}
              {labelFormat === 'thermal-compact' && (
                <div className="space-y-4">
                  {(items.length > 1 ? [activeItem] : items).map((item) => (
                    <div 
                      key={item.id}
                      className="bg-white text-black p-4 rounded-lg border-2 border-black max-w-md mx-auto shadow-md"
                    >
                      <div className="flex items-center justify-between border-b border-black pb-1 mb-2">
                        <span className="font-black text-[11px] tracking-wide uppercase">{companyHeader}</span>
                        <span className="text-[9px] font-mono font-bold">QTY: {item.quantityJoints} JTS</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="shrink-0 bg-white border border-black p-1">
                          {qrCodeUrls[item.id] ? (
                            <img src={qrCodeUrls[item.id]} alt="QR" className="w-20 h-20" />
                          ) : (
                            <div className="w-20 h-20 flex items-center justify-center font-mono text-[9px]">QR...</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-xs">
                          <span className="text-xl font-black font-mono tracking-tight block leading-tight">{item.tagNumber}</span>
                          <p className="text-[10px] text-gray-700 truncate font-semibold">{item.name}</p>
                          <div className="text-[9px] text-gray-800 mt-1 font-mono">
                            <div>SN: {item.serialNumber} | HT: {item.heatNumber}</div>
                            <div>OD: {item.outerDiameter} | {item.grade} | {item.connectionType}</div>
                            <div>LOC: {item.currentLocation} [{item.rackLocation || 'Bay 1'}]</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-1 border-t border-black text-[8px] flex justify-between font-bold">
                        <span>AFE: {item.wellChargeCode || 'STANDARD'}</span>
                        <span>NEXT INSP: {item.nextInspectionDue || 'VALID'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RENDER MODE 3: BATCH MULTI-UP GRID (A4 SHEET) */}
              {labelFormat === 'sheet-grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                  {items.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-white text-black p-3.5 rounded-lg border-2 border-black flex items-start space-x-3 print:break-inside-avoid shadow-sm"
                    >
                      <div className="shrink-0 bg-white border border-black p-1">
                        {qrCodeUrls[item.id] ? (
                          <img src={qrCodeUrls[item.id]} alt="QR" className="w-16 h-16" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-[8px]">...</div>
                        )}
                        <span className="block text-[7px] text-center font-mono font-bold mt-0.5">{item.qrCodeData}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-base font-black font-mono block leading-tight text-black">{item.tagNumber}</span>
                        <span className="text-[9px] text-gray-700 block truncate font-medium">{item.name}</span>
                        <div className="text-[9px] text-gray-800 font-mono mt-1 leading-snug">
                          <div><strong>SN:</strong> {item.serialNumber} | <strong>OD:</strong> {item.outerDiameter}</div>
                          <div><strong>GR:</strong> {item.grade} | <strong>CN:</strong> {item.connectionType}</div>
                          <div><strong>LOC:</strong> {item.currentLocation}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Pagination / Item Selector for Pipe Band if multiple */}
            {items.length > 1 && labelFormat !== 'sheet-grid' && (
              <div className="flex items-center justify-between pt-3 text-xs text-gray-400 no-print">
                <span>Viewing Item {activeItemIndex + 1} of {items.length}: <strong className="text-amber-400 font-mono">{activeItem.tagNumber}</strong></span>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    disabled={activeItemIndex === 0}
                    onClick={() => setActiveItemIndex(prev => Math.max(0, prev - 1))}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white font-medium"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={activeItemIndex === items.length - 1}
                    onClick={() => setActiveItemIndex(prev => Math.min(items.length - 1, prev + 1))}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-white/10 flex items-center justify-between bg-white/5 no-print shrink-0">
          <div className="text-xs text-gray-400 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Labels ready for weatherproof thermal printer or A4 laser decal sheets</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition shadow flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print {items.length > 1 && labelFormat === 'sheet-grid' ? `All ${items.length} Labels` : 'Asset Label'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
