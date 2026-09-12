"use client";

import { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Users,
  Plus,
  ArrowLeft,
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
  Crown,
  Lock,
  CreditCard,
  Ticket,
  Printer,
  ChevronRight,
  AlertTriangle,
  QrCode,
  Armchair,
  Check,
  Trash2,
  LogOut,
  Sliders,
  DollarSign,
  UserPlus,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageBackground from "@/components/layout/PageBackground";
import bgImage from "@/bgs/image4.png";
import { AIRPORTS, getAirportByCode, findNearestAirport } from "@/lib/convergence/airports";
import { getAircraftLayoutForFlight, SeatItem } from "@/lib/seats/aircraftLayouts";
import { checkVisaRequirement, VisaRequirement } from "@/lib/visa/visaRules";

interface GroupMember {
  userId?: string;
  name: string;
  email: string;
  role: "ORGANIZER" | "MEMBER";
  invitationStatus: "INVITED" | "ACCEPTED" | "DECLINED";
  originAirport?: {
    code: string;
    city: string;
    country: string;
    name: string;
    lat: number;
    lng: number;
  };
  flight?: any;
  passengerDetails?: {
    title?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    passportNumber?: string;
    passportCountry?: string;
    passportExpiry?: string;
    visaStatus?: string;
  };
  passengerDetailsComplete: boolean;
  selectedSeat?: string;
  paymentStatus: "UNPAID" | "PROCESSING" | "PAID" | "FAILED";
  bookingReference?: string;
  eTicketNumber?: string;
  bookingId?: string;
  paidAt?: string;
}

interface GroupData {
  _id: string;
  groupId: string;
  groupName: string;
  organizerId: string;
  organizerEmail: string;
  organizerName: string;
  status:
    | "PLANNING"
    | "OPTIMIZED"
    | "ITINERARY_LOCKED"
    | "PAYMENT_IN_PROGRESS"
    | "CONFIRMED"
    | "CANCELLED";
  paymentMode?: "INDIVIDUAL" | "ORGANIZER";
  destination?: any;
  targetDate: string;
  members: GroupMember[];
  totalPrice?: number;
  optimizationMetrics?: any;
  createdAt: string;
}

interface SiteUser {
  id: string;
  name: string;
  email: string;
  homeAirport?: string;
  homeCity?: string;
}

export default function GroupBookingWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const groupIdParam = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [viewer, setViewer] = useState<{
    isOrganizer: boolean;
    isMember: boolean;
    currentUserId?: string;
    currentUserEmail?: string;
  }>({ isOrganizer: false, isMember: false });

  // Action / Feedback state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Invite traveler modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<SiteUser[]>([]);
  const [userQuery, setUserQuery] = useState("");

  // Transfer organizer modal
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Origin picker modal
  const [editingOriginMember, setEditingOriginMember] = useState<GroupMember | null>(null);
  const [originSearchQuery, setOriginSearchQuery] = useState("");
  const [detectingGps, setDetectingGps] = useState(false);

  // Passenger details modal
  const [editingPassengerMember, setEditingPassengerMember] = useState<GroupMember | null>(null);
  const [passengerForm, setPassengerForm] = useState({
    title: "Mr",
    firstName: "",
    lastName: "",
    email: "",
    phone: "+91 98401 23456",
    dateOfBirth: "1995-06-15",
    gender: "male",
    passportNumber: "",
    passportCountry: "IND",
    passportExpiry: "2032-11-20",
  });

  // Seat selection modal
  const [seatPickerMember, setSeatPickerMember] = useState<GroupMember | null>(null);
  const [selectedSeatTemp, setSelectedSeatTemp] = useState<string>("");

  // Payment checkout modal (Option 1 or Option 2)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTargetMember, setPaymentTargetMember] = useState<GroupMember | null>(null); // null = group pay
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "UPI" | "NETBANKING">("CARD");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Viewing e-ticket modal
  const [viewingTicketMember, setViewingTicketMember] = useState<GroupMember | null>(null);

  // Load group details
  async function loadGroupData() {
    try {
      const res = await fetch(`/api/group-bookings/${groupIdParam}`);
      if (!res.ok) throw new Error("Group trip not found");
      const data = await res.json();
      setGroup(data.group);
      setViewer(data.viewer);
    } catch (err) {
      console.error(err);
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroupData();
    // Load registered users for inviting
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.users) setAvailableUsers(d.users);
      });
  }, [groupIdParam]);

  function notify(type: "success" | "error", text: string) {
    setActionNotice({ type, text });
    setTimeout(() => setActionNotice(null), 5000);
  }

  // Generic patch action executor
  async function executeGroupAction(payload: Record<string, any>) {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/group-bookings/${groupIdParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update group trip.");
      }

      if (data.group) setGroup(data.group);
      notify("success", data.message || "Trip updated successfully.");
      return data;
    } catch (err: any) {
      console.error(err);
      notify("error", err.message || "An unexpected error occurred.");
      return null;
    } finally {
      setActionLoading(false);
    }
  }

  // Invite traveler
  async function handleInviteTraveler(userToInvite?: SiteUser) {
    const email = userToInvite?.email || inviteEmail;
    const name = userToInvite?.name || inviteName;
    const originCode = userToInvite?.homeAirport;

    if (!email) return;

    setInviteError(null);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/group-bookings/${groupIdParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "INVITE_MEMBER", email, name, originCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Surface error inline in the modal, not as a console error
        setInviteError(data.message || "Failed to add traveler.");
        return;
      }
      if (data.group) setGroup(data.group);
      notify("success", data.message || "Traveler added to the group.");
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteName("");
      setInviteError(null);
    } catch (err: any) {
      setInviteError(err.message || "An unexpected error occurred.");
    } finally {
      setActionLoading(false);
    }
  }

  // Remove traveler
  async function handleRemoveTraveler(memberEmail: string) {
    if (!confirm("Are you sure you want to remove this traveler from the group?")) return;
    await executeGroupAction({
      action: "REMOVE_MEMBER",
      memberEmail,
    });
  }

  // Transfer organizer
  async function handleTransferOrganizer(targetEmail: string) {
    const res = await executeGroupAction({
      action: "TRANSFER_ORGANIZER",
      targetEmail,
    });
    if (res?.success) {
      setShowTransferModal(false);
      setViewer((prev) => ({ ...prev, isOrganizer: false }));
    }
  }

  // Accept / Decline / Leave
  async function handleAcceptInvite() {
    await executeGroupAction({ action: "ACCEPT_INVITE" });
    setViewer((prev) => ({ ...prev, isMember: true }));
  }

  async function handleDeclineInvite() {
    await executeGroupAction({ action: "DECLINE_INVITE" });
  }

  async function handleLeaveGroup() {
    if (!confirm("Are you sure you want to leave this group trip?")) return;
    await executeGroupAction({ action: "LEAVE_GROUP" });
    router.push("/group-booking");
  }

  // Update origin
  async function handleSelectOrigin(airportCode: string) {
    if (!editingOriginMember) return;
    const res = await executeGroupAction({
      action: "UPDATE_ORIGIN",
      memberEmail: editingOriginMember.email,
      originCode: airportCode,
    });
    if (res?.success) {
      setEditingOriginMember(null);
    }
  }

  // Detect GPS
  function handleDetectGps() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingGps(false);
        const nearest = findNearestAirport(pos.coords.latitude, pos.coords.longitude);
        if (nearest?.airport) {
          handleSelectOrigin(nearest.airport.code);
        }
      },
      (err) => {
        setDetectingGps(false);
        alert("Unable to detect coordinates. Please select your departure city manually.");
      },
      { timeout: 8000 }
    );
  }

  // Optimize Trip
  async function handleRunOptimization() {
    const res = await executeGroupAction({ action: "OPTIMIZE_TRIP" });
    if (res?.success) {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    }
  }

  // Lock Itinerary
  async function handleLockItinerary() {
    await executeGroupAction({ action: "LOCK_ITINERARY" });
  }

  // Select Payment Mode
  async function handleSelectPaymentMode(mode: "INDIVIDUAL" | "ORGANIZER") {
    await executeGroupAction({
      action: "SELECT_PAYMENT_MODE",
      paymentMode: mode,
    });
  }

  // Passenger form save
  async function handleSavePassengerDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPassengerMember) return;

    const res = await executeGroupAction({
      action: "UPDATE_PASSENGER_DETAILS",
      memberEmail: editingPassengerMember.email,
      passengerDetails: passengerForm,
    });

    if (res?.success) {
      setEditingPassengerMember(null);
    }
  }

  // Save seat
  async function handleConfirmSeat() {
    if (!seatPickerMember || !selectedSeatTemp) return;
    const res = await executeGroupAction({
      action: "SELECT_SEAT",
      memberEmail: seatPickerMember.email,
      seatId: selectedSeatTemp,
    });
    if (res?.success) {
      setSeatPickerMember(null);
    }
  }

  // Execute checkout
  async function handleExecutePayment(e: React.FormEvent) {
    e.preventDefault();
    setProcessingPayment(true);

    try {
      if (paymentTargetMember) {
        // Option 1: Individual pay
        const res = await fetch(`/api/group-bookings/${groupIdParam}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "PROCESS_MEMBER_PAYMENT",
            memberEmail: paymentTargetMember.email,
            paymentCardLast4: cardNumber.replace(/\s+/g, "").slice(-4) || "4242",
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Payment authorization declined.");

        setShowPaymentModal(false);
        setGroup(data.group);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        notify("success", "Your flight ticket and boarding pass have been issued!");
      } else {
        // Option 2: Group pay
        const res = await fetch(`/api/group-bookings/${groupIdParam}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "PROCESS_GROUP_PAYMENT",
            paymentCardLast4: cardNumber.replace(/\s+/g, "").slice(-4) || "4242",
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Group payment authorization declined.");

        setShowPaymentModal(false);
        setGroup(data.group);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        notify("success", "All group tickets and boarding passes have been confirmed!");
      }
    } catch (err: any) {
      notify("error", err.message || "Payment failed. Please check your credentials and try again.");
    } finally {
      setProcessingPayment(false);
    }
  }

  // Check visa advisory for passenger modal
  const visaAdvisory: VisaRequirement | null = useMemo(() => {
    if (!editingPassengerMember || !group?.destination) return null;
    const destCountry = group.destination.country || group.destination.city || "United Arab Emirates";
    const originCountry = editingPassengerMember.originAirport?.country || "India";
    return checkVisaRequirement(passengerForm.passportCountry || "IND", destCountry, originCountry);
  }, [editingPassengerMember, group?.destination, passengerForm.passportCountry]);

  // Seat layout for seat picker modal
  const seatLayout = useMemo(() => {
    if (!seatPickerMember?.flight) return null;
    return getAircraftLayoutForFlight(seatPickerMember.flight);
  }, [seatPickerMember?.flight]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
        <Navbar />
        <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#052659] border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading Group Trip Itinerary...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
        <Navbar />
        <div className="flex h-[80vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <AlertCircle size={36} className="text-amber-500" />
          <h2 className="text-xl font-bold text-[#021024]">Group Trip Not Found or Inactive</h2>
          <p className="text-xs text-slate-500">The requested trip ID could not be found or has expired.</p>
          <Link
            href="/group-booking"
            className="mt-2 rounded-xl bg-[#052659] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#021024]"
          >
            Return to Group Hub
          </Link>
        </div>
      </div>
    );
  }

  const isOrganizer = viewer.isOrganizer;
  const currentMember = group.members.find(
    (m) =>
      (m.userId && m.userId === viewer.currentUserId) ||
      (m.email && m.email.toLowerCase() === viewer.currentUserEmail?.toLowerCase())
  );

  const readyOriginsCount = group.members.filter((m) => m.originAirport?.code).length;
  const totalGroupFare = group.members.reduce((sum, m) => sum + (m.flight?.priceUsd || 0), 0);
  const paidMembersCount = group.members.filter((m) => m.paymentStatus === "PAID").length;

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#021024]">
      {/* Background Image Integration */}
      <PageBackground
        image={bgImage}
        alt="Group Trip Navigation Grid"
        opacityClass="opacity-40 sm:opacity-50"
        overlayClass="bg-gradient-to-b from-white/70 via-slate-50/60 to-slate-100/80"
      />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 pt-24 pb-24 sm:px-6 lg:px-8">
          {/* Top Photographic Scenic Hero Banner */}
          <div className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-[#021024] shadow-lg">
            <Image
              src={bgImage}
              alt="Group Flight Logistics Banner"
              fill
              priority
              className="object-cover opacity-45 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#021024]/95 via-[#052659]/80 to-transparent" />
            <div className="relative z-10 p-6 sm:p-8 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-sky-300">
                      Synchronized Group Workspace • {group.groupId}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {group.groupName}
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-sky-100/80 max-w-xl">
                    {group.destination
                      ? `Multi-origin convergence: ${group.members.length} travelers converging to ${group.destination.city}, ${group.destination.country} (${group.destination.code}).`
                      : `Multi-origin group itinerary workspace for ${group.members.length} registered travelers.`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-right backdrop-blur-md">
                    <span className="text-[10px] uppercase font-bold text-sky-200 block">Workspace Status</span>
                    <span className="text-sm font-extrabold text-white">
                      {group.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-right backdrop-blur-md">
                    <span className="text-[10px] uppercase font-bold text-sky-200 block">Total Group Fare</span>
                    <span className="text-sm font-extrabold font-mono text-emerald-300">
                      ${totalGroupFare}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Action Notification Alert */}
          {actionNotice && (
            <div
              className={`mb-5 flex items-center justify-between gap-3 rounded-2xl border p-4 text-xs font-semibold shadow-xs animate-in fade-in ${
                actionNotice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {actionNotice.type === "success" ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                )}
                <span>{actionNotice.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionNotice(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Invitation Banner for Invited Member */}
          {currentMember && currentMember.invitationStatus === "INVITED" && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-blue-200 bg-blue-50/90 p-5 shadow-xs backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#052659] text-white">
                  <Plane size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#052659] uppercase tracking-wider">
                    You have been invited to join this group trip!
                  </h3>
                  <p className="text-xs text-slate-600">
                    Organized by <strong>{group.organizerName}</strong> for travel around {group.targetDate}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAcceptInvite}
                  disabled={actionLoading}
                  className="rounded-xl bg-[#052659] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#021024] disabled:opacity-60"
                >
                  Accept Invitation
                </button>
                <button
                  type="button"
                  onClick={handleDeclineInvite}
                  disabled={actionLoading}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Top Header & Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3.5">
              <Link
                href="/group-booking"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <ArrowLeft size={14} /> Group Hub
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Group Trip Workspace • {group.groupId}
                  </span>
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-[#021024] sm:text-2xl">
                  {group.groupName}
                </h1>
              </div>
            </div>

            {/* Organizer Badge & Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2 text-xs shadow-xs backdrop-blur-xs">
                <Crown size={15} className="text-amber-500" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Trip Organizer</span>
                  <span className="font-bold text-[#021024]">{group.organizerName}</span>
                </div>
                {isOrganizer && group.members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(true)}
                    className="ml-2 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Transfer Role
                  </button>
                )}
              </div>

              {currentMember && !isOrganizer && (
                <button
                  type="button"
                  onClick={handleLeaveGroup}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                >
                  <LogOut size={13} /> Leave Trip
                </button>
              )}
            </div>
          </div>

          {/* 6-Stage Progress Stepper Header */}
          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex min-w-[700px] items-center justify-between rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs backdrop-blur-xs">
              {[
                { id: "ROSTER", num: "01", title: "Travelers", desc: `${group.members.length} Added` },
                { id: "ORIGINS", num: "02", title: "Departure Cities", desc: `${readyOriginsCount}/${group.members.length} Ready` },
                { id: "OPTIMIZE", num: "03", title: "Meeting Hub", desc: group.destination ? group.destination.city : "Find Hub" },
                { id: "FLIGHTS", num: "04", title: "Flight Schedules", desc: group.status === "PLANNING" ? "Pending" : "Aligned" },
                { id: "PAYMENT", num: "05", title: "Payment Mode", desc: group.paymentMode || "Choose Mode" },
                { id: "TICKETS", num: "06", title: "Travel Documents", desc: `${paidMembersCount}/${group.members.length} Issued` },
              ].map((step, idx) => {
                const isCurrent =
                  (idx === 0 && group.members.length < 2) ||
                  (idx === 1 && readyOriginsCount < group.members.length) ||
                  (idx === 2 && !group.destination) ||
                  (idx === 3 && group.status === "OPTIMIZED") ||
                  (idx === 4 && (group.status === "ITINERARY_LOCKED" || group.status === "PAYMENT_IN_PROGRESS")) ||
                  (idx === 5 && group.status === "CONFIRMED");

                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition ${
                        group.status === "CONFIRMED" || (idx === 0 && group.members.length >= 2) || (idx === 1 && readyOriginsCount >= 2 && group.destination)
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-[#052659] text-white ring-2 ring-blue-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {group.status === "CONFIRMED" ? <Check size={14} /> : step.num}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#021024]">{step.title}</div>
                      <div className="text-[10px] text-slate-400">{step.desc}</div>
                    </div>
                    {idx < 5 && <ChevronRight size={14} className="text-slate-300 ml-2" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* MAIN GRID: Left Roster & Travel Details vs Right Actions & Recommendations */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* LEFT COLUMN: Travelers Roster & Flights */}
            <div className="space-y-6">
              {/* Group Roster Card */}
              <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-[#021024]">
                      Traveler Roster ({group.members.length} Travelers)
                    </h2>
                    <p className="text-xs text-slate-500">
                      View traveler status, departure cities, documents, and seats.
                    </p>
                  </div>

                  {isOrganizer && (
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#052659] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#021024] transition"
                    >
                      <UserPlus size={14} />
                      <span>Add Traveler</span>
                    </button>
                  )}
                </div>

                {/* Traveler Cards List */}
                <div className="mt-4 space-y-3">
                  {group.members.map((member, idx) => {
                    const isSelf =
                      viewer.currentUserId === member.userId ||
                      viewer.currentUserEmail?.toLowerCase() === member.email.toLowerCase();

                    return (
                      <div
                        key={member.email}
                        className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:bg-white hover:border-slate-300 hover:shadow-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {/* Left: Avatar & Info */}
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#052659] font-bold text-white text-xs shadow-2xs">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#021024]">{member.name}</span>
                                {member.role === "ORGANIZER" && (
                                  <span className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200">
                                    <Crown size={9} /> Organizer
                                  </span>
                                )}
                                {isSelf && (
                                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-[#052659] border border-blue-200">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">{member.email}</p>
                            </div>
                          </div>

                          {/* Right: Status Pills & Action */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Invitation status badge */}
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                member.invitationStatus === "ACCEPTED"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : member.invitationStatus === "DECLINED"
                                  ? "border-rose-200 bg-rose-50 text-rose-700"
                                  : "border-amber-200 bg-amber-50 text-amber-800"
                              }`}
                            >
                              {member.invitationStatus}
                            </span>

                            {/* Live Workflow Status Badge */}
                            {member.paymentStatus === "PAID" ? (
                              <div className="flex items-center gap-1.5">
                                <span className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shadow-2xs">
                                  <CheckCircle2 size={11} className="text-emerald-600" />
                                  <span>Confirmed — Ticket Ready</span>
                                </span>
                                {member.flight && (
                                  <button
                                    type="button"
                                    onClick={() => setViewingTicketMember(member)}
                                    className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
                                  >
                                    [View E-Ticket]
                                  </button>
                                )}
                              </div>
                            ) : !member.passengerDetailsComplete ? (
                              <span className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 shadow-2xs">
                                <AlertCircle size={11} className="text-amber-600" />
                                <span>Passenger Details Pending</span>
                              </span>
                            ) : !member.selectedSeat ? (
                              <span className="flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-[#052659] shadow-2xs">
                                <Armchair size={11} className="text-[#5483B3]" />
                                <span>Seat Selection Pending</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded-full border border-purple-300 bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 shadow-2xs">
                                <Clock size={11} className="text-purple-600" />
                                <span>Seat Selected • Payment Pending</span>
                              </span>
                            )}

                            {/* Organizer remove button */}
                            {isOrganizer && member.role !== "ORGANIZER" && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTraveler(member.email)}
                                title="Remove traveler"
                                className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Middle: Departure city, Seat & Documents status row */}
                        <div className="mt-3 grid gap-2 pt-3 border-t border-slate-200/60 sm:grid-cols-3 text-xs">
                          {/* Departure Origin */}
                          <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200/80">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Departure</span>
                              <span className="font-bold text-[#021024]">
                                {member.originAirport ? `${member.originAirport.city} (${member.originAirport.code})` : "Not Set"}
                              </span>
                            </div>
                            {(isOrganizer || isSelf) && (
                              <button
                                type="button"
                                onClick={() => setEditingOriginMember(member)}
                                className="text-[10px] font-bold text-[#052659] hover:underline"
                              >
                                {member.originAirport ? "Change" : "Set"}
                              </button>
                            )}
                          </div>

                          {/* Passenger Documents */}
                          <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200/80">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Passenger Details</span>
                              <span className={`font-bold ${member.passengerDetailsComplete ? "text-emerald-700" : "text-amber-700"}`}>
                                {member.passengerDetailsComplete ? "Verified" : "Pending"}
                              </span>
                            </div>
                            {(isOrganizer || isSelf) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPassengerMember(member);
                                  if (member.passengerDetails) {
                                    setPassengerForm({
                                      title: member.passengerDetails.title || "Mr",
                                      firstName: member.passengerDetails.firstName || "",
                                      lastName: member.passengerDetails.lastName || "",
                                      email: member.passengerDetails.email || member.email,
                                      phone: member.passengerDetails.phone || "+91 98401 23456",
                                      dateOfBirth: member.passengerDetails.dateOfBirth || "1995-06-15",
                                      gender: member.passengerDetails.gender || "male",
                                      passportNumber: member.passengerDetails.passportNumber || "",
                                      passportCountry: member.passengerDetails.passportCountry || "IND",
                                      passportExpiry: member.passengerDetails.passportExpiry || "2032-11-20",
                                    });
                                  }
                                }}
                                className="text-[10px] font-bold text-[#052659] hover:underline"
                              >
                                {member.passengerDetailsComplete ? "Edit" : "Complete"}
                              </button>
                            )}
                          </div>

                          {/* Seat Selection */}
                          <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200/80">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Seat</span>
                              <span className="font-mono font-bold text-[#021024]">
                                {member.selectedSeat || "Not Selected"}
                              </span>
                            </div>
                            {member.flight && (isOrganizer || isSelf) && member.paymentStatus !== "PAID" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSeatPickerMember(member);
                                  setSelectedSeatTemp(member.selectedSeat || "");
                                }}
                                className="text-[10px] font-bold text-[#052659] hover:underline"
                              >
                                {member.selectedSeat ? "Change" : "Select"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Assigned Flight Card snippet if flight is assigned */}
                        {member.flight && (
                          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 border border-slate-200/80 text-xs">
                            <div className="flex items-center gap-2">
                              <Plane size={14} className="text-[#5483B3]" />
                              <span className="font-bold text-[#021024]">
                                {member.flight.airline} ({member.flight.flightNumber})
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600">
                                {member.flight.departureLocal} → {member.flight.arrivalLocal}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-[#052659]">
                                ${member.flight.priceUsd}
                              </span>

                              {member.paymentStatus === "PAID" && (
                                <button
                                  type="button"
                                  onClick={() => setViewingTicketMember(member)}
                                  className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                >
                                  <Ticket size={12} />
                                  <span>View Boarding Pass</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Destination & Pareto Convergence Recommendation Panel */}
              {group.destination && (
                <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-[#052659]">
                      <Compass size={18} />
                      <h3 className="text-sm font-extrabold text-[#021024]">
                        Selected Meeting Destination: {group.destination.city}, {group.destination.country} ({group.destination.code})
                      </h3>
                    </div>

                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Fairness Score: {group.optimizationMetrics?.compositeFairnessScore || 94}/100
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Arrival Window</span>
                      <span className="text-sm font-bold text-[#021024]">
                        {group.optimizationMetrics?.arrivalWindowMinutes || 45} mins gap
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">All flights arrive within a close window.</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Fare</span>
                      <span className="text-sm font-bold text-[#052659]">
                        ${group.optimizationMetrics?.averagePriceUsd || 380} / person
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">Equitable ticket pricing across origins.</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Group Fare</span>
                      <span className="text-sm font-bold text-[#021024] font-mono">
                        ${totalGroupFare}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">Guaranteed price lock during checkout.</p>
                    </div>
                  </div>

                  {/* Alternative Destinations list if available */}
                  {isOrganizer && group.optimizationMetrics?.alternativeDestinations?.length > 0 && group.status !== "CONFIRMED" && (
                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Alternative Meeting Hubs Considered
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {group.optimizationMetrics.alternativeDestinations.map((alt: any) => (
                          <button
                            key={alt.destination.code}
                            type="button"
                            onClick={() =>
                              executeGroupAction({
                                action: "SET_DESTINATION",
                                destinationCode: alt.destination.code,
                                memberFlights: alt.memberFlights,
                              })
                            }
                            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-700 hover:bg-white hover:border-[#5483B3] transition"
                          >
                            <span className="font-bold">{alt.destination.city} ({alt.destination.code})</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-mono text-[#052659]">${alt.averagePriceUsd} avg</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Optimization, Actions & Payment Flow */}
            <div className="space-y-6">
              {/* Trip Progression Action Card */}
              <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#5483B3]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#021024]">Trip Status</h3>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#052659] border border-blue-200">
                    {group.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Status Guidance */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {group.status === "PLANNING" && (
                    <>
                      Step 1: Make sure all travelers have confirmed their departure cities. Once ready, run trip optimization to find the best meeting destination.
                    </>
                  )}
                  {group.status === "OPTIMIZED" && (
                    <>
                      Step 2: Review the recommended meeting destination and flight arrangements. When satisfied, lock the itinerary so travelers can choose seats and payment.
                    </>
                  )}
                  {group.status === "ITINERARY_LOCKED" && (
                    <>
                      Step 3: Select whether travelers will pay individually for their own ticket (Option 1) or the organizer will pay for the entire group (Option 2).
                    </>
                  )}
                  {group.status === "PAYMENT_IN_PROGRESS" && (
                    <>
                      {group.paymentMode === "INDIVIDUAL"
                        ? "Each traveler can complete their passenger details, select their seat, and pay independently. Official e-tickets are issued immediately upon each member's payment."
                        : "Organizer Pay selected. Review the total group fare, select seats for everyone, and complete the combined payment."}
                    </>
                  )}
                  {group.status === "CONFIRMED" && (
                    <>
                      All tickets have been officially confirmed and synchronized! E-tickets and digital boarding passes are accessible in each traveler's account.
                    </>
                  )}
                </p>

                {/* Primary Organizer Action Buttons */}
                {isOrganizer && (
                  <div className="space-y-2 pt-2">
                    {group.status === "PLANNING" && (
                      <button
                        type="button"
                        onClick={handleRunOptimization}
                        disabled={actionLoading || readyOriginsCount < 2}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#052659] py-3.5 text-xs font-bold text-white shadow-sm hover:bg-[#021024] disabled:opacity-50 transition"
                      >
                        <Compass size={14} />
                        <span>Find Optimal Meeting Destination</span>
                      </button>
                    )}

                    {group.status === "OPTIMIZED" && (
                      <button
                        type="button"
                        onClick={handleLockItinerary}
                        disabled={actionLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#052659] py-3.5 text-xs font-bold text-white shadow-sm hover:bg-[#021024] transition"
                      >
                        <Lock size={14} />
                        <span>Confirm & Lock Group Itinerary</span>
                      </button>
                    )}

                    {group.status === "ITINERARY_LOCKED" && (
                      <div className="space-y-2.5">
                        <button
                          type="button"
                          onClick={() => handleSelectPaymentMode("INDIVIDUAL")}
                          disabled={actionLoading}
                          className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-left hover:border-[#5483B3] hover:bg-white transition"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#052659] shrink-0 mt-0.5">
                            <Users size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#021024] block">Option 1: Everyone Pays Separately</span>
                            <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                              Each traveler enters their own documents, picks their seat, and pays independently.
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectPaymentMode("ORGANIZER")}
                          disabled={actionLoading}
                          className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-left hover:border-[#5483B3] hover:bg-white transition"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                            <CreditCard size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#021024] block">Option 2: Organizer Pays for Everyone</span>
                            <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                              Organizer completes checkout for the entire group with one payment.
                            </span>
                          </div>
                        </button>
                      </div>
                    )}

                    {group.status === "PAYMENT_IN_PROGRESS" && group.paymentMode === "ORGANIZER" && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentTargetMember(null); // Group pay
                          setShowPaymentModal(true);
                        }}
                        disabled={actionLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        <CreditCard size={15} />
                        <span>Pay for Entire Group (${totalGroupFare})</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Member Individual Pay Button (Option 1) */}
                {group.paymentMode === "INDIVIDUAL" && currentMember && currentMember.paymentStatus !== "PAID" && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#052659]">
                      <span>Your Flight Share:</span>
                      <span className="font-mono text-sm">${currentMember.flight?.priceUsd || 380}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentTargetMember(currentMember);
                        setShowPaymentModal(true);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#052659] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#021024]"
                    >
                      <CreditCard size={14} />
                      <span>Review Details & Pay My Share</span>
                    </button>
                  </div>
                )}

                {/* Option 1 Live Traveler Payment & Ticket Tracker */}
                {group.paymentMode === "INDIVIDUAL" && (
                  <div className="mt-3 rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users size={15} className="text-[#052659]" />
                        <h4 className="text-xs font-bold text-[#021024]">
                          Option 1: Live Traveler Tracker
                        </h4>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                        {paidMembersCount}/{group.members.length} Paid
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Live status per traveler. Each member manages their documents and payment independently.
                    </p>

                    <div className="space-y-2 pt-1">
                      {group.members.map((m) => (
                        <div
                          key={`tracker-${m.email}`}
                          className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 text-xs shadow-2xs"
                        >
                          <div>
                            <span className="font-bold text-[#021024] block">{m.name}</span>
                            <span className="text-[10px] text-slate-500">
                              {m.originAirport?.code ? `${m.originAirport.code} → ${group.destination?.code || "TBD"}` : "No origin set"}
                            </span>
                          </div>

                          <div className="text-right">
                            {m.paymentStatus === "PAID" ? (
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                                  Confirmed — Ticket Ready
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setViewingTicketMember(m)}
                                  className="text-[10px] font-black text-emerald-700 underline hover:text-emerald-900"
                                >
                                  [View E-Ticket]
                                </button>
                              </div>
                            ) : !m.passengerDetailsComplete ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                                Passenger Details Pending
                              </span>
                            ) : !m.selectedSeat ? (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800">
                                Seat Selection Pending
                              </span>
                            ) : (
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold text-purple-800">
                                Seat Selected • Payment Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Group Policy & Assurance Card */}
              <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xs space-y-3 text-xs">
                <div className="flex items-center gap-2 text-[#052659]">
                  <ShieldCheck size={18} />
                  <h4 className="font-extrabold text-[#021024] uppercase tracking-wider">
                    SkySync Group Guarantee
                  </h4>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  SkySync synchronizes reservations across airline networks. In individual payment mode, each traveler owns their private travel documents and receipt. In group payment mode, all travelers are ticketed together with 100% price lock.
                </p>
                <div className="border-t border-slate-100 pt-2 space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Check size={13} className="text-emerald-600" />
                    <span>Independent PNRs & ICAO E-Tickets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={13} className="text-emerald-600" />
                    <span>256-bit Encrypted Checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={13} className="text-emerald-600" />
                    <span>Zero Liability Seat Holds</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* INVITE TRAVELER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-[#052659]" />
                <h3 className="text-sm font-bold text-[#021024]">Invite Traveler to Group</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowInviteModal(false); setInviteError(null); setInviteEmail(""); setInviteName(""); }}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Inline error banner */}
            {inviteError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{inviteError}</span>
              </div>
            )}

            <div className="mt-4 space-y-4">
              {/* Quick Invite from Registered Users */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Registered SkySync Travelers
                </label>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search registered travelers..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-[#021024] focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-slate-100 bg-slate-50/60 p-1.5">
                  {availableUsers
                    .filter(
                      (u) =>
                        !group.members.some((m) => m.email.toLowerCase() === u.email.toLowerCase()) &&
                        (!userQuery || u.name.toLowerCase().includes(userQuery.toLowerCase()) || u.email.toLowerCase().includes(userQuery.toLowerCase()))
                    )
                    .map((u) => (
                      <div
                        key={u.email}
                        onClick={() => handleInviteTraveler(u)}
                        className="flex cursor-pointer items-center justify-between rounded-lg p-2 text-xs transition hover:bg-white"
                      >
                        <div>
                          <div className="font-bold text-[#021024]">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.email} • {u.homeCity}</div>
                        </div>
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#052659]">
                          Add
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Or Invite by Email */}
              <div className="border-t border-slate-100 pt-3">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Or Invite by Email
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Traveler Name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#021024] focus:outline-none focus:bg-white"
                  />
                  <input
                    type="email"
                    placeholder="traveler@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#021024] focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); setInviteError(null); setInviteEmail(""); setInviteName(""); }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleInviteTraveler()}
                  disabled={!inviteEmail || actionLoading}
                  className="rounded-xl bg-[#052659] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#021024] disabled:opacity-50"
                >
                  {actionLoading ? "Adding…" : "Send Invite"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER ORGANIZER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-[#021024]">Transfer Organizer Role</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Select any member from your group to make them the organizer. They will have full permission to manage the itinerary and booking.
            </p>

            <div className="mt-4 space-y-2">
              {group.members
                .filter((m) => m.email.toLowerCase() !== group.organizerEmail.toLowerCase())
                .map((m) => (
                  <div
                    key={m.email}
                    onClick={() => handleTransferOrganizer(m.email)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-blue-50/50 hover:border-blue-300 transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#021024]">{m.name}</div>
                      <div className="text-[10px] text-slate-400">{m.email}</div>
                    </div>
                    <span className="rounded-lg bg-[#052659] px-2.5 py-1 text-[10px] font-bold text-white">
                      Make Organizer
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ORIGIN AIRPORT PICKER MODAL */}
      {editingOriginMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#052659]" />
                <h3 className="text-sm font-bold text-[#021024]">
                  Set Departure City for {editingOriginMember.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingOriginMember(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {/* 1-Click GPS Button */}
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 py-2.5 text-xs font-bold text-[#052659] hover:bg-blue-100 transition"
              >
                {detectingGps ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#052659] border-t-transparent" />
                    <span>Detecting Location...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={14} />
                    <span>Detect Nearest Airport via GPS</span>
                  </>
                )}
              </button>

              {/* Quick Airport Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search airport by city or code (e.g. DEL, LHR, JFK)..."
                  value={originSearchQuery}
                  onChange={(e) => setOriginSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-[#021024] focus:outline-none focus:bg-white"
                />
              </div>

              {/* Airport list */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                {AIRPORTS.filter((a) => {
                  const q = originSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    a.code.toLowerCase().includes(q) ||
                    a.city.toLowerCase().includes(q) ||
                    a.country.toLowerCase().includes(q)
                  );
                })
                  .slice(0, 10)
                  .map((a) => (
                    <div
                      key={a.code}
                      onClick={() => handleSelectOrigin(a.code)}
                      className="flex cursor-pointer items-center justify-between rounded-lg p-2 text-xs transition hover:bg-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 font-mono text-[10px] font-bold text-[#C1E8FF]">
                          {a.code}
                        </div>
                        <div>
                          <div className="font-bold text-[#021024]">{a.city}, {a.country}</div>
                          <div className="text-[10px] text-slate-400">{a.name}</div>
                        </div>
                      </div>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        Select
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASSENGER & PASSPORT DETAILS MODAL */}
      {editingPassengerMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#052659]" />
                <h3 className="text-sm font-bold text-[#021024]">
                  Passenger & Passport Verification: {editingPassengerMember.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPassengerMember(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePassengerDetails} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Title</label>
                  <select
                    value={passengerForm.title}
                    onChange={(e) => setPassengerForm({ ...passengerForm, title: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#021024]"
                  >
                    <option value="Mr">Mr</option>
                    <option value="Ms">Ms</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">First Name *</label>
                  <input
                    type="text"
                    required
                    value={passengerForm.firstName}
                    onChange={(e) => setPassengerForm({ ...passengerForm, firstName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#021024]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={passengerForm.lastName}
                    onChange={(e) => setPassengerForm({ ...passengerForm, lastName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#021024]"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Date of Birth</label>
                  <input
                    type="date"
                    value={passengerForm.dateOfBirth}
                    onChange={(e) => setPassengerForm({ ...passengerForm, dateOfBirth: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#021024]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Phone</label>
                  <input
                    type="tel"
                    value={passengerForm.phone}
                    onChange={(e) => setPassengerForm({ ...passengerForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#021024]"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Passport & Travel Document (Advance Passenger Information)
                </span>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Passport Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Z8492019"
                      value={passengerForm.passportNumber}
                      onChange={(e) => setPassengerForm({ ...passengerForm, passportNumber: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-[#021024]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Issuing Country</label>
                    <select
                      value={passengerForm.passportCountry}
                      onChange={(e) => setPassengerForm({ ...passengerForm, passportCountry: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#021024]"
                    >
                      <option value="IND">India (IND)</option>
                      <option value="USA">United States (USA)</option>
                      <option value="GBR">United Kingdom (GBR)</option>
                      <option value="SGP">Singapore (SGP)</option>
                      <option value="JPN">Japan (JPN)</option>
                      <option value="DEU">Germany (DEU)</option>
                      <option value="FRA">France (FRA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Passport Expiry *</label>
                    <input
                      type="date"
                      required
                      value={passengerForm.passportExpiry}
                      onChange={(e) => setPassengerForm({ ...passengerForm, passportExpiry: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#021024]"
                    />
                  </div>
                </div>
              </div>

              {/* Visa Advisory snippet */}
              {visaAdvisory && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#021024]">{visaAdvisory.headline}</span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {visaAdvisory.badgeText}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{visaAdvisory.summary}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPassengerMember(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#052659] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#021024]"
                >
                  Save Passenger Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEAT PICKER MODAL */}
      {seatPickerMember && seatLayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Armchair size={18} className="text-[#052659]" />
                <h3 className="text-sm font-bold text-[#021024]">
                  Select Seat for {seatPickerMember.name} • {seatPickerMember.flight?.flightNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSeatPickerMember(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span>Selected: <strong className="font-mono text-[#052659]">{selectedSeatTemp || "None"}</strong></span>
                <span className="text-slate-400">{seatLayout.cabinType}</span>
              </div>

              {/* Aircraft Cabin Fuselage */}
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mx-auto max-w-xs space-y-2">
                  {/* Cockpit Indicator */}
                  <div className="rounded-t-2xl border-b-2 border-slate-300 bg-slate-200 py-1.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Cockpit • Front of Aircraft
                  </div>

                  {/* Seat Rows Grid */}
                  <div className="space-y-1.5 pt-2">
                    {Array.from({ length: 8 }, (_, rIdx) => {
                      const rowNum = rIdx + 11;
                      return (
                        <div key={rowNum} className="flex items-center justify-between gap-1 text-xs">
                          <span className="w-5 text-right font-mono text-[10px] text-slate-400">{rowNum}</span>
                          <div className="flex gap-1">
                            {["A", "B", "C"].map((col) => {
                              const seatId = `${rowNum}${col}`;
                              const isPicked = selectedSeatTemp === seatId;
                              const isTaken = group.members.some(
                                (m) =>
                                  m.email !== seatPickerMember.email &&
                                  m.selectedSeat === seatId &&
                                  m.flight?.flightNumber === seatPickerMember.flight?.flightNumber
                              );

                              return (
                                <button
                                  key={seatId}
                                  type="button"
                                  disabled={isTaken}
                                  onClick={() => setSelectedSeatTemp(seatId)}
                                  className={`h-7 w-7 rounded-md font-mono text-[10px] font-bold transition ${
                                    isPicked
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : isTaken
                                      ? "bg-slate-300 text-slate-400 cursor-not-allowed"
                                      : "bg-white border border-slate-200 text-slate-700 hover:border-[#052659]"
                                  }`}
                                >
                                  {col}
                                </button>
                              );
                            })}
                          </div>

                          {/* Aisle */}
                          <div className="w-4 text-center text-[9px] text-slate-300">|</div>

                          <div className="flex gap-1">
                            {["D", "E", "F"].map((col) => {
                              const seatId = `${rowNum}${col}`;
                              const isPicked = selectedSeatTemp === seatId;
                              const isTaken = group.members.some(
                                (m) =>
                                  m.email !== seatPickerMember.email &&
                                  m.selectedSeat === seatId &&
                                  m.flight?.flightNumber === seatPickerMember.flight?.flightNumber
                              );

                              return (
                                <button
                                  key={seatId}
                                  type="button"
                                  disabled={isTaken}
                                  onClick={() => setSelectedSeatTemp(seatId)}
                                  className={`h-7 w-7 rounded-md font-mono text-[10px] font-bold transition ${
                                    isPicked
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : isTaken
                                      ? "bg-slate-300 text-slate-400 cursor-not-allowed"
                                      : "bg-white border border-slate-200 text-slate-700 hover:border-[#052659]"
                                  }`}
                                >
                                  {col}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSeatPickerMember(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSeat}
                  disabled={!selectedSeatTemp}
                  className="rounded-xl bg-[#052659] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#021024] disabled:opacity-50"
                >
                  Confirm Seat ({selectedSeatTemp})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL (Option 1 or Option 2) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#052659]" />
                <h3 className="text-sm font-bold text-[#021024]">
                  {paymentTargetMember
                    ? `Payment for ${paymentTargetMember.name}`
                    : `Group Checkout (${group.members.length} Travelers)`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="mt-4 space-y-4">
              {/* Fare Summary Box */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-bold text-[#021024]">
                    {group.destination?.city}, {group.destination?.country}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">
                    {paymentTargetMember ? "Individual Fare" : "Group Total Fare"}:
                  </span>
                  <span className="font-mono text-base font-extrabold text-[#052659]">
                    ${paymentTargetMember ? paymentTargetMember.flight?.priceUsd || 380 : totalGroupFare}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: "CARD", label: "Credit Card" },
                    { id: "UPI", label: "Instant UPI" },
                    { id: "NETBANKING", label: "Net Banking" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`rounded-xl border p-2.5 text-center font-bold transition ${
                        paymentMethod === m.id
                          ? "border-[#052659] bg-[#052659] text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Inputs */}
              {paymentMethod === "CARD" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Card Number</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-[#021024]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-[#021024]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">CVV</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-[#021024]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "UPI" && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">UPI Virtual ID</label>
                  <input
                    type="text"
                    required
                    placeholder="username@bank"
                    defaultValue="traveler@oksbi"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-[#021024]"
                  />
                </div>
              )}

              {paymentMethod === "NETBANKING" && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Select Bank</label>
                  <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#021024]">
                    <option>HDFC Bank Commercial</option>
                    <option>State Bank of India</option>
                    <option>ICICI Bank Global</option>
                    <option>Axis Reserve Bank</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60"
                >
                  {processingPayment ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Authorizing Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={13} />
                      <span>Authorize Payment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOARDING PASS MODAL */}
      {viewingTicketMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-[#052659]" />
                <h3 className="text-sm font-bold text-[#021024]">
                  Official Boarding Pass • {viewingTicketMember.bookingReference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingTicketMember(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Boarding Pass Ticket Container */}
            <div className="mt-4 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-md">
              <div className="flex items-center justify-between bg-slate-900 px-5 py-3 text-white">
                <span className="font-extrabold text-sm">{viewingTicketMember.flight?.airline || "SkySync Partner Airline"}</span>
                <span className="font-mono text-xs font-bold text-[#C1E8FF]">
                  {viewingTicketMember.flight?.flightNumber || "SS-101"}
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 items-center text-center">
                  <div className="text-left">
                    <div className="font-mono text-3xl font-extrabold">
                      {viewingTicketMember.originAirport?.code || "DEP"}
                    </div>
                    <div className="text-xs text-slate-500 font-bold">
                      {viewingTicketMember.originAirport?.city || "Origin City"}
                    </div>
                    <div className="font-mono text-xs text-[#052659] font-bold">
                      {viewingTicketMember.flight?.departureLocal || "08:15"}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="font-mono text-[9px] text-emerald-700 font-bold">CONFIRMED</span>
                    <div className="relative my-1 w-20 border-t border-slate-300">
                      <Plane size={10} className="absolute left-1/2 -top-1.5 -translate-x-1/2 text-[#5483B3]" />
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{group.targetDate}</span>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-3xl font-extrabold">
                      {group.destination?.code || "ARR"}
                    </div>
                    <div className="text-xs text-slate-500 font-bold">
                      {group.destination?.city || "Destination City"}
                    </div>
                    <div className="font-mono text-xs text-[#052659] font-bold">
                      {viewingTicketMember.flight?.arrivalLocal || "10:30"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 font-mono text-xs border border-slate-100">
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">Passenger</span>
                    <span className="font-bold text-slate-900 truncate block">{viewingTicketMember.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">Seat</span>
                    <span className="font-bold text-emerald-700">{viewingTicketMember.selectedSeat || "14A"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">Terminal / Gate</span>
                    <span className="font-bold text-[#052659]">T3 • Gate 14</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">E-Ticket</span>
                    <span className="text-slate-700">{viewingTicketMember.eTicketNumber}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <QrCode size={32} className="text-slate-900" />
                    <span className="font-mono text-[9px] text-slate-400">ICAO e-Ticket Barcode</span>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-[#052659]">
                    Group: {group.groupName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
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
                onClick={() => setViewingTicketMember(null)}
                className="rounded-xl bg-[#052659] px-5 py-2 text-xs font-bold text-white hover:bg-[#021024]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
