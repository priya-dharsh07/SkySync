"use client";

import Link from "next/link";
import {
  Menu,
  Plane,
  UserRound,
  X,
  LogOut,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
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
    } catch (error) {
      console.error(
        "Unable to get current user:",
        error
      );

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

  const firstLetter =
    user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">

        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#355CFF] text-white shadow-lg shadow-blue-500/20">
            <Plane
              size={21}
              strokeWidth={2.5}
            />
          </div>

          <div>
            <div className="text-xl font-extrabold tracking-tight text-gray-950">
              Sky
              <span className="text-[#355CFF]">
                Sync
              </span>
            </div>

            <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-gray-400">
              Travel intelligently
            </div>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-8 md:flex">

          <Link
            href="/"
            className="text-sm font-semibold text-gray-700 transition hover:text-[#355CFF]"
          >
            Explore
          </Link>

          <Link
            href="/flights"
            className="text-sm font-semibold text-gray-700 transition hover:text-[#355CFF]"
          >
            Flights
          </Link>

          <Link
            href="/trips"
            className="text-sm font-semibold text-gray-700 transition hover:text-[#355CFF]"
          >
            My Trips
          </Link>

          <Link
            href="/deals"
            className="text-sm font-semibold text-gray-700 transition hover:text-[#355CFF]"
          >
            Deals
          </Link>

        </nav>

        {/* DESKTOP USER AREA */}
        <div className="hidden items-center gap-3 md:flex">

          {loadingUser ? (
            <div className="h-10 w-28 animate-pulse rounded-xl bg-gray-100" />
          ) : user ? (

            /* LOGGED IN */
            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setProfileOpen(!profileOpen)
                }
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2 transition hover:border-blue-200 hover:shadow-sm"
              >

                {/* Avatar */}
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#355CFF] text-sm font-extrabold text-white">
                  {firstLetter}
                </div>

                <div className="text-left">
                  <p className="max-w-[120px] truncate text-sm font-bold text-gray-900">
                    {user.name}
                  </p>

                  <p className="max-w-[150px] truncate text-xs text-gray-400">
                    {user.email}
                  </p>
                </div>

              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

                  {/* User info */}
                  <div className="border-b border-gray-100 p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#355CFF] font-extrabold text-white">
                        {firstLetter}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-950">
                          {user.name}
                        </p>

                        <p className="truncate text-xs text-gray-400">
                          {user.email}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Profile */}
                  <Link
                    href="/profile"
                    onClick={() =>
                      setProfileOpen(false)
                    }
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50"
                  >
                    <User size={17} />
                    My Profile
                  </Link>

                  {/* Trips */}
                  <Link
                    href="/trips"
                    onClick={() =>
                      setProfileOpen(false)
                    }
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50"
                  >
                    <Plane size={17} />
                    My Trips
                  </Link>

                  <div className="border-t border-gray-100" />

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={17} />
                    Sign out
                  </button>

                </div>
              )}

            </div>

          ) : (

            /* LOGGED OUT */
            <>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                <UserRound size={17} />
                Sign in
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-[#355CFF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#2447DF]"
              >
                Create account
              </Link>
            </>

          )}

        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-xl p-2 text-gray-700 md:hidden"
        >
          {open ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>

      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="border-t border-gray-100 bg-white px-6 py-5 md:hidden">

          <nav className="flex flex-col gap-4">

            <Link
              href="/"
              onClick={() => setOpen(false)}
            >
              Explore
            </Link>

            <Link
              href="/flights"
              onClick={() => setOpen(false)}
            >
              Flights
            </Link>

            <Link
              href="/trips"
              onClick={() => setOpen(false)}
            >
              My Trips
            </Link>

            <Link
              href="/deals"
              onClick={() => setOpen(false)}
            >
              Deals
            </Link>

            <hr />

            {user ? (
              <>
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#355CFF] font-bold text-white">
                    {firstLetter}
                  </div>

                  <div>
                    <p className="font-bold text-gray-900">
                      {user.name}
                    </p>

                    <p className="text-xs text-gray-400">
                      {user.email}
                    </p>
                  </div>

                </div>

                <Link
                  href="/profile"
                  onClick={() =>
                    setOpen(false)
                  }
                  className="rounded-xl bg-gray-100 px-4 py-3 text-center font-semibold"
                >
                  My Profile
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-red-50 px-4 py-3 text-center font-semibold text-red-600"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>

                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-[#355CFF] px-4 py-3 text-center font-semibold text-white"
                >
                  Create account
                </Link>
              </>
            )}

          </nav>

        </div>
      )}

    </header>
  );
}