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
          className="object-cover object-center scale-105"
        />
        {/* Modern dark aviation glass gradient overlay for crystal clear text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#021024]/85 via-[#052659]/75 to-[#021024]/90 backdrop-blur-[1.5px]" />
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
            className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.12] drop-shadow-sm"
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
            className="mt-5 text-sm leading-relaxed text-blue-100/90 sm:text-base max-w-2xl mx-auto"
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
            {/* Pareto: Purple */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-md text-white">
              <div className="flex items-center gap-1.5 text-[#C1E8FF]">
                <Sparkles size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Smart Matching</span>
              </div>
              <p className="mt-1.5 text-base font-bold text-white">Fair Cost Split</p>
              <p className="mt-0.5 text-[11px] text-blue-100/75">Finds destinations with balanced fares and close arrival times.</p>
            </div>

            {/* Atomic: Emerald */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-md text-white">
              <div className="flex items-center gap-1.5 text-emerald-300">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Group Synchronized</span>
              </div>
              <p className="mt-1.5 text-base font-bold text-white">All Together</p>
              <p className="mt-0.5 text-[11px] text-blue-100/75">Everyone gets confirmed together with zero partial-booking risk.</p>
            </div>

            {/* Locks: Amber */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-md text-white">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Lock size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Fare Price Lock</span>
              </div>
              <p className="mt-1.5 text-base font-bold text-white">15-Min Hold</p>
              <p className="mt-0.5 text-[11px] text-blue-100/75">Holds seats and prices securely while all members checkout.</p>
            </div>

            {/* Rollback: Coral */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-md text-white">
              <div className="flex items-center gap-1.5 text-rose-300">
                <RotateCcw size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">100% Risk Free</span>
              </div>
              <p className="mt-1.5 text-base font-bold text-white">Full Protection</p>
              <p className="mt-0.5 text-[11px] text-blue-100/75">Instant, hassle-free refund if any flight in the itinerary is unavailable.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}