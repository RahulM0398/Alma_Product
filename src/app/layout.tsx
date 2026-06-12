import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alma — H1B RFE Assessment Portal",
  description:
    "Pre-Filing and Post-Filing RFE assessment for H-1B petition packages. Catch Specialty Occupation and Wage Level risks, and ingest USCIS RFE letters to map objections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ fontFamily: "var(--font-inter), var(--font-outfit), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
