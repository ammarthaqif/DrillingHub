import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { LocationType, MaintenanceStatus } from '../types/drilling';
import { 
  ShieldCheck, 
  Building2, 
  HardHat, 
  Wrench, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Clock, 
  FileCheck, 
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  ListFilter
} from 'lucide-react';

export const CheckAndBalanceHub: React.FC = () => {
  const { items, transfers, surplusBookings } = useDrilling();
  const [searchTag, setSearchTag] = useState('');

  // Location Totals Matrix
  const locationsList: LocationType[] = [
    'Main Supply Base Yard',
    'Offshore Rig Alpha',
    'Machine Shop & Testing Facility',
    'In Transit (Supply Vessel)',
    'In Transit (Road Truck)',
    'Vendor Warehouse'
  ];

  const getCountByLocation = (loc: LocationType) => {
    return items.filter(i => i.currentLocation === loc);
  };

  const getJointsByLocation = (loc: LocationType) => {
    return items.filter(i => i.currentLocation === loc).reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  };

  const totalJointsInFleet = items.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);

  // Status Totals
  const serviceableJoints = items.filter(i => i.status === 'Serviceable (Field Ready)').reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  const overdueJoints = items.filter(i => i.status === 'Inspection Overdue').reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  const quarantinedJoints = items.filter(i => i.status === 'Quarantined / Damaged').reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  const inRefurbishmentJoints = items.filter(i => i.status === 'In Refurbishment').reduce((acc, i) => acc + (i.quantityJoints || 1), 0);

  // Filtered Chain of Custody Items
  const filteredItems = items.filter(item => {
    if (searchTag.trim()) {
      const q = searchTag.toLowerCase();
      return (
        item.tagNumber.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.serialNumber.toLowerCase().includes(q) ||
        (item.poNumber && item.poNumber.toLowerCase().includes(q)) ||
        (item.projectOwner && item.projectOwner.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-extrabold text-white">Campaign Inventory Check & Balance Reconciliation Center</h2>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Audit Compliance Active
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-time reconciliation of total quantities, whereabouts, and chain-of-custody across base yards, offshore rigs, vendor machine shops, and supply vessels.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/10 text-right">
            <p className="text-[10px] text-gray-400">Total Campaign Fleet Joints</p>
            <p className="text-base font-extrabold text-amber-400 font-mono">{totalJointsInFleet.toLocaleString()} Jts</p>
          </div>
        </div>
      </div>

      {/* 1. Location & Whereabouts Reconciliation Matrix */}
      <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="border-b border-white/10 pb-3 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>1. Equipment Whereabouts & Physical Stock Reconciliation Matrix</span>
          </h3>
          <span className="text-[10px] text-gray-400 font-mono">100% Accounted</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {locationsList.map((loc) => {
            const locItems = getCountByLocation(loc);
            const locJoints = getJointsByLocation(loc);
            const pct = totalJointsInFleet > 0 ? Math.round((locJoints / totalJointsInFleet) * 100) : 0;

            return (
              <div key={loc} className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1 text-center shadow-md">
                <p className="text-[11px] font-bold text-white truncate">{loc}</p>
                <p className="text-lg font-extrabold text-amber-400 font-mono">{locJoints} Jts</p>
                <p className="text-[10px] text-gray-400 font-mono">{locItems.length} Line Items ({pct}%)</p>
              </div>
            );
          })}
        </div>

        {/* Status Health Breakdown Bar */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
          <div className="flex justify-between text-xs text-gray-300">
            <span className="font-bold text-white">Equipment Health & Readiness Summary</span>
            <span className="font-mono">{serviceableJoints} Jts Ready ({totalJointsInFleet > 0 ? Math.round((serviceableJoints / totalJointsInFleet) * 100) : 0}%)</span>
          </div>

          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex">
            <div style={{ width: `${(serviceableJoints / totalJointsInFleet) * 100}%` }} className="bg-emerald-500 h-full" title="Serviceable" />
            <div style={{ width: `${(inRefurbishmentJoints / totalJointsInFleet) * 100}%` }} className="bg-amber-500 h-full" title="In Refurbishment" />
            <div style={{ width: `${(overdueJoints / totalJointsInFleet) * 100}%` }} className="bg-rose-500 h-full" title="Inspection Overdue" />
            <div style={{ width: `${(quarantinedJoints / totalJointsInFleet) * 100}%` }} className="bg-purple-500 h-full" title="Quarantined" />
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 pt-1">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Serviceable: <strong className="text-white">{serviceableJoints} Jts</strong></span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>In Shop: <strong className="text-white">{inRefurbishmentJoints} Jts</strong></span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>Overdue Inspection: <strong className="text-white">{overdueJoints} Jts</strong></span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              <span>Quarantined: <strong className="text-white">{quarantinedJoints} Jts</strong></span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Chain of Custody & Detailed Line Audit */}
      <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span>2. Detailed Equipment Chain of Custody Audit Log</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Inspect lifecycle origin, project ownership transfers, certificate numbers, and current rack positioning for any item in fleet.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              placeholder="Filter Tag / PO / Owner..."
              className="bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 w-64"
            />
          </div>
        </div>

        {/* Table of Chain of Custody Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-black/40 text-gray-400 font-semibold uppercase text-[10px] border-b border-white/10">
              <tr>
                <th className="p-3">Tag / Serial / Heat</th>
                <th className="p-3">Equipment Name</th>
                <th className="p-3">Current Location & Rack</th>
                <th className="p-3">Project / Asset Owner</th>
                <th className="p-3">PO / ERP Reference</th>
                <th className="p-3">Condition / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition">
                  <td className="p-3 font-mono">
                    <p className="font-bold text-amber-400 text-xs">{item.tagNumber}</p>
                    <p className="text-[10px] text-gray-400">{item.serialNumber}</p>
                    <p className="text-[10px] text-gray-500">HT: {item.heatNumber}</p>
                  </td>

                  <td className="p-3 font-medium text-white max-w-[220px]">
                    <p>{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.outerDiameter} • {item.grade} • {item.connectionType}</p>
                  </td>

                  <td className="p-3">
                    <p className="font-semibold text-white">{item.currentLocation}</p>
                    <p className="text-[10px] text-amber-300 font-mono">{item.rackLocation || 'Unassigned Rack'}</p>
                  </td>

                  <td className="p-3">
                    <p className="font-semibold text-white">{item.projectOwner || 'Central Asset Pool'}</p>
                    {item.wellChargeCode && (
                      <p className="text-[10px] text-gray-400 font-mono">{item.wellChargeCode}</p>
                    )}
                  </td>

                  <td className="p-3 font-mono text-[11px]">
                    <p className="text-gray-300">{item.poNumber || 'N/A'}</p>
                    <p className="text-[10px] text-gray-500">{item.vismaNumber || 'N/A'}</p>
                  </td>

                  <td className="p-3">
                    <div className="space-y-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border inline-block ${
                        item.status === 'Serviceable (Field Ready)'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : item.status === 'Inspection Overdue'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {item.status}
                      </span>
                      <p className="text-[10px] text-gray-400 font-mono">Cert: {item.inspectionCertNumber}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
