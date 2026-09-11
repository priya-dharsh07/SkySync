import Link from "next/link";
import { Plane, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white pt-14 pb-10 text-slate-500 text-xs">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#052659] text-white">
                <Plane size={15} />
              </div>
              <span className="text-base font-bold text-[#021024]">
                Sky<span className="text-[#5483B3]">Sync</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Intelligent multi-origin flight search and synchronized group travel. Discover optimal meeting destinations and book together with total peace of mind.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>100% Price Lock Guarantee</span>
            </div>
          </div>

          {/* Group Flight Search */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#021024]">Group Travel</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-[#052659] transition">Multi-City Meeting Finder</Link></li>
              <li><Link href="/" className="hover:text-[#052659] transition">Fair Fare Split Optimization</Link></li>
              <li><Link href="/" className="hover:text-[#052659] transition">Arrival Window Coordination</Link></li>
              <li><Link href="/flights" className="hover:text-[#052659] transition">Explore All Flights</Link></li>
            </ul>
          </div>

          {/* Booking & Support */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#021024]">Traveler Services</h4>
            <ul className="space-y-2">
              <li><Link href="/select-seats" className="hover:text-[#052659] transition">Interactive Seat Selection</Link></li>
              <li><Link href="/booking/passengers" className="hover:text-[#052659] transition">Destination Visa Advisory</Link></li>
              <li><Link href="/profile" className="hover:text-[#052659] transition">Manage Reservations</Link></li>
              <li><Link href="/profile" className="hover:text-[#052659] transition">Printable Boarding Passes</Link></li>
            </ul>
          </div>

          {/* Trust & Security */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#021024]">Trust & Security</h4>
            <ul className="space-y-2 text-slate-500">
              <li>256-Bit SSL Encrypted Checkout</li>
              <li>Verified Airline Partner Network</li>
              <li>Guaranteed Seat Hold Protection</li>
              <li>24/7 Dedicated Travel Support</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6 text-[11px] text-slate-400">
          <p>© 2026 SkySync Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Modern Group Flight Booking Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}