"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Plane, 
  Sparkles, 
  HelpCircle,
  Calendar,
  Globe2,
  Lock
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageBackground from "@/components/layout/PageBackground";
import passengersBg from "@/bgs/image5.png";
import { checkVisaRequirement, VisaRequirement } from "@/lib/visa/visaRules";

interface PassengerDetail {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  passportNumber: string;
  passportCountry: string;
  passportExpiry: string;
  visaStatus: string;
  frequentFlyerNumber?: string;
}

const PASSPORT_COUNTRIES = [
  { code: "IND", name: "India (IND)" },
  { code: "USA", name: "United States (USA)" },
  { code: "GBR", name: "United Kingdom (GBR)" },
  { code: "SGP", name: "Singapore (SGP)" },
  { code: "JPN", name: "Japan (JPN)" },
  { code: "DEU", name: "Germany (DEU)" },
  { code: "FRA", name: "France (FRA)" },
  { code: "CAN", name: "Canada (CAN)" },
  { code: "AUS", name: "Australia (AUS)" },
  { code: "ARE", name: "United Arab Emirates (ARE)" },
];

export default function PassengersPage() {
  const router = useRouter();
  const [flight, setFlight] = useState<any>(null);
  const [activePassengerTab, setActivePassengerTab] = useState(0);

  // Initialize passengers array
  const [passengers, setPassengers] = useState<PassengerDetail[]>([
    {
      title: "Ms",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "female",
      passportNumber: "",
      passportCountry: "IND",
      passportExpiry: "",
      visaStatus: "PENDING_VERIFICATION",
    },
  ]);

  // Load flight from sessionStorage & populate logged-in user if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedFlight = sessionStorage.getItem("selectedFlight");
        if (storedFlight) {
          setFlight(JSON.parse(storedFlight));
        }

        const count = parseInt(sessionStorage.getItem("passengers") || "1", 10);
        const storedPassengers = sessionStorage.getItem("passengerDetails");

        if (storedPassengers) {
          const parsed = JSON.parse(storedPassengers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPassengers(parsed);
            return;
          }
        }

        // Initialize array of passenger items based on count
        const initialList: PassengerDetail[] = [];
        for (let i = 0; i < count; i++) {
          initialList.push({
            title: i === 0 ? "Mr" : "Ms",
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            dateOfBirth: "",
            gender: i % 2 === 0 ? "male" : "female",
            passportNumber: "",
            passportCountry: "IND",
            passportExpiry: "",
            visaStatus: "PENDING_VERIFICATION",
          });
        }

        // Attempt pre-populating Primary Passenger from auth session
        fetch("/api/auth/me")
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.user && initialList[0]) {
              const nameParts = data.user.name.split(" ");
              initialList[0].firstName = nameParts[0] || "";
              initialList[0].lastName = nameParts.slice(1).join(" ") || "";
              initialList[0].email = data.user.email || "";
              if (data.user.country === "United States") initialList[0].passportCountry = "USA";
              else if (data.user.country === "United Kingdom") initialList[0].passportCountry = "GBR";
            }
            setPassengers(initialList);
          })
          .catch(() => {
            setPassengers(initialList);
          });
      } catch (err) {
        console.error("Failed to load passenger state:", err);
      }
    }
  }, []);

  // Quick-Fill Sample Traveler Data button for tester convenience
  function fillSampleData() {
    const sample = passengers.map((p, idx) => ({
      title: idx === 0 ? "Ms" : "Mr",
      firstName: idx === 0 ? (p.firstName || "Primary") : `Companion`,
      lastName: idx === 0 ? (p.lastName || "Traveler") : `${idx + 1}`,
      email: idx === 0 ? (p.email || "traveler@skysync.app") : `companion${idx + 1}@skysync.app`,
      phone: "+91 98401 23456",
      dateOfBirth: idx === 0 ? "1996-05-14" : "1994-08-22",
      gender: idx === 0 ? "female" : "male",
      passportNumber: `Z${Math.floor(1000000 + Math.random() * 9000000)}`,
      passportCountry: p.passportCountry || "IND",
      passportExpiry: "2032-11-20",
      visaStatus: "VERIFIED_OK",
      frequentFlyerNumber: `FF-${1000 + idx * 25}`,
    }));
    setPassengers(sample);
  }

  function updatePassenger(index: number, field: keyof PassengerDetail, value: string) {
    const next = [...passengers];
    next[index] = { ...next[index], [field]: value };
    setPassengers(next);
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();

    if (typeof window !== "undefined") {
      sessionStorage.setItem("passengerDetails", JSON.stringify(passengers));
      router.push("/select-seats");
    }
  }

  // Evaluate dynamic visa requirements for active passenger tab
  const activePassenger = passengers[activePassengerTab] || passengers[0];
  const visaAdvisory: VisaRequirement = useMemo(() => {
    const destCountry = flight?.destination || flight?.destinationCode || "United Arab Emirates";
    const originCountry = flight?.origin || flight?.originCode || "India";
    return checkVisaRequirement(
      activePassenger?.passportCountry || "IND",
      destCountry,
      originCountry
    );
  }, [flight, activePassenger]);

  // Check 6-month passport validity against flight departure
  const validityWarning = useMemo(() => {
    if (!activePassenger?.passportExpiry || !flight?.departureDate) return null;
    const expiry = new Date(activePassenger.passportExpiry);
    const departure = new Date(flight.departureDate);
    const diffMonths = (expiry.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);

    if (diffMonths < 6 && diffMonths > 0) {
      return `Passport expires in ${Math.round(diffMonths)} months. Most international borders mandate at least 6 full months of remaining validity from your departure date.`;
    }
    if (diffMonths <= 0) {
      return "Critical: The passport expiration date provided has already expired or is on/before your departure date.";
    }
    return null;
  }, [activePassenger?.passportExpiry, flight?.departureDate]);

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#021024]">
      <PageBackground
        image={passengersBg}
        alt="Travel Documents Background"
      />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-5xl px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        {/* Header navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <Link
            href="/flights"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#052659] transition"
          >
            <ArrowLeft size={14} /> Back to Flight Results
          </Link>

          {/* Stepper */}
          <div className="hidden items-center gap-2 text-xs sm:flex">
            <span className="text-slate-400">01. Flight</span>
            <span className="text-slate-300">→</span>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-[#052659] border border-blue-200">
              02. Passenger Details (Active)
            </span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-400">03. Seat Selection</span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-400">04. Payment</span>
          </div>
        </div>

        {/* Selected Flight Photographic Visual Banner */}
        {flight && (
          <div className="relative overflow-hidden mt-6 rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-md text-white">
            <div className="absolute inset-0 z-0 select-none">
              <Image
                src={passengersBg}
                alt="Selected Flight Travel"
                fill
                priority
                className="object-cover object-center scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#021024]/92 via-[#052659]/85 to-[#021024]/80" />
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/20 font-mono text-sm font-extrabold text-[#C1E8FF] backdrop-blur-md">
                  {flight.airlineCode || "SS"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">{flight.airline}</span>
                    <span className="font-mono text-xs text-blue-200">({flight.flightNumber})</span>
                    <span className="rounded-full bg-white/15 px-2 py-0.5 font-mono text-[10px] text-white border border-white/25 uppercase">
                      {flight.type || "Scheduled"}
                    </span>
                  </div>
                  <p className="text-xs text-blue-100/90 mt-0.5">
                    {flight.origin} ({flight.originCode}) → {flight.destination} ({flight.destinationCode}) • {flight.departureDate} at {flight.departureTime}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fillSampleData}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#052659] shadow-sm hover:bg-blue-50 transition"
              >
                <Sparkles size={13} className="text-[#052659]" />
                <span>Autofill Verified Details</span>
              </button>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="mt-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 02 of 04</span>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#021024] sm:text-3xl">
            Passenger Information
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Enter passenger information exactly as shown on government travel documents. SkySync verifies destination entry policies in real-time.
          </p>
        </div>

        {/* Multi-Passenger Tab Switcher */}
        {passengers.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {passengers.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePassengerTab(idx)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activePassengerTab === idx
                    ? "bg-[#052659] text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>Passenger {idx + 1}</span>
                {p.firstName ? (
                  <span className="font-normal opacity-90">({p.firstName})</span>
                ) : (
                  <span className="text-[10px] opacity-70">(Pending)</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main Grid: Passenger Form vs Dynamic Visa Advisory */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Form */}
          <form onSubmit={handleContinue} className="space-y-6">
            {passengers.map((passenger, pIdx) => {
              // Only display active passenger tab if multi-passenger, or show all if desired
              if (passengers.length > 1 && activePassengerTab !== pIdx) {
                return null;
              }

              return (
                <div
                  key={pIdx}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#052659] text-xs font-bold text-white">
                        {pIdx + 1}
                      </div>
                      <h3 className="text-sm font-bold text-[#021024]">
                        Passenger {pIdx + 1} {pIdx === 0 ? "(Primary Contact & Manifest Lead)" : ""}
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-[9px] font-bold text-emerald-700 border border-emerald-200">
                      ICAO 9303 Compliant
                    </span>
                  </div>

                  {/* Name and Title */}
                  <div className="grid gap-3 sm:grid-cols-[100px_1fr_1fr]">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block">Title</label>
                      <select
                        value={passenger.title}
                        onChange={(e) => updatePassenger(pIdx, "title", e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                      >
                        <option value="Mr">Mr</option>
                        <option value="Ms">Ms</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Dr">Dr</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        First & Middle Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priyadharshini"
                        value={passenger.firstName}
                        onChange={(e) => updatePassenger(pIdx, "firstName", e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Last Name / Surname <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sundaram"
                        value={passenger.lastName}
                        onChange={(e) => updatePassenger(pIdx, "lastName", e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* DOB, Gender */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Date of Birth <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={passenger.dateOfBirth}
                        onChange={(e) => updatePassenger(pIdx, "dateOfBirth", e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block">Gender</label>
                      <select
                        value={passenger.gender}
                        onChange={(e) => updatePassenger(pIdx, "gender", e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="undisclosed">Undisclosed</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact Info (for lead passenger) */}
                  {pIdx === 0 && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                      <span className="text-[11px] font-bold text-[#021024] block">
                        Contact Details (E-Ticket Delivery & Airline SMS Alerts)
                      </span>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-slate-500">Email Address *</label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. priya@example.com"
                            value={passenger.email}
                            onChange={(e) => updatePassenger(pIdx, "email", e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-[#021024] focus:border-[#5483B3] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold uppercase text-slate-500">Mobile Phone *</label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. +91 98765 43210"
                            value={passenger.phone}
                            onChange={(e) => updatePassenger(pIdx, "phone", e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-[#021024] focus:border-[#5483B3] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Passport & Travel Document Section */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#021024]">
                        <Globe2 size={15} className="text-[#5483B3]" />
                        <span>Passport & Travel Document Verification</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Required for international manifest</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-slate-500">
                          Passport Issuing Country *
                        </label>
                        <select
                          value={passenger.passportCountry}
                          onChange={(e) => updatePassenger(pIdx, "passportCountry", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                        >
                          {PASSPORT_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold uppercase text-slate-500">
                          Passport Number *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Z9482104"
                          value={passenger.passportNumber}
                          onChange={(e) => updatePassenger(pIdx, "passportNumber", e.target.value.toUpperCase())}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold uppercase text-slate-500">
                          Passport Expiry Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={passenger.passportExpiry}
                          onChange={(e) => updatePassenger(pIdx, "passportExpiry", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Expiry Warning Alert if < 6 months */}
                    {validityWarning && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                        <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
                        <span>{validityWarning}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Submit Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Traveler data is sanitized and protected in accordance with ISO 27001</span>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-[#052659] px-6 py-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024]"
              >
                <span>Save Documents & Select Seats</span>
                <Check size={15} />
              </button>
            </div>
          </form>

          {/* Dynamic Destination Entry & Visa Advisory Panel */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Globe2 size={16} className="text-[#052659]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#021024]">
                    Destination Visa Advisory
                  </h4>
                </div>
                <span className="font-mono text-[10px] text-slate-400">Live Policy</span>
              </div>

              {/* Status Header Badge */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Route: {flight?.originCode || "DEP"} → {flight?.destinationCode || "ARR"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold border ${
                      visaAdvisory.badgeColor === "emerald"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : visaAdvisory.badgeColor === "blue"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : visaAdvisory.badgeColor === "amber"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {visaAdvisory.badgeText}
                  </span>
                </div>

                <h5 className="text-xs font-bold text-[#021024]">{visaAdvisory.headline}</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {visaAdvisory.summary}
                </p>
              </div>

              {/* Document Checklist */}
              <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Mandatory Entry Requirements
                </span>
                {visaAdvisory.documentsRequired.map((doc, dIdx) => (
                  <div key={dIdx} className="flex items-start gap-2 text-[11px] text-slate-600">
                    <Check size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{doc}</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {visaAdvisory.notes.length > 0 && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-100 text-[10px] text-slate-500 space-y-1">
                  <span className="font-bold text-slate-700 block">Immigration Advisory</span>
                  {visaAdvisory.notes.map((note, nIdx) => (
                    <p key={nIdx}>• {note}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Passenger Manifest Snapshot */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <FileText size={14} className="text-[#052659]" />
                <span>Airline Manifest Snapshot</span>
              </div>
              <p className="text-[11px]">
                Upon document verification, your passenger data is compiled into standard APIS (Advance Passenger Information System) format for transmission to the destination border authority.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
