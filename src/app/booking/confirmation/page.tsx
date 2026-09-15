"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  Plane, 
  Printer, 
  ShieldCheck, 
  Download, 
  ArrowLeft, 
  Luggage, 
  QrCode, 
  Calendar, 
  Clock, 
  User, 
  Ticket,
  Sparkles
} from "lucide-react";
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

  const bookingRef = booking?.bookingReference || "SKY-CONF-PENDING";
  const eTicket = booking?.eTicketNumber || "ETKT-SS-PENDING";
  const flightNum = booking?.flightNumber || "SS-101";
  const airline = booking?.airline || "SkySync Airways";
  const origin = booking?.origin || "Origin City";
  const originCode = booking?.originCode || "DEP";
  const destination = booking?.destination || "Destination City";
  const destinationCode = booking?.destinationCode || "ARR";
  const departureDate = booking?.departureDate || "2026-10-15";
  const departureTime = booking?.departureTime || "08:15";
  const arrivalTime = booking?.arrivalTime || "10:30";
  const passengers = booking?.passengers || [{ firstName: "Traveler", lastName: "" }];
  const selectedSeats = booking?.selectedSeats || ["14A"];
  const totalPrice = booking?.totalPrice || 4950;

  // Calculate boarding time: 45 minutes before departure
  const boardingTime = (() => {
    try {
      const [h, m] = departureTime.split(":").map(Number);
      let totalMins = h * 60 + m - 45;
      if (totalMins < 0) totalMins += 24 * 60;
      const bh = Math.floor(totalMins / 60);
      const bm = totalMins % 60;
      return `${String(bh).padStart(2, "0")}:${String(bm).padStart(2, "0")}`;
    } catch {
      return "07:30";
    }
  })();

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#021024]">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="relative z-10 mx-auto max-w-4xl px-4 pt-24 pb-20 sm:px-6">
        {/* Navigation & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
          <Link
            href="/flights"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#052659] transition"
          >
            <ArrowLeft size={14} /> Back to Flight Search
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/profile"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              View in My Bookings
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-[#052659] px-4 py-2 text-xs font-bold text-white hover:bg-[#021024] shadow-sm transition"
            >
              <Printer size={14} />
              <span>Print Boarding Pass</span>
            </button>
          </div>
        </div>

        {/* Confirmation Hero Header */}
        <div className="relative overflow-hidden mt-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-[#021024] via-[#052659] to-[#021024] p-6 sm:p-8 shadow-md text-white print:hidden text-center">

          <div className="relative z-10 max-w-lg mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md mb-3">
              <CheckCircle2 size={30} />
            </div>

            <span className="rounded-full bg-white/20 px-3 py-1 font-mono text-xs font-bold text-white border border-white/20 backdrop-blur-md">
              Booking Confirmed & Synchronized
            </span>

            <h1 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
              Official Boarding Pass & E-Ticket
            </h1>
            <p className="mt-1 text-xs text-blue-100/90">
              Your flight reservation has been ticketed and recorded in the booking ledger. Present this boarding pass at the security checkpoint and departure gate.
            </p>
          </div>
        </div>

        {/* AUTHENTIC AIRLINE BOARDING PASS CONTAINER */}
        <div className="mt-8 overflow-hidden rounded-3xl border-2 border-slate-900 bg-white shadow-xl print:border print:shadow-none">
          {/* Top Airline Branding Banner */}
          <div className="flex flex-wrap items-center justify-between bg-gradient-to-r from-slate-950 via-[#052659] to-slate-900 px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xs text-[#C1E8FF]">
                <Plane size={20} className="rotate-45" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold tracking-tight">{airline}</span>
                  <span className="rounded bg-white/15 px-2 py-0.5 font-mono text-[9px] font-bold text-[#C1E8FF] uppercase">
                    Commercial Airline
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-300">
                  Electronic Passenger Boarding Document
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Cabin Class</span>
                <span className="text-xs font-bold text-[#C1E8FF]">Economy Class</span>
              </div>
              <div className="font-mono">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Flight</span>
                <span className="text-sm font-extrabold text-white">{flightNum}</span>
              </div>
            </div>
          </div>

          {/* Main Boarding Pass Body (Split into Flight Details & Perforated Stub) */}
          <div className="grid lg:grid-cols-[1fr_240px]">
            {/* Left Main Voucher Area */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Route & Times */}
              <div className="grid grid-cols-3 items-center text-center">
                <div className="text-left">
                  <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950">
                    {originCode}
                  </div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5 truncate">{origin}</div>
                  <div className="font-mono text-sm font-extrabold text-[#052659] mt-1">{departureTime}</div>
                  <span className="text-[10px] text-slate-400 font-mono">Scheduled Departure</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    NON-STOP
                  </span>
                  <div className="relative my-2 w-full max-w-[120px] border-t-2 border-dashed border-slate-300">
                    <Plane size={14} className="absolute left-1/2 -top-2 -translate-x-1/2 text-[#5483B3]" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 font-semibold">{departureDate}</span>
                </div>

                <div className="text-right">
                  <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950">
                    {destinationCode}
                  </div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5 truncate">{destination}</div>
                  <div className="font-mono text-sm font-extrabold text-[#052659] mt-1">{arrivalTime}</div>
                  <span className="text-[10px] text-slate-400 font-mono">Estimated Arrival</span>
                </div>
              </div>

              {/* Crucial Flight Ops Badges */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-slate-50 p-4 border border-slate-200 font-mono text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Boarding Time</span>
                  <strong className="text-base text-rose-700 font-extrabold">{boardingTime}</strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Terminal / Gate</span>
                  <strong className="text-base text-[#052659] font-extrabold">T3 • Gate 14B</strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Boarding Group</span>
                  <strong className="text-base text-purple-800 font-extrabold">Group 2</strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Seat Assigned</span>
                  <strong className="text-base text-emerald-700 font-extrabold">
                    {selectedSeats.join(", ") || "14A"}
                  </strong>
                </div>
              </div>

              {/* Passenger & Ticket Data Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 font-mono text-xs border-t border-slate-100 pt-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Passenger Name</span>
                  <div className="font-bold text-slate-900 truncate">
                    {passengers.map((p: any) => `${p.firstName} ${p.lastName}`).join(", ")}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Booking Reference (PNR)</span>
                  <strong className="text-[#052659] font-extrabold">{bookingRef}</strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">E-Ticket Number</span>
                  <span className="text-slate-700">{eTicket}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sequence Number</span>
                  <span className="text-slate-700">SEQ 042</span>
                </div>
              </div>

              {/* Baggage & IATA Compliance Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Luggage size={15} className="text-[#052659]" />
                  <span>
                    <strong>Baggage:</strong> 1 Cabin Bag (7kg) + 1 Checked Bag (25kg) Included
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <ShieldCheck size={12} />
                  <span>ICAO & IATA e-Pass Verified</span>
                </div>
              </div>
            </div>

            {/* Right Perforated Stub Section (Boarding Gate Stub) */}
            <div className="relative border-t-2 border-dashed border-slate-300 bg-slate-50/70 p-6 lg:border-t-0 lg:border-l-2 flex flex-col justify-between">
              {/* Notch cutouts for perforation effect */}
              <div className="hidden lg:block absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#F8FAFC] border border-slate-300" />
              <div className="hidden lg:block absolute -left-3 -bottom-3 h-6 w-6 rounded-full bg-[#F8FAFC] border border-slate-300" />

              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Gate Stub</span>
                  <span className="text-[10px] font-bold text-[#052659]">{flightNum}</span>
                </div>

                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">Passenger</span>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {passengers[0]?.firstName} {passengers[0]?.lastName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block">From</span>
                    <strong>{originCode}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block">To</span>
                    <strong>{destinationCode}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block">Seat</span>
                    <strong className="text-emerald-700 text-sm">{selectedSeats[0] || "14A"}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block">Boarding</span>
                    <strong className="text-rose-700 text-xs">{boardingTime}</strong>
                  </div>
                </div>
              </div>

              {/* Scannable Barcode & QR Code */}
              <div className="mt-4 pt-4 border-t border-slate-200 text-center space-y-2">
                <div className="mx-auto h-24 w-24 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
                  <QrCode size={80} className="text-slate-900" />
                </div>
                <span className="font-mono text-[8px] text-slate-400 tracking-wider block">
                  SCAN FOR AIRPORT SECURITY GATE
                </span>
                {/* Simulated PDF417 barcode bars */}
                <div className="h-6 w-full bg-slate-900 rounded opacity-90 flex items-center justify-between px-1">
                  {Array.from({ length: 28 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-4 bg-white ${idx % 3 === 0 ? "w-1" : idx % 2 === 0 ? "w-0.5" : "w-1.5"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action button in bottom for easy navigation */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Return to Homepage
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-xl bg-[#052659] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#021024] shadow-sm transition"
          >
            <Ticket size={14} />
            <span>Manage Reservation in Profile</span>
          </Link>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
