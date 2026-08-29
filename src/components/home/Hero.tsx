"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  MapPin,
  Search,
  Users,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[780px] overflow-hidden bg-[#081126]">

      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-40 lg:px-8">

        <div className="max-w-4xl">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-blue-200 backdrop-blur"
          >
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            Intelligent flight booking
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-8xl"
          >
            Travel further.
            <br />
            <span className="text-blue-400">Sync everything.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-7 max-w-2xl text-lg leading-8 text-slate-300"
          >
            Search flights, coordinate groups, choose seats and manage your
            entire journey through one intelligent travel experience.
          </motion.p>

        </div>

        {/* Search card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-14 rounded-[28px] border border-white/10 bg-white/[0.96] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl"
        >

          {/* Trip type */}
          <div className="flex gap-2 border-b border-gray-100 px-2 pb-4">
            <button className="rounded-full bg-[#355CFF] px-5 py-2 text-sm font-semibold text-white">
              Round trip
            </button>

            <button className="rounded-full px-5 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100">
              One way
            </button>

            <button className="rounded-full px-5 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100">
              Multi-city
            </button>
          </div>

          {/* Search fields */}
          <div className="grid gap-3 pt-4 lg:grid-cols-[1fr_auto_1fr_1fr_1fr_auto]">

            <SearchField
              icon={<MapPin size={18} />}
              label="From"
              value="Chennai (MAA)"
            />

            <button className="my-auto hidden h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-[#355CFF] shadow-sm lg:flex">
              ⇄
            </button>

            <SearchField
              icon={<MapPin size={18} />}
              label="To"
              value="Singapore (SIN)"
            />

            <SearchField
              icon={<CalendarDays size={18} />}
              label="Departure"
              value="24 Aug 2026"
            />

            <SearchField
              icon={<Users size={18} />}
              label="Travellers"
              value="2 Travellers"
            />

            <button className="flex h-[62px] items-center justify-center gap-2 rounded-2xl bg-[#355CFF] px-7 font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#2447DF]">
              <Search size={19} />
              Search
            </button>

          </div>
        </motion.div>

        {/* Stats */}
        <div className="mt-10 flex flex-wrap gap-8 text-sm text-slate-400">
          <div>
            <span className="font-bold text-white">500+</span> destinations
          </div>

          <div>
            <span className="font-bold text-white">10,000+</span> flights
          </div>

          <div>
            <span className="font-bold text-white">24/7</span> travel support
          </div>
        </div>

      </div>
    </section>
  );
}

function SearchField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <button className="group flex h-[62px] items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 text-left transition hover:border-blue-300 hover:shadow-sm">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#355CFF]">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </div>

        <div className="mt-1 truncate text-sm font-bold text-gray-900">
          {value}
        </div>
      </div>

      <ChevronDown
        size={16}
        className="ml-auto text-gray-400"
      />
    </button>
  );
}