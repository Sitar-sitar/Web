import { LANGUAGE_LABELS, type AppLanguage, useLanguage } from "@/contexts/LanguageContext";
import React from "react";

const languages: AppLanguage[] = ["ja", "en", "zh-CN"];

export default function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return <div className="flex shrink-0 gap-1" role="group" aria-label={t("language")}>
    {languages.map((item) => <button key={item} type="button" onClick={() => setLanguage(item)} aria-pressed={language === item} className={`min-h-7 border px-2 text-[9px] font-semibold transition-colors ${language === item ? (dark ? "border-amber-200 bg-amber-200 text-stone-900" : "border-stone-900 bg-stone-900 text-stone-50") : (dark ? "border-amber-100/50 text-amber-100 hover:bg-amber-100/10" : "border-stone-300 text-stone-600 hover:bg-stone-200")}`}>{LANGUAGE_LABELS[item]}</button>)}
  </div>;
}
