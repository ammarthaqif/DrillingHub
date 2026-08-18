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
import { DrillingEngineerHub } from './components/DrillingEngineerHub';
import { MaterialsManagementHub } from './components/MaterialsManagementHub';
import { SupplyBaseHub } from './components/SupplyBaseHub';
import { RigSiteHub } from './components/RigSiteHub';
import { CheckAndBalanceHub } from './components/CheckAndBalanceHub';
import { CostControllerHub } from './components/CostControllerHub';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { OnlineActiveUsersModal } from './components/OnlineActiveUsersModal';
import { AuthGate } from './components/AuthGate';
import { ConcurrentLoginPromptModal } from './components/ConcurrentLoginPromptModal';
import { CampaignManagerModal } from './components/CampaignManagerModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { NavigationBar, NavTabKey } from './components/NavigationBar';
import { OfflineStatusIndicator } from './components/OfflineStatusIndicator';
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
  Search,
  Calculator,
  Building2,
  Anchor,
  Scale,
  Package,
  Receipt
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { 
    currentUser,
    items, 
    transfers, 
    allUsers,
    chargeCodes,
    isAuthenticated,
    isOffline,
    setIsOffline,
    offlineQueue,
    processSyncQueue,
    hasModuleAccess,
    updateUserCurrentModule
  } = useDrilling();

  const userRole = currentUser?.role || 'Drilling Engineer';

  const [activeNav, setActiveNav] = useState<NavTabKey>('dashboard');

  const pendingApprovalsCount = allUsers.filter(u => u.status === 'Pending Email Verification' || u.status === 'Pending Admin Approval').length;

  // Sync current active module for real-time presence tracking
  React.useEffect(() => {
    const moduleMap: Record<NavTabKey, string> = {
      dashboard: 'Dashboard Overview',
      materialsManagement: 'Materials & Equipment Hub',
      inventory: 'OCTG Tubular Inventory',
      drillingEngineer: 'Casing Design & Hole Section Planner',
      supplyBaseMatco: 'Supply Base Dispatch Bay',
      rigSiteMatco: 'Rig Site Backload & Callout Hub',
      checkAndBalance: 'Cross-Department Verification Hub',
      costController: 'Well AFE Budgets & Cost Allocation',
      holeSection: 'Casing & Hole Section Program',
      surplus: 'Surplus & Backload Disposition Manager',
      movement: 'Cross-Site Material Movement Tracker',
      audit: 'Compliance & Tally Audit Reports',
      admin: 'System Administrator Console'
    };
    const mod = moduleMap[activeNav] || 'Operational Workspace';
    updateUserCurrentModule(mod);
  }, [activeNav, updateUserCurrentModule]);

  // Automatically adjust active tab if current role is restricted from activeNav
  React.useEffect(() => {
    if (!hasModuleAccess(userRole, activeNav)) {
      setActiveNav('dashboard');
    }
  }, [userRole, activeNav, hasModuleAccess]);

  // Modal / Drawer States
  const [selectedItemForDrawer, setSelectedItemForDrawer] = useState<TubularItem | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<TubularItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferModalItemIds, setTransferModalItemIds] = useState<string[]>([]);

  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isAiAuditModalOpen, setIsAiAuditModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isOnlineUsersModalOpen, setIsOnlineUsersModalOpen] = useState(false);

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  const handleOpenTransferModalWithItems = (itemIds: string[]) => {
    setTransferModalItemIds(itemIds);
    setIsTransferModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-gray-200 flex flex-col font-sans antialiased">
      
      {/* Persistent Offline Mode & Sync Status Indicator */}
      <OfflineStatusIndicator />

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
        onOpenCampaignModal={() => setIsCampaignModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenNotificationCenter={() => setIsNotificationModalOpen(true)}
        onOpenOnlineUsersModal={() => setIsOnlineUsersModalOpen(true)}
        onSelectItemForDrawer={(item) => setSelectedItemForDrawer(item)}
        onNavigateTab={(tab) => setActiveNav(tab)}
      />

      {/* Role Banner & Department Badge */}
      <RoleBanner />

      {/* Navigation Sub-Header */}
      <NavigationBar
        activeNav={activeNav}
        onSelectNav={(key) => setActiveNav(key)}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Screen Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {activeNav === 'dashboard' && (
          <DashboardOverview
            onNavigateTab={(tab) => setActiveNav(tab as any)}
            onOpenAiAudit={() => setIsAiAuditModalOpen(true)}
            onOpenAlerts={() => setIsAlertsModalOpen(true)}
            onSelectItem={(item) => setSelectedItemForDrawer(item)}
          />
        )}

        {activeNav === 'materialsManagement' && (
          <MaterialsManagementHub
            onSelectItem={(item) => setSelectedItemForDrawer(item)}
            onOpenAddItem={() => {
              setSelectedItemForEdit(null);
              setIsAddModalOpen(true);
            }}
            onOpenEditItem={(item) => {
              setSelectedItemForEdit(item);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeNav === 'inventory' && (
          <InventoryTable
            onSelectItem={(item) => setSelectedItemForDrawer(item)}
            onOpenTransferModalWithItems={handleOpenTransferModalWithItems}
          />
        )}

        {activeNav === 'drillingEngineer' && (
          <DrillingEngineerHub />
        )}

        {activeNav === 'supplyBaseMatco' && (
          <SupplyBaseHub />
        )}

        {activeNav === 'rigSiteMatco' && (
          <RigSiteHub />
        )}

        {activeNav === 'checkAndBalance' && (
          <CheckAndBalanceHub />
        )}

        {activeNav === 'costController' && (
          <CostControllerHub 
            onSelectItem={(item) => setSelectedItemForDrawer(item)}
            onNavigateTab={(tab) => setActiveNav(tab as any)}
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

      <CampaignManagerModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
      />

      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onNavigateTab={(tab) => setActiveNav(tab as any)}
      />

      <OnlineActiveUsersModal
        isOpen={isOnlineUsersModalOpen}
        onClose={() => setIsOnlineUsersModalOpen(false)}
        onNavigateTab={(tab) => setActiveNav(tab as any)}
      />

      <ConcurrentLoginPromptModal />

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
