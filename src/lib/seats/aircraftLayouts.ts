export interface SeatItem {
  id: string; // e.g. "12A"
  row: number;
  col: string;
  cabin: "business" | "premium_economy" | "economy";
  priceInr: number;
  isOccupied: boolean;
  isExitRow: boolean;
  isWing: boolean;
  legroomInches: number;
  features: string[];
}

export interface AircraftLayout {
  model: string;
  manufacturer: string;
  cabinType: "Narrow-body (Single Aisle)" | "Wide-body (Twin Aisle)";
  totalRows: number;
  aisles: number[]; // column indices where aisles exist
  columns: string[];
  cabinSections: Array<{
    name: string;
    cabin: "business" | "premium_economy" | "economy";
    startRow: number;
    endRow: number;
    layoutDesc: string;
    basePriceInr: number;
  }>;
  wingStartRow: number;
  wingEndRow: number;
  exitRows: number[];
  seats: SeatItem[];
}

// Generate realistic deterministic occupied seats for a flight number
function generateOccupiedSeatIds(flightNumber: string, totalRows: number, cols: string[]): Set<string> {
  const occupied = new Set<string>();
  const seed = (flightNumber || "SS101")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  for (let r = 1; r <= totalRows; r++) {
    for (const c of cols) {
      const hash = (r * 37 + c.charCodeAt(0) * 19 + seed) % 100;
      // Roughly 40-50% seats occupied realistically
      if (hash < 42) {
        occupied.add(`${r}${c}`);
      }
    }
  }

  // Ensure popular rows have a mix
  occupied.delete("1A");
  occupied.delete("1B");
  occupied.delete("2A");
  occupied.delete("2B");
  occupied.delete("3C");
  occupied.delete("4D");
  occupied.delete("14A");
  occupied.delete("14B");
  occupied.delete("14C");
  occupied.delete("15D");
  occupied.delete("15E");
  occupied.delete("15F");
  occupied.delete("22A");
  occupied.delete("22B");

  return occupied;
}

/**
 * Builds authentic aircraft seating structure for Airbus A321neo (3-3 Single Aisle)
 */
export function getAirbusA321neoLayout(flightNumber: string = "AI-204"): AircraftLayout {
  const columns = ["A", "B", "C", "D", "E", "F"];
  const totalRows = 28;
  const exitRows = [14, 15];
  const wingStartRow = 11;
  const wingEndRow = 20;
  const occupiedSet = generateOccupiedSeatIds(flightNumber, totalRows, columns);

  const seats: SeatItem[] = [];

  for (let r = 1; r <= totalRows; r++) {
    const isBusiness = r <= 3;
    const isExit = exitRows.includes(r);
    const isWing = r >= wingStartRow && r <= wingEndRow;

    for (const c of columns) {
      // In business (rows 1-3), seats B and E are typically blocked or 2-2 console
      if (isBusiness && (c === "B" || c === "E")) {
        continue; // 2-2 executive layout
      }

      const id = `${r}${c}`;
      let cabin: SeatItem["cabin"] = "economy";
      let priceInr = 250;
      let legroom = 31;
      const features: string[] = ["USB Fast Charging", "110V AC Power"];

      if (isBusiness) {
        cabin = "business";
        priceInr = 1450;
        legroom = 38;
        features.push("Lie-Flat Recline (150°)", "Priority Meal Service", "Dedicated Overhead Bin");
      } else if (isExit) {
        cabin = "premium_economy";
        priceInr = 750;
        legroom = 36;
        features.push("Extra 5\" Legroom", "Overwing Exit Clearance", "Early Deboarding");
      } else if (r <= 7) {
        priceInr = 450;
        legroom = 32;
        features.push("Forward Cabin", "Speedy Boarding");
      } else if (c === "A" || c === "F") {
        priceInr = 350;
        features.push("Panoramic Window View");
      } else if (c === "C" || c === "D") {
        priceInr = 300;
        features.push("Direct Aisle Access");
      } else {
        priceInr = 150; // Middle seat discount
      }

      seats.push({
        id,
        row: r,
        col: c,
        cabin,
        priceInr,
        isOccupied: occupiedSet.has(id),
        isExitRow: isExit,
        isWing,
        legroomInches: legroom,
        features,
      });
    }
  }

  return {
    model: "A321neo",
    manufacturer: "Airbus",
    cabinType: "Narrow-body (Single Aisle)",
    totalRows,
    aisles: [2], // between col C (idx 2) and col D (idx 3)
    columns,
    cabinSections: [
      {
        name: "Business Class (2-2)",
        cabin: "business",
        startRow: 1,
        endRow: 3,
        layoutDesc: "2-2 Executive Recline",
        basePriceInr: 1450,
      },
      {
        name: "Extra Legroom (Exit Rows)",
        cabin: "premium_economy",
        startRow: 14,
        endRow: 15,
        layoutDesc: "3-3 Overwing Exit (36\" Pitch)",
        basePriceInr: 750,
      },
      {
        name: "Standard Economy",
        cabin: "economy",
        startRow: 4,
        endRow: 28,
        layoutDesc: "3-3 Main Cabin (31\" Pitch)",
        basePriceInr: 250,
      },
    ],
    wingStartRow,
    wingEndRow,
    exitRows,
    seats,
  };
}

/**
 * Builds authentic aircraft seating structure for Boeing 787-9 Dreamliner (3-3-3 Twin Aisle Widebody)
 */
export function getBoeing787Layout(flightNumber: string = "EK-814"): AircraftLayout {
  const columns = ["A", "B", "C", "D", "E", "F", "G", "H", "J"];
  const totalRows = 24;
  const exitRows = [12, 13];
  const wingStartRow = 9;
  const wingEndRow = 17;
  const occupiedSet = generateOccupiedSeatIds(flightNumber, totalRows, columns);

  const seats: SeatItem[] = [];

  for (let r = 1; r <= totalRows; r++) {
    const isBusiness = r <= 4;
    const isExit = exitRows.includes(r);
    const isWing = r >= wingStartRow && r <= wingEndRow;

    for (const c of columns) {
      // In 787 Business (1-2-1), only A, D, G, J exist
      if (isBusiness && (c === "B" || c === "C" || c === "E" || c === "F" || c === "H")) {
        continue;
      }

      const id = `${r}${c}`;
      let cabin: SeatItem["cabin"] = "economy";
      let priceInr = 450;
      let legroom = 32;
      const features: string[] = ["13.3\" 4K In-Flight Touchscreen", "USB-C Fast Charging", "110V Universal Outlet"];

      if (isBusiness) {
        cabin = "business";
        priceInr = 2800;
        legroom = 78; // 180° Full Lie-Flat
        features.push("180° Lie-Flat Bed Suite", "Direct Aisle Access for Every Seat", "Noise-Cancelling Headphones", "Chef On-Demand");
      } else if (isExit) {
        cabin = "premium_economy";
        priceInr = 1100;
        legroom = 38;
        features.push("Extra 6\" Legroom", "Dedicated Overwing Exit", "Priority Boarding");
      } else if (c === "A" || c === "J") {
        priceInr = 550;
        features.push("Electrochromic Dimmable Window");
      } else if (c === "C" || c === "D" || c === "G") {
        priceInr = 500;
        features.push("Direct Aisle Access");
      } else {
        priceInr = 300;
      }

      seats.push({
        id,
        row: r,
        col: c,
        cabin,
        priceInr,
        isOccupied: occupiedSet.has(id),
        isExitRow: isExit,
        isWing,
        legroomInches: legroom,
        features,
      });
    }
  }

  return {
    model: "787-9 Dreamliner",
    manufacturer: "Boeing",
    cabinType: "Wide-body (Twin Aisle)",
    totalRows,
    aisles: [2, 5], // Aisle 1 after col C (idx 2), Aisle 2 after col F (idx 5)
    columns,
    cabinSections: [
      {
        name: "DreamSuite Business Class (1-2-1)",
        cabin: "business",
        startRow: 1,
        endRow: 4,
        layoutDesc: "Full Lie-Flat Direct Aisle Access",
        basePriceInr: 2800,
      },
      {
        name: "Premium Extra Legroom",
        cabin: "premium_economy",
        startRow: 12,
        endRow: 13,
        layoutDesc: "3-3-3 Overwing Exit (38\" Pitch)",
        basePriceInr: 1100,
      },
      {
        name: "Dreamliner Main Cabin",
        cabin: "economy",
        startRow: 5,
        endRow: 24,
        layoutDesc: "3-3-3 Cabin with Dimmable Smart Windows",
        basePriceInr: 450,
      },
    ],
    wingStartRow,
    wingEndRow,
    exitRows,
    seats,
  };
}

/**
 * Returns authentic aircraft layout tailored to the flight characteristics
 */
export function getAircraftLayoutForFlight(flight: any): AircraftLayout {
  const isInternational =
    flight?.type === "international" ||
    (flight?.originCode && flight?.destinationCode && flight.originCode.length === 3 && flight.originCode !== "DEL" && flight.destinationCode !== "BOM" && flight.duration > 240);

  if (isInternational) {
    return getBoeing787Layout(flight?.flightNumber || "EK-814");
  }

  return getAirbusA321neoLayout(flight?.flightNumber || "AI-204");
}
