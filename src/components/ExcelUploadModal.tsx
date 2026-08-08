import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useDrilling } from '../context/DrillingContext';
import { ItemCategory, HoleSection, LocationType, MaintenanceStatus, EquipmentCondition, TubularItem } from '../types/drilling';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, FileCheck, Layers } from 'lucide-react';

interface ExcelUploadModalProps {
  onClose: () => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({ onClose }) => {
  const { bulkAddItems } = useDrilling();
  
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Omit<TubularItem, 'id' | 'updatedAt' | 'qrCodeData' | 'inspectionHistory' | 'maintenanceLogs'>[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        'Tag Number': 'CSG-1338-999',
        'Serial Number': 'SN-13CSG-0019',
        'Heat Number': 'HT-77123A',
        'Item Description': '13-3/8" Casing 68# L-80 VAM TOP',
        'Category': 'Casing',
        'Hole Section': '17-1/2" Intermediate',
        'Outer Diameter': '13 3/8"',
        'Weight (lb/ft)': '68 lb/ft',
        'Grade': 'L-80',
        'Connection': 'VAM TOP',
        'Joint Count': 120,
        'Length (ft)': 4800,
        'Location': 'Main Supply Base Yard',
        'Rack Location': 'Yard Rack D-04',
        'Status': 'Serviceable (Field Ready)',
        'COC Number': 'COC-2026-NIPPON-901',
        'PO Number': 'PO-45009988',
        'DO Number': 'DO-992310',
        'Well Charge Code': 'AFE-2026-ALPHA-01',
        'VISMA Number': 'VIS-88123',
        'TSR Number': 'TSR-4410',
        'Project Owner': 'Project Deepwater Alpha',
        'Last Inspection Date': '2026-07-01',
        'Next Inspection Due': '2027-07-01',
        'Inspection Cert #': 'CERT-NDT-9988',
      },
      {
        'Tag Number': 'DP-500-101',
        'Serial Number': 'SN-DP500-8812',
        'Heat Number': 'HT-55410Z',
        'Item Description': '5" Drill Pipe 19.5 lb/ft S-135 NC50 Range 2',
        'Category': 'Drill Pipe',
        'Hole Section': '12-1/4" Main Hole',
        'Outer Diameter': '5"',
        'Weight (lb/ft)': '19.5 lb/ft',
        'Grade': 'S-135',
        'Connection': 'NC50',
        'Joint Count': 300,
        'Length (ft)': 9300,
        'Location': 'Main Supply Base Yard',
        'Rack Location': 'Rack B-10',
        'Status': 'Due for Inspection',
        'COC Number': 'COC-2026-TUBOSCOPE-12',
        'PO Number': 'PO-45007712',
        'DO Number': 'DO-991204',
        'Well Charge Code': 'AFE-2026-ALPHA-02',
        'VISMA Number': 'VIS-99014',
        'TSR Number': 'TSR-4412',
        'Project Owner': 'Project Deepwater Alpha',
        'Last Inspection Date': '2025-08-01',
        'Next Inspection Due': '2026-08-15',
        'Inspection Cert #': 'CERT-VTI-7711',
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory_Import_Template');
    XLSX.writeFile(workbook, 'Drillspec_Inventory_Import_Template.xlsx');
  };

  // Parse Uploaded File
  const processFile = (file: File) => {
    setErrorMsg(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonRows.length === 0) {
          setErrorMsg('The uploaded file contains no rows or data.');
          return;
        }

        const mappedItems: Omit<TubularItem, 'id' | 'updatedAt' | 'qrCodeData' | 'inspectionHistory' | 'maintenanceLogs'>[] = jsonRows.map((row, index) => {
          // Helper to fetch key case-insensitively
          const getVal = (...keys: string[]) => {
            for (const key of keys) {
              const matchedKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          const tagNumber = getVal('Tag Number', 'Tag', 'TagNo', 'Tag_Number') || `TAG-BULK-${index + 101}`;
          const name = getVal('Item Description', 'Name', 'Description', 'Item Name', 'Title') || 'Tubular Inventory Item';
          const serialNumber = getVal('Serial Number', 'Serial', 'SN', 'SerialNo') || `SN-IMP-${Math.floor(1000 + Math.random() * 9000)}`;
          const heatNumber = getVal('Heat Number', 'Heat', 'HT', 'HeatNo') || `HT-M4091`;
          const category = (getVal('Category', 'Type') || 'Casing') as ItemCategory;
          const holeSection = (getVal('Hole Section', 'HoleSec', 'Section') || '17-1/2" Intermediate') as HoleSection;
          
          const outerDiameter = getVal('Outer Diameter', 'OD', 'OuterDiameter') || '13 3/8"';
          const weightLbFt = getVal('Weight (lb/ft)', 'Weight', 'WeightLbFt', 'Wt') || '68 lb/ft';
          const grade = getVal('Grade', 'Steel Grade', 'Material Grade') || 'L-80';
          const connectionType = getVal('Connection', 'ConnectionType', 'Thread', 'Thread Type') || 'VAM TOP';
          
          const quantityJoints = Number(getVal('Joint Count', 'Joints', 'Quantity', 'Qty')) || 1;
          const lengthFt = Number(getVal('Length (ft)', 'Length', 'LengthFt', 'Total Length')) || (quantityJoints * 40);
          
          const currentLocation = (getVal('Location', 'Current Location', 'Yard') || 'Main Supply Base Yard') as LocationType;
          const rackLocation = getVal('Rack Location', 'Rack', 'Bin') || 'Receiving Yard';
          const status = (getVal('Status', 'Maintenance Status') || 'Serviceable (Field Ready)') as MaintenanceStatus;
          
          const cocNumber = getVal('COC Number', 'COC', 'Certificate of Conformance', 'CoC');
          const poNumber = getVal('PO Number', 'PO', 'Purchase Order');
          const doNumber = getVal('DO Number', 'DO', 'Delivery Order');
          const wellChargeCode = getVal('Well Charge Code', 'Charge Code', 'AFE');
          const vismaNumber = getVal('VISMA Number', 'VISMA', 'VISMA ERP');
          const tsrNumber = getVal('TSR Number', 'TSR', 'Technical Service Request');
          const projectOwner = getVal('Project Owner', 'Project', 'Owner') || 'Project Deepwater Alpha';
          
          const lastInspectionDate = getVal('Last Inspection Date', 'Last Inspection') || new Date().toISOString().split('T')[0];
          const nextInspectionDue = getVal('Next Inspection Due', 'Inspection Due', 'Next Due') || '2027-06-01';
          const inspectionCertNumber = getVal('Inspection Cert #', 'Inspection Cert', 'Cert Number', 'Cert #') || `CERT-IMP-${Math.floor(100 + Math.random() * 900)}`;

          return {
            tagNumber,
            serialNumber,
            heatNumber,
            name,
            category,
            holeSection,
            outerDiameter,
            weightLbFt,
            grade,
            connectionType,
            quantityJoints,
            lengthFt,
            condition: 'New Purchased' as EquipmentCondition,
            status,
            currentLocation,
            rackLocation,
            cocNumber,
            poNumber,
            doNumber,
            wellChargeCode,
            vismaNumber,
            tsrNumber,
            projectOwner,
            isNewPurchased: true,
            isSurplus: false,
            lastInspectionDate,
            nextInspectionDue,
            inspectionCertNumber,
          };
        });

        setParsedData(mappedItems);
      } catch (err: any) {
        setErrorMsg('Error parsing file. Please ensure it is a valid Excel (.xlsx/.xls) or CSV file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImportSubmit = () => {
    if (parsedData.length === 0) return;
    bulkAddItems(parsedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 text-xs text-gray-200">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Bulk Import Existing Inventory (Excel / CSV)</h2>
              <p className="text-xs text-gray-400">Upload `.xlsx`, `.xls`, or `.csv` files containing tubular and tool records</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Top Download Template Action Bar */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-amber-400 flex items-center space-x-1.5">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <span>Need a standardized Excel layout?</span>
              </p>
              <p className="text-[11px] text-gray-300 mt-0.5">
                Download our pre-formatted Excel template pre-loaded with COC, PO, DO, Charge Code & VISMA fields.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition flex items-center space-x-2 shrink-0 shadow"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center space-y-3 cursor-pointer ${
              isDragOver 
                ? 'border-amber-500 bg-amber-500/10' 
                : 'border-white/10 bg-black/30 hover:border-white/20'
            }`}
          >
            <div className="p-3 rounded-full bg-white/5 text-amber-400">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {fileName ? `Loaded file: ${fileName}` : 'Drag & drop your Excel or CSV file here'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supports `.xlsx`, `.xls`, `.csv` formats (auto-detects header columns)
              </p>
            </div>
            <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition cursor-pointer inline-flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Browse File</span>
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Preview Parsed Records ({parsedData.length} items ready to import)</span>
                </h3>
              </div>

              <div className="border border-white/10 rounded-xl overflow-x-auto bg-black/40 max-h-60">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-white/5 text-gray-400 border-b border-white/10 font-medium uppercase text-[10px]">
                      <th className="p-2.5">Tag Number</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Category & Hole Sec</th>
                      <th className="p-2.5">OD / Weight / Grade</th>
                      <th className="p-2.5">Qty / Length</th>
                      <th className="p-2.5">COC / PO / Charge Code</th>
                      <th className="p-2.5">Project Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-200 font-mono">
                    {parsedData.slice(0, 15).map((item, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="p-2.5 font-bold text-amber-400">{item.tagNumber}</td>
                        <td className="p-2.5 font-sans font-medium text-white max-w-xs truncate">{item.name}</td>
                        <td className="p-2.5 font-sans whitespace-nowrap">{item.category} • {item.holeSection}</td>
                        <td className="p-2.5 whitespace-nowrap">{item.outerDiameter} • {item.weightLbFt} • {item.grade}</td>
                        <td className="p-2.5 whitespace-nowrap">{item.quantityJoints} jts ({item.lengthFt} ft)</td>
                        <td className="p-2.5 whitespace-nowrap text-gray-400 font-sans">
                          <div>COC: <span className="text-amber-300 font-mono">{item.cocNumber || 'N/A'}</span></div>
                          <div>PO: <span className="text-cyan-300 font-mono">{item.poNumber || 'N/A'}</span></div>
                          <div>AFE: <span className="text-gray-300 font-mono">{item.wellChargeCode || 'N/A'}</span></div>
                        </td>
                        <td className="p-2.5 font-sans font-semibold text-emerald-300">{item.projectOwner || 'Default'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 15 && (
                <p className="text-[11px] text-gray-400 text-center italic">
                  Showing first 15 records out of {parsedData.length} total parsed items.
                </p>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 p-5 border-t border-white/10 bg-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white transition font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedData.length === 0}
            onClick={handleImportSubmit}
            className={`px-5 py-2.5 rounded-xl text-black font-semibold transition shadow flex items-center space-x-2 ${
              parsedData.length > 0 
                ? 'bg-amber-500 hover:bg-amber-400 cursor-pointer' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import {parsedData.length} Items to Inventory</span>
          </button>
        </div>

      </div>
    </div>
  );
};
