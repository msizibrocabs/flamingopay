"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { currentMerchantId, signOut } from "../../../lib/merchant";
import { useSessionTimeout } from "../../../lib/useSessionTimeout";
import { ErrorBoundary } from "../../../components/ErrorBoundary";

/**
 * Redirects to /merchant/login if no mock session is present.
 * Auto-logs out after 30 minutes of inactivity.
 * Children render only once we've confirmed a session.
 */
export function MerchantGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useSessionTimeout(() => {
    signOut();
    router.replace("/merchant/login?reason=timeout");
  }, 30 * 60 * 1000);

  useEffect(() => {
    if (!currentMerchantId()) {
      router.replace("/merchant/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-flamingo-cream">
        <div className="flex items-center gap-2 text-flamingo-dark/70">
          <span className="inline-block h-3 w-3 animate-ping rounded-full bg-flamingo-pink" />
          Loading…
        </div>
      </div>
    );
  }
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
