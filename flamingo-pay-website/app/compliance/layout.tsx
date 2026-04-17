export const metadata = {
  title: "Flamingo Compliance",
  description: "Transaction monitoring and fraud prevention",
};

export default function ComplianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-flamingo-cream">{children}</div>;
}
