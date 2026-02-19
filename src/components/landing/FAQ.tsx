"use client";

import { useState } from "react";

const faqs = [
  {
    q: "What is TON seigniorage staking?",
    a: "Tokamak Network distributes 3.92 WTON per Ethereum block to stakers. By staking your TON through operators, you earn a share of this seigniorage. Currently the APR is ~35%, and rewards compound automatically.",
  },
  {
    q: "Do I need ETH for gas fees?",
    a: "No. Ttoni uses EIP-7702 and a custom Paymaster so all gas fees are paid in TON. A small amount of TON (typically 1-2 TON) is deducted from your balance to cover gas costs.",
  },
  {
    q: "How do I transfer TON from Upbit?",
    a: "After signing up, Ttoni gives you a personal wallet address. Register this address on Upbit (My > Personal Wallet Management), then withdraw your TON to it. We provide step-by-step guides for each exchange.",
  },
  {
    q: "Is my TON safe?",
    a: "Your TON is staked directly to Tokamak Network's L1 smart contracts (SeigManager, DepositManager) — the same contracts used by all existing stakers. Ttoni never holds custody of your funds.",
  },
  {
    q: "How long does unstaking take?",
    a: "Unstaking requires a 14-day waiting period (93,046 blocks), which is a Tokamak Network protocol requirement. After the waiting period, you can withdraw your TON back to your wallet.",
  },
  {
    q: "What operator will my TON be staked to?",
    a: "Ttoni automatically selects the optimal operator based on commission rates and activity. You can also manually choose from the 10 available operators if you prefer.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          FAQ
        </h2>
        <p className="text-gray-400 text-center mb-16 text-lg">
          Common questions about Ttoni
        </p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
              >
                <span className="font-medium">{faq.q}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`w-5 h-5 shrink-0 text-gray-400 transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-gray-400 leading-relaxed animate-slide-up">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
