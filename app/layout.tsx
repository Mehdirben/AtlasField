import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AtlasField | Satellite Intelligence for Smarter Agriculture",
  description: "Harness Sentinel-1 & Sentinel-2 satellite data with AI-driven insights. Monitor crops 24/7, even through clouds, and get actionable recommendations for your fields.",
  keywords: ["agriculture", "satellite", "AI", "farming", "ESA", "Sentinel", "crop monitoring"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}>
        {children}
      </body>
    </html>
  );
}
