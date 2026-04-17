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
  metadataBase: new URL("https://www.flamingopay.co.za"),
  manifest: "/manifest.json",
  icons: { icon: "/logo-primary.png", apple: "/logo-primary.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Flamingo Pay",
  },
  openGraph: {
    title: "Flamingo — The Pink Side of Money",
    description:
      "One QR. Every bank. No card machine, no monthly fees. Turn your phone into a till in 10 minutes.",
    url: "https://www.flamingopay.co.za",
    siteName: "Flamingo Pay",
    locale: "en_ZA",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Flamingo Pay — One QR, every bank" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flamingo — The Pink Side of Money",
    description: "One QR. Every bank. No card machine, no monthly fees. Built for SA's informal economy.",
    images: ["/og-image.png"],
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
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-flamingo-pink focus:px-4 focus:py-2 focus:text-white focus:font-bold">
          Skip to content
        </a>
        <div id="main-content">
        {children}
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`,
          }}
        />
      </body>
    </html>
  );
}
