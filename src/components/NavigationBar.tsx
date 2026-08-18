import React, { useState, useRef, useEffect } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { 
  LayoutDashboard, 
  Layers, 
  Clock, 
  Truck, 
  FileCheck, 
  HardHat, 
  Sparkles,
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Calculator,
  Building2,
  Anchor,
  Package,
  Receipt,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Grid,
  List,
  Check,
  X,
  SlidersHorizontal
} from 'lucide-react';

export type NavTabKey = 
  | 'dashboard' 
  | 'materialsManagement' 
  | 'inventory' 
  | 'drillingEngineer' 
  | 'supplyBaseMatco' 
  | 'rigSiteMatco' 
  | 'checkAndBalance' 
  | 'costController' 
  | 'holeSection' 
  | 'surplus' 
  | 'movement' 
  | 'audit' 
  | 'admin';

export interface NavTabItem {
  key: NavTabKey;
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
  badge?: number;
  category: 'Overview & Stock' | 'Engineering & Planning' | 'Field & Logistics' | 'Finance & Controls' | 'Governance & Admin';
  description: string;
}

interface NavigationBarProps {
  activeNav: NavTabKey;
  onSelectNav: (key: NavTabKey) => void;
  pendingApprovalsCount: number;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeNav,
  onSelectNav,
  pendingApprovalsCount,
}) => {
  const { 
    currentUser,
    items, 
    transfers, 
    chargeCodes,
    isOffline, 
    setIsOffline, 
    offlineQueue, 
    processSyncQueue,
    hasModuleAccess 
  } = useDrilling();

  const userRole = currentUser?.role || 'Drilling Engineer';

  // Navigation tabs definition
  const allNavTabs: NavTabItem[] = [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      shortLabel: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-amber-400" />, 
      category: 'Overview & Stock',
      description: 'Executive KPIs, readiness charts & operational metrics'
    },
    { 
      key: 'materialsManagement', 
      label: 'Materials Management', 
      shortLabel: 'Materials Hub',
      icon: <Package className="w-4 h-4 text-emerald-400" />, 
      badge: items.length,
      category: 'Overview & Stock',
      description: 'Comprehensive OCTG inventory master & batch operations'
    },
    { 
      key: 'inventory', 
      label: 'Tubulars & Tools', 
      shortLabel: 'Tubulars',
      icon: <HardHat className="w-4 h-4 text-blue-400" />, 
      category: 'Overview & Stock',
      description: 'Detailed tubular specifications, inspection logs & QR tracking'
    },
    { 
      key: 'drillingEngineer', 
      label: 'Drilling Engineer Hub', 
      shortLabel: 'Drilling Eng',
      icon: <Calculator className="w-4 h-4 text-amber-400" />, 
      category: 'Engineering & Planning',
      description: 'Casing design calculator, surplus booking & MSRF orders'
    },
    { 
      key: 'holeSection', 
      label: 'Hole Section Planner', 
      shortLabel: 'Hole Sections',
      icon: <Layers className="w-4 h-4 text-cyan-400" />, 
      category: 'Engineering & Planning',
      description: 'Section-by-section tubular allocation & tally verification'
    },
    { 
      key: 'checkAndBalance', 
      label: 'Check & Balance Matrix', 
      shortLabel: 'Check & Balance',
      icon: <ShieldCheck className="w-4 h-4 text-purple-400" />, 
      category: 'Engineering & Planning',
      description: 'Three-way reconciliation between Rig, Base, and Suppliers'
    },
    { 
      key: 'supplyBaseMatco', 
      label: 'Supply Base Matco', 
      shortLabel: 'Supply Base',
      icon: <Building2 className="w-4 h-4 text-emerald-400" />, 
      category: 'Field & Logistics',
      description: 'Yard bay inventory, vessel loadouts & backload routing'
    },
    { 
      key: 'rigSiteMatco', 
      label: 'Rig Site Matco', 
      shortLabel: 'Rig Site',
      icon: <Anchor className="w-4 h-4 text-cyan-400" />, 
      category: 'Field & Logistics',
      description: 'Rig rack tally, running logs & backload manifest creator'
    },
    { 
      key: 'movement', 
      label: 'Material Transfers', 
      shortLabel: 'Transfers',
      icon: <Truck className="w-4 h-4 text-emerald-400" />, 
      badge: transfers.length,
      category: 'Field & Logistics',
      description: 'Digital transfer tickets, vessel manifests & chain of custody'
    },
    { 
      key: 'costController', 
      label: 'Cost Controller Hub', 
      shortLabel: 'Cost Controller',
      icon: <Receipt className="w-4 h-4 text-emerald-400" />, 
      badge: chargeCodes?.length,
      category: 'Finance & Controls',
      description: 'AFE budget tracking, surplus booking approvals & PO linkage'
    },
    { 
      key: 'surplus', 
      label: 'Surplus & Backloads', 
      shortLabel: 'Surplus/Backload',
      icon: <Clock className="w-4 h-4 text-amber-400" />, 
      category: 'Finance & Controls',
      description: 'Aging yard stock, recertification rules & reuse optimization'
    },
    { 
      key: 'audit', 
      label: 'Audit Reports', 
      shortLabel: 'Audit Reports',
      icon: <FileCheck className="w-4 h-4 text-purple-400" />, 
      category: 'Governance & Admin',
      description: 'Audit-ready compliance tally, exportable certificates & logs'
    },
    { 
      key: 'admin', 
      label: 'Admin & Access Control', 
      shortLabel: 'Admin & RBAC',
      icon: <ShieldCheck className="w-4 h-4 text-amber-400" />, 
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      category: 'Governance & Admin',
      description: 'User roles, email verification, dropdown options & audit trail'
    },
  ];

  // Filter allowed tabs based on role permissions
  const allowedNavTabs = allNavTabs.filter(tab => hasModuleAccess(userRole, tab.key));

  // State for Desktop View Mode: 'ribbon' (scrollable with arrow controls) or 'wrapped' (multi-row grid on desktop)
  const [layoutMode, setLayoutMode] = useState<'ribbon' | 'wrapped'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('drillcore_nav_layout') as 'ribbon' | 'wrapped') || 'ribbon';
    }
    return 'ribbon';
  });

  // State for "All Modules" Dropdown Modal
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');

  // Scroll container ref & scroll position detection
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Check scroll boundary
  const checkScrollBoundary = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    checkScrollBoundary();
    const handleResize = () => checkScrollBoundary();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [allowedNavTabs, layoutMode]);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (layoutMode === 'ribbon' && scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector(`[data-tab-key="${activeNav}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
    }
  }, [activeNav, layoutMode]);

  // Handle scroll buttons
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  // Support Mouse Wheel horizontal scrolling on desktop
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (layoutMode !== 'ribbon') return;
    if (scrollContainerRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
        checkScrollBoundary();
      }
    }
  };

  // Mouse Drag to Scroll
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (layoutMode !== 'ribbon') return;
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftState(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk;
    checkScrollBoundary();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    checkScrollBoundary();
  };

  // Toggle layout mode
  const toggleLayoutMode = () => {
    const next = layoutMode === 'ribbon' ? 'wrapped' : 'ribbon';
    setLayoutMode(next);
    try {
      localStorage.setItem('drillcore_nav_layout', next);
    } catch (e) {
      console.error(e);
    }
  };

  // Group tabs by category for the Quick Jump Modal
  const categories = ['Overview & Stock', 'Engineering & Planning', 'Field & Logistics', 'Finance & Controls', 'Governance & Admin'] as const;

  const filteredModalTabs = allowedNavTabs.filter(tab => {
    if (!moduleSearchQuery.trim()) return true;
    const q = moduleSearchQuery.toLowerCase();
    return tab.label.toLowerCase().includes(q) || tab.description.toLowerCase().includes(q) || tab.category.toLowerCase().includes(q);
  });

  return (
    <nav className="bg-[#0e0e11] border-b border-white/10 sticky top-16 z-30 backdrop-blur-md px-3 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1920px] mx-auto py-2">
        
        {/* TOP BAR: Main Navigation Strip */}
        <div className="flex items-center justify-between gap-2">

          {/* Left Arrow Scroll Button (Desktop Ribbon Mode) */}
          {layoutMode === 'ribbon' && (
            <button
              onClick={handleScrollLeft}
              disabled={!canScrollLeft}
              className={`hidden md:flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition ${
                canScrollLeft
                  ? 'bg-white/10 hover:bg-amber-500 hover:text-black text-white cursor-pointer shadow-sm active:scale-95'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed opacity-40'
              }`}
              title="Scroll Tabs Left"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Tab Strip Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollBoundary}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex-1 transition-all ${
              layoutMode === 'wrapped'
                ? 'flex flex-wrap gap-1.5 py-1'
                : 'flex items-center space-x-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-amber-500/40 scrollbar-track-transparent py-1 select-none'
            }`}
          >
            {allowedNavTabs.map((tab) => {
              const isActive = activeNav === tab.key;
              return (
                <button
                  key={tab.key}
                  data-tab-key={tab.key}
                  onClick={() => onSelectNav(tab.key)}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 sm:space-x-2 shrink-0 whitespace-nowrap shadow-sm ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-amber-500/20 font-bold scale-[1.02]'
                      : 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5'
                  }`}
                  title={`${tab.label} — ${tab.description}`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                      isActive ? 'bg-black/25 text-black' : 'bg-white/10 text-gray-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Arrow Scroll Button (Desktop Ribbon Mode) */}
          {layoutMode === 'ribbon' && (
            <button
              onClick={handleScrollRight}
              disabled={!canScrollRight}
              className={`hidden md:flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition ${
                canScrollRight
                  ? 'bg-white/10 hover:bg-amber-500 hover:text-black text-white cursor-pointer shadow-sm active:scale-95'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed opacity-40'
              }`}
              title="Scroll Tabs Right"
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Controls Right Section: Layout Mode Switcher, Quick Jump Menu & Offline Status */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 pl-1 border-l border-white/10">
            
            {/* Quick All Modules Matrix Button */}
            <button
              onClick={() => setIsGridModalOpen(true)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition ${
                isGridModalOpen 
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md' 
                  : 'bg-white/5 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title="View all 13 modules categorized in a quick-jump matrix"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">All Tabs ({allowedNavTabs.length})</span>
            </button>

            {/* Toggle 2-Row Wrapped vs Scrollable Ribbon Mode on Desktop */}
            <button
              onClick={toggleLayoutMode}
              className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition"
              title={layoutMode === 'ribbon' ? 'Switch to Multi-Row Grid View (See all tabs)' : 'Switch to Single-Row Ribbon View'}
            >
              {layoutMode === 'ribbon' ? (
                <>
                  <Grid className="w-3.5 h-3.5 text-gray-400" />
                  <span className="hidden xl:inline text-[11px]">Wrap</span>
                </>
              ) : (
                <>
                  <List className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xl:inline text-[11px]">Ribbon</span>
                </>
              )}
            </button>

            {/* Offline Sync Controls */}
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 border transition ${
                isOffline ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
              }`}
              title="Toggle Mobile Offline Mode"
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">{isOffline ? 'Offline' : 'Online'}</span>
            </button>

            {offlineQueue.length > 0 && (
              <button
                onClick={processSyncQueue}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition flex items-center space-x-1.5 animate-pulse"
                title="Sync offline queued operations"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync ({offlineQueue.length})</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* QUICK JUMP MODAL MATRIX: Allows 1-click viewing and jumping to any module on desktop & mobile */}
      {isGridModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#121216] border border-amber-500/40 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>DrillCore OS Module Directory</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-normal">
                      {allowedNavTabs.length} Modules Available
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400">Direct 1-click navigation across all operational disciplines</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsGridModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search modules by name, role, or workflow..."
                value={moduleSearchQuery}
                onChange={(e) => setModuleSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                autoFocus
              />
            </div>

            {/* Categorized Grid of All Modules */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {categories.map((category) => {
                const catTabs = filteredModalTabs.filter(t => t.category === category);
                if (catTabs.length === 0) return null;

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400/90 border-b border-white/5 pb-1">
                      <span>{category}</span>
                      <span className="text-[10px] text-gray-500 lowercase">({catTabs.length} tabs)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {catTabs.map((tab) => {
                        const isActive = activeNav === tab.key;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => {
                              onSelectNav(tab.key);
                              setIsGridModalOpen(false);
                            }}
                            className={`text-left p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between group ${
                              isActive
                                ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/50'
                                : 'bg-white/5 border-white/10 hover:border-amber-500/50 hover:bg-white/10 text-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-2.5">
                                <div className={`p-2 rounded-xl ${isActive ? 'bg-amber-500 text-black' : 'bg-black/40 text-gray-300 group-hover:text-amber-400'} transition`}>
                                  {tab.icon}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition">{tab.label}</h4>
                                  <span className="text-[10px] text-gray-400">{tab.category}</span>
                                </div>
                              </div>

                              {isActive ? (
                                <span className="p-1 rounded-full bg-amber-500 text-black">
                                  <Check className="w-3 h-3" />
                                </span>
                              ) : tab.badge !== undefined ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-gray-300">
                                  {tab.badge}
                                </span>
                              ) : null}
                            </div>

                            <p className="text-[11px] text-gray-400 mt-2.5 line-clamp-2 leading-relaxed">
                              {tab.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 shrink-0 text-xs text-gray-400">
              <div>
                Current Active Role: <strong className="text-amber-400">{userRole}</strong>
              </div>
              <button
                onClick={() => setIsGridModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 text-xs font-semibold transition"
              >
                Close Menu
              </button>
            </div>

          </div>
        </div>
      )}

    </nav>
  );
};
