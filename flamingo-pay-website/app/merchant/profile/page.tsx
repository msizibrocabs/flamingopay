"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MerchantGate } from "../_components/MerchantGate";
import { TabBar } from "../_components/TabBar";
import { TopBar } from "../_components/TopBar";
import { LanguagePicker } from "../_components/LanguagePicker";
import { DEMO_MERCHANT, signOut } from "../../../lib/merchant";
import { LANGUAGES, useI18n } from "../../../lib/i18n";

export default function ProfilePage() {
  return (
    <MerchantGate>
      <Inner />
    </MerchantGate>
  );
}

function Inner() {
  const router = useRouter();
  const [confirmOut, setConfirmOut] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const { lang, t } = useI18n();
  const currentLang = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  function handleSignOut() {
    signOut();
    router.replace("/merchant/login");
  }

  const m = DEMO_MERCHANT;

  return (
    <main className="min-h-dvh bg-flamingo-cream pb-28">
      <TopBar title={t("nav_profile")} subtitle={t("business_account")} />

      <div className="mx-auto max-w-md px-4">
        {/* Business card */}
        <section className="mt-4 rounded-3xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 flex-none place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_4px_0_0_#1A1A2E]">
              <span className="display text-3xl font-extrabold text-white">
                {m.name.charAt(0)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="display truncate text-xl font-extrabold text-flamingo-dark">
                {m.name}
              </h2>
              <p className="truncate text-sm text-flamingo-dark/70">{m.category}</p>
              {m.verified && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full border-2 border-flamingo-dark bg-flamingo-mint px-2 py-0.5 text-[10px] font-extrabold uppercase text-flamingo-dark">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Owner info */}
        <Group title="Owner">
          <InfoRow label="Name" value={m.owner} />
          <InfoRow label="Phone" value={m.phone} />
          <InfoRow label="Email" value={m.email} />
        </Group>

        {/* Business info */}
        <Group title="Business">
          <InfoRow label="Address" value={m.address} />
          <InfoRow label="Category" value={m.category} />
          <InfoRow
            label="Joined"
            value={new Date(m.joinedAt).toLocaleDateString("en-ZA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
        </Group>

        {/* Bank info */}
        <Group title="Payout account">
          <InfoRow label="Bank" value={m.bank} />
          <InfoRow label="Account" value={m.accountMasked} />
          <InfoRow label="Fee rate" value={`${(m.feeRate * 100).toFixed(1)}% all-in`} />
        </Group>

        {/* Actions */}
        <section className="mt-5 space-y-2">
          <ActionRow
            icon="🌍"
            title={t("language")}
            subtitle={`${currentLang.native} • ${t("language_desc")}`}
            onClick={() => setShowLangPicker(true)}
          />
          <ActionRow
            icon="🏦"
            title="Change payout bank"
            subtitle="We'll verify before switching"
            onClick={() => window.open("https://wa.me/27825550142?text=Hi%20Flamingo%2C%20I%20need%20to%20change%20my%20payout%20bank%20account.%20Please%20send%20me%20the%20verification%20steps.", "_blank")}
          />
          <ActionRow
            icon="🧾"
            title="Tax invoices & statements"
            subtitle="Download monthly reports"
            onClick={() => alert("Statements will be available from your first full calendar month of trading.")}
          />
          <ActionRow
            icon="🛟"
            title="Get help"
            subtitle="WhatsApp support 7 days a week"
            onClick={() => window.open("https://wa.me/27825550142", "_blank")}
          />
          <ActionRow
            icon="📄"
            title="Terms & privacy"
            subtitle="Read the merchant agreement"
            onClick={() => window.open("/legal/terms", "_blank")}
          />
        </section>

        {/* Sign out */}
        <section className="mt-6">
          {!confirmOut ? (
            <button
              onClick={() => setConfirmOut(true)}
              className="w-full rounded-2xl border-2 border-flamingo-dark bg-white px-4 py-3.5 text-sm font-extrabold uppercase tracking-wide text-flamingo-pink-deep shadow-[0_4px_0_0_#1A1A2E] active:translate-y-0.5 active:shadow-[0_2px_0_0_#1A1A2E]"
            >
              {t("sign_out")}
            </button>
          ) : (
            <div className="rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink-wash p-4 shadow-[0_4px_0_0_#1A1A2E]">
              <p className="text-sm font-bold text-flamingo-dark">
                {t("sign_out")} — {m.name}?
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmOut(false)}
                  className="rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2.5 text-xs font-extrabold uppercase text-flamingo-dark"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSignOut}
                  className="rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-3 py-2.5 text-xs font-extrabold uppercase text-white"
                >
                  {t("sign_out")} ✓
                </button>
              </div>
            </div>
          )}
        </section>

        {showLangPicker && (
          <LanguagePicker onClose={() => setShowLangPicker(false)} />
        )}

        <p className="mt-6 text-center text-[11px] text-flamingo-dark/40">
          Flamingo Pay • v0.1 demo
        </p>
      </div>

      <TabBar />
    </main>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="px-1 text-xs font-extrabold uppercase tracking-wide text-flamingo-dark/60">
        {title}
      </h3>
      <dl className="mt-2 divide-y-2 divide-flamingo-cream rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_6px_0_0_#1A1A2E]">
        {children}
      </dl>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-flamingo-dark/60">
        {label}
      </dt>
      <dd className="max-w-[65%] text-right text-sm font-semibold text-flamingo-dark">
        {value}
      </dd>
    </div>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border-2 border-flamingo-dark bg-white px-4 py-3 text-left shadow-[0_4px_0_0_#1A1A2E] active:translate-y-0.5 active:shadow-[0_2px_0_0_#1A1A2E]"
    >
      <span className="grid h-10 w-10 flex-none place-items-center rounded-full border-2 border-flamingo-dark bg-flamingo-cream text-xl">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold text-flamingo-dark">{title}</div>
        <div className="truncate text-xs text-flamingo-dark/60">{subtitle}</div>
      </div>
      <span className="text-flamingo-dark/40">›</span>
    </button>
  );
}
