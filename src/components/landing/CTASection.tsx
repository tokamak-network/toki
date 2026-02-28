"use client";

import Image from "next/image";
import { useTranslation } from "@/components/providers/LanguageProvider";

export default function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-blue/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-navy/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <Image
              src="/toki.png"
              alt="Toki"
              width={160}
              height={160}
              className="w-32 md:w-40 shrink-0 rounded-xl"
            />

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                {t.cta.title}{" "}
                <span className="text-accent-amber">
                  {t.cta.titleHighlight}
                </span>{" "}
                {t.cta.titleEnd}
              </h2>
              <p className="text-gray-400 mb-6">{t.cta.subtitle}</p>
              <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg glow-blue hover:scale-105 transition-transform">
                {t.cta.button}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
