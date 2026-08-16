import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { HoleSection, MaintenanceStatus } from '../types/drilling';
import { KpiPerformanceView } from './KpiPerformanceView';
import { InventoryStatusDonutChart } from './InventoryStatusDonutChart';
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Truck, 
  Layers, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  ArrowUpRight,
  BarChart3,
  LayoutDashboard
} from 'lucide-react';

interface DashboardOverviewProps {
  onNavigateTab: (tab: string) => void;
  onOpenAiAudit: () => void;
  onOpenAlerts: () => void;
}

const HOLE_SECTIONS: HoleSection[] = [
  '36" Conductor',
  '26" Surface Hole',
  '17-1/2" Intermediate',
  '12-1/4" Main Hole',
  '8-1/2" Reservoir',
  '6" Liner / Workover',
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateTab,
  onOpenAiAudit,
  onOpenAlerts,
}) => {
  const { items, transfers, alerts, setSelectedHoleSection, setSelectedStatus } = useDrilling();
  const [dashboardView, setDashboardView] = useState<'overview' | 'kpi'>('overview');

  const handleSelectStatusFilter = (status: MaintenanceStatus | 'ALL') => {
    setSelectedStatus(status);
    onNavigateTab('inventory');
  };

  const totalJoints = items.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  const totalLengthFt = items.reduce((acc, i) => acc + (i.lengthFt || 0), 0);

  const serviceableItems = items.filter(i => i.status === 'Serviceable (Field Ready)');
  const serviceableJoints = serviceableItems.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  const serviceablePercent = totalJoints > 0 ? Math.round((serviceableJoints / totalJoints) * 100) : 0;

  const surplusItems = items.filter(i => i.isSurplus);
  const longYardSurplus = items.filter(i => i.isSurplus && (i.monthsAtYard || 0) >= 6);

  // Hole Section Analysis
  const getSectionStats = (section: HoleSection) => {
    const secItems = items.filter(i => i.holeSection === section);
    const joints = secItems.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
    const readyJoints = secItems.filter(i => i.status === 'Serviceable (Field Ready)').reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
    const percentage = joints > 0 ? Math.round((readyJoints / joints) * 100) : 0;
    const hasOverdue = secItems.some(i => i.status === 'Inspection Overdue');
    return { count: secItems.length, joints, readyJoints, percentage, hasOverdue };
  };

  return (
    <div className="space-y-6">
      
      {/* Dashboard Mode Sub-Tab Switcher Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDashboardView('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              dashboardView === 'overview'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Campaign Operational Overview</span>
          </button>

          <button
            onClick={() => setDashboardView('kpi')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              dashboardView === 'kpi'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>KPI Inspection Turnaround Performance (D3 Charts)</span>
          </button>
        </div>

        <span className="text-[11px] text-gray-400 hidden sm:inline">
          {dashboardView === 'overview' ? 'Real-time campaign inventory readiness' : 'D3 turnaround time analytics & SLA thresholds'}
        </span>
      </div>

      {dashboardView === 'kpi' ? (
        <KpiPerformanceView />
      ) : (
        <div className="space-y-6">
          {/* Top Banner Alert if Overdue or Surplus Issues */}
          {(alerts.overdueCount > 0 || alerts.surplusAlertCount > 0) && (
            <div className="bg-gradient-to-br from-amber-500/20 via-[#141417] to-orange-600/10 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5 border border-amber-500/30">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-400">Campaign Inspection & Yard Surplus Action Required</h3>
                  <p className="text-xs text-gray-300 mt-0.5">
                    {alerts.overdueCount > 0 && <span className="text-rose-400 font-semibold">{alerts.overdueCount} items overdue for inspection. </span>}
                    {alerts.surplusAlertCount > 0 && <span className="text-amber-300 font-semibold">{alerts.surplusAlertCount} surplus backloaded items sitting &gt; 6 months at yard. </span>}
                    Recertification required prior to run-in-hole (RIH).
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={onOpenAlerts}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition shadow-md"
                >
                  Review Alerts
                </button>
                <button
                  onClick={() => onNavigateTab('surplus')}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/5 text-amber-400 border border-amber-500/30 hover:bg-white/10 transition"
                >
                  Surplus Manager
                </button>
              </div>
            </div>
          )}

          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Total Tally */}
            <div className="rounded-2xl border border-white/5 bg-[#141417] p-5 hover:border-white/10 transition">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-medium uppercase tracking-wider">Total Inventory</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-light text-white">{totalJoints} <span className="text-sm font-normal text-gray-500">Joints</span></p>
                <p className="text-xs text-gray-400 mt-1">{items.length} line items • {(totalLengthFt / 1000).toFixed(1)}k ft tally</p>
                <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

            {/* Serviceability Readiness */}
            <div className="rounded-2xl border border-white/5 bg-[#141417] p-5 hover:border-white/10 transition">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-medium uppercase tracking-wider">Field Serviceable</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-light text-emerald-400">{serviceablePercent}%</p>
                <p className="text-xs text-gray-400 mt-1">{serviceableJoints} joints certified</p>
                <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${serviceablePercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Inspection Overdue */}
            <div className="rounded-2xl border border-white/5 bg-[#141417] p-5 hover:border-white/10 transition">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-medium uppercase tracking-wider">Pending Inspection</span>
                <div className={`p-2 rounded-xl ${alerts.overdueCount > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-gray-400'}`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className={`text-3xl font-light ${alerts.overdueCount > 0 ? 'text-rose-400' : 'text-gray-300'}`}>
                  {alerts.overdueCount} <span className="text-xs font-normal text-rose-400/60">Urgent</span>
                </p>
                <p className="text-xs text-amber-400 mt-1">+{alerts.dueSoonCount} due in 30d</p>
                <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>

            {/* Yard Surplus / Backload */}
            <div className="rounded-2xl border border-white/5 bg-[#141417] p-5 hover:border-white/10 transition">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-medium uppercase tracking-wider">Surplus Units</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-light text-gray-300">{surplusItems.length} <span className="text-xs font-normal text-gray-500">Idle</span></p>
                <p className="text-xs text-gray-400 mt-1">{longYardSurplus.length} &gt; 6 months at yard</p>
                <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white/20" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>

            {/* Material Transfers */}
            <div className="rounded-2xl border border-white/5 bg-[#141417] p-5 hover:border-white/10 transition">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-medium uppercase tracking-wider">In Transit</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-light text-blue-400">{alerts.pendingTransferCount} <span className="text-xs font-normal text-blue-400/50">Active</span></p>
                <p className="text-xs text-gray-400 mt-1">{transfers.length} total manifests</p>
                <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>

          </div>

          {/* D3 Inventory Status Health Breakdown Donut Chart */}
          <InventoryStatusDonutChart 
            items={items} 
            onSelectStatusFilter={handleSelectStatusFilter} 
          />

          {/* Main Grid: Hole Section Readiness vs Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Hole Section Readiness Breakdown (2 Columns) */}
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#111114] p-6 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>Section Distribution & Readiness</span>
                  </h2>
                  <p className="text-xs text-gray-400">Status of casing strings & drilling tools categorized by section</p>
                </div>
                <button
                  onClick={() => onNavigateTab('hole-planner')}
                  className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center space-x-1"
                >
                  <span>Full Planner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HOLE_SECTIONS.map((sec) => {
                  const stats = getSectionStats(sec);
                  return (
                    <div 
                      key={sec}
                      onClick={() => {
                        setSelectedHoleSection(sec);
                        onNavigateTab('inventory');
                      }}
                      className="rounded-xl border border-white/5 bg-white/5 p-4 hover:border-amber-500/40 hover:bg-white/10 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-gray-200 group-hover:text-amber-400 flex items-center space-x-1.5">
                          <span>{sec}</span>
                          {stats.hasOverdue && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Has overdue inspection items"></span>
                          )}
                        </span>
                        <span className="text-[11px] font-mono text-gray-400 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/5">
                          {stats.joints} jts ({stats.count} items)
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400">Field Readiness</span>
                          <span className={`font-mono font-semibold ${stats.percentage >= 80 ? 'text-emerald-400' : stats.percentage >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {stats.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              stats.percentage >= 80 ? 'bg-emerald-400' : stats.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart Campaign Utilities & Quick Navigation (1 Column) */}
            <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 space-y-5">
              <div className="pb-2 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Campaign Navigation</span>
                </h2>
                <p className="text-xs text-gray-400">Direct tools for engineers & logistics</p>
              </div>

              <div className="space-y-3">
                
                {/* AI Campaign Readiness Audit */}
                <button
                  onClick={onOpenAiAudit}
                  className="w-full text-left p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-white/5 to-orange-500/10 border border-amber-500/30 hover:border-amber-400 transition flex items-center justify-between group"
                >
                  <div>
                    <p className="text-xs font-bold text-amber-400 group-hover:text-amber-300 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>AI Campaign Readiness Audit</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Evaluate campaign completeness & cert compliance</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* KPI Performance Analytics Direct Button */}
                <button
                  onClick={() => setDashboardView('kpi')}
                  className="w-full text-left p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400 transition flex items-center justify-between group"
                >
                  <div>
                    <p className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center space-x-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>KPI Inspection Turnaround (D3)</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">D3 bar charts for inspection SLA duration</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Material Transfer Manifests */}
                <button
                  onClick={() => onNavigateTab('transfers')}
                  className="w-full text-left p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-between group"
                >
                  <div>
                    <p className="text-xs font-semibold text-gray-200 group-hover:text-white flex items-center space-x-1.5">
                      <Truck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Material Transfer Tickets (MTT)</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Shipment dispatch & dual receiver verification</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Surplus & Backload Yard Manager */}
                <button
                  onClick={() => onNavigateTab('surplus')}
                  className="w-full text-left p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-between group"
                >
                  <div>
                    <p className="text-xs font-semibold text-gray-200 group-hover:text-white flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Surplus & Yard Manager</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Manage backload items sitting &gt; 6 months</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
