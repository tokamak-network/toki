import { SITE_URL, SITE_NAME } from "@/constants/seo";

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tokamak Network",
    url: "https://tokamak.network",
    logo: `${SITE_URL}/toki-logo.png`,
    sameAs: [
      "https://twitter.com/tokamak_network",
      "https://github.com/tokamak-network",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebApplicationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Stake TON on Tokamak Network (Ethereum L1)",
      "Unlock an unlimited ~1M output-tokens/day AI key",
      "Use the AI key in Claude Code, Cursor, or any OpenAI-compatible client",
      "Toki MCP server for AI clients",
      "Non-custodial — staked TON keeps earning on-chain seigniorage yield",
      "Embedded (Privy) and external (MetaMask) wallet support",
    ],
    description:
      "Stake TON on Tokamak Network and unlock an unlimited daily AI key (~1M output tokens/day) usable in Claude Code, Cursor, and any OpenAI-compatible client. Non-custodial — your TON keeps earning on-chain seigniorage yield.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
