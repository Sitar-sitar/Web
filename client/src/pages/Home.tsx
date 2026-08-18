import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { ArrowDownRight, Check, CircleAlert, Clock3, Database, Loader2, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type TierName = "厳選" | "目標" | "妥協";
type Comparison = { key: string; label: string; unit: string; current: number | null; currentDisplay: string; targets: Record<TierName, number>; achieved: Record<TierName, boolean | null> };
type Character = {
  id: string; name: string; level: number | null; rank: number | null; portrait: string | null; element: string; elementColor: string | null; path: string;
  lightCone: { name: string; level: number | null; rank: number | null; icon: string | null } | null;
  relics: Array<{ id: string; name: string; setName: string; level: number | null; icon: string | null; main: { name: string; display: string } | null; subs: Array<{ name: string; display: string }> }>;
  allStats: Array<{ name: string; display: string; icon: string | null }>;
  guide: { headline: string; relicSet: string; planarSet: string; mainStats: Array<{ slot: string; value: string }> };
  comparisons: Comparison[];
};

const TIERS: TierName[] = ["厳選", "目標", "妥協"];

function formatTime(iso?: string) {
  return iso ? new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—";
}

function TierMark({ passed }: { passed: boolean | null }) {
  if (passed === null) return <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-stone-300 text-[10px] text-stone-400">—</span>;
  return passed ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-800 text-white"><Check className="h-3 w-3" /></span> : <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-300 text-rose-700"><X className="h-3 w-3" /></span>;
}

function RelicCard({ relic }: { relic: Character["relics"][number] }) {
  return <article className="border-t border-stone-300 pt-4">
    <div className="flex gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center bg-stone-200/70">{relic.icon ? <img src={relic.icon} alt="" className="h-11 w-11 object-contain" /> : <Sparkles className="h-4 w-4 text-stone-500" />}</div><div className="min-w-0 flex-1"><p className="detail-mono text-[9px] text-stone-500">+{relic.level ?? "—"} / {relic.setName || "SET"}</p><h4 className="mt-1 truncate text-sm font-bold">{relic.name}</h4>{relic.main && <p className="mt-1 text-xs text-stone-600">メイン　<span className="font-semibold text-stone-900">{relic.main.name} {relic.main.display}</span></p>}</div></div>
    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 pl-[60px] text-[11px] text-stone-600">{relic.subs.slice(0, 4).map((sub, index) => <p key={`${sub.name}-${index}`} className="flex justify-between gap-2"><span>{sub.name}</span><span className="font-medium text-stone-950">{sub.display}</span></p>)}</div>
  </article>;
}

export default function Home() {
  const [uid, setUid] = useState("");
  const [lookupUid, setLookupUid] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const query = trpc.build.lookup.useQuery({ uid: lookupUid || "0" }, { enabled: Boolean(lookupUid), retry: false, staleTime: 60_000 });
  const characters = (query.data?.characters ?? []) as Character[];
  const selected = useMemo(() => characters.find((character) => character.id === selectedId) ?? characters[0], [characters, selectedId]);

  useEffect(() => { if (characters.length && !characters.some((character) => character.id === selectedId)) setSelectedId(characters[0]?.id ?? ""); }, [characters, selectedId]);
  function handleSubmit(event: FormEvent) { event.preventDefault(); const normalized = uid.trim(); if (/^\d{9,10}$/.test(normalized)) setLookupUid(normalized); }

  return <div className="min-h-screen overflow-hidden">
    <header className="container pt-6 sm:pt-8"><div className="flex items-center justify-between border-y border-stone-400 py-3"><div className="flex items-center gap-3"><span className="inline-block h-2 w-2 rounded-full bg-amber-700" /><p className="detail-mono text-[9px] text-stone-600">PRIVATE BUILD INTELLIGENCE</p></div><p className="detail-mono text-[9px] text-stone-500">01 — HSR / UID ONLY</p></div></header>
    <main className="container pb-20 pt-10 sm:pt-16">
      <section className="grid gap-10 lg:grid-cols-[1.12fr_.88fr] lg:items-end"><div><p className="detail-mono mb-4 text-[10px] text-amber-800">STELLAR ATELIER / 遺物厳選支援</p><h1 className="display-serif max-w-3xl text-5xl font-bold leading-[.98] tracking-[-.055em] text-stone-900 sm:text-7xl">Build with<br /><em className="font-medium">Intention.</em></h1><p className="mt-6 max-w-xl font-serif text-base leading-7 text-stone-600">公開中のキャラクター装備を読み込み、厳選基準を一目で比較。ステータスの次の一手を、静かに、明快に示します。</p></div>
        <form onSubmit={handleSubmit} className="paper-card border border-stone-300 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="detail-mono text-[9px] text-stone-500">ARCHIVE ACCESS</p><h2 className="display-serif mt-1 text-2xl font-semibold">UIDを照会</h2></div><Database className="h-5 w-5 text-amber-800" /></div><div className="mt-6 flex gap-2"><Input value={uid} onChange={(event) => setUid(event.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={10} placeholder="9〜10桁のUID" aria-label="崩壊：スターレイル UID" className="h-12 rounded-none border-stone-400 bg-transparent font-mono text-sm shadow-none focus-visible:ring-amber-700" /><Button type="submit" disabled={!/^\d{9,10}$/.test(uid) || query.isFetching} className="h-12 rounded-none bg-stone-900 px-4 text-stone-50 hover:bg-amber-900"><Search className="h-4 w-4" /><span className="sr-only">照会する</span></Button></div><div className="mt-3 flex items-center gap-2 text-[11px] text-stone-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-800" />公開中の巡星ビザ情報のみを参照します。</div></form>
      </section>
      {query.isFetching && <section className="mt-10 flex min-h-56 items-center justify-center border-y border-stone-300"><Loader2 className="mr-3 h-5 w-5 animate-spin text-amber-800" /><p className="detail-mono text-[10px] text-stone-500">RETRIEVING PUBLIC ARCHIVE</p></section>}
      {query.error && <section className="mt-10 border border-rose-300 bg-rose-50/50 p-5"><div className="flex gap-3"><CircleAlert className="mt-0.5 h-5 w-5 text-rose-700" /><div><p className="detail-mono text-[10px] text-rose-700">LOOKUP UNAVAILABLE</p><p className="mt-1 text-sm text-stone-700">{query.error.message}</p></div></div></section>}
      {!lookupUid && !query.isFetching && <section className="mt-16 grid gap-8 border-t border-stone-400 pt-6 lg:grid-cols-[.7fr_1.3fr]"><p className="detail-mono text-[10px] text-stone-500">HOW IT WORKS / 01—03</p><div className="grid gap-6 sm:grid-cols-3">{[["01", "公開設定", "巡星ビザに確認したいキャラクターを登録します。"], ["02", "UIDを入力", "9〜10桁のUIDを入力して、公開データを照会します。"], ["03", "次の一手", "遺物と各目標水準を比較し、未達ステータスを見つけます。"]].map(([number, title, body]) => <article key={number} className="border-t border-stone-300 pt-3"><p className="detail-mono text-[9px] text-amber-800">{number}</p><h3 className="mt-3 font-serif text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-stone-600">{body}</p></article>)}</div></section>}
      {characters.length > 0 && <><section className="mt-12 border-y border-stone-400 py-3"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><p className="detail-mono text-[9px] text-stone-500">ARCHIVE / {query.data?.player.name}</p><span className="h-1 w-1 rounded-full bg-stone-400" /><p className="detail-mono text-[9px] text-stone-500">UID {query.data?.player.uid}</p>{query.data?.dataSource === "Enka" && <><span className="h-1 w-1 rounded-full bg-amber-700" /><p className="detail-mono text-[9px] text-amber-800">ENKA FALLBACK</p></>}</div><div className="flex items-center gap-2 text-[10px] text-stone-500"><Clock3 className="h-3.5 w-3.5" />{query.data?.cached ? "キャッシュ" : "更新"} {formatTime(query.data?.fetchedAt)}</div></div></section>
        <section className="mt-7"><div className="mb-4 flex items-end justify-between"><div><p className="detail-mono text-[9px] text-stone-500">CHARACTER SELECTOR</p><h2 className="display-serif mt-1 text-3xl font-semibold">公開キャラクター</h2></div><p className="detail-mono text-[9px] text-stone-500">{characters.length.toString().padStart(2, "0")} RECORDS</p></div><div className="flex gap-3 overflow-x-auto pb-2">{characters.map((character, index) => <button type="button" key={character.id} onClick={() => setSelectedId(character.id)} className={cn("group relative min-w-36 overflow-hidden border p-3 text-left transition-all duration-200", selected?.id === character.id ? "border-stone-900 bg-stone-900 text-stone-50" : "border-stone-300 bg-stone-50/30 hover:border-stone-700")}><p className={cn("detail-mono text-[8px]", selected?.id === character.id ? "text-stone-300" : "text-stone-500")}>{String(index + 1).padStart(2, "0")} / {character.path || "PATH"}</p><div className="mt-3 flex items-center gap-2"><div className="h-8 w-8 overflow-hidden rounded-full bg-stone-200">{character.portrait && <img src={character.portrait} alt="" className="h-full w-full object-cover" />}</div><p className="truncate text-sm font-semibold">{character.name}</p></div></button>)}</div></section></>}
      {selected && (
        <section className="mt-10">
          <div className="grid gap-7 lg:grid-cols-[.78fr_1.22fr]">
            <aside className="relative min-h-[390px] overflow-hidden bg-stone-900 p-6 text-stone-50 sm:p-8">
              {selected.portrait && <img src={selected.portrait} alt="" className="absolute inset-0 h-full w-full object-cover object-top opacity-55 mix-blend-screen" />}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-stone-800/10" />
              <div className="relative flex h-full min-h-[340px] flex-col justify-between">
                <div className="flex justify-between"><p className="detail-mono text-[9px] text-stone-300">SELECTED RECORD</p><p className="detail-mono text-[9px] text-stone-300">LV.{selected.level ?? "—"} / E{selected.rank ?? 0}</p></div>
                <div><div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: selected.elementColor ?? "#c28a42" }} /><span className="detail-mono text-[9px] text-stone-200">{selected.element} / {selected.path}</span></div><h2 className="display-serif text-5xl font-semibold tracking-tight">{selected.name}</h2><p className="mt-3 max-w-sm font-serif text-sm leading-6 text-stone-200">{selected.guide.headline}</p></div>
              </div>
            </aside>
            <div className="paper-card border border-stone-300 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4"><div><p className="detail-mono text-[9px] text-amber-800">CURRENT EQUIPMENT / PROFILE</p><h3 className="display-serif mt-1 text-3xl font-semibold">現在のビルド</h3></div><ArrowDownRight className="h-5 w-5" /></div><div className="editorial-rule mt-6" />
              <div className="mt-6 grid gap-6 sm:grid-cols-2"><div><p className="detail-mono text-[9px] text-stone-500">LIGHT CONE</p>{selected.lightCone ? <div className="mt-3 flex gap-3"><div className="h-14 w-11 shrink-0 bg-stone-200">{selected.lightCone.icon && <img src={selected.lightCone.icon} alt="" className="h-full w-full object-contain" />}</div><div><p className="font-serif font-semibold">{selected.lightCone.name}</p><p className="detail-mono mt-1 text-[9px] text-stone-500">LV.{selected.lightCone.level ?? "—"} / S{selected.lightCone.rank ?? "—"}</p></div></div> : <p className="mt-3 text-sm text-stone-500">光円錐の公開情報はありません。</p>}</div><div><p className="detail-mono text-[9px] text-stone-500">CURRENT STATS</p><div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">{selected.allStats.slice(0, 10).map((stat) => <p key={stat.name} className="flex items-baseline justify-between gap-2 border-b border-stone-200 pb-1 text-xs"><span className="text-stone-500">{stat.name}</span><span className="font-semibold text-stone-900">{stat.display}</span></p>)}</div></div></div>
            </div>
          </div>
          <div className="mt-7 grid gap-7 lg:grid-cols-[1.22fr_.78fr]">
            <section className="paper-card border border-stone-300 p-6 sm:p-8"><div><p className="detail-mono text-[9px] text-amber-800">TARGET MATRIX</p><h3 className="display-serif mt-1 text-3xl font-semibold">目標ステータス</h3></div><p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">{query.data?.dataSource === "Enka" ? "Enkaの生データを静的データと結合して表示しています。比較値はキャラクターの基礎値・解放済み軌跡・遺物の公開値から算出し、戦闘中バフと光円錐の条件付き効果は含みません。" : "同一ステータスごとに現在値を照合します。緑は達成済み、赤は未達成、横線は公開データに値がない状態です。"}</p><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-left"><thead><tr className="border-y border-stone-400"><th className="py-3 detail-mono text-[9px] font-medium text-stone-500">STAT</th><th className="py-3 text-right detail-mono text-[9px] font-medium text-stone-500">CURRENT</th>{TIERS.map((tier) => <th key={tier} className="py-3 text-right detail-mono text-[9px] font-medium text-stone-500">{tier}</th>)}</tr></thead><tbody>{selected.comparisons.map((comparison) => <tr key={comparison.key} className="border-b border-stone-200"><td className="py-4 font-serif font-semibold">{comparison.label}</td><td className="py-4 text-right font-semibold">{comparison.currentDisplay}</td>{TIERS.map((tier) => <td key={tier} className="py-4"><div className="flex items-center justify-end gap-2"><span className={cn("text-xs", comparison.achieved[tier] === false ? "text-rose-800" : "text-stone-700")}>{comparison.targets[tier]}{comparison.unit}</span><TierMark passed={comparison.achieved[tier]} /></div></td>)}</tr>)}</tbody></table></div></section>
            <section className="border border-stone-900 bg-amber-950 p-6 text-stone-50 sm:p-8"><p className="detail-mono text-[9px] text-amber-200">CURATED RECOMMENDATION</p><h3 className="display-serif mt-2 text-3xl font-semibold">遺物設計</h3><div className="mt-6 space-y-5"><div className="border-l border-amber-300 pl-4"><p className="detail-mono text-[9px] text-amber-200">CAVERN RELIC</p><p className="mt-1 font-serif text-lg">{selected.guide.relicSet}</p></div><div className="border-l border-amber-300 pl-4"><p className="detail-mono text-[9px] text-amber-200">PLANAR ORNAMENT</p><p className="mt-1 font-serif text-lg">{selected.guide.planarSet}</p></div></div><div className="mt-8 border-t border-amber-200/40 pt-5"><p className="detail-mono text-[9px] text-amber-200">MAIN STATS</p><div className="mt-3 space-y-2">{selected.guide.mainStats.map((stat) => <div key={stat.slot} className="flex items-start justify-between gap-4 text-sm"><span className="text-stone-300">{stat.slot}</span><span className="text-right font-semibold">{stat.value}</span></div>)}</div></div></section>
          </div>
          <section className="mt-7 paper-card border border-stone-300 p-6 sm:p-8"><div className="flex items-end justify-between"><div><p className="detail-mono text-[9px] text-amber-800">EQUIPPED RELICS</p><h3 className="display-serif mt-1 text-3xl font-semibold">装備中の遺物</h3></div><p className="detail-mono text-[9px] text-stone-500">{selected.relics.length.toString().padStart(2, "0")} PIECES</p></div><div className="mt-7 grid gap-x-6 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">{selected.relics.map((relic) => <RelicCard key={relic.id} relic={relic} />)}</div></section>
        </section>
      )}
    </main>
  </div>;
}
