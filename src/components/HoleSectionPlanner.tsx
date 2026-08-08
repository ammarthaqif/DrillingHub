import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { HoleSection, TubularItem } from '../types/drilling';
import { 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Tag, 
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface HoleSectionPlannerProps {
  onSelectItem: (item: TubularItem) => void;
  onOpenAddItem: () => void;
}

const SECTIONS: { id: HoleSection; title: string; depthTarget: string; typicalPipes: string }[] = [
  {
    id: '36" Conductor',
    title: '36" Structural Conductor Section',
    depthTarget: '0 ft to 400 ft RKB',
    typicalPipes: '36" Structural Pipe, Squnch Joints, Driving Shoe',
  },
  {
    id: '26" Surface Hole',
    title: '26" Surface Hole Section',
    depthTarget: '400 ft to 2,000 ft RKB',
    typicalPipes: '20" Surface Casing, BTC/STC, Float Collar/Shoe, Bow Centralizers',
  },
  {
    id: '17-1/2" Intermediate',
    title: '17-1/2" Intermediate Hole Section',
    depthTarget: '2,000 ft to 6,500 ft RKB',
    typicalPipes: '13-3/8" Intermediate Casing, VAM TOP/Buttress, Crossovers, HWDP, 8" Drill Collars',
  },
  {
    id: '12-1/4" Main Hole',
    title: '12-1/4" Main High-Angle Hole Section',
    depthTarget: '6,500 ft to 12,500 ft RKB',
    typicalPipes: '9-5/8" Production Casing, TenarisHydril Wedge 563, 5" S-135 Drill Pipe, Jar Assembly',
  },
  {
    id: '8-1/2" Reservoir',
    title: '8-1/2" Reservoir / Production Section',
    depthTarget: '12,500 ft to 15,200 ft RKB',
    typicalPipes: '7" Liner, VAM SLIJ-II, MWD/LWD Tools, Setting Tool, 3-1/2" Drill Pipe',
  },
  {
    id: '6" Liner / Workover',
    title: '6" Slimhole / Workover Section',
    depthTarget: '15,200 ft to TD (Total Depth)',
    typicalPipes: '4-1/2" Production Tubing, Workover String, Production Packers',
  },
];

export const HoleSectionPlanner: React.FC<HoleSectionPlannerProps> = ({
  onSelectItem,
  onOpenAddItem,
}) => {
  const { items } = useDrilling();
  const [expandedSection, setExpandedSection] = useState<HoleSection>('17-1/2" Intermediate');

  const getSectionItems = (secId: HoleSection) => {
    return items.filter(i => i.holeSection === secId);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <span>Well Hole Section Tubular & Tool Allocation Planner</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Plan, verify, and track casing strings, drill strings & downhole BHA tools categorized for each target hole section.
          </p>
        </div>

        <button
          onClick={onOpenAddItem}
          className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition text-xs flex items-center space-x-2 shrink-0 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Equipment to Section</span>
        </button>
      </div>

      {/* Accordion Sections for Each Hole Size */}
      <div className="space-y-4">
        {SECTIONS.map((sec) => {
          const secItems = getSectionItems(sec.id);
          const totalJoints = secItems.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
          const serviceableJoints = secItems.filter(i => i.status === 'Serviceable (Field Ready)').reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
          const readyPercent = totalJoints > 0 ? Math.round((serviceableJoints / totalJoints) * 100) : 0;
          const hasOverdue = secItems.some(i => i.status === 'Inspection Overdue');
          const isExpanded = expandedSection === sec.id;

          return (
            <div 
              key={sec.id}
              className={`rounded-2xl border transition overflow-hidden shadow-lg ${
                isExpanded ? 'bg-[#111114] border-amber-500/40 ring-1 ring-amber-500/20' : 'bg-[#111114] border-white/10 hover:border-white/20'
              }`}
            >
              {/* Header Bar */}
              <div 
                onClick={() => setExpandedSection(isExpanded ? ('Unassigned / General' as any) : sec.id)}
                className="p-5 bg-white/5 hover:bg-white/10 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3">
                  <button className="p-1 text-gray-400">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-amber-500" /> : <ChevronRight className="w-5 h-5" />}
                  </button>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{sec.title}</span>
                      {hasOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Inspection Overdue</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Depth Interval: <strong className="text-gray-200">{sec.depthTarget}</strong> | Typical: {sec.typicalPipes}</p>
                  </div>
                </div>

                {/* Section Stats & Progress Bar */}
                <div className="flex items-center space-x-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white">{secItems.length} items ({totalJoints} joints)</p>
                    <p className="text-[11px] text-emerald-400 font-semibold">{readyPercent}% Field Ready</p>
                  </div>

                  <div className="w-24 bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
                    <div 
                      className={`h-full rounded-full ${readyPercent >= 80 ? 'bg-emerald-400' : readyPercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${readyPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Expanded Item List */}
              {isExpanded && (
                <div className="p-5 border-t border-white/5 space-y-3 bg-[#141417]">
                  {secItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 bg-white/5 rounded-xl border border-dashed border-white/10">
                      <p className="font-semibold text-gray-300">No tubulars or tools allocated to {sec.id} yet</p>
                      <p className="text-xs mt-1 text-gray-500">Assign existing inventory or create a new casing/tool string entry</p>
                      <button
                        onClick={onOpenAddItem}
                        className="mt-3 px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-semibold text-xs"
                      >
                        Allocate Equipment
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {secItems.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => onSelectItem(item)}
                          className="bg-white/5 border border-white/5 hover:border-amber-500/40 hover:bg-white/10 rounded-xl p-4 cursor-pointer transition space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-amber-400 text-xs font-mono group-hover:text-amber-300">{item.tagNumber}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === 'Serviceable (Field Ready)' ? 'bg-emerald-500/20 text-emerald-300' :
                              item.status === 'Inspection Overdue' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {item.status}
                            </span>
                          </div>

                          <p className="text-xs font-medium text-white truncate" title={item.name}>{item.name}</p>

                          <div className="text-[11px] text-gray-400 flex flex-wrap gap-1">
                            <span className="bg-black/40 px-2 py-0.5 rounded border border-white/5">{item.outerDiameter}</span>
                            <span className="bg-black/40 px-2 py-0.5 rounded border border-white/5">{item.grade}</span>
                            <span className="bg-black/40 px-2 py-0.5 rounded border border-white/5 font-mono text-cyan-300">{item.connectionType}</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-white/5">
                            <span>Qty: <strong className="text-white">{item.quantityJoints} jts</strong> ({item.lengthFt} ft)</span>
                            <span className="text-cyan-400">{item.currentLocation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
