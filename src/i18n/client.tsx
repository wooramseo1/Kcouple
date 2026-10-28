"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CITY_NAMES_KO, INTEREST_NAMES, LANGUAGE_NAMES, translate, type DictKey, type Lang } from "./dict";

interface I18n {
  lang: Lang;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  setLang: (l: Lang) => void;
  langName: (code: string) => string;
  interestName: (code: string) => string;
  cityName: (city: string) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ initial, children }: { initial: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const router = useRouter();
  const setLang = useCallback((l: Lang) => {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    setLangState(l);
    router.refresh();
  }, [router]);
  const value = useMemo<I18n>(() => ({
    lang,
    setLang,
    t: (key, vars) => translate(lang, key, vars),
    langName: (code) => LANGUAGE_NAMES[lang][code] ?? code,
    interestName: (code) => INTEREST_NAMES[lang][code] ?? code,
    cityName: (city) => (lang === "ko" ? CITY_NAMES_KO[city] ?? city : city),
  }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n outside I18nProvider");
  return v;
}
