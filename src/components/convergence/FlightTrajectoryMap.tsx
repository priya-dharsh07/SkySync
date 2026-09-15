"use client";

import { useMemo, useState } from "react";
import { Compass, Clock, DollarSign } from "lucide-react";
import { ConvergenceDestination } from "@/lib/convergence/pareto";

interface FlightTrajectoryMapProps {
  destination: ConvergenceDestination;
}

export default function FlightTrajectoryMap({ destination }: FlightTrajectoryMapProps) {
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);

  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 800;
    const y = ((75 - lat) / 135) * 440;
    return { x: Math.max(30, Math.min(770, x)), y: Math.max(30, Math.min(410, y)) };
  };

  const destPoint = useMemo(() => {
    return projectCoords(destination.destination.lat, destination.destination.lng);
  }, [destination]);

  const flightPaths = useMemo(() => {
    return destination.memberFlights.map((m) => {
      const originPoint = projectCoords(m.originAirport.lat, m.originAirport.lng);
      const dx = destPoint.x - originPoint.x;
      const midX = (originPoint.x + destPoint.x) / 2;
      const midY = (originPoint.y + destPoint.y) / 2 - Math.min(90, Math.max(30, Math.abs(dx) * 0.22));

      const pathData = `M ${originPoint.x} ${originPoint.y} Q ${midX} ${midY} ${destPoint.x} ${destPoint.y}`;

      return {
        member: m,
        originPoint,
        pathData,
      };
    });
  }, [destination, destPoint]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Map Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#052659] border border-blue-100">
            <Compass size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#021024]">
              Flight Trajectories
            </h3>
            <p className="text-[11px] text-slate-500">
              Converging on {destination.destination.city} ({destination.destination.code})
            </p>
          </div>
        </div>

        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#052659]">
          {destination.memberFlights.length} Routes Synced
        </span>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
        <svg viewBox="0 0 800 440" className="h-full w-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
            </pattern>
            <linearGradient id="saasArcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7DA0CA" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#C1E8FF" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Grid Background */}
          <rect width="800" height="440" fill="url(#grid)" />

          {/* Trajectory Lines */}
          {flightPaths.map(({ member, pathData }) => {
            const isHovered = hoveredMemberId === member.travelerId;
            return (
              <path
                key={member.travelerId}
                d={pathData}
                fill="none"
                stroke={isHovered ? "#38BDF8" : "url(#saasArcGradient)"}
                strokeWidth={isHovered ? "3" : "1.75"}
                strokeDasharray={isHovered ? "none" : "5 3"}
                className="transition-all duration-200"
              />
            );
          })}

          {/* Origin Nodes */}
          {flightPaths.map(({ member, originPoint }) => {
            const isHovered = hoveredMemberId === member.travelerId;
            return (
              <g 
                key={`node-${member.travelerId}`}
                onMouseEnter={() => setHoveredMemberId(member.travelerId)}
                onMouseLeave={() => setHoveredMemberId(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={originPoint.x}
                  cy={originPoint.y}
                  r={isHovered ? "6" : "4.5"}
                  fill="#7DA0CA"
                  className="transition-all"
                />
                <circle
                  cx={originPoint.x}
                  cy={originPoint.y}
                  r={isHovered ? "11" : "7"}
                  fill="none"
                  stroke="#C1E8FF"
                  strokeWidth="1.5"
                  opacity={isHovered ? "0.9" : "0.4"}
                />
                <text
                  x={originPoint.x}
                  y={originPoint.y - 10}
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize="10"
                  fontWeight="bold"
                  className="font-mono select-none pointer-events-none"
                >
                  {member.originAirport.code}
                </text>
              </g>
            );
          })}

          {/* Destination Target Node */}
          <g>
            <circle
              cx={destPoint.x}
              cy={destPoint.y}
              r="14"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <circle
              cx={destPoint.x}
              cy={destPoint.y}
              r="6"
              fill="#38BDF8"
            />
            <circle
              cx={destPoint.x}
              cy={destPoint.y}
              r="2"
              fill="#FFFFFF"
            />
            <text
              x={destPoint.x}
              y={destPoint.y + 18}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="bold"
              className="font-mono select-none"
            >
              {destination.destination.code} (HUB)
            </text>
          </g>
        </svg>

        {/* Floating Quick Info Pill */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/60 bg-slate-900/80 p-2.5 text-xs backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span>Target Hub:</span>
            <span className="font-semibold text-white">{destination.destination.name}</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-slate-300">
              <Clock size={12} className="text-blue-400" />
              Window: <strong className="text-white">{destination.arrivalWindowMinutes}m</strong>
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <DollarSign size={12} className="text-emerald-400" />
              Gini: <strong className="text-white">{destination.priceGiniCoefficient}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Member Legs Grid */}
      <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {destination.memberFlights.map((m) => {
          const isHovered = hoveredMemberId === m.travelerId;
          return (
            <div
              key={m.travelerId}
              onMouseEnter={() => setHoveredMemberId(m.travelerId)}
              onMouseLeave={() => setHoveredMemberId(null)}
              className={`rounded-xl border p-3 transition ${
                isHovered
                  ? "border-[#5483B3] bg-blue-50/50 shadow-sm"
                  : "border-slate-100 bg-slate-50/60 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#021024]">{m.travelerName}</span>
                <span className="font-mono text-xs font-bold text-[#052659]">
                  ${m.flight.priceUsd}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>{m.originAirport.code} → {destination.destination.code}</span>
                <span className="font-medium">{Math.floor(m.flight.durationMinutes / 60)}h {m.flight.durationMinutes % 60}m</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
