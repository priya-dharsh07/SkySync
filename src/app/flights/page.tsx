"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Plane,
  Search,
  Users,
  MapPin,
  SlidersHorizontal,
  Minus,
  Plus,
} from "lucide-react";

type Flight = {
  _id: string;

  airline: string;
  airlineCode: string;
  flightNumber: string;

  origin: string;
  destination: string;

  originCode: string;
  destinationCode: string;

  departureDate: string;
  arrivalDate?: string;

  departureTime: string;
  arrivalTime: string;

  duration: number;

  price: number;

  availableSeats: number;
  totalSeats: number;

  class?: string;

  type: "domestic" | "international";

  status: "scheduled" | "delayed" | "cancelled";
};

type Airport = {
  code: string;
  city: string;
};

export default function FlightsPage() {
  const [flights, setFlights] = useState<Flight[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * =========================================================
   * CURRENT SEARCH INPUTS
   * =========================================================
   */

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  /*
   * =========================================================
   * ACTUAL SEARCH VALUES
   *
   * These only change when the user clicks Search.
   * This is what makes the Search button actually work.
   * =========================================================
   */

  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDepartureDate, setSearchDepartureDate] =
    useState("");
  const [searchPassengers, setSearchPassengers] = useState(1);

  const [searchPerformed, setSearchPerformed] =
    useState(false);

  /*
   * =========================================================
   * OTHER FILTERS
   * =========================================================
   */

  const [tripType, setTripType] = useState<
    "all" | "domestic" | "international"
  >("all");

  const [sortBy, setSortBy] = useState<
    "price" | "duration" | "departure"
  >("price");

  /*
   * =========================================================
   * AUTOCOMPLETE
   * =========================================================
   */

  const [showFromSuggestions, setShowFromSuggestions] =
    useState(false);

  const [showToSuggestions, setShowToSuggestions] =
    useState(false);

  /*
   * =========================================================
   * FETCH FLIGHTS
   * =========================================================
   */

  useEffect(() => {
    fetchFlights();
  }, []);

  async function fetchFlights() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/flights", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch flights");
      }

      const data = await response.json();

      setFlights(data.flights || data || []);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load flights. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =========================================================
   * UNIQUE AIRPORTS / CITIES
   * =========================================================
   */

  const origins = useMemo(() => {
    const map = new Map<string, Airport>();

    flights.forEach((flight) => {
      map.set(flight.originCode, {
        code: flight.originCode,
        city: flight.origin,
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.city.localeCompare(b.city)
    );
  }, [flights]);

  const destinations = useMemo(() => {
    const map = new Map<string, Airport>();

    flights.forEach((flight) => {
      map.set(flight.destinationCode, {
        code: flight.destinationCode,
        city: flight.destination,
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.city.localeCompare(b.city)
    );
  }, [flights]);

  /*
   * =========================================================
   * AUTOCOMPLETE - FROM
   * =========================================================
   */

  const filteredOrigins = useMemo(() => {
    const query = from.trim().toLowerCase();

    if (!query) {
      return origins.slice(0, 8);
    }

    return origins
      .filter(
        (airport) =>
          airport.city
            .toLowerCase()
            .includes(query) ||
          airport.code
            .toLowerCase()
            .includes(query)
      )
      .slice(0, 8);
  }, [origins, from]);

  /*
   * =========================================================
   * AUTOCOMPLETE - TO
   * =========================================================
   */

  const filteredDestinations = useMemo(() => {
    const query = to.trim().toLowerCase();

    if (!query) {
      return destinations.slice(0, 8);
    }

    return destinations
      .filter(
        (airport) =>
          airport.city
            .toLowerCase()
            .includes(query) ||
          airport.code
            .toLowerCase()
            .includes(query)
      )
      .slice(0, 8);
  }, [destinations, to]);

  /*
   * =========================================================
   * AVAILABLE DATES
   * =========================================================
   */

  const availableDates = useMemo(() => {
    const dates = new Set<string>();

    flights.forEach((flight) => {
      if (flight.departureDate) {
        const date = new Date(
          flight.departureDate
        )
          .toISOString()
          .split("T")[0];

        dates.add(date);
      }
    });

    return Array.from(dates).sort();
  }, [flights]);

  /*
   * =========================================================
   * SEARCH
   * =========================================================
   *
   * IMPORTANT:
   * The values entered by the user are copied into the
   * search state only when Search is clicked.
   */

  function handleSearch(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const normalizedFrom = from.trim();
    const normalizedTo = to.trim();

    /*
     * If the user typed a city name, convert it to the
     * corresponding airport code.
     */

    const matchedOrigin = origins.find(
      (airport) =>
        airport.code.toLowerCase() ===
          normalizedFrom.toLowerCase() ||
        airport.city.toLowerCase() ===
          normalizedFrom.toLowerCase()
    );

    const matchedDestination = destinations.find(
      (airport) =>
        airport.code.toLowerCase() ===
          normalizedTo.toLowerCase() ||
        airport.city.toLowerCase() ===
          normalizedTo.toLowerCase()
    );

    const finalFrom =
      matchedOrigin?.code || normalizedFrom;

    const finalTo =
      matchedDestination?.code || normalizedTo;

    /*
     * Update actual search values.
     */

    setSearchFrom(finalFrom);
    setSearchTo(finalTo);
    setSearchDepartureDate(departureDate);
    setSearchPassengers(passengers);

    /*
     * Mark that a search has been performed.
     */

    setSearchPerformed(true);

    /*
     * Close suggestions.
     */

    setShowFromSuggestions(false);
    setShowToSuggestions(false);
  }

  /*
   * =========================================================
   * SELECT AUTOCOMPLETE ORIGIN
   * =========================================================
   */

  function selectOrigin(airport: Airport) {
    setFrom(airport.code);

    setShowFromSuggestions(false);

    setSearchPerformed(false);
  }

  /*
   * =========================================================
   * SELECT AUTOCOMPLETE DESTINATION
   * =========================================================
   */

  function selectDestination(airport: Airport) {
    setTo(airport.code);

    setShowToSuggestions(false);

    setSearchPerformed(false);
  }

  /*
   * =========================================================
   * FILTER FLIGHTS
   * =========================================================
   *
   * Before Search:
   *     Show all flights.
   *
   * After Search:
   *     Use searchFrom/searchTo/searchDepartureDate/
   *     searchPassengers.
   *
   * This is the important fix for the Search button.
   */

  const filteredFlights = useMemo(() => {
    let result = [...flights];

    /*
     * ---------------------------------------------------------
     * SEARCH FILTERS
     * ---------------------------------------------------------
     */

    if (searchPerformed) {
      /*
       * FROM
       */

      if (searchFrom) {
        const search =
          searchFrom.trim().toLowerCase();

        result = result.filter(
          (flight) =>
            flight.originCode
              .toLowerCase() === search ||
            flight.origin
              .toLowerCase() === search
        );
      }

      /*
       * TO
       */

      if (searchTo) {
        const search =
          searchTo.trim().toLowerCase();

        result = result.filter(
          (flight) =>
            flight.destinationCode
              .toLowerCase() === search ||
            flight.destination
              .toLowerCase() === search
        );
      }

      /*
       * DEPARTURE DATE
       */

      if (searchDepartureDate) {
        result = result.filter((flight) => {
          const flightDate = new Date(
            flight.departureDate
          )
            .toISOString()
            .split("T")[0];

          return (
            flightDate === searchDepartureDate
          );
        });
      }

      /*
       * PASSENGER AVAILABILITY
       */

      result = result.filter(
        (flight) =>
          flight.availableSeats >=
          searchPassengers
      );
    }

    /*
     * ---------------------------------------------------------
     * TRIP TYPE
     * ---------------------------------------------------------
     */

    if (tripType !== "all") {
      result = result.filter(
        (flight) =>
          flight.type === tripType
      );
    }

    /*
     * ---------------------------------------------------------
     * CANCELLED FLIGHTS
     * ---------------------------------------------------------
     */

    result = result.filter(
      (flight) =>
        flight.status !== "cancelled"
    );

    /*
     * ---------------------------------------------------------
     * SORT
     * ---------------------------------------------------------
     */

    result.sort((a, b) => {
      if (sortBy === "price") {
        return a.price - b.price;
      }

      if (sortBy === "duration") {
        return a.duration - b.duration;
      }

      return a.departureTime.localeCompare(
        b.departureTime
      );
    });

    return result;
  }, [
    flights,
    searchPerformed,
    searchFrom,
    searchTo,
    searchDepartureDate,
    searchPassengers,
    tripType,
    sortBy,
  ]);

  /*
   * =========================================================
   * PASSENGER LIMIT
   * =========================================================
   *
   * This is based on the CURRENT search inputs while the user
   * is preparing a search.
   *
   * Before searching:
   *     from / to / date
   *
   * After searching:
   *     searchFrom / searchTo / searchDepartureDate
   *
   * The maximum is the largest available capacity among
   * matching flights.
   */

  const maximumPassengers = useMemo(() => {
    const activeFrom = searchPerformed
      ? searchFrom
      : from;

    const activeTo = searchPerformed
      ? searchTo
      : to;

    const activeDate = searchPerformed
      ? searchDepartureDate
      : departureDate;

    const matchingFlights = flights.filter(
      (flight) => {
        const normalizedFrom =
          activeFrom.trim().toLowerCase();

        const normalizedTo =
          activeTo.trim().toLowerCase();

        const matchesFrom =
          !normalizedFrom ||
          flight.originCode
            .toLowerCase() ===
            normalizedFrom ||
          flight.origin
            .toLowerCase() ===
            normalizedFrom;

        const matchesTo =
          !normalizedTo ||
          flight.destinationCode
            .toLowerCase() ===
            normalizedTo ||
          flight.destination
            .toLowerCase() ===
            normalizedTo;

        const matchesDate =
          !activeDate ||
          new Date(
            flight.departureDate
          )
            .toISOString()
            .split("T")[0] ===
            activeDate;

        const matchesType =
          tripType === "all" ||
          flight.type === tripType;

        return (
          matchesFrom &&
          matchesTo &&
          matchesDate &&
          matchesType &&
          flight.status !== "cancelled"
        );
      }
    );

    if (matchingFlights.length === 0) {
      return 1;
    }

    return Math.max(
      1,
      ...matchingFlights.map(
        (flight) =>
          flight.availableSeats
      )
    );
  }, [
    flights,
    from,
    to,
    departureDate,
    searchPerformed,
    searchFrom,
    searchTo,
    searchDepartureDate,
    tripType,
  ]);

  /*
   * Keep passenger count valid.
   */

  useEffect(() => {
    if (
      !searchPerformed &&
      passengers > maximumPassengers
    ) {
      setPassengers(maximumPassengers);
    }
  }, [
    maximumPassengers,
    passengers,
    searchPerformed,
  ]);

  /*
   * =========================================================
   * PASSENGER CONTROLS
   * =========================================================
   */

  function increasePassengers() {
    if (
      passengers < maximumPassengers
    ) {
      setPassengers(
        passengers + 1
      );

      setSearchPerformed(false);
    }
  }

  function decreasePassengers() {
    if (passengers > 1) {
      setPassengers(
        passengers - 1
      );

      setSearchPerformed(false);
    }
  }

  /*
   * =========================================================
   * FORMAT HELPERS
   * =========================================================
   */

  function formatDuration(
    minutes: number
  ) {
    const hours = Math.floor(
      minutes / 60
    );

    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }

    return `${hours}h ${mins}m`;
  }

  function formatDate(
    dateString: string
  ) {
    return new Date(
      dateString
    ).toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getArrivalDate(
    flight: Flight
  ) {
    if (flight.arrivalDate) {
      return formatDate(
        flight.arrivalDate
      );
    }

    try {
      const departure = new Date(
        `${flight.departureDate}T${flight.departureTime}:00`
      );

      const arrival = new Date(
        departure.getTime() +
          flight.duration *
            60 *
            1000
      );

      return formatDate(
        arrival.toISOString()
      );
    } catch {
      return formatDate(
        flight.departureDate
      );
    }
  }

  function formatPrice(
    price: number
  ) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(price);
  }

  /*
   * =========================================================
   * SELECT FLIGHT
   * =========================================================
   */

  function selectFlight(
    flight: Flight
  ) {
    const selectedPassengerCount =
      searchPerformed
        ? searchPassengers
        : passengers;

    if (
      flight.availableSeats <
      selectedPassengerCount
    ) {
      return;
    }

    /*
     * Store selected flight.
     */

    sessionStorage.setItem(
      "selectedFlight",
      JSON.stringify(flight)
    );

    /*
     * Store passenger count.
     */

    sessionStorage.setItem(
      "passengers",
      String(
        selectedPassengerCount
      )
    );

    /*
     * Class and seats are selected later.
     */

    sessionStorage.removeItem(
      "selectedClass"
    );

    sessionStorage.removeItem(
      "selectedSeats"
    );

    /*
     * Continue booking.
     */

    window.location.href =
      "/booking/passengers";
  }

  /*
   * =========================================================
   * DISPLAY VALUE FOR FROM
   * =========================================================
   */

  const fromDisplayValue = useMemo(() => {
    const airport = origins.find(
      (item) =>
        item.code.toLowerCase() ===
        from.toLowerCase()
    );

    if (airport) {
      return `${airport.city} (${airport.code})`;
    }

    return from;
  }, [from, origins]);

  /*
   * =========================================================
   * DISPLAY VALUE FOR TO
   * =========================================================
   */

  const toDisplayValue = useMemo(() => {
    const airport = destinations.find(
      (item) =>
        item.code.toLowerCase() ===
        to.toLowerCase()
    );

    if (airport) {
      return `${airport.city} (${airport.code})`;
    }

    return to;
  }, [to, destinations]);

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-[#f5f7fb]">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">

          <Link
            href="/"
            className="flex items-center gap-3"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#355CFF] text-white">
              <Plane size={20} />
            </div>

            <span className="text-xl font-extrabold tracking-tight text-gray-950">
              SkySync
            </span>

          </Link>

          <div className="flex items-center gap-6">

            <Link
              href="/"
              className="hidden text-sm font-semibold text-gray-500 transition hover:text-gray-950 md:block"
            >
              Home
            </Link>

            <Link
              href="/booking"
              className="hidden text-sm font-semibold text-gray-500 transition hover:text-gray-950 md:block"
            >
              My Bookings
            </Link>

            <Link
              href="/login"
              className="rounded-xl bg-[#355CFF] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#2447DF]"
            >
              Account
            </Link>

          </div>

        </div>

      </header>

      {/* =====================================================
          SEARCH HEADER
      ===================================================== */}

      <section className="bg-[#081126]">

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">

          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-200 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <div className="mb-8">

            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
              SkySync Flights
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              Find your perfect flight.
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
              Search domestic and international
              flights directly from the SkySync
              database.
            </p>

          </div>

          {/* =================================================
              SEARCH CARD
          ================================================= */}

          <form
            onSubmit={handleSearch}
            className="rounded-3xl bg-white p-4 shadow-2xl md:p-5"
          >

            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.9fr_0.7fr_auto]">

              {/* =================================================
                  FROM
              ================================================= */}

              <div className="relative rounded-2xl border border-gray-200 bg-gray-50 p-4">

                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">

                  <MapPin size={14} />

                  From

                </label>

                <input
                  value={fromDisplayValue}
                  onChange={(event) => {

                    /*
                     * If the user starts typing after selecting
                     * a suggestion, replace the airport code
                     * with the typed text.
                     */

                    setFrom(
                      event.target.value
                    );

                    setShowFromSuggestions(
                      true
                    );

                    setSearchPerformed(
                      false
                    );

                  }}
                  onFocus={() => {
                    setShowFromSuggestions(
                      true
                    );
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowFromSuggestions(
                        false
                      );
                    }, 150);
                  }}
                  placeholder="City or airport code"
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400"
                />

                {showFromSuggestions &&
                  filteredOrigins.length > 0 && (

                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

                      {filteredOrigins.map(
                        (airport) => (

                          <button
                            key={
                              airport.code
                            }
                            type="button"
                            onMouseDown={(
                              event
                            ) => {

                              event.preventDefault();

                              selectOrigin(
                                airport
                              );

                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50"
                          >

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-extrabold text-[#355CFF]">
                              {
                                airport.code
                              }
                            </div>

                            <div>

                              <p className="text-sm font-bold text-gray-900">
                                {
                                  airport.city
                                }
                              </p>

                              <p className="text-xs text-gray-400">
                                {
                                  airport.code
                                }
                              </p>

                            </div>

                          </button>

                        )
                      )}

                    </div>

                  )}

              </div>

              {/* =================================================
                  TO
              ================================================= */}

              <div className="relative rounded-2xl border border-gray-200 bg-gray-50 p-4">

                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">

                  <MapPin size={14} />

                  To

                </label>

                <input
                  value={toDisplayValue}
                  onChange={(event) => {

                    setTo(
                      event.target.value
                    );

                    setShowToSuggestions(
                      true
                    );

                    setSearchPerformed(
                      false
                    );

                  }}
                  onFocus={() => {
                    setShowToSuggestions(
                      true
                    );
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowToSuggestions(
                        false
                      );
                    }, 150);
                  }}
                  placeholder="City or airport code"
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400"
                />

                {showToSuggestions &&
                  filteredDestinations.length > 0 && (

                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

                      {filteredDestinations.map(
                        (airport) => (

                          <button
                            key={
                              airport.code
                            }
                            type="button"
                            onMouseDown={(
                              event
                            ) => {

                              event.preventDefault();

                              selectDestination(
                                airport
                              );

                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50"
                          >

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-extrabold text-[#355CFF]">
                              {
                                airport.code
                              }
                            </div>

                            <div>

                              <p className="text-sm font-bold text-gray-900">
                                {
                                  airport.city
                                }
                              </p>

                              <p className="text-xs text-gray-400">
                                {
                                  airport.code
                                }
                              </p>

                            </div>

                          </button>

                        )
                      )}

                    </div>

                  )}

              </div>

              {/* =================================================
                  DEPARTURE DATE
              ================================================= */}

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">

                  <CalendarDays size={14} />

                  Departure

                </label>

                <input
                  type="date"
                  value={
                    departureDate
                  }
                  min={
                    availableDates[0]
                  }
                  onChange={(event) => {

                    setDepartureDate(
                      event.target.value
                    );

                    setSearchPerformed(
                      false
                    );

                  }}
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                />

              </div>

              {/* =================================================
                  PASSENGERS
              ================================================= */}

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">

                  <Users size={14} />

                  Passengers

                </label>

                <div className="flex items-center justify-between">

                  <button
                    type="button"
                    onClick={
                      decreasePassengers
                    }
                    disabled={
                      passengers <= 1
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-[#355CFF] hover:text-[#355CFF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={15} />
                  </button>

                  <div className="text-center">

                    <p className="text-lg font-extrabold text-gray-950">
                      {
                        passengers
                      }
                    </p>

                    <p className="text-[10px] text-gray-400">
                      of{" "}
                      {
                        maximumPassengers
                      }{" "}
                      max
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      increasePassengers
                    }
                    disabled={
                      passengers >=
                      maximumPassengers
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-[#355CFF] hover:text-[#355CFF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={15} />
                  </button>

                </div>

              </div>

              {/* =================================================
                  SEARCH BUTTON
              ================================================= */}

              <button
                type="submit"
                className="flex min-h-[90px] items-center justify-center gap-2 rounded-2xl bg-[#355CFF] px-7 py-4 font-bold text-white transition hover:bg-[#2447DF] active:scale-[0.98] lg:self-stretch"
              >

                <Search size={19} />

                Search

              </button>

            </div>

          </form>

        </div>

      </section>

      {/* =====================================================
          RESULTS
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">

        {/* =================================================
            RESULTS HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">

          <div>

            <p className="text-sm font-semibold text-gray-500">

              {searchPerformed
                ? "Search results"
                : "Available flights"}

            </p>

            <h2 className="mt-1 text-2xl font-extrabold text-gray-950">

              {loading
                ? "Finding flights..."
                : `${filteredFlights.length} flights found`}

            </h2>

          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="flex flex-wrap gap-3">

            {/* TYPE */}

            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">

              <SlidersHorizontal
                size={16}
                className="text-gray-400"
              />

              <select
                value={tripType}
                onChange={(event) => {

                  setTripType(
                    event.target
                      .value as
                      | "all"
                      | "domestic"
                      | "international"
                  );

                }}
                className="bg-transparent text-sm font-semibold text-gray-700 outline-none"
              >

                <option value="all">
                  All flights
                </option>

                <option value="domestic">
                  Domestic
                </option>

                <option value="international">
                  International
                </option>

              </select>

            </div>

            {/* SORT */}

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target
                    .value as
                    | "price"
                    | "duration"
                    | "departure"
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none"
            >

              <option value="price">
                Sort: Lowest price
              </option>

              <option value="duration">
                Sort: Shortest duration
              </option>

              <option value="departure">
                Sort: Earliest departure
              </option>

            </select>

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (

          <div className="space-y-4">

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="h-48 animate-pulse rounded-3xl bg-white"
                />

              )
            )}

          </div>

        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (

          <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center">

            <h3 className="text-lg font-bold text-red-700">
              Something went wrong
            </h3>

            <p className="mt-2 text-sm text-red-500">
              {error}
            </p>

            <button
              onClick={
                fetchFlights
              }
              className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white"
            >
              Try again
            </button>

          </div>

        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          filteredFlights.length ===
            0 && (

            <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#355CFF]">

                <Search size={25} />

              </div>

              <h3 className="mt-5 text-xl font-extrabold text-gray-950">
                No flights found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">

                {searchPerformed
                  ? "Try another departure airport, destination, date, or reduce the number of passengers."
                  : "There are currently no available flights."}

              </p>

            </div>

          )}

        {/* =================================================
            FLIGHT CARDS
        ================================================= */}

        {!loading &&
          !error &&
          filteredFlights.length >
            0 && (

            <div className="space-y-4">

              {filteredFlights.map(
                (flight) => (

                  <div
                    key={
                      flight._id
                    }
                    className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-lg"
                  >

                    <div className="grid gap-6 lg:grid-cols-[1.1fr_2fr_1fr_auto] lg:items-center">

                      {/* =================================================
                          AIRLINE
                      ================================================= */}

                      <div>

                        <div className="flex items-center gap-3">

                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 font-extrabold text-[#355CFF]">
                            {
                              flight.airlineCode
                            }
                          </div>

                          <div>

                            <p className="font-bold text-gray-950">
                              {
                                flight.airline
                              }
                            </p>

                            <p className="text-xs font-medium text-gray-400">
                              {
                                flight.flightNumber
                              }
                            </p>

                          </div>

                        </div>

                        <span
                          className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            flight.type ===
                            "international"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >

                          {
                            flight.type ===
                            "international"
                              ? "International"
                              : "Domestic"
                          }

                        </span>

                      </div>

                      {/* =================================================
                          ROUTE
                      ================================================= */}

                      <div>

                        <div className="flex items-center gap-5">

                          {/* DEPARTURE */}

                          <div className="min-w-[80px]">

                            <p className="text-2xl font-extrabold text-gray-950">
                              {
                                flight.departureTime
                              }
                            </p>

                            <p className="mt-1 text-sm font-bold text-gray-500">
                              {
                                flight.originCode
                              }
                            </p>

                            <p className="text-xs text-gray-400">
                              {
                                flight.origin
                              }
                            </p>

                          </div>

                          {/* FLIGHT LINE */}

                          <div className="flex flex-1 flex-col items-center">

                            <p className="mb-2 text-xs font-medium text-gray-400">
                              {
                                formatDuration(
                                  flight.duration
                                )
                              }
                            </p>

                            <div className="flex w-full items-center gap-2">

                              <div className="h-px flex-1 bg-gray-200" />

                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#355CFF]">

                                <Plane
                                  size={14}
                                />

                              </div>

                              <div className="h-px flex-1 bg-gray-200" />

                            </div>

                            <p className="mt-2 text-xs font-medium text-gray-400">
                              Non-stop
                            </p>

                          </div>

                          {/* ARRIVAL */}

                          <div className="min-w-[80px] text-right">

                            <p className="text-2xl font-extrabold text-gray-950">
                              {
                                flight.arrivalTime
                              }
                            </p>

                            <p className="mt-1 text-sm font-bold text-gray-500">
                              {
                                flight.destinationCode
                              }
                            </p>

                            <p className="text-xs text-gray-400">
                              {
                                flight.destination
                              }
                            </p>

                          </div>

                        </div>

                        {/* DATES */}

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">

                          <span className="flex items-center gap-1.5">

                            <CalendarDays
                              size={13}
                            />

                            Departure:{" "}

                            {
                              formatDate(
                                flight.departureDate
                              )
                            }

                          </span>

                          <span className="flex items-center gap-1.5">

                            <CalendarDays
                              size={13}
                            />

                            Arrival:{" "}

                            {
                              getArrivalDate(
                                flight
                              )
                            }

                          </span>

                          <span className="flex items-center gap-1.5">

                            <Clock3
                              size={13}
                            />

                            {
                              formatDuration(
                                flight.duration
                              )
                            }

                          </span>

                        </div>

                      </div>

                      {/* =================================================
                          PRICE
                      ================================================= */}

                      <div className="border-t border-gray-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">

                        <p className="text-xs font-semibold text-gray-400">
                          Starting from
                        </p>

                        <p className="mt-1 text-2xl font-extrabold text-gray-950">

                          {
                            formatPrice(
                              flight.price
                            )
                          }

                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          per passenger
                        </p>

                        <p
                          className={`mt-3 text-xs font-bold ${
                            flight.availableSeats <
                            30
                              ? "text-orange-500"
                              : "text-green-600"
                          }`}
                        >

                          {
                            flight.availableSeats
                          }{" "}
                          seats available

                        </p>

                      </div>

                      {/* =================================================
                          SELECT
                      ================================================= */}

                      <div className="flex lg:justify-end">

                        <button
                          onClick={() =>
                            selectFlight(
                              flight
                            )
                          }
                          disabled={
                            flight.availableSeats <
                            (searchPerformed
                              ? searchPassengers
                              : passengers)
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#355CFF] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#2447DF] disabled:cursor-not-allowed disabled:bg-gray-300 lg:w-auto"
                        >

                          Select flight

                          <ArrowRight
                            size={16}
                          />

                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

      </section>

    </main>
  );
}