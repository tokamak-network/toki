"use client";

export default function TokiCharacter({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 200 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full animate-float"
      >
        {/* Glow effect behind character */}
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#ff6b9d" />
          </linearGradient>
          <linearGradient id="dressGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Background glow */}
        <circle cx="100" cy="140" r="120" fill="url(#glow)" />

        {/* Hair - back */}
        <ellipse cx="100" cy="85" rx="55" ry="60" fill="url(#hairGrad)" />
        {/* Hair strands - left */}
        <path d="M50 80 Q40 120 55 160" stroke="url(#hairGrad)" strokeWidth="12" strokeLinecap="round" fill="none" />
        {/* Hair strands - right */}
        <path d="M150 80 Q160 120 145 160" stroke="url(#hairGrad)" strokeWidth="12" strokeLinecap="round" fill="none" />

        {/* Face */}
        <ellipse cx="100" cy="95" rx="40" ry="42" fill="#fde8d0" />

        {/* Eyes */}
        <ellipse cx="82" cy="92" rx="8" ry="9" fill="#1e1b4b" />
        <ellipse cx="118" cy="92" rx="8" ry="9" fill="#1e1b4b" />
        {/* Eye highlights */}
        <circle cx="85" cy="89" r="3" fill="white" />
        <circle cx="121" cy="89" r="3" fill="white" />
        {/* Small sparkle */}
        <circle cx="80" cy="94" r="1.5" fill="white" opacity="0.6" />
        <circle cx="116" cy="94" r="1.5" fill="white" opacity="0.6" />

        {/* Blush */}
        <ellipse cx="72" cy="102" rx="8" ry="5" fill="#ff6b9d" opacity="0.3" />
        <ellipse cx="128" cy="102" rx="8" ry="5" fill="#ff6b9d" opacity="0.3" />

        {/* Mouth - smile */}
        <path d="M92 108 Q100 116 108 108" stroke="#c2785a" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Hair bangs */}
        <path d="M60 72 Q80 50 100 68 Q120 50 140 72" fill="url(#hairGrad)" />
        <path d="M65 75 Q80 60 95 72" fill="url(#hairGrad)" />
        <path d="M105 72 Q120 60 135 75" fill="url(#hairGrad)" />

        {/* Body / Dress */}
        <path d="M70 135 Q70 145 60 190 L140 190 Q130 145 130 135" fill="url(#dressGrad)" />
        {/* Collar */}
        <path d="M75 135 L100 150 L125 135" stroke="#22d3ee" strokeWidth="2" fill="none" />

        {/* Arms */}
        <path d="M70 145 Q50 160 55 180" stroke="#fde8d0" strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M130 145 Q150 155 160 140" stroke="#fde8d0" strokeWidth="10" strokeLinecap="round" fill="none" />

        {/* TON Coin in hand */}
        <circle cx="165" cy="135" r="18" fill="url(#coinGrad)" stroke="#d97706" strokeWidth="1.5" />
        <text x="165" y="140" textAnchor="middle" fill="#78350f" fontSize="12" fontWeight="bold">T</text>
        {/* Coin shine */}
        <path d="M155 125 Q158 122 162 125" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />

        {/* Sparkles around */}
        <g className="animate-pulse-slow">
          <path d="M30 60 L33 55 L36 60 L33 65Z" fill="#fbbf24" opacity="0.8" />
          <path d="M170 70 L173 65 L176 70 L173 75Z" fill="#22d3ee" opacity="0.8" />
          <path d="M45 180 L48 175 L51 180 L48 185Z" fill="#ff6b9d" opacity="0.6" />
          <path d="M155 190 L158 185 L161 190 L158 195Z" fill="#c084fc" opacity="0.6" />
        </g>

        {/* Legs */}
        <rect x="80" y="190" width="12" height="30" rx="6" fill="#fde8d0" />
        <rect x="108" y="190" width="12" height="30" rx="6" fill="#fde8d0" />
        {/* Shoes */}
        <ellipse cx="86" cy="222" rx="10" ry="6" fill="#1e40af" />
        <ellipse cx="114" cy="222" rx="10" ry="6" fill="#1e40af" />
      </svg>
    </div>
  );
}
