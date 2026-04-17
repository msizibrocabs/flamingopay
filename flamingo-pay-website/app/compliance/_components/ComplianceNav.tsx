"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { complianceSignOut, currentComplianceOfficer } from "../../../lib/compliance";

const LINKS = [
  { href: "/compliance", label: "Dashboard" },
  { href: "/compliance/flags", label: "Flags" },
];

export function ComplianceNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    const c = currentComplianceOfficer();
    if (c) setName(c.name);
  }, []);

  function handleSignOut() {
    complianceSignOut();
    router.replace("/compliance/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b-2 border-flamingo-dark bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <Link href="/compliance" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-flamingo-dark bg-red-600 shadow-[0_3px_0_0_#1A1A2E]">
            <span className="display text-lg font-extrabold text-white">C</span>
          </span>
          <div className="flex flex-col leading-tight">
            <span className="display text-base font-extrabold text-flamingo-dark">
              Compliance
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">
              Transaction monitoring
            </span>
          </div>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map(l => {
            const active =
              pathname === l.href ||
              (l.href !== "/compliance" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  "rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition " +
                  (active
                    ? "border-flamingo-dark bg-red-50 text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
                    : "border-transparent text-flamingo-dark/70 hover:border-flamingo-dark/20 hover:bg-flamingo-cream")
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {name && (
            <span className="hidden text-sm font-semibold text-flamingo-dark/70 lg:inline">
              {name}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="rounded-xl border-2 border-flamingo-dark bg-white px-3 py-1.5 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-flamingo-cream active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E]"
          >
            Sign out
          </button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-flamingo-dark/10 bg-flamingo-cream px-5 py-2 md:hidden">
        {LINKS.map(l => {
          const active =
            pathname === l.href ||
            (l.href !== "/compliance" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={
                "shrink-0 rounded-lg border-2 px-3 py-1 text-xs font-bold " +
                (active
                  ? "border-flamingo-dark bg-red-50 text-flamingo-dark"
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
