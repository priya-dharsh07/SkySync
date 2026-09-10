import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", bookings: [] },
        { status: 401 }
      );
    }

    await connectDB();

    const bookings = await Booking.find({
      $or: [
        { userId: user.id },
        { userEmail: user.email.toLowerCase() },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

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
    } = body;

    if (!flight || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return NextResponse.json(
        { success: false, message: "Flight and passenger details are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const bookingRef = `SKY-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const eTicket = `ETKT-SS-${Math.floor(100000 + Math.random() * 900000)}-${flight.originCode || "DEP"}`;

    const newBooking = await Booking.create({
      userId: user ? user.id : undefined,
      userEmail: user ? user.email.toLowerCase() : passengers[0].email?.toLowerCase(),
      bookingReference: bookingRef,
      eTicketNumber: eTicket,
      flightNumber: flight.flightNumber || `${flight.airlineCode || "FL"}-101`,
      airline: flight.airline || "SkySync Airways",
      airlineCode: flight.airlineCode || "SS",
      origin: flight.origin,
      originCode: flight.originCode,
      destination: flight.destination,
      destinationCode: flight.destinationCode,
      departureDate: flight.departureDate,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      passengers,
      selectedSeats,
      totalPrice: Number(totalPrice) || Number(flight.price) * passengers.length || 250,
      escrowStatus: "CAPTURED",
      status: "CONFIRMED",
      paymentCardLast4,
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
