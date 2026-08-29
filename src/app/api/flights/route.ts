import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Flight from "@/models/Flight";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();
    const departureDate = searchParams.get("departureDate")?.trim();
    const arrivalDate = searchParams.get("arrivalDate")?.trim();
    const passengersParam = searchParams.get("passengers");
    const type = searchParams.get("type")?.trim();
    const travelClass = searchParams.get("class")?.trim();

    const passengers = passengersParam
      ? Number(passengersParam)
      : 1;

    /*
     * Build MongoDB query dynamically.
     */
    const query: Record<string, unknown> = {};

    // Only show scheduled flights
    query.status = "scheduled";

    // FROM
    if (from) {
      query.$or = [
        {
          origin: {
            $regex: from,
            $options: "i",
          },
        },
        {
          originCode: {
            $regex: `^${escapeRegex(from)}$`,
            $options: "i",
          },
        },
      ];
    }

    // TO
    if (to) {
      const destinationCondition = {
        $or: [
          {
            destination: {
              $regex: to,
              $options: "i",
            },
          },
          {
            destinationCode: {
              $regex: `^${escapeRegex(to)}$`,
              $options: "i",
            },
          },
        ],
      };

      /*
       * If FROM already created an $or,
       * combine both conditions using $and.
       */
      if (query.$or) {
        const existingFrom = query.$or;

        delete query.$or;

        query.$and = [
          { $or: existingFrom as Record<string, unknown>[] },
          destinationCondition,
        ];
      } else {
        query.$or = destinationCondition.$or;
      }
    }

    // DEPARTURE DATE
    if (departureDate) {
      const start = new Date(`${departureDate}T00:00:00.000Z`);
      const end = new Date(`${departureDate}T23:59:59.999Z`);

      query.departureDate = {
        $gte: start,
        $lte: end,
      };
    }

    // ARRIVAL DATE
    if (arrivalDate) {
      const start = new Date(`${arrivalDate}T00:00:00.000Z`);
      const end = new Date(`${arrivalDate}T23:59:59.999Z`);

      query.arrivalDate = {
        $gte: start,
        $lte: end,
      };
    }

    // DOMESTIC / INTERNATIONAL
    if (
      type === "domestic" ||
      type === "international"
    ) {
      query.type = type;
    }

    // ECONOMY / BUSINESS
    if (
      travelClass === "economy" ||
      travelClass === "business"
    ) {
      query.class = travelClass;
    }

    // Enough seats for requested passengers
    if (
      Number.isInteger(passengers) &&
      passengers > 0
    ) {
      query.availableSeats = {
        $gte: passengers,
      };
    }

    const flights = await Flight.find(query)
      .sort({
        departureDate: 1,
        departureTime: 1,
        price: 1,
      })
      .lean();

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

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch flights",
      },
      { status: 500 }
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