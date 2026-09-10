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
              Multi-Origin Global Convergence and Atomic Multi-Party Booking Engine. Distributed group travel with zero financial risk.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>Two-Phase Escrow Guarantee</span>
            </div>
          </div>

          {/* Convergence Engine */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#021024]">Convergence Engine</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-[#052659] transition">Pareto Frontier Optimization</Link></li>
              <li><Link href="/" className="hover:text-[#052659] transition">Gini Price Fairness Metric</Link></li>
              <li><Link href="/" className="hover:text-[#052659] transition">Arrival Window Alignment</Link></li>
              <li><Link href="/" className="hover:text-[#052659] transition">Global Flight Graph Network</Link></li>
            </ul>
          </div>

          {/* Transactional Saga */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#021024]">Transactional Saga</h4>
            <ul className="space-y-2">
              <li><Link href="#engine-architecture" className="hover:text-[#052659] transition">Distributed Redis Locks</Link></li>
              <li><Link href="#engine-architecture" className="hover:text-[#052659] transition">Two-Phase Escrow Holds</Link></li>
              <li><Link href="#engine-architecture" className="hover:text-[#052659] transition">Live GDS Inventory Audits</Link></li>
              <li><Link href="#engine-architecture" className="hover:text-[#052659] transition">Compensating Rollbacks</Link></li>
            </ul>
          </div>

          {/* Architecture */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#021024]">Platform</h4>
            <ul className="space-y-2 text-slate-500">
              <li>Zero-Key Local Flight Graph</li>
              <li>Amadeus Sandbox Integration</li>
              <li>Multi-Airline Atomic Checkout</li>
              <li>Guaranteed Zero Group Liability</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6 text-[11px] text-slate-400">
          <p>© 2026 SkySync Systems Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Modern SaaS Group Travel Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}