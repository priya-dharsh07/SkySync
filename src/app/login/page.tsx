"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Lock, Plane } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#021024] flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto w-full max-w-md px-4 pt-28 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#052659] mb-6 transition"
        >
          <ArrowLeft size={13} /> Back to SkySync
        </Link>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          {/* Logo & Heading */}
          <div className="text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-[#052659] shadow-2xs">
              <Plane size={18} />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#021024]">Sign In</h1>
            <p className="mt-1 text-xs text-slate-500">Access your SkySync account and group itineraries.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Email Address</label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-[#021024] placeholder-slate-400 shadow-2xs focus:border-[#5483B3] focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Password</label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-[#021024] placeholder-slate-400 shadow-2xs focus:border-[#5483B3] focus:outline-none"
                />
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#052659] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#021024] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in to SkySync"}
            </button>
          </form>

          {/* Registration link */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{" "}
            <Link href="/register" className="font-bold text-[#052659] hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}