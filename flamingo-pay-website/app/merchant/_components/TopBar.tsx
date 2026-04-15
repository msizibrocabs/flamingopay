"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  title: string;
  subtitle?: string;
  back?: string;   // href to go back to; if set, shows arrow
  action?: React.ReactNode;
};

export function TopBar({ title, subtitle, back, action }: Props) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 border-b-2 border-flamingo-dark bg-flamingo-pink text-white">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
        {back ? (
          <button
            type="button"
            aria-label="Back"
            onClick={() => (back === "back" ? router.back() : router.push(back))}
            className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/15 hover:bg-white/25"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        ) : (
          <Link
            href="/"
            aria-label="Flamingo home"
            className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white text-flamingo-pink font-extrabold"
          >
            F
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-extrabold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-white/90">{subtitle}</p>}
        </div>
        {action && <div className="flex-none">{action}</div>}
      </div>
    </header>
  );
}
