import { ImageResponse } from "next/og";

export const alt = "Noom";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const subtitle =
    locale === "ar" ? "سوق تجريبي مرح" : "a playful marketplace";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "#ffffff",
          color: "#333333",
          border: "16px solid #333333",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          Noom
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 40,
            color: "#6b6b6b",
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            marginTop: 48,
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
