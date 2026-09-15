import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  findBookings,
  findBookingById,
  saveBooking,
  updateBookingStatus,
} from "@/lib/db/unifiedStore";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", bookings: [] },
        { status: 401 }
      );
    }

    const bookings = await findBookings({
      userId: user.id,
      userEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bookings", bookings: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const {
      flight,
      passengers,
      selectedSeats = [],
      totalPrice,
      paymentCardLast4 = "4242",
      groupId,
      groupBookingId,
      groupName,
      isGroupBooking = false,
      travelerRole,
    } = body;

    if (!flight || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return NextResponse.json(
        { success: false, message: "Flight and passenger details are required." },
        { status: 400 }
      );
    }

    const bookingRef = `SKY-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.floor(
      100 + Math.random() * 900
    )}`;
    const eTicket = `ETKT-SS-${Math.floor(100000 + Math.random() * 900000)}-${
      flight.originCode || "DEP"
    }`;

    const calculatedPrice =
      Number(totalPrice) ||
      Number(flight.price || flight.priceUsd || 4950) * passengers.length;

    const safeDepartureDate =
      typeof flight.departureDate === "string"
        ? flight.departureDate.split("T")[0]
        : flight.departureDate instanceof Date
        ? flight.departureDate.toISOString().split("T")[0]
        : "2026-10-15";

    const newBooking = await saveBooking({
      userId: user ? user.id : undefined,
      userEmail: user
        ? user.email.toLowerCase()
        : passengers[0].email?.toLowerCase() || "traveler@skysync.app",
      groupId,
      groupBookingId,
      groupName,
      isGroupBooking,
      travelerRole,
      bookingReference: bookingRef,
      eTicketNumber: eTicket,
      flightNumber: flight.flightNumber || `${flight.airlineCode || "SS"}-101`,
      airline: flight.airline || "SkySync Airways",
      airlineCode: flight.airlineCode || "SS",
      origin: flight.origin || "Origin City",
      originCode: (flight.originCode || "DEP").toUpperCase(),
      destination: flight.destination || "Destination City",
      destinationCode: (flight.destinationCode || "ARR").toUpperCase(),
      departureDate: safeDepartureDate,
      departureTime: flight.departureTime || flight.departureLocal || "08:15",
      arrivalTime: flight.arrivalTime || flight.arrivalLocal || "10:30",
      passengers: passengers.map((p: any) => ({
        firstName: p.firstName || "Traveler",
        lastName: p.lastName || "",
        email: p.email || "",
        phone: p.phone || "",
        passportNumber: p.passportNumber || "",
        passportCountry: p.passportCountry || "IND",
        passportExpiry: p.passportExpiry || "",
        visaStatus: p.visaStatus || "VERIFIED_OK",
      })),
      selectedSeats: Array.isArray(selectedSeats) ? selectedSeats : ["14A"],
      totalPrice: calculatedPrice,
      escrowStatus: "CAPTURED",
      status: "CONFIRMED",
      paymentCardLast4: String(paymentCardLast4).slice(-4),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Booking successfully created and synchronized.",
        booking: newBooking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create booking." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId, action } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    const booking = await findBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const isOwner =
      booking.userId === user.id ||
      booking.userEmail?.toLowerCase() === user.email.toLowerCase();

    if (!isOwner) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    if (action === "CANCEL") {
      const updated = await updateBookingStatus(bookingId, "CANCELLED", "VOIDED");
      return NextResponse.json({
        success: true,
        message: "Booking cancelled successfully. Reservation holds have been released.",
        booking: updated,
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action requested" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/bookings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update booking" },
      { status: 500 }
    );
  }
}
