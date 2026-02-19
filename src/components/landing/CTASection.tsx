import TtoniCharacter from "./TtoniCharacter";

export default function CTASection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-purple/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-pink/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <TtoniCharacter className="w-32 md:w-40 shrink-0" />

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Ready to earn <span className="text-accent-gold">~35% APR</span> on your TON?
              </h2>
              <p className="text-gray-400 mb-6">
                Stop letting your TON sit idle on exchanges. Let Ttoni put it to work.
              </p>
              <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-semibold text-lg glow-pink hover:scale-105 transition-transform">
                Start Staking Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
