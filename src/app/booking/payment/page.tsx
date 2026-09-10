"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, ShieldCheck, Lock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PaymentPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("888");

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrorMessage("");

    try {
      let flight: any = null;
      let passengers: any[] = [];
      let selectedSeats: string[] = [];

      if (typeof window !== "undefined") {
        const storedFlight = sessionStorage.getItem("selectedFlight");
        if (storedFlight) flight = JSON.parse(storedFlight);

        const storedPassengers = sessionStorage.getItem("passengerDetails");
        if (storedPassengers) passengers = JSON.parse(storedPassengers);

        const storedSeats = sessionStorage.getItem("selectedSeats");
        if (storedSeats) selectedSeats = JSON.parse(storedSeats);
      }

      if (!flight) {
        // Fallback default flight
        flight = {
          flightNumber: "AI-204",
          airline: "Air India",
          airlineCode: "AI",
          origin: "New Delhi",
          originCode: "DEL",
          destination: "Mumbai",
          destinationCode: "BOM",
          departureDate: "2026-10-15",
          departureTime: "08:15",
          arrivalTime: "10:30",
          price: 4950,
        };
      }

      if (passengers.length === 0) {
        passengers = [
          {
            firstName: "Priya",
            lastName: "Sundaram",
            email: "priya@example.com",
            phone: "+91 98765 43210",
            passportNumber: "Z9482104",
            passportCountry: "IND",
            visaStatus: "VERIFIED_OK",
          },
        ];
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flight,
          passengers,
          selectedSeats: selectedSeats.length > 0 ? selectedSeats : ["2B"],
          totalPrice: (flight.price || 4950) * passengers.length,
          paymentCardLast4: cardNumber.slice(-4) || "4242",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Payment authorization failed");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("lastBooking", JSON.stringify(data.booking));
      }

      router.push("/booking/confirmation");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Payment processing error. Please try again.");
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 pt-24 pb-16 sm:px-6">
        <Link
          href="/select-seats"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#052659] mb-5 transition"
        >
          <ArrowLeft size={13} /> Back to Seats
        </Link>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 04 of 04</span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#021024]">Payment & Escrow Authorization</h1>
            <p className="text-xs text-slate-500">Pre-authorizes payment holds with two-phase escrow protection.</p>
          </div>

          <form onSubmit={handlePayment} className="mt-6 space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#021024]">
                  <CreditCard size={16} className="text-[#052659]" />
                  <span>Payment Card</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Two-Phase Escrow
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">Card Number</label>
                <input
                  type="text"
                  defaultValue="4242 •••• •••• 4242"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-[#021024] shadow-2xs focus:border-[#5483B3] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Expiry</label>
                  <input
                    type="text"
                    defaultValue="12/28"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-[#021024] shadow-2xs focus:border-[#5483B3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">CVC</label>
                  <input
                    type="text"
                    defaultValue="888"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-[#021024] shadow-2xs focus:border-[#5483B3] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-950 flex items-center gap-3">
              <ShieldCheck size={20} className="shrink-0 text-emerald-600" />
              <p className="text-[11px] leading-relaxed">
                <strong className="text-emerald-900">Atomic Escrow Guarantee:</strong> Funds are only held in pre-authorization ($0 settled). If any flight or seat fails during simultaneous checkout, the hold is voided with $0 penalty.
              </p>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#052659] py-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024] disabled:opacity-60"
            >
              {processing ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Authorizing Escrow Hold...</span>
                </>
              ) : (
                <>
                  <Lock size={14} className="text-blue-300" />
                  <span>Authorize Escrow & Issue Tickets</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
