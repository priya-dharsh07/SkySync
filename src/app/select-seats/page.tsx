"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Info,
  Plane,
  Users,
} from "lucide-react";
import Link from "next/link";

type SeatStatus =
  | "available"
  | "selected"
  | "occupied"
  | "premium";

type Seat = {
  id: string;
  row: number;
  column: string;
  status: SeatStatus;
};

const columns = ["A", "B", "C", "D", "E", "F"];

const occupiedSeats = ["1C", "2A", "3F", "5B", "6E", "8A", "10F"];

const premiumRows = [1, 2, 3];

export default function SelectSeatsPage() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSeat = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) return;

    setSelected((current) =>
      current.includes(seatId)
        ? current.filter((id) => id !== seatId)
        : [...current, seatId]
    );
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb]">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          <Link
            href="/flights"
            className="flex items-center gap-2 text-sm font-semibold text-gray-600"
          >
            <ArrowLeft size={18} />
            Back to flights
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#355CFF] text-white">
              <Plane size={18} />
            </div>

            <span className="font-extrabold">
              Sky<span className="text-[#355CFF]">Sync</span>
            </span>
          </div>

        </div>

      </header>

      {/* Progress */}
      <div className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 px-6 py-5">

          <Step number="1" title="Flight" done />
          <Line />
          <Step number="2" title="Passengers" done />
          <Line />
          <Step number="3" title="Seats" active />
          <Line />
          <Step number="4" title="Payment" />

        </div>

      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">

        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-[#355CFF]">
            Step 03
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            Choose your seats
          </h1>

          <p className="mt-3 text-gray-500">
            Select seats for all travellers. SkySync will keep your group
            together whenever possible.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* Aircraft */}
          <section className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm lg:p-10">

            {/* Aircraft heading */}
            <div className="mb-10 flex items-center justify-between">

              <div>
                <h2 className="font-bold text-gray-950">
                  SkySync Airways
                </h2>

                <p className="text-sm text-gray-500">
                  SS 204 · Airbus A321neo
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-[#355CFF]">
                MAA → SIN
              </div>

            </div>

            {/* Cockpit */}
            <div className="mx-auto max-w-[520px]">

              <div className="mb-8 rounded-t-[120px] border border-gray-200 bg-gray-50 py-7 text-center">
                <Plane className="mx-auto mb-2 rotate-90 text-gray-400" size={24} />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Front
                </span>
              </div>

              {/* Business */}
              <CabinTitle title="Business" />

              <div className="mb-10 space-y-2">
                {premiumRows.map((row) => (
                  <SeatRow
                    key={row}
                    row={row}
                    selected={selected}
                    toggleSeat={toggleSeat}
                  />
                ))}
              </div>

              {/* Economy */}
              <CabinTitle title="Economy" />

              <div className="space-y-2">
                {Array.from({ length: 15 }, (_, index) => index + 4).map(
                  (row) => (
                    <SeatRow
                      key={row}
                      row={row}
                      selected={selected}
                      toggleSeat={toggleSeat}
                    />
                  )
                )}
              </div>

              {/* Rear */}
              <div className="mt-8 rounded-b-[60px] border border-gray-200 bg-gray-50 py-5 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                Rear galley
              </div>

            </div>

            {/* Legend */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 border-t border-gray-100 pt-8 text-sm text-gray-500">

              <Legend type="available" text="Available" />
              <Legend type="selected" text="Selected" />
              <Legend type="occupied" text="Occupied" />
              <Legend type="premium" text="Premium" />

            </div>

          </section>

          {/* Summary */}
          <aside>

            <div className="sticky top-6 space-y-5">

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#355CFF]">
                    <Users size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Travellers
                    </h2>

                    <p className="text-sm text-gray-500">
                      2 passengers
                    </p>
                  </div>
                </div>

                <div className="space-y-3">

                  <Passenger
                    name="Priya Sharma"
                    seat={selected[0]}
                  />

                  <Passenger
                    name="Rahul Sharma"
                    seat={selected[1]}
                  />

                </div>

              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

                <h2 className="font-bold">
                  Seat summary
                </h2>

                <div className="mt-5 space-y-3 text-sm">

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Seats selected
                    </span>

                    <span className="font-bold">
                      {selected.length}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Seat fees
                    </span>

                    <span className="font-bold">
                      ₹{selected.length * 650}
                    </span>
                  </div>

                </div>

                <div className="my-5 border-t border-gray-100" />

                <div className="flex items-end justify-between">

                  <div>
                    <p className="text-xs text-gray-400">
                      Total
                    </p>

                    <p className="text-2xl font-extrabold">
                      ₹{selected.length * 650}
                    </p>
                  </div>

                  <span className="text-xs text-gray-400">
                    Seat selection
                  </span>

                </div>

                <button
                  disabled={selected.length === 0}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#355CFF] py-4 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#2447DF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                  <Check size={18} />
                </button>

              </div>

              <div className="rounded-2xl bg-blue-50 p-5 text-sm text-blue-800">
                <div className="flex gap-3">
                  <Info size={18} className="mt-0.5 shrink-0" />

                  <p>
                    Seats are temporarily held while you complete the booking.
                    Later, the SkySync booking engine will protect seats from
                    double booking.
                  </p>
                </div>
              </div>

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}

function SeatRow({
  row,
  selected,
  toggleSeat,
}: {
  row: number;
  selected: string[];
  toggleSeat: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_35px_1fr_1fr] items-center gap-2">

      {["A", "B"].map((column) => (
        <Seat
          key={`${row}${column}`}
          id={`${row}${column}`}
          premium={premiumRows.includes(row)}
          occupied={occupiedSeats.includes(`${row}${column}`)}
          selected={selected.includes(`${row}${column}`)}
          onClick={() => toggleSeat(`${row}${column}`)}
        />
      ))}

      <div className="text-center text-xs font-bold text-gray-300">
        {row}
      </div>

      {["E", "F"].map((column) => (
        <Seat
          key={`${row}${column}`}
          id={`${row}${column}`}
          premium={premiumRows.includes(row)}
          occupied={occupiedSeats.includes(`${row}${column}`)}
          selected={selected.includes(`${row}${column}`)}
          onClick={() => toggleSeat(`${row}${column}`)}
        />
      ))}

    </div>
  );
}

function Seat({
  id,
  premium,
  occupied,
  selected,
  onClick,
}: {
  id: string;
  premium: boolean;
  occupied: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={occupied}
      className={`
        relative h-11 rounded-lg border-2 text-xs font-bold transition
        ${
          occupied
            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300"
            : selected
            ? "border-[#355CFF] bg-[#355CFF] text-white shadow-lg shadow-blue-500/20"
            : premium
            ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400"
            : "border-gray-200 bg-white text-gray-600 hover:border-[#355CFF] hover:text-[#355CFF]"
        }
      `}
    >
      {id}
    </button>
  );
}

function CabinTitle({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
        {title}
      </span>

      <div className="h-px flex-1 bg-gray-100" />
    </div>
  );
}

function Legend({
  type,
  text,
}: {
  type: "available" | "selected" | "occupied" | "premium";
  text: string;
}) {
  const classes = {
    available: "border-gray-200 bg-white",
    selected: "border-[#355CFF] bg-[#355CFF]",
    occupied: "border-gray-200 bg-gray-100",
    premium: "border-amber-200 bg-amber-50",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded border-2 ${classes[type]}`} />
      {text}
    </div>
  );
}

function Passenger({
  name,
  seat,
}: {
  name: string;
  seat?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">

      <div>
        <p className="text-sm font-bold">
          {name}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Adult passenger
        </p>
      </div>

      <div className="rounded-lg bg-white px-3 py-2 text-sm font-bold shadow-sm">
        {seat || "Select"}
      </div>

    </div>
  );
}

function Step({
  number,
  title,
  active,
  done,
}: {
  number: string;
  title: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">

      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
          active || done
            ? "bg-[#355CFF] text-white"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {done ? <Check size={14} /> : number}
      </div>

      <span
        className={`hidden text-sm font-semibold sm:block ${
          active ? "text-gray-900" : "text-gray-400"
        }`}
      >
        {title}
      </span>

    </div>
  );
}

function Line() {
  return <div className="h-px w-8 bg-gray-200 sm:w-16" />;
}