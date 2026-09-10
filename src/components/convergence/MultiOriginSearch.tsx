"use client";

import { useState } from "react";
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Calendar, 
  Sliders, 
  Sparkles, 
  ArrowRight,
  RotateCcw,
  AlertCircle
} from "lucide-react";
import { AIRPORTS, searchAirports, getAirportByCode } from "@/lib/convergence/airports";
import { TravelerOrigin, OptimizationWeights } from "@/lib/convergence/pareto";

interface MultiOriginSearchProps {
  onSearch: (travelers: TravelerOrigin[], weights: OptimizationWeights) => void;
  loading: boolean;
}

const PRESET_GROUPS = [
  {
    name: "Global Tech Team",
    desc: "New York + London + Tokyo",
    travelers: [
      { id: "t-1", name: "Alex Chen", originAirportCode: "JFK", departureDate: "2026-10-15" },
      { id: "t-2", name: "Emma Watson", originAirportCode: "LHR", departureDate: "2026-10-15" },
      { id: "t-3", name: "Kenji Sato", originAirportCode: "HND", departureDate: "2026-10-15" },
    ],
  },
  {
    name: "India Distributed Hub",
    desc: "Chennai + Delhi + Mumbai + Bengaluru",
    travelers: [
      { id: "t-1", name: "Priya Sundaram", originAirportCode: "MAA", departureDate: "2026-10-15" },
      { id: "t-2", name: "Rohan Verma", originAirportCode: "DEL", departureDate: "2026-10-15" },
      { id: "t-3", name: "Ananya Iyer", originAirportCode: "BOM", departureDate: "2026-10-15" },
      { id: "t-4", name: "Karthik Nair", originAirportCode: "BLR", departureDate: "2026-10-15" },
    ],
  },
  {
    name: "Euro-American Founders",
    desc: "San Francisco + Paris + Frankfurt",
    travelers: [
      { id: "t-1", name: "Sarah Jenkins", originAirportCode: "SFO", departureDate: "2026-10-15" },
      { id: "t-2", name: "Lucas Moreau", originAirportCode: "CDG", departureDate: "2026-10-15" },
      { id: "t-3", name: "Maximilian Koch", originAirportCode: "FRA", departureDate: "2026-10-15" },
    ],
  },
];

export default function MultiOriginSearch({ onSearch, loading }: MultiOriginSearchProps) {
  const [travelers, setTravelers] = useState<TravelerOrigin[]>([
    { id: "t-1", name: "Priya (Organizer)", originAirportCode: "JFK", departureDate: "2026-10-15" },
    { id: "t-2", name: "Marcus (Member)", originAirportCode: "LHR", departureDate: "2026-10-15" },
    { id: "t-3", name: "Yuki (Member)", originAirportCode: "SIN", departureDate: "2026-10-15" },
  ]);

  const [activeAirportSelector, setActiveAirportSelector] = useState<string | null>(null);
  const [airportQuery, setAirportQuery] = useState("");

  const [weights, setWeights] = useState<OptimizationWeights>({
    priceFairness: 0.40,
    arrivalAlignment: 0.35,
    travelDuration: 0.25,
  });

  const [showWeightSliders, setShowWeightSliders] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function addTraveler() {
    if (travelers.length >= 8) return;
    const newIdx = travelers.length + 1;
    const unusedAirports = AIRPORTS.filter(a => !travelers.some(t => t.originAirportCode === a.code));
    const nextAirport = unusedAirports.length > 0 ? unusedAirports[0].code : "DEL";

    setTravelers([
      ...travelers,
      {
        id: `t-${Date.now()}`,
        name: `Traveler ${newIdx}`,
        originAirportCode: nextAirport,
        departureDate: travelers[0]?.departureDate || "2026-10-15",
      },
    ]);
  }

  function removeTraveler(id: string) {
    if (travelers.length <= 2) {
      setErrorMessage("At least 2 traveler origins are required for Pareto convergence.");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setTravelers(travelers.filter(t => t.id !== id));
  }

  function updateTraveler(id: string, field: keyof TravelerOrigin, value: string) {
    setTravelers(travelers.map(t => (t.id === id ? { ...t, [field]: value } : t)));
  }

  function applyPreset(preset: typeof PRESET_GROUPS[0]) {
    setTravelers(JSON.parse(JSON.stringify(preset.travelers)));
    setErrorMessage(null);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const originCodes = travelers.map(t => t.originAirportCode.toUpperCase());
    const uniqueCodes = new Set(originCodes);
    if (uniqueCodes.size < 2) {
      setErrorMessage("Please select at least 2 distinct departure origin cities.");
      return;
    }

    setErrorMessage(null);
    onSearch(travelers, weights);
  }

  const filteredAirports = searchAirports(airportQuery);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header bar with presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#5483B3]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#052659]">
              Multi-Origin Convergence
            </span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-[#021024] sm:text-2xl">
            Where Should Your Group Meet?
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Define origins to compute the Pareto-optimal meeting cities balancing price fairness and arrival windows.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">Scenarios:</span>
          {PRESET_GROUPS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Traveler Origins Grid */}
      <form onSubmit={handleSearchSubmit} className="mt-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {travelers.map((traveler, index) => {
            const airport = getAirportByCode(traveler.originAirportCode);
            const isSelectingAirport = activeAirportSelector === traveler.id;

            return (
              <div
                key={traveler.id}
                className="relative rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 transition hover:border-slate-300"
              >
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#052659] text-[10px] font-bold text-white">
                      0{index + 1}
                    </span>
                    <input
                      type="text"
                      value={traveler.name}
                      onChange={(e) => updateTraveler(traveler.id, "name", e.target.value)}
                      placeholder="Traveler Name"
                      className="bg-transparent text-xs font-semibold text-[#021024] focus:outline-none focus:border-b focus:border-[#5483B3]"
                    />
                  </div>

                  {travelers.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeTraveler(traveler.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Remove traveler"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Airport Selector Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAirportSelector(isSelectingAirport ? null : traveler.id);
                      setAirportQuery("");
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-left transition hover:border-slate-300 shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#5483B3]" />
                      <div>
                        <div className="text-[10px] font-medium text-slate-500">Origin City</div>
                        <div className="text-xs font-bold text-[#021024] truncate max-w-[140px]">
                          {airport ? `${airport.city} (${airport.code})` : traveler.originAirportCode}
                        </div>
                      </div>
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-[#052659] border border-slate-200">
                      {airport?.code || "SELECT"}
                    </span>
                  </button>

                  {/* Dropdown Airport Autocomplete */}
                  {isSelectingAirport && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      <input
                        type="text"
                        placeholder="Search city or code..."
                        value={airportQuery}
                        onChange={(e) => setAirportQuery(e.target.value)}
                        autoFocus
                        className="mb-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-[#021024] placeholder-slate-400 focus:border-[#052659] focus:outline-none"
                      />
                      <div className="space-y-0.5">
                        {filteredAirports.map((item) => (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => {
                              updateTraveler(traveler.id, "originAirportCode", item.code);
                              setActiveAirportSelector(null);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                              traveler.originAirportCode === item.code
                                ? "bg-slate-100 text-[#052659] font-bold"
                                : "text-slate-700 hover:bg-slate-50 hover:text-[#021024]"
                            }`}
                          >
                            <div>
                              <span className="font-semibold">{item.city}</span>
                              <span className="ml-1 text-[10px] text-slate-400">{item.country}</span>
                            </div>
                            <span className="font-mono text-xs font-bold text-[#5483B3]">{item.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Departure Date */}
                <div className="mt-2.5 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar size={12} />
                    <span className="text-[10px]">Departure</span>
                  </div>
                  <input
                    type="date"
                    value={traveler.departureDate}
                    onChange={(e) => updateTraveler(traveler.id, "departureDate", e.target.value)}
                    className="bg-transparent text-xs font-medium text-[#021024] focus:outline-none"
                  />
                </div>
              </div>
            );
          })}

          {/* Add Traveler Card */}
          {travelers.length < 8 && (
            <button
              type="button"
              onClick={addTraveler}
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-[#F8FAFC] p-4 text-slate-500 transition hover:border-[#052659] hover:text-[#052659] hover:bg-white"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-[#052659] shadow-xs">
                <Plus size={16} />
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-[#021024]">Add Origin</div>
                <div className="text-[10px] text-slate-400">{travelers.length + 1} travelers total</div>
              </div>
            </button>
          )}
        </div>

        {/* Action Controls & Pareto Objective Sliders */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowWeightSliders(!showWeightSliders)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              <Sliders size={13} className="text-[#5483B3]" />
              <span>{showWeightSliders ? "Hide" : "Tune"} Weights</span>
              <span className="rounded bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 text-[10px] font-semibold">
                Fairness {Math.round(weights.priceFairness * 100)}%
              </span>
            </button>

            <button
              type="button"
              onClick={() => setWeights({ priceFairness: 0.40, arrivalAlignment: 0.35, travelDuration: 0.25 })}
              className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 p-1"
              title="Reset weights"
            >
              <RotateCcw size={11} />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#052659] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024] disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Computing Pareto Frontier...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-[#C1E8FF]" />
                <span>Discover Meeting Hubs</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        {/* Expandable Pareto Weights Sliders */}
        {showWeightSliders && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#052659]">
                Pareto Optimization Objectives
              </span>
              <span className="text-[10px] text-slate-500">
                Adjust priorities for the multi-objective ranking algorithm
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">Price Fairness</span>
                  <span className="text-[#052659] font-bold">{Math.round(weights.priceFairness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weights.priceFairness}
                  onChange={(e) => setWeights({ ...weights, priceFairness: parseFloat(e.target.value) })}
                  className="mt-1.5 w-full accent-[#052659] cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Minimizes fare disparity (Gini index).</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">Arrival Sync</span>
                  <span className="text-[#052659] font-bold">{Math.round(weights.arrivalAlignment * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weights.arrivalAlignment}
                  onChange={(e) => setWeights({ ...weights, arrivalAlignment: parseFloat(e.target.value) })}
                  className="mt-1.5 w-full accent-[#052659] cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Minimizes arrival delta between members.</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">Transit Time</span>
                  <span className="text-[#052659] font-bold">{Math.round(weights.travelDuration * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weights.travelDuration}
                  onChange={(e) => setWeights({ ...weights, travelDuration: parseFloat(e.target.value) })}
                  className="mt-1.5 w-full accent-[#052659] cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Optimizes aggregate travel hours.</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
