import {
  getLocalizedProductTitle,
  getProductBySlug,
} from "@/features/catalog/queries";
import { DEFAULT_CURRENCY } from "@/lib/i18n/currency";
import { ImageResponse } from "next/og";

export const alt = "Noom product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug, DEFAULT_CURRENCY);
  const title = product
    ? getLocalizedProductTitle(product, locale)
    : locale === "ar"
      ? "منتج"
      : "Product";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#ffffff",
          color: "#333333",
          border: "16px solid #333333",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, color: "#6b6b6b" }}>
          Noom
        </div>
        <div
          style={{
            fontSize: title.length > 40 ? 56 : 72,
            fontWeight: 700,
            letterSpacing: -1,
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div
          style={{
            width: 160,
            height: 12,
            background: "#d64545",
            borderRadius: 999,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
