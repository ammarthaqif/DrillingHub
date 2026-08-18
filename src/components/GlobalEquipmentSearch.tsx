import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { TubularItem, LocationType, MaintenanceStatus } from '../types/drilling';
import { NavTabKey } from './NavigationBar';
import { 
  Search, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers, 
  MapPin, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Truck, 
  ChevronRight,
  Filter,
  FileText,
  CornerDownLeft,
  Command,
  SlidersHorizontal,
  HardHat,
  Hash,
  Tag,
  Flame,
  ArrowRight
} from 'lucide-react';

interface GlobalEquipmentSearchProps {
  onSelectItemForDrawer?: (item: TubularItem) => void;
  onNavigateTab?: (tabKey: NavTabKey) => void;
  className?: string;
  isMobileExpanded?: boolean;
  onCloseMobile?: () => void;
}

export const GlobalEquipmentSearch: React.FC<GlobalEquipmentSearchProps> = ({
  onSelectItemForDrawer,
  onNavigateTab,
  className = '',
  isMobileExpanded = false,
  onCloseMobile
}) => {
  const { 
    items, 
    searchQuery: globalSearchQuery, 
    setSearchQuery: setGlobalSearchQuery,
    rigBackloads,
    transfers
  } = useDrilling();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('ALL');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K / '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in another input or textarea
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time filtering logic
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    
    let filtered = items;

    // Apply category filter if selected
    if (selectedCategoryFilter !== 'ALL') {
      filtered = filtered.filter(item => item.category === selectedCategoryFilter);
    }

    // Apply location filter if selected
    if (selectedLocationFilter !== 'ALL') {
      filtered = filtered.filter(item => item.currentLocation === selectedLocationFilter);
    }

    if (!q) {
      // Return first 8 items as quick reference when focused without search
      return filtered.slice(0, 8);
    }

    // Score and rank matching items
    return filtered
      .map(item => {
        let score = 0;
        const serial = (item.serialNumber || '').toLowerCase();
        const tag = (item.tagNumber || '').toLowerCase();
        const name = (item.name || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const grade = (item.grade || '').toLowerCase();
        const conn = (item.connectionType || '').toLowerCase();
        const heat = (item.heatNumber || '').toLowerCase();
        const hole = (item.holeSection || '').toLowerCase();
        const loc = (item.currentLocation || '').toLowerCase();
        const rack = (item.rackLocation || '').toLowerCase();
        const po = (item.poNumber || '').toLowerCase();
        const well = (item.wellName || '').toLowerCase();
        const camp = (item.campaignName || '').toLowerCase();

        // Exact match scoring
        if (serial === q) score += 100;
        else if (serial.startsWith(q)) score += 80;
        else if (serial.includes(q)) score += 50;

        if (tag === q) score += 90;
        else if (tag.startsWith(q)) score += 70;
        else if (tag.includes(q)) score += 45;

        if (name.includes(q)) score += 40;
        if (cat.includes(q)) score += 30;
        if (grade.includes(q)) score += 25;
        if (conn.includes(q)) score += 25;
        if (heat.includes(q)) score += 20;
        if (hole.includes(q)) score += 20;
        if (loc.includes(q) || rack.includes(q)) score += 15;
        if (po.includes(q) || well.includes(q) || camp.includes(q)) score += 15;

        return { item, score };
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item);
  }, [items, query, selectedCategoryFilter, selectedLocationFilter]);

  // Reset selected index when results or query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategoryFilter, selectedLocationFilter]);

  // Keyboard navigation within the dropdown list
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleSelectItem(searchResults[selectedIndex]);
      } else if (query.trim()) {
        handleViewAllInInventory();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
      if (onCloseMobile) onCloseMobile();
    }
  };

  const handleSelectItem = (item: TubularItem) => {
    if (onSelectItemForDrawer) {
      onSelectItemForDrawer(item);
    }
    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  const handleViewAllInInventory = () => {
    setGlobalSearchQuery(query.trim());
    if (onNavigateTab) {
      onNavigateTab('inventory');
    }
    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  const handleCopySerial = (e: React.MouseEvent, serial: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(serial);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  };

  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <span key={i} className="bg-amber-500/30 text-amber-300 font-semibold px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'Serviceable (Field Ready)':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Ready</span>;
      case 'Due for Inspection':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Inspection Due</span>;
      case 'Inspection Overdue':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-red-500/20 text-red-300 border border-red-500/30">Overdue</span>;
      case 'Quarantined / Damaged':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-950 text-rose-300 border border-rose-800">Quarantined</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">{status}</span>;
    }
  };

  const getLocationBadge = (location: LocationType) => {
    let color = 'bg-slate-800/80 text-slate-300 border-slate-700';
    if (location.includes('Rig')) color = 'bg-amber-950/60 text-amber-300 border-amber-800/50';
    else if (location.includes('Supply Base')) color = 'bg-blue-950/60 text-blue-300 border-blue-800/50';
    else if (location.includes('Transit')) color = 'bg-purple-950/60 text-purple-300 border-purple-800/50';
    else if (location.includes('Machine Shop')) color = 'bg-teal-950/60 text-teal-300 border-teal-800/50';

    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border ${color}`}>
        <MapPin className="w-2.5 h-2.5 opacity-80" />
        <span className="truncate max-w-[130px]">{location}</span>
      </span>
    );
  };

  // Unique categories for quick filter pills
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [items]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none flex items-center justify-center text-gray-400">
          <Search className="w-4 h-4 text-amber-400/90" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Global search equipment by serial #, description, tag..."
          className="w-full pl-9 pr-16 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/5 hover:bg-white/[0.08] focus:bg-[#121319] border border-white/15 focus:border-amber-500/70 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
        />

        {/* Right side controls: Clear or Keyboard shortcut */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] text-gray-400 font-mono select-none pointer-events-none">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Live Results Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-[#12131a] border border-white/20 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] flex flex-col min-w-[320px] sm:min-w-[480px] md:min-w-[560px] lg:min-w-[640px]">
          
          {/* Header Bar of Results */}
          <div className="px-3.5 py-2.5 bg-black/40 border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Equipment Asset Search</span>
              </span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono font-medium border border-amber-500/30">
                {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {query && (
                <button
                  onClick={handleViewAllInInventory}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 hover:underline"
                >
                  <span>Filter in Inventory</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills (Category & Quick Filters) */}
          <div className="px-3 py-1.5 bg-white/[0.02] border-b border-white/10 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mr-1 shrink-0">Category:</span>
            <button
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`px-2 py-0.5 rounded-lg shrink-0 transition font-medium ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-amber-500 text-black font-semibold shadow-sm'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              All Types
            </button>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === cat ? 'ALL' : cat)}
                className={`px-2 py-0.5 rounded-lg shrink-0 transition font-medium ${
                  selectedCategoryFilter === cat
                    ? 'bg-amber-500 text-black font-semibold shadow-sm'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div ref={listRef} className="overflow-y-auto max-h-[50vh] divide-y divide-white/5 p-1.5">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-gray-200 mb-1">No equipment found matching "{query}"</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                  Check the serial number, tag, or description spelling, or try searching by category (e.g., Casing, Drill Pipe).
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setQuery('');
                      setSelectedCategoryFilter('ALL');
                    }}
                    className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/15 text-white transition"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              searchResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isCopied = copiedId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border border-amber-500/30 shadow-md'
                        : 'hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    {/* Left Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {/* Serial Number Pill */}
                        <div className="flex items-center gap-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg font-mono text-xs font-bold">
                          <Hash className="w-3 h-3 text-amber-400" />
                          <span>SN: {highlightMatch(item.serialNumber || 'N/A', query)}</span>
                          <button
                            onClick={(e) => handleCopySerial(e, item.serialNumber, item.id)}
                            className="ml-1 p-0.5 rounded text-amber-300 hover:text-white hover:bg-amber-500/30 transition"
                            title="Copy Serial Number"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* Tag Number */}
                        <div className="flex items-center gap-1 bg-white/10 text-gray-300 border border-white/10 px-1.5 py-0.5 rounded text-xs font-mono">
                          <Tag className="w-2.5 h-2.5 text-gray-400" />
                          <span>{highlightMatch(item.tagNumber, query)}</span>
                        </div>

                        {/* Category Badge */}
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-medium">
                          {item.category}
                        </span>

                        {/* Status */}
                        {getStatusBadge(item.status)}
                      </div>

                      {/* Item Name / Description */}
                      <h4 className="text-sm font-semibold text-white truncate mb-1">
                        {highlightMatch(item.name, query)}
                      </h4>

                      {/* Technical Specs & Details Row */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        {item.outerDiameter && (
                          <span className="font-mono text-gray-300">OD: {item.outerDiameter}</span>
                        )}
                        {item.grade && (
                          <span className="font-mono text-amber-400/90">Grade: {item.grade}</span>
                        )}
                        {item.connectionType && (
                          <span className="text-gray-300">Conn: {item.connectionType}</span>
                        )}
                        {item.weightLbFt && (
                          <span className="text-gray-400">{item.weightLbFt}</span>
                        )}
                        {item.quantityJoints > 1 ? (
                          <span className="text-gray-300 font-medium">({item.quantityJoints} joints • {item.lengthFt} ft)</span>
                        ) : (
                          <span className="text-gray-300 font-medium">({item.lengthFt} ft)</span>
                        )}
                      </div>

                      {/* Location & Campaign Sub-Row */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {getLocationBadge(item.currentLocation)}
                        {item.rackLocation && (
                          <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                            {item.rackLocation}
                          </span>
                        )}
                        {item.campaignName && (
                          <span className="text-[10px] text-amber-400/80 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/15">
                            {item.campaignName}
                          </span>
                        )}
                        {item.wellChargeCode && (
                          <span className="text-[10px] text-emerald-400/80 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/15 font-mono">
                            {item.wellChargeCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectItem(item);
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition flex items-center gap-1 shadow-sm"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar with Keyboard Navigation Hints */}
          <div className="px-3.5 py-2 bg-black/60 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
            <div className="hidden sm:flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/10 rounded text-[10px] font-mono text-gray-300">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/10 rounded text-[10px] font-mono text-gray-300">↓</kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/10 rounded text-[10px] font-mono text-gray-300">↵</kbd>
                <span>select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/10 rounded text-[10px] font-mono text-gray-300">esc</kbd>
                <span>close</span>
              </span>
            </div>

            {query && (
              <button
                onClick={handleViewAllInInventory}
                className="w-full sm:w-auto text-center px-3 py-1 rounded-lg bg-white/10 hover:bg-amber-500/20 text-gray-200 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 transition flex items-center justify-center gap-1.5"
              >
                <span>Search all inventory for "{query}"</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
