import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = env.AUTH_URL.replace(/\/$/, "");

  const disallow = [
    "/api/",
    ...routing.locales.flatMap((locale) => [
      `/${locale}/account/`,
      `/${locale}/auth/`,
      `/${locale}/checkout/`,
    ]),
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
