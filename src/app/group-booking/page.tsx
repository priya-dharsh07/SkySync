"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  ArrowRight,
  Plane,
  Calendar,
  MapPin,
  Sparkles,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  UserCheck,
  Compass,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface GroupSummary {
  _id: string;
  groupId: string;
  groupName: string;
  organizerId: string;
  organizerEmail: string;
  organizerName: string;
  status: string;
  paymentMode?: string;
  destination?: any;
  targetDate: string;
  members: any[];
  totalPrice?: number;
  createdAt: string;
}

interface SiteUser {
  id: string;
  name: string;
  email: string;
  homeAirport?: string;
  homeCity?: string;
}

export default function GroupBookingHubPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [selectedTravelers, setSelectedTravelers] = useState<SiteUser[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [availableUsers, setAvailableUsers] = useState<SiteUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load authenticated user
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const uData = await userRes.json();
          setCurrentUser(uData.user);
        }

        // Load user's group trips
        const groupRes = await fetch("/api/group-bookings");
        if (groupRes.ok) {
          const gData = await groupRes.json();
          setGroups(gData.groups || []);
        }

        // Load available users for inviting
        const usersRes = await fetch("/api/users");
        if (usersRes.ok) {
          const uListData = await usersRes.json();
          setAvailableUsers(uListData.users || []);
        }
      } catch (err) {
        console.error("Failed loading group hub:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) {
      setCreateError("Please enter a group name.");
      return;
    }

    if (!currentUser) {
      window.location.href = "/login?redirect=/group-booking";
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const res = await fetch("/api/group-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: groupName.trim(),
          targetDate,
          initialMembers: selectedTravelers,
        }),
      });

      const data = await res.json();
      if (res.ok && data.groupId) {
        router.push(`/group-booking/${data.groupId}`);
      } else {
        setCreateError(data.message || "Failed to create group trip.");
      }
    } catch (err) {
      console.error(err);
      setCreateError("Network error creating group trip. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function toggleTraveler(user: SiteUser) {
    if (selectedTravelers.some((t) => t.email.toLowerCase() === user.email.toLowerCase())) {
      setSelectedTravelers(selectedTravelers.filter((t) => t.email.toLowerCase() !== user.email.toLowerCase()));
    } else {
      setSelectedTravelers([...selectedTravelers, user]);
    }
  }

  const filteredUsers = availableUsers.filter((u) => {
    if (currentUser && u.email.toLowerCase() === currentUser.email.toLowerCase()) return false;
    const q = userQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.homeCity && u.homeCity.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#021024]">
      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:px-8">
          {/* HERO BANNER WITH CLEAN NAVY GRADIENT */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[#021024] via-[#052659] to-[#021024] p-8 shadow-md sm:p-12 text-white">

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-white/10 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                <Users size={14} className="text-[#C1E8FF]" />
                <span>Dedicated Group Travel Suite</span>
              </div>

              <h1 style={{ color: "#ffffff" }} className="mt-4 text-3xl font-black tracking-tight text-white !text-white drop-shadow-md sm:text-4xl lg:text-5xl">
                Plan, Align & Book Flights for Your Group
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-blue-100/90 sm:text-base">
                No more coordinating across disjointed booking portals. Gather your friends or colleagues flying from different departure cities, discover the most optimal meeting destination, hold guaranteed group seats, and choose whether travelers pay separately or the organizer pays for everyone.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      window.location.href = "/login?redirect=/group-booking";
                      return;
                    }
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-xs font-bold text-[#052659] shadow-md transition hover:bg-blue-50 hover:shadow-lg"
                >
                  <Plus size={16} />
                  <span>Create New Group Trip</span>
                </button>

                <Link
                  href="/"
                  className="flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-white/20 backdrop-blur-md"
                >
                  <Compass size={16} className="text-[#C1E8FF]" />
                  <span>Explore Meeting Hubs</span>
                </Link>
              </div>
            </div>
          </div>

          {/* MY GROUP TRIPS SECTION */}
          <div className="mt-12">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#021024]">Your Group Trips</h2>
                <p className="text-xs text-slate-500">
                  Trips you are organizing or have been invited to join.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#052659] hover:underline"
              >
                <Plus size={14} /> Start Another Trip
              </button>
            </div>

            {loading ? (
              <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-xs backdrop-blur-xs">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#052659] border-t-transparent" />
                <span className="text-xs font-semibold text-slate-500">Loading your group trips...</span>
              </div>
            ) : groups.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-xs backdrop-blur-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#052659]">
                  <Users size={28} />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#021024]">No Group Trips Yet</h3>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                  Create your first group trip to invite travelers from multiple cities, compare flights, and coordinate arrival times.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#021024]"
                >
                  <Plus size={14} /> Create Your First Group
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => {
                  const isOrganizer = currentUser && (currentUser.id === group.organizerId || currentUser.email.toLowerCase() === group.organizerEmail.toLowerCase());
                  const confirmedMembers = group.members.filter((m) => m.paymentStatus === "PAID").length;

                  return (
                    <div
                      key={group.groupId}
                      className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white/90 p-6 shadow-xs backdrop-blur-xs transition hover:border-[#5483B3] hover:shadow-md"
                    >
                      <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              group.status === "CONFIRMED"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : group.status === "PAYMENT_IN_PROGRESS"
                                ? "border-amber-200 bg-amber-50 text-amber-800"
                                : group.status === "OPTIMIZED"
                                ? "border-blue-200 bg-blue-50 text-[#052659]"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {group.status.replace(/_/g, " ")}
                          </span>

                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {isOrganizer ? "ORGANIZER" : "MEMBER"}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="mt-3 text-base font-bold text-[#021024]">{group.groupName}</h3>

                        {/* Destination or target */}
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin size={13} className="text-[#5483B3]" />
                          {group.destination ? (
                            <span>
                              {group.destination.city}, {group.destination.country} ({group.destination.code})
                            </span>
                          ) : (
                            <span className="italic text-slate-400">Destination to be optimized</span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{group.targetDate}</span>
                        </div>

                        {/* Roster mini-avatars */}
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-500">Travelers</span>
                            <span className="font-mono text-xs font-bold text-[#021024]">
                              {group.members.length} Members
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-1">
                            {group.members.slice(0, 5).map((m: any, idx: number) => (
                              <div
                                key={idx}
                                title={`${m.name} (${m.email})`}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#052659] text-[10px] font-bold text-white shadow-2xs"
                              >
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {group.members.length > 5 && (
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600">
                                +{group.members.length - 5}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          {group.paymentMode === "INDIVIDUAL" ? (
                            <span className="text-[10px] text-slate-500">
                              {confirmedMembers}/{group.members.length} Paid
                            </span>
                          ) : group.totalPrice ? (
                            <span className="font-mono text-xs font-bold text-[#052659]">
                              ${group.totalPrice} total
                            </span>
                          ) : null}
                        </div>

                        <Link
                          href={`/group-booking/${group.groupId}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#052659] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#021024] transition"
                        >
                          <span>Open Trip</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6-STEP WORKFLOW SHOWCASE */}
          <div className="mt-16 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-xs">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                End-to-End Coordination
              </span>
              <h3 className="mt-1 text-xl font-extrabold text-[#021024] sm:text-2xl">
                The SkySync Group Journey
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                How our group booking platform ensures every friend and colleague is accounted for, locked into the fairest flight, and confirmed simultaneously.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <span className="font-mono text-[10px] font-bold text-blue-600">STAGE 01</span>
                <h4 className="mt-1 text-sm font-bold text-[#021024]">Create & Invite</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  The organizer names the trip and invites registered SkySync users or friends via email with zero friction.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <span className="font-mono text-[10px] font-bold text-blue-600">STAGE 02</span>
                <h4 className="mt-1 text-sm font-bold text-[#021024]">Set Departure Cities</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Each traveler confirms their departure airport, automatically pre-filled from their profile or with 1-click GPS detection.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <span className="font-mono text-[10px] font-bold text-blue-600">STAGE 03</span>
                <h4 className="mt-1 text-sm font-bold text-[#021024]">Optimize Hub</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  SkySync analyzes candidate destinations to recommend the hub with the lowest average ticket fares and closest arrival times.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <span className="font-mono text-[10px] font-bold text-blue-600">STAGE 04</span>
                <h4 className="mt-1 text-sm font-bold text-[#021024]">Lock Flights & Seats</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Review synchronized flight schedules, customize time slots if desired, and lock the itinerary for the entire group.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <span className="font-mono text-[10px] font-bold text-blue-600">STAGE 05</span>
                <h4 className="mt-1 text-sm font-bold text-[#021024]">Flexible Payment</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Choose between Option 1 (Each traveler reviews their own details and pays separately) or Option 2 (Organizer pays for all).
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <span className="font-mono text-[10px] font-bold text-blue-600">STAGE 06</span>
                <h4 className="mt-1 text-sm font-bold text-[#021024]">Official Travel Documents</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Instant confirmed PNRs, official airline e-tickets, and digital boarding passes delivered securely to each traveler.
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* CREATE GROUP TRIP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#052659]" />
                <h3 className="text-base font-bold text-[#021024]">Create New Group Trip</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
              {createError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Group Trip Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Friends Reunion 2026, Leadership Summit..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-[#021024] placeholder-slate-400 focus:border-[#5483B3] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Target Travel Date *
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-[#021024] focus:border-[#5483B3] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Add Registered SkySync Users */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Invite Registered Travelers ({selectedTravelers.length} selected)
                  </label>
                  <span className="text-[10px] text-slate-400">You can also invite more later</span>
                </div>

                <div className="relative mt-1.5">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or city..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-8 pr-3 text-xs text-[#021024] placeholder-slate-400 focus:border-[#5483B3] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Selected pills */}
                {selectedTravelers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedTravelers.map((t) => (
                      <span
                        key={t.email}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-[#052659] border border-blue-200"
                      >
                        {t.name}
                        <button
                          type="button"
                          onClick={() => toggleTraveler(t)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick picker list */}
                <div className="mt-2 max-h-36 overflow-y-auto space-y-1 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2">
                  {filteredUsers.length === 0 ? (
                    <p className="p-2 text-center text-xs text-slate-400">No travelers found</p>
                  ) : (
                    filteredUsers.slice(0, 8).map((u) => {
                      const isSelected = selectedTravelers.some(
                        (t) => t.email.toLowerCase() === u.email.toLowerCase()
                      );
                      return (
                        <div
                          key={u.email}
                          onClick={() => toggleTraveler(u)}
                          className={`flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                            isSelected
                              ? "bg-blue-100/70 text-[#052659] font-bold"
                              : "hover:bg-white text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#052659] text-[10px] font-bold text-white">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold">{u.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {u.email} {u.homeCity ? `• ${u.homeCity}` : ""}
                              </div>
                            </div>
                          </div>
                          {isSelected && <UserCheck size={14} className="text-blue-600" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-1.5 rounded-xl bg-[#052659] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#021024] disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Creating Trip Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Group Workspace</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
