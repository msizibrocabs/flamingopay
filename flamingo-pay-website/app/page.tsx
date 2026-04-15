export default function Home() {
  return (
    <div className="bg-flamingo-cream antialiased overflow-x-hidden w-full">
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-flamingo-cream/95 backdrop-blur border-b-2 border-flamingo-dark">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-full bg-flamingo-pink border-2 border-flamingo-dark flex items-center justify-center text-white font-black">F</span>
            <span className="display font-extrabold text-2xl">Flamingo<span className="text-flamingo-pink">.</span></span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a href="#how" className="hover:text-flamingo-pink transition">How it works</a>
            <a href="#why" className="hover:text-flamingo-pink transition">Why it works</a>
            <a href="#merchants" className="hover:text-flamingo-pink transition">For shops</a>
          </nav>
          <a href="/merchant/signup" className="btn-pink rounded-full px-5 py-2.5 text-sm font-bold">
            Get my QR
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute top-20 -left-16 w-72 h-72 bg-flamingo-butter rounded-blob -z-0"></div>
        <div className="absolute -top-10 right-10 w-56 h-56 bg-flamingo-mint rounded-blob -z-0"></div>
        <div className="absolute bottom-10 right-1/3 w-40 h-40 bg-flamingo-sky rounded-full -z-0 opacity-80"></div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold">
              <span className="w-2 h-2 bg-flamingo-pink rounded-full animate-pulse"></span>
              Proudly SA · Running on PayShap
            </span>
            <h1 className="display mt-6 text-6xl md:text-7xl font-black leading-[1]">
              The <span className="underline-squiggle">pink</span> side<br/>of money.
            </h1>
            <p className="mt-6 text-lg text-flamingo-dark/80 max-w-lg leading-relaxed">
              One QR. Every bank. No card machine, no monthly fees, no &ldquo;ag sorry, I don&rsquo;t have change&rdquo; awkwardness.
              Flamingo turns your phone into a till in the time it takes to boil a kettle.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="/merchant/signup" className="btn-pink rounded-full px-7 py-4 font-bold">
                Sign up my shop →
              </a>
              <a href="#how" className="btn-dark rounded-full px-7 py-4 font-bold">
                Show me how
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-medium text-flamingo-dark/70">
              <div className="flex items-center gap-2"><span className="text-flamingo-pink text-lg">●</span> 10-min sign-up</div>
              <div className="flex items-center gap-2"><span className="text-flamingo-pink text-lg">●</span> R0 hardware</div>
              <div className="flex items-center gap-2"><span className="text-flamingo-pink text-lg">●</span> Instant settlement</div>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative mx-auto w-full max-w-lg">
            <svg viewBox="0 0 480 520" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="240" cy="470" rx="200" ry="22" fill="#1A1A2E" opacity="0.08"/>
              <rect x="60" y="210" width="360" height="200" rx="18" fill="#FFD6E0" stroke="#1A1A2E" strokeWidth="3"/>
              <path d="M40 210 L60 170 L420 170 L440 210 Z" fill="#FF5277" stroke="#1A1A2E" strokeWidth="3"/>
              <path d="M100 170 L90 210 M160 170 L140 210 M220 170 L200 210 M280 170 L260 210 M340 170 L320 210 M400 170 L380 210" stroke="#FFF7F3" strokeWidth="6"/>
              <rect x="140" y="185" width="200" height="36" rx="8" fill="#1A1A2E"/>
              <text x="240" y="209" textAnchor="middle" fill="#FFD6E0" fontFamily="Fraunces, serif" fontWeight="800" fontSize="18">Thandi&apos;s Spaza</text>
              <rect x="85" y="250" width="140" height="6" fill="#1A1A2E"/>
              <rect x="85" y="310" width="140" height="6" fill="#1A1A2E"/>
              <ellipse cx="115" cy="244" rx="22" ry="10" fill="#F5C17A" stroke="#1A1A2E" strokeWidth="2"/>
              <rect x="150" y="220" width="22" height="26" fill="#fff" stroke="#1A1A2E" strokeWidth="2"/>
              <rect x="185" y="222" width="20" height="24" rx="2" fill="#C6F3D8" stroke="#1A1A2E" strokeWidth="2"/>
              <circle cx="110" cy="300" r="10" fill="#FF5277" stroke="#1A1A2E" strokeWidth="2"/>
              <circle cx="135" cy="300" r="10" fill="#FF5277" stroke="#1A1A2E" strokeWidth="2"/>
              <circle cx="160" cy="300" r="10" fill="#FF5277" stroke="#1A1A2E" strokeWidth="2"/>
              <rect x="255" y="230" width="140" height="160" rx="10" fill="#fff" stroke="#1A1A2E" strokeWidth="3"/>
              <text x="325" y="252" textAnchor="middle" fill="#1A1A2E" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="12">SCAN TO PAY</text>
              <g transform="translate(275 260)" fill="#1A1A2E">
                <rect x="0" y="0" width="100" height="100" fill="#fff"/>
                <rect x="0" y="0" width="28" height="28"/>
                <rect x="6" y="6" width="16" height="16" fill="#fff"/>
                <rect x="10" y="10" width="8" height="8"/>
                <rect x="72" y="0" width="28" height="28"/>
                <rect x="78" y="6" width="16" height="16" fill="#fff"/>
                <rect x="82" y="10" width="8" height="8"/>
                <rect x="0" y="72" width="28" height="28"/>
                <rect x="6" y="78" width="16" height="16" fill="#fff"/>
                <rect x="10" y="82" width="8" height="8"/>
                <rect x="40" y="10" width="8" height="8"/>
                <rect x="52" y="20" width="8" height="8"/>
                <rect x="40" y="40" width="8" height="8"/>
                <rect x="60" y="40" width="8" height="8"/>
                <rect x="40" y="60" width="8" height="8"/>
                <rect x="80" y="60" width="8" height="8"/>
                <rect x="60" y="80" width="8" height="8"/>
                <rect x="80" y="80" width="8" height="8"/>
                <rect x="30" y="30" width="8" height="8"/>
                <rect x="20" y="50" width="8" height="8"/>
                <rect x="90" y="40" width="8" height="8"/>
              </g>
              <circle cx="325" cy="335" r="14" fill="#FF5277" stroke="#1A1A2E" strokeWidth="3"/>
              <text x="325" y="340" textAnchor="middle" fill="#fff" fontFamily="DM Sans" fontWeight="800" fontSize="14">F</text>
              <circle cx="170" cy="360" r="22" fill="#F2B48E" stroke="#1A1A2E" strokeWidth="3"/>
              <path d="M150 360 q20 -25 40 0" fill="none" stroke="#1A1A2E" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="163" cy="358" r="2.5" fill="#1A1A2E"/>
              <circle cx="177" cy="358" r="2.5" fill="#1A1A2E"/>
              <path d="M158 368 q12 8 24 0" fill="none" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M148 338 q22 -18 44 0" fill="#1A1A2E"/>
              <g transform="translate(80 370)">
                <circle cx="0" cy="0" r="20" fill="#D9A36A" stroke="#1A1A2E" strokeWidth="3"/>
                <circle cx="-6" cy="-2" r="2.2" fill="#1A1A2E"/>
                <circle cx="6" cy="-2" r="2.2" fill="#1A1A2E"/>
                <path d="M-7 8 q7 6 14 0" fill="none" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M-16 -12 q16 -14 32 0" fill="#1A1A2E"/>
                <rect x="-35" y="20" width="70" height="80" rx="14" fill="#FF5277" stroke="#1A1A2E" strokeWidth="3"/>
                <rect x="-26" y="30" width="52" height="52" rx="6" fill="#fff"/>
                <g transform="translate(-22 34)" fill="#1A1A2E">
                  <rect x="0" y="0" width="10" height="10"/>
                  <rect x="34" y="0" width="10" height="10"/>
                  <rect x="0" y="34" width="10" height="10"/>
                  <rect x="18" y="18" width="6" height="6"/>
                  <rect x="28" y="8" width="4" height="4"/>
                  <rect x="8" y="28" width="4" height="4"/>
                </g>
                <circle cx="0" cy="92" r="4" fill="#fff"/>
              </g>
              <g transform="translate(230 150)" className="tilt-r">
                <rect x="-46" y="-20" width="92" height="40" rx="20" fill="#1A1A2E"/>
                <text x="0" y="5" textAnchor="middle" fill="#fff" fontFamily="DM Sans" fontWeight="800" fontSize="14">+R45.00 ✓</text>
              </g>
              <g fill="#FF5277">
                <path d="M420 90 l4 12 12 4 -12 4 -4 12 -4 -12 -12 -4 12 -4z"/>
                <path d="M50 120 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3z"/>
              </g>
            </svg>
          </div>
        </div>
        <svg className="block w-full -mb-1" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40 Q 360 80 720 40 T 1440 40 L1440 80 L0 80 Z" fill="#FF5277"/>
        </svg>
      </section>

      {/* TICKER */}
      <section className="bg-flamingo-pink text-white py-5 border-y-2 border-flamingo-dark">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-sm md:text-base font-bold">
          <span>🌸 One QR, every bank</span>
          <span className="opacity-50">✦</span>
          <span>⚡ Money in seconds, not days</span>
          <span className="opacity-50">✦</span>
          <span>📱 Phone = till</span>
          <span className="opacity-50">✦</span>
          <span>🇿🇦 Built for the corner shop</span>
        </div>
      </section>

      {/* THREE BENEFITS */}
      <section className="relative bg-flamingo-cream py-24">
        <div className="absolute top-20 right-10 w-40 h-40 bg-flamingo-butter rounded-blob opacity-70"></div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-2xl mb-14">
            <p className="font-bold uppercase tracking-widest text-flamingo-pink text-sm">Why people love it</p>
            <h2 className="display mt-3 text-5xl font-black">Three <span className="underline-squiggle">big</span> reasons.</h2>
            <p className="mt-3 text-flamingo-dark/70 text-lg">(Yes, there are more. We kept the list short so your tea doesn&rsquo;t go cold.)</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-flamingo-butter card-stamp rounded-3xl p-8 relative">
              <div className="w-14 h-14 rounded-2xl bg-flamingo-dark text-flamingo-butter flex items-center justify-center text-2xl font-black">⚡</div>
              <h3 className="display mt-5 text-2xl font-black">Money arrives in seconds.</h3>
              <p className="mt-3 text-flamingo-dark/80 leading-relaxed">
                PayShap does the heavy lifting. Funds hit the merchant&rsquo;s account before the customer has even put their phone back in their pocket. No T+1, no T+2, no &ldquo;please hold&rdquo;.
              </p>
            </div>
            <div className="bg-flamingo-mint card-stamp rounded-3xl p-8 relative">
              <div className="w-14 h-14 rounded-2xl bg-flamingo-dark text-flamingo-mint flex items-center justify-center text-2xl font-black">⌁</div>
              <h3 className="display mt-5 text-2xl font-black">One QR, every bank.</h3>
              <p className="mt-3 text-flamingo-dark/80 leading-relaxed">
                Capitec, FNB, TymeBank, Nedbank, Standard Bank, Absa — if it has a banking app, it can pay you. Buyers don&rsquo;t even download anything. Revolutionary, we know.
              </p>
            </div>
            <div className="bg-flamingo-sky card-stamp rounded-3xl p-8 relative">
              <div className="w-14 h-14 rounded-2xl bg-flamingo-dark text-flamingo-sky flex items-center justify-center text-2xl font-black">✦</div>
              <h3 className="display mt-5 text-2xl font-black">No hardware. No vibes tax.</h3>
              <p className="mt-3 text-flamingo-dark/80 leading-relaxed">
                No R3,000 card machine. No monthly fee. No &ldquo;but what if load-shedding?&rdquo; Just your phone, a printed QR, and the sound of money going ping.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative bg-white border-y-2 border-flamingo-dark py-24">
        <div className="absolute top-10 left-10 w-28 h-28 bg-flamingo-pink-soft rounded-blob"></div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-2xl">
            <p className="font-bold uppercase tracking-widest text-flamingo-pink text-sm">How it works</p>
            <h2 className="display mt-3 text-5xl md:text-6xl font-black leading-[1.05]">
              Scan. Pay. Done.<br/><span className="italic text-flamingo-pink">(Five seconds, tops.)</span>
            </h2>
          </div>

          <div className="mt-16 grid md:grid-cols-2 gap-10">
            <div className="bg-flamingo-dark text-white rounded-3xl p-10 card-stamp-pink">
              <p className="text-flamingo-pink font-bold text-sm uppercase tracking-wider">For shops &amp; vendors</p>
              <h3 className="display mt-2 text-3xl font-black">Become a till in 10 minutes.</h3>
              <ol className="mt-8 space-y-5">
                <li className="flex gap-4"><span className="w-9 h-9 shrink-0 bg-flamingo-pink rounded-full flex items-center justify-center font-black">1</span><span>Download the Flamingo app. Sign up. Wave at the camera.</span></li>
                <li className="flex gap-4"><span className="w-9 h-9 shrink-0 bg-flamingo-pink rounded-full flex items-center justify-center font-black">2</span><span>Complete tiered KYC — most merchants start trading immediately.</span></li>
                <li className="flex gap-4"><span className="w-9 h-9 shrink-0 bg-flamingo-pink rounded-full flex items-center justify-center font-black">3</span><span>Get your unique QR code, linked to your bank account.</span></li>
                <li className="flex gap-4"><span className="w-9 h-9 shrink-0 bg-flamingo-pink rounded-full flex items-center justify-center font-black">4</span><span>Stick it on the counter. Or the window. Or the cooler box. Up to you.</span></li>
                <li className="flex gap-4"><span className="w-9 h-9 shrink-0 bg-flamingo-pink rounded-full flex items-center justify-center font-black">5</span><span>Listen for the <em>ping</em>. That&rsquo;s a sale. You&rsquo;re welcome.</span></li>
              </ol>
            </div>

            <div className="bg-flamingo-pink-wash rounded-3xl p-10 card-stamp">
              <p className="text-flamingo-pink-dark font-bold text-sm uppercase tracking-wider">For buyers</p>
              <h3 className="display mt-2 text-3xl font-black">No app. No queue. No drama.</h3>
              <ol className="mt-8 space-y-5 text-flamingo-dark">
                <li className="flex gap-4"><span className="w-9 h-9 shrink-0 bg-flamingo-pink text-white rounded-full flex items-center justify-center font-black">1</span><span>Open your usual banking app (whichever one you yell at about fees).</span></li>
                <li className="flex gap-4"><span className="w-9 h-9 shrink-0 bg-flamingo-pink text-white rounded-full flex items-center justify-center font-black">2</span><span>Scan the merchant&rsquo;s Flamingo QR.</span></li>
                <li className="flex gap-4"><span className="w-9 h-9 shrink-0 bg-flamingo-pink text-white rounded-full flex items-center justify-center font-black">3</span><span>Type the amount. Confirm.</span></li>
                <li className="flex gap-4"><span className="w-9 h-9 shrink-0 bg-flamingo-pink text-white rounded-full flex items-center justify-center font-black">4</span><span>Receipt. Done. Goodbye, ATM queue.</span></li>
              </ol>
              <p className="mt-6 text-sm text-flamingo-dark/70 italic">
                Fun fact: this takes roughly the same time as reading this sentence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY IT WORKS */}
      <section id="why" className="relative bg-flamingo-dark text-white py-24 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-flamingo-pink/25 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -left-20 w-72 h-72 bg-flamingo-pink/15 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-2xl">
            <p className="font-bold uppercase tracking-widest text-flamingo-pink text-sm">Why it works</p>
            <h2 className="display mt-3 text-5xl md:text-6xl font-black leading-[1.05]">
              Built for the way SA<br/><span className="underline-squiggle">actually</span> trades.
            </h2>
            <p className="mt-5 text-white/70 text-lg">
              Everyone else designed for the boardroom. We designed for the auntie at the corner who runs half the economy with a lever arch file and a prayer.
            </p>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 border-2 border-white/10 rounded-3xl p-7 hover:border-flamingo-pink transition">
              <p className="display text-flamingo-pink font-black text-5xl">R100bn+</p>
              <p className="mt-3 font-bold text-lg">PayShap, to date</p>
              <p className="mt-2 text-sm text-white/60">The rail is real, it&rsquo;s fast, and it&rsquo;s already everywhere. We just make it useful for the corner shop.</p>
            </div>
            <div className="bg-white/5 border-2 border-white/10 rounded-3xl p-7 hover:border-flamingo-pink transition">
              <p className="display text-flamingo-pink font-black text-5xl">&lt;5%</p>
              <p className="mt-3 font-bold text-lg">Of informal shops go digital</p>
              <p className="mt-2 text-sm text-white/60">Which is a polite way of saying: the biggest payments opportunity in the country has been sitting right here the whole time.</p>
            </div>
            <div className="bg-white/5 border-2 border-white/10 rounded-3xl p-7 hover:border-flamingo-pink transition">
              <p className="display text-flamingo-pink font-black text-5xl">✓</p>
              <p className="mt-3 font-bold text-lg">KYC that actually fits reality</p>
              <p className="mt-2 text-sm text-white/60">Our tiered flow follows FICA&rsquo;s risk-based approach — so a vendor with a RICA&rsquo;d phone can start trading today, not next month.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MERCHANT CTA */}
      <section id="merchants" className="relative overflow-hidden bg-flamingo-pink py-24">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-10 left-10 w-28 h-28 bg-flamingo-butter rounded-blob opacity-80"></div>
        <div className="absolute bottom-10 right-20 w-36 h-36 bg-flamingo-mint rounded-blob opacity-80"></div>

        <div className="relative max-w-5xl mx-auto px-6 text-center text-white">
          <p className="font-bold uppercase tracking-widest text-sm text-white/90">For shops &amp; vendors</p>
          <h2 className="display mt-3 text-5xl md:text-7xl font-black leading-[1.02]">
            Turn your phone<br/>into a till.
          </h2>
          <p className="display italic mt-4 text-2xl md:text-3xl font-bold">In ten minutes. In your language. For free.</p>
          <p className="mt-6 max-w-2xl mx-auto text-white/90 text-lg">
            No card machine. No monthly fee. No bank lock-in. Just a universal QR, instant PayShap settlement, and one less reason to ever hear the words &ldquo;card is declined&rdquo; again.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href="/merchant/signup" className="bg-white text-flamingo-pink-dark hover:bg-flamingo-cream px-8 py-4 rounded-full font-black shadow-[0_6px_0_0_#1A1A2E] active:shadow-none active:translate-y-1.5 transition">
              Sign up my shop →
            </a>
            <a href="#how" className="btn-dark rounded-full px-8 py-4 font-bold">
              How it works
            </a>
          </div>
          <p className="mt-8 text-sm text-white/80">2.9% + R0.99 per transaction. No subscription. No minimums. No small print you need a lawyer for.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-flamingo-dark-2 text-white/70 border-t-2 border-flamingo-pink">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-full bg-flamingo-pink border-2 border-white flex items-center justify-center text-white font-black">F</span>
              <span className="display font-extrabold text-2xl text-white">Flamingo<span className="text-flamingo-pink">.</span></span>
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
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <p>© 2026 Flamingo Pay (Pty) Ltd. All rights reserved. No flamingos were harmed.</p>
            <p>Operating under a Payment Facilitator model · FICA &amp; POPIA compliant</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
