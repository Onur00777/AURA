import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans, Press_Start_2P } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-aura-sans",
  subsets: ["latin"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-aura-display",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-aura-mono",
  subsets: ["latin"],
  display: "swap",
});

const pressStart = Press_Start_2P({
  variable: "--font-aura-pixel",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AURA",
  description: "Local multi-model chat interface for AURA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${plusJakarta.variable} ${geist.variable} ${geistMono.variable} ${pressStart.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full bg-[var(--aura-bg)] font-sans font-medium text-[var(--aura-text)]"
      >
        {children}
      </body>
    </html>
  );
}
