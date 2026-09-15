"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Plane,
  Search,
  Users,
  MapPin,
  SlidersHorizontal,
  Minus,
  Plus,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import { AIRPORTS, Airport as AirportItem } from "@/lib/convergence/airports";

type Flight = {
  _id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  arrivalDate?: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  availableSeats: number;
  totalSeats: number;
  class?: string;
  type: "domestic" | "international";
  status: "scheduled" | "delayed" | "cancelled";
  isLiveAPI?: boolean;
};

export default function FlightsPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDepartureDate, setSearchDepartureDate] = useState("");
  const [searchPassengers, setSearchPassengers] = useState(1);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const [tripType, setTripType] = useState<"all" | "domestic" | "international">("all");
  const [sortBy, setSortBy] = useState<"price" | "duration" | "departure">("price");

  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      await fetchFlights();
    }
    loadInitial();
  }, []);

  async function fetchFlights(params?: { from?: string; to?: string; date?: string; passengers?: number }) {
    try {
      setLoading(true);
      setError("");

      const url = new URL("/api/flights", window.location.origin);
      if (params?.from) url.searchParams.set("from", params.from);
      if (params?.to) url.searchParams.set("to", params.to);
      if (params?.date) url.searchParams.set("date", params.date);
      if (params?.passengers) url.searchParams.set("passengers", String(params.passengers));

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load flights");
      const data = await res.json();
      setFlights(data.flights || []);
    } catch (err: any) {
      setError(err.message || "Failed to load flights");
    } finally {
      setLoading(false);
    }
  }

  // Global airports list for autocomplete dropdowns
  const availableAirports = AIRPORTS;

  const filteredOrigins = useMemo(() => {
    if (!from.trim()) return [];
    const query = from.toLowerCase().trim();
    return availableAirports
      .filter(
        (a) =>
          a.city.toLowerCase().includes(query) ||
          a.code.toLowerCase().includes(query) ||
          a.country.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [availableAirports, from]);

  const filteredDestinations = useMemo(() => {
    if (!to.trim()) return [];
    const query = to.toLowerCase().trim();
    return availableAirports
      .filter(
        (a) =>
          a.city.toLowerCase().includes(query) ||
          a.code.toLowerCase().includes(query) ||
          a.country.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [availableAirports, to]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedFrom = from.trim().toUpperCase();
    const normalizedTo = to.trim().toUpperCase();

    // Find matched airport by code or city
    const matchedOrigin = availableAirports.find(
      (a) => a.code.toUpperCase() === normalizedFrom || a.city.toLowerCase() === from.trim().toLowerCase()
    );
    const matchedDestination = availableAirports.find(
      (a) => a.code.toUpperCase() === normalizedTo || a.city.toLowerCase() === to.trim().toLowerCase()
    );

    const fromCode = matchedOrigin?.code || normalizedFrom;
    const toCode = matchedDestination?.code || normalizedTo;

    setSearchFrom(fromCode);
    setSearchTo(toCode);
    setSearchDepartureDate(departureDate);
    setSearchPassengers(passengers);
    setSearchPerformed(true);

    setShowFromSuggestions(false);
    setShowToSuggestions(false);

    // Trigger dynamic live query to API route
    await fetchFlights({
      from: fromCode,
      to: toCode,
      date: departureDate,
      passengers,
    });
  }

  const filteredFlights = useMemo(() => {
    let result = [...flights];

    if (searchPerformed) {
      if (searchFrom) {
        const search = searchFrom.trim().toLowerCase();
        result = result.filter(
          (f) =>
            f.originCode.toLowerCase() === search ||
            f.origin.toLowerCase().includes(search)
        );
      }
      if (searchTo) {
        const search = searchTo.trim().toLowerCase();
        result = result.filter(
          (f) =>
            f.destinationCode.toLowerCase() === search ||
            f.destination.toLowerCase().includes(search)
        );
      }
      if (searchDepartureDate) {
        result = result.filter((f) => f.departureDate === searchDepartureDate);
      }
    }

    if (tripType !== "all") {
      result = result.filter((f) => f.type === tripType);
    }

    result.sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "duration") return a.duration - b.duration;
      return a.departureTime.localeCompare(b.departureTime);
    });

    return result;
  }, [flights, searchPerformed, searchFrom, searchTo, searchDepartureDate, tripType, sortBy]);

  function selectFlight(flight: Flight) {
    const selectedPassengerCount = searchPerformed ? searchPassengers : passengers;
    if (flight.availableSeats < selectedPassengerCount) return;

    sessionStorage.setItem("selectedFlight", JSON.stringify(flight));
    sessionStorage.setItem("passengers", String(selectedPassengerCount));
    sessionStorage.removeItem("selectedClass");
    sessionStorage.removeItem("selectedSeats");

    window.location.href = "/booking/passengers";
  }

  function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#021024]">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        {/* Scenic Flight Search Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[#021024] via-[#052659] to-[#021024] mb-6 p-6 sm:p-8 shadow-md text-white">

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-white/10 px-3 py-0.5 text-[11px] font-bold text-[#C1E8FF] backdrop-blur-md">
              <Plane size={13} />
              <span>Real-Time Airline Schedule Search</span>
            </div>
            <h1 style={{ color: "#ffffff" }} className="mt-2 text-2xl font-black text-white !text-white drop-shadow-md sm:text-3xl">
              Explore Live Scheduled Flights
            </h1>
            <p className="mt-1 text-xs text-blue-100/90 font-medium">
              Compare non-stop and connecting routes across leading international carriers with verified seat allocations.
            </p>
          </div>
        </div>

        {/* Search Header Form */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-2xs p-5 shadow-sm">
          <form onSubmit={handleSearch}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
              {/* FROM */}
              <div className="relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Origin</label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <MapPin size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Departure city or code..."
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      setShowFromSuggestions(true);
                    }}
                    onFocus={() => setShowFromSuggestions(true)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-3 text-xs text-[#021024] placeholder-slate-400 focus:border-[#5483B3] focus:bg-white focus:outline-none"
                  />
                </div>

                {showFromSuggestions && filteredOrigins.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    {filteredOrigins.map((airport) => (
                      <button
                        key={airport.code}
                        type="button"
                        onClick={() => {
                          setFrom(airport.code);
                          setShowFromSuggestions(false);
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <span>{airport.city}</span>
                        <span className="font-mono text-[11px] font-bold text-[#052659]">{airport.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* TO */}
              <div className="relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Destination</label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <MapPin size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Arrival city or code..."
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setShowToSuggestions(true);
                    }}
                    onFocus={() => setShowToSuggestions(true)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-3 text-xs text-[#021024] placeholder-slate-400 focus:border-[#5483B3] focus:bg-white focus:outline-none"
                  />
                </div>

                {showToSuggestions && filteredDestinations.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    {filteredDestinations.map((airport) => (
                      <button
                        key={airport.code}
                        type="button"
                        onClick={() => {
                          setTo(airport.code);
                          setShowToSuggestions(false);
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <span>{airport.city}</span>
                        <span className="font-mono text-[11px] font-bold text-[#052659]">{airport.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* DATE */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Departure Date</label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <CalendarDays size={14} />
                  </div>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-3 text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* PASSENGERS */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Passengers</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => setPassengers(Math.max(1, passengers - 1))}
                    className="text-slate-400 hover:text-[#021024]"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="font-mono text-xs font-bold text-[#021024]">{passengers}</span>
                  <button
                    type="button"
                    onClick={() => setPassengers(Math.min(9, passengers + 1))}
                    className="text-slate-400 hover:text-[#021024]"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* SEARCH BUTTON */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#052659] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024]"
                >
                  <Search size={14} />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results Layout: Filters Sidebar & Flight List */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* Sidebar Filters */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-xs font-bold text-[#021024]">
                <SlidersHorizontal size={14} className="text-[#052659]" />
                <span>Filters</span>
              </div>

              {/* Trip Type */}
              <div className="mt-3 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Route Type</span>
                {(["all", "domestic", "international"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTripType(t)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                      tripType === t
                        ? "bg-blue-50 text-[#052659] font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#021024]"
                    }`}
                  >
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>

              {/* Sort By */}
              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Sort Flights</span>
                {(["price", "duration", "departure"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSortBy(s)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                      sortBy === s
                        ? "bg-blue-50 text-[#052659] font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#021024]"
                    }`}
                  >
                    <span className="capitalize">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Flights Cards List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Showing <strong>{filteredFlights.length}</strong> available flights</span>
              {searchPerformed && (
                <button
                  onClick={() => {
                    setSearchPerformed(false);
                    setFrom("");
                    setTo("");
                    setDepartureDate("");
                  }}
                  className="font-semibold text-[#052659] hover:underline"
                >
                  Reset Search
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#052659] border-t-transparent" />
                <span className="text-xs text-slate-500">Loading flight network...</span>
              </div>
            ) : filteredFlights.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-center p-6 shadow-sm">
                <Plane size={28} className="text-slate-400" />
                <h3 className="text-sm font-bold text-[#021024]">No Flights Found</h3>
                <p className="text-xs text-slate-500">Try adjusting your origin, destination, or date filters.</p>
              </div>
            ) : (
              filteredFlights.map((flight) => (
                <div
                  key={flight._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Airline & Number */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-mono text-xs font-bold text-[#C1E8FF] shadow-sm">
                        {flight.airlineCode}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#021024]">{flight.airline}</span>
                          {flight.isLiveAPI && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-700 border border-emerald-200">
                              Live API
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                          <span>{flight.flightNumber}</span>
                          <span>•</span>
                          <span>{flight.origin} → {flight.destination}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Timing */}
                    <div className="flex items-center gap-6 text-center">
                      <div>
                        <div className="text-base font-bold text-[#021024]">{flight.departureTime}</div>
                        <div className="font-mono text-[11px] font-semibold text-slate-500">{flight.originCode}</div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-medium text-slate-500">{formatDuration(flight.duration)}</span>
                        <div className="relative my-1 w-24 border-t border-slate-200">
                          <Plane size={11} className="absolute left-1/2 -top-1.5 -translate-x-1/2 text-[#5483B3]" />
                        </div>
                        <span className="text-[9px] font-semibold uppercase text-slate-400">{flight.type}</span>
                      </div>

                      <div>
                        <div className="text-base font-bold text-[#021024]">{flight.arrivalTime}</div>
                        <div className="font-mono text-[11px] font-semibold text-slate-500">{flight.destinationCode}</div>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Fare</div>
                        <div className="font-mono text-base font-bold text-[#052659]">₹{flight.price}</div>
                        <div className="text-[10px] font-medium text-emerald-600">{flight.availableSeats} seats left</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => selectFlight(flight)}
                        className="rounded-xl bg-[#052659] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024]"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Convergence Engine Architecture Section */}
        <section id="engine-architecture" className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5483B3]">
            <SlidersHorizontal size={14} />
            <span>Algorithmic Architecture</span>
          </div>
          <h2 className="mt-2 text-2xl font-extrabold text-[#021024] sm:text-3xl">
            Pareto Convergence Engine Architecture
          </h2>
          <p className="mt-2 text-xs text-slate-600 max-w-3xl leading-relaxed">
            SkySync's core routing engine uses multi-objective Pareto optimization to resolve multi-origin travel scheduling conflicts across distributed group members. By balancing arrival time variance, individual ticket fares, and total travel time, the system computes the global spatial center-of-mass meeting hub.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#052659] text-white font-mono text-xs font-bold">
                01
              </div>
              <h3 className="text-sm font-bold text-[#021024]">Spatial Center of Mass</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Calculates geodesic coordinates and flight distance bounds for all group origins.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#052659] text-white font-mono text-xs font-bold">
                02
              </div>
              <h3 className="text-sm font-bold text-[#021024]">Fare Equity & Window Alignment</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Minimizes variance in price distribution and landing windows across international carriers.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#052659] text-white font-mono text-xs font-bold">
                03
              </div>
              <h3 className="text-sm font-bold text-[#021024]">Real-Time Database Sync</h3>
              <p className="text-xs text-slate-500 leading-normal">
                All selected itineraries, passenger profiles, and seat assignments are persisted directly to MongoDB Atlas.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}