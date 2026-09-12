"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  Check, 
  Plane, 
  Users, 
  Info, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  Layers, 
  Zap, 
  Clock, 
  Tv, 
  BatteryCharging,
  Armchair
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAircraftLayoutForFlight, AircraftLayout, SeatItem } from "@/lib/seats/aircraftLayouts";

export default function SelectSeatsPage() {
  const [flight, setFlight] = useState<any>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [activePassengerIdx, setActivePassengerIdx] = useState(0);
  const [is3DMode, setIs3DMode] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<Record<number, string>>({});
  const [hoveredSeat, setHoveredSeat] = useState<SeatItem | null>(null);
  const [holdTtlSeconds, setHoldTtlSeconds] = useState(599); // 10-minute hold

  // Load flight and passenger details from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedFlight = sessionStorage.getItem("selectedFlight");
        if (storedFlight) {
          setFlight(JSON.parse(storedFlight));
        }

        const storedPassengers = sessionStorage.getItem("passengerDetails");
        if (storedPassengers) {
          const parsed = JSON.parse(storedPassengers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPassengers(parsed);
          }
        } else {
          const count = parseInt(sessionStorage.getItem("passengers") || "1", 10);
          const initial = [];
          for (let i = 0; i < count; i++) {
            initial.push({ firstName: `Traveler`, lastName: `${i + 1}`, email: `traveler${i + 1}@skysync.app` });
          }
          setPassengers(initial);
        }

        const prevSeats = sessionStorage.getItem("selectedSeats");
        if (prevSeats) {
          const arr = JSON.parse(prevSeats);
          if (Array.isArray(arr)) {
            const initialMap: Record<number, string> = {};
            arr.forEach((seatId, idx) => {
              initialMap[idx] = seatId;
            });
            setSelectedSeats(initialMap);
          }
        }
      } catch (e) {
        console.error("Failed loading booking state:", e);
      }
    }
  }, []);

  // Redis simulated hold countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setHoldTtlSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const layout: AircraftLayout = useMemo(() => {
    return getAircraftLayoutForFlight(flight);
  }, [flight]);

  const passengerCount = passengers.length > 0 ? passengers.length : 1;

  // Selected seat list array
  const selectedSeatIds = useMemo(() => {
    return Object.values(selectedSeats).filter(Boolean);
  }, [selectedSeats]);

  const totalSeatFee = useMemo(() => {
    let fee = 0;
    selectedSeatIds.forEach((seatId) => {
      const seat = layout.seats.find((s) => s.id === seatId);
      if (seat) fee += seat.priceInr;
    });
    return fee;
  }, [selectedSeatIds, layout]);

  function handleSeatClick(seat: SeatItem) {
    if (seat.isOccupied) return;

    // Check if this seat is already picked by another passenger
    const existingEntry = Object.entries(selectedSeats).find(([, val]) => val === seat.id);

    if (existingEntry) {
      const passengerIdx = parseInt(existingEntry[0], 10);
      // Deselect
      const next = { ...selectedSeats };
      delete next[passengerIdx];
      setSelectedSeats(next);
      setActivePassengerIdx(passengerIdx);
      return;
    }

    // Assign to current active passenger
    const next = { ...selectedSeats, [activePassengerIdx]: seat.id };
    setSelectedSeats(next);

    // Auto-advance to next unassigned passenger if any
    for (let i = 0; i < passengerCount; i++) {
      if (!next[i]) {
        setActivePassengerIdx(i);
        return;
      }
    }
  }

  function handleContinueToPayment() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedSeats", JSON.stringify(selectedSeatIds));
      window.location.href = "/booking/payment";
    }
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Group seats by row for clean fuselage rendering
  const seatsByRow = useMemo(() => {
    const map = new Map<number, SeatItem[]>();
    for (let r = 1; r <= layout.totalRows; r++) {
      map.set(r, []);
    }
    layout.seats.forEach((seat) => {
      const rowList = map.get(seat.row);
      if (rowList) rowList.push(seat);
    });
    return map;
  }, [layout]);

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#021024]">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        {/* Navigation back and progress indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <Link
            href="/booking/passengers"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#052659] transition"
          >
            <ArrowLeft size={14} /> Back to Passenger Details
          </Link>

          {/* Stepper */}
          <div className="hidden items-center gap-2 text-xs sm:flex">
            <span className="text-slate-400">01. Flight</span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-400">02. Passengers</span>
            <span className="text-slate-300">→</span>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-[#052659] border border-blue-200">
              03. 3D Seatmap (Active)
            </span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-400">04. Payment Gateway</span>
          </div>
        </div>

        {/* Cabin Visual Banner */}
        <div className="relative overflow-hidden mt-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-[#021024] via-[#052659] to-[#021024] p-6 sm:p-8 shadow-md text-white">

          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#C1E8FF] border border-white/20 backdrop-blur-md">
                  <Plane size={12} /> {layout.manufacturer} {layout.model}
                </span>
                <span className="font-mono text-xs text-blue-200 font-semibold">
                  {layout.cabinType}
                </span>
              </div>
              <h1 
                className="mt-2 text-2xl font-extrabold tracking-tight !text-white sm:text-3xl"
                style={{ color: "#ffffff" }}
              >
                Interactive Cabin Seat Selection
              </h1>
              <p className="mt-1 text-xs text-blue-100/85">
                Explore real-time seat availability across standard, extra legroom, and front rows.
              </p>
            </div>

            {/* 3D View Toggle & Hold Timer */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/20 px-3.5 py-2 text-xs text-amber-200 backdrop-blur-md">
                <Clock size={15} className="text-amber-300" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-amber-300/80 block leading-tight">Seats Held For</span>
                  <span className="font-mono font-extrabold text-xs text-white">{formatTimer(holdTtlSeconds)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIs3DMode(!is3DMode)}
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#052659] shadow-sm hover:bg-blue-50 transition"
              >
                {is3DMode ? <Layers size={14} className="text-[#052659]" /> : <Eye size={14} className="text-[#052659]" />}
                <span>{is3DMode ? "3D Perspective" : "2D Flat View"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Passenger Seat Allocation Tabs (for multi-passengers) */}
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#052659]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#021024]">
                Passenger Seat Assignment ({passengerCount} Travelers)
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Click a passenger to assign their seat from the cabin map below
            </span>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {passengers.map((p, idx) => {
              const assignedSeat = selectedSeats[idx];
              const isActive = activePassengerIdx === idx;
              const seatDetails = assignedSeat ? layout.seats.find((s) => s.id === assignedSeat) : null;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePassengerIdx(idx)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                    isActive
                      ? "border-[#5483B3] bg-blue-50/50 ring-2 ring-blue-200 shadow-sm"
                      : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        assignedSeat
                          ? "bg-emerald-600 text-white"
                          : isActive
                          ? "bg-[#052659] text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#021024] truncate">
                        {p.firstName || `Passenger ${idx + 1}`} {p.lastName || ""}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {seatDetails ? `${seatDetails.cabin.replace("_", " ")} • ₹${seatDetails.priceInr}` : "No seat selected"}
                      </div>
                    </div>
                  </div>

                  <div className="ml-2 shrink-0">
                    {assignedSeat ? (
                      <span className="font-mono text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                        {assignedSeat}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Select
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Fuselage Aircraft vs Sidebar Summary */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Fuselage Map Section */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Armchair size={16} className="text-[#052659]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#021024]">
                  Interactive Fuselage Floorplan
                </h3>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded border border-slate-300 bg-white shadow-2xs" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded bg-emerald-600 text-white font-bold" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded bg-slate-200 border border-slate-300" />
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded border border-purple-300 bg-purple-100" />
                  <span>Exit / Premium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded border border-blue-300 bg-blue-100" />
                  <span>Business</span>
                </div>
              </div>
            </div>

            {/* 3D Perspective Fuselage Outer Wrapper */}
            <div
              className={`mt-6 transition-all duration-500 ease-out flex justify-center ${
                is3DMode
                  ? "perspective-[1400px]"
                  : ""
              }`}
            >
              {/* Aircraft Fuselage Tube Body */}
              <div
                className={`relative w-full max-w-[560px] rounded-[60px] border-4 border-slate-300 bg-gradient-to-b from-slate-100 via-white to-slate-100 p-6 shadow-2xl transition-transform duration-500 ${
                  is3DMode
                    ? "rotate-x-[14deg] scale-[0.97] shadow-[0_30px_60px_rgba(2,16,36,0.18)]"
                    : ""
                }`}
              >
                {/* Left Aircraft Wing Winglet */}
                <div className="absolute -left-12 top-[38%] hidden h-48 w-12 rounded-l-full bg-gradient-to-l from-slate-300 to-slate-200 border-l border-slate-400 opacity-70 lg:block shadow-md">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-500 uppercase rotate-90 tracking-widest">
                    Port Wing
                  </div>
                </div>

                {/* Right Aircraft Wing Winglet */}
                <div className="absolute -right-12 top-[38%] hidden h-48 w-12 rounded-r-full bg-gradient-to-r from-slate-300 to-slate-200 border-r border-slate-400 opacity-70 lg:block shadow-md">
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-500 uppercase -rotate-90 tracking-widest">
                    Stbd Wing
                  </div>
                </div>

                {/* Aerodynamic Cockpit Front */}
                <div className="relative mb-6 rounded-t-[100px] border-b-2 border-slate-300 bg-gradient-to-b from-slate-900 to-[#052659] pt-8 pb-5 text-center text-white shadow-md">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-xs mb-1">
                    <Plane className="rotate-90 text-[#C1E8FF]" size={20} />
                  </div>
                  <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#C1E8FF]">
                    {layout.manufacturer} Cockpit Front
                  </span>
                  <div className="mt-1 flex items-center justify-center gap-4 text-[10px] text-slate-300">
                    <span>Galley 1L</span>
                    <span>•</span>
                    <span>Lavatory A</span>
                  </div>
                </div>

                {/* Sections and Rows */}
                <div className="space-y-6">
                  {layout.cabinSections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-2">
                      {/* Section Header Divider */}
                      <div className="flex items-center gap-2 px-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                            section.cabin === "business"
                              ? "bg-blue-100 text-[#052659] border border-blue-200"
                              : section.cabin === "premium_economy"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {section.name}
                        </span>
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="font-mono text-[10px] font-bold text-slate-500">
                          ₹{section.basePriceInr}
                        </span>
                      </div>

                      {/* Render Rows in this section */}
                      <div className="space-y-2">
                        {Array.from({ length: section.endRow - section.startRow + 1 }).map((_, rOffset) => {
                          const rowNumber = section.startRow + rOffset;
                          const rowSeats = seatsByRow.get(rowNumber) || [];
                          const isExitRow = layout.exitRows.includes(rowNumber);

                          return (
                            <div key={rowNumber} className="relative">
                              {/* Exit Row Warning Line */}
                              {isExitRow && rOffset === 0 && (
                                <div className="my-1.5 flex items-center justify-between rounded bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200">
                                  <span>🚨 Overwing Emergency Exit Row — Extra Legroom</span>
                                  <span>Doors 2L / 2R</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-1 sm:gap-2">
                                {/* Left Seats Group */}
                                <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-end">
                                  {rowSeats
                                    .filter((s) => layout.columns.indexOf(s.col) < (layout.aisles[0] ?? 3))
                                    .map((seat) => (
                                      <SeatButton
                                        key={seat.id}
                                        seat={seat}
                                        isSelected={selectedSeatIds.includes(seat.id)}
                                        assignedPassengerNumber={
                                          Object.entries(selectedSeats).find(([, val]) => val === seat.id)
                                            ? parseInt(Object.entries(selectedSeats).find(([, val]) => val === seat.id)![0], 10) + 1
                                            : null
                                        }
                                        onClick={() => handleSeatClick(seat)}
                                        onHover={() => setHoveredSeat(seat)}
                                      />
                                    ))}
                                </div>

                                {/* Row Number Indicator Aisle */}
                                <div className="flex h-8 w-7 shrink-0 items-center justify-center font-mono text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md border border-slate-200">
                                  {rowNumber}
                                </div>

                                {/* Right Seats Group (or center + right if twin aisle) */}
                                <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-start">
                                  {rowSeats
                                    .filter((s) => layout.columns.indexOf(s.col) >= (layout.aisles[0] ?? 3))
                                    .map((seat) => (
                                      <SeatButton
                                        key={seat.id}
                                        seat={seat}
                                        isSelected={selectedSeatIds.includes(seat.id)}
                                        assignedPassengerNumber={
                                          Object.entries(selectedSeats).find(([, val]) => val === seat.id)
                                            ? parseInt(Object.entries(selectedSeats).find(([, val]) => val === seat.id)![0], 10) + 1
                                            : null
                                        }
                                        onClick={() => handleSeatClick(seat)}
                                        onHover={() => setHoveredSeat(seat)}
                                      />
                                    ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rear Galley & Tail */}
                <div className="mt-8 rounded-b-[40px] border-t-2 border-slate-300 bg-slate-200/80 p-4 text-center text-xs text-slate-500">
                  <div className="flex items-center justify-center gap-6 font-mono text-[10px] font-semibold">
                    <span>Lavatory C</span>
                    <span>•</span>
                    <span>Rear Galley 2L/2R</span>
                    <span>•</span>
                    <span>Lavatory D</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sidebar: Selected Seats, Inspector & Pricing */}
          <aside className="space-y-4">
            {/* Real-time Seat Inspector Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#021024]">
                    Seat Specifications
                  </h4>
                </div>
                {hoveredSeat && (
                  <span className="font-mono text-xs font-extrabold text-[#052659] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Seat {hoveredSeat.id}
                  </span>
                )}
              </div>

              {hoveredSeat ? (
                <div className="mt-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold capitalize text-[#021024]">
                      {hoveredSeat.cabin.replace("_", " ")}
                    </span>
                    <span className="font-mono text-sm font-extrabold text-[#052659]">
                      +₹{hoveredSeat.priceInr}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Legroom Pitch</span>
                      <strong className="text-[#021024]">{hoveredSeat.legroomInches} Inches</strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Location</span>
                      <strong className="text-[#021024]">
                        {hoveredSeat.isExitRow ? "Emergency Exit" : hoveredSeat.isWing ? "Over Wing" : "Main Cabin"}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Amenities</span>
                    {hoveredSeat.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-[11px] text-slate-600">
                        <Check size={12} className="text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 py-6 text-center text-xs text-slate-400">
                  <Armchair size={24} className="mx-auto text-slate-300 mb-1.5" />
                  <p>Hover over or tap any seat to inspect pitch, amenities, and view.</p>
                </div>
              )}
            </div>

            {/* Selection Summary & Total Due */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Users size={16} className="text-[#052659]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#021024]">
                  Booking Summary
                </h4>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Passengers:</span>
                  <strong className="text-[#021024]">{passengerCount} Traveler(s)</strong>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Assigned Seats:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {selectedSeatIds.length > 0 ? selectedSeatIds.join(", ") : "None assigned"}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Seat Reservation Fee:</span>
                  <span className="font-mono font-bold text-[#021024]">₹{totalSeatFee}</span>
                </div>

                <div className="my-3 border-t border-slate-100" />

                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Seat Total</span>
                    <div className="font-mono text-2xl font-extrabold text-[#052659]">
                      ₹{totalSeatFee}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Held via Redlock
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleContinueToPayment}
                  disabled={selectedSeatIds.length === 0}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#052659] py-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024] disabled:opacity-50"
                >
                  <span>Continue to Payment</span>
                  <Check size={14} />
                </button>
              </div>

              {/* Complimentary seat selection notice */}
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-slate-600 flex gap-2">
                <ShieldCheck size={16} className="shrink-0 text-[#052659] mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Complimentary Standard Seats:</strong> Window and aisle preferences are confirmed immediately with your airline ticket. 7kg cabin baggage included.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function SeatButton({
  seat,
  isSelected,
  assignedPassengerNumber,
  onClick,
  onHover,
}: {
  seat: SeatItem;
  isSelected: boolean;
  assignedPassengerNumber: number | null;
  onClick: () => void;
  onHover: () => void;
}) {
  const isBusiness = seat.cabin === "business";
  const isExit = seat.isExitRow;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      disabled={seat.isOccupied}
      title={`Seat ${seat.id} - ₹${seat.priceInr}`}
      className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-150 ${
        seat.isOccupied
          ? "cursor-not-allowed bg-slate-200 text-slate-400 border border-slate-300 opacity-60"
          : isSelected
          ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300 scale-105"
          : isBusiness
          ? "border border-blue-300 bg-blue-50 text-[#052659] hover:bg-blue-100 hover:scale-105 shadow-2xs"
          : isExit
          ? "border border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100 hover:scale-105 shadow-2xs"
          : "border border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-[#5483B3] hover:text-[#021024] hover:scale-105"
      }`}
    >
      {assignedPassengerNumber ? (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-emerald-900 text-[9px] font-extrabold shadow-xs">
          {assignedPassengerNumber}
        </span>
      ) : (
        seat.col
      )}

      {/* Small dot for window seats */}
      {(seat.col === "A" || seat.col === "F" || seat.col === "J") && !seat.isOccupied && !isSelected && (
        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-sky-400" />
      )}
    </button>
  );
}