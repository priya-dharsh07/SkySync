import { cookies } from "next/headers";
import { findUserById } from "@/lib/db/unifiedStore";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();

    const sessionId = cookieStore.get("skysync_session")?.value;

    if (!sessionId) {
      return null;
    }

    const user = await findUserById(sessionId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      homeAirport: user.homeAirport || "DEL",
      homeCity: user.homeCity || "New Delhi",
      country: user.country || "India",
      lat: user.lat ?? 28.5562,
      lng: user.lng ?? 77.1,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}