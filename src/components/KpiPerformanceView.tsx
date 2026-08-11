import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useDrilling } from '../context/DrillingContext';
import { 
  BarChart3, 
  Timer, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Wrench, 
  Building2, 
  Filter, 
  RefreshCw,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

interface KpiDataPoint {
  category: string;
  inspectionType: string;
  actualHours: number;
  kpiTargetHours: number;
  totalJoints: number;
  vendorFacility: string;
  complianceRate: number;
}

const INITIAL_KPI_DATA: KpiDataPoint[] = [
  {
    category: 'Casing',
    inspectionType: 'NDT Magnetic Particle',
    actualHours: 18.5,
    kpiTargetHours: 24.0,
    totalJoints: 480,
    vendorFacility: 'Base Machine Shop Bay 1',
    complianceRate: 95.8,
  },
  {
    category: 'Casing',
    inspectionType: 'Visual Thread Inspection',
    actualHours: 14.2,
    kpiTargetHours: 12.0,
    totalJoints: 320,
    vendorFacility: 'Tenaris Service Hub',
    complianceRate: 83.3,
  },
  {
    category: 'Tubing',
    inspectionType: 'Full Length Ultrasonic (FLUT)',
    actualHours: 38.0,
    kpiTargetHours: 48.0,
    totalJoints: 210,
    vendorFacility: 'VAM Field Service Team',
    complianceRate: 97.2,
  },
  {
    category: 'Drill Pipe',
    inspectionType: 'Drift & Tally Calibration',
    actualHours: 9.8,
    kpiTargetHours: 12.0,
    totalJoints: 650,
    vendorFacility: 'Base Yard Recert Bay 2',
    complianceRate: 98.5,
  },
  {
    category: 'Heavy Weight Drill Pipe',
    inspectionType: 'Torque & Bucking Unit Test',
    actualHours: 31.5,
    kpiTargetHours: 36.0,
    totalJoints: 140,
    vendorFacility: 'Baker Hughes Yard Facility',
    complianceRate: 92.0,
  },
  {
    category: 'Backload Equipment',
    inspectionType: 'Quayside Backload Disposition',
    actualHours: 21.0,
    kpiTargetHours: 24.0,
    totalJoints: 185,
    vendorFacility: 'Main Supply Base Quay 2',
    complianceRate: 94.6,
  },
];

export const KpiPerformanceView: React.FC = () => {
  const { items, rigBackloads } = useDrilling();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedHoverPoint, setSelectedHoverPoint] = useState<KpiDataPoint | null>(null);

  // Compute live averages
  const filteredData = categoryFilter === 'ALL' 
    ? INITIAL_KPI_DATA 
    : INITIAL_KPI_DATA.filter(d => d.category === categoryFilter);

  const avgActual = filteredData.length > 0 
    ? (filteredData.reduce((acc, d) => acc + d.actualHours, 0) / filteredData.length).toFixed(1)
    : '0';

  const avgTarget = filteredData.length > 0 
    ? (filteredData.reduce((acc, d) => acc + d.kpiTargetHours, 0) / filteredData.length).toFixed(1)
    : '0';

  const avgCompliance = filteredData.length > 0 
    ? (filteredData.reduce((acc, d) => acc + d.complianceRate, 0) / filteredData.length).toFixed(1)
    : '0';

  // D3 Chart Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 600;
    const height = 360;
    const margin = { top: 40, right: 30, bottom: 80, left: 50 };
    const width = containerWidth - margin.left - margin.right;

    svg
      .attr('width', containerWidth)
      .attr('height', height)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`);

    const chart = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Inspection Types)
    const x0Scale = d3
      .scaleBand()
      .domain(filteredData.map(d => d.inspectionType))
      .range([0, width])
      .padding(0.3);

    // X Sub Scale (Actual vs Target KPI)
    const x1Scale = d3
      .scaleBand()
      .domain(['Actual Turnaround', 'KPI Target SLA'])
      .range([0, x0Scale.bandwidth()])
      .padding(0.1);

    // Y Scale (Hours)
    const maxVal = d3.max(filteredData, d => Math.max(d.actualHours, d.kpiTargetHours)) || 60;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal * 1.25])
      .nice()
      .range([height - margin.top - margin.bottom, 0]);

    // Color Scale
    const colorScale = (type: 'Actual Turnaround' | 'KPI Target SLA', isBreached: boolean) => {
      if (type === 'KPI Target SLA') return '#fbbf24'; // Amber target bar
      return isBreached ? '#f43f5e' : '#10b981'; // Rose if breached, Emerald if under SLA
    };

    // Gridlines
    const yGrid = d3.axisLeft(yScale).tickSize(-width).tickFormat(() => '');
    chart
      .append('g')
      .attr('class', 'gridline')
      .style('stroke', 'rgba(255, 255, 255, 0.05)')
      .call(yGrid);

    // Render Grouped Bars
    const categoryGroup = chart
      .selectAll('.category-group')
      .data(filteredData)
      .enter()
      .append('g')
      .attr('class', 'category-group')
      .attr('transform', d => `translate(${x0Scale(d.inspectionType)},0)`);

    // Actual Bars
    categoryGroup
      .append('rect')
      .attr('x', x1Scale('Actual Turnaround') || 0)
      .attr('y', d => yScale(d.actualHours))
      .attr('width', x1Scale.bandwidth())
      .attr('height', d => yScale(0) - yScale(d.actualHours))
      .attr('fill', d => colorScale('Actual Turnaround', d.actualHours > d.kpiTargetHours))
      .attr('rx', 4)
      .attr('cursor', 'pointer')
      .on('mouseover', (_event, d) => setSelectedHoverPoint(d))
      .on('mouseout', () => setSelectedHoverPoint(null));

    // Target SLA Bars
    categoryGroup
      .append('rect')
      .attr('x', x1Scale('KPI Target SLA') || 0)
      .attr('y', d => yScale(d.kpiTargetHours))
      .attr('width', x1Scale.bandwidth())
      .attr('height', d => yScale(0) - yScale(d.kpiTargetHours))
      .attr('fill', colorScale('KPI Target SLA', false))
      .attr('opacity', 0.4)
      .attr('rx', 4)
      .attr('stroke', '#fbbf24')
      .attr('stroke-dasharray', '3,3')
      .attr('cursor', 'pointer')
      .on('mouseover', (_event, d) => setSelectedHoverPoint(d))
      .on('mouseout', () => setSelectedHoverPoint(null));

    // Value Labels on Top of Bars
    categoryGroup
      .append('text')
      .attr('x', (x1Scale('Actual Turnaround') || 0) + x1Scale.bandwidth() / 2)
      .attr('y', d => yScale(d.actualHours) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', d => (d.actualHours > d.kpiTargetHours ? '#f43f5e' : '#10b981'))
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text(d => `${d.actualHours}h`);

    categoryGroup
      .append('text')
      .attr('x', (x1Scale('KPI Target SLA') || 0) + x1Scale.bandwidth() / 2)
      .attr('y', d => yScale(d.kpiTargetHours) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fbbf24')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text(d => `${d.kpiTargetHours}h`);

    // X Axis
    const xAxis = d3.axisBottom(x0Scale);
    const xAxisG = chart
      .append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(xAxis);

    xAxisG.selectAll('text')
      .attr('transform', 'rotate(-18)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.6em')
      .attr('dy', '0.6em')
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .attr('font-weight', '600');

    xAxisG.select('.domain').attr('stroke', 'rgba(255, 255, 255, 0.1)');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d => `${d}h`);
    const yAxisG = chart.append('g').call(yAxis);
    yAxisG.selectAll('text').attr('fill', '#9ca3af').attr('font-size', '10px');
    yAxisG.select('.domain').attr('stroke', 'rgba(255, 255, 255, 0.1)');

  }, [filteredData]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>Inspection & Recertification KPI Performance Analytics</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            D3-powered visualization comparing actual inspection turnaround duration against defined KPI SLA thresholds.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none font-semibold"
            >
              <option value="ALL" className="bg-[#141417]">All Equipment Categories</option>
              <option value="Casing" className="bg-[#141417]">Casing Strings</option>
              <option value="Tubing" className="bg-[#141417]">Production Tubing</option>
              <option value="Drill Pipe" className="bg-[#141417]">Drill Pipe</option>
              <option value="Heavy Weight Drill Pipe" className="bg-[#141417]">HWDP & BHA Tools</option>
              <option value="Backload Equipment" className="bg-[#141417]">Backload Dispositions</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-[#141417] border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-gray-400 text-xs font-semibold uppercase">
            <span>Avg Turnaround Time</span>
            <Timer className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">
            {avgActual} <span className="text-sm font-normal text-gray-400">Hours</span>
          </p>
          <p className="text-[11px] text-gray-400">
            KPI Target Baseline: <strong className="text-amber-300">{avgTarget} Hours</strong>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#141417] border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-gray-400 text-xs font-semibold uppercase">
            <span>SLA Compliance Index</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-cyan-300 font-mono">
            {avgCompliance}%
          </p>
          <p className="text-[11px] text-gray-400">
            Target SLA Benchmark: <strong className="text-emerald-400">&ge; 90.0%</strong>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#141417] border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-gray-400 text-xs font-semibold uppercase">
            <span>Completed On Time</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">
            1,985 <span className="text-sm font-normal text-emerald-400">Joints</span>
          </p>
          <p className="text-[11px] text-emerald-400">
            5 of 6 inspection streams meeting SLA
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#141417] border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-gray-400 text-xs font-semibold uppercase">
            <span>SLA Breached Stream</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-rose-400 font-mono">
            1 <span className="text-xs font-normal text-rose-300/80">Stream</span>
          </p>
          <p className="text-[11px] text-gray-400">
            Visual Thread Inspection (+2.2h over SLA)
          </p>
        </div>

      </div>

      {/* Main D3 Bar Chart Container */}
      <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Inspection Turnaround Duration vs. KPI SLA Thresholds</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Green = Achieved within KPI SLA | Red = Breached KPI SLA | Amber Dashed = Target SLA Limit
            </p>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center space-x-4 text-xs font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
              <span className="text-gray-300">Actual Turnaround (On Track)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block"></span>
              <span className="text-gray-300">Actual Turnaround (Breached)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-amber-400/40 border border-amber-400 inline-block"></span>
              <span className="text-amber-300">KPI Target SLA</span>
            </div>
          </div>
        </div>

        {/* D3 Render Target Canvas */}
        <div ref={containerRef} className="w-full relative min-h-[360px]">
          <svg ref={svgRef} className="w-full h-full overflow-visible" />

          {/* Hover Details Overlay Box */}
          {selectedHoverPoint && (
            <div className="absolute top-2 right-4 bg-black/90 border border-amber-500/50 p-3.5 rounded-xl text-xs space-y-1 shadow-2xl backdrop-blur-md max-w-xs">
              <p className="font-bold text-amber-400 font-mono">{selectedHoverPoint.inspectionType}</p>
              <p className="text-gray-200">Facility: <strong>{selectedHoverPoint.vendorFacility}</strong></p>
              <p className="text-gray-300">Category: <strong>{selectedHoverPoint.category}</strong> ({selectedHoverPoint.totalJoints} Jts)</p>
              <div className="pt-1.5 border-t border-white/10 flex justify-between gap-4 font-mono">
                <span className="text-white">Actual: <strong className={selectedHoverPoint.actualHours > selectedHoverPoint.kpiTargetHours ? 'text-rose-400' : 'text-emerald-400'}>{selectedHoverPoint.actualHours}h</strong></span>
                <span className="text-amber-300">Target: <strong>{selectedHoverPoint.kpiTargetHours}h</strong></span>
              </div>
              <p className="text-[10px] text-cyan-300 font-semibold pt-1">
                Historical SLA Pass Rate: {selectedHoverPoint.complianceRate}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Facility Performance Table */}
      <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Testing Facility & Machine Shop SLA Performance Breakdown</span>
        </h3>

        <div className="border border-white/10 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[11px] font-semibold text-gray-400 uppercase border-b border-white/10">
                <th className="p-3">Inspection Service Stream</th>
                <th className="p-3">Assigned Machine Shop / Facility</th>
                <th className="p-3 text-center">Actual Turnaround</th>
                <th className="p-3 text-center">Target SLA</th>
                <th className="p-3 text-center">Variance</th>
                <th className="p-3 text-right">SLA Pass Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {filteredData.map((d, idx) => {
                const diff = (d.actualHours - d.kpiTargetHours).toFixed(1);
                const isOver = d.actualHours > d.kpiTargetHours;

                return (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-semibold text-amber-400">{d.inspectionType}</td>
                    <td className="p-3 text-gray-300">{d.vendorFacility}</td>
                    <td className="p-3 text-center font-mono font-bold text-white">{d.actualHours} hrs</td>
                    <td className="p-3 text-center font-mono text-amber-300">{d.kpiTargetHours} hrs</td>
                    <td className="p-3 text-center font-mono font-bold">
                      <span className={isOver ? 'text-rose-400' : 'text-emerald-400'}>
                        {isOver ? `+${diff}h (Breached)` : `${diff}h (On Track)`}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-cyan-300">
                      {d.complianceRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
