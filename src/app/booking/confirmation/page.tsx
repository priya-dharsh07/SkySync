"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Plane, Home, Printer, ShieldCheck, Ticket } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ConfirmationPage() {
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("lastBooking");
      if (stored) {
        try {
          setBooking(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const bookingRef = booking?.bookingReference || "SKY-CONF-98421";
  const eTicket = booking?.eTicketNumber || "ETKT-SS-849102-MAA";
  const flightNum = booking?.flightNumber || "AI-204";
  const airline = booking?.airline || "Air India";
  const origin = booking?.origin || "New Delhi";
  const originCode = booking?.originCode || "DEL";
  const destination = booking?.destination || "Mumbai";
  const destinationCode = booking?.destinationCode || "BOM";
  const departureDate = booking?.departureDate || "2026-10-15";
  const departureTime = booking?.departureTime || "08:15";
  const arrivalTime = booking?.arrivalTime || "10:30";
  const passengers = booking?.passengers || [{ firstName: "Priya", lastName: "Sundaram" }];
  const selectedSeats = booking?.selectedSeats || ["2B"];
  const totalPrice = booking?.totalPrice || 4950;

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm print:border-none print:shadow-none print:p-0">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs print:hidden">
            <CheckCircle2 size={28} />
          </div>

          <div className="text-center">
            <span className="mt-4 inline-block rounded-full bg-emerald-50 px-3 py-1 font-mono text-[11px] font-bold text-emerald-700 border border-emerald-200">
              Booking Confirmed & Synchronized
            </span>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#021024] sm:text-3xl">
              Boarding Pass & E-Ticket
            </h1>
            <p className="mt-1.5 text-xs text-slate-500">
              Seats and escrow hold have been finalized. Present this e-ticket or save for check-in.
            </p>
          </div>

          {/* E-Ticket Card Layout */}
          <div className="mt-8 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-md">
            {/* Top Bar */}
            <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <Plane size={20} className="text-[#C1E8FF]" />
                <div>
                  <span className="font-mono text-xs font-bold tracking-wider text-[#C1E8FF] uppercase">
                    SkySync Flight Voucher
                  </span>
                  <div className="text-sm font-extrabold">{airline}</div>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <div className="text-slate-400 text-[10px]">Flight</div>
                <div className="text-[#C1E8FF] font-bold">{flightNum}</div>
              </div>
            </div>

            {/* Middle Section: Route & Details */}
            <div className="p-6">
              <div className="grid grid-cols-3 items-center text-center">
                <div className="text-left">
                  <div className="font-mono text-3xl font-extrabold text-slate-900">{originCode}</div>
                  <div className="text-xs text-slate-500 font-semibold">{origin}</div>
                  <div className="mt-1 text-sm font-bold text-[#052659]">{departureTime}</div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-semibold text-slate-400">NON-STOP</span>
                  <div className="relative my-2 w-28 border-t-2 border-dashed border-slate-300">
                    <Plane size={14} className="absolute left-1/2 -top-2 -translate-x-1/2 text-[#5483B3]" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{departureDate}</span>
                </div>

                <div className="text-right">
                  <div className="font-mono text-3xl font-extrabold text-slate-900">{destinationCode}</div>
                  <div className="text-xs text-slate-500 font-semibold">{destination}</div>
                  <div className="mt-1 text-sm font-bold text-[#052659]">{arrivalTime}</div>
                </div>
              </div>

              {/* Passenger & Ticket Breakdown */}
              <div className="mt-6 border-t border-slate-200/80 pt-4 grid gap-4 sm:grid-cols-4 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Passengers</span>
                  <div className="mt-0.5 font-bold text-[#021024] truncate">
                    {passengers.map((p: any) => `${p.firstName} ${p.lastName}`).join(", ")}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Seats</span>
                  <div className="mt-0.5 font-bold text-emerald-700">{selectedSeats.join(", ")}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Booking Reference</span>
                  <div className="mt-0.5 font-bold text-[#052659]">{bookingRef}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">E-Ticket</span>
                  <div className="mt-0.5 font-bold text-slate-700">{eTicket}</div>
                </div>
              </div>

              {/* Bottom Guarantee Banner */}
              <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-[11px]">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Two-Phase Escrow Settlement: CAPTURED ($0 Balance Due)</span>
                </div>
                <span className="font-mono text-xs font-extrabold text-slate-900">₹{totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-[#052659] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#021024] transition"
            >
              <Printer size={14} />
              <span>Print E-Ticket / Save PDF</span>
            </button>

            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <Ticket size={14} className="text-[#5483B3]" />
              <span>View in Profile History</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <Home size={14} />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
