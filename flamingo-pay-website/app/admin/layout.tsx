import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flamingo Admin",
  description: "Internal merchant operations console — staff only.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-flamingo-cream">{children}</div>;
}
