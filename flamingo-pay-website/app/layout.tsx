import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flamingo — The Pink Side of Money",
  description:
    "Flamingo is South Africa's universal QR payment platform for the informal economy. One QR, every bank, instant settlement.",
  metadataBase: new URL("https://flamingopay.co.za"),
  openGraph: {
    title: "Flamingo — The Pink Side of Money",
    description:
      "One QR. Every bank. No card machine, no monthly fees. Turn your phone into a till in 10 minutes.",
    url: "https://flamingopay.co.za",
    siteName: "Flamingo Pay",
    locale: "en_ZA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
