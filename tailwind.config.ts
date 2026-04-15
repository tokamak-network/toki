import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8ecdff",
          400: "#59b0ff",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#1e3264",
        },
        accent: {
          blue: "#4a90d9",
          navy: "#2563eb",
          amber: "#f59e0b",
          cyan: "#22d3ee",
          sky: "#60a5fa",
          // Keep old names mapped to new colors for gradual migration
          pink: "#4a90d9",
          purple: "#60a5fa",
          gold: "#f59e0b",
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "pulse-slow": "pulseSlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.8s ease-out",
        "bounce-in": "bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-up-fade": "slideUpFade 0.5s ease-out",
        "sparkle": "sparkle 3.5s ease-in-out forwards",
        "confetti-fall": "confettiFall 5s ease-in-out forwards",
        "glow-pulse": "glowPulse 4s ease-in-out infinite",
        "cinematic-exit": "cinematicExit 0.8s ease-in forwards",
        "character-entrance": "characterEntrance 0.7s ease-out forwards",
        "coin-drop": "coinDrop 2s ease-in forwards",
        "card-shuffle": "cardShuffle 0.5s ease-in-out",
        wiggle: "wiggle 0.5s ease-in-out 3",
        "fade-in-up": "fadeInUp 0.3s ease-out",
        "orb-float-1": "orbFloat1 12s ease-in-out infinite",
        "orb-float-2": "orbFloat2 15s ease-in-out infinite",
        "orb-float-3": "orbFloat3 18s ease-in-out infinite",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "holo-tilt": "holoTilt 6s ease-in-out infinite",
        "holo-shine": "holoShine 4s ease-in-out infinite",
        "particle-drift-1": "particleDrift1 8s ease-in-out infinite",
        "particle-drift-2": "particleDrift2 11s ease-in-out infinite",
        "particle-drift-3": "particleDrift3 9s ease-in-out infinite",
        "particle-drift-4": "particleDrift4 13s ease-in-out infinite",
        "particle-drift-5": "particleDrift5 7s ease-in-out infinite",
        "particle-drift-6": "particleDrift6 10s ease-in-out infinite",
        "speech-bounce": "speechBounce 2s ease-in-out infinite",
        "border-glow": "borderGlow 3s ease-in-out infinite",
        "border-glow-pink": "borderGlowPink 3s ease-in-out infinite",
      },
      keyframes: {
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slideUpFade: {
          "0%": { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        sparkle: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "15%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.1)", opacity: "0.8" },
          "100%": { transform: "scale(0)", opacity: "0" },
        },
        confettiFall: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "70%": { transform: "translateY(100px) rotate(360deg)", opacity: "0.5" },
          "100%": { transform: "translateY(200px) rotate(540deg)", opacity: "0" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        cinematicExit: {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        characterEntrance: {
          "0%": { transform: "translateY(100px)", opacity: "0" },
          "40%": { transform: "translateY(-8px)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        coinDrop: {
          "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(300px) rotate(720deg)", opacity: "0" },
        },
        cardShuffle: {
          "0%": { transform: "translateX(0) scale(1)" },
          "25%": { transform: "translateX(10px) scale(0.95)" },
          "75%": { transform: "translateX(-10px) scale(0.95)" },
          "100%": { transform: "translateX(0) scale(1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-8deg)" },
          "75%": { transform: "rotate(8deg)" },
        },
        fadeInUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        orbFloat1: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
        orbFloat2: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(-40px, 30px) scale(1.15)" },
          "66%": { transform: "translate(25px, -35px) scale(0.85)" },
        },
        orbFloat3: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(35px, 25px) scale(1.1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        holoTilt: {
          "0%, 100%": { transform: "perspective(600px) rotateY(-4deg) rotateX(2deg)" },
          "25%": { transform: "perspective(600px) rotateY(4deg) rotateX(-2deg)" },
          "50%": { transform: "perspective(600px) rotateY(2deg) rotateX(4deg)" },
          "75%": { transform: "perspective(600px) rotateY(-2deg) rotateX(-4deg)" },
        },
        holoShine: {
          "0%, 100%": { backgroundPosition: "0% 50%", opacity: "0.6" },
          "50%": { backgroundPosition: "100% 50%", opacity: "1" },
        },
        particleDrift1: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.7" },
          "33%": { transform: "translate(18px, -28px) scale(1.2)", opacity: "1" },
          "66%": { transform: "translate(-12px, 16px) scale(0.8)", opacity: "0.5" },
        },
        particleDrift2: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.5" },
          "40%": { transform: "translate(-22px, -18px) scale(1.3)", opacity: "0.9" },
          "70%": { transform: "translate(14px, 24px) scale(0.7)", opacity: "0.6" },
        },
        particleDrift3: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.8" },
          "50%": { transform: "translate(24px, -16px) scale(1.1)", opacity: "0.4" },
        },
        particleDrift4: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.6" },
          "30%": { transform: "translate(-16px, 20px) scale(1.2)", opacity: "1" },
          "60%": { transform: "translate(20px, -10px) scale(0.9)", opacity: "0.4" },
        },
        particleDrift5: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.9" },
          "45%": { transform: "translate(10px, -22px) scale(1.15)", opacity: "0.5" },
        },
        particleDrift6: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.5" },
          "35%": { transform: "translate(-20px, -14px) scale(1.1)", opacity: "0.8" },
          "70%": { transform: "translate(16px, 18px) scale(0.85)", opacity: "0.6" },
        },
        speechBounce: {
          "0%, 100%": { transform: "translateY(0px) scale(1)" },
          "30%": { transform: "translateY(-6px) scale(1.02)" },
          "60%": { transform: "translateY(-3px) scale(1.01)" },
        },
        borderGlow: {
          "0%, 100%": { boxShadow: "0 0 12px 2px rgba(34,211,238,0.3), 0 0 24px 4px rgba(34,211,238,0.1)" },
          "50%": { boxShadow: "0 0 20px 4px rgba(34,211,238,0.6), 0 0 40px 8px rgba(34,211,238,0.2)" },
        },
        borderGlowPink: {
          "0%, 100%": { boxShadow: "0 0 12px 2px rgba(236,72,153,0.15), 0 0 24px 4px rgba(236,72,153,0.05)" },
          "50%": { boxShadow: "0 0 20px 4px rgba(236,72,153,0.3), 0 0 40px 8px rgba(236,72,153,0.1)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
