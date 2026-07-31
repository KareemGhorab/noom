"use server";

import { trackRecentlyViewed } from "@/lib/catalog/recently-viewed";

export async function trackRecentlyViewedAction(slug: string) {
  await trackRecentlyViewed(slug);
}
