"use client";

import { LANGUAGES, useI18n, type LangCode } from "../../../lib/i18n";

export function LanguagePicker({ onClose }: { onClose: () => void }) {
  const { lang, setLang } = useI18n();

  function pick(code: LangCode) {
    setLang(code);
    // Short delay for feedback before sheet closes
    setTimeout(onClose, 180);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-flamingo-dark/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border-t-2 border-flamingo-dark bg-white p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-flamingo-dark/20" />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-flamingo-dark">
              Choose your language
            </h3>
            <p className="text-[11px] text-flamingo-dark/60">
              Khetha ulimi • Kies jou taal • Kgetha puo
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-flamingo-cream text-flamingo-dark"
          >
            ✕
          </button>
        </div>

        <ul className="mt-4 grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto pr-1">
          {LANGUAGES.map(l => {
            const active = l.code === lang;
            return (
              <li key={l.code}>
                <button
                  onClick={() => pick(l.code)}
                  className={`flex w-full items-center justify-between rounded-2xl border-2 border-flamingo-dark px-4 py-3 text-left transition active:translate-y-0.5 ${
                    active
                      ? "bg-flamingo-pink text-white shadow-[0_4px_0_0_#1A1A2E]"
                      : "bg-white text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
                  }`}
                >
                  <div>
                    <div className="text-base font-extrabold">{l.native}</div>
                    <div
                      className={`text-[11px] ${
                        active ? "text-white/80" : "text-flamingo-dark/60"
                      }`}
                    >
                      {l.name}
                    </div>
                  </div>
                  {active && <span className="text-xl">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
