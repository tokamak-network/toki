"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

export default function WhyTtoni() {
  const { t } = useTranslation();

  const comparisons = [
    { feature: t.whyTtoni.walletSetup, traditional: t.whyTtoni.walletTraditional, ttoni: t.whyTtoni.walletTtoni },
    { feature: t.whyTtoni.exchangeWithdrawal, traditional: t.whyTtoni.exchangeTraditional, ttoni: t.whyTtoni.exchangeTtoni },
    { feature: t.whyTtoni.gasFees, traditional: t.whyTtoni.gasTraditional, ttoni: t.whyTtoni.gasTtoni },
    { feature: t.whyTtoni.wrapping, traditional: t.whyTtoni.wrappingTraditional, ttoni: t.whyTtoni.wrappingTtoni },
    { feature: t.whyTtoni.operatorSelection, traditional: t.whyTtoni.operatorTraditional, ttoni: t.whyTtoni.operatorTtoni },
    { feature: t.whyTtoni.stepsToStake, traditional: t.whyTtoni.stepsTraditional, ttoni: t.whyTtoni.stepsTtoni },
    { feature: t.whyTtoni.seigniorageTracking, traditional: t.whyTtoni.seigniorageTraditional, ttoni: t.whyTtoni.seigniorageTtoni },
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          {t.whyTtoni.title}
        </h2>
        <p className="text-gray-400 text-center mb-16 text-lg">
          {t.whyTtoni.subtitle}
        </p>

        <div className="card overflow-hidden">
          <div className="grid grid-cols-3 gap-0 text-sm">
            {/* Header */}
            <div className="p-4 border-b border-white/5 text-gray-500 font-medium">
              {t.whyTtoni.feature}
            </div>
            <div className="p-4 border-b border-white/5 text-gray-500 font-medium text-center">
              {t.whyTtoni.traditional}
            </div>
            <div className="p-4 border-b border-white/5 font-medium text-center text-accent-blue">
              {t.whyTtoni.ttoni}
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
