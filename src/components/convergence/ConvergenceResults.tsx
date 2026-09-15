"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Award, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Lock,
  Plane
} from "lucide-react";
import { ConvergenceDestination } from "@/lib/convergence/pareto";

interface ConvergenceResultsProps {
  destinations: ConvergenceDestination[];
  selectedDestination: ConvergenceDestination | null;
  onSelect: (dest: ConvergenceDestination) => void;
}

export default function ConvergenceResults({
  destinations,
  selectedDestination,
  onSelect,
}: ConvergenceResultsProps) {
  const router = useRouter();
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [initializingBooking, setInitializingBooking] = useState<string | null>(null);

  async function handleLaunchSagaBooking(dest: ConvergenceDestination) {
    try {
      setInitializingBooking(dest.destination.code);

      const response = await fetch("/api/saga/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: dest.destination,
          members: dest.memberFlights.map(m => ({
            id: m.travelerId,
            name: m.travelerName,
            originAirport: m.originAirport,
            flight: m.flight,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create group booking session");
      }

      const data = await response.json();
      router.push(`/group-booking/${data.sessionId}`);
    } catch (err) {
      console.error(err);
      alert("Unable to initialize group booking session. Please try again.");
    } finally {
      setInitializingBooking(null);
    }
  }

  if (destinations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#021024]">
            Recommended Meeting Destinations
          </h3>
          <p className="text-xs text-slate-500">
            {destinations.length} destinations ranked by lowest average fare and closest arrival times.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {destinations.slice(0, 6).map((dest) => {
          const isSelected = selectedDestination?.destination.code === dest.destination.code;
          const isExpanded = expandedCode === dest.destination.code;
          const isBooking = initializingBooking === dest.destination.code;

          return (
            <div
              key={dest.destination.code}
              onClick={() => onSelect(dest)}
              className={`cursor-pointer rounded-2xl border p-5 transition ${
                isSelected
                  ? "border-[#5483B3] bg-white ring-2 ring-blue-100 shadow-md"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 font-mono text-sm font-bold text-[#C1E8FF] shadow-sm">
                    {dest.destination.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#021024]">
                        {dest.destination.city}, {dest.destination.country}
                      </h4>
                      {dest.isParetoOptimal && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                          <Award size={11} /> Top Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {dest.destination.name}
                    </p>
                  </div>
                </div>

                {/* Score & Button */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Group Match</div>
                    <div className="text-base font-extrabold text-[#052659]">
                      {dest.compositeFairnessScore}%
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLaunchSagaBooking(dest);
                    }}
                    disabled={isBooking}
                    className="flex items-center gap-1.5 rounded-xl bg-[#052659] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024] disabled:opacity-60"
                  >
                    {isBooking ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Plane size={13} className="text-blue-300" />
                        <span>Book Group Trip</span>
                        <ArrowRight size={12} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Price Variance</span>
                  <p className="mt-0.5 font-bold text-[#052659] font-mono text-xs">
                    ±${dest.priceStandardDeviation} <span className="text-[10px] font-normal text-slate-500">(Fair Split)</span>
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Arrival Window</span>
                  <p className="mt-0.5 font-bold text-emerald-700 font-mono text-xs flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {dest.arrivalWindowMinutes} mins
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Average Ticket</span>
                  <p className="mt-0.5 font-bold text-[#021024] font-mono text-xs">
                    ${dest.averagePriceUsd}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Avg Flight Time</span>
                  <p className="mt-0.5 font-bold text-slate-700 font-mono text-xs">
                    {Math.floor(dest.averageDurationMinutes / 60)}h {dest.averageDurationMinutes % 60}m
                  </p>
                </div>
              </div>

              {/* Accordion Toggle */}
              <div className="mt-3 flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCode(isExpanded ? null : dest.destination.code);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#052659] transition"
                >
                  <span>Flight Breakdown ({dest.memberFlights.length} Travelers)</span>
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                <span className="text-[11px] text-slate-500">
                  Total Group: <strong className="text-[#021024] font-bold">${dest.totalCostUsd}</strong>
                </span>
              </div>

              {/* Expanded Legs List */}
              {isExpanded && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {dest.memberFlights.map((m) => (
                    <div
                      key={m.travelerId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-100/80 p-2.5 text-xs text-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#021024]">{m.travelerName}</span>
                        <span className="text-slate-400">({m.originAirport.code} → {dest.destination.code})</span>
                      </div>

                      <div className="flex items-center gap-3.5 text-[11px]">
                        <span className="text-slate-500">{m.flight.airline} {m.flight.flightNumber}</span>
                        <span>Dep: <strong className="text-slate-800">{m.flight.departureLocal}</strong></span>
                        <span>Arr: <strong className="text-slate-800">{m.flight.arrivalLocal}</strong></span>
                        <span className="font-mono font-bold text-[#052659]">${m.flight.priceUsd}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
