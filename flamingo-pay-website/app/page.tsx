"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Reveal, RevealGroup, RevealItem } from "../components/motion/Reveal";
import { AnimatedCounter } from "../components/motion/AnimatedCounter";
import { SpazaOwner } from "../components/art/SpazaOwner";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const heroWordY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const heroWordOpacity = useTransform(scrollYProgress, [0, 0.8], [0.1, 0]);

  return (
    <div className="bg-flamingo-cream antialiased w-full overflow-x-hidden">
      {/* ─────────────────── NAV ─────────────────── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 glass border-b border-flamingo-dark/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-flamingo text-white font-black shadow-[0_6px_20px_-6px_rgba(255,82,119,0.8)]">
              F
              <span className="absolute inset-0 rounded-full pulse-ring" />
            </span>
            <span className="display font-extrabold text-2xl tracking-tight">
              Flamingo<span className="text-flamingo-pink">.</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-flamingo-dark/80">
            <a href="#why" className="hover:text-flamingo-pink transition">Why Flamingo</a>
            <a href="#how" className="hover:text-flamingo-pink transition">How it works</a>
            <a href="#numbers" className="hover:text-flamingo-pink transition">The numbers</a>
            <a href="#pricing" className="hover:text-flamingo-pink transition">Pricing</a>
          </nav>
          <Link href="/merchant/signup" className="btn-ink text-sm">
            Get my QR
            <span aria-hidden>→</span>
          </Link>
        </div>
      </motion.header>

      {/* ─────────────────── EDITORIAL HERO ─────────────────── */}
      <section
        ref={heroRef}
        className="relative bg-gradient-sunrise noise overflow-hidden pt-14 pb-24"
      >
        {/* Giant decorative word */}
        <motion.span
          style={{ y: heroWordY, opacity: heroWordOpacity }}
          aria-hidden
          className="display pointer-events-none absolute -top-8 -right-16 md:-right-24 font-black leading-none text-flamingo-pink/10 select-none"
        >
          <span className="block" style={{ fontSize: "clamp(8rem, 22vw, 22rem)", letterSpacing: "-0.05em" }}>
            pay.
          </span>
        </motion.span>

        <motion.div
          style={{ y: heroY }}
          className="relative max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-10 md:gap-8 items-center"
        >
          {/* LEFT — editorial headline */}
          <div className="md:col-span-6 relative z-10">
            <Reveal>
              <span className="display-eyebrow text-xs text-flamingo-pink-deep">
                Banking · Beyond · Built in SA
              </span>
            </Reveal>

            <Reveal delay={0.08}>
              <h1
                className="display-xxl mt-5 text-flamingo-dark"
                style={{ fontSize: "clamp(3.25rem, 8vw, 7.5rem)" }}
              >
                Listen<br />for the{" "}
                <span className="italic text-gradient-flamingo">ping.</span>
                <br />
                <span className="text-flamingo-dark/90">That&rsquo;s a sale.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.18}>
              <p className="mt-7 max-w-xl text-lg md:text-xl text-flamingo-dark/75 leading-relaxed">
                One QR. Every bank. No card machine, no monthly fees, no
                &ldquo;ag sorry, I don&rsquo;t have change&rdquo; awkwardness.
                Flamingo turns your phone into a till in the time it takes to
                boil a kettle.
              </p>
            </Reveal>

            <Reveal delay={0.28}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/merchant/signup" className="btn-ink">
                  Become a till
                  <span aria-hidden>→</span>
                </Link>
                <a href="#how" className="btn-ghost-ink">
                  See how it works
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.38}>
              <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-flamingo-dark/60 uppercase tracking-wider">
                <span>POPIA protected</span>
                <Dot />
                <span>RICA verified</span>
                <Dot />
                <span>PayShap ready</span>
                <Dot />
                <span>Ozow · EFT · Capitec</span>
              </div>
            </Reveal>
          </div>

          {/* RIGHT — spaza owner illustration + floating cards */}
          <div className="md:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-xl"
            >
              <div className="relative overflow-hidden rounded-[48px] border-2 border-flamingo-dark bg-flamingo-cream shadow-[0_30px_80px_-30px_rgba(26,26,46,0.4)]">
                <SpazaOwner className="block w-full h-auto" />
              </div>

              {/* Floating "Today" glass card */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: -3 }}
                animate={{ opacity: 1, y: 0, rotate: -3 }}
                transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="hidden sm:block absolute -left-6 md:-left-10 top-[46%] w-56 glass rounded-2xl p-4 shadow-[0_20px_40px_-20px_rgba(26,26,46,0.35)]"
              >
                <p className="display-eyebrow text-[10px] text-flamingo-dark/60">Today</p>
                <p className="display mt-1 text-3xl font-black tabular-nums text-flamingo-dark">
                  R<AnimatedCounter to={12480} />
                </p>
                <div className="mt-3 flex items-end gap-1 h-8">
                  {[40, 65, 52, 80, 58, 90, 72].map((h, i) => (
                    <motion.span
                      key={i}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: h / 100 }}
                      transition={{ delay: 1.1 + i * 0.06, duration: 0.5, ease: "easeOut" }}
                      style={{ transformOrigin: "bottom" }}
                      className="flex-1 rounded-sm bg-flamingo-pink"
                    />
                  ))}
                </div>
              </motion.div>

              {/* Approved PayShap chip */}
              <motion.div
                initial={{ opacity: 0, y: -20, rotate: 6 }}
                animate={{ opacity: 1, y: 0, rotate: 6 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="absolute -right-2 md:-right-3 top-8 rounded-full bg-flamingo-mint border-2 border-flamingo-dark px-3.5 py-1.5 text-xs font-extrabold text-flamingo-dark shadow-[0_6px_0_0_#1A1A2E]"
              >
                ✓ Approved · PayShap
              </motion.div>

              {/* Toast */}
              <motion.div
                initial={{ opacity: 0, y: 20, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ delay: 1.3, duration: 0.6 }}
                className="absolute -right-3 md:-right-4 bottom-12 rounded-xl bg-flamingo-butter border-2 border-flamingo-dark px-3.5 py-2 text-sm font-extrabold text-flamingo-dark shadow-[0_6px_0_0_#1A1A2E]"
              >
                +R 45.00 <span className="text-flamingo-pink-deep">✓</span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─────────────────── BANK MARQUEE ─────────────────── */}
      <section
        aria-label="Supported banks"
        className="bg-flamingo-dark text-flamingo-cream py-6 border-y border-flamingo-dark overflow-hidden"
      >
        <div className="marquee-track whitespace-nowrap text-sm md:text-base font-bold uppercase tracking-[0.22em]">
          {[...Array(2)].map((_, loop) => (
            <div key={loop} className="flex items-center gap-10 pr-10 text-flamingo-cream/80">
              {[
                "Capitec",
                "FNB",
                "Nedbank",
                "Absa",
                "Standard Bank",
                "TymeBank",
                "Discovery",
                "African Bank",
                "PayShap",
                "Ozow",
              ].map((b) => (
                <span key={b} className="flex items-center gap-10">
                  <span>{b}</span>
                  <span className="text-flamingo-pink">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── THE PITCH ─────────────────── */}
      <section id="why" className="relative bg-mesh-cream noise py-28">
        <div className="max-w-7xl mx-auto px-6 relative">
          <Reveal>
            <span className="display-eyebrow text-xs text-flamingo-pink-deep">
              Why Flamingo
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              className="display mt-4 font-black text-flamingo-dark leading-[0.92] tracking-tight max-w-4xl"
              style={{ fontSize: "clamp(2.25rem, 5.5vw, 5rem)", letterSpacing: "-0.035em" }}
            >
              A card machine costs R3,499.
              <br />
              <span className="italic text-gradient-flamingo">
                Flamingo costs nothing.
              </span>
            </h2>
          </Reveal>

          <RevealGroup className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              {
                bg: "bg-flamingo-butter",
                kicker: "01",
                title: "Zero hardware",
                body: "Print the QR. Stick it on the counter. That's the whole setup. No card machine, no power adapter, no paper rolls.",
              },
              {
                bg: "bg-flamingo-mint",
                kicker: "02",
                title: "Every bank",
                body: "Capitec, FNB, Absa, Nedbank, Standard, Tyme, Discovery — if it opens a banking app, it pays you.",
              },
              {
                bg: "bg-flamingo-pink-soft",
                kicker: "03",
                title: "No monthly",
                body: "You pay when you get paid. 1.5% per ping. No subscription, no minimums, no surprise fees at month-end.",
              },
            ].map((c, i) => (
              <RevealItem key={i}>
                <motion.div
                  whileHover={{ y: -6, rotate: i % 2 === 0 ? -0.6 : 0.6 }}
                  transition={{ type: "spring", stiffness: 240, damping: 22 }}
                  className={`${c.bg} relative rounded-3xl p-8 border-2 border-flamingo-dark shadow-[0_8px_0_0_#1A1A2E] h-full`}
                >
                  <span className="display-eyebrow text-[10px] text-flamingo-dark/60">
                    {c.kicker}
                  </span>
                  <h3
                    className="display mt-3 font-black text-flamingo-dark leading-[0.95]"
                    style={{ fontSize: "clamp(1.75rem, 2.2vw, 2.5rem)", letterSpacing: "-0.025em" }}
                  >
                    {c.title}
                  </h3>
                  <p className="mt-4 text-flamingo-dark/80 leading-relaxed">
                    {c.body}
                  </p>
                </motion.div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ─────────────────── HOW IT WORKS (dark editorial) ─────────────────── */}
      <section id="how" className="relative bg-flamingo-ink text-flamingo-cream py-28 overflow-hidden">
        <div className="absolute inset-0 grid-overlay" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-flamingo-pink/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-flamingo-pink/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12">
          <div className="md:col-span-5 md:sticky md:top-28 self-start">
            <Reveal>
              <span className="display-eyebrow text-xs text-flamingo-pink">
                How it works
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2
                className="display mt-4 font-black leading-[0.9] tracking-tight"
                style={{ fontSize: "clamp(2.5rem, 5.5vw, 5.5rem)", letterSpacing: "-0.04em" }}
              >
                Become a till
                <br />
                <span className="italic text-flamingo-pink">in ten minutes.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.18}>
              <p className="mt-6 max-w-md text-white/70 text-lg leading-relaxed">
                No training. No installer visit. No &ldquo;please wait 3–5 business days&rdquo;.
                You&rsquo;ll take your first payment before the kettle boils.
              </p>
            </Reveal>
            <Reveal delay={0.28}>
              <Link
                href="/merchant/signup"
                className="btn-ink mt-8 bg-flamingo-pink hover:bg-flamingo-pink-dark"
              >
                Start my ten minutes
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>

          <div className="md:col-span-7">
            <ol className="space-y-2">
              {[
                {
                  n: "01",
                  t: "Scan the QR on any Flamingo poster.",
                  d: "No app download. Any SA banking app works — Capitec, FNB, Absa, the lot.",
                },
                {
                  n: "02",
                  t: "Sign up. Wave at the camera.",
                  d: "Tiered KYC follows FICA's risk-based approach. Most merchants start trading immediately.",
                },
                {
                  n: "03",
                  t: "Get your unique Flamingo QR.",
                  d: "Linked directly to your bank account. Branded, printable, yours forever.",
                },
                {
                  n: "04",
                  t: "Stick it on the counter.",
                  d: "Or the window. Or the cooler box. Or the taxi dashboard. Up to you.",
                },
                {
                  n: "05",
                  t: "Listen for the ping. That's a sale. You're welcome.",
                  d: "Instant settlement. Instant notification. Instant vibe.",
                },
              ].map((s, i) => (
                <motion.li
                  key={s.n}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: i * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="group grid grid-cols-[auto_1fr] gap-6 py-6 border-b border-white/10"
                >
                  <span className="display-eyebrow text-xs text-flamingo-pink pt-2">
                    {s.n}
                  </span>
                  <div>
                    <h3
                      className="display font-black leading-[1.02] text-flamingo-cream"
                      style={{ fontSize: "clamp(1.5rem, 2.4vw, 2.25rem)", letterSpacing: "-0.02em" }}
                    >
                      {s.t}
                    </h3>
                    <p className="mt-2 text-white/60 leading-relaxed">{s.d}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ─────────────────── NUMBERS ─────────────────── */}
      <section id="numbers" className="relative bg-flamingo-cream py-28 noise">
        <div className="max-w-7xl mx-auto px-6 relative">
          <Reveal>
            <span className="display-eyebrow text-xs text-flamingo-pink-deep">The numbers</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              className="display mt-4 font-black text-flamingo-dark leading-[0.92] tracking-tight max-w-4xl"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)", letterSpacing: "-0.04em" }}
            >
              Cash is heavy.
              <br />
              <span className="italic text-gradient-flamingo">A ping isn&rsquo;t.</span>
            </h2>
          </Reveal>

          <RevealGroup className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              {
                stat: <>R<AnimatedCounter to={0} /></>,
                label: "Monthly fee",
                sub: "Not now. Not ever. You only pay when you get paid.",
              },
              {
                stat: <><AnimatedCounter to={10} /> min</>,
                label: "To first sale",
                sub: "From sign-up to a working till. Faster than a queue at Home Affairs.",
              },
              {
                stat: <><AnimatedCounter to={11} /></>,
                label: "SA languages",
                sub: "Because a vendor in KwaMashu should get the same experience as one in Stellenbosch.",
              },
            ].map((c, i) => (
              <RevealItem key={i}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="relative rounded-3xl border-2 border-flamingo-dark bg-white p-8 shadow-[0_8px_0_0_#1A1A2E]"
                >
                  <p
                    className="display font-black text-flamingo-dark tabular-nums leading-none"
                    style={{ fontSize: "clamp(3.5rem, 7vw, 6rem)", letterSpacing: "-0.04em" }}
                  >
                    {c.stat}
                  </p>
                  <p className="mt-5 display-eyebrow text-[10px] text-flamingo-pink-deep">
                    {c.label}
                  </p>
                  <p className="mt-2 text-flamingo-dark/70 leading-relaxed">{c.sub}</p>
                </motion.div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ─────────────────── PRICING ─────────────────── */}
      <section id="pricing" className="relative bg-mesh-cream py-28 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 relative text-center">
          <Reveal>
            <span className="display-eyebrow text-xs text-flamingo-pink-deep">Pricing</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              className="display mt-4 font-black text-flamingo-dark leading-[0.92] tracking-tight"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)", letterSpacing: "-0.04em" }}
            >
              One number.
              <br />
              <span className="italic text-gradient-flamingo">That&rsquo;s the whole page.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.18}>
            <motion.div
              whileHover={{ rotate: -0.4, y: -4 }}
              className="mt-14 mx-auto max-w-2xl rounded-[36px] bg-gradient-flamingo p-12 border-2 border-flamingo-dark shadow-[0_20px_60px_-20px_rgba(255,82,119,0.6)] text-white"
            >
              <p className="display-eyebrow text-[10px] text-white/80">Per transaction</p>
              <p
                className="display mt-3 font-black leading-none"
                style={{ fontSize: "clamp(5rem, 14vw, 10rem)", letterSpacing: "-0.05em" }}
              >
                1.5%
              </p>
              <p className="mt-6 text-white/90 text-lg max-w-md mx-auto">
                No monthly fee. No minimums. No small print you need a lawyer
                for. When the ping comes in, we take 1.5%. That&rsquo;s it.
              </p>
              <Link
                href="/merchant/signup"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-flamingo-pink-deep px-7 py-3.5 font-extrabold shadow-[0_6px_0_0_#1A1A2E] hover:-translate-y-0.5 transition"
              >
                Sign up my shop
                <span aria-hidden>→</span>
              </Link>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────── FINAL CTA ─────────────────── */}
      <section className="relative bg-flamingo-ink text-flamingo-cream py-28 overflow-hidden">
        <div className="absolute inset-0 grid-overlay" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-gradient-flamingo rounded-blob opacity-30 blur-2xl"
        />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <Reveal>
            <span className="display-eyebrow text-xs text-flamingo-pink">
              The only sticker your till needs
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              className="display mt-5 font-black leading-[0.88] tracking-tight"
              style={{ fontSize: "clamp(3rem, 9vw, 8rem)", letterSpacing: "-0.045em" }}
            >
              Your till
              <br />
              is one
              <br />
              <span className="italic text-flamingo-pink">sticker away.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/merchant/signup"
                className="btn-ink bg-flamingo-pink hover:bg-flamingo-pink-dark"
              >
                Become a till
                <span aria-hidden>→</span>
              </Link>
              <a
                href="https://wa.me/27639477208"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 border-flamingo-cream/30 px-6 py-4 font-extrabold text-flamingo-cream hover:bg-flamingo-cream hover:text-flamingo-ink transition"
              >
                WhatsApp us
                <span aria-hidden>→</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────── FOOTER ─────────────────── */}
      <footer className="bg-flamingo-ink text-white/70 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-5 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-full bg-gradient-flamingo border-2 border-white flex items-center justify-center text-white font-black">
                F
              </span>
              <span className="display font-extrabold text-2xl text-white">
                Flamingo<span className="text-flamingo-pink">.</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              The pink side of money. QR payments for South Africa&rsquo;s
              informal economy — because cash is heavy.
            </p>
          </div>
          <div>
            <p className="display-eyebrow text-[10px] text-white/90">Merchants</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/merchant/signup" className="hover:text-flamingo-pink">Sign up</Link></li>
              <li><a href="#how" className="hover:text-flamingo-pink">How it works</a></li>
              <li><a href="#pricing" className="hover:text-flamingo-pink">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="display-eyebrow text-[10px] text-white/90">Company</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Flamingo Pay (Pty) Ltd</li>
              <li>Reg No: 2026/276925/07</li>
              <li>A23, 10th Ave, Edenburg, Rivonia</li>
              <li>Sandton, 2091</li>
            </ul>
          </div>
          <div>
            <p className="display-eyebrow text-[10px] text-white/90">Legal</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/legal/privacy" className="hover:text-flamingo-pink">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-flamingo-pink">Merchant Terms</Link></li>
              <li><a href="mailto:compliance@flamingopay.co.za" className="hover:text-flamingo-pink">Compliance</a></li>
            </ul>
          </div>
          <div>
            <p className="display-eyebrow text-[10px] text-white/90">Reach us</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="mailto:info@flamingopay.co.za" className="hover:text-flamingo-pink">info@flamingopay.co.za</a></li>
              <li><a href="tel:+27639477208" className="hover:text-flamingo-pink">063 947 7208</a></li>
              <li><a href="https://www.flamingopay.co.za" className="hover:text-flamingo-pink">www.flamingopay.co.za</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <p>© 2026 Flamingo Pay (Pty) Ltd. All rights reserved. No flamingos were harmed.</p>
            <div className="flex items-center gap-3">
              <Link href="/legal/privacy" className="hover:text-flamingo-pink">Privacy</Link>
              <span aria-hidden className="text-white/30">·</span>
              <Link href="/legal/terms" className="hover:text-flamingo-pink">Terms</Link>
              <span aria-hidden className="text-white/30">·</span>
              <span>Payment Facilitator · FICA &amp; POPIA compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Dot() {
  return <span aria-hidden className="inline-block w-1 h-1 rounded-full bg-flamingo-pink" />;
}
