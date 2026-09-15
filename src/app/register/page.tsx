"use client";

import Link from "next/link";
import { ArrowLeft, Lock, Mail, Plane, User, MapPin, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AIRPORTS, Airport } from "@/lib/convergence/airports";

const POPULAR_HUBS = ["DEL", "BOM", "BLR", "MAA", "HYD", "CCU", "DXB", "SIN", "LHR", "JFK"];

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedAirportCode, setSelectedAirportCode] = useState<string>("DEL");
  const [searchFilter, setSearchFilter] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedAirport = AIRPORTS.find((a) => a.code === selectedAirportCode) || AIRPORTS[0];

  const filteredAirports = AIRPORTS.filter(
    (a) =>
      a.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.country.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!selectedAirportCode) {
      setError("Please select your primary departure city/airport.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!termsAccepted) {
      setError("Please accept the terms and privacy policy.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          homeAirport: selectedAirport.code,
          homeCity: selectedAirport.city,
          country: selectedAirport.country,
          lat: selectedAirport.lat,
          lng: selectedAirport.lng,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        return;
      }

      router.push("/login");
    } catch (error) {
      console.error("Registration error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#021024] flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto w-full max-w-lg px-4 pt-28 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#052659] mb-6 transition"
        >
          <ArrowLeft size={13} /> Back to SkySync
        </Link>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-[#052659] shadow-2xs">
              <Plane size={18} />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#021024]">Create Account</h1>
            <p className="mt-1 text-xs text-slate-500">
              Set your departure home base to enable real multi-origin group flight optimization.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Full Name</label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-[#021024] placeholder-slate-400 shadow-2xs focus:border-[#5483B3] focus:outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Email Address</label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-[#021024] placeholder-slate-400 shadow-2xs focus:border-[#5483B3] focus:outline-none"
                />
              </div>
            </div>

            {/* MANDATORY DEPARTURE LOCATION */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#052659]">
                  <MapPin size={14} className="text-[#5483B3]" />
                  <span>Departure / Home Location (Required)</span>
                </label>
                <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-[#052659] border border-blue-200 shadow-2xs">
                  {selectedAirport.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                SkySync saves this to your database profile so organizers can optimize group meetings automatically without asking for your airport.
              </p>

              {/* Selected display button */}
              <button
                type="button"
                onClick={() => setIsPickerOpen(!isPickerOpen)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-left shadow-2xs hover:border-[#5483B3] transition"
              >
                <div>
                  <span className="font-bold text-[#021024]">{selectedAirport.city}</span>
                  <span className="text-slate-500"> ({selectedAirport.name})</span>
                  <span className="text-slate-400"> - {selectedAirport.country}</span>
                </div>
                <span className="text-[11px] font-bold text-[#052659] underline ml-2 shrink-0">
                  {isPickerOpen ? "Close" : "Change"}
                </span>
              </button>

              {/* Quick popular chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold">Popular:</span>
                {POPULAR_HUBS.map((code) => {
                  const hub = AIRPORTS.find((a) => a.code === code);
                  if (!hub) return null;
                  const isSelected = selectedAirportCode === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setSelectedAirportCode(code);
                        setIsPickerOpen(false);
                      }}
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition ${
                        isSelected
                          ? "bg-[#052659] text-white"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50"
                      }`}
                    >
                      {hub.city} ({code})
                    </button>
                  );
                })}
              </div>

              {/* Dropdown list when open */}
              {isPickerOpen && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg space-y-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search city, country or code (e.g. Chennai, MAA)..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-[#021024] focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredAirports.map((airport) => (
                      <button
                        key={airport.code}
                        type="button"
                        onClick={() => {
                          setSelectedAirportCode(airport.code);
                          setIsPickerOpen(false);
                          setSearchFilter("");
                        }}
                        className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition ${
                          selectedAirportCode === airport.code
                            ? "bg-blue-50 text-[#052659] font-bold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span>
                          {airport.city} ({airport.name})
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{airport.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Password</label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-[#021024] placeholder-slate-400 shadow-2xs focus:border-[#5483B3] focus:outline-none"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Confirm Password</label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-[#021024] placeholder-slate-400 shadow-2xs focus:border-[#5483B3] focus:outline-none"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-center gap-2 pt-1 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 accent-[#052659]"
              />
              <span>I agree to SkySync's terms and privacy policy.</span>
            </label>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#052659] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024] disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create SkySync Account"}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#052659] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}