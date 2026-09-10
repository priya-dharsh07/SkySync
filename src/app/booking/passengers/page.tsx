"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Check } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PassengersPage() {
  const router = useRouter();
  const [passengers, setPassengers] = useState([
    {
      firstName: "Priyadharshini",
      lastName: "S",
      email: "priya@example.com",
      phone: "+91 98765 43210",
      dateOfBirth: "1996-05-14",
      gender: "female",
      passportNumber: "Z9482104",
      passportCountry: "IND",
      passportExpiry: "2032-11-20",
      visaStatus: "VERIFIED_OK",
    },
  ]);

  // Read passenger count and flight from session storage if present
  useState(() => {
    if (typeof window !== "undefined") {
      const storedCount = parseInt(sessionStorage.getItem("passengers") || "1", 10);
      if (storedCount > 1) {
        const initial = [...passengers];
        for (let i = 1; i < storedCount; i++) {
          initial.push({
            firstName: `Traveler`,
            lastName: `${i + 1}`,
            email: `traveler${i + 1}@example.com`,
            phone: "+91 98000 00000",
            dateOfBirth: "1998-08-20",
            gender: "male",
            passportNumber: `A${Math.floor(1000000 + Math.random() * 9000000)}`,
            passportCountry: "IND",
            passportExpiry: "2031-06-15",
            visaStatus: "VERIFIED_OK",
          });
        }
        setPassengers(initial);
      }
    }
  });

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("passengerDetails", JSON.stringify(passengers));
    router.push("/select-seats");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6">
        <Link
          href="/flights"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#052659] mb-5 transition"
        >
          <ArrowLeft size={13} /> Back to Flights
        </Link>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 02 of 04</span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#021024]">
              Passenger & Travel Document Verification
            </h1>
            <p className="text-xs text-slate-500">
              Enter official travel document details for ICAO airline manifest and visa validation.
            </p>
          </div>

          <form onSubmit={handleContinue} className="mt-6 space-y-6">
            {passengers.map((p, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#052659]">
                    <User size={15} className="text-[#5483B3]" /> Passenger {idx + 1} {idx === 0 ? "(Primary Contact)" : ""}
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-700 border border-emerald-200">
                    ICAO Doc 9303 Compliant
                  </span>
                </div>

                {/* Personal Information */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">First Name</label>
                    <input
                      type="text"
                      required
                      value={p.firstName}
                      onChange={(e) => {
                        const next = [...passengers];
                        next[idx].firstName = e.target.value;
                        setPassengers(next);
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#021024] shadow-2xs focus:border-[#5483B3] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Last Name</label>
                    <input
                      type="text"
                      required
                      value={p.lastName}
                      onChange={(e) => {
                        const next = [...passengers];
                        next[idx].lastName = e.target.value;
                        setPassengers(next);
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#021024] shadow-2xs focus:border-[#5483B3] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={p.dateOfBirth}
                      onChange={(e) => {
                        const next = [...passengers];
                        next[idx].dateOfBirth = e.target.value;
                        setPassengers(next);
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#021024] shadow-2xs focus:border-[#5483B3] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Email Address</label>
                    <input
                      type="email"
                      required
                      value={p.email}
                      onChange={(e) => {
                        const next = [...passengers];
                        next[idx].email = e.target.value;
                        setPassengers(next);
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#021024] shadow-2xs focus:border-[#5483B3] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={p.phone}
                      onChange={(e) => {
                        const next = [...passengers];
                        next[idx].phone = e.target.value;
                        setPassengers(next);
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#021024] shadow-2xs focus:border-[#5483B3] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Passport & Visa Verification Section */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-bold text-[#021024]">Passport & Travel Document Details</span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check size={12} /> Visa Waiver / Verified
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Passport Number</label>
                      <input
                        type="text"
                        required
                        value={p.passportNumber}
                        onChange={(e) => {
                          const next = [...passengers];
                          next[idx].passportNumber = e.target.value;
                          setPassengers(next);
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Issuing Country</label>
                      <select
                        value={p.passportCountry}
                        onChange={(e) => {
                          const next = [...passengers];
                          next[idx].passportCountry = e.target.value;
                          setPassengers(next);
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                      >
                        <option value="IND">India (IND)</option>
                        <option value="USA">United States (USA)</option>
                        <option value="GBR">United Kingdom (GBR)</option>
                        <option value="SGP">Singapore (SGP)</option>
                        <option value="JPN">Japan (JPN)</option>
                        <option value="DEU">Germany (DEU)</option>
                        <option value="CAN">Canada (CAN)</option>
                        <option value="AUS">Australia (AUS)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Passport Expiry</label>
                      <input
                        type="date"
                        required
                        value={p.passportExpiry}
                        onChange={(e) => {
                          const next = [...passengers];
                          next[idx].passportExpiry = e.target.value;
                          setPassengers(next);
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#052659] py-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024]"
            >
              <span>Verify Documents & Select Seats</span>
              <Check size={14} />
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
