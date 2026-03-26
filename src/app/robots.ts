import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toki.tokamak.network";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/toast-test/", "/lobby-preview/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
