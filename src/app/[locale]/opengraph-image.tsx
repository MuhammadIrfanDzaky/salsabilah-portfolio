import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";
import { isLocale, type Locale } from "@/lib/i18n";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Salsabilah, S.P., M.P. — Agricultural Economist & Researcher";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "en";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          backgroundColor: "#faf7f0",
          backgroundImage: "linear-gradient(180deg, #f2ecdc 0%, #faf7f0 60%, #efefe0 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            color: "#8f4b28",
            fontSize: 26,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: 48, height: 2, backgroundColor: "#d8c6a3" }} />
          {profile.kicker[locale]}
        </div>
        <div
          style={{
            marginTop: 28,
            color: "#20261e",
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          {profile.displayName}
        </div>
        <div style={{ marginTop: 24, color: "#2e4a38", fontSize: 40, fontStyle: "italic" }}>
          {profile.role[locale]}
        </div>
        <div
          style={{
            marginTop: 48,
            color: "#57604f",
            fontSize: 28,
            lineHeight: 1.45,
            maxWidth: 900,
          }}
        >
          {profile.seo.description[locale]}
        </div>
      </div>
    ),
    size,
  );
}
