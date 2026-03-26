import { ImageResponse } from "next/og";

export const alt = "Toki - TON Staking Made Easy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toki.tokamak.network";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0a0a1a 0%, #0f172a 40%, #1e1b4b 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow effects */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Left side: Text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px",
            flex: 1,
            gap: "8px",
          }}
        >
          {/* Logo + Name */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${siteUrl}/toki-logo.png`}
              width={56}
              height={56}
              alt=""
              style={{ borderRadius: "14px" }}
            />
            <span
              style={{
                fontSize: "40px",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-1px",
              }}
            >
              Toki
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "42px",
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
              fontSize: "42px",
              fontWeight: 700,
              background: "linear-gradient(90deg, #22d3ee, #a855f7)",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: 1.2,
            }}
          >
            Made Easy
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "18px",
              color: "#94a3b8",
              marginTop: "12px",
              lineHeight: 1.6,
              maxWidth: "500px",
            }}
          >
            Stake your TON with one click. Earn 20%+ APR seigniorage rewards.
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              marginTop: "28px",
            }}
          >
            {[
              { label: "APR", value: "20%+" },
              { label: "One-Click", value: "Staking" },
              { label: "Zero", value: "Gas Fees" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "12px 20px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span style={{ fontSize: "24px", fontWeight: 700, color: "#22d3ee" }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side: Toki character */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            width: "420px",
            position: "relative",
          }}
        >
          {/* Character glow */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              width: "350px",
              height: "350px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)",
              display: "flex",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${siteUrl}/og-toki.png`}
            width={380}
            height={380}
            alt=""
            style={{
              objectFit: "contain",
              marginBottom: "40px",
              filter: "drop-shadow(0 0 40px rgba(34,211,238,0.2))",
            }}
          />
        </div>

        {/* Footer branding */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "60px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#475569",
            fontSize: "13px",
          }}
        >
          Powered by Tokamak Network
        </div>
      </div>
    ),
    { ...size }
  );
}
