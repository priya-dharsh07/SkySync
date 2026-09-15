export type VisaStatus =
  | "DOMESTIC"
  | "VISA_FREE"
  | "VISA_ON_ARRIVAL"
  | "E_VISA"
  | "ETA_ESTA"
  | "VISA_REQUIRED";

export interface VisaRequirement {
  status: VisaStatus;
  badgeText: string;
  badgeColor: "emerald" | "blue" | "amber" | "rose" | "purple" | "slate";
  headline: string;
  summary: string;
  passportValidityRequiredMonths: number;
  documentsRequired: string[];
  notes: string[];
  allowedStayDays?: number;
}

// Map airport codes or country names to standardized country codes
export const COUNTRY_CODE_MAP: Record<string, string> = {
  // Codes to Country names
  IND: "India",
  USA: "United States",
  GBR: "United Kingdom",
  SGP: "Singapore",
  JPN: "Japan",
  DEU: "Germany",
  FRA: "France",
  NLD: "Netherlands",
  ESP: "Spain",
  ITA: "Italy",
  CHE: "Switzerland",
  ARE: "United Arab Emirates",
  QAT: "Qatar",
  TUR: "Turkey",
  THA: "Thailand",
  IDN: "Indonesia",
  AUS: "Australia",
  CAN: "Canada",
  KOR: "South Korea",
  HKG: "Hong Kong",
  BRA: "Brazil",
  ZAF: "South Africa",
};

/**
 * Evaluates visa and international entry requirements based on traveler's passport issuing country
 * and flight destination country/airport.
 */
export function checkVisaRequirement(
  passportCountryCode: string,
  destinationCountry: string,
  originCountry?: string
): VisaRequirement {
  const normPassport = (passportCountryCode || "IND").toUpperCase().trim();
  const normDest = (destinationCountry || "").toLowerCase().trim();
  const normOrigin = (originCountry || "").toLowerCase().trim();

  // 1. Domestic Travel
  const isDomestic =
    (normOrigin && normDest && normOrigin === normDest) ||
    (normPassport === "IND" && (normDest.includes("india") || normDest === "ind")) ||
    (normPassport === "USA" && (normDest.includes("united states") || normDest.includes("usa"))) ||
    (normPassport === "GBR" && (normDest.includes("united kingdom") || normDest.includes("uk")));

  if (isDomestic) {
    return {
      status: "DOMESTIC",
      badgeText: "Domestic Flight — No Visa Required",
      badgeColor: "emerald",
      headline: "No Passport or Visa Required",
      summary: "This is a domestic route within the same sovereign territory. Passengers require only a valid government-issued photo ID.",
      passportValidityRequiredMonths: 0,
      documentsRequired: [
        "Government-issued photo ID (Aadhaar / Voter ID / Driver's License / Passport)",
        "Boarding pass (digital or printed)",
      ],
      notes: [
        "No customs clearance or international arrival processing needed.",
        "Ensure the name on your government photo ID matches your booking exactly.",
      ],
    };
  }

  // 2. Destination: United Arab Emirates (Dubai, Abu Dhabi, etc.)
  if (normDest.includes("emirates") || normDest.includes("uae") || normDest.includes("dubai")) {
    if (normPassport === "USA" || normPassport === "GBR" || normPassport === "CAN" || normPassport === "AUS" || normPassport === "JPN" || normPassport === "DEU") {
      return {
        status: "VISA_FREE",
        badgeText: "Visa-Free (30 Days)",
        badgeColor: "emerald",
        headline: "30-Day Visa-Free Entry on Arrival",
        summary: `Holders of ${normPassport} passports do not require advance visa processing for the UAE. An entry stamp valid for 30 days is granted at Dubai/Abu Dhabi immigration.`,
        passportValidityRequiredMonths: 6,
        allowedStayDays: 30,
        documentsRequired: [
          "Passport with minimum 6 months remaining validity",
          "Confirmed return or onward flight ticket",
          "Proof of hotel accommodation / host address in UAE",
        ],
        notes: [
          "Free 30-day visa stamp issued upon arrival at passport control.",
          "Passport must be in pristine condition with at least 2 blank pages.",
        ],
      };
    }

    if (normPassport === "IND") {
      return {
        status: "E_VISA",
        badgeText: "eVisa / Visa on Arrival Eligible",
        badgeColor: "blue",
        headline: "UAE Tourist eVisa Required Prior to Boarding",
        summary: "Indian passport holders require a pre-approved UAE Tourist eVisa (30/60 days), OR are eligible for Visa on Arrival if holding a valid US Visitor Visa (B1/B2), Green Card, or UK/EU Residence Permit.",
        passportValidityRequiredMonths: 6,
        allowedStayDays: 30,
        documentsRequired: [
          "Valid Passport (6+ months validity from arrival date)",
          "Pre-approved UAE tourist eVisa (or valid US/UK/EU visa for on-arrival eligibility)",
          "Confirmed return flight ticket",
          "Proof of hotel accommodation in UAE",
          "Sufficient financial means (min. AED 3,000 or credit card)",
        ],
        notes: [
          "Air carriers perform OK-TO-BOARD verification during check-in.",
          "eVisa processing typically takes 24 to 72 hours online.",
        ],
      };
    }
  }

  // 3. Destination: Singapore
  if (normDest.includes("singapore")) {
    if (normPassport === "USA" || normPassport === "GBR" || normPassport === "AUS" || normPassport === "CAN" || normPassport === "DEU" || normPassport === "JPN") {
      return {
        status: "VISA_FREE",
        badgeText: "Visa-Free (30-90 Days)",
        badgeColor: "emerald",
        headline: "Visa-Free Entry with SG Arrival Card",
        summary: "Eligible for visa-exempt social visits. Must submit the free digital SG Arrival Card within 3 days prior to arrival in Singapore.",
        passportValidityRequiredMonths: 6,
        allowedStayDays: 90,
        documentsRequired: [
          "Passport valid for at least 6 months",
          "Completed SG Arrival Card with electronic health declaration",
          "Confirmed onward or return ticket",
        ],
        notes: ["Electronic SG Arrival Card submission is mandatory before boarding."],
      };
    }

    if (normPassport === "IND") {
      return {
        status: "E_VISA",
        badgeText: "eVisa Required",
        badgeColor: "amber",
        headline: "Singapore Entry eVisa Required",
        summary: "Indian nationals require an authorized Singapore eVisa applied via an ICA-authorized strategic partner or local Singapore contact prior to departure.",
        passportValidityRequiredMonths: 6,
        allowedStayDays: 30,
        documentsRequired: [
          "Passport with 6+ months validity",
          "Printed Singapore eVisa approval",
          "Digital SG Arrival Card submission",
          "Confirmed return flight booking",
        ],
        notes: ["Visa-Free Transit Facility (VFTF) 96 hours available if holding valid US/UK/EU/AUS/JPN visa."],
      };
    }
  }

  // 4. Destination: Thailand
  if (normDest.includes("thailand") || normDest.includes("bangkok") || normDest.includes("phuket")) {
    if (normPassport === "IND" || normPassport === "USA" || normPassport === "GBR" || normPassport === "DEU" || normPassport === "AUS") {
      return {
        status: "VISA_FREE",
        badgeText: "Visa Exemption (60 Days)",
        badgeColor: "emerald",
        headline: "60-Day Visa Exemption Scheme Active",
        summary: `Thailand allows ${normPassport} passport holders visa-free entry for tourism under the current bilateral visa exemption scheme for stays up to 60 days.`,
        passportValidityRequiredMonths: 6,
        allowedStayDays: 60,
        documentsRequired: [
          "Passport with 6 months validity",
          "Confirmed return ticket within 60 days",
          "Proof of accommodation in Thailand",
          "Proof of 20,000 THB (or equivalent in USD/INR) per person",
        ],
        notes: ["No advance visa fees required at immigration counters."],
      };
    }
  }

  // 5. Destination: United States
  if (normDest.includes("united states") || normDest.includes("usa") || normDest.includes("america")) {
    if (normPassport === "GBR" || normPassport === "DEU" || normPassport === "FRA" || normPassport === "JPN" || normPassport === "SGP" || normPassport === "AUS") {
      return {
        status: "ETA_ESTA",
        badgeText: "ESTA Authorization Required",
        badgeColor: "purple",
        headline: "U.S. Visa Waiver Program (ESTA)",
        summary: "Eligible for travel under the Visa Waiver Program with an approved Electronic System for Travel Authorization (ESTA).",
        passportValidityRequiredMonths: 6,
        allowedStayDays: 90,
        documentsRequired: [
          "Biometric e-Passport",
          "Approved ESTA clearance prior to boarding",
          "Confirmed round-trip ticket on participating carrier",
        ],
        notes: ["Apply for ESTA at least 72 hours prior to flight departure."],
      };
    }

    if (normPassport === "IND") {
      return {
        status: "VISA_REQUIRED",
        badgeText: "Consular Visa Required (B1/B2)",
        badgeColor: "rose",
        headline: "Strict U.S. Non-Immigrant Visa Required",
        summary: "Indian passport holders must hold a valid physical U.S. B1/B2 Visitor Visa stamped in their passport prior to airline check-in.",
        passportValidityRequiredMonths: 6,
        allowedStayDays: 180,
        documentsRequired: [
          "Passport valid for travel to the U.S.",
          "Valid U.S. B1/B2 or appropriate visa stamp",
          "Proof of purpose of travel and return ticket",
        ],
        notes: [
          "Airlines verify physical visa with U.S. Customs and Border Protection (CBP) system during check-in.",
        ],
      };
    }
  }

  // 6. Destination: United Kingdom
  if (normDest.includes("united kingdom") || normDest.includes("london") || normDest.includes("uk")) {
    if (normPassport === "USA" || normPassport === "CAN" || normPassport === "AUS" || normPassport === "JPN" || normPassport === "SGP") {
      return {
        status: "VISA_FREE",
        badgeText: "Visa-Free (6 Months)",
        badgeColor: "emerald",
        headline: "Visa-Free Standard Visitor Status",
        summary: "Travelers can enter the UK as standard visitors without advance visa application for tourism or business meetings up to 6 months.",
        passportValidityRequiredMonths: 6,
        allowedStayDays: 180,
        documentsRequired: [
          "Valid passport for the duration of stay",
          "Return ticket",
          "Proof of sufficient funds",
        ],
        notes: ["Eligible for automatic ePassport gates at Heathrow, Gatwick, and London airports."],
      };
    }

    if (normPassport === "IND") {
      return {
        status: "VISA_REQUIRED",
        badgeText: "Standard Visitor Visa Required",
        badgeColor: "rose",
        headline: "UK Standard Visitor Visa Required",
        summary: "Indian citizens must apply and hold an approved UK Standard Visitor Visa with biometrics completed prior to departure.",
        passportValidityRequiredMonths: 6,
        allowedStayDays: 180,
        documentsRequired: [
          "Valid passport with UK visa vignette",
          "Confirmed travel itinerary and return flight",
          "Proof of accommodation and financial support",
        ],
        notes: ["Transit without visa (TWOV) may apply under specific strict conditions."],
      };
    }
  }

  // 7. Destination: Schengen Area / European Union (France, Germany, Netherlands, Italy, Spain)
  if (
    normDest.includes("france") ||
    normDest.includes("germany") ||
    normDest.includes("netherlands") ||
    normDest.includes("spain") ||
    normDest.includes("italy") ||
    normDest.includes("switzerland") ||
    normDest.includes("europe")
  ) {
    if (normPassport === "USA" || normPassport === "GBR" || normPassport === "CAN" || normPassport === "AUS" || normPassport === "JPN" || normPassport === "SGP") {
      return {
        status: "VISA_FREE",
        badgeText: "Schengen Visa-Exempt (90 Days)",
        badgeColor: "emerald",
        headline: "90-Day Visa-Free Schengen Entry",
        summary: "Enjoy 90 days of visa-free travel within any 180-day period across all Schengen European member states.",
        passportValidityRequiredMonths: 3,
        allowedStayDays: 90,
        documentsRequired: [
          "Passport valid for at least 3 months beyond intended departure from Schengen",
          "Travel medical insurance covering minimum €30,000",
          "Confirmed return/onward transport booking",
        ],
        notes: ["Passport must have been issued within the previous 10 years."],
      };
    }

    if (normPassport === "IND") {
      return {
        status: "VISA_REQUIRED",
        badgeText: "Schengen Visa (Type C) Required",
        badgeColor: "rose",
        headline: "Uniform Schengen Short-Stay Visa Required",
        summary: "Indian passport holders require an approved Schengen Visa (Type C) from the consulate of the main destination country prior to boarding.",
        passportValidityRequiredMonths: 6,
        allowedStayDays: 90,
        documentsRequired: [
          "Valid passport with affixed Schengen Visa",
          "Travel Medical Insurance (minimum €30,000 coverage)",
          "Flight reservation and proof of accommodation",
          "Proof of financial solvency",
        ],
        notes: ["Must apply through VFS Global / consular embassy at least 15 days in advance."],
      };
    }
  }

  // 8. Destination: Japan
  if (normDest.includes("japan") || normDest.includes("tokyo")) {
    if (normPassport === "USA" || normPassport === "GBR" || normPassport === "CAN" || normPassport === "AUS" || normPassport === "DEU" || normPassport === "SGP") {
      return {
        status: "VISA_FREE",
        badgeText: "Visa-Free (90 Days)",
        badgeColor: "emerald",
        headline: "Visa Exemption for Temporary Visitors",
        summary: "Visa exemption allows stay of up to 90 days for sightseeing, business, and visiting friends/relatives.",
        passportValidityRequiredMonths: 6,
        allowedStayDays: 90,
        documentsRequired: [
          "Passport valid for the period of stay",
          "Visit Japan Web digital customs/immigration QR code",
          "Return flight ticket",
        ],
        notes: ["Register on Visit Japan Web service for fast-track immigration."],
      };
    }

    if (normPassport === "IND") {
      return {
        status: "E_VISA",
        badgeText: "Japan eVisa Available",
        badgeColor: "blue",
        headline: "Electronic Visa (eVisa) for Tourism",
        summary: "Indian passport holders residing in India or eligible countries can apply online for a single-entry Japan Tourist eVisa for up to 90 days.",
        passportValidityRequiredMonths: 6,
        allowedStayDays: 90,
        documentsRequired: [
          "Passport valid for 6+ months",
          "Digital Japan eVisa Issuance Display page (via browser, screenshots not accepted)",
          "Confirmed return airline ticket",
        ],
        notes: ["eVisa verification requires live smartphone internet connection at airport."],
      };
    }
  }

  // Generic fallback for any other international destination
  return {
    status: "VISA_REQUIRED",
    badgeText: "International Travel Document Verification Required",
    badgeColor: "amber",
    headline: "Verify Visa & Consular Entry Regulations",
    summary: `Travel between ${normPassport} and ${destinationCountry || "international destination"} requires valid travel authorization, passport validation, and customs clearance.`,
    passportValidityRequiredMonths: 6,
    documentsRequired: [
      "Passport with at least 6 months validity from departure date",
      "Valid Entry Visa / Permit for destination country",
      "Confirmed onward or return ticket",
      "Proof of funds and lodging arrangements",
    ],
    notes: [
      "Always check with the destination embassy or IATA Timatic system before departure.",
    ],
  };
}
