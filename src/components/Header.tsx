import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { UserRole, TubularItem } from '../types/drilling';
import { NavTabKey } from './NavigationBar';
import { GlobalEquipmentSearch } from './GlobalEquipmentSearch';
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
  FolderKanban,
  Database,
  LogOut,
  Lock,
  Bell,
  Users,
  Search
} from 'lucide-react';

interface HeaderProps {
  onOpenAddItem: () => void;
  onOpenTransferModal?: () => void;
  onOpenScannerModal?: () => void;
  onOpenAlertsModal?: () => void;
  onOpenAiAuditModal?: () => void;
  onOpenAuditReports?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenCampaignModal?: () => void;
  onOpenBackupModal?: () => void;
  onOpenNotificationCenter?: () => void;
  onOpenOnlineUsersModal?: () => void;
  onSelectItemForDrawer?: (item: TubularItem) => void;
  onNavigateTab?: (tabKey: NavTabKey) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddItem,
  onOpenTransferModal,
  onOpenScannerModal,
  onOpenAlertsModal,
  onOpenAiAuditModal,
  onOpenAuditReports,
  onOpenAdminPanel,
  onOpenCampaignModal,
  onOpenBackupModal,
  onOpenNotificationCenter,
  onOpenOnlineUsersModal,
  onSelectItemForDrawer,
  onNavigateTab
}) => {
  const { 
    currentUser, 
    allUsers, 
    setCurrentUserRole, 
    logoutUser,
    alerts, 
    unreadNotificationCount,
    onlineUserCount,
    isOffline, 
    setIsOffline, 
    offlineQueue, 
    processSyncQueue,
    hasModuleAccess,
    campaigns,
    activeCampaignId
  } = useDrilling();

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const userRole = currentUser?.role || 'Drilling Engineer';
  const canAccessAdmin = hasModuleAccess(userRole, 'admin');
  const canAccessAudit = hasModuleAccess(userRole, 'audit');

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
  const pendingApprovalsCount = allUsers.filter(u => u.status === 'Pending Email Verification' || u.status === 'Pending Admin Approval').length;

  return (
    <header className="bg-[#0e0e11] border-b border-white/10 text-white sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo & Campaign Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-black font-bold shadow-md shadow-amber-500/20">
              <span className="font-bold text-base text-black">D</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">DRILL<span className="text-amber-500">CORE</span><span className="font-light text-gray-500 text-sm ml-0.5">OS</span></span>
                {onOpenCampaignModal && (
                  <button
                    onClick={onOpenCampaignModal}
                    className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition hidden sm:flex items-center gap-1"
                    title="Click to Manage Campaigns & Projects"
                  >
                    <FolderKanban className="w-3 h-3 text-amber-400" />
                    <span className="truncate max-w-[90px]">{activeCampaign ? activeCampaign.code : 'All Campaigns'}</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-400 hidden xl:block">Tubular, Accessory & Tool Campaign Engine</p>
            </div>
          </div>

          {/* Central Global Equipment Search Bar */}
          <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg hidden md:block">
            <GlobalEquipmentSearch 
              onSelectItemForDrawer={onSelectItemForDrawer}
              onNavigateTab={onNavigateTab}
            />
          </div>

          {/* Quick Actions & Role Selector */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Mobile Search Button Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(prev => !prev)}
              className="md:hidden p-2 text-amber-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition"
              title="Search Equipment"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Campaign Manager Trigger */}
            {onOpenCampaignModal && (
              <button
                onClick={onOpenCampaignModal}
                className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 transition shadow-sm"
                title="Manage Drilling Campaigns, Rigs & Supply Bases"
              >
                <FolderKanban className="w-4 h-4 text-amber-400" />
                <span>Campaign Hub</span>
              </button>
            )}

            {/* Backup & Vault Recovery Trigger */}
            {onOpenBackupModal && (
              <button
                onClick={onOpenBackupModal}
                className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition shadow-sm"
                title="Perform Daily/Weekly Backup & Database Restore"
              >
                <Database className="w-4 h-4 text-blue-400" />
                <span>Vault</span>
              </button>
            )}

            {/* Live Online Active Personnel Indicator */}
            {onOpenOnlineUsersModal && (
              <button
                onClick={onOpenOnlineUsersModal}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition shadow-sm group"
                title="View Real-Time Online Active Users & Rig Presence"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">{onlineUserCount}</span>
                <span className="hidden sm:inline text-emerald-300/90 font-normal">Active</span>
              </button>
            )}

            {/* AI Campaign Auditor */}
            <button
              onClick={onOpenAiAuditModal}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/20 border border-amber-500/30 transition-all shadow-sm"
              title="AI Campaign Readiness & Cert Assistant"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="hidden md:inline">AI Auditor</span>
            </button>

            {/* Admin Panel Quick Access */}
            {onOpenAdminPanel && canAccessAdmin && (
              <button
                onClick={onOpenAdminPanel}
                className="relative flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10 transition"
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
                className="hidden lg:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10 transition"
                title="Audit-Ready Tally & Compliance Reports"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="hidden xl:inline">Reports</span>
              </button>
            )}

            {/* Notification Center Bell */}
            {onOpenNotificationCenter && (
              <button
                onClick={onOpenNotificationCenter}
                className={`relative flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl transition border ${
                  unreadNotificationCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                }`}
                title="System Notifications & Alerts"
              >
                <Bell className={`w-4 h-4 ${unreadNotificationCount > 0 ? 'text-amber-400' : 'text-gray-400'}`} />
                <span className="hidden sm:inline">Notices</span>
                {unreadNotificationCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Alerts Button */}
            <button
              onClick={onOpenAlertsModal}
              className={`relative flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl transition border ${
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
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10 transition"
              title="Scan Tag / QR Code"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Scanner</span>
            </button>

            {/* Role Selector Dropdown */}
            <div className="relative group">
              <div className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:border-amber-500/50 px-2.5 sm:px-3 py-1.5 rounded-xl cursor-pointer transition">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <div className="text-left text-[11px] hidden md:block">
                  <p className="font-semibold text-white leading-none truncate max-w-[90px]">{currentUser.name}</p>
                  <p className="text-[10px] text-amber-400 leading-tight truncate max-w-[90px]">{currentUser.role}</p>
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

            {/* Add Item Button */}
            <button
              onClick={onOpenAddItem}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Item</span>
            </button>

          </div>
        </div>

        {/* Mobile Expanded Global Search Panel */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-white/10 animate-in fade-in duration-150">
            <GlobalEquipmentSearch
              onSelectItemForDrawer={onSelectItemForDrawer}
              onNavigateTab={onNavigateTab}
              isMobileExpanded={true}
              onCloseMobile={() => setIsMobileSearchOpen(false)}
            />
          </div>
        )}
      </div>
    </header>
  );
};
