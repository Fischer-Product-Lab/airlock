import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { AS_OF } from "@/lib/containment";
import { formatUtc } from "@/lib/format";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Airlock: eval containment",
    template: "%s · Airlock",
  },
  description:
    "Is the evaluation contained while we measure it? Read-only demo on synthetic data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable}`}>
      <body className="bg-canvas font-sans text-ink antialiased">
        <AppShell frozenClock={formatUtc(AS_OF)}>{children}</AppShell>
      </body>
    </html>
  );
}
