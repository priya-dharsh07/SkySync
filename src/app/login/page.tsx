"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Lock, Plane } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#081126]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* Left visual */}
        <div className="relative hidden overflow-hidden lg:block">

          <div className="absolute inset-0 bg-gradient-to-br from-[#173B9C] via-[#081126] to-[#050914]" />

          <div className="relative flex h-full flex-col justify-between p-12">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 text-white"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#355CFF]">
                <Plane size={20} />
              </div>

              <span className="text-xl font-bold">
                SkySync
              </span>
            </Link>

            {/* Hero text */}
            <div className="max-w-lg">

              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
                Your journey starts here
              </p>

              <h1 className="text-6xl font-extrabold leading-tight text-white">
                Welcome
                <br />
                back.
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-300">
                Sign in to manage your journeys, passengers, saved trips
                and bookings.
              </p>

            </div>

            {/* Copyright */}
            <p className="text-sm text-slate-500">
              © 2026 SkySync
            </p>

          </div>
        </div>

        {/* Login form section */}
        <div className="flex items-center justify-center bg-[#f7f8fc] px-6 py-12">

          <div className="w-full max-w-md">

            {/* Mobile back button */}
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 lg:hidden"
            >
              <ArrowLeft size={16} />
              Back to SkySync
            </Link>

            {/* Heading */}
            <div className="mb-10">

              <h2 className="text-4xl font-extrabold tracking-tight text-gray-950">
                Sign in
              </h2>

              <p className="mt-3 text-gray-500">
                Access your SkySync account.
              </p>

            </div>

            {/* Form */}
            <form
              className="space-y-5"
              onSubmit={handleSubmit}
            >

              {/* Email */}
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail size={18} />}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              {/* Password */}
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={<Lock size={18} />}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              {/* Remember + forgot password */}
              <div className="flex items-center justify-between text-sm">

                <label className="flex items-center gap-2 text-gray-500">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="font-semibold text-[#355CFF]"
                >
                  Forgot password?
                </button>

              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#355CFF] py-4 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#2447DF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

            </form>

            {/* Register link */}
            <p className="mt-8 text-center text-sm text-gray-500">

              Don't have an account?{" "}

              <Link
                href="/register"
                className="font-bold text-[#355CFF]"
              >
                Create one
              </Link>

            </p>

          </div>
        </div>

      </div>
    </main>
  );
}

/* Input component */
function Input({
  label,
  type,
  placeholder,
  icon,
  value,
  onChange,
}: {
  label: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative">

        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 outline-none transition placeholder:text-gray-400 focus:border-[#355CFF] focus:ring-4 focus:ring-blue-500/10"
        />

      </div>

    </div>
  );
}