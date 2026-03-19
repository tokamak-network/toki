import type { MetadataRoute } from "next";
import { SITE_URL } from "@/constants/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/collection",
        "/admin/",
        "/toast-test",
        "/lobby-preview",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
