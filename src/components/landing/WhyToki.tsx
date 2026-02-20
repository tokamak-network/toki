"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

export default function WhyToki() {
  const { t } = useTranslation();

  const comparisons = [
    { feature: t.whyToki.walletSetup, traditional: t.whyToki.walletTraditional, toki: t.whyToki.walletToki },
    { feature: t.whyToki.exchangeWithdrawal, traditional: t.whyToki.exchangeTraditional, toki: t.whyToki.exchangeToki },
    { feature: t.whyToki.gasFees, traditional: t.whyToki.gasTraditional, toki: t.whyToki.gasToki },
    { feature: t.whyToki.wrapping, traditional: t.whyToki.wrappingTraditional, toki: t.whyToki.wrappingToki },
    { feature: t.whyToki.operatorSelection, traditional: t.whyToki.operatorTraditional, toki: t.whyToki.operatorToki },
    { feature: t.whyToki.stepsToStake, traditional: t.whyToki.stepsTraditional, toki: t.whyToki.stepsToki },
    { feature: t.whyToki.seigniorageTracking, traditional: t.whyToki.seigniorageTraditional, toki: t.whyToki.seigniorageToki },
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          {t.whyToki.title}
        </h2>
        <p className="text-gray-400 text-center mb-16 text-lg">
          {t.whyToki.subtitle}
        </p>

        <div className="card overflow-hidden">
          <div className="grid grid-cols-3 gap-0 text-sm">
            {/* Header */}
            <div className="p-4 border-b border-white/5 text-gray-500 font-medium">
              {t.whyToki.feature}
            </div>
            <div className="p-4 border-b border-white/5 text-gray-500 font-medium text-center">
              {t.whyToki.traditional}
            </div>
            <div className="p-4 border-b border-white/5 font-medium text-center text-accent-blue">
              {t.whyToki.toki}
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
                  {row.toki}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
