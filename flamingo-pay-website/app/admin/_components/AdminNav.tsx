"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminSignOut, currentAdmin, type AdminSession } from "../../../lib/admin";
import { GlobalSearch } from "./GlobalSearch";

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-flamingo-pink text-white",
  manager: "bg-flamingo-butter text-flamingo-dark",
  staff: "bg-flamingo-cream text-flamingo-dark",
};

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminSession | null>(null);

  useEffect(() => {
    setAdmin(currentAdmin());
  }, []);

  const isOwner = admin?.role === "owner";

  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/merchants", label: "Merchants" },
    ...(isOwner ? [{ href: "/admin/staff", label: "Staff" }] : []),
  ];

  function handleSignOut() {
    adminSignOut();
    router.replace("/admin/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b-2 border-flamingo-dark bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_3px_0_0_#1A1A2E]">
            <span className="display text-lg font-extrabold text-white">F</span>
          </span>
          <div className="flex flex-col leading-tight">
            <span className="display text-base font-extrabold text-flamingo-dark">
              Flamingo Admin
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-flamingo-pink-deep">
              Internal · Staff only
            </span>
          </div>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map(l => {
            const active =
              pathname === l.href ||
              (l.href !== "/admin" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  "rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition " +
                  (active
                    ? "border-flamingo-dark bg-flamingo-butter text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
                    : "border-transparent text-flamingo-dark/70 hover:border-flamingo-dark/20 hover:bg-flamingo-cream")
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden flex-1 justify-end md:flex">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex items-center gap-3 md:ml-3">
          {admin && (
            <div className="hidden items-center gap-2 lg:flex">
              <span className="text-sm font-semibold text-flamingo-dark/70">
                {admin.name}
              </span>
              <span className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${ROLE_BADGE[admin.role] ?? ROLE_BADGE.staff}`}>
                {admin.role}
              </span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="rounded-xl border-2 border-flamingo-dark bg-white px-3 py-1.5 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-flamingo-cream active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E]"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-t border-flamingo-dark/10 bg-white px-5 py-2 md:hidden">
        <GlobalSearch />
      </div>

      {/* Mobile secondary nav */}
      <nav className="flex gap-1 overflow-x-auto border-t border-flamingo-dark/10 bg-flamingo-cream px-5 py-2 md:hidden">
        {links.map(l => {
          const active =
            pathname === l.href ||
            (l.href !== "/admin" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={
                "shrink-0 rounded-lg border-2 px-3 py-1 text-xs font-bold " +
                (active
                  ? "border-flamingo-dark bg-flamingo-butter text-flamingo-dark"
                  : "border-transparent text-flamingo-dark/70")
              }
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
