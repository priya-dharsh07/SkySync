import Link from "next/link";
import { Plane, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-20 border-t border-slate-800 bg-[#021024] pt-14 pb-10 text-slate-400 text-xs shadow-2xl">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5483B3] text-white shadow-xs">
                <Plane size={16} />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                Sky<span className="text-sky-400">Sync</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Intelligent multi-origin flight search and synchronized group travel. Discover optimal meeting destinations and book together with total peace of mind.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>100% Price Lock Guarantee</span>
            </div>
          </div>

          {/* Group Flight Search */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Group Travel</h4>
            <ul className="space-y-2 text-slate-300">
              <li><Link href="/" className="hover:text-white transition">Multi-City Meeting Finder</Link></li>
              <li><Link href="/" className="hover:text-white transition">Fair Fare Split Optimization</Link></li>
              <li><Link href="/" className="hover:text-white transition">Arrival Window Coordination</Link></li>
              <li><Link href="/flights" className="hover:text-white transition">Explore All Flights</Link></li>
            </ul>
          </div>

          {/* Booking & Support */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Traveler Services</h4>
            <ul className="space-y-2 text-slate-300">
              <li><Link href="/select-seats" className="hover:text-white transition">Interactive Seat Selection</Link></li>
              <li><Link href="/booking/passengers" className="hover:text-white transition">Destination Visa Advisory</Link></li>
              <li><Link href="/profile" className="hover:text-white transition">Manage Reservations</Link></li>
              <li><Link href="/profile" className="hover:text-white transition">Printable Boarding Passes</Link></li>
            </ul>
          </div>

          {/* Trust & Security */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Trust & Security</h4>
            <ul className="space-y-2 text-slate-400">
              <li>256-Bit SSL Encrypted Checkout</li>
              <li>Verified Airline Partner Network</li>
              <li>Guaranteed Seat Hold Protection</li>
              <li>24/7 Dedicated Travel Support</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-[11px] text-slate-500">
          <p>© 2026 SkySync Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Synchronized Group Flight Booking Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}