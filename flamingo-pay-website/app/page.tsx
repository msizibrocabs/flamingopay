"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Reveal, RevealGroup, RevealItem } from "../components/motion/Reveal";
import { AnimatedCounter } from "../components/motion/AnimatedCounter";
import { MagneticButton } from "../components/motion/MagneticButton";
import { FlamingoHero } from "../components/three/FlamingoHero";
import { QRBadge } from "../components/QRBadge";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.1]);

  return (
    <div className="bg-flamingo-cream antialiased w-full overflow-x-hidden">
      {/* ─────────────────── NAV ─────────────────── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 glass border-b-2 border-flamingo-dark"
      >
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-flamingo text-white font-black shadow-[0_6px_20px_-6px_rgba(255,82,119,0.8)]">
              F
              <span className="absolute inset-0 rounded-full pulse-ring" />
            </span>
            <span className="display font-extrabold text-2xl">
              Flamingo<span className="text-flamingo-pink">.</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a href="#how" className="hover:text-flamingo-pink transition">How it works</a>
            <a href="#why" className="hover:text-flamingo-pink transition">Why it works</a>
            <a href="#merchants" className="hover:text-flamingo-pink transition">For shops</a>
          </nav>
          <MagneticButton
            onClick={() => (window.location.href = "/merchant/signup")}
            className="btn-pink rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Get my QR
          </MagneticButton>
        </div>
      </motion.header>

      {/* ─────────────────── HERO ─────────────────── */}
      <section ref={heroRef} className="relative bg-gradient-sunrise noise overflow-hidden">
        {/* Parallax blobs */}
        <motion.div
          style={{ y: heroParallax }}
          className="absolute top-24 -left-20 w-72 h-72 bg-flamingo-butter rounded-blob opacity-90 -z-0"
        />
        <motion.div
          style={{ y: heroParallax }}
          className="absolute -top-10 right-10 w-56 h-56 bg-flamingo-mint rounded-blob opacity-90 -z-0"
        />
        <motion.div
          style={{ y: heroParallax }}
          className="absolute bottom-16 right-1/3 w-40 h-40 bg-flamingo-sky rounded-full opacity-70 -z-0"
        />

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative max-w-7xl mx-auto px-6 pt-16 pb-28 grid md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <Reveal>
              <span className="chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-flamingo-pink opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-flamingo-pink" />
                </span>
                Proudly SA · Running on PayShap
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="display mt-6 text-6xl md:text-7xl font-black leading-[1]">
                The <span className="text-gradient-flamingo">pink</span> side<br />of money.
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 text-lg text-flamingo-dark/80 max-w-lg leading-relaxed">
                One QR. Every bank. No card machine, no monthly fees, no &ldquo;ag sorry, I don&rsquo;t have change&rdquo; awkwardness.
                Flamingo turns your phone into a till in the time it takes to boil a kettle.
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <MagneticButton
                  onClick={() => (window.location.href = "/merchant/signup")}
                  className="btn-pink rounded-full px-7 py-4 font-bold"
                >
                  Sign up my shop →
                </MagneticButton>
                <a href="#how" className="btn-dark rounded-full px-7 py-4 font-bold">
                  Show me how
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.5}>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-medium text-flamingo-dark/70">
                <div className="flex items-center gap-2"><span className="text-flamingo-pink text-lg">●</span> 10-min sign-up</div>
                <div className="flex items-center gap-2"><span className="text-flamingo-pink text-lg">●</span> R0 hardware</div>
                <div className="flex items-center gap-2"><span className="text-flamingo-pink text-lg">●</span> Instant settlement</div>
              </div>
            </Reveal>
          </div>

          {/* 3D Flamingo + QR composition */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="relative aspect-square w-full">
              <FlamingoHero />
            </div>
            {/* Floating QR badge */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: -6 }}
              animate={{ opacity: 1, y: 0, rotate: -6 }}
              transition={{ delay: 0.9, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-4 left-0 tilt-l hidden sm:block"
            >
              <QRBadge size={160} label="Thandi's Spaza" initial={45} />
            </motion.div>
            {/* Floating "+R45 ✓" toast */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotate: 4 }}
              animate={{ opacity: 1, x: 0, rotate: 4 }}
              transition={{ delay: 1.1, duration: 0.7 }}
              className="absolute top-6 right-0 tilt-r"
            >
              <div className="rounded-full bg-flamingo-dark text-white px-4 py-2.5 text-sm font-black shadow-[0_10px_25px_-8px_rgba(26,26,46,0.5)]">
                +R45.00 ✓
              </div>
            </motion.div>
          </div>
        </motion.div>

        <svg className="block w-full -mb-1" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40 Q 360 80 720 40 T 1440 40 L1440 80 L0 80 Z" fill="#FF5277" />
        </svg>
      </section>

      {/* ─────────────────── MARQUEE TICKER ─────────────────── */}
      <section className="bg-flamingo-pink text-white py-5 border-y-2 border-flamingo-dark overflow-hidden">
        <div className="marquee-track text-lg font-bold whitespace-nowrap">
          {[...Array(2)].map((_, loop) => (
            <div key={loop} className="flex items-center gap-10 pr-10">
              <span>🌸 One QR, every bank</span>
              <span className="opacity-50">✦</span>
              <span>⚡ Money in seconds, not days</span>
              <span className="opacity-50">✦</span>
              <span>📱 Phone = till</span>
              <span className="opacity-50">✦</span>
              <span>🇿🇦 Built for the corner shop</span>
              <span className="opacity-50">✦</span>
              <span>🦩 No card machine. No monthly fee.</span>
              <span className="opacity-50">✦</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── THREE BENEFITS ─────────────────── */}
      <section className="relative bg-mesh-cream noise py-24">
        <div className="absolute top-20 right-10 w-40 h-40 bg-flamingo-butter rounded-blob opacity-70" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <Reveal>
            <div className="max-w-2xl mb-14">
              <p className="font-bold uppercase tracking-widest text-flamingo-pink text-sm">Why people love it</p>
              <h2 className="display mt-3 text-5xl font-black">
                Three <span className="underline-squiggle">big</span> reasons.
              </h2>
              <p className="mt-3 text-flamingo-dark/70 text-lg">
                (Yes, there are more. We kept the list short so your tea doesn&rsquo;t go cold.)
              </p>
            </div>
          </Reveal>

          <RevealGroup className="grid md:grid-cols-3 gap-8">
            {[
              {
                bg: "bg-flamingo-butter",
                icon: "⚡",
                title: "Money arrives in seconds.",
                body: "PayShap does the heavy lifting. Funds hit the merchant's account before the customer has even put their phone back in their pocket. No T+1, no T+2, no \"please hold\".",
              },
              {
                bg: "bg-flamingo-mint",
                icon: "⌁",
                title: "One QR, every bank.",
                body: "Capitec, FNB, TymeBank, Nedbank, Standard Bank, Absa — if it has a banking app, it can pay you. Buyers don't even download anything. Revolutionary, we know.",
              },
              {
                bg: "bg-flamingo-sky",
                icon: "✦",
                title: "No hardware. No vibes tax.",
                body: "No R3,000 card machine. No monthly fee. No \"but what if load-shedding?\" Just your phone, a printed QR, and the sound of money going ping.",
              },
            ].map((c, i) => (
              <RevealItem key={i}>
                <motion.div
                  whileHover={{ y: -6, rotate: i % 2 === 0 ? -1 : 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className={`${c.bg} card-stamp rounded-3xl p-8 relative cursor-default`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-flamingo-dark text-flamingo-butter flex items-center justify-center text-2xl font-black">
                    {c.icon}
                  </div>
                  <h3 className="display mt-5 text-2xl font-black">{c.title}</h3>
                  <p className="mt-3 text-flamingo-dark/80 leading-relaxed">{c.body}</p>
                </motion.div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ─────────────────── HOW IT WORKS ─────────────────── */}
      <section id="how" className="relative bg-white border-y-2 border-flamingo-dark py-24">
        <div className="absolute top-10 left-10 w-28 h-28 bg-flamingo-pink-soft rounded-blob" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <Reveal>
            <div className="max-w-2xl">
              <p className="font-bold uppercase tracking-widest text-flamingo-pink text-sm">How it works</p>
              <h2 className="display mt-3 text-5xl md:text-6xl font-black leading-[1.05]">
                Scan. Pay. Done.
                <br />
                <span className="italic text-flamingo-pink">(Five seconds, tops.)</span>
              </h2>
            </div>
          </Reveal>

          <div className="mt-16 grid md:grid-cols-2 gap-10">
            <Reveal direction="right">
              <motion.div
                whileHover={{ rotate: -0.5, y: -4 }}
                className="bg-flamingo-dark text-white rounded-3xl p-10 card-stamp-pink relative overflow-hidden"
              >
                <div className="grid-overlay absolute inset-0 opacity-60" />
                <div className="relative">
                  <p className="text-flamingo-pink font-bold text-sm uppercase tracking-wider">For shops &amp; vendors</p>
                  <h3 className="display mt-2 text-3xl font-black">Become a till in 10 minutes.</h3>
                  <ol className="mt-8 space-y-5">
                    {[
                      "Download the Flamingo app. Sign up. Wave at the camera.",
                      "Complete tiered KYC — most merchants start trading immediately.",
                      "Get your unique QR code, linked to your bank account.",
                      "Stick it on the counter. Or the window. Or the cooler box. Up to you.",
                      "Listen for the ping. That's a sale. You're welcome.",
                    ].map((text, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08, duration: 0.5 }}
                        className="flex gap-4"
                      >
                        <span className="w-9 h-9 shrink-0 bg-flamingo-pink rounded-full flex items-center justify-center font-black">
                          {i + 1}
                        </span>
                        <span>{text}</span>
                      </motion.li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            </Reveal>

            <Reveal direction="left" delay={0.1}>
              <motion.div
                whileHover={{ rotate: 0.5, y: -4 }}
                className="bg-flamingo-pink-wash rounded-3xl p-10 card-stamp"
              >
                <p className="text-flamingo-pink-dark font-bold text-sm uppercase tracking-wider">For buyers</p>
                <h3 className="display mt-2 text-3xl font-black">No app. No queue. No drama.</h3>
                <ol className="mt-8 space-y-5 text-flamingo-dark">
                  {[
                    "Open your usual banking app (whichever one you yell at about fees).",
                    "Scan the merchant's Flamingo QR.",
                    "Type the amount. Confirm.",
                    "Receipt. Done. Goodbye, ATM queue.",
                  ].map((text, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      className="flex gap-4"
                    >
                      <span className="w-9 h-9 shrink-0 bg-flamingo-pink text-white rounded-full flex items-center justify-center font-black">
                        {i + 1}
                      </span>
                      <span>{text}</span>
                    </motion.li>
                  ))}
                </ol>
                <p className="mt-6 text-sm text-flamingo-dark/70 italic">
                  Fun fact: this takes roughly the same time as reading this sentence.
                </p>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────────────────── WHY IT WORKS ─────────────────── */}
      <section id="why" className="relative bg-gradient-midnight text-white py-24 overflow-hidden">
        <div className="absolute inset-0 grid-overlay" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-flamingo-pink/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-72 h-72 bg-flamingo-pink/15 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <Reveal>
            <div className="max-w-2xl">
              <p className="font-bold uppercase tracking-widest text-flamingo-pink text-sm">Why it works</p>
              <h2 className="display mt-3 text-5xl md:text-6xl font-black leading-[1.05]">
                Built for the way SA
                <br />
                <span className="underline-squiggle">actually</span> trades.
              </h2>
              <p className="mt-5 text-white/70 text-lg">
                Everyone else designed for the boardroom. We designed for the auntie at the corner who runs half the economy with a lever arch file and a prayer.
              </p>
            </div>
          </Reveal>

          <RevealGroup className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              {
                stat: (
                  <>
                    R<AnimatedCounter to={100} />bn+
                  </>
                ),
                title: "PayShap, to date",
                body: "The rail is real, it's fast, and it's already everywhere. We just make it useful for the corner shop.",
              },
              {
                stat: (
                  <>
                    &lt;<AnimatedCounter to={5} />%
                  </>
                ),
                title: "Of informal shops go digital",
                body: "Which is a polite way of saying: the biggest payments opportunity in the country has been sitting right here the whole time.",
              },
              {
                stat: "✓",
                title: "KYC that actually fits reality",
                body: "Our tiered flow follows FICA's risk-based approach — so a vendor with a RICA'd phone can start trading today, not next month.",
              },
            ].map((c, i) => (
              <RevealItem key={i}>
                <motion.div
                  whileHover={{ y: -6, borderColor: "#FF5277" }}
                  className="glass-dark rounded-3xl p-7 hover:border-flamingo-pink transition cursor-default"
                >
                  <p className="display text-flamingo-pink font-black text-5xl">{c.stat}</p>
                  <p className="mt-3 font-bold text-lg">{c.title}</p>
                  <p className="mt-2 text-sm text-white/60">{c.body}</p>
                </motion.div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ─────────────────── MERCHANT CTA ─────────────────── */}
      <section id="merchants" className="relative overflow-hidden bg-gradient-flamingo py-24">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-10 left-10 w-28 h-28 bg-flamingo-butter rounded-blob opacity-80" />
        <div className="absolute bottom-10 right-20 w-36 h-36 bg-flamingo-mint rounded-blob opacity-80" />

        <div className="relative max-w-5xl mx-auto px-6 text-center text-white">
          <Reveal>
            <p className="font-bold uppercase tracking-widest text-sm text-white/90">For shops &amp; vendors</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="display mt-3 text-5xl md:text-7xl font-black leading-[1.02]">
              Turn your phone
              <br />
              into a till.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="display italic mt-4 text-2xl md:text-3xl font-bold">
              In ten minutes. In your language. For free.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mt-6 max-w-2xl mx-auto text-white/90 text-lg">
              No card machine. No monthly fee. No bank lock-in. Just a universal QR, instant PayShap settlement, and one less reason to ever hear the words &ldquo;card is declined&rdquo; again.
            </p>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <MagneticButton
                onClick={() => (window.location.href = "/merchant/signup")}
                className="bg-white text-flamingo-pink-dark hover:bg-flamingo-cream px-8 py-4 rounded-full font-black shadow-[0_6px_0_0_#1A1A2E] transition"
              >
                Sign up my shop →
              </MagneticButton>
              <a href="#how" className="btn-dark rounded-full px-8 py-4 font-bold">
                How it works
              </a>
            </div>
            <p className="mt-8 text-sm text-white/80">
              2.9% + R0.99 per transaction. No subscription. No minimums. No small print you need a lawyer for.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────── FOOTER ─────────────────── */}
      <footer className="bg-flamingo-ink text-white/70 border-t-2 border-flamingo-pink relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-30" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
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
              The pink side of money. QR payments for South Africa&rsquo;s informal economy — because cash is heavy.
            </p>
          </div>
          <div>
            <p className="text-white font-bold text-sm uppercase tracking-wider">Product</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#how" className="hover:text-flamingo-pink">How it works</a></li>
              <li><a href="#why" className="hover:text-flamingo-pink">Why Flamingo</a></li>
              <li><a href="#merchants" className="hover:text-flamingo-pink">For shops</a></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-bold text-sm uppercase tracking-wider">Company</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Flamingo Pay (Pty) Ltd</li>
              <li>Reg No: 2026/276925/07</li>
              <li>A23, 10th Ave, Edenburg, Rivonia</li>
              <li>Sandton, 2091</li>
            </ul>
          </div>
          <div>
            <p className="text-white font-bold text-sm uppercase tracking-wider">Say hi</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="mailto:info@flamingopay.co.za" className="hover:text-flamingo-pink">info@flamingopay.co.za</a></li>
              <li><a href="tel:+27639477208" className="hover:text-flamingo-pink">063 947 7208</a></li>
              <li><a href="https://www.flamingopay.co.za" className="hover:text-flamingo-pink">www.flamingopay.co.za</a></li>
            </ul>
          </div>
        </div>
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <p>© 2026 Flamingo Pay (Pty) Ltd. All rights reserved. No flamingos were harmed.</p>
            <p>Operating under a Payment Facilitator model · FICA &amp; POPIA compliant</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
