import { SITE_URL, SITE_NAME } from "@/constants/seo";

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tokamak Network",
    url: "https://tokamak.network",
    logo: `${SITE_URL}/toki-logo.png`,
    sameAs: [
      "https://twitter.com/tokaboranetwork",
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
    description:
      "TON 스테이킹을 쉽게. 원클릭으로 토카막 네트워크에서 세뇨리지 보상을 받으세요.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
