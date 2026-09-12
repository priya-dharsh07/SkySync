import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  findGroupBookingById,
  saveGroupBooking,
  saveBooking,
  findUserByEmail,
  findUserById,
} from "@/lib/db/unifiedStore";
import { computeParetoConvergence, TravelerOrigin } from "@/lib/convergence/pareto";
import { getAirportByCode } from "@/lib/convergence/airports";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const group = await findGroupBookingById(id);
    if (!group) {
      return NextResponse.json(
        { success: false, message: "Group trip not found or expired." },
        { status: 404 }
      );
    }

    // Determine viewer role
    const isOrganizer =
      user &&
      (user.id === group.organizerId ||
        user.email.toLowerCase() === group.organizerEmail.toLowerCase());

    const isMember =
      user &&
      group.members.some(
        (m: any) =>
          (m.userId && m.userId === user.id) ||
          (m.email && m.email.toLowerCase() === user.email.toLowerCase())
      );

    // Filter or mask sensitive traveler document fields for other members
    const safeMembers = group.members.map((m: any) => {
      const isSelf =
        user &&
        ((m.userId && m.userId === user.id) ||
          (m.email && m.email.toLowerCase() === user.email.toLowerCase()));

      if (isSelf || isOrganizer) {
        return m;
      }

      // Strip private passport/document details for other members
      return {
        ...m,
        passengerDetails: m.passengerDetails
          ? {
              firstName: m.passengerDetails.firstName,
              lastName: m.passengerDetails.lastName,
              passportCountry: m.passengerDetails.passportCountry,
            }
          : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      group: {
        ...group,
        members: safeMembers,
      },
      viewer: {
        isOrganizer: !!isOrganizer,
        isMember: !!isMember,
        currentUserId: user?.id,
        currentUserEmail: user?.email,
      },
    });
  } catch (error) {
    console.error("GET /api/group-bookings/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load group trip." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    const group = await findGroupBookingById(id);
    if (!group) {
      return NextResponse.json(
        { success: false, message: "Group trip not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    // Normalize action aliases so both client conventions work
    const rawAction = body.action;
    const action =
      rawAction === "SET_PAYMENT_MODE"
        ? "SELECT_PAYMENT_MODE"
        : rawAction === "ACCEPT_INVITATION"
        ? "ACCEPT_INVITE"
        : rawAction === "DECLINE_INVITATION"
        ? "DECLINE_INVITE"
        : rawAction;

    const isOrganizer =
      user.id === group.organizerId ||
      user.email.toLowerCase() === group.organizerEmail.toLowerCase();

    // -------------------------------------------------------------
    // ACTION: INVITE_MEMBER
    // -------------------------------------------------------------
    if (action === "INVITE_MEMBER") {
      if (!isOrganizer) {
        return NextResponse.json(
          { success: false, message: "Only the organizer can invite travelers." },
          { status: 403 }
        );
      }

      const { email, name, originCode } = body;
      if (!email || !email.trim()) {
        return NextResponse.json(
          { success: false, message: "Email is required to invite a traveler." },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Duplicate check
      const alreadyExists = group.members.some(
        (m: any) => m.email && m.email.toLowerCase() === normalizedEmail
      );
      if (alreadyExists) {
        return NextResponse.json(
          { success: false, message: "This traveler is already in the group." },
          { status: 400 }
        );
      }

      // Check if user is registered in SkySync
      const registeredUser = await findUserByEmail(normalizedEmail);
      if (!registeredUser) {
        return NextResponse.json(
          {
            success: false,
            message: `User "${normalizedEmail}" is not registered on SkySync. All group travelers must have a registered account with their departure location.`,
          },
          { status: 404 }
        );
      }

      const originAirport = originCode
        ? getAirportByCode(originCode)
        : registeredUser?.homeAirport
        ? getAirportByCode(registeredUser.homeAirport)
        : undefined;

      const newMember = {
        userId: registeredUser.id,
        name: registeredUser.name,
        email: normalizedEmail,
        role: "MEMBER",
        invitationStatus: "INVITED",
        originAirport,
        passengerDetails: {
          title: "Mr",
          firstName: registeredUser.name.split(" ")[0] || "Traveler",
          lastName: registeredUser.name.split(" ").slice(1).join(" ") || "",
          email: registeredUser.email,
          phone: "",
          passportCountry: registeredUser.country === "India" ? "IND" : "USA",
        },
        passengerDetailsComplete: false,
        paymentStatus: "UNPAID",
      };

      group.members.push(newMember);
      const updated = await saveGroupBooking(group);

      return NextResponse.json({
        success: true,
        message: `Invitation sent to ${newMember.name}.`,
        group: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION: REMOVE_MEMBER
    // -------------------------------------------------------------
    if (action === "REMOVE_MEMBER") {
      if (!isOrganizer) {
        return NextResponse.json(
          { success: false, message: "Only the organizer can remove travelers." },
          { status: 403 }
        );
      }

      const { memberEmail } = body;
      if (!memberEmail) {
        return NextResponse.json(
          { success: false, message: "Member email is required." },
          { status: 400 }
        );
      }

      if (memberEmail.toLowerCase() === group.organizerEmail.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: "The organizer cannot be removed. Transfer organizer role first." },
          { status: 400 }
        );
      }

      group.members = group.members.filter(
        (m: any) => m.email.toLowerCase() !== memberEmail.toLowerCase()
      );

      const updated = await saveGroupBooking(group);
      return NextResponse.json({
        success: true,
        message: "Traveler removed from group.",
        group: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION: TRANSFER_ORGANIZER
    // -------------------------------------------------------------
    if (action === "TRANSFER_ORGANIZER") {
      if (!isOrganizer) {
        return NextResponse.json(
          { success: false, message: "Only the current organizer can transfer the organizer role." },
          { status: 403 }
        );
      }

      const { targetEmail } = body;
      const targetMember = group.members.find(
        (m: any) => m.email.toLowerCase() === targetEmail?.toLowerCase()
      );

      if (!targetMember) {
        return NextResponse.json(
          { success: false, message: "Selected traveler is not part of this group." },
          { status: 404 }
        );
      }

      // Demote current organizer to member
      group.members = group.members.map((m: any) => {
        if (m.email.toLowerCase() === group.organizerEmail.toLowerCase()) {
          return { ...m, role: "MEMBER" };
        }
        if (m.email.toLowerCase() === targetEmail.toLowerCase()) {
          return { ...m, role: "ORGANIZER" };
        }
        return m;
      });

      group.organizerEmail = targetMember.email.toLowerCase();
      group.organizerName = targetMember.name;
      group.organizerId = targetMember.userId || targetMember.email;

      const updated = await saveGroupBooking(group);
      return NextResponse.json({
        success: true,
        message: `${targetMember.name} is now the group organizer.`,
        group: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION: ACCEPT_INVITE / DECLINE_INVITE / LEAVE_GROUP
    // -------------------------------------------------------------
    if (action === "ACCEPT_INVITE") {
      const idx = group.members.findIndex(
        (m: any) =>
          (m.userId && m.userId === user.id) ||
          (m.email && m.email.toLowerCase() === user.email.toLowerCase())
      );

      if (idx < 0) {
        return NextResponse.json(
          { success: false, message: "You are not invited to this group." },
          { status: 403 }
        );
      }

      group.members[idx].invitationStatus = "ACCEPTED";
      group.members[idx].userId = user.id;
      if (!group.members[idx].originAirport && user.homeAirport) {
        group.members[idx].originAirport = getAirportByCode(user.homeAirport);
      }

      const updated = await saveGroupBooking(group);
      return NextResponse.json({
        success: true,
        message: "You have joined the group trip!",
        group: updated,
      });
    }

    if (action === "DECLINE_INVITE") {
      const idx = group.members.findIndex(
        (m: any) =>
          (m.userId && m.userId === user.id) ||
          (m.email && m.email.toLowerCase() === user.email.toLowerCase())
      );

      if (idx < 0) {
        return NextResponse.json(
          { success: false, message: "You are not invited to this group." },
          { status: 403 }
        );
      }

      group.members[idx].invitationStatus = "DECLINED";
      const updated = await saveGroupBooking(group);
      return NextResponse.json({
        success: true,
        message: "Invitation declined.",
        group: updated,
      });
    }

    if (action === "LEAVE_GROUP") {
      if (isOrganizer && group.members.length > 1) {
        return NextResponse.json(
          { success: false, message: "Please transfer organizer role before leaving." },
          { status: 400 }
        );
      }

      group.members = group.members.filter(
        (m: any) =>
          m.email.toLowerCase() !== user.email.toLowerCase() &&
          (!m.userId || m.userId !== user.id)
      );

      const updated = await saveGroupBooking(group);
      return NextResponse.json({
        success: true,
        message: "You have left the group trip.",
        group: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION: UPDATE_ORIGIN
    // -------------------------------------------------------------
    if (action === "UPDATE_ORIGIN") {
      const { memberEmail, originCode } = body;
      const targetAirport = getAirportByCode(originCode);

      if (!targetAirport) {
        return NextResponse.json(
          { success: false, message: `Invalid airport code: ${originCode}` },
          { status: 400 }
        );
      }

      // Member can update self, organizer can update anyone
      const targetEmail = memberEmail ? memberEmail.toLowerCase() : user.email.toLowerCase();
      if (!isOrganizer && targetEmail !== user.email.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: "You can only update your own departure airport." },
          { status: 403 }
        );
      }

      const idx = group.members.findIndex(
        (m: any) => m.email.toLowerCase() === targetEmail
      );

      if (idx < 0) {
        return NextResponse.json(
          { success: false, message: "Traveler not found in group." },
          { status: 404 }
        );
      }

      group.members[idx].originAirport = targetAirport;
      const updated = await saveGroupBooking(group);

      return NextResponse.json({
        success: true,
        message: `Departure set to ${targetAirport.city} (${targetAirport.code}).`,
        group: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION: OPTIMIZE_TRIP / RUN_OPTIMIZATION
    // -------------------------------------------------------------
    if (action === "OPTIMIZE_TRIP" || action === "RUN_OPTIMIZATION") {
      // Validate that at least 2 travelers have origin airports set
      const readyMembers = group.members.filter((m: any) => m.originAirport?.code);

      if (readyMembers.length < 2) {
        return NextResponse.json(
          {
            success: false,
            message: "At least 2 travelers must set their departure city before optimizing.",
          },
          { status: 400 }
        );
      }

      const travelers: TravelerOrigin[] = readyMembers.map((m: any) => ({
        id: m.userId || m.email,
        name: m.name,
        originAirportCode: m.originAirport.code,
        departureDate: group.targetDate || "2026-10-15",
      }));

      const convergenceResults = computeParetoConvergence(travelers, {
        priceFairness: 0.4,
        arrivalAlignment: 0.35,
        travelDuration: 0.25,
      });

      if (!convergenceResults || convergenceResults.length === 0) {
        return NextResponse.json(
          { success: false, message: "No viable convergence hubs found for these origins." },
          { status: 400 }
        );
      }

      const topHub = convergenceResults[0];

      // Assign matched flight legs to travelers
      group.destination = topHub.destination;
      group.optimizationMetrics = {
        arrivalWindowMinutes: topHub.arrivalWindowMinutes,
        averagePriceUsd: topHub.averagePriceUsd,
        totalCostUsd: topHub.totalCostUsd,
        compositeFairnessScore: topHub.compositeFairnessScore,
        alternativeDestinations: convergenceResults.slice(1, 5).map((d) => ({
          destination: d.destination,
          averagePriceUsd: d.averagePriceUsd,
          arrivalWindowMinutes: d.arrivalWindowMinutes,
          compositeFairnessScore: d.compositeFairnessScore,
          memberFlights: d.memberFlights,
        })),
      };

      // Keep member flights unassigned so users explicitly select flights in Step 4
      group.members = group.members.map((m: any) => {
        return {
          ...m,
          flight: m.flight || undefined,
        };
      });

      group.status = "OPTIMIZED";
      group.totalPrice = topHub.totalCostUsd;

      const updated = await saveGroupBooking(group);

      return NextResponse.json({
        success: true,
        message: `Optimal meeting point found: ${topHub.destination.city} (${topHub.destination.code})!`,
        group: updated,
        convergenceResults,
      });
    }

    // -------------------------------------------------------------
    // ACTION: SET_DESTINATION (Select Alternative Destination)
    // -------------------------------------------------------------
    if (action === "SET_DESTINATION") {
      if (!isOrganizer) {
        return NextResponse.json(
          { success: false, message: "Only the organizer can select the destination." },
          { status: 403 }
        );
      }

      const { destinationCode, memberFlights } = body;
      const airport = getAirportByCode(destinationCode);
      if (!airport) {
        return NextResponse.json(
          { success: false, message: "Invalid destination airport." },
          { status: 400 }
        );
      }

      group.destination = airport;

      if (Array.isArray(memberFlights)) {
        group.members = group.members.map((m: any) => {
          const matched = memberFlights.find(
            (mf: any) =>
              mf.travelerId === m.userId ||
              mf.travelerId === m.email ||
              mf.originAirport?.code === m.originAirport?.code
          );
          return {
            ...m,
            flight: matched?.flight || m.flight,
          };
        });
      }

      const updated = await saveGroupBooking(group);
      return NextResponse.json({
        success: true,
        message: `Destination set to ${airport.city}.`,
        group: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION: LOCK_ITINERARY
    // -------------------------------------------------------------
    if (action === "LOCK_ITINERARY") {
      if (!isOrganizer) {
        return NextResponse.json(
          { success: false, message: "Only the organizer can lock the itinerary." },
          { status: 403 }
        );
      }

      if (!group.destination) {
        return NextResponse.json(
          { success: false, message: "Please choose a destination before locking the itinerary." },
          { status: 400 }
        );
      }

      const allHaveFlights = group.members.every((m: any) => m.flight?.flightNumber);
      if (!allHaveFlights) {
        return NextResponse.json(
          { success: false, message: "Every traveler must have an assigned flight before locking." },
          { status: 400 }
        );
      }

      group.status = "ITINERARY_LOCKED";
      const updated = await saveGroupBooking(group);

      return NextResponse.json({
        success: true,
        message: "Group itinerary locked. Travelers can now proceed to seats and payment.",
        group: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION: SELECT_PAYMENT_MODE
    // -------------------------------------------------------------
    if (action === "SELECT_PAYMENT_MODE") {
      if (!isOrganizer) {
        return NextResponse.json(
          { success: false, message: "Only the organizer can set the payment method." },
          { status: 403 }
        );
      }

      const { paymentMode } = body;
      if (paymentMode !== "INDIVIDUAL" && paymentMode !== "ORGANIZER") {
        return NextResponse.json(
          { success: false, message: "Invalid payment mode." },
          { status: 400 }
        );
      }

      group.paymentMode = paymentMode;
      group.status = "PAYMENT_IN_PROGRESS";
      const updated = await saveGroupBooking(group);

      return NextResponse.json({
        success: true,
        message:
          paymentMode === "INDIVIDUAL"
            ? "Option 1 Selected: Each traveler pays for their own flight."
            : "Option 2 Selected: Organizer pays for the entire group.",
        group: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION: SELECT_MEMBER_FLIGHT (Assign individual flight to traveler)
    // -------------------------------------------------------------
    if (action === "SELECT_MEMBER_FLIGHT") {
      const { memberEmail, flight } = body;
      const targetEmail = memberEmail ? memberEmail.toLowerCase() : user.email.toLowerCase();

      if (!isOrganizer && targetEmail !== user.email.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: "You can only select flights for yourself unless you are the organizer." },
          { status: 403 }
        );
      }

      const idx = group.members.findIndex(
        (m: any) => m.email.toLowerCase() === targetEmail
      );

      if (idx < 0) {
        return NextResponse.json(
          { success: false, message: "Traveler not found in group." },
          { status: 404 }
        );
      }

      if (!flight || !flight.flightNumber) {
        return NextResponse.json(
          { success: false, message: "Invalid flight details provided." },
          { status: 400 }
        );
      }

      group.members[idx].flight = flight;
      const updated = await saveGroupBooking(group);

      return NextResponse.json({
        success: true,
        message: `Flight ${flight.flightNumber} selected for ${group.members[idx].name}.`,
        group: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION: UPDATE_PASSENGER_DETAILS
    // -------------------------------------------------------------
    if (action === "UPDATE_PASSENGER_DETAILS") {
      const { memberEmail, passengerDetails } = body;
      const targetEmail = memberEmail ? memberEmail.toLowerCase() : user.email.toLowerCase();

      if (!isOrganizer && targetEmail !== user.email.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: "You can only edit your own passenger details." },
          { status: 403 }
        );
      }

      const idx = group.members.findIndex(
        (m: any) => m.email.toLowerCase() === targetEmail
      );

      if (idx < 0) {
        return NextResponse.json(
          { success: false, message: "Traveler not found in group." },
          { status: 404 }
        );
      }

      group.members[idx].passengerDetails = passengerDetails;
      group.members[idx].passengerDetailsComplete = !!(
        passengerDetails.firstName &&
        passengerDetails.lastName &&
        passengerDetails.passportNumber
      );

      const updated = await saveGroupBooking(group);
      return NextResponse.json({
        success: true,
        message: "Passenger details updated successfully.",
        group: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION: SELECT_SEAT
    // -------------------------------------------------------------
    if (action === "SELECT_SEAT") {
      // Accept both 'seatId' and 'seat' key names
      const { memberEmail } = body;
      const seatId = body.seatId || body.seat;
      const targetEmail = memberEmail ? memberEmail.toLowerCase() : user.email.toLowerCase();

      if (!isOrganizer && targetEmail !== user.email.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: "You can only select your own seat." },
          { status: 403 }
        );
      }

      // Check collision with other member on the same flight
      const targetIdx = group.members.findIndex(
        (m: any) => m.email.toLowerCase() === targetEmail
      );
      if (targetIdx < 0) {
        return NextResponse.json(
          { success: false, message: "Traveler not found." },
          { status: 404 }
        );
      }

      const currentMember = group.members[targetIdx];
      const conflict = group.members.find(
        (m: any) =>
          m.email.toLowerCase() !== targetEmail &&
          m.flight?.flightNumber === currentMember.flight?.flightNumber &&
          m.selectedSeat === seatId
      );

      if (conflict) {
        return NextResponse.json(
          { success: false, message: `Seat ${seatId} has already been reserved by ${conflict.name}.` },
          { status: 409 }
        );
      }

      group.members[targetIdx].selectedSeat = seatId;
      const updated = await saveGroupBooking(group);

      return NextResponse.json({
        success: true,
        message: `Seat ${seatId} reserved.`,
        group: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION: PROCESS_MEMBER_PAYMENT (Option 1: Individual Checkout)
    // -------------------------------------------------------------
    if (action === "PROCESS_MEMBER_PAYMENT") {
      const { memberEmail, paymentCardLast4 = "4242" } = body;
      const targetEmail = memberEmail ? memberEmail.toLowerCase() : user.email.toLowerCase();

      if (!isOrganizer && targetEmail !== user.email.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: "Unauthorized payment execution." },
          { status: 403 }
        );
      }

      const idx = group.members.findIndex(
        (m: any) => m.email.toLowerCase() === targetEmail
      );

      if (idx < 0) {
        return NextResponse.json(
          { success: false, message: "Traveler not found in group." },
          { status: 404 }
        );
      }

      const member = group.members[idx];
      const flight = member.flight;
      if (!flight) {
        return NextResponse.json(
          { success: false, message: "Flight itinerary not assigned." },
          { status: 400 }
        );
      }

      // Idempotency: If already paid, return existing booking
      if (member.paymentStatus === "PAID" && member.bookingReference) {
        return NextResponse.json({
          success: true,
          message: "Payment was already completed.",
          bookingReference: member.bookingReference,
          eTicketNumber: member.eTicketNumber,
          group,
        });
      }

      const bookingRef = `SKY-GRP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const eTicket = `ETKT-SS-${Math.floor(100000 + Math.random() * 900000)}-${flight.origin?.code || "DEP"}`;

      // Create confirmed Booking in Booking collection
      const createdBooking = await saveBooking({
        userId: member.userId || user.id,
        userEmail: member.email.toLowerCase(),
        groupId: group.groupId,
        groupBookingId: group._id || group.groupId,
        groupName: group.groupName,
        isGroupBooking: true,
        travelerRole: member.role,
        bookingReference: bookingRef,
        eTicketNumber: eTicket,
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        airlineCode: flight.airlineCode,
        origin: flight.origin?.city || flight.origin?.name || "Origin City",
        originCode: flight.origin?.code || "DEP",
        destination: group.destination?.city || flight.destination?.city || "Destination City",
        destinationCode: group.destination?.code || flight.destination?.code || "ARR",
        departureDate: flight.departureDate || group.targetDate || "2026-10-15",
        departureTime: flight.departureLocal || "08:15",
        arrivalTime: flight.arrivalLocal || "10:30",
        passengers: [
          {
            firstName: member.passengerDetails?.firstName || member.name.split(" ")[0] || "Traveler",
            lastName: member.passengerDetails?.lastName || member.name.split(" ").slice(1).join(" ") || "",
            email: member.email,
            phone: member.passengerDetails?.phone || "",
            passportNumber: member.passengerDetails?.passportNumber || "",
            passportCountry: member.passengerDetails?.passportCountry || "IND",
            passportExpiry: member.passengerDetails?.passportExpiry || "",
            visaStatus: member.passengerDetails?.visaStatus || "NOT_REQUIRED",
          },
        ],
        selectedSeats: [body.seat || member.selectedSeat || "14A"],
        totalPrice: flight.priceUsd || flight.price || 4950,
        escrowStatus: "CAPTURED",
        status: "CONFIRMED",
        paymentCardLast4: String(paymentCardLast4).slice(-4),
      });

      // Update member status in group
      group.members[idx].userId = user.id;
      if (body.seat) {
        group.members[idx].selectedSeat = body.seat;
      }
      if (body.passengerDetails) {
        group.members[idx].passengerDetails = {
          ...group.members[idx].passengerDetails,
          ...body.passengerDetails,
        };
        group.members[idx].passengerDetailsComplete = true;
      }
      group.members[idx].paymentStatus = "PAID";
      group.members[idx].bookingReference = bookingRef;
      group.members[idx].eTicketNumber = eTicket;
      group.members[idx].bookingId = createdBooking._id;
      group.members[idx].paidAt = new Date();

      // Check if all members are paid
      const allPaid = group.members.every((m: any) => m.paymentStatus === "PAID");
      if (allPaid) {
        group.status = "CONFIRMED";
      }

      const updated = await saveGroupBooking(group);

      return NextResponse.json({
        success: true,
        message: "Payment successful! Your official e-ticket and boarding pass have been generated.",
        booking: createdBooking,
        group: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION: PROCESS_GROUP_PAYMENT (Option 2: Organizer Pays All)
    // -------------------------------------------------------------
    if (action === "PROCESS_GROUP_PAYMENT") {
      if (!isOrganizer) {
        return NextResponse.json(
          { success: false, message: "Only the organizer can execute group payment." },
          { status: 403 }
        );
      }

      const { paymentCardLast4 = "4242" } = body;

      // Ensure every member has an explicitly selected flight and seat
      for (const m of group.members) {
        if (!m.flight || !m.flight.flightNumber) {
          return NextResponse.json(
            { success: false, message: `Traveler ${m.name} has not selected a flight itinerary yet.` },
            { status: 400 }
          );
        }
        if (!m.selectedSeat) {
          return NextResponse.json(
            { success: false, message: `Traveler ${m.name} must select a seat on the cabin seat map before completing payment.` },
            { status: 400 }
          );
        }
      }

      // Generate distinct Booking records for EACH member
      const createdBookings = [];

      for (let i = 0; i < group.members.length; i++) {
        const member = group.members[i];
        const flight = member.flight;
        const seat = member.selectedSeat;

        const bookingRef = `SKY-GRP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        const eTicket = `ETKT-SS-${Math.floor(100000 + Math.random() * 900000)}-${flight.origin?.code || "DEP"}`;

        const booking = await saveBooking({
          userId: member.userId,
          userEmail: member.email.toLowerCase(),
          groupId: group.groupId,
          groupBookingId: group._id || group.groupId,
          groupName: group.groupName,
          isGroupBooking: true,
          travelerRole: member.role,
          bookingReference: bookingRef,
          eTicketNumber: eTicket,
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          airlineCode: flight.airlineCode,
          origin: flight.origin?.city || flight.origin?.name || "Origin City",
          originCode: flight.origin?.code || "DEP",
          destination: group.destination?.city || flight.destination?.city || "Destination City",
          destinationCode: group.destination?.code || flight.destination?.code || "ARR",
          departureDate: flight.departureDate || group.targetDate || "2026-10-15",
          departureTime: flight.departureLocal || "08:15",
          arrivalTime: flight.arrivalLocal || "10:30",
          passengers: [
            {
              firstName: member.passengerDetails?.firstName || member.name.split(" ")[0] || "Traveler",
              lastName: member.passengerDetails?.lastName || member.name.split(" ").slice(1).join(" ") || "",
              email: member.email,
              phone: member.passengerDetails?.phone || "",
              passportNumber: member.passengerDetails?.passportNumber || "",
              passportCountry: member.passengerDetails?.passportCountry || "IND",
              passportExpiry: member.passengerDetails?.passportExpiry || "",
              visaStatus: member.passengerDetails?.visaStatus || "NOT_REQUIRED",
            },
          ],
          selectedSeats: [seat],
          totalPrice: flight.priceUsd || flight.price || 4950,
          escrowStatus: "CAPTURED",
          status: "CONFIRMED",
          paymentCardLast4: String(paymentCardLast4).slice(-4),
        });

        group.members[i].paymentStatus = "PAID";
        group.members[i].bookingReference = bookingRef;
        group.members[i].eTicketNumber = eTicket;
        group.members[i].bookingId = booking._id;
        group.members[i].selectedSeat = seat;
        group.members[i].paidAt = new Date();

        createdBookings.push(booking);
      }

      group.status = "CONFIRMED";
      const updated = await saveGroupBooking(group);

      return NextResponse.json({
        success: true,
        message: "Group booking confirmed! Individual e-tickets and boarding passes have been issued to all travelers.",
        group: updated,
        bookingsCount: createdBookings.length,
      });
    }

    // -------------------------------------------------------------
    // ACTION: CANCEL_GROUP
    // -------------------------------------------------------------
    if (action === "CANCEL_GROUP") {
      if (!isOrganizer) {
        return NextResponse.json(
          { success: false, message: "Only the organizer can cancel the group trip." },
          { status: 403 }
        );
      }

      group.status = "CANCELLED";
      const updated = await saveGroupBooking(group);

      return NextResponse.json({
        success: true,
        message: "Group trip cancelled.",
        group: updated,
      });
    }

    return NextResponse.json(
      { success: false, message: `Unrecognized action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/group-bookings/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update group trip." },
      { status: 500 }
    );
  }
}
