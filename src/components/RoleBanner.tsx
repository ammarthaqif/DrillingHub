import React from 'react';
import { useDrilling } from '../context/DrillingContext';
import { MapPin, Building2, ShieldCheck, UserCog } from 'lucide-react';

export const RoleBanner: React.FC = () => {
  const { currentUser } = useDrilling();

  const getRolePermissions = () => {
    switch (currentUser.role) {
      case 'Drilling Engineer':
        return 'Full Campaign Management, Hole Section Tallying, Spec Editing, AI Readiness Audit';
      case 'Logistics Coordinator':
        return 'Material Transfer Ticket Creation, Dispatch Validation, Carrier Assignment';
      case 'Materials Coordinator (Supply Base)':
        return 'Base Yard Storage, Receiving Backloads, Inspection Scheduling, Stock-take';
      case 'Rig Toolpusher / Materials Specialist':
        return 'Rig Site Receipt Verification, Discrepancy Logging, Run-in-hole Tallying';
      case 'QA/QC Inspector':
        return 'Inspection Cert Approvals, NDT Log Creation, Quarantining Damaged Items';
      case 'Auditor / Management':
        return 'Read-Only Compliance View, Audit Tally Export, Chain-of-Custody Verification';
      default:
        return 'General Inventory Access';
    }
  };

  return (
    <div className="bg-[#0e0e11]/90 border-b border-white/10 text-xs px-4 sm:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-3 text-gray-300">
          <div className="flex items-center space-x-1.5 text-amber-500 font-semibold">
            <UserCog className="w-4 h-4" />
            <span>{currentUser.role}</span>
          </div>
          <span className="text-gray-600 hidden sm:inline">•</span>
          <div className="flex items-center space-x-1.5 text-gray-400">
            <Building2 className="w-3.5 h-3.5" />
            <span>{currentUser.department}</span>
          </div>
          <span className="text-gray-600 hidden sm:inline">•</span>
          <div className="flex items-center space-x-1.5 text-gray-400">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentUser.location}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] text-gray-400 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate max-w-md"><strong className="text-gray-200">Active Permissions:</strong> {getRolePermissions()}</span>
        </div>
      </div>
    </div>
  );
};
