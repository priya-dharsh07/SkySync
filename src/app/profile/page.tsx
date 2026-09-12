"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  Plane,
  UserRound,
  LogOut,
  Ticket,
  Clock3,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Printer,
  X,
  MapPin,
  LocateFixed,
  ShieldCheck,
  RotateCcw,
  Check,
  Users,
  ExternalLink,
  Sparkles,
  ChevronRight
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { findNearestAirport } from "@/lib/convergence/airports";

type User = {
  id: string;
  name: string;
  email: string;
  homeAirport?: string;
  homeCity?: string;
  country?: string;
  lat?: number;
  lng?: number;
  createdAt?: string;
};

type BookingItem = {
  _id: string;
  bookingReference: string;
  eTicketNumber: string;
  flightNumber: string;
  airline: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  passengers: Array<{ firstName: string; lastName: string; email?: string; passportNumber?: string }>;
  selectedSeats: string[];
  totalPrice: number;
  escrowStatus: string;
  status: "CONFIRMED" | "CANCELLED";
  isGroupBooking?: boolean;
  groupId?: string;
  groupBookingId?: string;
  groupName?: string;
  travelerRole?: string;
  createdAt: string;
};

type UserGroup = {
  _id?: string;
  groupId?: string;
  groupName?: string;
  id?: string;
  name?: string;
  status: string;
  destination?: { city: string; code: string };
  members: Array<{ userId: string; name: string; role: string; status: string; paymentStatus: string }>;
  organizerId: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "CONFIRMED" | "CANCELLED">("ALL");
  const [tripTypeFilter, setTripTypeFilter] = useState<"ALL" | "SOLO" | "GROUP">("ALL");

  // Selected booking for Boarding Pass Modal
  const [viewingBooking, setViewingBooking] = useState<BookingItem | null>(null);

  // Cancellation modal state
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);

  // Location updating state
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json();

        if (!data.user) {
          window.location.href = "/login";
          return;
        }

        setUser(data.user);

        // Fetch user's booking history
        try {
          const bookingRes = await fetch("/api/bookings", {
            cache: "no-store",
            credentials: "include",
          });
          if (bookingRes.ok) {
            const bData = await bookingRes.json();
            setBookings(bData.bookings || []);
          }
        } catch (bErr) {
          console.warn("Failed to load bookings:", bErr);
        }

        // Fetch user's active group trips
        try {
          const groupRes = await fetch("/api/group-bookings", {
            cache: "no-store",
            credentials: "include",
          });
          if (groupRes.ok) {
            const gData = await groupRes.json();
            setUserGroups(gData.groups || []);
          }
        } catch (gErr) {
          console.warn("Failed to load group trips:", gErr);
        }
      } catch (error) {
        console.error("Profile loading error:", error);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    window.location.href = "/";
  }

  // Update user default home location via GPS
  function handleDetectHomeLocation() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setUpdatingLocation(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestAirport(latitude, longitude);

        if (nearest && nearest.airport) {
          try {
            const res = await fetch("/api/users", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                homeAirport: nearest.airport.code,
                homeCity: nearest.airport.city,
                country: nearest.airport.country,
                lat: latitude,
                lng: longitude,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              if (data.user) {
                setUser((prev) => (prev ? { ...prev, ...data.user } : null));
                setLocationNotice(`Updated home base to ${nearest.airport.city} (${nearest.airport.code})`);
                setTimeout(() => setLocationNotice(null), 5000);
              }
            }
          } catch (err) {
            console.error("Failed updating location:", err);
          }
        }
        setUpdatingLocation(false);
      },
      (err) => {
        setUpdatingLocation(false);
        console.warn("Geolocation warning:", err);
        setLocationNotice("Unable to detect coordinates. Default kept as New Delhi (DEL).");
        setTimeout(() => setLocationNotice(null), 4000);
      },
      { timeout: 8000 }
    );
  }

  // Cancel reservation
  async function confirmCancelBooking() {
    if (!cancellingBookingId) return;

    try {
      setCancellingLoading(true);
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookingId: cancellingBookingId,
          action: "CANCEL",
        }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b._id === cancellingBookingId
              ? { ...b, status: "CANCELLED", escrowStatus: "VOIDED" }
              : b
          )
        );
      }
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setCancellingLoading(false);
      setCancellingBookingId(null);
    }
  }

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === "CONFIRMED" && b.status !== "CONFIRMED") return false;
    if (activeFilter === "CANCELLED" && b.status !== "CANCELLED") return false;
    if (tripTypeFilter === "SOLO" && b.isGroupBooking) return false;
    if (tripTypeFilter === "GROUP" && !b.isGroupBooking) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#F8FAFC] text-[#021024]">
        <Navbar />
        <div className="relative z-10 flex h-[80vh] flex-col items-center justify-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#052659] border-t-transparent" />
          <span className="text-xs text-slate-500 font-semibold">Synchronizing account and booking ledger...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initial = user.name.trim().charAt(0).toUpperCase();

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#021024]">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-24 pb-20 sm:px-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#052659] mb-5 transition"
        >
          <ArrowLeft size={13} /> Back to Home
        </Link>

        {/* Profile Card Header */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[#021024] via-[#052659] to-[#021024] p-7 shadow-md text-white">

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-2xl font-extrabold text-[#C1E8FF] shadow-xs backdrop-blur-md">
                {initial}
              </div>

              <div>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white border border-white/20 backdrop-blur-md uppercase">
                  Verified SkySync Traveler Account
                </span>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">{user.name}</h1>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-blue-100/90">
                  <Mail size={13} />
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/group-booking"
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#052659] shadow-sm hover:bg-blue-50 transition"
              >
                <Users size={14} />
                <span>Group Booking Hub</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-white/20 hover:text-rose-300 backdrop-blur-md"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Location Notice alert if updated */}
        {locationNotice && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 animate-in fade-in">
            <Check size={15} className="shrink-0 text-emerald-600" />
            <span>{locationNotice}</span>
          </div>
        )}

        {/* Grid Stats & Quick Preferences */}
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {/* Default Home Base Location Widget */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-xs p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#052659]">
                <MapPin size={16} className="text-[#5483B3]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#021024]">Default Home Base</h3>
              </div>
              <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Active
              </span>
            </div>

            <div>
              <div className="text-sm font-extrabold text-[#021024]">
                {user.homeCity || "New Delhi"} ({user.homeAirport || "DEL"})
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically prefilled as your departure airport for solo and group trips.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDetectHomeLocation}
              disabled={updatingLocation}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs disabled:opacity-60"
            >
              <LocateFixed size={13} className={updatingLocation ? "animate-spin text-[#052659]" : "text-[#5483B3]"} />
              <span>{updatingLocation ? "Detecting..." : "Update via Current Location"}</span>
            </button>
          </div>

          {/* Booked Flights Overview */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-xs p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[#052659] border-b border-slate-100 pb-3">
              <Ticket size={16} className="text-[#5483B3]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#021024]">My Reservations</h3>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="font-mono text-3xl font-extrabold text-[#052659]">{bookings.length}</div>
              <div className="text-right text-xs">
                <span className="text-emerald-700 font-bold">
                  {bookings.filter((b) => b.status === "CONFIRMED").length} Confirmed
                </span>
                <span className="text-slate-400 block text-[10px]">
                  {bookings.filter((b) => b.status === "CANCELLED").length} Cancelled
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href="/flights"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#052659] py-2 text-xs font-bold text-white shadow-sm hover:bg-[#021024] transition"
              >
                <Plane size={13} />
                <span>Solo Flight</span>
              </Link>
              <Link
                href="/group-booking"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 py-2 text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-100 transition"
              >
                <Users size={13} />
                <span>Group Trip</span>
              </Link>
            </div>
          </div>

          {/* Protection & Support */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-xs p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[#052659] border-b border-slate-100 pb-3">
              <ShieldCheck size={16} className="text-[#5483B3]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#021024]">Travel Protection</h3>
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span>Trip Protection:</span>
                <strong className="text-emerald-700 font-mono text-[11px]">ACTIVE</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span>Customer Care:</span>
                <strong className="text-[#052659] font-mono text-[11px]">24/7 PRIORITY</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE GROUP EXPEDITIONS SECTION (If user has group bookings) */}
        {userGroups.length > 0 && (
          <div className="mt-8 rounded-3xl border border-purple-200 bg-gradient-to-r from-purple-50/50 via-white to-blue-50/40 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
                  <Users size={18} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#021024]">My Group Travel Expeditions</h2>
                  <p className="text-xs text-slate-500">
                    Active multi-origin group itineraries where you are an organizer or invited traveler.
                  </p>
                </div>
              </div>

              <Link
                href="/group-booking"
                className="flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 transition"
              >
                <span>View All In Group Hub</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {userGroups.map((g, idx) => {
                const isOrganizer = g.organizerId === user.id;
                const groupKey = g.groupId || g._id || g.id || `group-trip-${idx}`;
                return (
                  <div
                    key={groupKey}
                    className="flex flex-col justify-between rounded-2xl border border-purple-200/80 bg-white p-4 shadow-2xs hover:shadow-xs transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          {g.status ? g.status.replace(/_/g, " ") : "PLANNING"}
                        </span>
                        <span className="rounded px-2 py-0.5 text-[9px] font-bold uppercase font-mono bg-slate-100 text-slate-700">
                          {isOrganizer ? "Organizer" : "Traveler"}
                        </span>
                      </div>

                      <h4 className="mt-2 text-sm font-bold text-[#021024]">{g.groupName || g.name || "Group Trip"}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {g.destination?.city ? `Destination: ${g.destination.city} (${g.destination.code})` : "Selecting Hub Destination"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="text-slate-500 font-medium">
                        {g.members?.length || 0} Travelers
                      </span>
                      <Link
                        href={`/group-booking/${g.groupId || g._id || g.id}`}
                        className="inline-flex items-center gap-1 font-bold text-[#052659] hover:underline"
                      >
                        <span>Workspace</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BOOKING HISTORY SECTION */}
        <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xs p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#021024]">Flight Booking History</h2>
              <p className="text-xs text-slate-500">
                All confirmed and past travel itineraries recorded under your account.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Trip Type Filter */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTripTypeFilter("ALL")}
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    tripTypeFilter === "ALL" ? "bg-white text-[#052659] shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Types
                </button>
                <button
                  type="button"
                  onClick={() => setTripTypeFilter("SOLO")}
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    tripTypeFilter === "SOLO" ? "bg-white text-[#052659] shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Solo
                </button>
                <button
                  type="button"
                  onClick={() => setTripTypeFilter("GROUP")}
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    tripTypeFilter === "GROUP" ? "bg-white text-purple-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Group
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveFilter("ALL")}
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    activeFilter === "ALL" ? "bg-white text-[#052659] shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({bookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("CONFIRMED")}
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    activeFilter === "CONFIRMED" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Confirmed ({bookings.filter((b) => b.status === "CONFIRMED").length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("CANCELLED")}
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    activeFilter === "CANCELLED" ? "bg-white text-rose-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cancelled ({bookings.filter((b) => b.status === "CANCELLED").length})
                </button>
              </div>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center space-y-3">
              <Clock3 size={32} className="mx-auto text-slate-300" />
              <h3 className="text-sm font-bold text-[#021024]">No Reservations Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {activeFilter === "ALL"
                  ? "You haven't completed any bookings yet. Search flights or launch a group convergence session to book."
                  : `No ${activeFilter.toLowerCase()} reservations matching your filter.`}
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <Link
                  href="/flights"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#052659] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#021024] transition"
                >
                  <Plane size={13} />
                  <span>Book Solo Flight</span>
                </Link>
                <Link
                  href="/group-booking"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-100 transition"
                >
                  <Users size={13} />
                  <span>Create Group Trip</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredBookings.map((b) => {
                const isCancelled = b.status === "CANCELLED";

                return (
                  <div
                    key={b._id}
                    className={`rounded-2xl border p-5 transition shadow-2xs ${
                      isCancelled
                        ? "border-slate-200 bg-slate-50/60 opacity-80"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    {/* Group Badge Banner if part of a group booking */}
                    {b.isGroupBooking && (
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
                            <Users size={11} /> Group Trip: {b.groupName || "Group Expedition"}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase font-mono">
                            Role: {b.travelerRole || "Member"}
                          </span>
                        </div>
                        {b.groupId && (
                          <Link
                            href={`/group-booking/${b.groupId}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#052659] hover:underline"
                          >
                            <span>Open Group Workspace</span>
                            <ExternalLink size={11} />
                          </Link>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* Carrier & Flight Header */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl font-mono text-xs font-bold ${
                            isCancelled ? "bg-slate-300 text-slate-600" : "bg-[#052659] text-[#C1E8FF]"
                          }`}
                        >
                          {b.airline.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#021024]">
                              {b.airline} ({b.flightNumber})
                            </h4>
                            <span
                              className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold border ${
                                isCancelled
                                  ? "border-rose-200 bg-rose-50 text-rose-700"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                          <div className="font-mono text-xs text-slate-500">
                            PNR: <strong className="text-[#052659]">{b.bookingReference}</strong> • {b.eTicketNumber}
                          </div>
                        </div>
                      </div>

                      {/* Flight Route & Timings */}
                      <div className="flex items-center gap-6 text-center text-xs">
                        <div>
                          <div className="font-mono text-base font-extrabold text-[#021024]">{b.originCode}</div>
                          <div className="text-[11px] text-slate-500 font-semibold">{b.departureTime}</div>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-400 font-mono">{b.departureDate}</span>
                          <div className="relative my-1 w-20 border-t border-slate-300">
                            <Plane size={11} className="absolute left-1/2 -top-1.5 -translate-x-1/2 text-[#5483B3]" />
                          </div>
                          <span className="text-[9px] text-slate-400 uppercase font-semibold">Non-stop</span>
                        </div>

                        <div>
                          <div className="font-mono text-base font-extrabold text-[#021024]">{b.destinationCode}</div>
                          <div className="text-[11px] text-slate-500 font-semibold">{b.arrivalTime}</div>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="font-mono text-base font-extrabold text-[#052659]">₹{b.totalPrice}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Seats: {b.selectedSeats?.join(", ") || "Standard"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingBooking(b)}
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                          >
                            View Boarding Pass
                          </button>

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => setCancellingBookingId(b._id)}
                              className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition shadow-2xs"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BOARDING PASS MODAL */}
        {viewingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Ticket size={18} className="text-[#052659]" />
                  <h3 className="text-sm font-bold text-[#021024]">
                    Boarding Pass: {viewingBooking.bookingReference}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingBooking(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>

              {/* If Group Trip, Banner in Boarding Pass */}
              {viewingBooking.isGroupBooking && (
                <div className="flex items-center justify-between rounded-xl bg-purple-50 p-2.5 border border-purple-200 text-xs font-semibold text-purple-800">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-purple-600" />
                    <span>Group Booking: <strong>{viewingBooking.groupName || "Group Expedition"}</strong></span>
                  </div>
                  <span className="font-mono text-[10px] uppercase font-bold text-purple-700">
                    Role: {viewingBooking.travelerRole || "Traveler"}
                  </span>
                </div>
              )}

              {/* Boarding Pass Box */}
              <div className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-md">
                <div className="flex items-center justify-between bg-slate-900 px-5 py-3 text-white">
                  <span className="font-extrabold text-sm">{viewingBooking.airline}</span>
                  <span className="font-mono text-xs font-bold text-[#C1E8FF]">{viewingBooking.flightNumber}</span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 items-center text-center">
                    <div className="text-left">
                      <div className="font-mono text-3xl font-extrabold">{viewingBooking.originCode}</div>
                      <div className="text-xs text-slate-500 font-bold">{viewingBooking.origin}</div>
                      <div className="font-mono text-xs text-[#052659] font-bold">{viewingBooking.departureTime}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-[9px] text-emerald-700 font-bold">CONFIRMED</span>
                      <div className="relative my-1 w-20 border-t border-slate-300">
                        <Plane size={10} className="absolute left-1/2 -top-1.5 -translate-x-1/2 text-[#5483B3]" />
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{viewingBooking.departureDate}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-3xl font-extrabold">{viewingBooking.destinationCode}</div>
                      <div className="text-xs text-slate-500 font-bold">{viewingBooking.destination}</div>
                      <div className="font-mono text-xs text-[#052659] font-bold">{viewingBooking.arrivalTime}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 font-mono text-xs border border-slate-100">
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">Passenger</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {viewingBooking.passengers?.map((p) => `${p.firstName} ${p.lastName}`).join(", ") || "Traveler"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">Seats</span>
                      <span className="font-bold text-emerald-700">{viewingBooking.selectedSeats?.join(", ") || "14A"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">Terminal / Gate</span>
                      <span className="font-bold text-[#052659]">T3 • 14B</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">E-Ticket</span>
                      <span className="text-slate-700">{viewingBooking.eTicketNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <QrCode size={32} className="text-slate-900" />
                      <span className="font-mono text-[9px] text-slate-400">ICAO e-Ticket Scannable Barcode</span>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-[#052659]">
                      Total Paid: ₹{viewingBooking.totalPrice}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Printer size={14} />
                  <span>Print Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingBooking(null)}
                  className="rounded-xl bg-[#052659] px-5 py-2 text-xs font-bold text-white hover:bg-[#021024]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CANCEL CONFIRMATION DIALOG */}
        {cancellingBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                <RotateCcw size={22} />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#021024]">Cancel Flight Reservation?</h3>
                <p className="mt-1 text-xs text-slate-500">
                  This will process a 100% full refund to your original payment method and release the assigned seats back to airline inventory.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={confirmCancelBooking}
                  disabled={cancellingLoading}
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {cancellingLoading ? "Cancelling..." : "Confirm Cancellation"}
                </button>
                <button
                  type="button"
                  onClick={() => setCancellingBookingId(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Keep Reservation
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}