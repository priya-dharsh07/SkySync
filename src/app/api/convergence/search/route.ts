import { NextRequest, NextResponse } from "next/server";
import { computeParetoConvergence, TravelerOrigin, OptimizationWeights } from "@/lib/convergence/pareto";
import { getAirportByCode } from "@/lib/convergence/airports";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { travelers, weights } = body as {
      travelers: TravelerOrigin[];
      weights?: OptimizationWeights;
    };

    if (!travelers || !Array.isArray(travelers) || travelers.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Multi-origin convergence requires at least 2 travelers from different cities.",
        },
        { status: 400 }
      );
    }

    // Validate origins
    for (const t of travelers) {
      if (!t.originAirportCode || !getAirportByCode(t.originAirportCode)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid or unrecognized airport code: "${t.originAirportCode}" for traveler ${t.name || t.id}`,
          },
          { status: 400 }
        );
      }
    }

    const destinations = computeParetoConvergence(travelers, weights);

    // If RAPIDAPI_KEY is active, check live airport statuses for top convergence hub
    if (process.env.RAPIDAPI_KEY && destinations.length > 0) {
      try {
        const { fetchLiveOrSynthesizedFlights } = await import("@/lib/api/rapidFlightClient");
        // Touch live API asynchronously
        fetchLiveOrSynthesizedFlights(
          travelers[0].originAirportCode,
          destinations[0].destination.code
        ).catch(() => {});
      } catch (e) {
        // Silent catch for background live telemetry
      }
    }

    return NextResponse.json({
      success: true,
      destinations,
      totalFound: destinations.length,
      travelersCount: travelers.length,
    });
  } catch (error) {
    console.error("POST /api/convergence/search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to compute Pareto convergence across flight graphs.",
      },
      { status: 500 }
    );
  }
}
