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
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type User = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

type BookingItem = {
  _id: string;
  bookingReference: string;
  eTicketNumber: string;
  flightNumber: string;
  airline: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  passengers: Array<{ firstName: string; lastName: string; email?: string }>;
  selectedSeats: string[];
  totalPrice: number;
  escrowStatus: string;
  status: string;
  createdAt: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json();

        if (!data.user) {
          window.location.href = "/login";
          return;
        }

        setUser(data.user);

        // Fetch user's booking history
        try {
          const bookingRes = await fetch("/api/bookings", {
            cache: "no-store",
            credentials: "include",
          });
          if (bookingRes.ok) {
            const bData = await bookingRes.json();
            setBookings(bData.bookings || []);
          }
        } catch (bErr) {
          console.warn("Failed to load bookings:", bErr);
        }
      } catch (error) {
        console.error("Profile loading error:", error);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
        <Navbar />
        <div className="flex h-[80vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#052659] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initial = user.name.trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#021024]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pt-24 pb-16 sm:px-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#052659] mb-5 transition"
        >
          <ArrowLeft size={13} /> Back to Home
        </Link>

        {/* Profile Card Header */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-2xl font-extrabold text-[#052659] shadow-2xs">
                {initial}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  SkySync Account
                </span>
                <h1 className="text-xl font-bold tracking-tight text-[#021024]">{user.name}</h1>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <Mail size={13} />
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-[#021024]"
            >
              <LogOut size={14} className="text-slate-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Grid Stats & Quick Actions */}
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {/* Account Details */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2.5 text-[#052659] border-b border-slate-100 pb-3">
              <UserRound size={16} className="text-[#5483B3]" />
              <h2 className="text-xs font-bold text-[#021024] uppercase tracking-wider">Account</h2>
            </div>
            <div className="mt-3.5 space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Full Name</span>
                <p className="font-bold text-[#021024]">{user.name}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Email</span>
                <p className="font-semibold text-slate-700 truncate">{user.email}</p>
              </div>
              {user.createdAt && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Member Since</span>
                  <p className="flex items-center gap-1 font-semibold text-[#052659]">
                    <CalendarDays size={12} className="text-[#5483B3]" />
                    {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booked Trips */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2.5 text-[#052659] border-b border-slate-100 pb-3">
              <Ticket size={16} className="text-[#5483B3]" />
              <h2 className="text-xs font-bold text-[#021024] uppercase tracking-wider">Booked Trips</h2>
            </div>
            <div className="mt-4">
              <div className="font-mono text-3xl font-extrabold text-[#052659]">{bookings.length}</div>
              <p className="mt-0.5 text-xs text-slate-500">Active flight reservations</p>
              <Link
                href="/flights"
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#052659] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#021024] transition"
              >
                <Plane size={13} />
                <span>Search Flights</span>
              </Link>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2.5 text-[#052659] border-b border-slate-100 pb-3">
              <Plane size={16} className="text-[#5483B3]" />
              <h2 className="text-xs font-bold text-[#021024] uppercase tracking-wider">Quick Actions</h2>
            </div>
            <div className="mt-3.5 space-y-2 text-xs">
              <Link
                href="/"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-slate-700 hover:border-slate-300 hover:bg-white transition"
              >
                <span>Convergence Engine</span>
                <span className="font-mono text-[10px] font-bold text-[#052659]">Group</span>
              </Link>
              <Link
                href="/flights"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-slate-700 hover:border-slate-300 hover:bg-white transition"
              >
                <span>Single Flights</span>
                <span className="font-mono text-[10px] font-bold text-slate-500">Solo</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Booking History Section */}
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-[#021024]">Booking History</h2>
            <p className="text-xs text-slate-500">Completed and upcoming flight reservations.</p>
          </div>

          {bookings.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <Clock3 size={24} className="mx-auto text-slate-400" />
              <h3 className="mt-2 text-xs font-bold text-[#021024]">No Bookings Yet</h3>
              <p className="mt-1 text-[11px] text-slate-500">
                Your booked flights and group itineraries will appear here.
              </p>
              <Link
                href="/flights"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#052659] shadow-2xs hover:bg-slate-50 transition"
              >
                <span>Explore Available Flights</span>
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {bookings.map((b) => (
                <div
                  key={b._id}
                  className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4.5 transition hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#052659] font-mono text-xs font-bold text-white">
                        {b.airline.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#021024]">{b.airline} ({b.flightNumber})</div>
                        <div className="font-mono text-[10px] text-slate-500">
                          Ref: <strong className="text-[#052659]">{b.bookingReference}</strong> • {b.eTicketNumber}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-center text-xs">
                      <div>
                        <div className="font-mono font-bold text-slate-900">{b.originCode}</div>
                        <div className="text-[10px] text-slate-400">{b.departureTime}</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-slate-400">{b.departureDate}</span>
                        <div className="w-16 border-t border-slate-300 my-1 relative">
                          <Plane size={10} className="absolute left-1/2 -top-1.5 -translate-x-1/2 text-[#5483B3]" />
                        </div>
                        <span className="font-mono text-[9px] text-emerald-700 font-bold">CONFIRMED</span>
                      </div>
                      <div>
                        <div className="font-mono font-bold text-slate-900">{b.destinationCode}</div>
                        <div className="text-[10px] text-slate-400">{b.arrivalTime}</div>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <div className="font-mono font-bold text-[#052659]">₹{b.totalPrice}</div>
                      <div className="font-mono text-[10px] text-slate-400">Seats: {b.selectedSeats?.join(", ") || "Standard"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}