"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function MediumIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function Footer() {
  const { t } = useTranslation();
  const footerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="relative bg-[#EBEBE6] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-end">
          {/* Left: Logo + links + socials */}
          <div className={`md:col-span-4 pb-10 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="flex items-center gap-3 mb-2">
              <Image src="/toki-icon.png" alt="Toki" width={44} height={44} />
              <h2 className="text-3xl font-bold uppercase text-black">TOKI</h2>
            </div>
            <p className="text-xs font-bold uppercase text-[#525252] mb-8">{t.footer.builtOn}</p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6">
              <a href="https://github.com/tokamak-network/toki" target="_blank" rel="noopener noreferrer" className="text-sm uppercase text-black/60 hover:text-black transition-colors">
                GitHub
              </a>
              <span className="text-black/20">|</span>
              <a href="https://medium.com/tokamak-network" target="_blank" rel="noopener noreferrer" className="text-sm uppercase text-black/60 hover:text-black transition-colors">
                {t.footer.blog}
              </a>
              <span className="text-black/20">|</span>
              <a href="https://tokamak.network" target="_blank" rel="noopener noreferrer" className="text-sm uppercase text-black/60 hover:text-black transition-colors">
                Tokamak Network
              </a>
            </div>

            <div className="flex items-center gap-4">
              <a href="https://twitter.com/tokamak_network" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="text-black/40 hover:text-black transition-colors">
                <XIcon className="w-5 h-5" />
              </a>
              <a href="https://github.com/tokamak-network" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-black/40 hover:text-black transition-colors">
                <GitHubIcon className="w-5 h-5" />
              </a>
              <a href="https://discord.com/invite/J4chV2zuAK" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="text-black/40 hover:text-black transition-colors">
                <DiscordIcon className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@Toki-x1u" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-black/40 hover:text-black transition-colors">
                <YouTubeIcon className="w-5 h-5" />
              </a>
              <a href="https://medium.com/tokamak-network" target="_blank" rel="noopener noreferrer" aria-label="Medium" className="text-black/40 hover:text-black transition-colors">
                <MediumIcon className="w-5 h-5" />
              </a>
              <a href="https://t.me/tokamak_network" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="text-black/40 hover:text-black transition-colors">
                <TelegramIcon className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/company/tokamaknetwork/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-black/40 hover:text-black transition-colors">
                <LinkedInIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Right: Characters with glow - larger area */}
          <div className="md:col-span-8 relative h-[420px] hidden md:block">
            {/* Glow aura behind Toki */}
            <div
              className={`absolute bottom-[10%] right-[18%] w-[280px] h-[280px] rounded-full transition-all duration-1000 delay-300 ${
                isVisible
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-75"
              }`}
              style={{
                background: "radial-gradient(circle, rgba(74,144,217,0.35) 0%, rgba(74,144,217,0.15) 40%, rgba(74,144,217,0) 70%)",
                filter: "blur(40px)",
              }}
            />

            {/* Toki character - original position */}
            <Image
              src="/toki-footer-leaning.png"
              alt="Toki"
              width={480}
              height={480}
              className={`absolute bottom-0 right-8 object-contain drop-shadow-[0_4px_30px_rgba(74,144,217,0.25)] transition-all duration-700 delay-150 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
              priority
            />


          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-black/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-black/40 uppercase">
            &copy; {new Date().getFullYear()} Tokamak Network
          </p>
          <p className="text-xs text-black/40 uppercase">
            {t.footer.allRightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
}
