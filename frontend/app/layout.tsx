import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AtlasField - AI-Powered Satellite Crop Monitoring",
  description:
    "Monitor your fields from space. Get real-time insights on crop health, yield predictions, and pest alerts using Sentinel satellite data and AI. Built for ESA ActInSpace.",
  keywords: [
    "agriculture",
    "satellite monitoring",
    "crop health",
    "NDVI",
    "precision farming",
    "AI",
    "Sentinel",
    "ESA",
  ],
  authors: [{ name: "AtlasField Team" }],
  openGraph: {
    title: "AtlasField - AI-Powered Satellite Crop Monitoring",
    description:
      "Monitor your fields from space with AI and Sentinel satellite data.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
