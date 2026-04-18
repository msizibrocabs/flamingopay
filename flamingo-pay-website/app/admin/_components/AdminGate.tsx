"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminSignIn, adminSignOut, currentAdmin } from "../../../lib/admin";
import { useSessionTimeout } from "../../../lib/useSessionTimeout";
import { ErrorBoundary } from "../../../components/ErrorBoundary";

type Props = {
  children: React.ReactNode;
  /** Optional: minimum permission required to view this page. */
  requirePermission?: string;
};

export function AdminGate({ children, requirePermission }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useSessionTimeout(() => {
    adminSignOut();
    router.replace("/admin/login?reason=timeout");
  }, 30 * 60 * 1000);

  useEffect(() => {
    // Verify server session is still valid
    fetch("/api/admin/session")
      .then(async res => {
        if (!res.ok) {
          // Server session expired — clear client state and redirect
          adminSignOut();
          router.replace("/admin/login?reason=expired");
          return;
        }
        const data = await res.json();
        // Sync client-side session with server state
        adminSignIn(data.staff);

        // Check permission if required
        if (requirePermission) {
          const perms: Record<string, string[]> = {
            owner: [
              "view_dashboard", "view_merchants", "approve_merchants",
              "view_transactions", "view_compliance", "handle_compliance", "manage_staff",
            ],
            manager: [
              "view_dashboard", "view_merchants", "approve_merchants",
              "view_transactions", "view_compliance", "handle_compliance",
            ],
            staff: [
              "view_dashboard", "view_merchants", "view_transactions", "view_compliance",
            ],
          };
          const role = data.staff.role || "staff";
          if (!perms[role]?.includes(requirePermission)) {
            router.replace("/admin?error=forbidden");
            return;
          }
        }

        setReady(true);
      })
      .catch(() => {
        adminSignOut();
        router.replace("/admin/login");
      });
  }, [router, requirePermission]);

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
