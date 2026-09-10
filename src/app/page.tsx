"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import MultiOriginSearch from "@/components/convergence/MultiOriginSearch";
import FlightTrajectoryMap from "@/components/convergence/FlightTrajectoryMap";
import ParetoFrontierChart from "@/components/convergence/ParetoFrontierChart";
import ConvergenceResults from "@/components/convergence/ConvergenceResults";
import Footer from "@/components/layout/Footer";
import { ConvergenceDestination, OptimizationWeights, TravelerOrigin } from "@/lib/convergence/pareto";
import { 
  ShieldCheck, 
  Layers, 
  XCircle, 
} from "lucide-react";

export default function HomePage() {
  const searchSectionRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [destinations, setDestinations] = useState<ConvergenceDestination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<ConvergenceDestination | null>(null);

  // Initial demo search on mount
  useEffect(() => {
    const defaultTravelers: TravelerOrigin[] = [
      { id: "t-1", name: "Alex (New York)", originAirportCode: "JFK", departureDate: "2026-10-15" },
      { id: "t-2", name: "Emma (London)", originAirportCode: "LHR", departureDate: "2026-10-15" },
      { id: "t-3", name: "Kenji (Tokyo)", originAirportCode: "HND", departureDate: "2026-10-15" },
    ];
    handleExecuteSearch(defaultTravelers, { priceFairness: 0.40, arrivalAlignment: 0.35, travelDuration: 0.25 });
  }, []);

  async function handleExecuteSearch(travelers: TravelerOrigin[], weights: OptimizationWeights) {
    try {
      setLoading(true);
      const res = await fetch("/api/convergence/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ travelers, weights }),
      });

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();
      if (data.success && data.destinations) {
        setDestinations(data.destinations);
        setSelectedDestination(data.destinations[0] || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function scrollToSearch() {
    searchSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <Hero onExploreClick={scrollToSearch} />

        {/* MULTI-ORIGIN SEARCH & CONVERGENCE SECTION */}
        <section ref={searchSectionRef} className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <MultiOriginSearch onSearch={handleExecuteSearch} loading={loading} />

          {/* RESULTS VISUALIZATION */}
          {selectedDestination && destinations.length > 0 && (
            <div className="mt-10 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <FlightTrajectoryMap destination={selectedDestination} />
                <ParetoFrontierChart
                  destinations={destinations}
                  selectedDestination={selectedDestination}
                  onSelect={(d) => setSelectedDestination(d)}
                />
              </div>

              <ConvergenceResults
                destinations={destinations}
                selectedDestination={selectedDestination}
                onSelect={(d) => setSelectedDestination(d)}
              />
            </div>
          )}
        </section>

        {/* ARCHITECTURAL DEEP DIVE */}
        <section id="engine-architecture" className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#052659]">
                Distributed Architecture
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#021024] sm:text-3xl">
                Atomic Multi-Party Booking vs Conventional Portals
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Conventional flight aggregators isolate each buyer into single-origin transactions. If seats sell out or fares surge on later members, the group is stranded. SkySync's Saga Orchestrator guarantees zero liability.
              </p>
            </div>

            {/* Comparison Grid */}
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {/* Conventional Flaw Card */}
              <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-6 shadow-sm">
                <div className="flex items-center gap-3 text-rose-700">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-950">Traditional Booking Breakdown</h3>
                    <p className="text-[11px] text-rose-600">Single-Origin, Independent Checkouts</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-3.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span><strong>Uncoordinated Searches:</strong> Friends open multiple tabs trying to synchronize arrival windows and balance prices manually across different time zones.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span><strong>Partial Booking Stranding:</strong> Member 1 pays, but during Member 2's checkout, the fare surges or inventory sells out completely.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span><strong>Financial Liability:</strong> The member who already paid is stuck with non-refundable tickets or steep cancellation fees without their group.</span>
                  </li>
                </ul>
              </div>

              {/* SkySync Atomic Saga Card */}
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-6 shadow-sm">
                <div className="flex items-center gap-3 text-emerald-700">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">SkySync Transactional Saga</h3>
                    <p className="text-[11px] text-emerald-600">Pareto Multi-Origin + Two-Phase Escrow</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-3.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span><strong>Pareto Optimization:</strong> Automatically solves for meeting hubs minimizing price disparity (Gini) and group arrival delta.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span><strong>Two-Phase Escrow:</strong> Authorizes holds on all member cards without capturing a single dollar until all seats are confirmed simultaneously.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span><strong>Compensating Rollback:</strong> If any single seat fails, all holds are voided instantly with zero financial risk ($0 liability).</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 5-Stage Saga Pipeline Visualizer */}
            <div className="mt-10 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
                <div className="flex items-center gap-2 text-[#052659]">
                  <Layers size={17} />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#021024]">
                    Distributed Transactional Saga Pipeline
                  </span>
                </div>
                <span className="font-mono text-[10px] font-semibold text-slate-500">
                  ACID Guarantee Across Multi-Airline Inventory
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-5">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
                  <span className="font-mono text-[10px] font-bold text-slate-400">STAGE 01</span>
                  <p className="mt-1 text-xs font-bold text-[#021024]">Redis Locks</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">TTL lock prevents seat collision and race conditions.</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
                  <span className="font-mono text-[10px] font-bold text-slate-400">STAGE 02</span>
                  <p className="mt-1 text-xs font-bold text-[#021024]">Two-Phase Escrow</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">Places pre-authorization holds ($0 captured upfront).</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
                  <span className="font-mono text-[10px] font-bold text-slate-400">STAGE 03</span>
                  <p className="mt-1 text-xs font-bold text-[#021024]">Live GDS Audit</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">Verifies live inventory and checks for fare surges.</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
                  <span className="font-mono text-[10px] font-bold text-[#021024]">Simultaneous Booking</span>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">Issues flight tickets concurrently across distinct airlines.</p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-center shadow-xs">
                  <span className="font-mono text-[10px] font-bold text-emerald-600">STAGE 05</span>
                  <p className="mt-1 text-xs font-bold text-emerald-950">Capture / Rollback</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-emerald-700">Captures on 100% success; voids all holds on fault.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}