import type { Metadata } from "next";
import { Bebas_Neue, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

const workSans = Work_Sans({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-work-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://brunozarath.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Bruno Zarath — Fotografia",
  description:
    "Fotografia esportiva, de eventos e retratos autorais em Curitiba, PR. Portfólio, galerias e venda de fotos.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Bruno Zarath — Fotografia",
    title: "Bruno Zarath — Fotografia",
    description:
      "Fotografia esportiva, de eventos e retratos autorais em Curitiba, PR. Portfólio, galerias e venda de fotos.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bruno Zarath — Fotografia",
    description:
      "Fotografia esportiva, de eventos e retratos autorais em Curitiba, PR.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${bebasNeue.variable} ${workSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
