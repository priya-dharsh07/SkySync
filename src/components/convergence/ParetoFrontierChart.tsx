"use client";

import { useMemo } from "react";
import { Sparkles, Info } from "lucide-react";
import { ConvergenceDestination } from "@/lib/convergence/pareto";

interface ParetoFrontierChartProps {
  destinations: ConvergenceDestination[];
  selectedDestination: ConvergenceDestination | null;
  onSelect: (dest: ConvergenceDestination) => void;
}

export default function ParetoFrontierChart({
  destinations,
  selectedDestination,
  onSelect,
}: ParetoFrontierChartProps) {
  const width = 600;
  const height = 300;
  const padding = { top: 25, right: 25, bottom: 35, left: 45 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxPriceStd = useMemo(() => {
    return Math.max(...destinations.map(d => d.priceStandardDeviation), 50) * 1.15;
  }, [destinations]);

  const maxArrivalWindow = useMemo(() => {
    return Math.max(...destinations.map(d => d.arrivalWindowMinutes), 120) * 1.15;
  }, [destinations]);

  const points = useMemo(() => {
    return destinations.map(d => {
      const x = padding.left + (d.priceStandardDeviation / maxPriceStd) * plotWidth;
      const y = padding.top + plotHeight - (d.arrivalWindowMinutes / maxArrivalWindow) * plotHeight;
      return { destination: d, x, y };
    });
  }, [destinations, maxPriceStd, maxArrivalWindow, plotWidth, plotHeight]);

  const paretoPoints = useMemo(() => {
    return points
      .filter(p => p.destination.isParetoOptimal)
      .sort((a, b) => a.x - b.x);
  }, [points]);

  const frontierPathData = useMemo(() => {
    if (paretoPoints.length < 2) return "";
    return paretoPoints.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");
  }, [paretoPoints]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-1.5 text-purple-700">
            <Sparkles size={15} className="text-purple-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#021024]">Price vs. Arrival Comparison</h3>
          </div>
          <p className="text-[11px] text-slate-500">
            Compare destinations. Cities towards the bottom-left offer the best blend of low fare variance and close arrival times.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-600 ring-2 ring-purple-100" />
            <span className="text-purple-900 font-semibold text-[11px]">Top Match</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="text-slate-500 text-[11px]">Alternative Destination</span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 aspect-[2/1] w-full rounded-xl bg-slate-50/70 border border-slate-100 p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
          {/* Subtle Grid Lines */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />

          {/* Grid lines horizontal */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight * 0.5}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight * 0.5}
            stroke="#E2E8F0"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Grid lines vertical */}
          <line
            x1={padding.left + plotWidth * 0.5}
            y1={padding.top}
            x2={padding.left + plotWidth * 0.5}
            y2={padding.top + plotHeight}
            stroke="#E2E8F0"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Pareto Frontier Curve */}
          {frontierPathData && (
            <path
              d={frontierPathData}
              fill="none"
              stroke="#9333EA"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              opacity="0.85"
            />
          )}

          {/* Axis Labels */}
          <text
            x={padding.left + plotWidth / 2}
            y={height - 8}
            textAnchor="middle"
            fill="#64748B"
            fontSize="10"
            fontWeight="600"
            className="select-none uppercase tracking-wider"
          >
            Price Disparity (StdDev $) →
          </text>
          <text
            x={14}
            y={padding.top + plotHeight / 2}
            textAnchor="middle"
            fill="#64748B"
            fontSize="10"
            fontWeight="600"
            transform={`rotate(-90 14 ${padding.top + plotHeight / 2})`}
            className="select-none uppercase tracking-wider"
          >
            Arrival Window (Mins) →
          </text>

          {/* Points */}
          {points.map((p) => {
            const isSelected = selectedDestination?.destination.code === p.destination.destination.code;
            const isPareto = p.destination.isParetoOptimal;

            return (
              <g
                key={p.destination.destination.code}
                onClick={() => onSelect(p.destination)}
                className="cursor-pointer transition-transform hover:scale-125"
              >
                {/* Halo */}
                {isSelected && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="12"
                    fill="none"
                    stroke="#9333EA"
                    strokeWidth="2"
                    className="animate-ping opacity-60"
                  />
                )}

                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? "6.5" : isPareto ? "5.5" : "4"}
                  fill={isPareto ? "#9333EA" : "#94A3B8"}
                  stroke={isSelected ? "#FFFFFF" : isPareto ? "#EDE9FE" : "#FFFFFF"}
                  strokeWidth="2"
                />

                <text
                  x={p.x}
                  y={p.y - 9}
                  textAnchor="middle"
                  fill={isSelected ? "#021024" : isPareto ? "#7E22CE" : "#64748B"}
                  fontSize={isSelected ? "11" : "9.5"}
                  fontWeight={isSelected || isPareto ? "bold" : "medium"}
                  className="font-mono select-none"
                >
                  {p.destination.destination.code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Info Callout */}
      <div className="mt-3.5 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Info size={13} className="text-[#5483B3]" />
          <span>Selected Meeting Destination:</span>
          <strong className="text-[#021024]">{selectedDestination?.destination.city} ({selectedDestination?.destination.code})</strong>
        </div>
        <div className="font-mono text-[11px] font-semibold text-purple-700">
          Match Score: {selectedDestination?.compositeFairnessScore}%
        </div>
      </div>
    </div>
  );
}
