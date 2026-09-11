"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { 
  ShieldCheck, 
  Lock, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Plane, 
  Sparkles, 
  Check,
  AlertCircle
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { GroupMemberSession, SagaExecutionResult, ChaosConfig, SagaStepName } from "@/lib/saga/types";
import { Airport } from "@/lib/convergence/airports";

interface SessionResponse {
  id: string;
  createdAt: string;
  destination: Airport;
  members: GroupMemberSession[];
}

export default function GroupBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [executingSaga, setExecutingSaga] = useState(false);
  const [sagaResult, setSagaResult] = useState<SagaExecutionResult | null>(null);

  // Seat and price hold countdown timer in seconds
  const [ttlSeconds, setTtlSeconds] = useState(300);

  // Group checkout configuration
  const [chaosMode] = useState<"NONE" | "INVENTORY_DEPLETED" | "PRICE_SURGE" | "CARD_DECLINED">("NONE");
  const [targetTravelerId, setTargetTravelerId] = useState<string>("");

  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/saga/session?id=${sessionId}`);
        if (!res.ok) throw new Error("Session not found");
        const data = await res.json();
        setSession(data.session);
        if (data.session?.members?.length > 0) {
          setTargetTravelerId(data.session.members[1]?.id || data.session.members[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (ttlSeconds <= 0) return;
    const interval = setInterval(() => {
      setTtlSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [ttlSeconds]);

  async function triggerSagaCheckout() {
    if (!session) return;
    setExecutingSaga(true);
    setSagaResult(null);

    const chaos: ChaosConfig = {
      simulateFailure: chaosMode !== "NONE",
      failureStep: chaosMode === "CARD_DECLINED" ? "AUTHORIZE_ESCROW" : "VERIFY_INVENTORY",
      failureType: chaosMode === "NONE" ? undefined : chaosMode,
      targetTravelerId: chaosMode !== "NONE" ? targetTravelerId : undefined,
    };

    try {
      const res = await fetch("/api/saga/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          members: session.members,
          chaos,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setSagaResult(data.result);
        if (data.result.isAtomicSuccess) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingSaga(false);
    }
  }

  const formatTtl = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const totalGroupCost = session?.members.reduce((sum, m) => sum + m.flight.priceUsd, 0) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
        <Navbar />
        <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#052659] border-t-transparent" />
          <p className="font-mono text-xs font-semibold text-slate-500">Loading Group Trip Itinerary...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
        <Navbar />
        <div className="flex h-[80vh] flex-col items-center justify-center gap-3 text-center px-4">
          <AlertCircle size={36} className="text-amber-500" />
          <h2 className="text-xl font-bold text-[#021024]">Booking Session Not Found or Expired</h2>
          <p className="text-slate-500 text-xs">Please launch a new convergence search from the home page.</p>
          <Link href="/" className="mt-2 rounded-xl bg-[#052659] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#021024]">
            Return to Search
          </Link>
        </div>
      </div>
    );
  }

  const stepsList: { name: SagaStepName; label: string; desc: string }[] = [
    { name: "ACQUIRE_LOCKS", label: "01. Group Flights Aligned", desc: "Coordinating flight schedules for group arrival" },
    { name: "AUTHORIZE_ESCROW", label: "02. Seats Reserved", desc: "Holding selected seats for all group travelers" },
    { name: "VERIFY_INVENTORY", label: "03. Fare Lock Guaranteed", desc: "100% price lock with zero surge guarantee" },
    { name: "EXECUTE_CHECKOUT", label: "04. Airline Confirmation", desc: "Confirming reservations with partner airlines" },
    { name: "CONFIRM_CAPTURE", label: "05. E-Tickets Issued", desc: "Issuing digital boarding documents and PNRs" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3.5">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <ArrowLeft size={14} /> Back
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Group Trip Itinerary
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#021024] sm:text-2xl">
                Group Trip: {session.destination.city}, {session.destination.country} ({session.destination.code})
              </h1>
            </div>
          </div>

          {/* Timer & Session Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs shadow-xs">
              <Clock size={16} className="text-amber-600" />
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-amber-700">Guaranteed Fare Hold</span>
                <div className="font-mono text-sm font-bold text-amber-900">{formatTtl(ttlSeconds)}</div>
              </div>
            </div>

            <div className="hidden rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs shadow-xs sm:block">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Group Trip ID</span>
              <div className="font-mono text-xs font-bold text-slate-700">{session.id}</div>
            </div>
          </div>
        </div>

        {/* Main Grid: Travelers Roster vs Group Stepper */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left Column: Group Roster & Travel Benefits */}
          <div className="space-y-6">
            {/* Group Members Section */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div>
                  <h2 className="text-sm font-bold text-[#021024]">
                    Traveler Itineraries ({session.members.length} Travelers)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    All members flying into {session.destination.city}.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Group Fare</div>
                  <div className="font-mono text-base font-bold text-[#052659]">${totalGroupCost}</div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {session.members.map((member, idx) => {
                  const resultMember = sagaResult?.members.find(m => m.id === member.id);
                  const displayEscrow = resultMember?.escrowStatus || member.escrowStatus;

                  return (
                    <div
                      key={member.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-slate-200"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-[#052659] border border-blue-100">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#021024]">{member.name}</span>
                              <span className="rounded bg-white px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600 border border-slate-200 shadow-2xs">
                                Seat {member.selectedSeat}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {member.originAirport.city} ({member.originAirport.code}) → {session.destination.code}
                            </p>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2.5">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            displayEscrow === "CAPTURED"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : displayEscrow === "VOIDED_REFUNDED"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-blue-200 bg-blue-50 text-[#052659]"
                          }`}>
                            {displayEscrow === "CAPTURED"
                              ? "CONFIRMED"
                              : displayEscrow === "VOIDED_REFUNDED"
                              ? "CANCELLED"
                              : "SEAT RESERVED"}
                          </span>

                          <span className="font-mono text-xs font-bold text-[#021024]">
                            ${member.flight.priceUsd}
                          </span>
                        </div>
                      </div>

                      {/* Flight Details Pill */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-[11px] text-slate-600 border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Plane size={13} className="text-[#5483B3]" />
                          <span className="font-medium">{member.flight.airline} ({member.flight.flightNumber})</span>
                        </div>
                        <div>Dep: <strong className="text-[#021024]">{member.flight.departureLocal}</strong></div>
                        <div>Arr: <strong className="text-[#021024]">{member.flight.arrivalLocal}</strong></div>
                        {resultMember?.eTicketNumber && (
                          <div className="font-mono text-[10px] font-bold text-emerald-700">
                            {resultMember.eTicketNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Group Travel Price Protection & Policy */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#052659]" />
                <h3 className="text-xs font-bold text-[#021024] uppercase tracking-wider">
                  SkySync Group Travel Guarantee
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                When booking group itineraries, SkySync guarantees that all member flights are confirmed simultaneously. If any individual flight experiences inventory changes, your group is protected with zero liability.
              </p>

              <div className="grid gap-3 sm:grid-cols-3 pt-1">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Price Lock</span>
                  <span className="text-xs font-bold text-[#021024]">100% Guaranteed</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">No surprise price hikes during checkout.</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Arrival Match</span>
                  <span className="text-xs font-bold text-[#021024]">Coordinated Times</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Flight schedules aligned for easy meetup.</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer Care</span>
                  <span className="text-xs font-bold text-[#021024]">24/7 Group Support</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Dedicated travel team assistance.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Group Booking Progress */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600" />
                  <h3 className="text-xs font-bold text-[#021024]">Booking Progress</h3>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold border ${
                  sagaResult?.isAtomicSuccess
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : sagaResult?.status === "ROLLED_BACK"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}>
                  {sagaResult?.isAtomicSuccess ? "CONFIRMED" : sagaResult?.status === "ROLLED_BACK" ? "CANCELLED" : "READY"}
                </span>
              </div>

              {/* Steps Progress */}
              <div className="mt-5 space-y-4">
                {stepsList.map((step, idx) => {
                  const stepState = sagaResult?.steps[step.name]?.state || "IDLE";
                  const isCompleted = stepState === "COMPLETED";
                  const isRolledBack = stepState === "ROLLED_BACK";
                  const isFailed = stepState === "FAILED";
                  const isInProgress = executingSaga && !sagaResult;

                  return (
                    <div key={step.name} className="relative flex items-start gap-3">
                      {idx < stepsList.length - 1 && (
                        <div className="absolute left-3.5 top-7 -bottom-3 w-px bg-slate-200" />
                      )}

                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition ${
                          isCompleted
                            ? "bg-emerald-600 text-white"
                            : isRolledBack || isFailed
                            ? "bg-rose-50 border border-rose-300 text-rose-600"
                            : isInProgress
                            ? "bg-[#5483B3] text-white animate-pulse"
                            : "bg-slate-100 border border-slate-200 text-slate-500"
                        }`}
                      >
                        {isCompleted ? (
                          <Check size={13} />
                        ) : isRolledBack || isFailed ? (
                          <RotateCcw size={13} />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#021024]">{step.label}</span>
                          {isRolledBack && (
                            <span className="text-[10px] font-bold text-rose-600">CANCELLED</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Result Summary */}
              {sagaResult && (
                <div className={`mt-5 rounded-xl border p-3.5 text-xs ${
                  sagaResult.isAtomicSuccess
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-rose-200 bg-rose-50/50"
                }`}>
                  <div className="flex items-center gap-1.5 font-bold text-[#021024]">
                    {sagaResult.isAtomicSuccess ? (
                      <>
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span>All {sagaResult.totalMembers} Group Flights Confirmed!</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} className="text-rose-600" />
                        <span>Group Itinerary Released</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                    {sagaResult.isAtomicSuccess
                      ? `Total group booking of $${sagaResult.totalCapturedUsd} confirmed. E-tickets and booking references have been sent to registered travelers.`
                      : `No charges were captured ($${sagaResult.totalRefundedVoidedUsd} holds released). You can re-attempt group checkout at any time.`}
                  </p>
                </div>
              )}

              {/* Primary Action Button */}
              {sagaResult?.isAtomicSuccess ? (
                <Link
                  href="/profile"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <CheckCircle2 size={14} />
                  <span>View All Bookings in Profile</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={triggerSagaCheckout}
                  disabled={executingSaga}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#052659] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024] disabled:opacity-60"
                >
                  {executingSaga ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Confirming Group Bookings...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} className="text-blue-300" />
                      <span>Confirm & Book Group Flights</span>
                    </>
                  )}
                </button>
              )}

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Protected by SkySync 100% Group Price Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
