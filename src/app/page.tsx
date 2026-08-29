import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Footer from "@/components/layout/Footer";

import "./globals.css";
export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        
        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">

            <Feature
              number="01"
              title="Search intelligently"
              text="Compare domestic and international flights using smart recommendations."
            />

            <Feature
              number="02"
              title="Travel together"
              text="Coordinate multiple passengers and find the best seating combinations."
            />

            <Feature
              number="03"
              title="Stay in sync"
              text="Keep your flight, passengers, seats and booking information connected."
            />

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Feature({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl">

      <div className="text-sm font-bold text-[#355CFF]">
        {number}
      </div>

      <h2 className="mt-4 text-2xl font-bold text-gray-950">
        {title}
      </h2>

      <p className="mt-3 leading-7 text-gray-500">
        {text}
      </p>

    </div>
  );
}