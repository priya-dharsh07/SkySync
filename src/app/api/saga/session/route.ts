import { NextRequest, NextResponse } from "next/server";
import { GroupMemberSession } from "@/lib/saga/types";
import { Airport } from "@/lib/convergence/airports";

interface SessionStore {
  id: string;
  createdAt: string;
  destination: Airport;
  members: GroupMemberSession[];
}

// In-memory session cache for fast multi-party coordination
const globalSessions = globalThis as unknown as { activeSessions?: Map<string, SessionStore> };
const activeSessions = globalSessions.activeSessions || new Map<string, SessionStore>();
if (process.env.NODE_ENV !== "production") {
  globalSessions.activeSessions = activeSessions;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { destination, members } = body as {
      destination: Airport;
      members: Array<{
        id: string;
        name: string;
        email?: string;
        originAirport: Airport;
        flight: any;
        selectedSeat?: string;
      }>;
    };

    if (!destination || !members || members.length < 2) {
      return NextResponse.json(
        { success: false, error: "Invalid group session payload" },
        { status: 400 }
      );
    }

    const sessionId = `sky-${Math.random().toString(36).substring(2, 8)}-${destination.code.toLowerCase()}`;

    // Assign default seats if not selected
    const defaultSeatColumns = ["A", "B", "C", "D", "E", "F"];
    const populatedMembers: GroupMemberSession[] = members.map((m, idx) => ({
      id: m.id || `trv-${idx + 1}`,
      name: m.name || `Traveler ${idx + 1}`,
      email: m.email || `traveler${idx + 1}@skysync.app`,
      originAirport: m.originAirport,
      flight: m.flight,
      selectedSeat: m.selectedSeat || `${12 + idx}${defaultSeatColumns[idx % 6]}`,
      escrowStatus: "UNAUTHORIZED",
      ticketStatus: "UNISSUED",
    }));

    const sessionData: SessionStore = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      destination,
      members: populatedMembers,
    };

    activeSessions.set(sessionId, sessionData);

    // Persist to MongoDB asynchronously
    try {
      const { connectToDatabase } = await import("@/lib/db/mongodb");
      const { GroupSessionModel } = await import("@/lib/db/models/GroupSession");
      await connectToDatabase();
      await GroupSessionModel.findOneAndUpdate(
        { sessionId },
        {
          sessionId,
          destination,
          members: populatedMembers,
          status: "ACTIVE",
        },
        { upsert: true }
      );
    } catch (dbErr) {
      console.warn("MongoDB session persistence warning:", dbErr);
    }

    return NextResponse.json({
      success: true,
      sessionId,
      session: sessionData,
    });
  } catch (err) {
    console.error("POST /api/saga/session error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to initialize group booking session" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "Session ID is required" },
      { status: 400 }
    );
  }

  let session: SessionStore | null = activeSessions.get(sessionId) || null;

  if (!session) {
    try {
      const { connectToDatabase } = await import("@/lib/db/mongodb");
      const { GroupSessionModel } = await import("@/lib/db/models/GroupSession");
      await connectToDatabase();
      const doc = await GroupSessionModel.findOne({ sessionId });
      if (doc) {
        session = {
          id: doc.sessionId,
          createdAt: doc.createdAt.toISOString(),
          destination: doc.destination as unknown as Airport,
          members: doc.members as unknown as GroupMemberSession[],
        };
        activeSessions.set(sessionId, session);
      }
    } catch (dbErr) {
      console.warn("MongoDB fetch session warning:", dbErr);
    }
  }

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Booking session not found or expired" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    session,
  });
}
