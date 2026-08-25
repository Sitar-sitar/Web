import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import React, { useState } from "react";
import { Link } from "wouter";

type ManageableStatus = "new" | "in_progress" | "resolved";
type FeedbackRecord = {
  id: number;
  feedbackType: "mistranslation" | "improvement" | "other";
  locale: string;
  pagePath: string;
  originalText: string | null;
  suggestedText: string;
  notes: string | null;
  status: ManageableStatus | "reviewed";
  createdAt: Date | string;
};
type LookupDashboard = {
  totalLookups: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  byGame: Array<{ game: "hsr" | "genshin" | "zzz"; totalLookups: number; cacheHits: number; cacheMisses: number; cacheHitRate: number }>;
};

const gameLabels = { hsr: "HSR", genshin: "GI", zzz: "ZZZ" } as const;

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return <article className="border border-stone-300 bg-stone-50/50 p-5"><p className="detail-mono text-[9px] text-stone-500">{label}</p><p className="display-serif mt-3 text-4xl font-semibold tracking-[-.04em] text-stone-900">{value}</p><p className="mt-2 text-xs leading-5 text-stone-600">{detail}</p></article>;
}

export default function FeedbackAdmin() {
  const { t, language } = useLanguage();
  const { user, loading, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "admin";
  const feedbackQuery = trpc.feedback.list.useQuery(undefined, { enabled: isAdmin, retry: false });
  const dashboardQuery = trpc.analytics.lookupDashboard.useQuery(undefined, { enabled: isAdmin, retry: false });
  const utils = trpc.useUtils();
  const [message, setMessage] = useState<"success" | "error" | null>(null);
  const updateStatus = trpc.feedback.updateStatus.useMutation({
    onSuccess: async () => {
      setMessage("success");
      await utils.feedback.list.invalidate();
    },
    onError: () => setMessage("error"),
  });

  const typeLabel = (type: FeedbackRecord["feedbackType"]) => type === "mistranslation" ? t("mistranslation") : type === "improvement" ? t("translationImprovement") : t("otherFeedback");
  const formatDate = (value: Date | string) => new Intl.DateTimeFormat(language === "zh-CN" ? "zh-CN" : language === "en" ? "en-GB" : "ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const dashboard = dashboardQuery.data as LookupDashboard | undefined;

  return <div className="min-h-screen overflow-hidden">
    <header className="container pt-6 sm:pt-8"><div className="flex flex-wrap items-center justify-between gap-3 border-y border-stone-400 py-3"><div className="flex items-center gap-3"><span className="inline-block h-2 w-2 rounded-full bg-amber-700" /><p className="detail-mono text-[9px] text-stone-600">ADMIN / TRANSLATION QUALITY</p></div><div className="flex items-center gap-2"><LanguageSwitcher /><Link href="/"><Button variant="ghost" size="sm" className="h-8 rounded-none text-[10px] text-stone-600 hover:bg-stone-200"><ArrowLeft className="h-3.5 w-3.5" />{t("backToLookup")}</Button></Link></div></div></header>
    <main className="container pb-20 pt-10 sm:pt-16">
      <section className="mx-auto max-w-5xl"><p className="detail-mono text-[10px] text-amber-800">ADMIN REVIEW QUEUE</p><h1 className="display-serif mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-6xl">{t("feedbackManagement")}</h1><p className="mt-5 max-w-2xl font-serif text-base leading-7 text-stone-600">{t("feedbackManagementIntro")}</p></section>
      {loading && <section className="mx-auto mt-12 max-w-5xl border-y border-stone-300 py-10 text-center"><p className="detail-mono text-[10px] text-stone-500">{t("loading")}</p></section>}
      {!loading && !isAdmin && <section className="mx-auto mt-12 max-w-5xl border border-amber-900/30 bg-amber-50/60 p-6 sm:p-8"><div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" /><div><h2 className="font-serif text-2xl font-semibold">{t("adminOnly")}</h2>{!isAuthenticated && <Button onClick={() => startLogin()} className="mt-5 rounded-none bg-stone-900 text-stone-50 hover:bg-amber-900">{t("signIn")}</Button>}</div></div></section>}
      {isAdmin && <>
        <section className="mx-auto mt-12 max-w-5xl"><div className="border-b border-stone-400 pb-4"><p className="detail-mono text-[9px] text-amber-800">LOOKUP METRICS</p><h2 className="display-serif mt-1 text-3xl font-semibold">{t("lookupDashboard")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{t("lookupDashboardIntro")}</p></div>{dashboardQuery.isLoading && <p className="mt-8 text-sm text-stone-500">{t("loading")}</p>}{dashboardQuery.error && <p role="alert" className="mt-8 text-sm text-rose-700">{dashboardQuery.error.message}</p>}{dashboard && <><div className="mt-6 grid gap-4 sm:grid-cols-3"><MetricCard label={t("totalLookups")} value={dashboard.totalLookups} detail={`${t("cacheMisses")} ${dashboard.cacheMisses}`} /><MetricCard label={t("cacheHits")} value={dashboard.cacheHits} detail={`${t("cacheHitRate")} ${dashboard.cacheHitRate.toFixed(1)}%`} /><MetricCard label={t("cacheHitRate")} value={`${dashboard.cacheHitRate.toFixed(1)}%`} detail={`${t("totalLookups")} ${dashboard.totalLookups}`} /></div><div className="mt-6"><p className="detail-mono text-[9px] text-amber-800">{t("gameBreakdown")}</p><div className="mt-3 grid gap-4 sm:grid-cols-3">{dashboard.byGame.map((item) => <article key={item.game} className="border border-stone-300 bg-stone-50/50 p-5"><div className="flex items-baseline justify-between"><p className="font-serif text-2xl font-semibold">{gameLabels[item.game]}</p><p className="detail-mono text-[10px] text-amber-800">{item.cacheHitRate.toFixed(1)}%</p></div><p className="mt-3 text-sm text-stone-700">{t("totalLookups")} <span className="font-semibold text-stone-900">{item.totalLookups}</span></p><p className="mt-1 text-xs text-stone-600">{t("cacheHits")} {item.cacheHits}　/　{t("cacheMisses")} {item.cacheMisses}</p><div className="mt-4 h-1.5 overflow-hidden bg-stone-200"><div className="h-full bg-emerald-800 transition-[width] duration-200" style={{ width: `${Math.max(0, Math.min(100, item.cacheHitRate))}%` }} /></div></article>)}</div></div></>}</section>
        <section className="mx-auto mt-14 max-w-5xl"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-400 pb-4"><div><p className="detail-mono text-[9px] text-amber-800">INBOX</p><h2 className="display-serif mt-1 text-3xl font-semibold">{t("feedbackManagement")}</h2></div><p className="detail-mono text-[10px] text-stone-500">{feedbackQuery.data?.length ?? 0} {t("feedbackCount")}</p></div>{message === "success" && <p role="status" className="mt-4 text-sm text-emerald-800">{t("statusUpdated")}</p>}{message === "error" && <p role="alert" className="mt-4 text-sm text-rose-700">{t("updateFailed")}</p>}{feedbackQuery.isLoading && <p className="mt-8 text-sm text-stone-500">{t("loading")}</p>}{feedbackQuery.error && <p role="alert" className="mt-8 text-sm text-rose-700">{feedbackQuery.error.message}</p>}{!feedbackQuery.isLoading && !feedbackQuery.error && !(feedbackQuery.data?.length) && <p className="mt-8 border-l-2 border-emerald-800 pl-3 text-sm text-stone-700">{t("noFeedback")}</p>}<div className="mt-6 space-y-4">{((feedbackQuery.data ?? []) as FeedbackRecord[]).map((feedback) => { const selectedStatus: ManageableStatus = feedback.status === "reviewed" ? "in_progress" : feedback.status; return <article key={feedback.id} className="border border-stone-300 bg-stone-50/50 p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 border-b border-stone-300 pb-4 sm:flex-row sm:items-start"><div><p className="detail-mono text-[9px] text-amber-800">#{String(feedback.id).padStart(4, "0")} / {typeLabel(feedback.feedbackType)}</p><p className="mt-2 text-xs text-stone-600">{t("receivedAt")} / {formatDate(feedback.createdAt)}　·　{t("displayLanguage")} / {feedback.locale}　·　{t("sourcePage")} / {feedback.pagePath}</p></div><label className="grid gap-1 text-[10px] font-semibold text-stone-600"><span>{t("responseStatus")}</span><select value={selectedStatus} disabled={updateStatus.isPending} onChange={(event) => { setMessage(null); updateStatus.mutate({ id: feedback.id, status: event.target.value as ManageableStatus }); }} className="h-10 min-w-36 rounded-none border border-stone-400 bg-transparent px-2 text-sm font-normal text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-700"><option value="new">{t("statusNew")}</option><option value="in_progress">{t("statusInProgress")}</option><option value="resolved">{t("statusResolved")}</option></select></label></div><div className="mt-5 grid gap-5 sm:grid-cols-2">{feedback.originalText && <div><p className="detail-mono text-[9px] text-stone-500">{t("originalText")}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">{feedback.originalText}</p></div>}<div><p className="detail-mono text-[9px] text-stone-500">{t("feedbackSuggestion")}</p><p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-stone-900">{feedback.suggestedText}</p></div>{feedback.notes && <div className="sm:col-span-2"><p className="detail-mono text-[9px] text-stone-500">{t("feedbackNotes")}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">{feedback.notes}</p></div>}</div></article>; })}</div></section>
      </>}
    </main>
  </div>;
}
