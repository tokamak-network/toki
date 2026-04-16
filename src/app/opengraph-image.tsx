import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Toki — Stake TON in One Click | Tokamak Network";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0a0a1a 0%, #0f172a 40%, #1e1b4b 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Left: Text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px",
            flex: 1,
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-1px",
              marginBottom: 16,
            }}
          >
            Toki
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              background: "linear-gradient(90deg, #22d3ee, #a855f7)",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: 1.2,
            }}
          >
            TON Staking
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              background: "linear-gradient(90deg, #22d3ee, #a855f7)",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: 1.2,
            }}
          >
            Made Easy
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#94a3b8",
              marginTop: 12,
              lineHeight: 1.6,
              maxWidth: 500,
            }}
          >
            Stake your TON with one click. Earn 20%+ APR seigniorage rewards.
          </div>
        </div>

        {/* Right: Character image */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 420,
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://toki.tokamak.network/toki-promo-poster.jpg"
            width={380}
            height={380}
            alt=""
            style={{
              objectFit: "contain",
              borderRadius: 20,
              filter: "drop-shadow(0 0 40px rgba(34,211,238,0.2))",
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 60,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#475569",
            fontSize: 13,
          }}
        >
          Powered by Tokamak Network
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background:
              "linear-gradient(90deg, transparent, #22d3ee, #a855f7, #22d3ee, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
