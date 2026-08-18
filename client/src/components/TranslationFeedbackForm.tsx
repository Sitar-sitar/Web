import { Button } from "@/components/ui/button";
import { LANGUAGE_LABELS, useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import React, { FormEvent, useState } from "react";

type FeedbackType = "mistranslation" | "improvement" | "other";

export default function TranslationFeedbackForm({ pagePath }: { pagePath: "/" | "/updates" }) {
  const { language, t } = useLanguage();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("mistranslation");
  const [originalText, setOriginalText] = useState("");
  const [suggestedText, setSuggestedText] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [validationMessage, setValidationMessage] = useState("");
  const submitFeedback = trpc.feedback.submit.useMutation();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (suggestedText.trim().length < 3) {
      setStatus("idle");
      setValidationMessage(t("feedbackRequired"));
      return;
    }
    setValidationMessage("");
    setStatus("idle");
    submitFeedback.mutate({ feedbackType, locale: language, pagePath, originalText, suggestedText, notes }, {
      onSuccess: () => {
        setStatus("success");
        setOriginalText("");
        setSuggestedText("");
        setNotes("");
      },
      onError: () => setStatus("error"),
    });
  }

  return <form onSubmit={submit} className="paper-card border border-stone-300 p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="detail-mono text-[9px] text-amber-800">TRANSLATION QUALITY</p><h1 className="display-serif mt-1 text-3xl font-semibold sm:text-4xl">{t("feedbackTitle")}</h1></div><p className="detail-mono border border-stone-300 px-2 py-1 text-[9px] text-stone-600">{t("feedbackPage")} / {pagePath === "/" ? t("lookup") : t("guideHistory")}</p></div>
    <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">{t("feedbackIntro")}</p>
    <div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-stone-800"><span>{t("feedbackType")}</span><select value={feedbackType} onChange={(event) => setFeedbackType(event.target.value as FeedbackType)} className="h-11 rounded-none border border-stone-400 bg-transparent px-3 text-sm font-normal shadow-none focus:outline-none focus:ring-2 focus:ring-amber-700"><option value="mistranslation">{t("mistranslation")}</option><option value="improvement">{t("translationImprovement")}</option><option value="other">{t("otherFeedback")}</option></select></label><div className="grid gap-2 text-sm font-semibold text-stone-800"><span>{t("displayLanguage")}</span><p className="flex h-11 items-center border border-stone-300 bg-stone-100/60 px-3 text-sm font-normal text-stone-700">{LANGUAGE_LABELS[language]}</p></div></div>
    <label className="mt-5 grid gap-2 text-sm font-semibold text-stone-800"><span>{t("originalText")}</span><textarea value={originalText} onChange={(event) => setOriginalText(event.target.value)} maxLength={800} rows={3} className="resize-y rounded-none border border-stone-400 bg-transparent p-3 text-sm font-normal leading-6 shadow-none focus:outline-none focus:ring-2 focus:ring-amber-700" /></label>
    <label className="mt-5 grid gap-2 text-sm font-semibold text-stone-800"><span>{t("suggestedText")}</span><textarea value={suggestedText} onChange={(event) => setSuggestedText(event.target.value)} maxLength={1000} minLength={3} required rows={4} aria-describedby="feedback-privacy" className="resize-y rounded-none border border-stone-400 bg-transparent p-3 text-sm font-normal leading-6 shadow-none focus:outline-none focus:ring-2 focus:ring-amber-700" /></label>
    <label className="mt-5 grid gap-2 text-sm font-semibold text-stone-800"><span>{t("feedbackNotes")}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={3} className="resize-y rounded-none border border-stone-400 bg-transparent p-3 text-sm font-normal leading-6 shadow-none focus:outline-none focus:ring-2 focus:ring-amber-700" /></label>
    <p id="feedback-privacy" className="mt-4 text-xs leading-5 text-stone-500">{t("feedbackPrivacy")}</p>
    {validationMessage && <p role="alert" className="mt-3 text-sm text-rose-700">{validationMessage}</p>}
    {status === "success" && <p role="status" className="mt-3 text-sm text-emerald-800">{t("feedbackSent")}</p>}
    {status === "error" && <p role="alert" className="mt-3 text-sm text-rose-700">{t("feedbackFailed")}</p>}
    <div className="mt-6"><Button type="submit" disabled={submitFeedback.isPending} className="min-h-11 rounded-none bg-stone-900 px-5 text-stone-50 hover:bg-amber-900">{submitFeedback.isPending ? t("sendingFeedback") : t("sendFeedback")}</Button></div>
  </form>;
}
