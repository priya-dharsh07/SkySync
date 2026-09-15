import { Airport, getAirportByCode, haversineDistance } from "./airports";

export interface FlightLeg {
  id: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
  aircraft: string;
  origin: Airport;
  destination: Airport;
  departureTimeUtc: string; // ISO string
  arrivalTimeUtc: string;   // ISO string
  departureLocal: string;    // "14:30"
  arrivalLocal: string;      // "18:45"
  departureDate: string;     // "YYYY-MM-DD"
  arrivalDate: string;       // "YYYY-MM-DD"
  durationMinutes: number;
  priceUsd: number;
  availableSeats: number;
  cabinClass: "economy" | "premium_economy" | "business";
}

const AIRLINES = [
  { code: "SQ", name: "Singapore Airlines", aircraft: "Airbus A350-900" },
  { code: "EK", name: "Emirates", aircraft: "Boeing 777-300ER" },
  { code: "BA", name: "British Airways", aircraft: "Boeing 787-9 Dreamliner" },
  { code: "LH", name: "Lufthansa", aircraft: "Airbus A350-900" },
  { code: "DL", name: "Delta Air Lines", aircraft: "Airbus A330-900neo" },
  { code: "NH", name: "All Nippon Airways", aircraft: "Boeing 787-8" },
  { code: "QR", name: "Qatar Airways", aircraft: "Airbus A350-1000" },
  { code: "AI", name: "Air India", aircraft: "Boeing 787-8 Dreamliner" },
  { code: "QF", name: "Qantas", aircraft: "Boeing 787-9" },
  { code: "AF", name: "Air France", aircraft: "Boeing 777-200ER" },
];

/**
 * Generates realistic scheduled flights between origin and destination for a target date
 */
export function generateFlightOptions(
  originCode: string,
  destinationCode: string,
  targetDate: string // "YYYY-MM-DD"
): FlightLeg[] {
  const origin = getAirportByCode(originCode);
  const destination = getAirportByCode(destinationCode);

  if (!origin || !destination || origin.code === destination.code) {
    return [];
  }

  const distanceKm = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  
  // Cruising speed ~820 km/h + 35 min buffer for taxi and climb/descent
  const flightDurationMinutes = Math.max(50, Math.round((distanceKm / 820) * 60 + 35));

  // Determine pricing based on distance, regional vs long haul, and random realistic variance
  // Long haul base ~ $0.07-$0.12 per km
  const baseRatePerKm = distanceKm < 1500 ? 0.12 : distanceKm < 5000 ? 0.085 : 0.065;
  const basePriceUsd = Math.max(95, Math.round(distanceKm * baseRatePerKm));

  // Generate 3 daily flight slots (morning, afternoon, evening)
  const departureSlots = [
    { hour: 8, minute: 15, airlineIdx: (origin.code.charCodeAt(0) + destination.code.charCodeAt(0)) % AIRLINES.length },
    { hour: 13, minute: 45, airlineIdx: (origin.code.charCodeAt(1) + 2) % AIRLINES.length },
    { hour: 20, minute: 30, airlineIdx: (destination.code.charCodeAt(0) + 4) % AIRLINES.length },
  ];

  return departureSlots.map((slot, idx) => {
    const airline = AIRLINES[slot.airlineIdx];
    const flightNum = `${airline.code}-${100 + ((slot.hour * 31 + idx * 47) % 899)}`;

    // Build UTC timestamps
    // Target date in origin local time -> convert to UTC
    const depLocalHour = slot.hour;
    const depLocalMin = slot.minute;
    
    // Construct local departure date time
    const depYear = parseInt(targetDate.split("-")[0] || "2026", 10);
    const depMonth = parseInt(targetDate.split("-")[1] || "09", 10) - 1;
    const depDay = parseInt(targetDate.split("-")[2] || "15", 10);

    // Calculate UTC departure
    const depUtcMs = Date.UTC(depYear, depMonth, depDay, depLocalHour, depLocalMin) - (origin.timezoneOffset * 3600 * 1000);
    const arrUtcMs = depUtcMs + (flightDurationMinutes * 60 * 1000);

    const depUtcDate = new Date(depUtcMs);
    const arrUtcDate = new Date(arrUtcMs);

    // Destination local time
    const arrLocalMs = arrUtcMs + (destination.timezoneOffset * 3600 * 1000);
    const arrLocalDate = new Date(arrLocalMs);

    const formatTime = (d: Date) => 
      `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
    
    const formatDate = (d: Date) => 
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

    // Variance for different times of day (peak evening / morning slight bump)
    const timeMultiplier = idx === 1 ? 1.0 : idx === 0 ? 1.08 : 0.94;
    const finalPrice = Math.round(basePriceUsd * timeMultiplier);

    // Available seats realistic inventory
    const seed = (origin.code.charCodeAt(0) + slot.hour * 7 + idx * 13) % 18;
    const availableSeats = 4 + (seed % 14); // Between 4 and 17 seats available

    return {
      id: `fl-${origin.code}-${destination.code}-${targetDate}-${idx}`,
      flightNumber: flightNum,
      airline: airline.name,
      airlineCode: airline.code,
      aircraft: airline.aircraft,
      origin,
      destination,
      departureTimeUtc: depUtcDate.toISOString(),
      arrivalTimeUtc: arrUtcDate.toISOString(),
      departureLocal: `${String(depLocalHour).padStart(2, "0")}:${String(depLocalMin).padStart(2, "0")}`,
      arrivalLocal: formatTime(arrLocalDate),
      departureDate: targetDate,
      arrivalDate: formatDate(arrLocalDate),
      durationMinutes: flightDurationMinutes,
      priceUsd: finalPrice,
      availableSeats,
      cabinClass: "economy",
    };
  });
}
