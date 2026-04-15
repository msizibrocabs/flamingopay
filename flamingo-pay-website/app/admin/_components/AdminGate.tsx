"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { currentAdmin } from "../../../lib/admin";

/**
 * Redirects to /admin/login if there's no admin session.
 * Renders children once we've confirmed a session (client-only).
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

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
  return <>{children}</>;
}
