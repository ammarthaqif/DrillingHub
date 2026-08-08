import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { TubularItem } from '../types/drilling';
import { 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCcw, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Wrench,
  ChevronRight,
  Filter,
  FileSpreadsheet
} from 'lucide-react';

interface SurplusAndBackloadManagerProps {
  onSelectItem: (item: TubularItem) => void;
}

export const SurplusAndBackloadManager: React.FC<SurplusAndBackloadManagerProps> = ({ onSelectItem }) => {
  const { items, addInspectionRecord } = useDrilling();
  const [minMonthsFilter, setMinMonthsFilter] = useState<number>(6); // Default 6 months

  const surplusItems = items.filter(i => i.isSurplus);
  
  const filteredSurplus = surplusItems.filter(i => (i.monthsAtYard || 0) >= minMonthsFilter);

  const totalSurplusJoints = surplusItems.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  const itemsNeedingRecert = surplusItems.filter(i => (i.monthsAtYard || 0) >= 6 || i.status !== 'Serviceable (Field Ready)');

  const handleQuickRecertify = (item: TubularItem) => {
    const certNum = `CERT-RECERT-${Math.floor(1000 + Math.random() * 9000)}`;
    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + 6);
    const nextDueStr = nextDue.toISOString().split('T')[0];

    addInspectionRecord(item.id, {
      date: new Date().toISOString().split('T')[0],
      inspectorName: 'Base Yard Recertification QA',
      inspectionType: 'NDT (Magnetic Particle)',
      result: 'Pass',
      certNumber: certNum,
      nextInspectionDue: nextDueStr,
      remarks: `Post-backload recertification completed after ${item.monthsAtYard || 0} months at supply base yard.`,
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Surplus & Backload Yard Storage Shelf-life Manager</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Track equipment returned from rig sites (backloaded) and long-sitting yard surplus requiring NDT recertification & thread inspection prior to re-use.
            </p>
          </div>

          {/* Month Threshold Filter Buttons */}
          <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <span className="text-[11px] font-medium text-gray-400 px-2">Yard Age:</span>
            {[0, 3, 6, 12].map(m => (
              <button
                key={m}
                onClick={() => setMinMonthsFilter(m)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  minMonthsFilter === m ? 'bg-amber-500 text-black shadow' : 'text-gray-300 hover:text-white'
                }`}
              >
                {m === 0 ? 'All Surplus' : `> ${m} Months`}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-white/5 text-xs">
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
            <span className="text-gray-400 block text-[10px] uppercase font-medium">Total Surplus Line Items</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{surplusItems.length} items</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
            <span className="text-gray-400 block text-[10px] uppercase font-medium">Total Surplus Tally Joints</span>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">{totalSurplusJoints} joints</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
            <span className="text-gray-400 block text-[10px] uppercase font-medium">Items Sitting &gt; 6 Months</span>
            <span className="text-xl font-bold text-rose-400 mt-0.5 block">
              {surplusItems.filter(i => (i.monthsAtYard || 0) >= 6).length} items
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
            <span className="text-gray-400 block text-[10px] uppercase font-medium">Recertification Pending</span>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">{itemsNeedingRecert.length} items</span>
          </div>
        </div>
      </div>

      {/* Recertification Rules Info Card */}
      <div className="bg-[#141417] border border-amber-500/30 rounded-2xl p-5 text-xs text-gray-300 flex items-start space-x-3 shadow-lg">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-400 text-sm">Offshore Drilling QA/QC Recertification Rule (DS-1 / API RP 7G)</h3>
          <p className="mt-1 text-gray-300 leading-relaxed">
            Any backloaded casing, tubing, or drill string item sitting at the supply base yard for <strong>over 6 months (180 days)</strong> must undergo visual thread inspection, full-length magnetic particle testing (MPI), and API drift mandrel gauge testing before mobilization to rig site.
          </p>
        </div>
      </div>

      {/* Main Surplus Table / Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Displaying {filteredSurplus.length} Surplus Items (Yard Age &ge; {minMonthsFilter} Months)
        </h3>

        {filteredSurplus.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#111114] p-12 text-center text-gray-400">
            <p className="font-semibold text-gray-300">No surplus items found meeting criteria</p>
            <p className="text-xs mt-1 text-gray-500">Try selecting a lower yard age filter threshold above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSurplus.map((item) => {
              const isLongYard = (item.monthsAtYard || 0) >= 6;
              const isOverdue = item.status === 'Inspection Overdue';

              return (
                <div 
                  key={item.id}
                  className={`rounded-2xl border p-5 transition space-y-4 shadow-lg bg-[#111114] ${
                    isOverdue 
                      ? 'border-rose-500/40 bg-rose-500/5' 
                      : isLongYard 
                      ? 'border-amber-500/40 bg-amber-500/5' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-amber-400 text-sm font-mono">{item.tagNumber}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-gray-300 border border-white/10">
                        {item.surplusReason || 'Backloaded Surplus'}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      isOverdue ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Title & Specs */}
                  <div>
                    <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {item.outerDiameter} • {item.weightLbFt} • {item.grade} • <span className="text-cyan-300 font-mono">{item.connectionType}</span>
                    </p>
                  </div>

                  {/* Backload & Yard Age Timeline */}
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 text-xs grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-medium">Backloaded Date</span>
                      <span className="font-semibold text-white mt-0.5 block">{item.backloadedDate || 'Prior Campaign'}</span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-medium">Duration at Yard</span>
                      <span className={`font-bold text-sm ${isLongYard ? 'text-amber-400' : 'text-gray-200'}`}>
                        {item.monthsAtYard || 0} Months
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-medium">Current Yard Location</span>
                      <span className="font-medium text-cyan-300 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{item.rackLocation || item.currentLocation}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-medium">Tally Quantity</span>
                      <span className="font-semibold text-white mt-0.5 block">{item.quantityJoints} joints ({item.lengthFt} ft)</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button
                      onClick={() => onSelectItem(item)}
                      className="text-xs font-medium text-gray-400 hover:text-white flex items-center space-x-1 transition"
                    >
                      <span>View Inspection Log</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleQuickRecertify(item)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition flex items-center space-x-1.5 shadow"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Log NDT Recertification</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
