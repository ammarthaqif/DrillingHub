import React from 'react';
import { useDrilling } from '../context/DrillingContext';
import { UserRole } from '../types/drilling';
import { 
  ShieldAlert, 
  ShieldCheck,
  QrCode, 
  Wifi, 
  WifiOff, 
  Plus, 
  UserCheck, 
  Briefcase, 
  RefreshCw,
  HardHat,
  Sparkles,
  FileSpreadsheet,
  LogOut,
  Lock
} from 'lucide-react';

interface HeaderProps {
  onOpenAddItem: () => void;
  onOpenTransferModal?: () => void;
  onOpenScannerModal?: () => void;
  onOpenAlertsModal?: () => void;
  onOpenAiAuditModal?: () => void;
  onOpenAuditReports?: () => void;
  onOpenAdminPanel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddItem,
  onOpenTransferModal,
  onOpenScannerModal,
  onOpenAlertsModal,
  onOpenAiAuditModal,
  onOpenAuditReports,
  onOpenAdminPanel,
}) => {
  const { 
    currentUser, 
    allUsers, 
    setCurrentUserRole, 
    logoutUser,
    alerts, 
    isOffline, 
    setIsOffline, 
    offlineQueue, 
    processSyncQueue,
    hasModuleAccess
  } = useDrilling();

  const userRole = currentUser?.role || 'Drilling Engineer';
  const canAccessAdmin = hasModuleAccess(userRole, 'admin');
  const canAccessAudit = hasModuleAccess(userRole, 'audit');

  const pendingApprovalsCount = allUsers.filter(u => u.status === 'Pending Email Verification' || u.status === 'Pending Admin Approval').length;

  return (
    <header className="bg-[#0e0e11] border-b border-white/10 text-white sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Campaign Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-black font-bold shadow-md shadow-amber-500/20">
              <span className="font-bold text-base text-black">D</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">DRILL<span className="text-amber-500">CORE</span><span className="font-light text-gray-500 text-sm ml-0.5">OS</span></span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  Alpha-Exp-2024
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">Tubular, Accessory & Tool Campaign Inventory Engine</p>
            </div>
          </div>

          {/* Quick Actions & Role Selector */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* AI Campaign Auditor */}
            <button
              onClick={onOpenAiAuditModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/20 border border-amber-500/30 transition-all shadow-sm"
              title="AI Campaign Readiness & Cert Assistant"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="hidden md:inline">AI Auditor</span>
            </button>

            {/* Admin Panel Quick Access */}
            {onOpenAdminPanel && canAccessAdmin && (
              <button
                onClick={onOpenAdminPanel}
                className="relative flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10 transition"
                title="System Admin & User Access Control"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline">Admin</span>
                {pendingApprovalsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            )}

            {/* Audit Reports */}
            {onOpenAuditReports && canAccessAudit && (
              <button
                onClick={onOpenAuditReports}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10 transition"
                title="Audit-Ready Tally & Compliance Reports"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="hidden lg:inline">Audit Reports</span>
              </button>
            )}

            {/* Alerts Button */}
            <button
              onClick={onOpenAlertsModal}
              className={`relative flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition border ${
                alerts.overdueCount > 0 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30' 
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${alerts.overdueCount > 0 ? 'text-rose-400 animate-bounce' : 'text-amber-400'}`} />
              <span className="hidden sm:inline">Alerts</span>
              {(alerts.overdueCount > 0 || alerts.dueSoonCount > 0) && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {alerts.overdueCount + alerts.dueSoonCount}
                </span>
              )}
            </button>

            {/* Scanner Button */}
            <button
              onClick={onOpenScannerModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10 transition"
              title="Scan Tag / QR Code"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Scanner</span>
            </button>

            {/* Role Selector Dropdown */}
            <div className="relative group">
              <div className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:border-amber-500/50 px-3 py-1.5 rounded-xl cursor-pointer transition">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <div className="text-left text-[11px]">
                  <p className="font-semibold text-white leading-none truncate max-w-[110px]">{currentUser.name}</p>
                  <p className="text-[10px] text-amber-400 leading-tight truncate max-w-[110px]">{currentUser.role}</p>
                </div>
              </div>

              {/* Hover/Focus Role Menu */}
              <div className="absolute right-0 mt-2 w-64 bg-[#141417] border border-white/10 rounded-2xl shadow-2xl py-2 hidden group-hover:block z-50">
                <div className="px-4 py-2 border-b border-white/5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Switch Department Role</p>
                  <p className="text-[10px] text-gray-500">Test role-based access control (RBAC)</p>
                </div>
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setCurrentUserRole(u.role)}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-white/5 transition ${
                      currentUser.role === u.role ? 'bg-amber-500/10 text-amber-400 font-bold border-l-2 border-amber-400' : 'text-gray-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-[10px] text-gray-400">{u.role}</p>
                    </div>
                    {currentUser.role === u.role && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Active</span>
                    )}
                  </button>
                ))}
                <div className="mt-2 pt-2 border-t border-white/10 px-2">
                  <button
                    onClick={() => logoutUser()}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Lock Session / Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Lock Session Button */}
            <button
              onClick={() => logoutUser()}
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 transition"
              title="Lock Session / Exit Workspace"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xl:inline">Lock</span>
            </button>

            {/* Add Item Button */}
            <button
              onClick={onOpenAddItem}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Item</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};

