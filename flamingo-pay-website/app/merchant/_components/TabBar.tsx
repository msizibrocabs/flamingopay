"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "../../../lib/i18n";

const TABS = [
  { href: "/merchant/dashboard",    key: "nav_home",       icon: HomeIcon },
  { href: "/merchant/transactions", key: "nav_sales",      icon: ListIcon },
  { href: "/merchant/qr",           key: "nav_qr",         icon: QRIcon, primary: true },
  { href: "/merchant/statements",   key: "nav_statements", icon: DocIcon },
  { href: "/merchant/profile",      key: "nav_profile",    icon: UserIcon },
];

export function TabBar() {
  const pathname = usePathname() || "";
  const { t } = useI18n();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-flamingo-dark bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {TABS.map(tab => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center justify-center py-3 text-[11px] font-bold ${
                  active ? "text-flamingo-pink" : "text-flamingo-dark/70"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {tab.primary ? (
                  <span
                    className={`-mt-6 mb-1 grid h-14 w-14 place-items-center rounded-full border-2 border-flamingo-dark shadow-[0_4px_0_0_#1A1A2E] ${
                      active ? "bg-flamingo-pink" : "bg-flamingo-cream"
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${active ? "text-white" : "text-flamingo-dark"}`} />
                  </span>
                ) : (
                  <Icon className="mb-0.5 h-6 w-6" />
                )}
                {t(tab.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// --- Icons (simple inline SVGs so we don't need a dep) ---
function HomeIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5Z" strokeLinejoin="round" />
    </svg>
  );
}
function ListIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}
function QRIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v3M14 20h3v1" />
    </svg>
  );
}
function BankIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <path d="M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" strokeLinecap="round" />
    </svg>
  );
}
function DocIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" strokeLinejoin="round" />
      <path d="M14 2v6h6" strokeLinejoin="round" />
      <path d="M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" strokeLinecap="round" />
    </svg>
  );
}
