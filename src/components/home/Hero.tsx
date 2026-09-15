"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Compass,
  Lock,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import landingBg from "@/bgs/landing.jpg";

export default function Hero({ onExploreClick }: { onExploreClick?: () => void }) {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24 border-b border-slate-200/80">
      {/* Visual scenic hero background */}
      <div className="absolute inset-0 z-0 select-none">
        <Image
          src={landingBg}
          alt="SkySync Global Flight Hubs"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />
        {/* Crisp, light neutral overlay for vibrant picture clarity and text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-900/30 to-slate-950/55" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Subtle SaaS Pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md"
          >
            <Sparkles size={13} className="text-[#C1E8FF]" />
            <span>Multi-Origin Group Travel</span>
            <span className="text-white/40">•</span>
            <span className="text-[#C1E8FF]">Synchronized Booking</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.12]"
            style={{ textShadow: "0 2px 14px rgba(0,0,0,0)", color: "#021024" }}
          >
            Fly From Different Cities. <br />
            <span className="bg-gradient-to-r from-[#C1E8FF] via-white to-[#7DA0CA] bg-clip-text text-transparent">
              Book & Arrive Together.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 text-sm leading-relaxed sm:text-base max-w-2xl mx-auto font-semibold"
            style={{ color: "#021024", textShadow: "0 1px 10px rgba(0,0,0,0.7)" }}
          >
            Planning a trip with friends or colleagues from different cities? SkySync coordinates traveler origins, discovers the fairest meeting destinations, and guarantees everyone gets confirmed together with zero stranded-ticket risk.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={onExploreClick}
              className="flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-bold text-[#052659] transition hover:bg-blue-50 shadow-md"
            >
              <Compass size={15} className="text-[#052659]" />
              <span>Launch Multi-Origin Search</span>
              <ArrowRight size={14} />
            </button>

            <a
              href="#engine-architecture"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-white/20 backdrop-blur-md"
            >
              <ShieldCheck size={14} className="text-[#C1E8FF]" />
              <span>How Group Booking Works</span>
            </a>
          </motion.div>

          {/* Feature Metric Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 grid grid-cols-2 gap-3 text-left sm:grid-cols-4"
          >
            {/* Pareto: Smart Matching */}
            <div className="rounded-2xl border border-white/90 bg-white/90 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-[#052659]">
                <Sparkles size={14} className="text-[#052659]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#052659]">Smart Matching</span>
              </div>
              <p className="mt-1.5 text-base font-extrabold text-[#021024]">Fair Cost Split</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-700 leading-snug">Finds destinations with balanced fares and close arrival times.</p>
            </div>

            {/* Atomic: Group Synchronized */}
            <div className="rounded-2xl border border-white/90 bg-white/90 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck size={14} className="text-emerald-700" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Group Synchronized</span>
              </div>
              <p className="mt-1.5 text-base font-extrabold text-[#021024]">All Together</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-700 leading-snug">Everyone gets confirmed together with zero partial-booking risk.</p>
            </div>

            {/* Locks: Fare Price Lock */}
            <div className="rounded-2xl border border-white/90 bg-white/90 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-amber-800">
                <Lock size={14} className="text-amber-700" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Fare Price Lock</span>
              </div>
              <p className="mt-1.5 text-base font-extrabold text-[#021024]">15-Min Hold</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-700 leading-snug">Holds seats and prices securely while all members checkout.</p>
            </div>

            {/* Rollback: 100% Risk Free */}
            <div className="rounded-2xl border border-white/90 bg-white/90 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-rose-800">
                <RotateCcw size={14} className="text-rose-700" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800">100% Risk Free</span>
              </div>
              <p className="mt-1.5 text-base font-extrabold text-[#021024]">Full Protection</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-700 leading-snug">Instant, hassle-free refund if any flight in the itinerary is unavailable.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}