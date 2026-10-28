import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/i18n/client";
import { getLang } from "@/i18n/server";

export const metadata: Metadata = {
  title: "K-Couple — Connect Hearts Beyond Borders",
  description: "Meet Korean singles open to international dating. Mutual-match dating for foreigners in Korea and Koreans.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fd4a6c",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        <I18nProvider initial={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
