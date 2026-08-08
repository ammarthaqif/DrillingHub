import React from 'react';
import { useDrilling } from '../context/DrillingContext';
import { TubularItem } from '../types/drilling';
import { X, ShieldAlert, AlertTriangle, Clock, RotateCcw, ChevronRight, CheckCircle2 } from 'lucide-react';

interface InspectionAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: TubularItem) => void;
}

export const InspectionAlertsModal: React.FC<InspectionAlertsModalProps> = ({
  isOpen,
  onClose,
  onSelectItem,
}) => {
  const { items, addInspectionRecord } = useDrilling();

  if (!isOpen) return null;

  const today = new Date('2026-08-07');

  const overdueItems = items.filter(i => {
    if (i.status === 'Inspection Overdue') return true;
    if (!i.nextInspectionDue) return false;
    const diff = Math.ceil((new Date(i.nextInspectionDue).getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diff < 0;
  });

  const dueSoonItems = items.filter(i => {
    if (i.status === 'Inspection Overdue') return false;
    if (!i.nextInspectionDue) return false;
    const diff = Math.ceil((new Date(i.nextInspectionDue).getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diff >= 0 && diff <= 30;
  });

  const longYardSurplusItems = items.filter(i => i.isSurplus && (i.monthsAtYard || 0) >= 6);

  const handleQuickPass = (item: TubularItem) => {
    const certNum = `CERT-QA-${Math.floor(1000 + Math.random() * 9000)}`;
    const nextDue = new Date();
    nextDue.setFullYear(nextDue.getFullYear() + 1);
    const nextDueStr = nextDue.toISOString().split('T')[0];

    addInspectionRecord(item.id, {
      date: new Date().toISOString().split('T')[0],
      inspectorName: 'Field QA Inspector',
      inspectionType: 'NDT (Magnetic Particle)',
      result: 'Pass',
      certNumber: certNum,
      nextInspectionDue: nextDueStr,
      remarks: 'Full visual thread and MPI inspection completed.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 text-xs text-gray-200">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-white">Campaign Inspection & Compliance Alerts</h2>
              <p className="text-xs text-gray-400">Automated monitoring for overdue NDT inspections & yard surplus recertification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Overdue Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-rose-400 font-medium uppercase tracking-wider text-xs border-b border-rose-500/30 pb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Inspection Overdue ({overdueItems.length})</span>
            </div>

            {overdueItems.length === 0 ? (
              <p className="text-gray-400 italic p-3 bg-white/5 rounded-xl border border-white/5">Zero items currently overdue for inspection.</p>
            ) : (
              <div className="space-y-2">
                {overdueItems.map(item => (
                  <div key={item.id} className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-semibold text-rose-300">{item.tagNumber}</span>
                        <span className="font-medium text-white">{item.name}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        OD: {item.outerDiameter} • Grade: {item.grade} • Due: <strong className="text-rose-400">{item.nextInspectionDue}</strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => {
                          onClose();
                          onSelectItem(item);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 text-gray-200 hover:bg-white/20 font-medium transition"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleQuickPass(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition"
                      >
                        Log NDT Pass
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Due Soon Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-medium uppercase tracking-wider text-xs border-b border-amber-500/30 pb-2">
              <Clock className="w-4 h-4" />
              <span>Upcoming Inspections Due Within 30 Days ({dueSoonItems.length})</span>
            </div>

            {dueSoonItems.length === 0 ? (
              <p className="text-gray-400 italic p-3 bg-white/5 rounded-xl border border-white/5">No items due for inspection in the next 30 days.</p>
            ) : (
              <div className="space-y-2">
                {dueSoonItems.map(item => (
                  <div key={item.id} className="bg-[#141417] border border-white/10 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-semibold text-amber-400">{item.tagNumber}</span>
                        <span className="font-medium text-white">{item.name}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        OD: {item.outerDiameter} • Next Due: <strong className="text-amber-400">{item.nextInspectionDue}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectItem(item);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 text-amber-300 hover:bg-white/20 shrink-0 font-medium transition"
                    >
                      Inspect / Log
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Long Yard Surplus Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-medium uppercase tracking-wider text-xs border-b border-cyan-500/30 pb-2">
              <Clock className="w-4 h-4" />
              <span>Yard Surplus Items Sitting &gt; 6 Months ({longYardSurplusItems.length})</span>
            </div>

            {longYardSurplusItems.map(item => (
              <div key={item.id} className="bg-[#141417] border border-white/10 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-semibold text-amber-400">{item.tagNumber}</span>
                    <span className="font-medium text-white">{item.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Backloaded: {item.backloadedDate || 'Prior Well'} • Duration: <strong className="text-amber-400">{item.monthsAtYard} months at yard</strong>
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onSelectItem(item);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 text-amber-300 hover:bg-white/20 shrink-0 font-medium transition"
                >
                  Recertify
                </button>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
