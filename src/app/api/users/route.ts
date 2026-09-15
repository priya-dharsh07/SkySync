import { NextRequest, NextResponse } from "next/server";
import { findUsers, saveUser } from "@/lib/db/unifiedStore";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    const users = await findUsers(query);

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        homeAirport: u.homeAirport,
        homeCity: u.homeCity,
        country: u.country,
        lat: u.lat,
        lng: u.lng,
      })),
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { success: false, users: [] },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { homeAirport, homeCity, country, lat, lng } = body;

    const updatedUser = await saveUser({
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      ...(homeAirport ? { homeAirport: homeAirport.toUpperCase().trim() } : {}),
      ...(homeCity ? { homeCity: homeCity.trim() } : {}),
      ...(country ? { country: country.trim() } : {}),
      ...(typeof lat === "number" ? { lat } : {}),
      ...(typeof lng === "number" ? { lng } : {}),
    });

    return NextResponse.json({
      success: true,
      message: "User home location updated successfully.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        homeAirport: updatedUser.homeAirport,
        homeCity: updatedUser.homeCity,
        country: updatedUser.country,
        lat: updatedUser.lat,
        lng: updatedUser.lng,
      },
    });
  } catch (error) {
    console.error("PATCH /api/users error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update user location" },
      { status: 500 }
    );
  }
}
