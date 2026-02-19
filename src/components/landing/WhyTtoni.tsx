"use client";

const comparisons = [
  { feature: "Wallet Setup", traditional: "Install MetaMask + seed phrase", ttoni: "Kakao/Google login" },
  { feature: "Exchange Withdrawal", traditional: "Manual address copy + verify", ttoni: "Guided with copy button" },
  { feature: "Gas Fees", traditional: "Need ETH separately", ttoni: "Paid in TON automatically" },
  { feature: "WTON Wrapping", traditional: "Manual TON → WTON swap", ttoni: "Handled automatically" },
  { feature: "Operator Selection", traditional: "Research 10 operators yourself", ttoni: "Auto-selected for optimal yield" },
  { feature: "Steps to Stake", traditional: "8-15 steps", ttoni: "3 steps" },
  { feature: "Seigniorage Tracking", traditional: "Check contract manually", ttoni: "Real-time dashboard" },
];

export default function WhyTtoni() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Why Ttoni?
        </h2>
        <p className="text-gray-400 text-center mb-16 text-lg">
          Traditional staking vs Ttoni
        </p>

        <div className="card overflow-hidden">
          <div className="grid grid-cols-3 gap-0 text-sm">
            {/* Header */}
            <div className="p-4 border-b border-white/5 text-gray-500 font-medium">
              Feature
            </div>
            <div className="p-4 border-b border-white/5 text-gray-500 font-medium text-center">
              Traditional
            </div>
            <div className="p-4 border-b border-white/5 font-medium text-center text-accent-purple">
              Ttoni
            </div>

            {/* Rows */}
            {comparisons.map((row, i) => (
              <div key={row.feature} className="contents">
                <div className={`p-4 ${i < comparisons.length - 1 ? "border-b border-white/5" : ""} text-gray-300 font-medium`}>
                  {row.feature}
                </div>
                <div className={`p-4 ${i < comparisons.length - 1 ? "border-b border-white/5" : ""} text-gray-500 text-center`}>
                  {row.traditional}
                </div>
                <div className={`p-4 ${i < comparisons.length - 1 ? "border-b border-white/5" : ""} text-accent-cyan text-center`}>
                  {row.ttoni}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
