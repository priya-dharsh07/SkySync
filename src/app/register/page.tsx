"use client";

import Link from "next/link";
import { ArrowLeft, Lock, Mail, Plane, User } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!termsAccepted) {
      setError("Please accept the terms and privacy policy.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        return;
      }

      router.push("/login");
    } catch (error) {
      console.error("Registration error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#081126]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* Visual */}
        <div className="relative hidden overflow-hidden lg:block">

          <div className="absolute inset-0 bg-gradient-to-br from-[#355CFF] via-[#172B78] to-[#050914]" />

          <div className="relative flex h-full flex-col justify-between p-12">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 text-white"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                <Plane size={20} />
              </div>

              <span className="text-xl font-bold">
                SkySync
              </span>
            </Link>

            {/* Hero text */}
            <div className="max-w-lg">

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                One account
              </p>

              <h1 className="mt-4 text-6xl font-extrabold leading-tight text-white">
                Your world.
                <br />
                One place.
              </h1>

              <p className="mt-6 text-lg leading-8 text-blue-100/80">
                Save passengers, manage bookings and make every journey
                easier with SkySync.
              </p>

            </div>

            {/* Copyright */}
            <p className="text-sm text-blue-200/50">
              © 2026 SkySync
            </p>

          </div>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center bg-[#f7f8fc] px-6 py-12">

          <div className="w-full max-w-md">

            {/* Mobile back button */}
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 lg:hidden"
            >
              <ArrowLeft size={16} />
              Back
            </Link>

            {/* Heading */}
            <div className="mb-8">

              <h2 className="text-4xl font-extrabold text-gray-950">
                Create account
              </h2>

              <p className="mt-3 text-gray-500">
                Start your journey with SkySync.
              </p>

            </div>

            {/* Registration form */}
            <form
              className="space-y-4"
              onSubmit={handleSubmit}
            >

              {/* Full name */}
              <Input
                label="Full name"
                placeholder="Your name"
                icon={<User size={18} />}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              {/* Email */}
              <Input
                label="Email address"
                placeholder="you@example.com"
                icon={<Mail size={18} />}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              {/* Password */}
              <Input
                label="Password"
                placeholder="Create a strong password"
                icon={<Lock size={18} />}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              {/* Confirm password */}
              <Input
                label="Confirm password"
                placeholder="Repeat your password"
                icon={<Lock size={18} />}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />

              {/* Terms */}
              <label className="flex gap-3 py-2 text-sm text-gray-500">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) =>
                    setTermsAccepted(event.target.checked)
                  }
                  className="mt-1 h-4 w-4"
                />

                <span>
                  I agree to SkySync's terms and privacy policy.
                </span>
              </label>

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
                {loading ? "Creating account..." : "Create account"}
              </button>

            </form>

            {/* Login link */}
            <p className="mt-8 text-center text-sm text-gray-500">
              Already have an account?{" "}

              <Link
                href="/login"
                className="font-bold text-[#355CFF]"
              >
                Sign in
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
  placeholder,
  icon,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
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
          className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 outline-none transition focus:border-[#355CFF] focus:ring-4 focus:ring-blue-500/10"
        />

      </div>

    </div>
  );
}