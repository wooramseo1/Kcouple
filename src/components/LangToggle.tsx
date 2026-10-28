"use client";

import { useI18n } from "@/i18n/client";

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`inline-flex rounded-full bg-white/80 border border-ink-100 p-0.5 text-xs font-semibold ${className}`}>
      {(["ko", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 h-7 rounded-full transition ${lang === l ? "bg-ink-900 text-white" : "text-ink-500"}`}
          aria-pressed={lang === l}
        >
          {l === "ko" ? "한국어" : "EN"}
        </button>
      ))}
    </div>
  );
}
