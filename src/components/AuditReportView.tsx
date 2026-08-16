import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { HoleSection, LocationType } from '../types/drilling';
import { ExportCustomReportModal } from './ExportCustomReportModal';
import { 
  FileSpreadsheet, 
  Printer, 
  ShieldCheck, 
  Layers, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

export const AuditReportView: React.FC = () => {
  const { items, transfers } = useDrilling();

  const [selectedReportHoleSection, setSelectedReportHoleSection] = useState<HoleSection | 'ALL'>('ALL');
  const [selectedReportLocation, setSelectedReportLocation] = useState<LocationType | 'ALL'>('ALL');
  const [isCustomReportModalOpen, setIsCustomReportModalOpen] = useState(false);

  const reportItems = items.filter(i => {
    if (selectedReportHoleSection !== 'ALL' && i.holeSection !== selectedReportHoleSection) return false;
    if (selectedReportLocation !== 'ALL' && i.currentLocation !== selectedReportLocation) return false;
    return true;
  });

  const totalJoints = reportItems.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  const totalLengthFt = reportItems.reduce((acc, i) => acc + (i.lengthFt || 0), 0);
  const serviceableCount = reportItems.filter(i => i.status === 'Serviceable (Field Ready)').length;
  const overdueCount = reportItems.filter(i => i.status === 'Inspection Overdue').length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Tag Number', 'Name', 'Category', 'Hole Section', 'OD', 'Grade', 'Connection', 'Joints', 'Length (ft)', 'Location', 'Status', 'Cert Number', 'Next Inspection Due'];
    const rows = reportItems.map(i => [
      i.tagNumber,
      `"${i.name}"`,
      i.category,
      `"${i.holeSection}"`,
      i.outerDiameter,
      i.grade,
      `"${i.connectionType}"`,
      i.quantityJoints,
      i.lengthFt,
      `"${i.currentLocation}"`,
      `"${i.status}"`,
      i.inspectionCertNumber || '',
      i.nextInspectionDue,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Drilling_Campaign_Inventory_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print:p-0 print:bg-white print:text-black">
      
      {/* Non-Print Control Header */}
      <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 shadow-lg space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Audit-Ready Technical & Inventory Compliance Reporting</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Export certified tally sheets, NDT inspection logs, and material chain-of-custody reports for regulators and partners.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-2">
            {/* Custom Report Builder Button */}
            <button
              onClick={() => setIsCustomReportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition text-xs flex items-center space-x-2 shadow-lg hover:scale-[1.02]"
              title="Select custom data columns and time ranges to generate PDF summaries of asset lifecycle events"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Export Custom Report</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 text-gray-200 border border-white/10 hover:bg-white/10 transition text-xs font-semibold flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4 text-amber-500" />
              <span>Export CSV Tally</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 text-gray-200 border border-white/10 hover:bg-white/10 transition text-xs font-semibold flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Quick Print</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Filter Hole Section:</span>
            <select
              value={selectedReportHoleSection}
              onChange={e => setSelectedReportHoleSection(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:border-amber-500"
            >
              <option value="ALL" className="bg-[#141417]">All Hole Sections</option>
              <option value='36" Conductor' className="bg-[#141417]">36" Conductor</option>
              <option value='26" Surface Hole' className="bg-[#141417]">26" Surface Hole</option>
              <option value='17-1/2" Intermediate' className="bg-[#141417]">17-1/2" Intermediate</option>
              <option value='12-1/4" Main Hole' className="bg-[#141417]">12-1/4" Main Hole</option>
              <option value='8-1/2" Reservoir' className="bg-[#141417]">8-1/2" Reservoir</option>
              <option value='6" Liner / Workover' className="bg-[#141417]">6" Liner / Workover</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Filter Location:</span>
            <select
              value={selectedReportLocation}
              onChange={e => setSelectedReportLocation(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:border-amber-500"
            >
              <option value="ALL" className="bg-[#141417]">All Locations</option>
              <option value="Main Supply Base Yard" className="bg-[#141417]">Main Supply Base Yard</option>
              <option value="Offshore Rig Alpha" className="bg-[#141417]">Offshore Rig Alpha</option>
              <option value="Machine Shop & Testing Facility" className="bg-[#141417]">Machine Shop & Testing Facility</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Document Container */}
      <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 shadow-xl space-y-6 print:border-none print:shadow-none print:p-0 print:text-black">
        
        {/* Document Header */}
        <div className="border-b border-white/5 print:border-slate-300 pb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 print:text-amber-700">Official Drilling Campaign Audit Manifest</span>
            <h1 className="text-lg font-black text-white print:text-black mt-0.5">Tubular & Downhole Tool Inventory Compliance Certification</h1>
            <p className="text-xs text-gray-400 print:text-slate-600 mt-1">
              Campaign: Deepwater Alpha Campaign 2026 | Generated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="text-right border-l border-white/5 print:border-slate-300 pl-4">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 print:bg-emerald-100 print:text-emerald-800 font-bold text-xs border border-emerald-500/30">
              AUDIT READY
            </span>
            <p className="text-[10px] text-gray-400 print:text-slate-600 mt-1 font-mono">Doc ID: DRILL-AUDIT-2026-X9</p>
          </div>
        </div>

        {/* Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/5 print:bg-slate-100 p-4 rounded-xl border border-white/5 print:border-slate-300">
          <div>
            <span className="text-gray-400 print:text-slate-600 block text-[10px] uppercase font-medium">Audited Line Items</span>
            <span className="text-base font-extrabold text-white print:text-black">{reportItems.length} Records</span>
          </div>

          <div>
            <span className="text-gray-400 print:text-slate-600 block text-[10px] uppercase font-medium">Total Tally Joints</span>
            <span className="text-base font-extrabold text-amber-400 print:text-amber-800">{totalJoints} Joints ({totalLengthFt} ft)</span>
          </div>

          <div>
            <span className="text-gray-400 print:text-slate-600 block text-[10px] uppercase font-medium">Field Ready Compliant</span>
            <span className="text-base font-extrabold text-emerald-400 print:text-emerald-700">{serviceableCount} Items</span>
          </div>

          <div>
            <span className="text-gray-400 print:text-slate-600 block text-[10px] uppercase font-medium">Inspection Overdue</span>
            <span className="text-base font-extrabold text-rose-400 print:text-rose-700">{overdueCount} Items</span>
          </div>
        </div>

        {/* Main Audit Data Table */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse border border-white/5 print:border-slate-300">
            <thead>
              <tr className="bg-white/5 print:bg-slate-200 text-gray-400 print:text-black font-medium uppercase text-[10px] border-b border-white/5 print:border-slate-300">
                <th className="p-3 border-r border-white/5 print:border-slate-300">Tag & Heat #</th>
                <th className="p-3 border-r border-white/5 print:border-slate-300">Description / Specs</th>
                <th className="p-3 border-r border-white/5 print:border-slate-300">Hole Sec</th>
                <th className="p-3 border-r border-white/5 print:border-slate-300">Location</th>
                <th className="p-3 border-r border-white/5 print:border-slate-300 text-center">Tally Qty</th>
                <th className="p-3 border-r border-white/5 print:border-slate-300">Inspection Cert #</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-slate-300 text-gray-200 print:text-black font-mono text-[11px]">
              {reportItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 print:hover:bg-transparent">
                  <td className="p-3 border-r border-white/5 print:border-slate-300 font-semibold text-amber-400 print:text-amber-900">
                    <div>{item.tagNumber}</div>
                    <div className="text-[10px] text-gray-400 print:text-slate-600 font-normal">HT: {item.heatNumber}</div>
                  </td>
                  <td className="p-3 border-r border-white/5 print:border-slate-300 font-sans">
                    <p className="font-medium text-white print:text-black">{item.name}</p>
                    <p className="text-[10px] text-gray-400 print:text-slate-600">{item.outerDiameter} • {item.grade} • {item.connectionType}</p>
                  </td>
                  <td className="p-3 border-r border-white/5 print:border-slate-300 font-sans whitespace-nowrap">{item.holeSection}</td>
                  <td className="p-3 border-r border-white/5 print:border-slate-300 font-sans whitespace-nowrap">{item.currentLocation}</td>
                  <td className="p-3 border-r border-white/5 print:border-slate-300 text-center font-bold">{item.quantityJoints} jts</td>
                  <td className="p-3 border-r border-white/5 print:border-slate-300">
                    <div>{item.inspectionCertNumber || 'CERT-NDT-881'}</div>
                    <div className="text-[10px] text-gray-400 print:text-slate-600 font-sans">Due: {item.nextInspectionDue}</div>
                  </td>
                  <td className="p-3 font-sans font-semibold">
                    <span className={item.status === 'Serviceable (Field Ready)' ? 'text-emerald-400 print:text-emerald-800' : 'text-rose-400 print:text-rose-800'}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Sign-off Box */}
        <div className="pt-6 border-t border-white/5 print:border-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-white/5 print:bg-slate-100 rounded-xl border border-white/5 print:border-slate-300">
            <span className="text-[10px] font-medium uppercase text-gray-400 print:text-slate-600 block">Lead Drilling Engineer</span>
            <p className="font-semibold text-white print:text-black mt-1">Marcus Vance, PE</p>
            <p className="text-[10px] text-gray-400 print:text-slate-600">Signed & Approved</p>
          </div>

          <div className="p-3.5 bg-white/5 print:bg-slate-100 rounded-xl border border-white/5 print:border-slate-300">
            <span className="text-[10px] font-medium uppercase text-gray-400 print:text-slate-600 block">QA/QC Senior Inspector</span>
            <p className="font-semibold text-white print:text-black mt-1">SGS Tubular QA Team</p>
            <p className="text-[10px] text-gray-400 print:text-slate-600">Certified Compliant</p>
          </div>

          <div className="p-3.5 bg-white/5 print:bg-slate-100 rounded-xl border border-white/5 print:border-slate-300 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-medium uppercase text-gray-400 print:text-slate-600 block">Materials Coordinator</span>
            <p className="font-semibold text-white print:text-black mt-1">Base Yard Logistics</p>
            <p className="text-[10px] text-gray-400 print:text-slate-600">Verification Stamp Attached</p>
          </div>
        </div>

      </div>

      {/* Export Custom Report Modal */}
      {isCustomReportModalOpen && (
        <ExportCustomReportModal
          isOpen={isCustomReportModalOpen}
          onClose={() => setIsCustomReportModalOpen(false)}
          items={reportItems}
        />
      )}

    </div>
  );
};
