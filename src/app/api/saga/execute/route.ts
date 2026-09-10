import { NextRequest, NextResponse } from "next/server";
import { SagaOrchestrator } from "@/lib/saga/orchestrator";
import { ChaosConfig, GroupMemberSession } from "@/lib/saga/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, members, chaos } = body as {
      sessionId: string;
      members: GroupMemberSession[];
      chaos?: ChaosConfig;
    };

    if (!sessionId || !members || !Array.isArray(members) || members.length < 2) {
      return NextResponse.json(
        { success: false, error: "Valid sessionId and at least 2 members are required." },
        { status: 400 }
      );
    }

    const orchestrator = new SagaOrchestrator(sessionId, members, chaos);
    const result = await orchestrator.execute();

    // Persist to MongoDB asynchronously
    try {
      const { connectToDatabase } = await import("@/lib/db/mongodb");
      const { SagaBookingModel } = await import("@/lib/db/models/SagaBooking");
      await connectToDatabase();
      await SagaBookingModel.create({
        sessionId,
        isAtomicSuccess: result.isAtomicSuccess,
        totalCapturedUsd: result.totalCapturedUsd,
        totalRefundedVoidedUsd: result.totalRefundedVoidedUsd,
        totalMembers: result.totalMembers,
        steps: result.steps,
        members: result.members,
        logs: result.logs,
      });
    } catch (dbErr) {
      console.warn("MongoDB saga execution persistence warning:", dbErr);
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err) {
    console.error("POST /api/saga/execute error:", err);
    return NextResponse.json(
      { success: false, error: "Critical internal error executing transactional saga." },
      { status: 500 }
    );
  }
}
