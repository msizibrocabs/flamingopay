"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { currentComplianceOfficer } from "../../../lib/compliance";

export function ComplianceGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!currentComplianceOfficer()) {
      router.replace("/compliance/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-flamingo-cream">
        <div className="flex items-center gap-2 text-flamingo-dark/70">
          <span className="inline-block h-3 w-3 animate-ping rounded-full bg-red-500" />
          Loading compliance…
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
