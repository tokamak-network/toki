import Image from "next/image";

export default function CTASection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-blue/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-navy/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <Image
              src="/ttoni.png"
              alt="Ttoni"
              width={160}
              height={160}
              className="w-32 md:w-40 shrink-0 rounded-xl"
            />

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Ready to earn <span className="text-accent-amber">~35% APR</span> on your TON?
              </h2>
              <p className="text-gray-400 mb-6">
                Stop letting your TON sit idle on exchanges. Let Ttoni put it to work.
              </p>
              <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg glow-blue hover:scale-105 transition-transform">
                Start Staking Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
