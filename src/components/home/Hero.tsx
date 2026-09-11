"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Compass,
  Lock,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function Hero({ onExploreClick }: { onExploreClick?: () => void }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#F8FAFC] to-[#F1F5F9] pt-28 pb-16 lg:pt-36 lg:pb-20 border-b border-slate-200/80">
      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Subtle SaaS Pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50/80 px-3.5 py-1 text-xs font-semibold text-purple-800 shadow-sm backdrop-blur-sm"
          >
            <Sparkles size={12} className="text-purple-600" />
            <span>Multi-Origin Group Travel</span>
            <span className="text-purple-300">•</span>
            <span className="text-purple-700">Synchronized Booking</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-4xl font-extrabold tracking-tight text-[#021024] sm:text-5xl lg:text-6xl leading-[1.12]"
          >
            Fly From Different Cities. <br />
            <span className="text-[#052659]">Book & Arrive Together.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base max-w-2xl mx-auto"
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
              className="flex items-center gap-2 rounded-xl bg-[#052659] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#021024] shadow-sm"
            >
              <Compass size={15} />
              <span>Launch Multi-Origin Search</span>
              <ArrowRight size={14} />
            </button>

            <a
              href="#engine-architecture"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ShieldCheck size={14} className="text-[#5483B3]" />
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
            <div className="rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-purple-600">
                <Sparkles size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Smart Matching</span>
              </div>
              <p className="mt-1.5 text-base font-bold text-[#021024]">Fair Cost Split</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Finds destinations with balanced fares and close arrival times.</p>
            </div>

            {/* Atomic: Emerald */}
            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Group Synchronized</span>
              </div>
              <p className="mt-1.5 text-base font-bold text-[#021024]">All Together</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Everyone gets confirmed together with zero partial-booking risk.</p>
            </div>

            {/* Locks: Amber */}
            <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-amber-600">
                <Lock size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Guaranteed Fare Lock</span>
              </div>
              <p className="mt-1.5 text-base font-bold text-[#021024]">15-Min Hold</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Holds seats and prices securely while all members checkout.</p>
            </div>

            {/* Rollback: Coral */}
            <div className="rounded-xl border border-rose-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-rose-600">
                <RotateCcw size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">100% Risk Free</span>
              </div>
              <p className="mt-1.5 text-base font-bold text-[#021024]">Full Protection</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Instant, hassle-free refund if any flight in the itinerary is unavailable.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}