"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

const stepIcons = [
  (
    <svg key="1" viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  (
    <svg key="2" viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  ),
  (
    <svg key="3" viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
];

const stepStyles = [
  { number: "01", numberClass: "text-accent-blue", iconWrapClass: "bg-accent-blue/10 text-accent-blue" },
  { number: "02", numberClass: "text-accent-sky", iconWrapClass: "bg-accent-sky/10 text-accent-sky" },
  { number: "03", numberClass: "text-accent-amber", iconWrapClass: "bg-accent-amber/10 text-accent-amber" },
];

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { title: t.howItWorks.step1Title, description: t.howItWorks.step1Desc },
    { title: t.howItWorks.step2Title, description: t.howItWorks.step2Desc },
    { title: t.howItWorks.step3Title, description: t.howItWorks.step3Desc },
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          {t.howItWorks.title}
        </h2>
        <p className="text-gray-400 text-center mb-16 text-lg">
          {t.howItWorks.subtitle}
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={stepStyles[i].number}
              className="card p-8 hover:border-accent-blue/50 transition-colors group"
            >
              <div className="flex items-center gap-4 mb-6">
                <span className={`${stepStyles[i].numberClass} text-4xl font-bold opacity-30 group-hover:opacity-60 transition-opacity`}>
                  {stepStyles[i].number}
                </span>
                <div className={`p-3 rounded-xl ${stepStyles[i].iconWrapClass}`}>
                  {stepIcons[i]}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Connection lines (desktop) */}
        <div className="hidden md:flex justify-center mt-8 gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-blue" />
            <div className="w-24 h-px bg-gradient-to-r from-accent-blue to-accent-sky" />
            <div className="w-2 h-2 rounded-full bg-accent-sky" />
            <div className="w-24 h-px bg-gradient-to-r from-accent-sky to-accent-amber" />
            <div className="w-2 h-2 rounded-full bg-accent-amber" />
          </div>
        </div>
      </div>
    </section>
  );
}
