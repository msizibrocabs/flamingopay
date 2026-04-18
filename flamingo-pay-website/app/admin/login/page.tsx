"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminSignIn, DEMO_ADMIN_PASSCODE } from "../../../lib/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (code !== DEMO_ADMIN_PASSCODE) {
      setError("Incorrect staff passcode.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      adminSignIn(name.trim());
      router.push("/admin");
    }, 400);
  }

  return (
    <main className="min-h-dvh bg-flamingo-cream">
      <div className="mx-auto flex max-w-md flex-col px-5 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_6px_0_0_#1A1A2E]">
            <span className="display text-4xl font-extrabold text-white">F</span>
          </div>
          <h1 className="display mt-4 text-3xl font-extrabold text-flamingo-dark">
            Flamingo Admin
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/70">
            Internal console — staff sign-in
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]"
        >
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
              Your name
            </span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-base font-semibold text-flamingo-dark outline-none"
              placeholder="e.g. Msizi Mtolo"
              required
            />
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
              Staff passcode
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-base font-semibold tracking-widest text-flamingo-dark outline-none"
              placeholder="••••••••"
              required
            />
          </label>

          {error && (
            <p className="mt-3 rounded-lg bg-flamingo-pink-soft px-3 py-2 text-sm font-semibold text-flamingo-pink-deep">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-pink mt-5 w-full rounded-2xl border-2 border-flamingo-dark px-4 py-3.5 text-base font-extrabold uppercase tracking-wide disabled:opacity-70"
          >
            {loading ? "Signing in…" : "Enter console"}
          </button>

        </form>

        <p className="mt-4 text-center text-[11px] text-flamingo-dark/50">
          Admin access only. Contact your Flamingo team lead for credentials.
        </p>
      </div>
    </main>
  );
}
