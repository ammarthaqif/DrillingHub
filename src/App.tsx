import React, { useState } from 'react';
import { DrillingProvider, useDrilling } from './context/DrillingContext';
import { Header } from './components/Header';
import { RoleBanner } from './components/RoleBanner';
import { DashboardOverview } from './components/DashboardOverview';
import { InventoryTable } from './components/InventoryTable';
import { InventoryModal } from './components/InventoryModal';
import { ItemDetailDrawer } from './components/ItemDetailDrawer';
import { HoleSectionPlanner } from './components/HoleSectionPlanner';
import { SurplusAndBackloadManager } from './components/SurplusAndBackloadManager';
import { MaterialMovementTracker } from './components/MaterialMovementTracker';
import { CreateTransferModal } from './components/CreateTransferModal';
import { InspectionAlertsModal } from './components/InspectionAlertsModal';
import { MobileScannerModal } from './components/MobileScannerModal';
import { AiAuditModal } from './components/AiAuditModal';
import { AuditReportView } from './components/AuditReportView';
import { AdminPanel } from './components/AdminPanel';
import { AuthGate } from './components/AuthGate';
import { TubularItem } from './types/drilling';
import { 
  LayoutDashboard, 
  Layers, 
  Clock, 
  Truck, 
  FileCheck, 
  HardHat, 
  QrCode, 
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Search
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { 
    items, 
    transfers, 
    allUsers,
    isAuthenticated,
    isOffline,
    setIsOffline,
    offlineQueue,
    processSyncQueue
  } = useDrilling();

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  const [activeNav, setActiveNav] = useState<'dashboard' | 'inventory' | 'holeSection' | 'surplus' | 'movement' | 'audit' | 'admin'>('dashboard');

  const pendingApprovalsCount = allUsers.filter(u => u.status === 'Pending Email Verification' || u.status === 'Pending Admin Approval').length;

  // Modal / Drawer States
  const [selectedItemForDrawer, setSelectedItemForDrawer] = useState<TubularItem | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<TubularItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferModalItemIds, setTransferModalItemIds] = useState<string[]>([]);

  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isAiAuditModalOpen, setIsAiAuditModalOpen] = useState(false);

  const handleOpenTransferModalWithItems = (itemIds: string[]) => {
    setTransferModalItemIds(itemIds);
    setIsTransferModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-gray-200 flex flex-col font-sans antialiased">
      
      {/* Header Bar */}
      <Header
        onOpenAddItem={() => {
          setSelectedItemForEdit(null);
          setIsAddModalOpen(true);
        }}
        onOpenTransferModal={() => {
          setTransferModalItemIds([]);
          setIsTransferModalOpen(true);
        }}
        onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
        onOpenAiAuditModal={() => setIsAiAuditModalOpen(true)}
        onOpenAuditReports={() => setActiveNav('audit')}
        onOpenAdminPanel={() => setActiveNav('admin')}
      />

      {/* Role Banner & Department Badge */}
      <RoleBanner />

      {/* Navigation Sub-Header */}
      <nav className="bg-[#0e0e11] border-b border-white/10 sticky top-16 z-30 backdrop-blur-md px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none py-2 gap-2">
          
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
                activeNav === 'dashboard'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveNav('inventory')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
                activeNav === 'inventory'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <HardHat className="w-4 h-4" />
              <span>Tubulars & Tools</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeNav === 'inventory' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'}`}>
                {items.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('holeSection')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
                activeNav === 'holeSection'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Hole Section Planner</span>
            </button>

            <button
              onClick={() => setActiveNav('surplus')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
                activeNav === 'surplus'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Surplus & Backloads</span>
            </button>

            <button
              onClick={() => setActiveNav('movement')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
                activeNav === 'movement'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Material Transfers</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeNav === 'movement' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'}`}>
                {transfers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('audit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
                activeNav === 'audit'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileCheck className="w-4 h-4 text-purple-400" />
              <span>Audit Reports</span>
            </button>

            <button
              onClick={() => setActiveNav('admin')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
                activeNav === 'admin'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin & Access Control</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-black animate-pulse">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </div>

          {/* Offline Sync Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 border transition ${
                isOffline ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
              }`}
              title="Toggle Mobile Offline Mode"
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">{isOffline ? 'Offline Mode' : 'Online'}</span>
            </button>

            {offlineQueue.length > 0 && (
              <button
                onClick={processSyncQueue}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition flex items-center space-x-1.5 animate-pulse"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync ({offlineQueue.length})</span>
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* Main Screen Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {activeNav === 'dashboard' && (
          <DashboardOverview
            onNavigateTab={(tab) => setActiveNav(tab as any)}
            onOpenAiAudit={() => setIsAiAuditModalOpen(true)}
            onOpenAlerts={() => setIsAlertsModalOpen(true)}
          />
        )}

        {activeNav === 'inventory' && (
          <InventoryTable
            onSelectItem={(item) => setSelectedItemForDrawer(item)}
            onOpenTransferModalWithItems={handleOpenTransferModalWithItems}
          />
        )}

        {activeNav === 'holeSection' && (
          <HoleSectionPlanner
            onSelectItem={(item) => setSelectedItemForDrawer(item)}
            onOpenAddItem={() => {
              setSelectedItemForEdit(null);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeNav === 'surplus' && (
          <SurplusAndBackloadManager
            onSelectItem={(item) => setSelectedItemForDrawer(item)}
          />
        )}

        {activeNav === 'movement' && (
          <MaterialMovementTracker
            onOpenCreateTransferModal={() => {
              setTransferModalItemIds([]);
              setIsTransferModalOpen(true);
            }}
          />
        )}

        {activeNav === 'audit' && (
          <AuditReportView />
        )}

        {activeNav === 'admin' && (
          <AdminPanel />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Drilling Campaign Tubular & Tool Inventory Management System v2.4</span>
          <span>Compliance: API Spec 5CT / DS-1 / API RP 7G • Multi-Department RBAC Enabled</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ItemDetailDrawer
        item={selectedItemForDrawer}
        onClose={() => setSelectedItemForDrawer(null)}
        onEdit={(item) => {
          setSelectedItemForEdit(item);
          setIsAddModalOpen(true);
        }}
      />

      <InventoryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedItemForEdit(null);
        }}
        editItem={selectedItemForEdit}
      />

      <CreateTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferModalItemIds([]);
        }}
        initialSelectedItemIds={transferModalItemIds}
      />

      <InspectionAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        onSelectItem={(item) => setSelectedItemForDrawer(item)}
      />

      <MobileScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onSelectItem={(item) => setSelectedItemForDrawer(item)}
      />

      <AiAuditModal
        isOpen={isAiAuditModalOpen}
        onClose={() => setIsAiAuditModalOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <DrillingProvider>
      <MainAppContent />
    </DrillingProvider>
  );
}
