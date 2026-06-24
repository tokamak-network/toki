/* eslint-disable @next/next/no-img-element */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useTranslation } from "@/components/providers/LanguageProvider";

type AuthModalCtx = { open: () => void; close: () => void };
const Ctx = createContext<AuthModalCtx>({ open: () => {}, close: () => {} });

export const useAuthModal = () => useContext(Ctx);

/**
 * Self-select auth chooser shown before connecting:
 *  - Google (Privy embedded) → beginner path, gasless via TON paymaster
 *  - Connect a wallet (MetaMask/etc.) → advanced path, user pays gas in ETH
 * Mounted once in the layout; opened from the hero CTA and the header.
 */
export default function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { login } = usePrivy();
  const { t } = useTranslation();

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  // Both paths must AUTHENTICATE (not just connect) so `authenticated` flips and
  // the header/CTA update. login({loginMethods}) opens a filtered Privy modal;
  // the wallet path runs SIWE so the external wallet becomes a logged-in session.
  const chooseGoogle = () => {
    setOpen(false);
    login({ loginMethods: ["google", "email"] });
  };
  const chooseWallet = () => {
    setOpen(false);
    login({ loginMethods: ["wallet"] });
  };

  return (
    <Ctx.Provider value={{ open: openModal, close: closeModal }}>
      {children}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          style={{ background: "rgba(30,18,10,0.55)" }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-[28px] p-6"
            style={{
              background: "linear-gradient(180deg,#fffaf3,#fff1e2)",
              border: "2px solid #ffe6cf",
              boxShadow: "0 24px 70px rgba(80,40,15,0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-xl"
                style={{ fontFamily: "Jua, sans-serif", color: "#4a3526" }}
              >
                {t.authChoice.title}
              </h2>
              <button
                onClick={closeModal}
                aria-label={t.authChoice.close}
                className="text-2xl leading-none hover:opacity-70"
                style={{ color: "#c4a989" }}
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Google — beginner · fresh */}
              <button
                onClick={chooseGoogle}
                className="group flex items-center gap-3 text-left rounded-3xl p-3.5 transition-transform hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg,#eafff6,#e6f6ff)",
                  border: "1.5px solid #9fe0ef",
                  boxShadow: "0 10px 24px rgba(34,170,200,0.18)",
                }}
              >
                <span
                  className="shrink-0 grid place-items-center w-[78px] h-[78px] rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.7)" }}
                >
                  <img
                    src="/toki-mini-step3.png"
                    alt=""
                    className="w-[70px] h-[70px] object-contain transition-transform group-hover:scale-105 group-hover:-rotate-3"
                  />
                </span>
                <span className="min-w-0">
                  <span
                    className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1"
                    style={{ background: "#21c0dd", color: "#fff", fontFamily: "Baloo 2, sans-serif" }}
                  >
                    ★ {t.authChoice.googleBadge}
                  </span>
                  <span
                    className="block text-[17px] leading-tight"
                    style={{ fontFamily: "Jua, sans-serif", color: "#173a45" }}
                  >
                    {t.authChoice.googleTitle}
                  </span>
                  <span
                    className="block text-xs mt-0.5"
                    style={{ fontFamily: "Fredoka, sans-serif", color: "#4f7a86" }}
                  >
                    {t.authChoice.googleDesc}
                  </span>
                </span>
              </button>

              {/* External wallet — advanced · warm */}
              <button
                onClick={chooseWallet}
                className="group flex items-center gap-3 text-left rounded-3xl p-3.5 transition-transform hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg,#fff1de,#ffe5cd)",
                  border: "1.5px solid #f3c594",
                  boxShadow: "0 10px 24px rgba(220,140,60,0.16)",
                }}
              >
                <span
                  className="shrink-0 grid place-items-center w-[78px] h-[78px] rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.7)" }}
                >
                  <img
                    src="/toki-mini-step2.png"
                    alt=""
                    className="w-[70px] h-[70px] object-contain transition-transform group-hover:scale-105 group-hover:rotate-3"
                  />
                </span>
                <span className="min-w-0">
                  <span
                    className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1"
                    style={{ background: "#f59e0b", color: "#fff", fontFamily: "Baloo 2, sans-serif" }}
                  >
                    {t.authChoice.walletBadge}
                  </span>
                  <span
                    className="block text-[17px] leading-tight"
                    style={{ fontFamily: "Jua, sans-serif", color: "#5a3a22" }}
                  >
                    {t.authChoice.walletTitle}
                  </span>
                  <span
                    className="block text-xs mt-0.5"
                    style={{ fontFamily: "Fredoka, sans-serif", color: "#9a6a44" }}
                  >
                    {t.authChoice.walletDesc}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
