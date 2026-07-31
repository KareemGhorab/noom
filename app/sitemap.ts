import { getCategories, listProductSlugs } from "@/features/catalog/queries";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";
import type { MetadataRoute } from "next";

function absoluteUrl(path: string): string {
  const base = env.AUTH_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [productRows, categoryRows] = await Promise.all([
    listProductSlugs(),
    getCategories(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    entries.push({
      url: absoluteUrl(`/${locale}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    });
    entries.push({
      url: absoluteUrl(`/${locale}/search`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    });

    for (const category of categoryRows) {
      entries.push({
        url: absoluteUrl(`/${locale}/search?category=${category.slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const product of productRows) {
      entries.push({
        url: absoluteUrl(`/${locale}/product/${product.slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
