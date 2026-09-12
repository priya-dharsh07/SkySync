import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  findGroupBookings,
  saveGroupBooking,
  findUserById,
  findUserByEmail,
} from "@/lib/db/unifiedStore";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", groups: [] },
        { status: 401 }
      );
    }

    const groups = await findGroupBookings({
      userId: user.id,
      userEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    console.error("GET /api/group-bookings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch group bookings", groups: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "You must be signed in to create a group trip." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const rawName = body.groupName || body.name;
    const initialMembers = body.initialMembers || body.members;
    const targetDate = body.targetDate;

    if (!rawName || typeof rawName !== "string" || !rawName.trim()) {
      return NextResponse.json(
        { success: false, message: "Group name is required." },
        { status: 400 }
      );
    }
    const groupName = rawName.trim();

    const groupId = `grp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Organizer is the current user
    const organizerMember = {
      userId: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      role: "ORGANIZER",
      invitationStatus: "ACCEPTED",
      originAirport: user.homeAirport
        ? {
            code: user.homeAirport,
            city: user.homeCity || "New Delhi",
            country: user.country || "India",
            name: `${user.homeCity} Airport`,
            lat: user.lat,
            lng: user.lng,
          }
        : undefined,
      passengerDetails: {
        title: "Mr",
        firstName: user.name.split(" ")[0] || "Organizer",
        lastName: user.name.split(" ").slice(1).join(" ") || "",
        email: user.email,
        phone: "+91 98401 23456",
        passportCountry: user.country === "India" ? "IND" : "USA",
        visaStatus: "VERIFIED_OK",
      },
      passengerDetailsComplete: true,
      paymentStatus: "UNPAID",
    };

    const membersList: any[] = [organizerMember];

    // If initial members were provided, validate that they exist in the SkySync database
    if (Array.isArray(initialMembers)) {
      for (const m of initialMembers) {
        if (!m.email || m.email.toLowerCase() === user.email.toLowerCase()) continue;
        const existingUser = await findUserByEmail(m.email);
        if (!existingUser) {
          return NextResponse.json(
            {
              success: false,
              message: `Traveler with email "${m.email}" is not registered on SkySync. All group travelers must register an account with their departure location first.`,
            },
            { status: 400 }
          );
        }

        const originAirport = existingUser.homeAirport
          ? {
              code: existingUser.homeAirport,
              city: existingUser.homeCity || existingUser.homeAirport,
              country: existingUser.country || "India",
              name: `${existingUser.homeCity || existingUser.homeAirport} Airport`,
              lat: existingUser.lat,
              lng: existingUser.lng,
            }
          : undefined;

        membersList.push({
          userId: existingUser.id,
          name: existingUser.name,
          email: existingUser.email.toLowerCase(),
          role: "MEMBER",
          invitationStatus: "INVITED",
          originAirport,
          passengerDetails: {
            title: "Mr",
            firstName: existingUser.name.split(" ")[0],
            lastName: existingUser.name.split(" ").slice(1).join(" ") || "",
            email: existingUser.email.toLowerCase(),
            phone: "+91 98401 23456",
            passportCountry: existingUser.country === "India" ? "IND" : "USA",
            visaStatus: "VERIFIED_OK",
          },
          passengerDetailsComplete: false,
          paymentStatus: "UNPAID",
        });
      }
    }

    const newGroup = await saveGroupBooking({
      groupId,
      groupName: groupName.trim(),
      organizerId: user.id,
      organizerEmail: user.email.toLowerCase(),
      organizerName: user.name,
      status: "PLANNING",
      targetDate: targetDate || "2026-10-15",
      members: membersList,
      totalPrice: 0,
    });

    const groupData = {
      ...newGroup,
      id: newGroup.groupId,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Group trip created successfully.",
        group: groupData,
        groupId: newGroup.groupId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/group-bookings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create group trip." },
      { status: 500 }
    );
  }
}
