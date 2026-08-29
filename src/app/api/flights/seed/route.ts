import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Flight from "@/models/Flight";

const airlines = [
  {
    name: "IndiGo",
    code: "6E",
  },
  {
    name: "Air India",
    code: "AI",
  },
  {
    name: "Air India Express",
    code: "IX",
  },
  {
    name: "Akasa Air",
    code: "QP",
  },
  {
    name: "Vistara",
    code: "UK",
  },
  {
    name: "SpiceJet",
    code: "SG",
  },
];

const domesticRoutes = [
  ["Delhi", "Mumbai", "DEL", "BOM"],
  ["Mumbai", "Delhi", "BOM", "DEL"],
  ["Delhi", "Bengaluru", "DEL", "BLR"],
  ["Bengaluru", "Delhi", "BLR", "DEL"],
  ["Delhi", "Chennai", "DEL", "MAA"],
  ["Chennai", "Delhi", "MAA", "DEL"],
  ["Delhi", "Hyderabad", "DEL", "HYD"],
  ["Hyderabad", "Delhi", "HYD", "DEL"],
  ["Delhi", "Kolkata", "DEL", "CCU"],
  ["Kolkata", "Delhi", "CCU", "DEL"],

  ["Mumbai", "Bengaluru", "BOM", "BLR"],
  ["Bengaluru", "Mumbai", "BLR", "BOM"],
  ["Mumbai", "Chennai", "BOM", "MAA"],
  ["Chennai", "Mumbai", "MAA", "BOM"],
  ["Mumbai", "Hyderabad", "BOM", "HYD"],
  ["Hyderabad", "Mumbai", "HYD", "BOM"],
  ["Mumbai", "Kolkata", "BOM", "CCU"],
  ["Kolkata", "Mumbai", "CCU", "BOM"],

  ["Bengaluru", "Chennai", "BLR", "MAA"],
  ["Chennai", "Bengaluru", "MAA", "BLR"],
  ["Bengaluru", "Hyderabad", "BLR", "HYD"],
  ["Hyderabad", "Bengaluru", "HYD", "BLR"],
  ["Bengaluru", "Kolkata", "BLR", "CCU"],
  ["Kolkata", "Bengaluru", "CCU", "BLR"],

  ["Chennai", "Hyderabad", "MAA", "HYD"],
  ["Hyderabad", "Chennai", "HYD", "MAA"],
  ["Chennai", "Kolkata", "MAA", "CCU"],
  ["Kolkata", "Chennai", "CCU", "MAA"],

  ["Delhi", "Goa", "DEL", "GOI"],
  ["Goa", "Delhi", "GOI", "DEL"],
  ["Mumbai", "Goa", "BOM", "GOI"],
  ["Goa", "Mumbai", "GOI", "BOM"],

  ["Delhi", "Ahmedabad", "DEL", "AMD"],
  ["Ahmedabad", "Delhi", "AMD", "DEL"],
  ["Mumbai", "Ahmedabad", "BOM", "AMD"],
  ["Ahmedabad", "Mumbai", "AMD", "BOM"],

  ["Delhi", "Jaipur", "DEL", "JAI"],
  ["Jaipur", "Delhi", "JAI", "DEL"],

  ["Delhi", "Lucknow", "DEL", "LKO"],
  ["Lucknow", "Delhi", "LKO", "DEL"],

  ["Delhi", "Pune", "DEL", "PNQ"],
  ["Pune", "Delhi", "PNQ", "DEL"],

  ["Mumbai", "Pune", "BOM", "PNQ"],
  ["Pune", "Mumbai", "PNQ", "BOM"],

  ["Chennai", "Pune", "MAA", "PNQ"],
  ["Pune", "Chennai", "PNQ", "MAA"],

  ["Hyderabad", "Kolkata", "HYD", "CCU"],
  ["Kolkata", "Hyderabad", "CCU", "HYD"],

  ["Bengaluru", "Goa", "BLR", "GOI"],
  ["Goa", "Bengaluru", "GOI", "BLR"],

  ["Chennai", "Goa", "MAA", "GOI"],
  ["Goa", "Chennai", "GOI", "MAA"],
];

const internationalRoutes = [
  ["Delhi", "Dubai", "DEL", "DXB"],
  ["Dubai", "Delhi", "DXB", "DEL"],

  ["Mumbai", "Dubai", "BOM", "DXB"],
  ["Dubai", "Mumbai", "DXB", "BOM"],

  ["Chennai", "Dubai", "MAA", "DXB"],
  ["Dubai", "Chennai", "DXB", "MAA"],

  ["Bengaluru", "Dubai", "BLR", "DXB"],
  ["Dubai", "Bengaluru", "DXB", "BLR"],

  ["Delhi", "Singapore", "DEL", "SIN"],
  ["Singapore", "Delhi", "SIN", "DEL"],

  ["Mumbai", "Singapore", "BOM", "SIN"],
  ["Singapore", "Mumbai", "SIN", "BOM"],

  ["Chennai", "Singapore", "MAA", "SIN"],
  ["Singapore", "Chennai", "SIN", "MAA"],

  ["Bengaluru", "Singapore", "BLR", "SIN"],
  ["Singapore", "Bengaluru", "SIN", "BLR"],

  ["Delhi", "London", "DEL", "LHR"],
  ["London", "Delhi", "LHR", "DEL"],

  ["Mumbai", "London", "BOM", "LHR"],
  ["London", "Mumbai", "LHR", "BOM"],

  ["Delhi", "New York", "DEL", "JFK"],
  ["New York", "Delhi", "JFK", "DEL"],

  ["Mumbai", "New York", "BOM", "JFK"],
  ["New York", "Mumbai", "JFK", "BOM"],

  ["Delhi", "Paris", "DEL", "CDG"],
  ["Paris", "Delhi", "CDG", "DEL"],

  ["Mumbai", "Paris", "BOM", "CDG"],
  ["Paris", "Mumbai", "CDG", "BOM"],

  ["Delhi", "Frankfurt", "DEL", "FRA"],
  ["Frankfurt", "Delhi", "FRA", "DEL"],

  ["Mumbai", "Frankfurt", "BOM", "FRA"],
  ["Frankfurt", "Mumbai", "FRA", "BOM"],

  ["Delhi", "Bangkok", "DEL", "BKK"],
  ["Bangkok", "Delhi", "BKK", "DEL"],

  ["Mumbai", "Bangkok", "BOM", "BKK"],
  ["Bangkok", "Mumbai", "BKK", "BOM"],

  ["Chennai", "Bangkok", "MAA", "BKK"],
  ["Bangkok", "Chennai", "BKK", "MAA"],

  ["Delhi", "Kuala Lumpur", "DEL", "KUL"],
  ["Kuala Lumpur", "Delhi", "KUL", "DEL"],

  ["Mumbai", "Kuala Lumpur", "BOM", "KUL"],
  ["Kuala Lumpur", "Mumbai", "KUL", "BOM"],

  ["Chennai", "Kuala Lumpur", "MAA", "KUL"],
  ["Kuala Lumpur", "Chennai", "KUL", "MAA"],

  ["Delhi", "Doha", "DEL", "DOH"],
  ["Doha", "Delhi", "DOH", "DEL"],

  ["Mumbai", "Doha", "BOM", "DOH"],
  ["Doha", "Mumbai", "DOH", "BOM"],

  ["Delhi", "Abu Dhabi", "DEL", "AUH"],
  ["Abu Dhabi", "Delhi", "AUH", "DEL"],

  ["Mumbai", "Abu Dhabi", "BOM", "AUH"],
  ["Abu Dhabi", "Mumbai", "AUH", "BOM"],

  ["Delhi", "Colombo", "DEL", "CMB"],
  ["Colombo", "Delhi", "CMB", "DEL"],

  ["Chennai", "Colombo", "MAA", "CMB"],
  ["Colombo", "Chennai", "CMB", "MAA"],

  ["Bengaluru", "Colombo", "BLR", "CMB"],
  ["Colombo", "Bengaluru", "CMB", "BLR"],

  ["Delhi", "Kathmandu", "DEL", "KTM"],
  ["Kathmandu", "Delhi", "KTM", "DEL"],

  ["Mumbai", "Kathmandu", "BOM", "KTM"],
  ["Kathmandu", "Mumbai", "KTM", "BOM"],

  ["Delhi", "Tokyo", "DEL", "NRT"],
  ["Tokyo", "Delhi", "NRT", "DEL"],

  ["Mumbai", "Tokyo", "BOM", "NRT"],
  ["Tokyo", "Mumbai", "NRT", "BOM"],

  ["Delhi", "Toronto", "DEL", "YYZ"],
  ["Toronto", "Delhi", "YYZ", "DEL"],

  ["Delhi", "Sydney", "DEL", "SYD"],
  ["Sydney", "Delhi", "SYD", "DEL"],

  ["Mumbai", "Sydney", "BOM", "SYD"],
  ["Sydney", "Mumbai", "SYD", "BOM"],

  ["Delhi", "Melbourne", "DEL", "MEL"],
  ["Melbourne", "Delhi", "MEL", "DEL"],

  ["Mumbai", "Melbourne", "BOM", "MEL"],
  ["Melbourne", "Mumbai", "MEL", "BOM"],
];

function generateFlightNumber(
  airlineCode: string,
  index: number
): string {
  return `${airlineCode}${100 + index}`;
}

function generateTime(index: number) {
  const departureHour = 5 + (index * 3) % 17;
  const departureMinute = index % 2 === 0 ? 0 : 30;

  const durationMinutes =
    90 + ((index * 37) % 480);

  const departureMinutes =
    departureHour * 60 + departureMinute;

  const arrivalMinutes =
    departureMinutes + durationMinutes;

  const arrivalHour =
    Math.floor(arrivalMinutes / 60) % 24;

  const arrivalMinute =
    arrivalMinutes % 60;

  const format = (hour: number, minute: number) =>
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return {
    departureTime: format(departureHour, departureMinute),
    arrivalTime: format(arrivalHour, arrivalMinute),
    duration: durationMinutes,
  };
}

function generateDate(index: number) {
  const date = new Date();

  date.setDate(
    date.getDate() + 1 + (index % 30)
  );

  return date;
}

export async function POST() {
  try {
    await connectDB();

    // Remove old seed data
    await Flight.deleteMany({});

    const flights: any[] = [];

    const allRoutes = [
      ...domesticRoutes.map((route) => ({
        route,
        type: "domestic",
      })),
      ...internationalRoutes.map((route) => ({
        route,
        type: "international",
      })),
    ];

    // Generate 200 flights
    for (let i = 0; i < 200; i++) {
      const routeData =
        allRoutes[i % allRoutes.length];

      const [
        origin,
        destination,
        originCode,
        destinationCode,
      ] = routeData.route;

      const airline =
        airlines[i % airlines.length];

      const times = generateTime(i);

      const isInternational =
        routeData.type === "international";

      const basePrice = isInternational
        ? 18000
        : 3500;

      const priceVariation =
        (i % 12) * (isInternational ? 1200 : 350);

      const price =
        basePrice + priceVariation;

      const seats =
        80 + (i % 141);

      flights.push({
        airline: airline.name,
        airlineCode: airline.code,

        flightNumber: generateFlightNumber(
          airline.code,
          i + 1
        ),

        origin,
        destination,

        originCode,
        destinationCode,

        departureDate: generateDate(i),

        departureTime:
          times.departureTime,

        arrivalTime:
          times.arrivalTime,

        duration: times.duration,

        price,

        availableSeats: seats,

        totalSeats: 180,

        class: "Economy",

        type: routeData.type,

        status: "scheduled",
      });
    }

    await Flight.insertMany(flights);

    return NextResponse.json(
      {
        success: true,
        message: "200 flights seeded successfully",
        count: flights.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Flight seed error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed flights",
      },
      { status: 500 }
    );
  }
}