"use client";

import Link from "next/link";
import {
  Menu,
  Plane,
  UserRound,
  X,
  LogOut,
  User,
  ShieldCheck,
  Compass,
  Layers,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  async function getCurrentUser() {
    try {
      setLoadingUser(true);
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    getCurrentUser();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    setUser(null);
    setProfileOpen(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const firstLetter = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#052659] text-white shadow-sm">
            <Plane size={18} strokeWidth={2.2} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[#021024]">
                Sky<span className="text-[#5483B3]">Sync</span>
              </span>
              <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                <Sparkles size={10} className="inline mr-0.5" /> Pareto Engine
              </span>
            </div>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-[#052659]"
          >
            <Compass size={14} className="text-[#5483B3]" />
            Convergence Finder
          </Link>

          <Link
            href="/flights"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#052659]"
          >
            <Plane size={14} className="text-slate-400" />
            Flights
          </Link>

          <Link
            href="#engine-architecture"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#052659]"
          >
            <Layers size={14} className="text-slate-400" />
            How It Works
          </Link>

          <Link
            href="#engine-architecture"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#052659]"
          >
            <ShieldCheck size={14} className="text-emerald-500" />
            Price Guarantee
          </Link>
        </nav>

        {/* USER PROFILE & ACTIONS */}
        <div className="hidden items-center gap-3 md:flex">
          {loadingUser ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#052659] text-[11px] font-bold text-white">
                  {firstLetter}
                </div>
                <span>{user.name}</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-xs font-bold text-[#021024]">{user.name}</p>
                    <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <User size={14} className="text-slate-400" /> My Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:text-[#052659]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-[#052659] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#021024]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-700 md:hidden hover:bg-slate-50"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="border-b border-slate-200 bg-white px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-2 text-xs font-medium">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[#052659] hover:bg-slate-50"
            >
              <Compass size={15} className="text-[#5483B3]" /> Convergence Finder
            </Link>
            <Link
              href="/flights"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50"
            >
              <Plane size={15} className="text-slate-400" /> Flights
            </Link>
            <Link
              href="#engine-architecture"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50"
            >
              <Layers size={15} className="text-slate-400" /> How It Works
            </Link>
            <div className="my-1 border-t border-slate-100" />
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-rose-600"
              >
                <LogOut size={15} /> Sign out
              </button>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg bg-[#052659] py-2 text-center text-xs font-bold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}