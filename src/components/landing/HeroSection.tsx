"use client";

import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-navy/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-cyan/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {/* Left: Text content */}
        <div className="flex-1 text-center lg:text-left animate-fade-in">
          <div className="inline-block px-4 py-1.5 rounded-full border border-accent-blue/30 bg-accent-blue/10 text-accent-sky text-sm mb-6">
            Tokamak Network Staking
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="text-gradient">{"Hi, I'm Ttoni!"}</span>
            <br />
            <span className="text-foreground">
              TON Staking,
              <br />
              Made Easy.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-lg mb-8 leading-relaxed">
            No MetaMask. No ETH gas.
            <br />
            Just connect & stake your TON.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 justify-center lg:justify-start mb-10">
            <div className="text-center lg:text-left">
              <div className="text-2xl sm:text-3xl font-bold text-accent-amber font-mono-num">
                ~35%
              </div>
              <div className="text-sm text-gray-500">APR</div>
            </div>
            <div className="w-px bg-gray-700" />
            <div className="text-center lg:text-left">
              <div className="text-2xl sm:text-3xl font-bold text-accent-cyan font-mono-num">
                3 Steps
              </div>
              <div className="text-sm text-gray-500">to Stake</div>
            </div>
            <div className="w-px bg-gray-700" />
            <div className="text-center lg:text-left">
              <div className="text-2xl sm:text-3xl font-bold text-accent-blue font-mono-num">
                0 ETH
              </div>
              <div className="text-sm text-gray-500">Gas Fee</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg glow-blue hover:scale-105 transition-transform">
              Start Staking
            </button>
            <button className="px-8 py-4 rounded-xl border border-gray-600 text-gray-300 font-semibold text-lg hover:border-accent-sky hover:text-accent-sky transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Right: Ttoni character */}
        <div className="flex-1 flex justify-center animate-slide-up">
          <div className="relative w-72 sm:w-80 lg:w-96 animate-float">
            <div className="absolute inset-0 bg-accent-blue/20 rounded-3xl blur-2xl -z-10" />
            <Image
              src="/ttoni.png"
              alt="Ttoni - Tokamak Network Staking Guide"
              width={512}
              height={512}
              className="rounded-2xl drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
