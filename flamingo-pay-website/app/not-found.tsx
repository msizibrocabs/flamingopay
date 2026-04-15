import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-flamingo-cream flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_6px_0_0_#1A1A2E]">
          <span className="display text-5xl font-extrabold text-white">?</span>
        </div>

        <h1 className="display mt-6 text-4xl font-extrabold text-flamingo-dark">
          Page not found
        </h1>
        <p className="mt-3 text-flamingo-dark/70">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been
          moved. Maybe the URL has a typo?
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="btn-pink rounded-full px-6 py-3 font-bold"
          >
            Go home
          </Link>
          <Link
            href="/merchant/login"
            className="btn-dark rounded-full px-6 py-3 font-bold"
          >
            Merchant login
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2">
          <span className="w-6 h-6 rounded-full bg-flamingo-pink flex items-center justify-center text-white text-xs font-black">
            F
          </span>
          <span className="text-xs text-flamingo-dark/40">
            Flamingo Pay &middot; The pink side of money
          </span>
        </div>
      </div>
    </div>
  );
}
