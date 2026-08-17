/**
 * 卓球ラバー図鑑 / ラボ・アーカイブ
 * Design reminder: 左の観察レールと右の製品キャンバス、濃紺・温白・Friction Greenで比較の精度を可視化する。
 */
import { Button } from "@/components/ui/button";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Filter,
  Gauge,
  Grid2X2,
  Minus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  getRecommendedRubbers,
  playStyles,
  rubbers,
  sources,
  type PlayStyle,
  type Rubber,
  type RubberType,
} from "@/lib/rubberData";

const brandColors: Record<Rubber["brand"], string> = {
  Butterfly: "border border-[#e93947]/30 bg-[#e93947]/10 text-[#9a1f2a]",
  Nittaku: "border border-[#d62e2e]/30 bg-[#d62e2e]/10 text-[#991c1c]",
  VICTAS: "border border-[#0b356d]/25 bg-[#0b356d]/10 text-[#0b356d]",
};

const typeColors: Record<RubberType, string> = {
  裏ソフト: "bg-[#e7efff] text-[#0b356d]",
  表ソフト: "bg-[#fff1c9] text-[#72530b]",
  粒高: "bg-[#e9f9e1] text-[#24774c]",
  アンチ: "bg-[#efebf8] text-[#59447f]",
};

function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] font-bold tracking-[0.14em] text-[#647386]">
        <span>{label}</span>
        <span className="font-mono text-[#15253b]">{value}.0</span>
      </div>
      <div className="flex gap-1" aria-label={`${label} ${value} / 5`}>
        {[1, 2, 3, 4, 5].map((point) => (
          <span
            className={`h-1.5 flex-1 ${point <= value ? "bg-[#b9ef39]" : "bg-[#dfe6ec]"}`}
            key={point}
          />
        ))}
      </div>
    </div>
  );
}

function RubberCard({
  rubber,
  selected,
  onToggle,
  emphasis = false,
}: {
  rubber: Rubber;
  selected: boolean;
  onToggle: () => void;
  emphasis?: boolean;
}) {
  return (
    <article
      className={`group relative flex min-h-[306px] flex-col overflow-hidden border p-5 transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(10,31,57,0.12)] ${
        emphasis
          ? "border-[#b9ef39] bg-[#172a42] text-white shadow-[0_18px_40px_rgba(16,36,60,0.18)]"
          : "border-[#d9e1e8] bg-white text-[#13253b]"
      }`}
    >
      <div className="absolute left-0 top-0 h-1 w-full bg-[#b9ef39]" />
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-none px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] ${brandColors[rubber.brand]}`}>
            {rubber.brand.toUpperCase()}
          </span>
          <span
            className={`rounded-none px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] ${
              emphasis ? "bg-white/10 text-white" : typeColors[rubber.type]
            }`}
          >
            {rubber.type}
          </span>
        </div>
        <button
          aria-pressed={selected}
          aria-label={`${rubber.name}を比較${selected ? "から外す" : "に追加"}`}
          onClick={onToggle}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition hover:scale-105 ${
            selected
              ? "border-[#b9ef39] bg-[#b9ef39] text-[#14243a]"
              : emphasis
                ? "border-white/25 text-white hover:border-[#b9ef39]"
                : "border-[#c6d0da] text-[#14243a] hover:border-[#14243a]"
          }`}
          type="button"
        >
          {selected ? <Check size={16} strokeWidth={3} /> : <PlusIcon />}
        </button>
      </div>

      <h3 className={`text-2xl font-black leading-[1.1] tracking-[-0.04em] ${emphasis ? "text-white" : "text-[#13253b]"}`}>
        {rubber.name}
      </h3>
      <p className={`mt-2 min-h-10 text-sm leading-5 ${emphasis ? "text-[#cbd6e3]" : "text-[#5a6b7f]"}`}>{rubber.suitableFor}</p>

      <div className={`my-5 grid grid-cols-3 gap-3 border-y py-4 ${emphasis ? "border-white/15" : "border-[#e5eaf0]"}`}>
        <Meter value={rubber.speed} label="SPEED" />
        <Meter value={rubber.spin} label="SPIN" />
        <Meter value={rubber.control} label="CTRL" />
      </div>

      <div className={`mb-5 grid grid-cols-3 gap-2 border-l-2 pl-3 ${emphasis ? "border-[#b9ef39]" : "border-[#b9ef39]"}`}>
        <div><p className={`text-[9px] font-bold tracking-[0.11em] ${emphasis ? "text-[#aebfd0]" : "text-[#718095]"}`}>HARDNESS</p><p className={`mt-1 text-xs font-black ${emphasis ? "text-white" : "text-[#13253b]"}`}>{rubber.hardness}</p></div>
        <div><p className={`text-[9px] font-bold tracking-[0.11em] ${emphasis ? "text-[#aebfd0]" : "text-[#718095]"}`}>DATA CHECK</p><p className={`mt-1 text-xs font-black ${emphasis ? "text-white" : "text-[#13253b]"}`}>2026.08</p></div>
        <div><p className={`text-[9px] font-bold tracking-[0.11em] ${emphasis ? "text-[#aebfd0]" : "text-[#718095]"}`}>SOURCE</p><p className={`mt-1 text-xs font-black ${emphasis ? "text-white" : "text-[#13253b]"}`}>公式</p></div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3">
        <div>
          <p className={`text-[10px] font-bold tracking-[0.12em] ${emphasis ? "text-[#afbdcf]" : "text-[#718095]"}`}>公式価格</p>
          <p className={`mt-1 text-lg font-black tracking-[-0.03em] ${emphasis ? "text-[#b9ef39]" : "text-[#13253b]"}`}>{rubber.priceLabel}</p>
        </div>
        <a
          href={rubber.source}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-1 text-xs font-bold ${emphasis ? "text-white" : "text-[#14243a]"} hover:underline`}
        >
          公式へ <ArrowUpRight size={14} />
        </a>
      </div>
    </article>
  );
}

function PlusIcon() {
  return <span className="text-xl font-light leading-none">+</span>;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<"すべて" | Rubber["brand"]>("すべて");
  const [type, setType] = useState<"すべて" | RubberType>("すべて");
  const [priceRange, setPriceRange] = useState<"すべて" | "6000未満" | "6000〜7999" | "8000以上">("すべて");
  const [style, setStyle] = useState<PlayStyle | null>(null);
  const [compared, setCompared] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  const filteredRubbers = useMemo(() => {
    return rubbers.filter((rubber) => {
      const queryMatch = `${rubber.name} ${rubber.brand} ${rubber.type}`.toLowerCase().includes(query.toLowerCase());
      const brandMatch = brand === "すべて" || rubber.brand === brand;
      const typeMatch = type === "すべて" || rubber.type === type;
      const priceMatch =
        priceRange === "すべて" ||
        (priceRange === "6000未満" && rubber.price !== null && rubber.price < 6000) ||
        (priceRange === "6000〜7999" && rubber.price !== null && rubber.price >= 6000 && rubber.price < 8000) ||
        (priceRange === "8000以上" && rubber.price !== null && rubber.price >= 8000);
      return queryMatch && brandMatch && typeMatch && priceMatch;
    });
  }, [brand, priceRange, query, type]);

  const recommendations = useMemo(() => (style ? getRecommendedRubbers(style) : []), [style]);
  const visibleRubbers = showAll ? filteredRubbers : filteredRubbers.slice(0, 12);
  const selectedStyle = playStyles.find((item) => item.id === style);
  const comparedRubbers = rubbers.filter((rubber) => compared.includes(rubber.id));

  const toggleComparison = (id: string) => {
    setCompared((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return [...current.slice(1), id];
      return [...current, id];
    });
  };

  const resetFilters = () => {
    setQuery("");
    setBrand("すべて");
    setType("すべて");
    setPriceRange("すべて");
  };

  const scrollToCatalog = () => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f4ee] text-[#13253b] selection:bg-[#b9ef39] selection:text-[#13253b]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#10223a]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <a className="group flex items-center gap-3" href="#top" aria-label="卓球ラバー図鑑 トップ">
            <img src="/manus-storage/rubber-index-mark_9a57d3c9.png" alt="卓球ラバー図鑑のシンボル" className="h-9 w-9 object-contain" />
            <span className="font-display text-base font-black tracking-[-0.04em]">RUBBER <span className="text-[#b9ef39]">INDEX</span></span>
          </a>
          <nav className="hidden items-center gap-7 text-xs font-bold tracking-[0.08em] text-[#d5deea] md:flex">
            <a className="transition hover:text-[#b9ef39]" href="#style-guide">STYLE FINDER</a>
            <a className="transition hover:text-[#b9ef39]" href="#catalog">CATALOG</a>
            <a className="transition hover:text-[#b9ef39]" href="#how-to-read">HOW TO READ</a>
          </nav>
          <button onClick={scrollToCatalog} className="inline-flex items-center gap-2 border border-[#b9ef39] bg-[#b9ef39] px-3 py-2 text-xs font-black tracking-[0.08em] text-[#13253b] transition hover:bg-white" type="button">
            製品を探す <ArrowDownRight size={15} />
          </button>
        </div>
      </header>

      <main id="top">
        <section className="relative isolate overflow-hidden bg-[#10223a] text-white">
          <div className="absolute inset-0 opacity-80">
            <img src="/manus-storage/rubber-index-hero_fab44efd.jpg" alt="卓球ラバーとスポンジ断面のイメージ" className="h-full w-full object-cover object-center" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,28,51,0.98)_0%,rgba(10,28,51,0.90)_36%,rgba(10,28,51,0.18)_79%,rgba(10,28,51,0.08)_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:9px_9px]" />
          <div className="pointer-events-none absolute -right-24 top-16 h-[440px] w-[440px] rounded-full border border-[#b9ef39]/35" />
          <div className="pointer-events-none absolute -right-8 top-28 h-[310px] w-[310px] rounded-full border border-white/20" />
          <div className="pointer-events-none absolute bottom-20 left-[38%] h-px w-[55%] rotate-[-14deg] bg-[#b9ef39]/50" />
          <div className="relative mx-auto grid min-h-[620px] max-w-[1440px] grid-cols-12 items-end gap-4 px-5 pb-14 pt-20 lg:px-10 lg:pb-20">
            <div className="col-span-12 self-start pt-3 md:col-span-2">
              <p className="font-mono text-xs font-bold tracking-[0.15em] text-[#b9ef39]">RUBBER / REFERENCE 2026</p>
              <div className="mt-5 h-20 w-px bg-[#b9ef39]" />
            </div>
            <div className="col-span-12 md:col-span-8 lg:col-span-7">
              <p className="mb-5 flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-[#c7d4e2]"><span className="h-px w-8 bg-[#b9ef39]" /> 比較・根拠・選択基準。</p>
              <h1 className="font-display text-[clamp(3.5rem,7.2vw,7rem)] font-black leading-[0.83] tracking-[-0.075em] text-white">
                READ THE<br />
                <span className="text-[#b9ef39]">RUBBER FIRST.</span>
              </h1>
              <p className="mt-8 max-w-xl text-base leading-7 text-[#d7e0ec] md:text-lg">定価、ラバー種別、硬さ、性能傾向を一つの索引に。プレイスタイルと根拠を手がかりに、候補を絞り込みましょう。</p>
              <div className="mt-10 max-w-[640px] border border-white/20 bg-white p-1.5 shadow-2xl">
                <label className="flex items-center gap-3 px-4 py-2 text-[#13253b]">
                  <Search size={21} className="shrink-0 text-[#4f6075]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && scrollToCatalog()}
                    placeholder="製品名・メーカー名・ラバー種別で検索"
                    className="w-full bg-transparent py-2 text-sm font-semibold outline-none placeholder:text-[#7e8b9b]"
                    type="search"
                  />
                  <button onClick={scrollToCatalog} className="hidden bg-[#13253b] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#285072] sm:block" type="button">検索</button>
                </label>
              </div>
            </div>
            <div className="col-span-12 flex justify-start border-t border-white/20 pt-6 md:col-span-2 md:justify-end md:border-0 md:pt-0">
              <div className="grid grid-cols-3 gap-x-6 gap-y-2 md:grid-cols-1 md:text-right">
                <div><p className="font-display text-3xl font-black text-[#b9ef39]">{rubbers.length}</p><p className="text-[10px] font-bold tracking-[0.14em] text-[#b8c7d8]">掲載モデル</p></div>
                <div><p className="font-display text-3xl font-black text-[#b9ef39]">3</p><p className="text-[10px] font-bold tracking-[0.14em] text-[#b8c7d8]">主要ブランド</p></div>
                <div><p className="font-display text-3xl font-black text-[#b9ef39]">4</p><p className="text-[10px] font-bold tracking-[0.14em] text-[#b8c7d8]">ラバー種別</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="style-guide" className="relative border-b border-[#d9e1e8] bg-[#f7f4ee] px-5 py-20 lg:px-10">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid grid-cols-12 gap-6 border-b border-[#cfd8e0] pb-10">
              <div className="col-span-12 md:col-span-3"><p className="font-mono text-xs font-bold tracking-[0.14em] text-[#50708d]">01 / STYLE FINDER</p></div>
              <div className="col-span-12 md:col-span-7"><h2 className="font-display text-4xl font-black leading-[0.95] tracking-[-0.055em] text-[#13253b] md:text-6xl">プレイスタイルを、<br />選択基準にする。</h2></div>
              <div className="col-span-12 self-end md:col-span-2"><p className="text-sm leading-6 text-[#5e6e80]">スタイルを一つ選ぶと、性能傾向と種別から提案を更新します。</p></div>
            </div>

            <div className="mt-8 grid gap-px overflow-hidden border border-[#cfd8e0] bg-[#cfd8e0] sm:grid-cols-2 lg:grid-cols-4">
              {playStyles.map((item) => {
                const active = style === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setStyle(active ? null : item.id)}
                    className={`group min-h-[192px] p-5 text-left transition duration-200 ${active ? "bg-[#b9ef39] text-[#13253b]" : "bg-[#f7f4ee] hover:bg-white"}`}
                    type="button"
                  >
                    <div className="flex items-start justify-between"><span className="font-mono text-xs font-bold text-[#526377]">{item.number}</span><span className={`flex h-7 w-7 items-center justify-center rounded-full border ${active ? "border-[#13253b] bg-[#13253b] text-[#b9ef39]" : "border-[#b7c1cb] text-[#526377] group-hover:border-[#13253b] group-hover:text-[#13253b]"}`}>{active ? <Check size={15} strokeWidth={3} /> : <ChevronRight size={16} />}</span></div>
                    <h3 className="mt-12 text-xl font-black tracking-[-0.04em]">{item.title}</h3>
                    <p className="mt-1 text-xs font-bold text-[#5a6a7b]">{item.subtitle}</p>
                  </button>
                );
              })}
            </div>

            <div className={`grid overflow-hidden transition-all duration-300 ${selectedStyle ? "mt-8 grid-rows-[1fr] border border-[#1c3553]" : "mt-0 grid-rows-[0fr] border-transparent"}`}>
              <div className="min-h-0">
                {selectedStyle && (
                  <div className="grid bg-[#132940] text-white lg:grid-cols-12">
                    <div className="border-b border-white/15 p-7 lg:col-span-4 lg:border-b-0 lg:border-r lg:p-10">
                      <p className="font-mono text-xs font-bold tracking-[0.14em] text-[#b9ef39]">SELECTED STYLE / {selectedStyle.number}</p>
                      <h3 className="mt-5 text-4xl font-black tracking-[-0.055em]">{selectedStyle.title}</h3>
                      <p className="mt-4 text-sm leading-6 text-[#cad5e3]">{selectedStyle.description}</p>
                      <div className="mt-6 flex flex-wrap gap-2">{selectedStyle.tags.map((tag) => <span className="border border-white/20 px-2 py-1 text-[10px] font-bold tracking-[0.12em] text-[#e8eff7]" key={tag}>{tag}</span>)}</div>
                    </div>
                    <div className="lg:col-span-8">
                      <div className="flex items-center justify-between border-b border-white/15 px-7 py-5 lg:px-8"><p className="text-xs font-bold tracking-[0.1em] text-[#dbe4ef]">提案候補 / 最大6件</p><button onClick={() => setStyle(null)} className="inline-flex items-center gap-1 text-xs font-bold text-[#b9ef39] hover:text-white" type="button">選び直す <X size={15} /></button></div>
                      <div className="grid md:grid-cols-2 xl:grid-cols-3">
                        {recommendations.map((rubber, index) => (
                          <div className="border-b border-white/15 p-6 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0 xl:[&:nth-last-child(-n+3)]:border-b-0 xl:border-r xl:[&:nth-child(3n)]:border-r-0" key={rubber.id}>
                            <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#b9ef39]">RECO. {String(index + 1).padStart(2, "0")}</p>
                            <p className="mt-3 text-lg font-black tracking-[-0.04em]">{rubber.name}</p>
                            <p className="mt-1 text-xs text-[#b7c8d8]">{rubber.brand} / {rubber.type}</p>
                            <p className="mt-4 text-xs leading-5 text-[#d7e2ef]">{rubber.suitableFor}</p>
                            <div className="mt-5 flex items-center justify-between"><span className="text-sm font-black text-[#b9ef39]">{rubber.priceLabel}</span><button onClick={() => toggleComparison(rubber.id)} className="text-xs font-bold text-white underline decoration-[#b9ef39] underline-offset-4" type="button">{compared.includes(rubber.id) ? "比較済" : "比較に追加"}</button></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="catalog" className="bg-[#eef1f2] px-5 py-20 lg:px-10">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <aside className="col-span-12 lg:col-span-3">
              <div className="lg:sticky lg:top-[98px]">
                <p className="font-mono text-xs font-bold tracking-[0.14em] text-[#50708d]">02 / CATALOG</p>
                <h2 className="mt-4 font-display text-4xl font-black leading-[0.93] tracking-[-0.05em] text-[#13253b]">製品仕様を、<br />横断する。</h2>
                <div className="mt-8 border-y border-[#cbd5de] py-5">
                  <div className="flex items-center justify-between"><p className="text-xs font-bold tracking-[0.12em] text-[#42556a]">フィルター</p><button onClick={resetFilters} className="text-xs font-bold text-[#0c436e] underline underline-offset-4" type="button">リセット</button></div>
                  <div className="mt-5 space-y-5">
                    <FilterGroup label="メーカー">
                      <SelectValue value={brand} onChange={(event) => setBrand(event.target.value as typeof brand)} options={["すべて", "Butterfly", "Nittaku", "VICTAS"]} />
                    </FilterGroup>
                    <FilterGroup label="ラバー種別">
                      <SelectValue value={type} onChange={(event) => setType(event.target.value as typeof type)} options={["すべて", "裏ソフト", "表ソフト", "粒高", "アンチ"]} />
                    </FilterGroup>
                    <FilterGroup label="定価（税込）">
                      <SelectValue value={priceRange} onChange={(event) => setPriceRange(event.target.value as typeof priceRange)} options={["すべて", "6000未満", "6000〜7999", "8000以上"]} />
                    </FilterGroup>
                  </div>
                </div>
                <p className="mt-6 flex gap-2 text-xs leading-5 text-[#667587]"><CircleHelp size={15} className="mt-0.5 shrink-0" /> 性能メーターはメーカー間の表記差を補うための編集部目安です。公式数値とは区別しています。</p>
              </div>
            </aside>

            <div className="col-span-12 lg:col-span-9">
              <div className="mb-7 flex flex-col gap-4 border-b border-[#cbd5de] pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="font-mono text-xs font-bold tracking-[0.14em] text-[#50708d]">SEARCH RESULT</p><p className="mt-2 text-sm text-[#53657a]"><strong className="font-display text-3xl font-black tracking-[-0.04em] text-[#13253b]">{filteredRubbers.length}</strong> 件の掲載モデル</p></div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#526377]"><Grid2X2 size={16} /> 比較には最大3件まで追加できます</div>
              </div>

              {visibleRubbers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleRubbers.map((rubber) => <RubberCard key={rubber.id} rubber={rubber} selected={compared.includes(rubber.id)} onToggle={() => toggleComparison(rubber.id)} />)}
                </div>
              ) : (
                <div className="border border-dashed border-[#bac7d3] bg-white p-12 text-center"><Search className="mx-auto text-[#6d7e91]" /><p className="mt-5 text-lg font-black">条件に合うモデルが見つかりません。</p><button onClick={resetFilters} className="mt-3 text-sm font-bold text-[#075288] underline underline-offset-4" type="button">条件をリセット</button></div>
              )}
              {!showAll && filteredRubbers.length > 12 && <Button onClick={() => setShowAll(true)} className="mt-8 w-full rounded-none bg-[#13253b] py-6 text-xs font-bold tracking-[0.12em] text-white hover:bg-[#285072]">残り {filteredRubbers.length - 12} 件を表示 <ChevronRight size={16} /></Button>}
            </div>
          </div>
        </section>

        <section id="how-to-read" className="relative overflow-hidden bg-[#f7f4ee] px-5 py-20 lg:px-10">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-75"><img src="/manus-storage/rubber-index-sponge-detail_a01c62a9.jpg" alt="" className="h-full w-full object-cover object-left mix-blend-multiply" /></div>
          <div className="relative mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-3"><p className="font-mono text-xs font-bold tracking-[0.14em] text-[#50708d]">03 / HOW TO READ</p></div>
            <div className="col-span-12 lg:col-span-6"><h2 className="font-display text-4xl font-black leading-[0.95] tracking-[-0.055em] text-[#13253b] md:text-6xl">数字は、選択の<br />入り口です。</h2><p className="mt-7 max-w-xl text-base leading-7 text-[#4e6072]">定価とラバー種別はメーカー公式の製品一覧を参照しています。一方、速度・回転・コントロールはメーカーごとに尺度が異なるため、サイト内での比較を補助する相対的な目安として表示しています。</p><div className="mt-10 grid max-w-2xl gap-px border border-[#cbd5de] bg-[#cbd5de] sm:grid-cols-3"><InfoCell number="01" title="公式価格" text="税込価格またはオープン価格を明記" /><InfoCell number="02" title="硬さ" text="打球感と食い込みの参考に" /><InfoCell number="03" title="性能傾向" text="同一画面で比較できる5段階目安" /></div></div>
          </div>
        </section>
      </main>

      <footer className="bg-[#10223a] px-5 py-10 text-white lg:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div><div className="flex items-center gap-3"><img src="/manus-storage/rubber-index-mark_9a57d3c9.png" alt="" className="h-9 w-9 object-contain" /><p className="font-display text-lg font-black tracking-[-0.04em]">RUBBER <span className="text-[#b9ef39]">INDEX</span></p></div><p className="mt-4 max-w-xl text-xs leading-5 text-[#bdc9d8]">掲載価格は2026年8月17日にメーカー公式製品一覧で確認した表示価格です。価格改定、終売、仕様変更の可能性があるため、購入前に必ず公式ページをご確認ください。</p></div>
          <div><p className="mb-3 text-[10px] font-bold tracking-[0.14em] text-[#b9ef39]">PRIMARY SOURCES</p><div className="flex flex-wrap gap-x-4 gap-y-2">{sources.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-white hover:text-[#b9ef39]">{source.name} <ArrowUpRight size={12} /></a>)}</div></div>
        </div>
      </footer>

      {compared.length > 0 && (
        <div className="fixed inset-x-3 bottom-3 z-50 border border-[#b9ef39] bg-[#132940] p-4 text-white shadow-2xl md:inset-x-auto md:right-6 md:w-[540px]">
          <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#b9ef39]">COMPARISON TRAY</p><p className="mt-1 text-sm font-bold">比較中：{compared.length} / 3</p></div><button onClick={() => setCompared([])} className="text-xs font-bold text-[#c9d5e0] hover:text-white" type="button">すべて外す</button></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">{comparedRubbers.map((rubber) => <div key={rubber.id} className="border border-white/15 p-3"><p className="text-[10px] font-bold text-[#b9ef39]">{rubber.brand.toUpperCase()}</p><p className="mt-1 text-sm font-black leading-5">{rubber.name}</p><div className="mt-3 flex items-center justify-between"><span className="text-xs text-[#d0dbe6]">{rubber.priceLabel}</span><button onClick={() => toggleComparison(rubber.id)} className="text-[#b9ef39]" aria-label={`${rubber.name}を比較から外す`} type="button"><Minus size={16} /></button></div></div>)}</div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-2 block text-[10px] font-bold tracking-[0.13em] text-[#657589]">{label}</label>{children}</div>;
}

function SelectValue({ value, onChange, options }: { value: string; onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }) {
  return <div className="relative"><select value={value} onChange={onChange} className="w-full appearance-none border border-[#cbd5de] bg-white px-3 py-3 pr-9 text-sm font-bold text-[#13253b] outline-none transition focus:border-[#13253b]">{options.map((option) => <option key={option}>{option}</option>)}</select><SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#627488]" size={15} /></div>;
}

function InfoCell({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="bg-[#f7f4ee] p-5"><p className="font-mono text-xs font-bold text-[#52718e]">{number}</p><h3 className="mt-8 text-lg font-black tracking-[-0.03em]">{title}</h3><p className="mt-2 text-xs leading-5 text-[#607185]">{text}</p></div>;
}
