/**
 * 卓球ラバー図鑑 / RUBBER INDEX — Tempo Ledger
 * Design reminder: Friction Greenを接触点・選択・検証済みの署名色とし、Court Tempoは診断導線、Technical Ledgerは公式根拠を示す補助構造として扱う。
 */
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Columns3,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { playStyles, rubbers, sources, type PlayStyle, type Rubber, type RubberType } from "@/lib/rubberData";

type SortMode = "fit" | "priceAsc" | "priceDesc" | "hardness" | "spin" | "speed" | "control";

const brandColors: Record<Rubber["brand"], string> = {
  Butterfly: "border-[#e78f86] bg-[#fff0ef] text-[#8f3028]",
  Nittaku: "border-[#d6a3a3] bg-[#fff4f3] text-[#8f3030]",
  VICTAS: "border-[#9eb9df] bg-[#edf5ff] text-[#174f8e]",
  Yasaka: "border-[#9fc9e4] bg-[#eff9ff] text-[#236387]",
  TIBHAR: "border-[#aac2bd] bg-[#eff8f4] text-[#275d51]",
  XIOM: "border-[#d9ba86] bg-[#fff8ea] text-[#765218]",
  STIGA: "border-[#adc7e9] bg-[#f0f6ff] text-[#1b5ca8]",
  DONIC: "border-[#a8bfed] bg-[#eef3ff] text-[#173f85]",
  andro: "border-[#cbb7e8] bg-[#f7f1ff] text-[#674596]",
};

const hardnessOrder: Record<Rubber["hardness"], number> = { "軟": 1, "中": 2, "中硬": 3, "硬": 4, "—": 0 };
const hardnessOptions: Rubber["hardness"][] = ["軟", "中", "中硬", "硬", "—"];

function scoreForStyle(rubber: Rubber, style: PlayStyle) {
  const base = rubber.speed + rubber.spin + rubber.control;
  return rubber.styles.includes(style) ? base + 20 : base;
}

function Meter({ value, label, light = false }: { value: number; label: string; light?: boolean }) {
  return (
    <div>
      <div className={`mb-1.5 flex justify-between text-[9px] font-black tracking-[0.13em] ${light ? "text-[#bcd1e9]" : "text-[#607389]"}`}>
        <span>{label}</span><span>{value}.0</span>
      </div>
      <div className="flex gap-1" aria-label={`${label}: ${value} / 5`}>
        {[1, 2, 3, 4, 5].map((point) => <i key={point} className={`h-1.5 flex-1 ${point <= value ? (light ? "bg-[#c7fa42]" : "bg-[#1768db]") : (light ? "bg-white/20" : "bg-[#d9e4ee]")}`} />)}
      </div>
    </div>
  );
}

function ProductCard({ rubber, selected, onToggle, onInspect }: { rubber: Rubber; selected: boolean; onToggle: () => void; onInspect: () => void }) {
  return (
    <article className="group relative border border-[#cbd8e1] bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[#1768db] hover:shadow-[8px_8px_0_rgba(23,104,219,.12)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#1768db] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5"><span className={`border px-2 py-1 text-[9px] font-black tracking-[.11em] ${brandColors[rubber.brand]}`}>{rubber.brand.toUpperCase()}</span><span className="border border-[#cad9e8] bg-[#f4f8fc] px-2 py-1 text-[9px] font-black tracking-[.11em] text-[#31516d]">{rubber.type}</span></div>
        <button onClick={onToggle} aria-pressed={selected} aria-label={`${rubber.name}を比較${selected ? "から外す" : "に追加"}`} className={`grid h-8 w-8 place-items-center rounded-full border text-sm font-black transition ${selected ? "border-[#1768db] bg-[#1768db] text-white" : "border-[#8ba0b3] bg-white text-[#1b3855] hover:border-[#1768db]"}`} type="button">{selected ? <Check size={15} strokeWidth={3} /> : "+"}</button>
      </div>
      <p className="mt-7 text-[9px] font-black tracking-[.12em] text-[#5a7490]">OFFICIAL NOTE / {rubber.officialNote}</p>
      <h3 className="mt-2 text-xl font-black leading-[1.08] tracking-[-.045em] text-[#102d4d]">{rubber.name}</h3>
      <p className="mt-2 min-h-10 text-xs leading-5 text-[#5e7082]">{rubber.suitableFor}</p>
      <div className="my-5 grid grid-cols-3 gap-3 border-y border-[#dce5ec] py-4"><Meter value={rubber.speed} label="SPEED" /><Meter value={rubber.spin} label="SPIN" /><Meter value={rubber.control} label="CTRL" /></div>
      <div className="border-l-2 border-[#c7fa42] pl-3"><div className="grid grid-cols-3 gap-2"><div><p className="text-[8px] font-black tracking-[.1em] text-[#607389]">PRICE</p><p className="mt-1 text-xs font-black text-[#132f4e]">{rubber.priceLabel}</p></div><div><p className="text-[8px] font-black tracking-[.1em] text-[#607389]">HARDNESS</p><p className="mt-1 text-xs font-black text-[#132f4e]">{rubber.hardness}</p></div><div><p className="text-[8px] font-black tracking-[.1em] text-[#607389]">CHECKED</p><p className="mt-1 text-xs font-black text-[#2c6a4c]">2026.08</p></div></div><div className="mt-3 flex items-center justify-between"><span className="inline-flex items-center gap-1 bg-[#e9fbd5] px-2 py-1 text-[8px] font-black tracking-[.08em] text-[#285b36]">● 公式確認済</span><button onClick={onInspect} className="text-[10px] font-black text-[#1768db] underline underline-offset-4" type="button">根拠を確認</button></div></div>
    </article>
  );
}

function PairTicket({ role, rubber, reason, onCompare }: { role: string; rubber: Rubber; reason: string; onCompare: () => void }) {
  return <article className="p-6"><p className="font-mono text-[10px] font-black tracking-[.14em] text-[#c7fa42]">{role}</p><h3 className="mt-4 text-2xl font-black tracking-[-.05em]">{rubber.name}</h3><p className="mt-2 text-xs text-[#b8cbe0]">{rubber.brand} / {rubber.type} / {rubber.hardness}</p><p className="mt-5 text-xs leading-5 text-[#e1ebf5]">{reason}</p><div className="mt-6 grid grid-cols-3 gap-3"><Meter value={rubber.speed} label="SPEED" light /><Meter value={rubber.spin} label="SPIN" light /><Meter value={rubber.control} label="CTRL" light /></div><div className="mt-6 flex items-center justify-between border-t border-white/15 pt-4"><span className="text-sm font-black text-[#c7fa42]">{rubber.priceLabel}</span><button onClick={onCompare} className="text-[10px] font-black text-white underline decoration-[#c7fa42] underline-offset-4" type="button">比較に追加</button></div></article>;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<PlayStyle>("spin");
  const [maxPrice, setMaxPrice] = useState(11000);
  const [hardnesses, setHardnesses] = useState<Rubber["hardness"][]>([]);
  const [type, setType] = useState<"すべて" | RubberType>("すべて");
  const [brand, setBrand] = useState<"すべて" | Rubber["brand"]>("すべて");
  const [sort, setSort] = useState<SortMode>("fit");
  const [compared, setCompared] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [inspected, setInspected] = useState<Rubber | null>(null);

  const brands = useMemo(() => ["すべて", ...Array.from(new Set(rubbers.map((rubber) => rubber.brand)))], []);
  const currentStyle = playStyles.find((item) => item.id === style) ?? playStyles[0];
  const filtered = useMemo(() => {
    const products = rubbers.filter((rubber) => {
      const matchesQuery = `${rubber.name} ${rubber.brand} ${rubber.type} ${rubber.officialNote}`.toLowerCase().includes(query.toLowerCase());
      const matchesPrice = rubber.price === null || rubber.price <= maxPrice;
      const matchesHardness = hardnesses.length === 0 || hardnesses.includes(rubber.hardness);
      return matchesQuery && matchesPrice && matchesHardness && (type === "すべて" || rubber.type === type) && (brand === "すべて" || rubber.brand === brand);
    });
    return [...products].sort((a, b) => {
      if (sort === "fit") return scoreForStyle(b, style) - scoreForStyle(a, style);
      if (sort === "priceAsc") return (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER);
      if (sort === "priceDesc") return (b.price ?? 0) - (a.price ?? 0);
      if (sort === "hardness") return hardnessOrder[a.hardness] - hardnessOrder[b.hardness];
      return b[sort] - a[sort];
    });
  }, [brand, hardnesses, maxPrice, query, sort, style, type]);
  const displayed = showAll ? filtered : filtered.slice(0, 18);
  const pair = useMemo(() => {
    const candidates = rubbers.filter((rubber) => rubber.styles.includes(style));
    const fore = [...candidates].sort((a, b) => (b.speed + b.spin) - (a.speed + a.spin))[0] ?? rubbers[0];
    const back = [...candidates].filter((rubber) => rubber.id !== fore.id).sort((a, b) => b.control - a.control)[0] ?? candidates[0] ?? rubbers[1];
    return { fore, back };
  }, [style]);
  const comparedRubbers = rubbers.filter((rubber) => compared.includes(rubber.id));

  const toggleCompare = (id: string) => setCompared((current) => current.includes(id) ? current.filter((item) => item !== id) : (current.length >= 3 ? [...current.slice(1), id] : [...current, id]));
  const reset = () => { setQuery(""); setMaxPrice(11000); setHardnesses([]); setType("すべて"); setBrand("すべて"); setSort("fit"); setShowAll(false); };
  const toggleHardness = (value: Rubber["hardness"]) => setHardnesses((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const runAnalysis = () => { if (analyzing) return; setAnalyzing(true); setAnalysisComplete(false); setAnalysisStep(1); window.setTimeout(() => setAnalysisStep(2), 350); window.setTimeout(() => setAnalysisStep(3), 720); window.setTimeout(() => { setAnalysisComplete(true); setAnalyzing(false); }, 1080); };

  return <div className="min-h-screen overflow-x-hidden bg-[#f7f4ed] text-[#102d4d] selection:bg-[#c7fa42]">
    <header className="sticky top-0 z-40 border-b border-[#cbd8e1] bg-[#f7f4ed]/95 backdrop-blur-xl"><div className="mx-auto flex h-[74px] max-w-[1536px] items-center justify-between gap-4 px-5 lg:px-10"><a href="#top" className="flex items-center gap-3"><img src="/manus-storage/rubber-index-mark_9a57d3c9.png" alt="卓球ラバー図鑑" className="h-9 w-9 object-contain" /><span className="font-display text-xl font-black tracking-[-.05em]">RUBBER <span className="text-[#1768db]">INDEX</span></span></a><nav className="hidden items-center gap-7 text-[10px] font-black tracking-[.12em] text-[#34516c] md:flex"><a href="#diagnose" className="hover:text-[#1768db]">DIAGNOSE</a><a href="#ledger" className="hover:text-[#1768db]">SPEC LEDGER</a><a href="#how-to-read" className="hover:text-[#1768db]">METHOD</a></nav><a href="#diagnose" className="bg-[#c7fa42] px-3 py-2 text-[10px] font-black tracking-[.1em] text-[#102d4d] transition hover:bg-[#102d4d] hover:text-white">セットを診断 <ArrowDownRight className="ml-1 inline" size={14} /></a></div></header>
    <main id="top">
      <section className="relative overflow-hidden border-b border-[#cbd8e1] bg-[linear-gradient(112deg,#f7f4ed_0%,#f7f4ed_58%,#e8f1fc_58%,#e8f1fc_100%)]"><div className="pointer-events-none absolute -right-[12vw] -top-[28vw] h-[68vw] w-[68vw] rounded-full border border-[#1768db]/25 shadow-[0_0_0_70px_rgba(23,104,219,.04),0_0_0_140px_rgba(23,104,219,.025)]" /><div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(23,104,219,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(23,104,219,.07)_1px,transparent_1px)] [background-size:32px_32px]" /><div className="pointer-events-none absolute left-[43%] top-[22%] h-3 w-3 rounded-full bg-[#c7fa42] shadow-[0_0_0_8px_rgba(199,250,66,.18)]" /><div className="relative mx-auto grid min-h-[520px] max-w-[1536px] grid-cols-1 gap-12 px-5 py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:py-20"><div><p className="font-mono text-[10px] font-black tracking-[.15em] text-[#1768db]">RUBBER INDEX / VERIFIED REFERENCE / 2026.08</p><h1 className="mt-7 font-display text-[clamp(4.7rem,9.5vw,9.2rem)] font-black leading-[.72] tracking-[-.08em]">COMPARE<br />PRICE.<br /><span className="text-[#1768db]">HARDNESS.</span><br /><span className="text-[#102d4d]">EVIDENCE.</span></h1><p className="mt-8 max-w-[530px] text-sm leading-7 text-[#405b75]">定価・硬度・性能傾向・公式確認日を、同じ索引で読む。プレイスタイル診断は、比較を始めるための入口です。</p><a href="#diagnose" className="mt-8 inline-flex items-center gap-3 bg-[#c7fa42] px-5 py-3 text-xs font-black tracking-[.08em] text-[#102d4d] transition hover:bg-[#102d4d] hover:text-white">診断から候補を読む <ArrowDownRight size={16} /></a></div><div className="relative self-end border border-[#1768db] bg-[#102d4d] p-7 text-white shadow-[0_22px_50px_rgba(13,48,93,.18)]"><div className="absolute inset-5 border border-white/20" /><div className="relative"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] font-black tracking-[.13em] text-[#c7fa42]">REFERENCE READOUT</p><p className="mt-2 text-lg font-black">INDEX / VERIFY / SELECT.</p></div><p className="font-display text-5xl font-black leading-[.7] text-[#c7fa42]">{rubbers.length}<br /><span className="text-base text-white">MODELS</span></p></div><div className="mt-12 grid grid-cols-3 gap-3"><StepStat number="01" label="OFFICIAL PRICE" active /><StepStat number="02" label="SPEC CHECK" active /><StepStat number="03" label="STYLE FIT" active={analysisComplete} /></div><p className="mt-6 border-t border-white/15 pt-3 text-[10px] font-bold tracking-[.08em] text-[#bcd1e9]">DATA FIELD / PRICE · HARDNESS · TYPE · PERFORMANCE · CHECK DATE</p></div></div></div></section>
      <section id="diagnose" className="mx-auto max-w-[1536px] px-5 py-20 lg:px-10"><SectionHead eyebrow="01 / DIAGNOSE" title={<>プレーのテンポを、<br />選択基準にする。</>} body="スタイルを選んでセットを解析すると、フォアとバックの役割を分けた候補を表示します。" index="01" /><div className="mt-8 grid border border-[#102d4d] bg-white lg:grid-cols-[1.1fr_.9fr]"><div className="p-6 lg:p-8"><p className="font-mono text-[10px] font-black tracking-[.13em] text-[#1768db]">01 / STYLE</p><div className="mt-5 grid gap-2 sm:grid-cols-2">{playStyles.filter((item) => ["spin","counter","control","defense"].includes(item.id)).map((item) => <button key={item.id} onClick={() => { setStyle(item.id); setAnalysisComplete(false); }} className={`min-h-[130px] border p-5 text-left transition ${style === item.id ? "border-[#c7fa42] bg-[#c7fa42] text-[#102d4d] shadow-[inset_0_-5px_0_#102d4d]" : "border-[#cbd8e1] bg-white hover:-translate-y-0.5 hover:border-[#1768db]"}`} type="button"><span className={`font-mono text-[10px] font-black ${style === item.id ? "text-[#1768db]" : "text-[#e95444]"}`}>{item.number}</span><strong className="mt-7 block text-lg tracking-[-.04em]">{item.title}</strong><small className={`mt-1 block text-[11px] ${style === item.id ? "text-[#314968]" : "text-[#64788c]"}`}>{item.subtitle}</small></button>)}</div></div><div className="relative overflow-hidden bg-[#ebf4fc] p-6 lg:p-8"><div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full border border-[#1768db]/20 shadow-[0_0_0_30px_rgba(23,104,219,.04),0_0_0_60px_rgba(23,104,219,.03)]" /><div className="relative"><p className="font-mono text-[10px] font-black tracking-[.13em] text-[#1768db]">02 / PAIRING</p><p className="mt-5 max-w-md text-sm leading-6 text-[#42627e]">{currentStyle.description} フォアには主導権を取る性能、バックにはラリーを支える性能を割り当てます。</p><button onClick={runAnalysis} disabled={analyzing} className="mt-7 inline-flex items-center gap-3 bg-[#c7fa42] px-5 py-3 text-xs font-black tracking-[.08em] text-[#102d4d] transition hover:bg-[#102d4d] hover:text-white disabled:opacity-70" type="button"><span className={`h-2 w-2 rounded-full bg-[#1768db] ${analyzing ? "animate-ping" : ""}`} />{analyzing ? `解析中 ${analysisStep}/3` : "セットを解析する"} <ArrowDownRight size={15} /></button><p className="mt-4 font-mono text-[10px] font-black tracking-[.08em] text-[#1768db]">{analysisComplete ? "COMPLETE / 推奨セットを表示しました" : `READY / STYLE: ${currentStyle.title}`}</p></div></div></div>
      {analysisComplete && <div className="mt-5 overflow-hidden border border-[#102d4d] bg-[#102d4d] text-white motion-safe:animate-[fadeIn_.45s_ease-out]"><div className="flex items-center justify-between border-b border-white/15 px-6 py-4"><div><p className="font-mono text-[10px] font-black tracking-[.13em] text-[#c7fa42]">PAIRING RESULT / {currentStyle.title}</p><p className="mt-1 text-sm font-black">フォアとバックの役割を分けた提案セット</p></div><div className="flex gap-1"><i className="h-1 w-6 bg-[#c7fa42]" /><i className="h-1 w-6 bg-[#c7fa42]" /><i className="h-1 w-6 bg-[#c7fa42]" /></div></div><div className="grid lg:grid-cols-[1fr_60px_1fr]"><PairTicket role="FOREHAND / 主導権を取る" rubber={pair.fore} reason="得点につながる球質と、主導権を握るためのスピード・回転を優先。" onCompare={() => toggleCompare(pair.fore.id)} /><div className="relative z-10 grid place-items-center"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e95444] text-lg">↔</span></div><div className="border-t border-white/15 lg:border-l lg:border-t-0"><PairTicket role="BACKHAND / 安定してつなぐ" rubber={pair.back} reason="台上・ブロック・ラリーの再現性を支えるコントロールを優先。" onCompare={() => toggleCompare(pair.back.id)} /></div></div></div>}</section>
      <section id="ledger" className="bg-[#e9f0f5] px-5 py-20 lg:px-10"><div className="mx-auto grid max-w-[1536px] gap-8 lg:grid-cols-[270px_1fr]"><aside className="h-fit border border-[#c5d4df] bg-white lg:sticky lg:top-[98px]"><div className="border-b border-[#c5d4df] bg-[#eff6fc] p-5"><p className="font-mono text-[10px] font-black tracking-[.13em] text-[#1768db]">FILTER RAIL</p><h2 className="mt-2 font-display text-3xl font-black tracking-[-.05em]">REFINE THE SET.</h2></div><div className="space-y-5 p-5"><FilterLabel label="PRICE CEILING" value={`¥${maxPrice.toLocaleString("ja-JP")}`} /><input aria-label="価格上限" type="range" min="2000" max="11000" step="500" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#1768db]" /><FilterLabel label="HARDNESS" /> <div className="grid grid-cols-2 gap-2">{hardnessOptions.map((option) => <button key={option} onClick={() => toggleHardness(option)} className={`border px-2 py-2 text-[10px] font-black ${hardnesses.includes(option) ? "border-[#1768db] bg-[#1768db] text-white" : "border-[#cbd8e1] bg-white text-[#52697d]"}`} type="button">{option}</button>)}</div><FilterLabel label="RUBBER TYPE" /><Select value={type} onChange={(value) => setType(value as typeof type)} options={["すべて","裏ソフト","表ソフト","粒高","アンチ"]} /><FilterLabel label="BRAND" /><Select value={brand} onChange={(value) => setBrand(value as typeof brand)} options={brands} /><FilterLabel label="SORT BY" /><Select value={sort} onChange={(value) => setSort(value as SortMode)} options={["fit","priceAsc","priceDesc","hardness","spin","speed","control"]} labels={{ fit:"スタイル適合度", priceAsc:"価格：低い順", priceDesc:"価格：高い順", hardness:"硬度：低い順", spin:"回転：高い順", speed:"スピード：高い順", control:"コントロール：高い順" }} /><button onClick={reset} className="flex w-full items-center justify-center gap-2 bg-[#edf3f7] py-3 text-[10px] font-black text-[#4f677d] transition hover:bg-[#102d4d] hover:text-white" type="button"><RotateCcw size={13} /> 条件をリセット</button></div></aside><div><div className="flex flex-col gap-5 border-b border-[#c5d4df] pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] font-black tracking-[.13em] text-[#1768db]">03 / SPEC LEDGER</p><h2 className="mt-3 font-display text-5xl font-black tracking-[-.06em]">候補を、仕様で検証する。</h2><p className="mt-3 max-w-xl text-xs leading-6 text-[#52697d]">キーワード、価格上限、硬度、種別、メーカーを複合し、スタイル適合度または性能値で並び替えます。</p></div><div className="text-left sm:text-right"><p className="font-display text-5xl font-black text-[#1768db]">{filtered.length}</p><p className="font-mono text-[10px] font-black tracking-[.13em] text-[#607389]">CATALOG ENTRIES</p></div></div><div className="mt-6 border border-[#c5d4df] bg-white p-1"><label className="flex items-center gap-3 px-4 py-2"><Search size={19} className="text-[#1768db]" /><input value={query} onChange={(e) => { setQuery(e.target.value); setShowAll(false); }} placeholder="製品名・ブランド・種別・公式説明で検索" className="w-full bg-transparent py-2 text-sm font-bold outline-none placeholder:text-[#7b8d9e]" type="search" /><SlidersHorizontal size={17} className="text-[#607389]" /></label></div><div className="mt-6 flex items-center justify-between gap-4"><p className="text-xs font-bold text-[#597085]"><Columns3 className="mr-1 inline" size={15} /> 比較には最大3件まで追加できます</p><p className="text-[10px] font-black tracking-[.08em] text-[#e95444]">価格・種別：公式確認済み</p></div>{displayed.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{displayed.map((rubber) => <ProductCard key={rubber.id} rubber={rubber} selected={compared.includes(rubber.id)} onToggle={() => toggleCompare(rubber.id)} onInspect={() => setInspected(rubber)} />)}</div> : <div className="mt-5 border border-dashed border-[#a7bac9] bg-white p-14 text-center"><Filter className="mx-auto text-[#607389]" /><p className="mt-4 font-black">条件に合うモデルがありません。</p><button onClick={reset} className="mt-3 text-xs font-black text-[#1768db] underline underline-offset-4" type="button">条件をリセット</button></div>}{!showAll && filtered.length > displayed.length && <button onClick={() => setShowAll(true)} className="mt-7 w-full bg-[#102d4d] py-4 text-[11px] font-black tracking-[.12em] text-white transition hover:bg-[#1768db]" type="button">残り {filtered.length - displayed.length} 件を表示 <ChevronDown className="ml-1 inline" size={14} /></button>}</div></div></section>
      <section id="how-to-read" className="relative overflow-hidden px-5 py-20 lg:px-10"><div className="pointer-events-none absolute right-0 top-0 h-full w-[44%] opacity-70"><img src="/manus-storage/rubber-index-sponge-detail_a01c62a9.jpg" alt="" className="h-full w-full object-cover object-left mix-blend-multiply" /></div><div className="relative mx-auto grid max-w-[1536px] gap-10 lg:grid-cols-[240px_1fr]"><p className="font-mono text-[10px] font-black tracking-[.14em] text-[#1768db]">04 / METHOD</p><div><h2 className="font-display text-5xl font-black tracking-[-.06em]">診断は入口。<br />根拠が、選択を支える。</h2><p className="mt-6 max-w-2xl text-sm leading-7 text-[#52697d]">定価と種別はメーカー公式ページで確認し、価格・終売・仕様変更の可能性を明示します。速度・回転・コントロールは、メーカー間の表記差を補うための相対目安です。</p><div className="mt-10 grid max-w-3xl gap-px border border-[#c5d4df] bg-[#c5d4df] sm:grid-cols-3"><MethodCell no="01" title="公式価格" body="税込価格またはオープン価格を明記" /><MethodCell no="02" title="硬度・種別" body="打球感と使い方の入口に" /><MethodCell no="03" title="性能傾向" body="サイト内比較のための相対目安" /></div></div></div></section>
    </main>
    <footer className="border-t border-[#294865] bg-[#102d4d] px-5 py-10 text-white lg:px-10"><div className="mx-auto flex max-w-[1536px] flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><p className="font-display text-xl font-black">TEMPO <span className="text-[#c7fa42]">LEDGER</span></p><p className="mt-3 max-w-xl text-xs leading-5 text-[#c2d1df]">掲載価格は2026年8月にメーカー公式情報で確認した表示価格です。購入前には必ず各公式ページで最新情報をご確認ください。</p></div><div><p className="font-mono text-[10px] font-black tracking-[.13em] text-[#c7fa42]">PRIMARY SOURCES</p><div className="mt-3 flex max-w-2xl flex-wrap gap-x-4 gap-y-2">{sources.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-white hover:text-[#c7fa42]">{source.name} <ArrowUpRight className="inline" size={11} /></a>)}</div></div></div></footer>
    {compared.length > 0 && <div className="fixed bottom-4 left-4 right-4 z-50 border border-[#c7fa42] bg-[#102d4d] p-4 text-white shadow-2xl lg:left-auto lg:right-6 lg:w-[680px]"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-black tracking-[.13em] text-[#c7fa42]">COMPARE LEDGER</p><p className="mt-1 text-sm font-black">比較中 {compared.length} / 3</p></div><button onClick={() => setCompared([])} className="text-[10px] font-black text-[#c5d6e6] hover:text-white" type="button">すべて外す</button></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{comparedRubbers.map((rubber) => <div key={rubber.id} className="border border-white/15 p-3"><p className="font-mono text-[9px] font-black text-[#c7fa42]">{rubber.brand.toUpperCase()}</p><p className="mt-1 text-sm font-black leading-5">{rubber.name}</p><p className="mt-2 text-[10px] text-[#c7d6e5]">{rubber.priceLabel} / {rubber.hardness}</p><div className="mt-3 grid grid-cols-3 gap-1 text-[9px] text-[#c7d6e5]"><span>S {rubber.speed}</span><span>R {rubber.spin}</span><span>C {rubber.control}</span></div></div>)}</div></div>}
    {inspected && <div className="fixed inset-0 z-[60] flex justify-end bg-[#0f2439]/40 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="製品根拠情報"><div className="h-full w-full max-w-[420px] overflow-auto border border-[#102d4d] bg-white p-7 shadow-2xl motion-safe:animate-[slideIn_.3s_ease-out]"><button onClick={() => setInspected(null)} className="ml-auto grid h-8 w-8 place-items-center border border-[#102d4d]" aria-label="閉じる" type="button"><X size={16} /></button><p className="mt-8 font-mono text-[10px] font-black tracking-[.14em] text-[#1768db]">OFFICIAL CHECK / 2026.08</p><h2 className="mt-3 font-display text-5xl font-black tracking-[-.06em]">{inspected.name}</h2><p className="mt-2 text-xs font-bold text-[#607389]">{inspected.brand} / {inspected.type}</p><p className="mt-7 text-sm leading-7 text-[#51677b]">{inspected.officialNote}</p><div className="mt-7 border-y border-[#cbd8e1]">{[["PRICE", inspected.priceLabel], ["HARDNESS", inspected.hardness], ["SPEED", `${inspected.speed}.0 / 5`], ["SPIN", `${inspected.spin}.0 / 5`], ["CONTROL", `${inspected.control}.0 / 5`]].map(([label,value]) => <div className="flex justify-between border-b border-[#e1e8ee] py-3 text-xs last:border-0" key={label}><b className="font-mono text-[10px] tracking-[.1em] text-[#607389]">{label}</b><span className="font-black">{value}</span></div>)}</div><a href={inspected.source} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 bg-[#102d4d] px-4 py-3 text-xs font-black text-white hover:bg-[#1768db]">公式情報を開く <ArrowUpRight size={15} /></a></div></div>}
  </div>;
}

function StepStat({ number, label, active = false }: { number: string; label: string; active?: boolean }) { return <div className={`border-t-2 pt-2 ${active ? "border-[#c7fa42]" : "border-white/25"}`}><p className={`font-display text-3xl font-black leading-none ${active ? "text-[#c7fa42]" : "text-white"}`}>{number}</p><p className="mt-1 text-[9px] font-black tracking-[.1em] text-[#c1d1e1]">{label}</p></div>; }
function SectionHead({ eyebrow, title, body, index }: { eyebrow: string; title: React.ReactNode; body: string; index: string }) { return <div className="grid gap-6 border-b border-[#cbd8e1] pb-7 lg:grid-cols-[220px_1fr_120px] lg:items-end"><p className="font-mono text-[10px] font-black tracking-[.14em] text-[#1768db]">{eyebrow}</p><div><h2 className="font-display text-5xl font-black leading-[.82] tracking-[-.06em]">{title}</h2><p className="mt-5 max-w-xl text-xs leading-6 text-[#51677b]">{body}</p></div><p className="font-display text-6xl font-black leading-none text-[#1768db] lg:text-right">{index}<span className="mt-2 block font-mono text-[9px] tracking-[.12em] text-[#607389]">STEP / 03</span></p></div>; }
function FilterLabel({ label, value }: { label: string; value?: string }) { return <label className="flex justify-between text-[10px] font-black tracking-[.12em] text-[#3d5973]"><span>{label}</span>{value && <output className="text-[#e95444]">{value}</output>}</label>; }
function Select({ value, onChange, options, labels }: { value: string; onChange: (value: string) => void; options: readonly string[]; labels?: Record<string, string> }) { return <div className="relative"><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none border border-[#cbd8e1] bg-white px-3 py-3 pr-9 text-xs font-bold text-[#102d4d] outline-none focus:border-[#1768db]">{options.map((option) => <option key={option} value={option}>{labels?.[option] ?? option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#607389]" size={15} /></div>; }
function MethodCell({ no, title, body }: { no: string; title: string; body: string }) { return <div className="bg-[#f7f4ed] p-5"><p className="font-mono text-[10px] font-black text-[#1768db]">{no}</p><h3 className="mt-8 font-black">{title}</h3><p className="mt-2 text-xs leading-5 text-[#607389]">{body}</p></div>; }
