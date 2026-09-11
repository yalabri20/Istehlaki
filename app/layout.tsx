import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { Analytics } from "@/components/analytics";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const title = "استهلاكي | حاسبة ومحاكي استهلاك الكهرباء";
const description =
  "أداة لقياس وتحليل استهلاك الكهرباء السكني وحساب التوفير المالي للأجهزة والتكييف.";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3001");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "استهلاكي",
  openGraph: {
    title,
    description,
    siteName: "استهلاكي",
    locale: "ar_SA",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#115E59",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={cairo.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
