import { useAuth } from "@/_core/hooks/useAuth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Activity, ArrowLeft, BarChart3, Github, LogIn, LogOut, MessageSquareText, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

type HealthState = "checking" | "ok" | "error";

function AdminMetric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <article className="border border-stone-300 bg-stone-50/50 p-5">
      <p className="detail-mono text-[9px] text-stone-500">{label}</p>
      <p className="display-serif mt-3 text-4xl font-semibold tracking-[-.04em] text-stone-900">{value}</p>
      <p className="mt-2 text-xs leading-5 text-stone-600">{detail}</p>
    </article>
  );
}

export default function AdminHome() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const analyticsQuery = trpc.analytics.lookupDashboard.useQuery(undefined, { enabled: isAdmin, retry: false });
  const feedbackQuery = trpc.feedback.list.useQuery(undefined, { enabled: isAdmin, retry: false });
  const [health, setHealth] = useState<HealthState>("checking");

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
    fetch(`${apiBaseUrl}/api/health`, { credentials: "include" })
      .then(response => {
        if (!cancelled) setHealth(response.ok ? "ok" : "error");
      })
      .catch(() => {
        if (!cancelled) setHealth("error");
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const unresolvedFeedback = useMemo(
    () => (feedbackQuery.data ?? []).filter(item => item.status !== "resolved").length,
    [feedbackQuery.data],
  );

  const signOut = async () => {
    await logout();
    window.location.href = import.meta.env.BASE_URL || "/";
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <header className="container pt-6 sm:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-stone-400 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-700" />
            <p className="detail-mono text-[9px] text-stone-600">ADMIN / CONTROL CENTER</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-8 rounded-none text-[10px] text-stone-600 hover:bg-stone-200">
                <ArrowLeft className="h-3.5 w-3.5" />公開サイトへ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container pb-20 pt-10 sm:pt-16">
        <section className="mx-auto max-w-5xl">
          <p className="detail-mono text-[10px] text-amber-800">GITHUB APP AUTHENTICATED</p>
          <h1 className="display-serif mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-6xl">管理者ポータル</h1>
          <p className="mt-5 max-w-2xl font-serif text-base leading-7 text-stone-600">
            検索利用状況、翻訳フィードバック、API状態を確認します。管理操作はGitHub App認証とサーバー側Allowlistで保護されています。
          </p>
        </section>

        {loading && (
          <section className="mx-auto mt-12 max-w-5xl border-y border-stone-300 py-10 text-center">
            <p className="detail-mono text-[10px] text-stone-500">AUTHENTICATING</p>
          </section>
        )}

        {!loading && !isAdmin && (
          <section className="mx-auto mt-12 max-w-md border border-amber-900/30 bg-amber-50/60 p-6 sm:p-8">
            <Github className="h-6 w-6 text-amber-900" />
            <p className="detail-mono mt-4 text-[9px] text-amber-800">ADMIN ACCESS</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">{isAuthenticated ? "管理者権限がありません" : "GitHubで管理者ログイン"}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              {isAuthenticated
                ? "このアカウントは管理者Allowlistに登録されていません。"
                : "登録済みのGitHubアカウントだけが管理画面へアクセスできます。"}
            </p>
            {!isAuthenticated && (
              <Button onClick={() => startLogin("/admin")} className="mt-5 h-11 w-full rounded-none bg-stone-900 text-stone-50 hover:bg-amber-900 sm:w-auto">
                <LogIn className="h-4 w-4" />GitHubでログイン
              </Button>
            )}
          </section>
        )}

        {isAdmin && (
          <>
            <section className="mx-auto mt-10 flex max-w-5xl flex-wrap items-center justify-between gap-4 border-y border-stone-300 py-4">
              <div>
                <p className="detail-mono text-[9px] text-stone-500">SIGNED IN</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">{user.name || user.openId}</p>
              </div>
              <Button variant="outline" onClick={signOut} className="h-9 rounded-none border-stone-400 text-xs">
                <LogOut className="h-4 w-4" />ログアウト
              </Button>
            </section>

            <section className="mx-auto mt-10 max-w-5xl">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <AdminMetric label="TOTAL LOOKUPS" value={analyticsQuery.data?.totalLookups ?? "—"} detail="全ゲームの公開UID検索" />
                <AdminMetric label="CACHE HIT RATE" value={analyticsQuery.data ? `${analyticsQuery.data.cacheHitRate.toFixed(1)}%` : "—"} detail="外部API負荷の抑制率" />
                <AdminMetric label="OPEN FEEDBACK" value={feedbackQuery.data ? unresolvedFeedback : "—"} detail="未解決・対応中フィードバック" />
                <AdminMetric label="API STATUS" value={health === "ok" ? "OK" : health === "error" ? "NG" : "…"} detail="Railway API health check" />
              </div>
            </section>

            <section className="mx-auto mt-14 max-w-5xl">
              <div className="border-b border-stone-400 pb-4">
                <p className="detail-mono text-[9px] text-amber-800">OPERATIONS</p>
                <h2 className="display-serif mt-1 text-3xl font-semibold">管理メニュー</h2>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Link href="/admin/feedback" className="group border border-stone-300 bg-stone-50/50 p-6 transition-colors hover:border-stone-900 hover:bg-stone-100">
                  <MessageSquareText className="h-5 w-5 text-amber-800" />
                  <h3 className="mt-4 font-serif text-2xl font-semibold">Feedback / Analytics</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">翻訳フィードバックの対応状況変更、検索数・ゲーム別内訳・キャッシュヒット率を確認します。</p>
                </Link>
                <div className="border border-stone-300 bg-stone-50/50 p-6">
                  <ShieldCheck className="h-5 w-5 text-emerald-800" />
                  <h3 className="mt-4 font-serif text-2xl font-semibold">Security</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">GitHub App + numeric GitHub ID Allowlist + tRPC adminProcedure の三段で管理APIを保護しています。</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-stone-500">
                    <span className="inline-flex items-center gap-1"><Github className="h-3.5 w-3.5" />GitHub App</span>
                    <span className="inline-flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" />Admin API</span>
                    <span className="inline-flex items-center gap-1"><Activity className="h-3.5 w-3.5" />12h session</span>
                  </div>
                </div>
              </div>
            </section>

            {(analyticsQuery.error || feedbackQuery.error) && (
              <section className="mx-auto mt-8 max-w-5xl border-l-2 border-rose-700 pl-4 text-sm text-rose-800">
                管理データの一部を取得できませんでした。RailwayのDATABASE_URLと管理者環境変数を確認してください。
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
