"use client";

import { useState } from "react";
import { ArrowLeft, Check, Plane, Users, Info } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type SeatStatus = "available" | "selected" | "occupied" | "premium";

const columns = ["A", "B", "C", "D", "E", "F"];
const occupiedSeats = ["1C", "2A", "3F", "5B", "6E", "8A", "10F"];
const premiumRows = [1, 2, 3];

export default function SelectSeatsPage() {
  const [selected, setSelected] = useState<string[]>(["2B", "2C"]);

  const toggleSeat = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) return;
    setSelected((current) =>
      current.includes(seatId)
        ? current.filter((id) => id !== seatId)
        : [...current, seatId]
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        {/* Navigation back */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <Link
            href="/flights"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#052659] transition"
          >
            <ArrowLeft size={14} /> Back to Flights
          </Link>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Flight</span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-400">Passengers</span>
            <span className="text-slate-300">→</span>
            <span className="font-bold text-[#052659]">Seats (Active)</span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-400">Payment</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="mt-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 03 of 04</span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#021024]">Select Your Aircraft Seats</h1>
          <p className="text-xs text-slate-500">SkySync locks seats with distributed Redis holds while you complete checkout.</p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Aircraft Fuselage Layout */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-sm font-bold text-[#021024]">SkySync Airways • Airbus A321neo</h2>
                <p className="text-[11px] text-slate-500">Standard 2-2 Layout</p>
              </div>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-[#052659] border border-slate-200">
                SS 204
              </span>
            </div>

            {/* Fuselage Container */}
            <div className="mx-auto max-w-[460px] rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-inner">
              {/* Nose Cockpit */}
              <div className="mb-6 rounded-t-[80px] border border-slate-200 bg-white py-4 text-center shadow-xs">
                <Plane className="mx-auto mb-1 rotate-90 text-slate-400" size={18} />
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Cockpit Front</span>
              </div>

              {/* Business Cabin */}
              <div className="mb-5">
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Business Class</span>
                  <div className="h-px flex-1 bg-purple-200" />
                </div>
                <div className="space-y-2">
                  {premiumRows.map((row) => (
                    <SeatRow key={row} row={row} selected={selected} toggleSeat={toggleSeat} />
                  ))}
                </div>
              </div>

              {/* Economy Cabin */}
              <div className="mt-6">
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Economy Class</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="space-y-2">
                  {[4, 5, 6, 7, 8, 9, 10].map((row) => (
                    <SeatRow key={row} row={row} selected={selected} toggleSeat={toggleSeat} />
                  ))}
                </div>
              </div>
            </div>

            {/* Seat Map Legend */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded border border-slate-200 bg-white shadow-2xs" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-emerald-600 text-white" />
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-slate-200 text-slate-400" />
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded border border-purple-300 bg-purple-50 text-purple-700" />
                <span>Premium</span>
              </div>
            </div>
          </section>

          {/* Booking Summary Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Users size={16} className="text-[#052659]" />
                <h2 className="text-xs font-bold text-[#021024] uppercase tracking-wider">Seat Summary</h2>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Seats Chosen:</span>
                  <span className="font-bold text-[#021024]">{selected.length}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Seat Numbers:</span>
                  <span className="font-mono font-bold text-[#052659]">{selected.join(", ") || "None"}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Seat Reservation Fee:</span>
                  <span className="font-mono font-bold text-[#021024]">₹{selected.length * 650}</span>
                </div>
              </div>

              <div className="my-4 border-t border-slate-100" />

              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Due</span>
                  <div className="font-mono text-xl font-extrabold text-[#052659]">
                    ₹{selected.length * 650}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-amber-700">Held via Redis TTL</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem("selectedSeats", JSON.stringify(selected));
                  window.location.href = "/booking/payment";
                }}
                disabled={selected.length === 0}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#052659] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024] disabled:opacity-50"
              >
                <span>Continue to Payment</span>
                <Check size={14} />
              </button>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-slate-600 flex gap-2.5">
              <Info size={16} className="shrink-0 text-[#052659]" />
              <p className="text-[11px] leading-relaxed">
                Selected seats are held with a temporary Redis lock. If not confirmed, they automatically release back into inventory.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function SeatRow({
  row,
  selected,
  toggleSeat,
}: {
  row: number;
  selected: string[];
  toggleSeat: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_28px_1fr_1fr] items-center gap-2">
      {["A", "B"].map((col) => (
        <SeatButton
          key={`${row}${col}`}
          id={`${row}${col}`}
          premium={premiumRows.includes(row)}
          occupied={occupiedSeats.includes(`${row}${col}`)}
          selected={selected.includes(`${row}${col}`)}
          onClick={() => toggleSeat(`${row}${col}`)}
        />
      ))}

      <div className="text-center font-mono text-[10px] font-bold text-slate-400">
        {row}
      </div>

      {["E", "F"].map((col) => (
        <SeatButton
          key={`${row}${col}`}
          id={`${row}${col}`}
          premium={premiumRows.includes(row)}
          occupied={occupiedSeats.includes(`${row}${col}`)}
          selected={selected.includes(`${row}${col}`)}
          onClick={() => toggleSeat(`${row}${col}`)}
        />
      ))}
    </div>
  );
}

function SeatButton({
  id,
  premium,
  occupied,
  selected,
  onClick,
}: {
  id: string;
  premium: boolean;
  occupied: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={occupied}
      className={`h-8 rounded-lg text-[11px] font-bold font-mono transition ${
        occupied
          ? "cursor-not-allowed bg-slate-200 text-slate-400 border border-slate-300"
          : selected
          ? "bg-emerald-600 text-white shadow-xs font-bold"
          : premium
          ? "border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
          : "border border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-[#5483B3] hover:text-[#021024]"
      }`}
    >
      {id}
    </button>
  );
}