import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

const sans = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Ruota della fortuna",
  description: "Ruota promozionale: estrazione dai pezzi rimasti e consegna del premio.",
};

export const viewport: Viewport = {
  themeColor: "#1C140F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
