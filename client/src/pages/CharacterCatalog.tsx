import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpen, CheckCircle2, Loader2, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

type GameId = "hsr" | "genshin" | "zzz";
type LocalizedText = { ja: string; en: string; "zh-CN": string };

const GAMES: Record<GameId, { short: string; name: string }> = {
  hsr: { short: "HSR", name: "崩壊：スターレイル" },
  genshin: { short: "GI", name: "原神" },
  zzz: { short: "ZZZ", name: "ゼンレスゾーンゼロ" },
};

const uiText = {
  ja: {
    eyebrow: "CHARACTER BUILD CATALOG",
    title: "キャラ図鑑",
    subtitle: "UIDや公開プロフィールを使わず、キャラクターを選んで推奨ビルドを確認できます。",
    back: "UID照会へ戻る",
    search: "キャラクター名を検索",
    noMatch: "一致するキャラクターがありません。",
    reviewed: "個別精査済み",
    pending: "汎用プロファイル",
    batch: "バッチ",
    build: "推奨ビルド",
    relic: "推奨セット",
    secondary: "補助セット / 方針",
    mainStats: "推奨メインステータス",
    targets: "推奨ステータス",
    strict: "厳選",
    goal: "目標",
    baseline: "妥協",
    noFixedTarget: "固定の数値目標は設定していません。ビルド方針・優先ステータスを参照してください。",
    context: "目標値の前提",
    source: "情報基準",
    updated: "更新日",
    parties: "推奨PT",
    synergy: "編成ポイント",
    progression: "凸・星魂・心象映画",
    preparing: "このキャラクターの6段階効果データは準備中です。推奨ビルドとPTは確認できます。",
    uidFree: "UID不要",
    catalogStatus: "248キャラ収録",
  },
  en: {
    eyebrow: "CHARACTER BUILD CATALOG",
    title: "Character Catalog",
    subtitle: "Browse recommended builds by character without a UID or public profile.",
    back: "Back to UID lookup",
    search: "Search characters",
    noMatch: "No matching characters.",
    reviewed: "Individually reviewed",
    pending: "Role-profile guide",
    batch: "Batch",
    build: "Recommended Build",
    relic: "Recommended set",
    secondary: "Secondary set / direction",
    mainStats: "Recommended main stats",
    targets: "Target stats",
    strict: "Optimized",
    goal: "Goal",
    baseline: "Baseline",
    noFixedTarget: "No fixed numeric threshold is registered. Use the build direction and stat priorities instead.",
    context: "Target assumptions",
    source: "Source basis",
    updated: "Updated",
    parties: "Recommended Teams",
    synergy: "Team notes",
    progression: "Eidolons / Constellations / Mindscapes",
    preparing: "Six-stage progression data is still being prepared for this character. Build and team guidance is available.",
    uidFree: "No UID required",
    catalogStatus: "248 characters",
  },
  "zh-CN": {
    eyebrow: "CHARACTER BUILD CATALOG",
    title: "角色图鉴",
    subtitle: "无需UID或公开资料，直接选择角色查看推荐配装。",
    back: "返回UID查询",
    search: "搜索角色",
    noMatch: "没有匹配的角色。",
    reviewed: "已单独审核",
    pending: "通用定位配置",
    batch: "批次",
    build: "推荐配装",
    relic: "推荐套装",
    secondary: "辅助套装 / 方针",
    mainStats: "推荐主属性",
    targets: "推荐属性",
    strict: "精选",
    goal: "目标",
    baseline: "基础",
    noFixedTarget: "未设置固定数值阈值，请参考配装方向和属性优先级。",
    context: "目标值前提",
    source: "信息依据",
    updated: "更新日",
    parties: "推荐队伍",
    synergy: "配队要点",
    progression: "星魂 / 命座 / 心象电影",
    preparing: "该角色的六阶段效果数据仍在整理中，推荐配装与队伍可以正常查看。",
    uidFree: "无需UID",
    catalogStatus: "收录248名角色",
  },
} as const;

function localText(text: LocalizedText, language: "ja" | "en" | "zh-CN") {
  return text[language];
}

export default function CharacterCatalog() {
  const { language } = useLanguage();
  const copy = uiText[language];
  const initialParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const requestedGame = initialParams.get("game");
  const initialGame = (requestedGame && requestedGame in GAMES ? requestedGame : "hsr") as GameId;
  const [game, setGame] = useState<GameId>(initialGame);
  const [selectedName, setSelectedName] = useState(initialParams.get("character") ?? "");
  const [filter, setFilter] = useState("");

  const catalogQuery = trpc.build.referenceCatalog.useQuery(undefined, { staleTime: 10 * 60_000 });
  const entries = catalogQuery.data?.games[game] ?? [];
  const filteredEntries = useMemo(() => {
    const keyword = filter.trim().toLocaleLowerCase();
    if (!keyword) return entries;
    return entries.filter((entry) => entry.name.toLocaleLowerCase().includes(keyword));
  }, [entries, filter]);

  useEffect(() => {
    if (!entries.length) return;
    if (!entries.some((entry) => entry.name === selectedName)) {
      setSelectedName(entries[0]?.name ?? "");
    }
  }, [entries, selectedName]);

  useEffect(() => {
    if (!selectedName) return;
    const url = new URL(window.location.href);
    url.searchParams.set("game", game);
    url.searchParams.set("character", selectedName);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [game, selectedName]);

  const referenceQuery = trpc.build.reference.useQuery(
    { game, name: selectedName || "-" },
    { enabled: Boolean(selectedName), staleTime: 10 * 60_000 },
  );
  const reference = referenceQuery.data;

  const changeGame = (next: GameId) => {
    setGame(next);
    setSelectedName("");
    setFilter("");
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="container pt-6 sm:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-stone-400 py-3">
          <Link href="/" className="detail-mono inline-flex items-center gap-2 text-[9px] text-amber-800 underline-offset-4 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />{copy.back}
          </Link>
          <div className="flex items-center gap-3">
            <span className="detail-mono text-[9px] text-stone-500">{copy.uidFree} / {copy.catalogStatus}</span>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="container pb-20 pt-10 sm:pt-14">
        <section className="border-b border-stone-300 pb-8">
          <p className="detail-mono text-[10px] text-amber-800">{copy.eyebrow}</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="display-serif text-4xl font-bold tracking-[-.04em] sm:text-6xl">{copy.title}</h1>
              <p className="mt-4 max-w-2xl font-serif text-sm leading-7 text-stone-600 sm:text-base">{copy.subtitle}</p>
            </div>
            {catalogQuery.data && (
              <p className="detail-mono text-[9px] text-stone-500">
                REVIEWED {catalogQuery.data.reviewed} / {catalogQuery.data.total}
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside>
            <div className="grid grid-cols-3 gap-1 border border-stone-300 bg-stone-100/70 p-1">
              {(Object.keys(GAMES) as GameId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => changeGame(id)}
                  className={cn("min-h-11 px-2 text-[10px] font-semibold transition-colors", game === id ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-200")}
                  aria-pressed={game === id}
                >
                  {GAMES[id].short}
                </button>
              ))}
            </div>
            <p className="detail-mono mt-2 text-[9px] text-stone-500">{GAMES[game].name} / {entries.length}</p>

            <div className="relative mt-5">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder={copy.search}
                className="h-11 rounded-none border-stone-400 bg-transparent pl-9 shadow-none focus-visible:ring-amber-700"
              />
            </div>

            <div className="mt-3 max-h-[560px] overflow-y-auto border-y border-stone-300">
              {catalogQuery.isLoading && <div className="flex items-center gap-2 px-3 py-5 text-xs text-stone-500"><Loader2 className="h-4 w-4 animate-spin" />Loading</div>}
              {!catalogQuery.isLoading && filteredEntries.length === 0 && <p className="px-3 py-5 text-xs text-stone-500">{copy.noMatch}</p>}
              {filteredEntries.map((entry) => (
                <button
                  key={`${entry.game}:${entry.name}`}
                  type="button"
                  onClick={() => setSelectedName(entry.name)}
                  className={cn("flex w-full items-center justify-between gap-3 border-b border-stone-200 px-3 py-3 text-left transition-colors last:border-b-0", selectedName === entry.name ? "bg-stone-900 text-white" : "hover:bg-stone-100")}
                >
                  <span className="text-sm font-semibold">{entry.name}</span>
                  <span className={cn("detail-mono shrink-0 text-[8px]", selectedName === entry.name ? "text-stone-300" : entry.status === "reviewed" ? "text-emerald-800" : "text-stone-400")}>
                    {entry.status === "reviewed" ? `B${entry.batch}` : "PROFILE"}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0">
            {referenceQuery.isFetching && !reference && (
              <div className="flex min-h-72 items-center justify-center border-y border-stone-300">
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-amber-800" />
                <span className="detail-mono text-[10px] text-stone-500">LOADING BUILD REFERENCE</span>
              </div>
            )}

            {referenceQuery.error && (
              <div className="border border-rose-300 bg-rose-50 p-5 text-sm text-rose-800">{referenceQuery.error.message}</div>
            )}

            {reference && (
              <div className="space-y-8">
                <section className="paper-card border border-stone-300 p-5 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="detail-mono text-[9px] text-stone-500">{GAMES[game].short} / {reference.guide.profileId ?? "BUILD"}</p>
                      <h2 className="display-serif mt-2 text-3xl font-bold sm:text-4xl">{reference.name}</h2>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 border px-2.5 py-1 detail-mono text-[9px]", reference.status === "reviewed" ? "border-emerald-700 text-emerald-800" : "border-stone-400 text-stone-500")}>
                      {reference.status === "reviewed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {reference.status === "reviewed" ? `${copy.reviewed} / ${copy.batch} ${reference.batch}` : copy.pending}
                    </span>
                  </div>
                  <p className="mt-5 max-w-3xl font-serif text-base leading-7 text-stone-700">{reference.guide.headline}</p>
                </section>

                <section>
                  <div className="flex items-center gap-2 border-b border-stone-400 pb-3">
                    <BookOpen className="h-4 w-4 text-amber-800" />
                    <h3 className="display-serif text-2xl font-semibold">{copy.build}</h3>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="border border-stone-300 p-4">
                      <p className="detail-mono text-[9px] text-stone-500">{copy.relic}</p>
                      <p className="mt-2 text-sm font-semibold leading-6">{reference.guide.relicSet}</p>
                    </div>
                    <div className="border border-stone-300 p-4">
                      <p className="detail-mono text-[9px] text-stone-500">{copy.secondary}</p>
                      <p className="mt-2 text-sm font-semibold leading-6">{reference.guide.planarSet}</p>
                    </div>
                  </div>

                  <div className="mt-4 border border-stone-300 p-4">
                    <p className="detail-mono text-[9px] text-stone-500">{copy.mainStats}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {reference.guide.mainStats.map((stat) => (
                        <div key={`${stat.slot}:${stat.value}`} className="flex items-start justify-between gap-4 border-b border-stone-200 py-2 text-sm last:border-b-0">
                          <span className="text-stone-500">{stat.slot}</span>
                          <span className="text-right font-semibold">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <div className="border-b border-stone-400 pb-3"><h3 className="display-serif text-2xl font-semibold">{copy.targets}</h3></div>
                  {reference.guide.targets.length ? (
                    <div className="mt-4 overflow-x-auto border border-stone-300">
                      <table className="w-full min-w-[560px] border-collapse text-sm">
                        <thead className="bg-stone-100 detail-mono text-[9px] text-stone-500">
                          <tr><th className="px-4 py-3 text-left">STAT</th><th className="px-4 py-3 text-right">{copy.strict}</th><th className="px-4 py-3 text-right">{copy.goal}</th><th className="px-4 py-3 text-right">{copy.baseline}</th></tr>
                        </thead>
                        <tbody>
                          {reference.guide.targets.map((target) => (
                            <tr key={target.key} className="border-t border-stone-200">
                              <td className="px-4 py-3 font-semibold">{target.label}</td>
                              <td className="px-4 py-3 text-right font-mono">{target.targets["厳選"]}{target.unit}</td>
                              <td className="bg-amber-50/70 px-4 py-3 text-right font-mono font-bold text-amber-900">{target.targets["目標"]}{target.unit}</td>
                              <td className="px-4 py-3 text-right font-mono">{target.targets["妥協"]}{target.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="mt-4 border border-stone-300 p-4 text-sm leading-6 text-stone-600">{copy.noFixedTarget}</p>}
                  {reference.guide.targetContext && <div className="mt-4 border-l-2 border-amber-700 pl-4"><p className="detail-mono text-[9px] text-stone-500">{copy.context}</p><p className="mt-2 text-sm leading-6 text-stone-600">{reference.guide.targetContext}</p></div>}
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 detail-mono text-[9px] text-stone-500">
                    {reference.guide.sourceLabel && <span>{copy.source}: {reference.guide.sourceLabel}</span>}
                    {reference.guide.updatedAt && <span>{copy.updated}: {reference.guide.updatedAt}</span>}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 border-b border-stone-400 pb-3"><Users className="h-4 w-4 text-amber-800" /><h3 className="display-serif text-2xl font-semibold">{copy.parties}</h3></div>
                  <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    {reference.partyRecommendations.options.map((option) => (
                      <article key={option.id} className="border border-stone-300 p-4">
                        <p className="detail-mono text-[9px] text-amber-800">PLAN {option.rank}</p>
                        <h4 className="mt-2 font-serif text-lg font-semibold">{localText(option.title as LocalizedText, language)}</h4>
                        <div className="mt-4 space-y-2">
                          {option.members.map((member, index) => (
                            <div key={`${option.id}:${index}`} className="flex items-center justify-between gap-3 border-b border-stone-200 pb-2 text-xs last:border-b-0">
                              <span className="font-semibold">{localText(member.name as LocalizedText, language)}</span>
                              <span className="text-stone-500">{localText(member.role as LocalizedText, language)}</span>
                            </div>
                          ))}
                        </div>
                        {option.synergy[0] && <div className="mt-4"><p className="detail-mono text-[8px] text-stone-500">{copy.synergy}</p><p className="mt-1 text-xs leading-5 text-stone-600">{localText(option.synergy[0] as LocalizedText, language)}</p></div>}
                      </article>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="border-b border-stone-400 pb-3"><h3 className="display-serif text-2xl font-semibold">{copy.progression}</h3></div>
                  {reference.constellations.dataStatus === "curated" && reference.constellations.effects.length ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {reference.constellations.effects.map((effect) => (
                        <article key={effect.level} className="border border-stone-300 p-4">
                          <div className="flex items-center justify-between gap-3"><span className="detail-mono text-[9px] text-amber-800">{localText(reference.constellations.rankLabel as LocalizedText, language)} {effect.level}</span></div>
                          <h4 className="mt-2 text-sm font-bold">{localText(effect.name as LocalizedText, language)}</h4>
                          <p className="mt-2 text-xs leading-5 text-stone-600">{localText(effect.description as LocalizedText, language)}</p>
                        </article>
                      ))}
                    </div>
                  ) : <p className="mt-4 border border-stone-300 p-4 text-sm leading-6 text-stone-600">{copy.preparing}</p>}
                </section>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
