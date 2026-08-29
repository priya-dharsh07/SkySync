"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  Plane,
  UserRound,
  LogOut,
  Ticket,
  Clock3,
} from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /*
   * ---------------------------------------------------------
   * GET CURRENT USER
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!data.user) {
          window.location.href =
            "/login";
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error(
          "Profile loading error:",
          error
        );

        window.location.href =
          "/login";
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  /*
   * ---------------------------------------------------------
   * LOGOUT
   * ---------------------------------------------------------
   */

  async function handleLogout() {
    await fetch(
      "/api/auth/logout",
      {
        method: "POST",
      }
    );

    window.location.href = "/";
  }

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb]">

        <div className="mx-auto max-w-5xl px-6 py-32">

          <div className="h-48 animate-pulse rounded-3xl bg-white" />

        </div>

      </main>
    );
  }

  if (!user) {
    return null;
  }

  const initial = user.name
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#f5f7fb]">

      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="bg-[#081126]">

        <div className="mx-auto max-w-5xl px-6 pb-16 pt-32">

          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-200 transition hover:text-white"
          >
            <ArrowLeft size={16} />

            Back to home
          </Link>

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-5">

              {/* Avatar */}

              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#355CFF] text-3xl font-extrabold text-white shadow-xl">
                {initial}
              </div>

              <div>

                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
                  SkySync Profile
                </p>

                <h1 className="mt-2 text-4xl font-extrabold text-white">
                  {user.name}
                </h1>

                <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                  <Mail size={15} />

                  {user.email}
                </p>

              </div>

            </div>

            <button
              onClick={
                handleLogout
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <LogOut size={17} />

              Sign out
            </button>

          </div>

        </div>

      </section>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <section className="mx-auto max-w-5xl px-6 py-10">

        <div className="grid gap-6 lg:grid-cols-3">

          {/* =================================================
              ACCOUNT INFORMATION
          ================================================= */}

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#355CFF]">
                <UserRound size={20} />
              </div>

              <div>

                <h2 className="font-extrabold text-gray-950">
                  Account
                </h2>

                <p className="text-xs text-gray-400">
                  Your account details
                </p>

              </div>

            </div>

            <div className="mt-6 space-y-4">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Name
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {user.name}
                </p>

              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Email
                </p>

                <p className="mt-1 break-all font-bold text-gray-900">
                  {user.email}
                </p>

              </div>

              {user.createdAt && (

                <div>

                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Member since
                  </p>

                  <p className="mt-1 flex items-center gap-2 font-bold text-gray-900">

                    <CalendarDays
                      size={15}
                      className="text-[#355CFF]"
                    />

                    {new Date(
                      user.createdAt
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        month: "long",
                        year: "numeric",
                      }
                    )}

                  </p>

                </div>

              )}

            </div>

          </div>

          {/* =================================================
              MY TRIPS
          ================================================= */}

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#355CFF]">
                <Ticket size={20} />
              </div>

              <div>

                <h2 className="font-extrabold text-gray-950">
                  My Trips
                </h2>

                <p className="text-xs text-gray-400">
                  Manage your bookings
                </p>

              </div>

            </div>

            <div className="mt-6">

              <p className="text-4xl font-extrabold text-gray-950">
                0
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Booked flights
              </p>

              <Link
                href="/trips"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#355CFF] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2447DF]"
              >
                <Plane size={16} />

                View my trips
              </Link>

            </div>

          </div>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#355CFF]">
                <Plane size={20} />
              </div>

              <div>

                <h2 className="font-extrabold text-gray-950">
                  Quick Actions
                </h2>

                <p className="text-xs text-gray-400">
                  Start your next journey
                </p>

              </div>

            </div>

            <div className="mt-6 space-y-3">

              <Link
                href="/flights"
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:border-[#355CFF] hover:text-[#355CFF]"
              >
                Search flights

                <Plane size={16} />
              </Link>

              <Link
                href="/trips"
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:border-[#355CFF] hover:text-[#355CFF]"
              >
                Booking history

                <Ticket size={16} />
              </Link>

            </div>

          </div>

        </div>

        {/* ===================================================
            BOOKING HISTORY
        =================================================== */}

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <p className="text-sm font-semibold text-gray-500">
                Your journeys
              </p>

              <h2 className="mt-1 text-2xl font-extrabold text-gray-950">
                Booking history
              </h2>

            </div>

            <Link
              href="/flights"
              className="inline-flex items-center justify-center rounded-xl bg-[#355CFF] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2447DF]"
            >
              Book a flight
            </Link>

          </div>

          {/* Empty state for now */}

          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#355CFF]">
              <Clock3 size={24} />
            </div>

            <h3 className="mt-4 font-extrabold text-gray-950">
              No bookings yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Your completed and upcoming
              flights will appear here once
              you make a booking.
            </p>

            <Link
              href="/flights"
              className="mt-5 inline-flex rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:border-[#355CFF] hover:text-[#355CFF]"
            >
              Explore flights
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}