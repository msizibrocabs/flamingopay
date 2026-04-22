"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";

type Section = { id: string; label: string };

export function LegalShell({
  eyebrow,
  title,
  effectiveDate,
  version,
  sections,
  children,
  docPath,
}: {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  version: string;
  sections: Section[];
  children: ReactNode;
  /** Optional path to a downloadable .docx, e.g. "/legal/privacy.docx" */
  docPath?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(
    sections[0]?.id ?? null,
  );

  // Highlight TOC entry as the user scrolls.
  useEffect(() => {
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="min-h-dvh bg-flamingo-cream">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b-2 border-flamingo-dark bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-flamingo text-white font-black">
              F
            </span>
            <span className="display text-base font-extrabold text-flamingo-dark">
              Flamingo<span className="text-flamingo-pink">.</span>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-xs font-bold">
            <Link
              href="/legal/privacy"
              className="rounded-lg px-3 py-1.5 text-flamingo-dark/70 hover:bg-flamingo-cream"
            >
              Privacy
            </Link>
            <Link
              href="/legal/terms"
              className="rounded-lg px-3 py-1.5 text-flamingo-dark/70 hover:bg-flamingo-cream"
            >
              Merchant Terms
            </Link>
            <Link
              href="/legal/rmcp"
              className="rounded-lg px-3 py-1.5 text-flamingo-dark/70 hover:bg-flamingo-cream"
            >
              RMCP
            </Link>
            <Link
              href="/"
              className="rounded-lg border-2 border-flamingo-dark bg-white px-3 py-1.5 text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] hover:bg-flamingo-cream"
            >
              ← Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b-2 border-flamingo-dark bg-gradient-sunrise">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="display-eyebrow text-[10px] text-flamingo-pink-deep">
            {eyebrow}
          </p>
          <h1
            className="display mt-3 font-black text-flamingo-dark leading-[0.9]"
            style={{
              fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
              letterSpacing: "-0.035em",
            }}
          >
            {title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-flamingo-dark/70">
            <span>Effective {effectiveDate}</span>
            <span aria-hidden className="text-flamingo-dark/30">·</span>
            <span>{version}</span>
            {docPath && (
              <>
                <span aria-hidden className="text-flamingo-dark/30">·</span>
                <a
                  href={docPath}
                  className="rounded-lg border-2 border-flamingo-dark bg-white px-3 py-1 text-xs font-extrabold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] hover:bg-flamingo-cream"
                >
                  Download .docx
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Body + TOC */}
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24">
            <p className="display-eyebrow mb-3 text-[10px] text-flamingo-dark/60">
              On this page
            </p>
            <ul className="space-y-1">
              {sections.map(s => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={
                      "block rounded-lg border-l-2 px-3 py-1.5 text-xs font-semibold transition " +
                      (activeId === s.id
                        ? "border-flamingo-pink bg-flamingo-pink-wash text-flamingo-dark"
                        : "border-transparent text-flamingo-dark/60 hover:border-flamingo-dark/20 hover:text-flamingo-dark")
                    }
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="prose-legal max-w-none">{children}</article>
      </div>

      {/* Sibling policy nav */}
      <div className="mx-auto max-w-6xl px-5 pb-14">
        <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]">
          <p className="display-eyebrow text-[10px] text-flamingo-dark/60">
            Also read
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Link
              href="/legal/privacy"
              className="rounded-xl border-2 border-flamingo-dark bg-flamingo-pink-wash p-4 transition hover:-translate-y-0.5"
            >
              <p className="display text-base font-extrabold text-flamingo-dark">
                Privacy Policy
              </p>
              <p className="mt-1 text-xs text-flamingo-dark/60">
                How we collect, use, and protect your information under POPIA.
              </p>
            </Link>
            <Link
              href="/legal/terms"
              className="rounded-xl border-2 border-flamingo-dark bg-flamingo-butter p-4 transition hover:-translate-y-0.5"
            >
              <p className="display text-base font-extrabold text-flamingo-dark">
                Merchant Terms
              </p>
              <p className="mt-1 text-xs text-flamingo-dark/60">
                The agreement that governs your use of the Flamingo platform.
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-2 border-flamingo-dark bg-flamingo-ink text-white/70">
        <div className="mx-auto max-w-6xl px-5 py-8 text-xs leading-relaxed">
          <p>
            Flamingo Pay (Pty) Ltd · Reg No 2026/276925/07 · A23, 10th Ave,
            Edenburg, Rivonia, Sandton, 2091
          </p>
          <p className="mt-1">
            Questions?{" "}
            <a
              href="mailto:compliance@flamingopay.co.za"
              className="text-flamingo-pink hover:underline"
            >
              compliance@flamingopay.co.za
            </a>{" "}
            ·{" "}
            <a
              href="mailto:support@flamingopay.co.za"
              className="text-flamingo-pink hover:underline"
            >
              support@flamingopay.co.za
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Reusable section block with anchor heading */
export function LegalSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 py-5 first:pt-0">
      <h2 className="display flex items-baseline gap-3 text-2xl font-black text-flamingo-dark">
        <span className="display-eyebrow text-[11px] text-flamingo-pink-deep">
          {number}
        </span>
        {title}
      </h2>
      <div className="prose mt-3 max-w-none space-y-3 text-[15px] leading-relaxed text-flamingo-dark/85">
        {children}
      </div>
    </section>
  );
}
