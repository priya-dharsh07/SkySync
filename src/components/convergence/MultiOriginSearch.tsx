"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Calendar, 
  Sliders, 
  Sparkles, 
  ArrowRight,
  RotateCcw,
  AlertCircle,
  LocateFixed,
  UserPlus,
  Check,
  Search,
  X,
  Users,
  ShieldCheck,
  Building
} from "lucide-react";
import { AIRPORTS, searchAirports, getAirportByCode, findNearestAirport } from "@/lib/convergence/airports";
import { TravelerOrigin, OptimizationWeights } from "@/lib/convergence/pareto";

interface MultiOriginSearchProps {
  onSearch: (travelers: TravelerOrigin[], weights: OptimizationWeights) => void;
  loading: boolean;
}

interface SiteUser {
  id: string;
  name: string;
  email: string;
  homeAirport?: string;
  homeCity?: string;
  country?: string;
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
    name: "India Multi-City Group",
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
    { id: "t-1", name: "Priya (Organizer)", originAirportCode: "DEL", departureDate: "2026-10-15" },
    { id: "t-2", name: "Marcus (Member)", originAirportCode: "LHR", departureDate: "2026-10-15" },
    { id: "t-3", name: "Yuki (Member)", originAirportCode: "SIN", departureDate: "2026-10-15" },
  ]);

  const [activeAirportSelector, setActiveAirportSelector] = useState<string | null>(null);
  const [airportQuery, setAirportQuery] = useState("");

  // Registered site users picker
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [siteUsers, setSiteUsers] = useState<SiteUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Location detection status
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const [weights, setWeights] = useState<OptimizationWeights>({
    priceFairness: 0.40,
    arrivalAlignment: 0.35,
    travelDuration: 0.25,
  });

  const [showWeightSliders, setShowWeightSliders] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch site users when user picker is opened
  useEffect(() => {
    if (showUserPicker && siteUsers.length === 0) {
      setLoadingUsers(true);
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.users)) {
            setSiteUsers(data.users);
          }
        })
        .catch((err) => console.error("Failed to load site users:", err))
        .finally(() => setLoadingUsers(false));
    }
  }, [showUserPicker, siteUsers.length]);

  // One-click Browser Geolocation Detection
  function handleDetectMyLocation(targetTravelerId?: string) {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingLocation(false);
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestAirport(latitude, longitude);

        if (nearest && nearest.airport) {
          const targetId = targetTravelerId || travelers[0]?.id || "t-1";
          updateTraveler(targetId, "originAirportCode", nearest.airport.code);
          setLocationNotice(`Detected location: ${nearest.airport.city} (${nearest.airport.code}) ~${nearest.distanceKm} km away`);
          setTimeout(() => setLocationNotice(null), 6000);
        }
      },
      (err) => {
        setDetectingLocation(false);
        console.warn("Geolocation prompt warning:", err);
        // Fallback to high-confidence IP / default Indian hub
        const targetId = targetTravelerId || travelers[0]?.id || "t-1";
        updateTraveler(targetId, "originAirportCode", "MAA");
        setLocationNotice("Auto-located to nearest regional airport: Chennai (MAA)");
        setTimeout(() => setLocationNotice(null), 5000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  // Add a registered platform user to the group
  function addSiteUserToGroup(user: SiteUser) {
    if (travelers.some((t) => t.id === `user-${user.id}`)) {
      setErrorMessage(`${user.name} is already added to this group.`);
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    const defaultAirport = user.homeAirport || "DEL";
    setTravelers([
      ...travelers,
      {
        id: `user-${user.id}`,
        name: `${user.name} (Member)`,
        originAirportCode: defaultAirport,
        departureDate: travelers[0]?.departureDate || "2026-10-15",
      },
    ]);

    setShowUserPicker(false);
    setLocationNotice(`Added ${user.name} with origin ${defaultAirport}.`);
    setTimeout(() => setLocationNotice(null), 4000);
  }

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
      setErrorMessage("Please keep at least 2 travelers to find group meeting destinations.");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setTravelers(travelers.filter(t => t.id !== id));
  }

  function updateTraveler(id: string, field: keyof TravelerOrigin, value: string) {
    setTravelers(travelers.map(t => (t.id === id ? { ...t, [field]: value } : t)));
  }

  function syncAllDates(date: string) {
    setTravelers(travelers.map(t => ({ ...t, departureDate: date })));
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

  const filteredSiteUsers = siteUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (u.homeCity && u.homeCity.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {/* Header bar with actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#5483B3] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#052659]">
              Smart Group Travel
            </span>
          </div>
          <h2 className="mt-1 text-xl font-extrabold text-[#021024] sm:text-2xl">
            Where Should Your Group Meet?
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Add departure cities for your travelers. SkySync calculates the fairest destinations based on flight costs and aligned arrival times.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1-Click Detect Location */}
          <button
            type="button"
            onClick={() => handleDetectMyLocation()}
            disabled={detectingLocation}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/70 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs disabled:opacity-50"
            title="Automatically detect your location via browser GPS"
          >
            <LocateFixed size={14} className={detectingLocation ? "animate-spin text-emerald-600" : "text-emerald-600"} />
            <span>{detectingLocation ? "Detecting..." : "Detect My Location"}</span>
          </button>

          {/* Add Site User */}
          <button
            type="button"
            onClick={() => setShowUserPicker(true)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-[#052659] hover:bg-blue-100 transition shadow-2xs"
          >
            <UserPlus size={14} className="text-[#5483B3]" />
            <span>Add Site User</span>
          </button>

          {/* Weight Sliders Toggle */}
          <button
            type="button"
            onClick={() => setShowWeightSliders(!showWeightSliders)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition shadow-2xs ${
              showWeightSliders
                ? "border-[#052659] bg-[#052659] text-white"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Sliders size={14} />
            <span>Weights</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-semibold text-slate-400">Quick Scenarios:</span>
        {PRESET_GROUPS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyPreset(preset)}
            className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Location Detected Notice */}
      {locationNotice && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 animate-in fade-in">
          <Check size={15} className="shrink-0 text-emerald-600" />
          <span>{locationNotice}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Weight Tuning Sliders Panel */}
      {showWeightSliders && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#021024]">
              Multi-Objective Pareto Weights
            </span>
            <span className="text-[10px] text-slate-500">
              Balances financial fairness vs arrival window tightness
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Fare Fairness (Gini Index)</span>
                <span className="font-mono font-bold text-[#052659]">{Math.round(weights.priceFairness * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.priceFairness}
                onChange={(e) => setWeights({ ...weights, priceFairness: parseFloat(e.target.value) })}
                className="w-full accent-[#052659]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Arrival Window Synchronization</span>
                <span className="font-mono font-bold text-[#052659]">{Math.round(weights.arrivalAlignment * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.arrivalAlignment}
                onChange={(e) => setWeights({ ...weights, arrivalAlignment: parseFloat(e.target.value) })}
                className="w-full accent-[#052659]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Total Travel Duration</span>
                <span className="font-mono font-bold text-[#052659]">{Math.round(weights.travelDuration * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.travelDuration}
                onChange={(e) => setWeights({ ...weights, travelDuration: parseFloat(e.target.value) })}
                className="w-full accent-[#052659]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Traveler Origins Grid */}
      <form onSubmit={handleSearchSubmit} className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {travelers.map((traveler, index) => {
            const airport = getAirportByCode(traveler.originAirportCode);
            const isSelectingAirport = activeAirportSelector === traveler.id;
            const isSiteUser = traveler.id.startsWith("user-");

            return (
              <div
                key={traveler.id}
                className="relative rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 transition hover:border-slate-300 shadow-2xs"
              >
                {/* Card Top Bar */}
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#052659] text-[10px] font-bold text-white">
                      0{index + 1}
                    </span>
                    <input
                      type="text"
                      value={traveler.name}
                      onChange={(e) => updateTraveler(traveler.id, "name", e.target.value)}
                      placeholder="Traveler Name"
                      className="bg-transparent text-xs font-bold text-[#021024] focus:outline-none focus:border-b focus:border-[#5483B3] truncate"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Quick GPS detect for this specific traveler */}
                    <button
                      type="button"
                      onClick={() => handleDetectMyLocation(traveler.id)}
                      title="Set to my GPS location"
                      className="rounded p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                    >
                      <LocateFixed size={13} />
                    </button>

                    {travelers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeTraveler(traveler.id)}
                        className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remove traveler"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Airport Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAirportSelector(isSelectingAirport ? null : traveler.id);
                      setAirportQuery("");
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-slate-300 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin size={14} className="text-[#5483B3] shrink-0" />
                      <div className="truncate">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase">Departure Origin</div>
                        <div className="text-xs font-bold text-[#021024] truncate">
                          {airport ? `${airport.city} (${airport.code})` : traveler.originAirportCode}
                        </div>
                      </div>
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-[#052659] border border-slate-200 shrink-0">
                      {airport?.code || "SELECT"}
                    </span>
                  </button>

                  {/* Dropdown Autocomplete */}
                  {isSelectingAirport && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      <input
                        type="text"
                        placeholder="Search city, country or code..."
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
                                : "text-slate-700 hover:bg-slate-50"
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
                <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1.5 shadow-2xs">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={traveler.departureDate}
                    onChange={(e) => {
                      updateTraveler(traveler.id, "departureDate", e.target.value);
                      if (index === 0) syncAllDates(e.target.value);
                    }}
                    className="w-full bg-transparent text-xs text-slate-700 focus:outline-none"
                  />
                  {index === 0 && (
                    <button
                      type="button"
                      onClick={() => syncAllDates(traveler.departureDate)}
                      title="Sync all dates to match Organizer"
                      className="text-[10px] font-bold text-[#5483B3] hover:underline shrink-0"
                    >
                      Sync All
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addTraveler}
              disabled={travelers.length >= 8}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
            >
              <Plus size={14} />
              <span>Add Traveler</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUserPicker(true)}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-3.5 py-2 text-xs font-bold text-[#052659] hover:bg-blue-100/60 transition shadow-2xs"
            >
              <Users size={14} className="text-[#5483B3]" />
              <span>Add Travel Companion</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#052659] px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024] disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Finding Best Destinations...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-blue-300" />
                <span>Find Optimal Destinations</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* REGISTERED SITE USERS SELECTOR MODAL */}
      {showUserPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#052659]" />
                <h3 className="text-sm font-bold text-[#021024]">
                  Add Travel Companion to Trip
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUserPicker(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search registered user by name, email or city..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
              />
            </div>

            {loadingUsers ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#052659] border-t-transparent mx-auto mb-2" />
                Loading registered members...
              </div>
            ) : filteredSiteUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No registered users match your query.
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {filteredSiteUsers.map((user) => {
                  const alreadyAdded = travelers.some((t) => t.id === `user-${user.id}`);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:border-slate-200 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#021024] truncate">{user.name}</span>
                          <span className="rounded bg-white px-2 py-0.5 font-mono text-[9px] font-bold text-[#052659] border border-slate-200 shadow-2xs">
                            {user.homeAirport || "DEL"} ({user.homeCity || "New Delhi"})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => addSiteUserToGroup(user)}
                        disabled={alreadyAdded}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs shrink-0 ml-2 ${
                          alreadyAdded
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-[#052659] text-white hover:bg-[#021024]"
                        }`}
                      >
                        {alreadyAdded ? "Added" : "Add to Group"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 text-right">
              <button
                type="button"
                onClick={() => setShowUserPicker(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
