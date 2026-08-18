import LanguageSwitcher from "@/components/LanguageSwitcher";
import TranslationFeedbackForm from "@/components/TranslationFeedbackForm";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { Link } from "wouter";

export default function TranslationFeedback() {
  const { t } = useLanguage();
  const requestedSource = new URLSearchParams(window.location.search).get("source");
  const pagePath = requestedSource === "/updates" ? "/updates" : "/";
  return <div className="min-h-screen overflow-hidden"><header className="container pt-6 sm:pt-8"><div className="flex flex-wrap items-center justify-between gap-3 border-y border-stone-400 py-3"><div className="flex items-center gap-3"><span className="inline-block h-2 w-2 rounded-full bg-amber-700" /><p className="detail-mono text-[9px] text-stone-600">TRANSLATION QUALITY</p></div><div className="flex items-center gap-2"><LanguageSwitcher /><Link href={pagePath}><Button variant="ghost" size="sm" className="h-8 rounded-none text-[10px] text-stone-600 hover:bg-stone-200"><ArrowLeft className="h-3.5 w-3.5" />{t("backToLookup")}</Button></Link></div></div></header><main className="container pb-20 pt-10 sm:pt-16"><div className="mx-auto max-w-3xl"><TranslationFeedbackForm pagePath={pagePath} /></div></main></div>;
}
