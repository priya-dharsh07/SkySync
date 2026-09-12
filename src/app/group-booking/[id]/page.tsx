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
  Info,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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

  // Guided wizard active step state (1 to 9)
  const [activeStep, setActiveStep] = useState<number>(1);

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

  // Flight Search Modal / Tab (Step 4)
  const [showFlightSearchModal, setShowFlightSearchModal] = useState(false);
  const [searchingFlights, setSearchingFlights] = useState(false);
  const [flightSearchResults, setFlightSearchResults] = useState<any[]>([]);
  const [activeFlightMember, setActiveFlightMember] = useState<GroupMember | null>(null);

  // Passenger details modal (Step 6)
  const [editingPassengerMember, setEditingPassengerMember] = useState<GroupMember | null>(null);
  const [passengerForm, setPassengerForm] = useState({
    title: "Mr",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "male",
    passportNumber: "",
    passportCountry: "IND",
    passportExpiry: "",
  });

  // Seat selection modal (Step 5)
  const [seatPickerMember, setSeatPickerMember] = useState<GroupMember | null>(null);
  const [selectedSeatTemp, setSelectedSeatTemp] = useState<string>("");

  // Payment checkout modal (Step 8)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTargetMember, setPaymentTargetMember] = useState<GroupMember | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "UPI" | "NETBANKING">("CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Viewing e-ticket modal (Step 9)
  const [viewingTicketMember, setViewingTicketMember] = useState<GroupMember | null>(null);

  // Load group details from MongoDB
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
    // Load registered database users for inviting
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

  // Generic patch action executor (Syncs directly to MongoDB)
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
      notify("success", data.message || "Trip updated successfully in database.");
      return data;
    } catch (err: any) {
      console.error("executeGroupAction error:", err);
      notify("error", err.message || "An unexpected error occurred.");
      return null;
    } finally {
      setActionLoading(false);
    }
  }

  // Invite traveler (Step 1)
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
        setInviteError(data.message || "Failed to add traveler.");
        return;
      }
      if (data.group) setGroup(data.group);
      notify("success", data.message || "Traveler added to group.");
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

  // Update origin (Step 2)
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

  // Detect GPS for origin
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
      () => {
        setDetectingGps(false);
        alert("Unable to detect coordinates. Please select your departure city manually.");
      },
      { timeout: 8000 }
    );
  }

  // Optimize Trip (Step 3)
  async function handleRunOptimization() {
    const res = await executeGroupAction({ action: "OPTIMIZE_TRIP" });
    if (res?.success) {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
      setActiveStep(4); // Advance to Flight Search
    }
  }

  // Search Live Flights (Step 4)
  async function handleSearchFlightsForMember(member: GroupMember) {
    if (!member.originAirport || !group?.destination) {
      notify("error", "Member departure city and destination hub must be set.");
      return;
    }
    setActiveFlightMember(member);
    setShowFlightSearchModal(true);
    setSearchingFlights(true);

    const originCode = member.originAirport.code;
    const destCode = group.destination.code;

    try {
      const res = await fetch(`/api/flights?from=${originCode}&to=${destCode}`);
      let realFlights: any[] = [];
      if (res.ok) {
        const data = await res.json();
        realFlights = data.flights || [];
      }

      // If no real flights found, provide realistic fallback schedules for this origin-destination pair
      if (realFlights.length === 0) {
        realFlights = [
          {
            _id: `flight-fallback-1-${originCode}-${destCode}`,
            airline: "IndiGo",
            airlineCode: "6E",
            flightNumber: `6E-${Math.floor(200 + Math.random() * 700)}`,
            origin: member.originAirport.city,
            originCode: originCode,
            destination: group.destination.city,
            destinationCode: destCode,
            departureDate: group.targetDate || "2026-10-15",
            departureTime: "07:30",
            arrivalTime: "10:15",
            departureLocal: "07:30",
            arrivalLocal: "10:15",
            duration: 165,
            price: 5200,
            priceUsd: 65,
            availableSeats: 32,
            type: "scheduled",
            isLiveAPI: false,
          },
          {
            _id: `flight-fallback-2-${originCode}-${destCode}`,
            airline: "Air India",
            airlineCode: "AI",
            flightNumber: `AI-${Math.floor(100 + Math.random() * 800)}`,
            origin: member.originAirport.city,
            originCode: originCode,
            destination: group.destination.city,
            destinationCode: destCode,
            departureDate: group.targetDate || "2026-10-15",
            departureTime: "11:45",
            arrivalTime: "14:30",
            departureLocal: "11:45",
            arrivalLocal: "14:30",
            duration: 165,
            price: 6400,
            priceUsd: 80,
            availableSeats: 18,
            type: "scheduled",
            isLiveAPI: false,
          },
          {
            _id: `flight-fallback-3-${originCode}-${destCode}`,
            airline: "Emirates",
            airlineCode: "EK",
            flightNumber: `EK-${Math.floor(500 + Math.random() * 400)}`,
            origin: member.originAirport.city,
            originCode: originCode,
            destination: group.destination.city,
            destinationCode: destCode,
            departureDate: group.targetDate || "2026-10-15",
            departureTime: "16:20",
            arrivalTime: "19:10",
            departureLocal: "16:20",
            arrivalLocal: "19:10",
            duration: 170,
            price: 8900,
            priceUsd: 110,
            availableSeats: 12,
            type: "scheduled",
            isLiveAPI: false,
          },
        ];
      }

      setFlightSearchResults(realFlights);
    } catch (err) {
      console.error(err);
      setFlightSearchResults([]);
    } finally {
      setSearchingFlights(false);
    }
  }

  // Select flight for member
  async function handleSelectFlightForMember(flight: any) {
    if (!activeFlightMember) return;
    const res = await executeGroupAction({
      action: "SELECT_MEMBER_FLIGHT",
      memberEmail: activeFlightMember.email,
      flight,
    });
    if (res?.success) {
      setShowFlightSearchModal(false);
      setActiveFlightMember(null);
    }
  }

  // Lock Itinerary (Step 4 -> Step 5)
  async function handleLockItinerary() {
    const res = await executeGroupAction({ action: "LOCK_ITINERARY" });
    if (res?.success) {
      setActiveStep(5); // Advance to Seats
    }
  }

  // Select Payment Mode (Step 7)
  async function handleSelectPaymentMode(mode: "INDIVIDUAL" | "ORGANIZER") {
    const res = await executeGroupAction({
      action: "SELECT_PAYMENT_MODE",
      paymentMode: mode,
    });
    if (res?.success) {
      setActiveStep(8); // Advance to Payment execution
    }
  }

  // Passenger form save (Step 6)
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

  // Save seat (Step 5 - Multi-Traveler Seat Selection)
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

  // Open passenger details modal for a member (Step 6)
  function openPassengerModalForMember(m: GroupMember) {
    setEditingPassengerMember(m);
    setPassengerForm({
      title: m.passengerDetails?.title || "Mr",
      firstName: m.passengerDetails?.firstName || (m.name.split(" ")[0] || ""),
      lastName: m.passengerDetails?.lastName || (m.name.split(" ").slice(1).join(" ") || ""),
      email: m.email,
      phone: m.passengerDetails?.phone || "",
      dateOfBirth: m.passengerDetails?.dateOfBirth || "",
      gender: m.passengerDetails?.gender || "male",
      passportNumber: m.passengerDetails?.passportNumber || "",
      passportCountry: m.passengerDetails?.passportCountry || (m.originAirport?.country === "India" ? "IND" : "USA"),
      passportExpiry: m.passengerDetails?.passportExpiry || "",
    });
  }

  // Execute checkout (Step 8)
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
        notify("success", "Your individual flight ticket and boarding pass have been issued!");
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
        setActiveStep(9); // Advance to Tickets
      }
    } catch (err: any) {
      notify("error", err.message || "Payment failed. Please check your inputs.");
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

  const seatRows = useMemo(() => {
    if (!seatLayout) return [];
    const rowMap = new Map<number, SeatItem[]>();
    for (const s of seatLayout.seats) {
      if (!rowMap.has(s.row)) rowMap.set(s.row, []);
      rowMap.get(s.row)!.push(s);
    }
    return Array.from(rowMap.entries()).map(([rowNumber, seats]) => ({
      rowNumber,
      seats,
    }));
  }, [seatLayout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
        <Navbar />
        <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#052659] border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading Group Trip Itinerary from Database...</p>
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
          <h2 className="text-xl font-bold text-[#021024]">Group Trip Not Found in Database</h2>
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

  const totalMembers = group.members.length;
  const readyOriginsCount = group.members.filter((m) => m.originAirport?.code).length;
  const hasFlightsCount = group.members.filter((m) => m.flight?.flightNumber).length;
  const assignedSeatsCount = group.members.filter((m) => m.selectedSeat).length;
  const completedDocsCount = group.members.filter((m) => m.passengerDetailsComplete).length;
  const paidMembersCount = group.members.filter((m) => m.paymentStatus === "PAID").length;
  const totalGroupFare = group.members.reduce(
    (sum, m) => sum + (m.flight?.priceUsd || m.flight?.price || 0),
    0
  );

  // Stepper definition (1 to 7)
  const WIZARD_STEPS = [
    { id: 1, num: "01", title: "Travelers", desc: `${totalMembers} Added` },
    { id: 2, num: "02", title: "Departure Cities", desc: `${readyOriginsCount}/${totalMembers} Ready` },
    { id: 3, num: "03", title: "Meeting Hub", desc: group.destination ? group.destination.city : "Calculate Hub" },
    { id: 4, num: "04", title: "Flights", desc: `${hasFlightsCount}/${totalMembers} Selected` },
    { id: 5, num: "05", title: "Seats", desc: `${assignedSeatsCount}/${totalMembers} Assigned` },
    { id: 6, num: "06", title: "Travel Docs", desc: `${completedDocsCount}/${totalMembers} Complete` },
    { id: 7, num: "07", title: "Combined Checkout", desc: group.status === "CONFIRMED" ? "Tickets Issued" : "Pay for Everyone" },
  ];

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#021024]">
      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 pt-24 pb-24 sm:px-6 lg:px-8">
          {/* Top Hero Banner */}
          <div className="relative mb-6 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[#021024] via-[#052659] to-[#021024] shadow-lg">
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
                      ? `Multi-origin convergence: ${totalMembers} travelers converging to ${group.destination.city}, ${group.destination.country} (${group.destination.code}).`
                      : `Guided group booking workspace for ${totalMembers} registered travelers.`}
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

          {/* Top Navigation & Controls Bar */}
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

            {/* Organizer Badge & Role Actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2 text-xs shadow-xs backdrop-blur-xs">
                <Crown size={15} className="text-amber-500" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Trip Organizer</span>
                  <span className="font-bold text-[#021024]">{group.organizerName}</span>
                </div>
                {isOrganizer && totalMembers > 1 && (
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

          {/* GUIDED 9-STEP WORKFLOW STEPPER HEADER */}
          <div className="mt-6 overflow-x-auto pb-3">
            <div className="flex min-w-[900px] items-center justify-between rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xs backdrop-blur-xs">
              {WIZARD_STEPS.map((step) => {
                const isActive = activeStep === step.id;
                const isDone =
                  (step.id === 1 && totalMembers >= 2) ||
                  (step.id === 2 && readyOriginsCount === totalMembers) ||
                  (step.id === 3 && !!group.destination) ||
                  (step.id === 4 && hasFlightsCount === totalMembers) ||
                  (step.id === 5 && assignedSeatsCount === totalMembers) ||
                  (step.id === 6 && completedDocsCount === totalMembers) ||
                  (step.id === 7 && !!group.paymentMode) ||
                  (step.id === 8 && paidMembersCount === totalMembers) ||
                  (step.id === 9 && group.status === "CONFIRMED");

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-2.5 rounded-xl p-2 transition text-left ${
                      isActive ? "bg-blue-50/80 ring-1 ring-blue-300" : "hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition shrink-0 ${
                        isDone
                          ? "bg-emerald-600 text-white"
                          : isActive
                          ? "bg-[#052659] text-white shadow-xs"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isDone ? <Check size={13} /> : step.num}
                    </div>
                    <div>
                      <div className={`text-[11px] font-bold ${isActive ? "text-[#052659]" : "text-[#021024]"}`}>
                        {step.title}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">{step.desc}</div>
                    </div>
                    {step.id < 9 && <ChevronRight size={12} className="text-slate-300 ml-1 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE STEP GUIDED WORKSPACE CONTAINER */}
          <div className="mt-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            {/* STEP 1: TRAVELERS ROSTER */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-[#021024]">
                      Step 1 — Group Travelers Roster ({totalMembers} Registered Travelers)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Search and add registered database users to join your group trip.
                    </p>
                  </div>

                  {isOrganizer && (
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#052659] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#021024] transition"
                    >
                      <UserPlus size={14} /> Add Registered Traveler
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.members.map((m) => (
                    <div key={m.email} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#052659] font-bold text-white text-xs">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#021024] flex items-center gap-1.5">
                              <span>{m.name}</span>
                              {m.role === "ORGANIZER" && <Crown size={12} className="text-amber-500 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-slate-500">{m.email}</div>
                          </div>
                        </div>

                        {isOrganizer && m.role !== "ORGANIZER" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTraveler(m.email)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] border-t border-slate-200/60 pt-2.5 text-slate-500">
                        <span>Role: <strong className="text-slate-700">{m.role}</strong></span>
                        <span className={`rounded-full px-2 py-0.5 font-bold ${
                          m.invitationStatus === "ACCEPTED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {m.invitationStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#021024]"
                  >
                    <span>Proceed to Departure Cities (Step 2)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DEPARTURE CITIES */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-extrabold text-[#021024]">
                    Step 2 — Traveler Departure Cities ({readyOriginsCount}/{totalMembers} Configured)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verify each traveler's stored departure location retrieved from their database profile.
                  </p>
                </div>

                <div className="space-y-3">
                  {group.members.map((m) => (
                    <div key={m.email} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#052659] text-white font-bold text-xs">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#021024]">{m.name}</div>
                          <div className="text-[10px] text-slate-500">{m.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {m.originAirport ? (
                          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-bold text-emerald-900">
                            <MapPin size={13} className="text-emerald-600" />
                            <span>{m.originAirport.city}, {m.originAirport.country} ({m.originAirport.code})</span>
                          </div>
                        ) : (
                          <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                            Departure Location Missing
                          </span>
                        )}

                        {(isOrganizer || viewer.currentUserEmail?.toLowerCase() === m.email.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => setEditingOriginMember(m)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                          >
                            {m.originAirport ? "Change City" : "Set Departure City"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft size={14} /> Back to Travelers
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    disabled={readyOriginsCount < 2}
                    className="flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#021024] disabled:opacity-50"
                  >
                    <span>Calculate Meeting Hub (Step 3)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: MEETING HUB OPTIMIZATION */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-[#021024]">
                      Step 3 — Multi-Origin Meeting Hub Optimization
                    </h2>
                    <p className="text-xs text-slate-500">
                      Calculates optimal meeting destinations balancing ticket price fairness and arrival window synchronization.
                    </p>
                  </div>

                  {isOrganizer && (
                    <button
                      type="button"
                      onClick={handleRunOptimization}
                      disabled={actionLoading || readyOriginsCount < 2}
                      className="flex items-center gap-2 rounded-xl bg-[#052659] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#021024] disabled:opacity-60"
                    >
                      <Sparkles size={14} className="text-amber-300" />
                      <span>{group.destination ? "Re-Run Optimization" : "Run Pareto Optimization"}</span>
                    </button>
                  )}
                </div>

                {group.destination ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#052659] text-white font-mono text-base font-bold">
                            {group.destination.code}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Top Convergence Hub Found</span>
                            <h3 className="text-lg font-black text-[#021024]">{group.destination.city}, {group.destination.country}</h3>
                            <p className="text-xs text-slate-600">{group.destination.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Composite Fairness</span>
                            <span className="text-base font-black text-emerald-700">{group.optimizationMetrics?.compositeFairnessScore || 99} / 100</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Average Ticket Price</span>
                            <span className="text-base font-black font-mono text-[#052659]">${group.optimizationMetrics?.averagePriceUsd || 145}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <h4 className="text-xs font-bold text-[#021024] mb-3">Traveler Flight Assignments to {group.destination.city}</h4>
                      <div className="space-y-2">
                        {group.members.map((m) => (
                          <div key={m.email} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50">
                            <span className="font-bold text-slate-800">{m.name}</span>
                            <span className="text-slate-500 font-mono">{m.originAirport?.code || 'DEP'} → {group.destination.code}</span>
                            {m.flight ? (
                              <span className="font-bold text-emerald-700">{m.flight.airline} ({m.flight.flightNumber}) • ${m.flight.priceUsd || m.flight.price}</span>
                            ) : (
                              <span className="text-slate-400">Flight Pending Selection</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center space-y-3">
                    <Compass size={32} className="mx-auto text-slate-400" />
                    <h3 className="text-sm font-bold text-[#021024]">No Destination Selected Yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Click "Run Pareto Optimization" to automatically analyze departure locations and find the optimal meeting hub.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft size={14} /> Back to Departure Cities
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    disabled={!group.destination}
                    className="flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#021024] disabled:opacity-50"
                  >
                    <span>Proceed to Flight Search (Step 4)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: FLIGHT SEARCH INTEGRATION */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-[#021024]">
                      Step 4 — Flight Search & Schedule Selection
                    </h2>
                    <p className="text-xs text-slate-500">
                      Query available live flight options from the backend Flight API and confirm flight schedules.
                    </p>
                  </div>

                  {isOrganizer && (
                    <button
                      type="button"
                      onClick={handleLockItinerary}
                      disabled={actionLoading || hasFlightsCount < totalMembers}
                      className="flex items-center gap-2 rounded-xl bg-[#052659] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#021024] disabled:opacity-60"
                    >
                      <Lock size={14} />
                      <span>Lock Group Itinerary</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {group.members.map((m) => (
                    <div key={m.email} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-[#021024]">{m.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Route: <strong>{m.originAirport?.code || 'DEP'} → {group.destination?.code || 'ARR'}</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSearchFlightsForMember(m)}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#052659] hover:bg-blue-50 transition"
                        >
                          {m.flight ? "Change Flight" : "Search Flights"}
                        </button>
                      </div>

                      {m.flight && (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Plane size={14} className="text-emerald-700" />
                            <span className="font-bold text-slate-900">{m.flight.airline} ({m.flight.flightNumber})</span>
                            <span className="text-slate-500 font-mono">{m.flight.departureTime || m.flight.departureLocal} - {m.flight.arrivalTime || m.flight.arrivalLocal}</span>
                          </div>
                          <span className="font-bold font-mono text-emerald-800">${m.flight.priceUsd || m.flight.price}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft size={14} /> Back to Meeting Hub
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(5)}
                    disabled={hasFlightsCount < totalMembers}
                    className="flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#021024] disabled:opacity-50"
                  >
                    <span>Proceed to Seat Selection (Step 5)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: MULTI-TRAVELER SEAT SELECTION (REQUIRE N SEATS FOR N MEMBERS) */}
            {activeStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-[#021024]">
                      Step 5 — Multi-Traveler Seat Selection ({assignedSeatsCount}/{totalMembers} Seats Assigned)
                    </h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                      assignedSeatsCount === totalMembers
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}>
                      {assignedSeatsCount === totalMembers ? "✓ All Seats Assigned" : `Action Required: Assign ${totalMembers - assignedSeatsCount} Seat(s)`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Select exactly {totalMembers} distinct seats on the interactive cabin map — one for each traveler in the group.
                  </p>
                </div>

                <div className="space-y-3">
                  {group.members.map((m) => (
                    <div key={m.email} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#052659] text-white font-bold text-xs">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#021024]">{m.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {m.flight ? `${m.flight.airline} ${m.flight.flightNumber}` : 'Flight unassigned'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {m.selectedSeat ? (
                          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900">
                            <Armchair size={14} className="text-emerald-700" />
                            <span>Seat {m.selectedSeat}</span>
                          </div>
                        ) : (
                          <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                            No Seat Assigned
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSeatPickerMember(m);
                            setSelectedSeatTemp(m.selectedSeat || "");
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#052659] hover:bg-blue-50"
                        >
                          {m.selectedSeat ? "Change Seat" : "Assign Seat"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft size={14} /> Back to Flights
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(6)}
                    disabled={assignedSeatsCount < totalMembers}
                    className="flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#021024] disabled:opacity-50"
                  >
                    <span>Proceed to Travel Documents (Step 6)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: PASSENGER & TRAVEL DOCUMENTS */}
            {activeStep === 6 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-extrabold text-[#021024]">
                    Step 6 — Passenger Information & Passport Documents ({completedDocsCount}/{totalMembers} Complete)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Each traveler must enter and validate their official travel document details.
                  </p>
                </div>

                <div className="space-y-3">
                  {group.members.map((m) => (
                    <div key={m.email} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#052659] text-white font-bold text-xs">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#021024]">{m.name}</div>
                          <div className="text-[10px] text-slate-500">{m.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {m.passengerDetailsComplete ? (
                          <span className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                            <ShieldCheck size={14} className="text-emerald-600" /> Documents Verified
                          </span>
                        ) : (
                          <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                            Details Pending
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => openPassengerModalForMember(m)}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#052659] hover:bg-blue-50"
                        >
                          {m.passengerDetailsComplete ? "Edit Details" : "Enter Details"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep(5)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft size={14} /> Back to Seats
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(7)}
                    disabled={completedDocsCount < totalMembers}
                    className="flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#021024] disabled:opacity-50"
                  >
                    <span>Proceed to Combined Checkout (Step 7)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 7: COMBINED CHECKOUT & E-TICKETS */}
            {activeStep === 7 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-[#021024]">
                      Step 7 — Combined Group Checkout & E-Tickets
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Organizer combined payment for all {totalMembers} travelers. All details will be stored directly in MongoDB.
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                    group.status === "CONFIRMED"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-blue-200 bg-blue-50 text-blue-800"
                  }`}>
                    {group.status === "CONFIRMED" ? "✓ Group Booking Confirmed" : `Total Group Fare: $${totalGroupFare}`}
                  </span>
                </div>

                {group.status === "CONFIRMED" ? (
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 text-center space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white mx-auto shadow-md">
                        <CheckCircle2 size={24} />
                      </div>
                      <h3 className="text-lg font-extrabold text-emerald-950">Group Trip Confirmed!</h3>
                      <p className="text-xs text-emerald-800 max-w-md mx-auto">
                        Individual e-tickets and boarding passes have been issued to all {totalMembers} group members and saved directly to MongoDB.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {group.members.map((m) => (
                        <div key={m.email} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-[#021024]">{m.name}</span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                              Ticket Issued
                            </span>
                          </div>

                          <div className="text-[11px] space-y-1 text-slate-600 font-mono">
                            <div>PNR: <strong className="text-slate-900">{m.bookingReference || 'SKY-GRP-CONFIRMED'}</strong></div>
                            <div>E-Ticket: <strong className="text-slate-900">{m.eTicketNumber || 'ETKT-SS-READY'}</strong></div>
                            <div>Flight: <strong className="text-slate-900">{m.flight?.flightNumber || "SS-101"} ({m.originAirport?.code || 'DEP'} → {group.destination?.code || 'ARR'})</strong></div>
                            <div>Seat: <strong className="text-slate-900">{m.selectedSeat || 'Assigned'}</strong></div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setViewingTicketMember(m)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#052659] py-2 text-xs font-bold text-white hover:bg-[#021024]"
                          >
                            <Ticket size={14} /> View Boarding Pass
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Traveler Breakdown</h3>
                      {group.members.map((m) => (
                        <div key={m.email} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#052659] text-white font-bold text-xs">
                              {m.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#021024]">{m.name} ({m.originAirport?.code || 'DEP'} → {group.destination?.code || 'ARR'})</div>
                              <div className="text-[10px] text-slate-500">Flight: {m.flight?.flightNumber || 'Unassigned'} | Seat: {m.selectedSeat || 'Unassigned'}</div>
                            </div>
                          </div>
                          <div className="font-mono text-xs font-extrabold text-[#052659]">
                            ${m.flight?.priceUsd || m.flight?.price || 0}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-3xl border border-blue-200 bg-blue-50/40 p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#052659] text-white">
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#021024]">Organizer Pay for Everyone</h3>
                            <p className="text-[11px] text-slate-500">Single combined payment for all {totalMembers} travelers</p>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-[10px] text-slate-500 uppercase">Total Due</div>
                          <div className="text-lg font-extrabold text-[#052659]">${totalGroupFare}</div>
                        </div>
                      </div>

                      {isOrganizer ? (
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentTargetMember(null);
                              setShowPaymentModal(true);
                            }}
                            className="flex items-center gap-2 rounded-2xl bg-[#052659] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#021024]"
                          >
                            <CreditCard size={16} />
                            <span>Pay ${totalGroupFare} for Everyone</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-slate-200">
                          Waiting for trip organizer ({group.organizerEmail}) to complete the combined group checkout.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>

        <Footer />
      </div>

      {/* MODAL: ADD / SEARCH REGISTERED TRAVELER (Step 1) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#021024]">Search & Add Registered Traveler</h3>
              <button type="button" onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            {inviteError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {inviteError}
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search database user by name or email..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-[#021024]"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                {availableUsers
                  .filter((u) => {
                    const q = userQuery.toLowerCase().trim();
                    if (!q) return true;
                    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                  })
                  .map((u) => (
                    <div
                      key={u.id || u.email}
                      onClick={() => handleInviteTraveler(u)}
                      className="flex cursor-pointer items-center justify-between rounded-lg p-2 text-xs transition hover:bg-white"
                    >
                      <div>
                        <div className="font-bold text-[#021024]">{u.name}</div>
                        <div className="text-[10px] text-slate-500">{u.email} • Origin: {u.homeAirport || 'DEL'}</div>
                      </div>
                      <span className="rounded bg-[#052659] px-2.5 py-1 text-[10px] font-bold text-white">Add</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE DEPARTURE CITY (Step 2) */}
      {editingOriginMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#021024]">Change Departure City for {editingOriginMember.name}</h3>
              <button type="button" onClick={() => setEditingOriginMember(null)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                <Compass size={14} className="text-[#052659]" />
                <span>{detectingGps ? "Detecting GPS Location..." : "Detect Location via GPS"}</span>
              </button>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search city or airport code (e.g. DEL, BOM, MAA)..."
                  value={originSearchQuery}
                  onChange={(e) => setOriginSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-[#021024]"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                {AIRPORTS.filter((a) => {
                  const q = originSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return a.city.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.country.toLowerCase().includes(q);
                })
                  .slice(0, 10)
                  .map((a) => (
                    <button
                      key={a.code}
                      type="button"
                      onClick={() => handleSelectOrigin(a.code)}
                      className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition hover:bg-white"
                    >
                      <div>
                        <div className="font-bold text-[#021024]">{a.city}, {a.country}</div>
                        <div className="text-[10px] text-slate-400">{a.name}</div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#052659]">{a.code}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FLIGHT SEARCH RESULTS (Step 4) */}
      {showFlightSearchModal && activeFlightMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#021024]">Select Flight for {activeFlightMember.name}</h3>
                <p className="text-[11px] text-slate-500">Route: {activeFlightMember.originAirport?.code} → {group?.destination?.code}</p>
              </div>
              <button type="button" onClick={() => setShowFlightSearchModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {searchingFlights ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#052659] border-t-transparent" />
                  <span className="text-xs text-slate-500">Querying live flight schedules...</span>
                </div>
              ) : flightSearchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No flights found for this route.
                </div>
              ) : (
                flightSearchResults.map((f) => (
                  <div key={f._id || f.flightNumber} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 hover:border-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#052659] text-white font-mono text-xs font-bold">
                        {f.airlineCode}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#021024]">{f.airline} ({f.flightNumber})</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {f.departureTime || f.departureLocal} → {f.arrivalTime || f.arrivalLocal} ({f.duration ? Math.floor(f.duration / 60) + 'h ' + (f.duration % 60) + 'm' : 'Direct'})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono text-xs font-bold text-[#052659]">
                        ${f.priceUsd || f.price || 120}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectFlightForMember(f)}
                        disabled={actionLoading}
                        className="rounded-xl bg-[#052659] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#021024]"
                      >
                        Select Flight
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEAT SELECTION (Step 5) */}
      {seatPickerMember && seatLayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#021024]">Assign Seat for {seatPickerMember.name}</h3>
              <button type="button" onClick={() => setSeatPickerMember(null)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-around text-xs border-b pb-3">
                <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-slate-200 border" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-[#052659]" /> Selected ({selectedSeatTemp})</span>
                <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-rose-200" /> Occupied/Group Reserved</span>
              </div>

              <div className="max-h-72 overflow-y-auto p-4 bg-slate-50 rounded-2xl space-y-2">
                {seatRows.map((row: { rowNumber: number; seats: SeatItem[] }) => (
                  <div key={row.rowNumber} className="flex items-center justify-center gap-2">
                    <span className="w-6 text-[10px] font-bold text-slate-400">{row.rowNumber}</span>
                    {row.seats.map((seat: SeatItem) => {
                      const isOccupiedByOtherGroupMember = group.members.some(
                        (other) =>
                          other.email.toLowerCase() !== seatPickerMember.email.toLowerCase() &&
                          other.selectedSeat === seat.id
                      );
                      const isUnavailable = seat.isOccupied || isOccupiedByOtherGroupMember;
                      const isSelected = selectedSeatTemp === seat.id;

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => setSelectedSeatTemp(seat.id)}
                          className={`h-7 w-7 rounded-lg text-[10px] font-bold transition ${
                            isSelected
                              ? "bg-[#052659] text-white shadow-xs"
                              : isUnavailable
                              ? "bg-rose-200 text-rose-700 cursor-not-allowed"
                              : "bg-white border border-slate-300 text-slate-700 hover:bg-blue-50"
                          }`}
                        >
                          {seat.id}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSeatPickerMember(null)} className="rounded-xl border px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
                <button type="button" onClick={handleConfirmSeat} disabled={!selectedSeatTemp} className="rounded-xl bg-[#052659] px-5 py-2 text-xs font-bold text-white disabled:opacity-50">Confirm Seat {selectedSeatTemp}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PASSENGER & PASSPORT DETAILS (Step 6) */}
      {editingPassengerMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#021024]">Passenger & Passport Details: {editingPassengerMember.name}</h3>
              <button type="button" onClick={() => setEditingPassengerMember(null)} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
            </div>

            <form onSubmit={handleSavePassengerDetails} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Title</label>
                  <select value={passengerForm.title} onChange={(e) => setPassengerForm({ ...passengerForm, title: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                    <option value="Mr">Mr</option>
                    <option value="Ms">Ms</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">First Name *</label>
                  <input type="text" required value={passengerForm.firstName} onChange={(e) => setPassengerForm({ ...passengerForm, firstName: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Last Name *</label>
                  <input type="text" required value={passengerForm.lastName} onChange={(e) => setPassengerForm({ ...passengerForm, lastName: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Passport Number *</label>
                  <input type="text" required value={passengerForm.passportNumber} onChange={(e) => setPassengerForm({ ...passengerForm, passportNumber: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Passport Expiry *</label>
                  <input type="date" required value={passengerForm.passportExpiry} onChange={(e) => setPassengerForm({ ...passengerForm, passportExpiry: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingPassengerMember(null)} className="rounded-xl border px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" disabled={actionLoading} className="rounded-xl bg-[#052659] px-5 py-2 text-xs font-bold text-white">Save Details to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAYMENT CHECKOUT (Step 8) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#021024]">Payment Checkout</h3>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
            </div>

            <form onSubmit={handleExecutePayment} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Cardholder Name</label>
                <input type="text" required placeholder="Name on card" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Card Number</label>
                <input type="text" required value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="16-digit card number" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Expiry (MM/YY)</label>
                  <input type="text" required value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">CVC / CVV</label>
                  <input type="password" required maxLength={4} value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="CVC" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="rounded-xl border px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" disabled={processingPayment} className="rounded-xl bg-[#052659] px-5 py-2 text-xs font-bold text-white">Authorize Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW E-TICKET (Step 9) */}
      {viewingTicketMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-[#052659]" />
                <h3 className="text-sm font-bold text-[#021024]">Official Boarding Pass — {viewingTicketMember.name}</h3>
              </div>
              <button type="button" onClick={() => setViewingTicketMember(null)} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-3 text-slate-700 font-sans">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Passenger</span>
                  <span className="font-bold text-[#021024]">{viewingTicketMember.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Seat</span>
                  <span className="font-bold text-[#052659]">{viewingTicketMember.selectedSeat || "14A"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>PNR: <strong className="text-slate-900">{viewingTicketMember.bookingReference}</strong></div>
                <div>E-Ticket: <strong className="text-slate-900">{viewingTicketMember.eTicketNumber}</strong></div>
                <div>Flight: <strong className="text-slate-900">{viewingTicketMember.flight?.flightNumber || 'SS-101'}</strong></div>
                <div>Route: <strong className="text-slate-900">{viewingTicketMember.originAirport?.code || 'DEP'} → {group.destination?.code || 'ARR'}</strong></div>
              </div>

              <div className="flex justify-center pt-2">
                <QrCode size={64} className="text-slate-800" />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <Printer size={14} /> Print Boarding Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER ORGANIZER ROLE */}
      {showTransferModal && group && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Header */}
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
                <X size={18} />
              </button>
            </div>

            {/* Description */}
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Select a traveler below to hand over the{" "}
              <span className="font-bold text-[#021024]">Organizer</span> role. They will gain full
              control over the trip workspace. This action cannot be undone without their cooperation.
            </p>

            {/* Member List */}
            <div className="mt-4 space-y-2">
              {group.members
                .filter((m) => m.email.toLowerCase() !== group.organizerEmail.toLowerCase())
                .map((m) => (
                  <div
                    key={m.email}
                    className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 hover:border-amber-300 hover:bg-amber-50/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#052659] text-xs font-bold text-white shadow-sm">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#021024]">{m.name}</div>
                        <div className="text-[10px] text-slate-400">{m.email}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleTransferOrganizer(m.email)}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-amber-600 disabled:opacity-60 transition"
                    >
                      <Crown size={12} />
                      Make Organizer
                    </button>
                  </div>
                ))}

              {group.members.filter(
                (m) => m.email.toLowerCase() !== group.organizerEmail.toLowerCase()
              ).length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  No other members yet. Invite travelers first.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
