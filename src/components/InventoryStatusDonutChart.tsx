import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TubularItem, MaintenanceStatus } from '../types/drilling';
import { 
  CheckCircle2, 
  Clock, 
  Wrench, 
  AlertOctagon, 
  Activity, 
  Layers,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface StatusSlice {
  id: 'active' | 'inspection' | 'maintenance' | 'retired';
  label: string;
  shortLabel: string;
  count: number;
  joints: number;
  lengthFt: number;
  color: string;
  hoverColor: string;
  description: string;
  rawStatuses: MaintenanceStatus[];
}

interface InventoryStatusDonutChartProps {
  items: TubularItem[];
  onSelectStatusFilter?: (status: MaintenanceStatus | 'ALL') => void;
}

export const InventoryStatusDonutChart: React.FC<InventoryStatusDonutChartProps> = ({
  items,
  onSelectStatusFilter
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<StatusSlice | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Group inventory items into the 4 health breakdown categories
  const activeItems = items.filter(i => i.status === 'Serviceable (Field Ready)');
  const inspectionItems = items.filter(i => i.status === 'Due for Inspection' || i.status === 'Inspection Overdue');
  const maintenanceItems = items.filter(i => i.status === 'In Refurbishment');
  const retiredItems = items.filter(i => i.status === 'Quarantined / Damaged');

  const totalJoints = items.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  const activeJoints = activeItems.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  const inspectionJoints = inspectionItems.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  const maintenanceJoints = maintenanceItems.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);
  const retiredJoints = retiredItems.reduce((acc, i) => acc + (i.quantityJoints || 1), 0);

  const activeLength = activeItems.reduce((acc, i) => acc + (i.lengthFt || 0), 0);
  const inspectionLength = inspectionItems.reduce((acc, i) => acc + (i.lengthFt || 0), 0);
  const maintenanceLength = maintenanceItems.reduce((acc, i) => acc + (i.lengthFt || 0), 0);
  const retiredLength = retiredItems.reduce((acc, i) => acc + (i.lengthFt || 0), 0);

  const healthScore = totalJoints > 0 ? Math.round((activeJoints / totalJoints) * 100) : 0;

  const slices: StatusSlice[] = [
    {
      id: 'active',
      label: 'Active (Field Ready)',
      shortLabel: 'Active',
      count: activeItems.length,
      joints: activeJoints,
      lengthFt: activeLength,
      color: '#10b981', // Emerald 500
      hoverColor: '#34d399',
      description: 'Fully inspected, drifted & certified for Run-In-Hole (RIH)',
      rawStatuses: ['Serviceable (Field Ready)']
    },
    {
      id: 'inspection',
      label: 'In Inspection / Due',
      shortLabel: 'In Inspection',
      count: inspectionItems.length,
      joints: inspectionJoints,
      lengthFt: inspectionLength,
      color: '#f59e0b', // Amber 500
      hoverColor: '#fbbf24',
      description: 'Scheduled for NDT, ultrasonic or visual thread inspection',
      rawStatuses: ['Due for Inspection', 'Inspection Overdue']
    },
    {
      id: 'maintenance',
      label: 'Under Maintenance',
      shortLabel: 'Under Maint.',
      count: maintenanceItems.length,
      joints: maintenanceJoints,
      lengthFt: maintenanceLength,
      color: '#06b6d4', // Cyan 500
      hoverColor: '#22d3ee',
      description: 'Currently undergoing thread recutting, hardbanding, or bucking',
      rawStatuses: ['In Refurbishment']
    },
    {
      id: 'retired',
      label: 'Retired / Quarantined',
      shortLabel: 'Quarantined',
      count: retiredItems.length,
      joints: retiredJoints,
      lengthFt: retiredLength,
      color: '#a855f7', // Purple 500
      hoverColor: '#c084fc',
      description: 'Quarantined due to wall loss, bent tubulars, or scrap disposition',
      rawStatuses: ['Quarantined / Damaged']
    },
  ];

  // D3 Rendering
  useEffect(() => {
    if (!svgRef.current) return;

    const width = 240;
    const height = 240;
    const margin = 10;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.65; // Donut hole ratio

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // D3 Pie Generator
    const pie = d3.pie<StatusSlice>()
      .value(d => Math.max(d.joints, d.count > 0 ? 1 : 0))
      .sort(null)
      .padAngle(0.03);

    // D3 Arc Generator
    const arc = d3.arc<d3.PieArcDatum<StatusSlice>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(6);

    const arcHover = d3.arc<d3.PieArcDatum<StatusSlice>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(radius + 6)
      .cornerRadius(8);

    const pieData = pie(slices);

    // Draw background placeholder circle if empty
    if (totalJoints === 0) {
      g.append('circle')
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', '#27272a')
        .attr('stroke-width', radius - innerRadius);
      return;
    }

    // Paths
    const pathGroup = g.selectAll('path')
      .data(pieData)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#111114')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.3s ease');

    // Smooth entry transition
    pathGroup
      .transition()
      .duration(750)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t)) || '';
        };
      });

    // Hover & Interaction
    pathGroup
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', (datum: any) => arcHover(datum) || '')
          .attr('fill', d.data.hoverColor);

        setHoveredSlice(d.data);
      })
      .on('mousemove', function(event) {
        if (containerRef.current) {
          const bounds = containerRef.current.getBoundingClientRect();
          setTooltipPos({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top
          });
        }
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', (datum: any) => arc(datum) || '')
          .attr('fill', d.data.color);

        setHoveredSlice(null);
        setTooltipPos(null);
      })
      .on('click', function(event, d) {
        if (onSelectStatusFilter && d.data.rawStatuses.length > 0) {
          onSelectStatusFilter(d.data.rawStatuses[0]);
        }
      });

  }, [items, totalJoints]);

  return (
    <div ref={containerRef} className="relative rounded-2xl border border-white/10 bg-[#111114] p-5 shadow-xl space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Inventory Status Breakdown</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {healthScore}% Ready
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">D3 Health monitoring donut across asset readiness lifecycle</p>
          </div>
        </div>

        <span className="text-xs font-mono text-gray-400">
          {totalJoints} Total Joints
        </span>
      </div>

      {/* Main Visual: Donut Chart + Central Gauge + Legend Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        
        {/* D3 Donut Visual (5 Cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative py-2">
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg ref={svgRef} className="w-full h-full drop-shadow-md"></svg>
            
            {/* Center Content Hole */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Fleet Health</span>
              <span className="text-2xl font-black text-white font-mono mt-0.5">{healthScore}%</span>
              <span className="text-[10px] text-emerald-400 font-medium">{activeJoints} / {totalJoints} jts</span>
            </div>
          </div>
          <span className="text-[10px] text-gray-500 mt-2">Hover slice for telemetry • Click to filter</span>
        </div>

        {/* Legend & Metric Cards (7 Cols) */}
        <div className="md:col-span-7 space-y-2.5">
          {slices.map((slice) => {
            const pct = totalJoints > 0 ? Math.round((slice.joints / totalJoints) * 100) : 0;
            const isHovered = hoveredSlice?.id === slice.id;

            return (
              <div
                key={slice.id}
                onClick={() => onSelectStatusFilter && onSelectStatusFilter(slice.rawStatuses[0])}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isHovered 
                    ? 'bg-white/10 border-white/20 scale-[1.01]' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full mt-1 shrink-0" 
                    style={{ backgroundColor: slice.color, boxShadow: `0 0 8px ${slice.color}66` }}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{slice.label}</span>
                      <span className="text-[10px] font-mono text-gray-400">({slice.count} items)</span>
                    </div>
                    <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{slice.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <div className="flex items-center justify-end space-x-1.5 font-mono">
                    <span className="text-xs font-bold text-white">{slice.joints} jts</span>
                    <span className="text-[11px] font-semibold text-gray-400">({pct}%)</span>
                  </div>
                  <span className="text-[10px] text-gray-500 block font-mono">{(slice.lengthFt / 1000).toFixed(1)}k ft</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Floating Tooltip if Hovered */}
      {hoveredSlice && tooltipPos && (
        <div 
          className="absolute z-30 pointer-events-none bg-black/90 border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1 transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipPos.x, top: tooltipPos.y - 12 }}
        >
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredSlice.color }} />
            <span className="font-bold text-white">{hoveredSlice.label}</span>
          </div>
          <div className="text-[11px] text-gray-300 space-y-0.5 pt-1 border-t border-white/10 font-mono">
            <p>Joints: <strong className="text-white">{hoveredSlice.joints}</strong> ({totalJoints > 0 ? Math.round((hoveredSlice.joints / totalJoints) * 100) : 0}% of campaign)</p>
            <p>Line Items: <strong className="text-white">{hoveredSlice.count}</strong> records</p>
            <p>Total Footage: <strong className="text-amber-400">{hoveredSlice.lengthFt.toLocaleString()} ft</strong></p>
          </div>
        </div>
      )}

      {/* Quick Summary Footer */}
      <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-gray-400">
        <span className="flex items-center space-x-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>API Spec 5CT & DS-1 Category Health Compliance</span>
        </span>
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span className="text-emerald-400">{activeJoints} Ready</span>
          <span className="text-amber-400">{inspectionJoints} In Inspection</span>
          <span className="text-cyan-400">{maintenanceJoints} Maint</span>
          <span className="text-purple-400">{retiredJoints} Retired</span>
        </div>
      </div>

    </div>
  );
};
