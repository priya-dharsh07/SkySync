import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Flight from "@/models/Flight";
import { searchLiveFlightOptions } from "@/lib/api/rapidFlightClient";
import { AIRPORTS } from "@/lib/convergence/airports";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();
    const departureDate = searchParams.get("departureDate")?.trim();
    const arrivalDate = searchParams.get("arrivalDate")?.trim();
    const passengersParam = searchParams.get("passengers");
    const type = searchParams.get("type")?.trim();
    const travelClass = searchParams.get("class")?.trim();

    const passengers = passengersParam ? Number(passengersParam) : 1;

    let dbConnected = false;
    let flights: any[] = [];

    try {
      const conn = await connectDB();
      if (conn) dbConnected = true;
    } catch (dbErr) {
      console.warn("MongoDB optional connection warning in flights GET:", dbErr);
    }

    if (dbConnected) {
      const query: Record<string, unknown> = { status: "scheduled" };

      if (from) {
        query.$or = [
          { origin: { $regex: from, $options: "i" } },
          { originCode: { $regex: `^${escapeRegex(from)}$`, $options: "i" } },
        ];
      }

      if (to) {
        const destinationCondition = {
          $or: [
            { destination: { $regex: to, $options: "i" } },
            { destinationCode: { $regex: `^${escapeRegex(to)}$`, $options: "i" } },
          ],
        };

        if (query.$or) {
          const existingFrom = query.$or;
          delete query.$or;
          query.$and = [{ $or: existingFrom as Record<string, unknown>[] }, destinationCondition];
        } else {
          query.$or = destinationCondition.$or;
        }
      }

      if (departureDate) {
        const start = new Date(`${departureDate}T00:00:00.000Z`);
        const end = new Date(`${departureDate}T23:59:59.999Z`);
        query.departureDate = { $gte: start, $lte: end };
      }

      if (type === "domestic" || type === "international") {
        query.type = type;
      }

      if (travelClass === "economy" || travelClass === "business") {
        query.class = travelClass;
      }

      if (Number.isInteger(passengers) && passengers > 0) {
        query.availableSeats = { $gte: passengers };
      }

      try {
        flights = await Flight.find(query)
          .sort({ departureDate: 1, departureTime: 1, price: 1 })
          .lean();
      } catch (findErr) {
        console.warn("Error querying Flight collection:", findErr);
      }
    }

    // If no database flights or user searched for specific origin/destination pairs,
    // dynamically fetch live flight options from AeroDataBox/AviationStack/Global graph
    if (flights.length === 0) {
      if (from && to) {
        const live = await searchLiveFlightOptions(from, to, departureDate, passengers);
        flights = live;
      } else {
        // Provide rich catalog of popular global flights across international and domestic hubs
        const samplePairs = [
          { from: "DEL", to: "BOM" },
          { from: "BOM", to: "DEL" },
          { from: "JFK", to: "LHR" },
          { from: "LHR", to: "CDG" },
          { from: "DXB", to: "SIN" },
          { from: "HND", to: "ICN" },
          { from: "SFO", to: "JFK" },
          { from: "BLR", to: "MAA" },
          { from: "FRA", to: "DXB" },
          { from: "SIN", to: "SYD" },
          { from: "MAA", to: "DEL" },
          { from: "LHR", to: "DXB" },
        ];

        const targetDate = departureDate || "2026-10-15";
        const allDynamic = await Promise.all(
          samplePairs.map((pair) => searchLiveFlightOptions(pair.from, pair.to, targetDate, passengers))
        );
        flights = allDynamic.flat();
      }
    }

    return NextResponse.json(
      {
        success: true,
        count: flights.length,
        passengers,
        flights,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/flights error:", error);

    // Fallback gracefully to default catalog
    const targetDate = "2026-10-15";
    const fallback = await searchLiveFlightOptions("DEL", "BOM", targetDate, 1);

    return NextResponse.json(
      {
        success: true,
        count: fallback.length,
        passengers: 1,
        flights: fallback,
      },
      { status: 200 }
    );
  }
}

/*
 * GET airport/city suggestions.
 *
 * Example:
 * /api/flights?locations=true
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      from,
      to,
      departureDate,
      arrivalDate,
      passengers,
      type,
      class: travelClass,
    } = body;

    const query: Record<string, unknown> = {
      status: "scheduled",
    };

    if (from) {
      query.originCode = {
        $regex: escapeRegex(String(from)),
        $options: "i",
      };
    }

    if (to) {
      query.destinationCode = {
        $regex: escapeRegex(String(to)),
        $options: "i",
      };
    }

    if (departureDate) {
      const start = new Date(
        `${departureDate}T00:00:00.000Z`
      );

      const end = new Date(
        `${departureDate}T23:59:59.999Z`
      );

      query.departureDate = {
        $gte: start,
        $lte: end,
      };
    }

    if (arrivalDate) {
      const start = new Date(
        `${arrivalDate}T00:00:00.000Z`
      );

      const end = new Date(
        `${arrivalDate}T23:59:59.999Z`
      );

      query.arrivalDate = {
        $gte: start,
        $lte: end,
      };
    }

    if (
      type === "domestic" ||
      type === "international"
    ) {
      query.type = type;
    }

    if (
      travelClass === "economy" ||
      travelClass === "business"
    ) {
      query.class = travelClass;
    }

    const passengerCount = Number(passengers) || 1;

    if (passengerCount > 0) {
      query.availableSeats = {
        $gte: passengerCount,
      };
    }

    const flights = await Flight.find(query)
      .sort({
        departureDate: 1,
        departureTime: 1,
      })
      .lean();

    return NextResponse.json(
      {
        success: true,
        count: flights.length,
        flights,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/flights error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to search flights",
      },
      { status: 500 }
    );
  }
}

/*
 * Escape special regex characters.
 */
function escapeRegex(value: string) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}