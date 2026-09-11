import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    let users: Array<{
      id: string;
      name: string;
      email: string;
      homeAirport?: string;
      homeCity?: string;
      country?: string;
      lat?: number;
      lng?: number;
    }> = [];

    try {
      const conn = await connectDB();
      if (conn) {
        const filter: Record<string, unknown> = {};
        if (query) {
          filter.$or = [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { homeCity: { $regex: query, $options: "i" } },
            { homeAirport: { $regex: query, $options: "i" } },
          ];
        }

        const found = await User.find(filter)
          .select("_id name email homeAirport homeCity country lat lng createdAt")
          .limit(25)
          .lean();

        users = found.map((u: any) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          homeAirport: u.homeAirport || "DEL",
          homeCity: u.homeCity || "New Delhi",
          country: u.country || "India",
          lat: u.lat ?? 28.5562,
          lng: u.lng ?? 77.1000,
        }));
      }
    } catch (err) {
      console.warn("MongoDB users query warning:", err);
    }

    return NextResponse.json({
      success: true,
      users,
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
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { homeAirport, homeCity, country, lat, lng } = body;

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      currentUser.id,
      {
        $set: {
          ...(homeAirport ? { homeAirport: homeAirport.toUpperCase().trim() } : {}),
          ...(homeCity ? { homeCity: homeCity.trim() } : {}),
          ...(country ? { country: country.trim() } : {}),
          ...(typeof lat === "number" ? { lat } : {}),
          ...(typeof lng === "number" ? { lng } : {}),
        },
      },
      { new: true }
    ).select("-password");

    return NextResponse.json({
      success: true,
      message: "User home location updated successfully.",
      user: {
        id: updatedUser?._id.toString(),
        name: updatedUser?.name,
        email: updatedUser?.email,
        homeAirport: updatedUser?.homeAirport,
        homeCity: updatedUser?.homeCity,
        country: updatedUser?.country,
        lat: updatedUser?.lat,
        lng: updatedUser?.lng,
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
