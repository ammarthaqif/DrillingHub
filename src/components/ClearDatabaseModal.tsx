import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import * as XLSX from 'xlsx';
import { 
  Trash2, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  Layers, 
  Database,
  ArrowRight,
  Sparkles,
  Info,
  Check
} from 'lucide-react';

interface ClearDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExcelImport: () => void;
}

const SAMPLE_CSV_DATA = `Tag Number,Description,Category,Hole Section,Outer Diameter,Inner Diameter,Weight (lb/ft),Grade,Connection,Quantity (Joints),Total Length (ft),Serial Number,Heat Number,Current Location,Rack Location,Condition,Status,COC Number,PO Number,DO Number,Well / AFE Code,VISMA Ref,TSR Number,Project Owner,Purchase Cost (USD),Last Inspection Date,Next Inspection Due,Inspection Cert #
CSG-958-001,9-5/8" Casing 47# P110 TenarisHydril Blue,Casing,12-1/4" Main Hole,9.625,8.681,47.0,P110,TenarisHydril Blue,120,4800,SN-2026-958-001,HT-882190,Main Supply Base Yard,Rack Yard 04-A,New Purchased,Serviceable (Field Ready),COC-TEN-2026-881,PO-2026-7712,DO-2026-9901,AFE-2026-ALPHA-01,VISMA-99210,TSR-2026-01,Alpha Drilling Ops,345000,2026-05-10,2027-05-10,CERT-TH-9581
DP-500-002,5" Drill Pipe 19.5# S135 XT50,Drill Pipe,8-1/2" Reservoir,5.000,4.276,19.5,S135,NOV XT50,250,7500,SN-2026-500-002,HT-993214,Main Supply Base Yard,Rack Yard 02-B,Used - Good,Serviceable (Field Ready),COC-NOV-2026-442,PO-2026-6623,DO-2026-8834,AFE-2026-ALPHA-01,VISMA-88341,TSR-2026-02,Alpha Drilling Ops,420000,2026-06-15,2026-12-15,CERT-NOV-5002
TBG-350-003,3-1/2" Tubing 9.3# L80 13Cr VAM TOP,Tubing,8-1/2" Reservoir,3.500,2.992,9.3,L80-13Cr,Vallourec VAM TOP,180,5400,SN-2026-350-003,HT-774412,Main Supply Base Yard,Rack Yard 06-C,New Purchased,Serviceable (Field Ready),COC-VAL-2026-119,PO-2026-5541,DO-2026-7721,AFE-2026-ALPHA-01,VISMA-77412,TSR-2026-03,Alpha Drilling Ops,580000,2026-07-01,2027-07-01,CERT-VAL-3503
DC-800-004,8" Drill Collar 150# AISI 4145H 6-5/8 REG,Drill Collar,17-1/2" Intermediate,8.000,2.812,150.0,AISI 4145H,6-5/8 REG,12,360,SN-2026-800-004,HT-665521,Main Supply Base Yard,Heavy Tools Bay 01,Used - Good,Serviceable (Field Ready),COC-NOV-2026-778,PO-2026-4412,DO-2026-6632,AFE-2026-ALPHA-01,VISMA-66512,TSR-2026-04,Alpha Drilling Ops,145000,2026-04-20,2026-10-20,CERT-NOV-8004
HWDP-500-005,5" Heavy Weight Drill Pipe 50# S135 XT50,Heavy Weight Drill Pipe (HWDP),12-1/4" Main Hole,5.000,3.000,50.0,S135,NOV XT50,45,1350,SN-2026-HWDP-005,HT-554433,Main Supply Base Yard,Rack Yard 03-A,Used - Minor Wear,Due for Inspection,COC-NOV-2026-991,PO-2026-3399,DO-2026-5521,AFE-2026-ALPHA-01,VISMA-55321,TSR-2026-05,Alpha Drilling Ops,195000,2026-01-10,2026-07-10,CERT-NOV-HWDP5`;

export const ClearDatabaseModal: React.FC<ClearDatabaseModalProps> = ({
  isOpen,
  onClose,
  onOpenExcelImport,
}) => {
  const { 
    items, 
    transfers, 
    clearAllInventoryData, 
    purgeEntireOperationalDatabase, 
    restoreSampleDemoBaseline,
    isCleanSlate,
    currentUser
  } = useDrilling();

  const [confirmedWipe, setConfirmedWipe] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [selectedActionType, setSelectedActionType] = useState<'inventory_and_import' | 'inventory_only' | 'full_purge'>('inventory_and_import');

  if (!isOpen) return null;

  const handleDownloadMasterExcelTemplate = () => {
    try {
      const lines = SAMPLE_CSV_DATA.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1).map(l => {
        const values = l.split(',').map(v => v.trim());
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] || '';
        });
        return obj;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Master_OCTG_Database');
      XLSX.writeFile(workbook, 'DrillSpec_Master_Tubular_Database_Template.xlsx');
    } catch (e) {
      console.error('Error exporting template', e);
    }
  };

  const handleExecuteClear = async () => {
    if (!confirmedWipe) return;
    setIsProcessing(true);
    setActionSuccessMessage(null);

    try {
      if (selectedActionType === 'inventory_and_import') {
        await clearAllInventoryData();
        setIsProcessing(false);
        onClose();
        // Immediately launch the Excel/CSV importer
        onOpenExcelImport();
        return;
      } else if (selectedActionType === 'inventory_only') {
        const res = await clearAllInventoryData();
        setActionSuccessMessage(res.message);
      } else if (selectedActionType === 'full_purge') {
        const res = await purgeEntireOperationalDatabase();
        setActionSuccessMessage(res.message);
      }
    } catch (e: any) {
      console.error('Clear error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreDemo = () => {
    if (window.confirm('Restore sample demonstration OCTG inventory and transfer manifests?')) {
      restoreSampleDemoBaseline();
      setActionSuccessMessage('Sample demonstration dataset successfully restored.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#141417] border border-white/15 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-rose-950/40 via-black to-black">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Clear Dummy Data & Start Fresh with Excel</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
                  Data Migration
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Switch from sample prototype data to your company's real tubular database spreadsheet (.xlsx / .csv)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          
          {/* Current Database State Banner */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Current Inventory Status:</div>
                <div className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>{items.length} Tubular Records Loaded</span>
                  <span className="text-gray-500 font-normal">|</span>
                  <span className="text-gray-300 font-mono text-xs">{transfers.length} Manifests</span>
                  {isCleanSlate ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      Clean Slate Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                      Sample Baseline Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadMasterExcelTemplate}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition flex items-center space-x-1.5 shrink-0"
              title="Download clean Excel template formatted with standard OCTG tubular columns"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* Action Success Alert */}
          {actionSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Operation Completed:</strong> {actionSuccessMessage}
              </div>
            </div>
          )}

          {/* Action Selection Options */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Choose Fresh Start Action:
            </label>

            <div className="grid grid-cols-1 gap-3">
              
              {/* Option 1: Clear & Launch Excel Import (Recommended) */}
              <label 
                onClick={() => setSelectedActionType('inventory_and_import')}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-start space-x-3.5 ${
                  selectedActionType === 'inventory_and_import'
                    ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-lg'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="clear_action"
                  checked={selectedActionType === 'inventory_and_import'}
                  onChange={() => setSelectedActionType('inventory_and_import')}
                  className="mt-1 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white flex items-center space-x-2">
                      <span>Wipe Dummy Items & Import Excel Master Database</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase">
                        Recommended
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Purges the sample tubular dataset, sets the database to clean slate, and immediately launches the Excel/CSV file upload wizard to import your real operational equipment.
                  </p>
                </div>
              </label>

              {/* Option 2: Clear Inventory Only */}
              <label 
                onClick={() => setSelectedActionType('inventory_only')}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-start space-x-3.5 ${
                  selectedActionType === 'inventory_only'
                    ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-lg'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="clear_action"
                  checked={selectedActionType === 'inventory_only'}
                  onChange={() => setSelectedActionType('inventory_only')}
                  className="mt-1 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <div className="space-y-1 flex-1">
                  <span className="font-bold text-sm text-white">
                    Clear OCTG Inventory Only (Reset to 0 items)
                  </span>
                  <p className="text-xs text-gray-400">
                    Removes all existing tubular item records from LocalStorage, IndexedDB, and Firestore. Leaves campaigns, users, and settings untouched.
                  </p>
                </div>
              </label>

              {/* Option 3: Full Operational Purge */}
              <label 
                onClick={() => setSelectedActionType('full_purge')}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-start space-x-3.5 ${
                  selectedActionType === 'full_purge'
                    ? 'bg-rose-500/10 border-rose-500/40 text-white shadow-lg'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="clear_action"
                  checked={selectedActionType === 'full_purge'}
                  onChange={() => setSelectedActionType('full_purge')}
                  className="mt-1 text-rose-500 focus:ring-0 cursor-pointer"
                />
                <div className="space-y-1 flex-1">
                  <span className="font-bold text-sm text-rose-300">
                    Complete Operational Database Purge (Full Clean Slate)
                  </span>
                  <p className="text-xs text-gray-400">
                    Wipes all sample items, manifests, rig backloads, requisitions, surplus requests, and callouts across all storage layers. Leaves administrator accounts intact.
                  </p>
                </div>
              </label>

            </div>
          </div>

          {/* Safety Confirmation Checkbox */}
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Confirmation Required
                </h4>
                <p className="text-xs text-gray-400">
                  This operation will remove {items.length} items from your active workspace and cloud synchronization.
                </p>
              </div>
            </div>

            <label className="flex items-center space-x-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={confirmedWipe}
                onChange={(e) => setConfirmedWipe(e.target.checked)}
                className="rounded border-rose-500/40 bg-black/40 text-rose-500 focus:ring-0 cursor-pointer w-4 h-4"
              />
              <span className="text-xs font-medium text-gray-200">
                I understand this will clear current data and switch this workspace to clean operational mode.
              </span>
            </label>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Revert / Restore Demo link */}
          <button
            type="button"
            onClick={handleRestoreDemo}
            className="text-xs text-gray-400 hover:text-amber-400 flex items-center space-x-1.5 transition"
            title="Restore default sample demonstration records"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Sample Demo Data</span>
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!confirmedWipe || isProcessing}
              onClick={handleExecuteClear}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg flex items-center space-x-2 ${
                confirmedWipe && !isProcessing
                  ? selectedActionType === 'full_purge' 
                    ? 'bg-rose-500 hover:bg-rose-400 text-white cursor-pointer shadow-rose-500/20' 
                    : 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer shadow-amber-500/20'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Clearing Database...</span>
                </>
              ) : selectedActionType === 'inventory_and_import' ? (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Clear Dummy Data & Open Excel Importer</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Execute Clean Slate</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
