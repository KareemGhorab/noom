"use client";

import { trackRecentlyViewedAction } from "@/features/catalog/recently-viewed-actions";
import { useEffect } from "react";

/** Fire-and-forget cookie update when a PDP mounts. */
export function RecentlyViewedTracker({ slug }: { slug: string }) {
  useEffect(() => {
    void trackRecentlyViewedAction(slug);
  }, [slug]);

  return null;
}
