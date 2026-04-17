"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { currentAdmin, adminSignOut } from "../../../lib/admin";
import { useSessionTimeout } from "../../../lib/useSessionTimeout";
import { ErrorBoundary } from "../../../components/ErrorBoundary";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useSessionTimeout(() => {
    adminSignOut();
    router.replace("/admin/login?reason=timeout");
  }, 30 * 60 * 1000);

  useEffect(() => {
    if (!currentAdmin()) {
      router.replace("/admin/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-flamingo-cream">
        <div className="flex items-center gap-2 text-flamingo-dark/70">
          <span className="inline-block h-3 w-3 animate-ping rounded-full bg-flamingo-pink" />
          Loading admin…
        </div>
      </div>
    );
  }
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
