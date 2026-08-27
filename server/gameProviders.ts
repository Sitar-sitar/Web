import { TRPCError } from "@trpc/server";
import {
  BuildLookupResult,
  CharacterProfile,
  equipmentActionsFor,
  GuideDefinition,
  StatComparison,
  TargetStatDefinition,
  UidResponseCache,
  lookupUidBuild,
  priorityRecommendations,
  withGuideMetadata,
} from "./buildAdvisor";
import { generatedGenshinGuide, generatedZzzGuide } from "./individualGuides";
import { partyRecommendationsFor } from "./partyRecommendations";
import { resolveCharacterIdentity } from "./characterIdentity";
import { constellationProfileFor } from "./characterConstellations";

export type GameId = "hsr" | "genshin" | "zzz";

type RawRecord = Record<string, unknown>;
type NormalizedBuild = Omit<BuildLookupResult, "cached" | "cacheExpiresAt" | "fetchedAt">;

const ENKA_ORIGIN = "https://enka.network";
const ENKA_STORE = "https://api.enka.network/store";
const USER_AGENT = "Star-Rail-Build-Advisor/1.2 (public-build-lookup)";
const FALLBACK_TTL_MS = 4 * 60 * 1000;
const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;

function asRecord(value: unknown): RawRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RawRecord : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : fallback;
}

function number(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function ttlFromPayload(payload: unknown): number {
  const ttl = number(asRecord(payload).ttl, 0);
  return ttl > 0 ? Math.max(60_000, Math.min(ttl * 1000, 10 * 60 * 1000)) : FALLBACK_TTL_MS;
}

function apiError(status: number, message: string): TRPCError {
  if (status === 404) return new TRPCError({ code: "NOT_FOUND", message });
  if (status === 429) return new TRPCError({ code: "TOO_MANY_REQUESTS", message: "照会が集中しています。数分後に再度お試しください。" });
  return new TRPCError({ code: "BAD_GATEWAY", message });
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14_000);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
    });
    const raw = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json") ? JSON.parse(raw || "{}") : {};
    if (!response.ok) {
      const detail = text(asRecord(payload).message ?? asRecord(payload).detail, "公開プロフィールを取得できませんでした。");
      throw apiError(response.status, detail);
    }
    if (!contentType.includes("application/json")) {
      throw apiError(502, "外部データサービスが一時的に応答していません。数分後に再度お試しください。");
    }
    return payload;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: "BAD_GATEWAY", message: "外部データサービスへ接続できませんでした。少し時間を置いて再試行してください。", cause: error });
  } finally {
    clearTimeout(timeout);
  }
}

type TimedValue<T> = { value: T; expiresAt: number };

function createTimedLoader<T>(load: () => Promise<T>) {
  let entry: TimedValue<T> | null = null;
  let pending: Promise<T> | null = null;
  return async () => {
    if (entry && entry.expiresAt > Date.now()) return entry.value;
    if (!pending) {
      pending = load().then((value) => {
        entry = { value, expiresAt: Date.now() + CATALOG_TTL_MS };
        return value;
      }).finally(() => { pending = null; });
    }
    return pending;
  };
}

function localized(loc: RawRecord, key: unknown, fallback = "") {
  const japanese = asRecord(loc.ja);
  return text(japanese[text(key)]) || fallback;
}

function iconUrl(icon: string | null) {
  if (!icon) return null;
  if (icon.startsWith("http")) return icon;
  if (icon.startsWith("/")) return `${ENKA_ORIGIN}${icon}`;
  return `${ENKA_ORIGIN}/ui/${icon}.png`;
}

const GI_ELEMENTS: Record<string, { label: string; color: string }> = {
  Fire: { label: "炎", color: "#d45b48" }, Water: { label: "水", color: "#4f9ed8" }, Wind: { label: "風", color: "#65ba9a" },
  Electric: { label: "雷", color: "#a278d2" }, Ice: { label: "氷", color: "#76c8dc" }, Rock: { label: "岩", color: "#c99a4a" }, Grass: { label: "草", color: "#7aae45" },
};

const GI_WEAPONS: Record<string, string> = {
  WEAPON_SWORD_ONE_HAND: "片手剣", WEAPON_CLAYMORE: "両手剣", WEAPON_POLE: "長柄武器", WEAPON_BOW: "弓", WEAPON_CATALYST: "法器",
};

const GI_PROP_NAMES: Record<string, string> = {
  FIGHT_PROP_HP: "HP", FIGHT_PROP_ATTACK: "攻撃力", FIGHT_PROP_DEFENSE: "防御力", FIGHT_PROP_HP_PERCENT: "HP%", FIGHT_PROP_ATTACK_PERCENT: "攻撃力%", FIGHT_PROP_DEFENSE_PERCENT: "防御力%",
  FIGHT_PROP_CRITICAL: "会心率", FIGHT_PROP_CRITICAL_HURT: "会心ダメージ", FIGHT_PROP_CHARGE_EFFICIENCY: "元素チャージ効率", FIGHT_PROP_ELEMENT_MASTERY: "元素熟知", FIGHT_PROP_HEAL_ADD: "与える治癒効果",
  FIGHT_PROP_FIRE_ADD_HURT: "炎元素ダメージ", FIGHT_PROP_ELEC_ADD_HURT: "雷元素ダメージ", FIGHT_PROP_WATER_ADD_HURT: "水元素ダメージ", FIGHT_PROP_WIND_ADD_HURT: "風元素ダメージ", FIGHT_PROP_ICE_ADD_HURT: "氷元素ダメージ", FIGHT_PROP_ROCK_ADD_HURT: "岩元素ダメージ", FIGHT_PROP_GRASS_ADD_HURT: "草元素ダメージ", FIGHT_PROP_PHYSICAL_ADD_HURT: "物理ダメージ",
};

const GI_ARTIFACT_SLOTS: Record<string, string> = {
  EQUIP_BRACER: "生の花", EQUIP_NECKLACE: "死の羽", EQUIP_SHOES: "時の砂", EQUIP_RING: "空の杯", EQUIP_DRESS: "理の冠",
};

const GI_PERCENT_PROPS = new Set([
  "FIGHT_PROP_HP_PERCENT", "FIGHT_PROP_ATTACK_PERCENT", "FIGHT_PROP_DEFENSE_PERCENT", "FIGHT_PROP_CRITICAL", "FIGHT_PROP_CRITICAL_HURT", "FIGHT_PROP_CHARGE_EFFICIENCY", "FIGHT_PROP_HEAL_ADD",
  "FIGHT_PROP_FIRE_ADD_HURT", "FIGHT_PROP_ELEC_ADD_HURT", "FIGHT_PROP_WATER_ADD_HURT", "FIGHT_PROP_WIND_ADD_HURT", "FIGHT_PROP_ICE_ADD_HURT", "FIGHT_PROP_ROCK_ADD_HURT", "FIGHT_PROP_GRASS_ADD_HURT", "FIGHT_PROP_PHYSICAL_ADD_HURT",
]);

function giStat(prop: string, rawValue: number, ratioValue = true) {
  const percent = GI_PERCENT_PROPS.has(prop);
  const value = percent && ratioValue ? rawValue * 100 : rawValue;
  return { name: GI_PROP_NAMES[prop] ?? prop, display: percent ? `${value.toFixed(1)}%` : value.toFixed(0), value, percent };
}

const GI_DEFAULT_TARGETS: TargetStatDefinition[] = [
  { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } },
  { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 200, "目標": 160, "妥協": 130 } },
  { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 160, "目標": 140, "妥協": 120 } },
  { key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 220, "目標": 160, "妥協": 100 } },
];

const giGuide = (headline: string, relicSet: string, mainStats: GuideDefinition["mainStats"], targets: TargetStatDefinition[], planarSet = "チーム内の役割・武器・元素反応に合わせて調整"): GuideDefinition => ({ headline, relicSet, planarSet, mainStats, targets });
const GI_CRIT_MAIN_STATS: GuideDefinition["mainStats"] = [{ slot: "時計", value: "攻撃力% / HP%" }, { slot: "杯", value: "元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }];
const GI_STANDARD_CRIT_TARGETS: TargetStatDefinition[] = [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 220, "目標": 180, "妥協": 150 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 150, "目標": 130, "妥協": 115 } }];

const GI_GUIDE_OVERRIDES: Record<string, GuideDefinition> = {
  "ナヒーダ": { headline: "控え草サブDPS／支援は元素熟知800以上と必要な元素チャージを優先し、1,000超は会心へ振り分ける。", relicSet: "深林の記憶 ×4 / 他の装備者がいる場合は金メッキの夢 ×4", planarSet: "控え型：元素熟知・草元素ダメージ／会心、オンフィールド型：草元素ダメージ・会心", mainStats: [{ slot: "時計", value: "元素熟知" }, { slot: "杯", value: "元素熟知 / 草元素ダメージ" }, { slot: "冠", value: "元素熟知 / 会心率 / 会心ダメージ" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 1000, "目標": 800, "妥協": 700 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 160, "目標": 130, "妥協": 110 } }], targetContext: "ナヒーダ専用：元素爆発の元素熟知共有、深林4セットの草元素耐性低下、武器・味方・C1〜C6による反応／戦闘中効果は公開プロフィールへ加算しない。オンフィールド火力型では草元素ダメージ杯・会心冠へ切り替える。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
  "楓原万葉": { headline: "翠緑4セットの拡散支援を安定させるため、元素熟知と元素チャージ効率170%前後を優先する。", relicSet: "翠緑の影 ×4", planarSet: "元素熟知・元素チャージ効率を優先", mainStats: [{ slot: "時計", value: "元素チャージ効率 / 元素熟知" }, { slot: "杯", value: "元素熟知" }, { slot: "冠", value: "元素熟知" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 1000, "目標": 850, "妥協": 700 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 200, "目標": 170, "妥協": 150 } }], targetContext: "楓原万葉専用：C2の元素熟知+200は元素爆発フィールド中の戦闘内効果であり、現在値には加算しない。", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
};

Object.assign(GI_GUIDE_OVERRIDES, {
  "神里綾華": giGuide("氷風4セットと氷共鳴による戦闘中会心率を前提に、会心ダメージと元素爆発の循環を優先する。", "氷風を彷徨う勇士 ×4", [{ slot: "時計", value: "攻撃力%" }, { slot: "杯", value: "氷元素ダメージ" }, { slot: "冠", value: "会心ダメージ" }], [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 55, "目標": 45, "妥協": 35 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 280, "目標": 240, "妥協": 210 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 150, "目標": 130, "妥協": 115 } }], "氷風4セット・氷共鳴の戦闘中会心率を別途加味"),
  "雷電将軍": { headline: "元素爆発DPSは元素チャージ200%以上・会心・攻撃力を整え、超開花は元素熟知1,000の別ビルドとして扱う。", relicSet: "元素爆発DPS：絶縁の旗印 ×4／超開花：楽園の絶花 ×4・金メッキの夢 ×4", planarSet: "元素爆発DPS：元素チャージまたは攻撃力%・雷元素ダメージ・会心／超開花：元素熟知", mainStats: [{ slot: "時計", value: "元素チャージ効率 / 攻撃力%（超開花は元素熟知）" }, { slot: "杯", value: "攻撃力% / 雷元素ダメージ（超開花は元素熟知）" }, { slot: "冠", value: "会心率 / 会心ダメージ（超開花は元素熟知）" }], targets: [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 250, "目標": 220, "妥協": 200 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2000, "目標": 1500, "妥協": 1300 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 80, "妥協": 70 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 220, "目標": 200, "妥協": 170 } }], targetContext: "雷電将軍専用：この公開プロフィール比較表は元素爆発DPSの公開値を対象とする。超開花では会心・攻撃力・元素チャージを混在させず元素熟知1,000前後へ切り替える。武器・固有天賦・味方・C1〜C6の戦闘中効果は現在値へ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
  "ヌヴィレット": giGuide("固有天賦の反応条件とHP重撃を両立するため、HP・会心・必要分の元素チャージを個別に整える。", "ファントムハンター ×4 / 月感電では天穹の影 ×4", [{ slot: "時計", value: "HP%" }, { slot: "杯", value: "水元素ダメージ / HP%" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 45000, "目標": 40000, "妥協": 35000 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 65, "目標": 55, "妥協": 45 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 260, "目標": 220, "妥協": 180 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 150, "目標": 130, "妥協": 115 } }], "ヌヴィレット専用：ファントムハンター4セットの会心率、C1の反応条件緩和・中断耐性は戦闘中・編成条件として別表示する。"),
  "フリーナ": { ...giGuide("元素スキルの火力と全体バフを安定させるため、HP40,000・元素チャージ効率180%以上と会心比率を個別に整える。", "黄金の劇団 ×4", [{ slot: "時計", value: "HP% / 元素チャージ効率" }, { slot: "杯", value: "HP% / 水元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 45000, "目標": 40000, "妥協": 35000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 220, "目標": 180, "妥協": 160 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 80, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 220, "目標": 180, "妥協": 160 } }]), targetContext: "フリーナ専用：元素爆発中のファンファーレ、C1/C2のHP・バフは戦闘内効果として公開プロフィールへ加算しない。", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
  "夜蘭": giGuide("元素爆発を切らさないチャージ要求を先に満たし、HP・水ダメージ・会心で追撃火力を整える。", "絶縁の旗印 ×4", [{ slot: "時計", value: "元素チャージ効率 / HP%" }, { slot: "杯", value: "水元素ダメージ / HP%" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 40000, "目標": 35000, "妥協": 30000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 220, "目標": 200, "妥協": 180 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 200, "目標": 160, "妥協": 130 } }], "夜蘭専用：元素チャージ効率は水共鳴・C1・武器・粒子条件で180〜220%へ変動する。C1以降の条件付き効果を固定の公開値目標へ減算しない。"),
  "珊瑚宮心海": giGuide("回復と水付着を安定させるため、HPと元素爆発の循環を優先する。", "千岩牢固 ×4 / 海染硨磲 ×4", [{ slot: "時計", value: "HP% / 元素チャージ効率" }, { slot: "杯", value: "HP%" }, { slot: "冠", value: "与える治癒効果" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 45000, "目標": 40000, "妥協": 35000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 220, "目標": 190, "妥協": 160 } }]),
  "鍾離": { headline: "支援型はシールド耐久のためHPを優先し、岩サブDPSは攻撃力・岩元素ダメージ・会心へ別途切り替える。", relicSet: "支援：千岩牢固 ×4／岩サブDPS：旧貴族のしつけ ×2・悠久の磐岩 ×2", planarSet: "支援：HP%・HP・元素チャージ／岩サブDPS：攻撃力%・岩元素ダメージ・会心", mainStats: [{ slot: "時計", value: "HP%（岩サブDPSは攻撃力%）" }, { slot: "杯", value: "HP%（岩サブDPSは岩元素ダメージ）" }, { slot: "冠", value: "HP%（岩サブDPSは会心率 / 会心ダメージ）" }], targets: [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 55000, "目標": 45000, "妥協": 35000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 160, "目標": 140, "妥協": 120 } }], targetContext: "鍾離専用：この比較表は支援型の公開値を対象にする。護盾の全元素耐性低下、千岩4セット、岩共鳴、C1〜C6の条件付き効果は公開プロフィールへ加算しない。岩サブDPSを選ぶ場合はHP目標を攻撃力・岩元素ダメージ・会心へ置き換える。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
  "ニィロウ": giGuide("開花ダメージ上限へ近づけるため、HPを最優先に積み上げる。", "千岩牢固 ×2 / 花海甘露の光 ×2", [{ slot: "時計", value: "HP%" }, { slot: "杯", value: "HP%" }, { slot: "冠", value: "HP%" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 76000, "目標": 70000, "妥協": 65000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 120 } }]),
  "アルハイゼン": giGuide("草激化・開花の両面を支える元素熟知と、会心比率を優先する。", "金メッキの夢 ×4 / 深林の記憶 ×4", [{ slot: "時計", value: "元素熟知" }, { slot: "杯", value: "草元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 400, "目標": 300, "妥協": 200 } }, ...GI_STANDARD_CRIT_TARGETS]),
  "アルレッキーノ": giGuide("命の契約を維持する通常攻撃火力へ、攻撃力・会心比率を優先する。蒸発・溶解では元素熟知を編成別に追加する。", "諧律奇想の断章 ×4", [{ slot: "時計", value: "攻撃力%" }, { slot: "杯", value: "炎元素ダメージ / 攻撃力%" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2400, "目標": 2000, "妥協": 1800 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 75, "妥協": 70 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 200, "目標": 160, "妥協": 140 } }], "アルレッキーノ専用：攻撃力3,000は固有天賦の耐性上限を意識する補助目安。C1以降の中断耐性・自己強化は公開値へ加算しない。"),
  "ナヴィア": giGuide("結晶の破片による元素スキル火力を、会心比率と元素爆発の循環で安定させる。", "残響の森で囁かれる夜話 ×4", GI_CRIT_MAIN_STATS, [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 230, "目標": 190, "妥協": 160 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 150, "目標": 130, "妥協": 115 } }]),
  "胡桃": giGuide("HPを火力に転換するため、HP・会心・元素爆発の循環を両立する。", "燃え盛る炎の魔女 ×4 / ファントムハンター ×4", [{ slot: "時計", value: "HP% / 元素熟知" }, { slot: "杯", value: "炎元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 40000, "目標": 35000, "妥協": 30000 } }, ...GI_STANDARD_CRIT_TARGETS]),
  "シロネン": { ...giGuide("耐性低下と回復を安定させるため、元素チャージ効率190%以上を先に満たし、DEFは武器に応じて積む。", "灰燼の都に立つ英雄の絵巻 ×4", [{ slot: "時計", value: "元素チャージ効率" }, { slot: "杯", value: "防御力%" }, { slot: "冠", value: "与える治癒効果 / 防御力%" }], [{ key: "defense", label: "防御力", unit: "", targets: { "厳選": 3000, "目標": 2500, "妥協": 2000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 220, "目標": 190, "妥協": 180 } }]), targetContext: "シロネン専用：防御力3,000はモチーフ武器装備時の上位目安。元素耐性低下・聖遺物・命ノ星座の戦闘内効果は公開値へ加算しない。", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "閑雲": giGuide("落下攻撃支援と回復量を伸ばすため、攻撃力と元素爆発の循環を優先する。", "翠緑の影 ×4 / 旧貴族のしつけ ×4", [{ slot: "時計", value: "攻撃力% / 元素チャージ効率" }, { slot: "杯", value: "攻撃力%" }, { slot: "冠", value: "攻撃力% / 与える治癒効果" }], [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 4500, "目標": 3800, "妥協": 3200 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 220, "目標": 190, "妥協": 160 } }]),
  "ベネット": { ...giGuide("元素爆発の回転を最優先に、元素チャージ効率200%以上と必要な回復量を確保する。", "旧貴族のしつけ ×4", [{ slot: "時計", value: "元素チャージ効率 / 攻撃力%" }, { slot: "杯", value: "HP% / 炎元素ダメージ" }, { slot: "冠", value: "与える治癒効果 / HP%" }], [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 250, "目標": 200, "妥協": 180 } }, { key: "hp", label: "HP", unit: "", targets: { "厳選": 30000, "目標": 25000, "妥協": 20000 } }]), targetContext: "ベネット専用：C1の基礎攻撃力加算とC6の炎元素付与は戦闘中・編成依存のため、公開プロフィール目標へ反映しない。", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "アンバー": giGuide("重撃または元素爆発の火力を伸ばすため、会心比率と攻撃力を優先する。", "燃え盛る炎の魔女 ×4 / 大地を流浪する楽団 ×4", GI_CRIT_MAIN_STATS, GI_STANDARD_CRIT_TARGETS),
  "甘雨": giGuide("重撃の会心火力を主軸に、編成に応じて元素熟知または元素爆発の循環を調整する。", "氷風を彷徨う勇士 ×4 / 大地を流浪する楽団 ×4", [{ slot: "時計", value: "攻撃力% / 元素熟知" }, { slot: "杯", value: "氷元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 75, "目標": 65, "妥協": 55 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 250, "目標": 210, "妥協": 180 } }, { key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 300, "目標": 200, "妥協": 100 } }], "凍結型では氷風4セット・氷共鳴の会心率補正、溶解型では元素熟知を別途加味"),
  "行秋": giGuide("元素爆発を途切れさせない元素チャージを最優先に、会心火力を整える。", "絶縁の旗印 ×4", [{ slot: "時計", value: "元素チャージ効率 / 攻撃力%" }, { slot: "杯", value: "水元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 250, "目標": 220, "妥協": 190 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 190, "目標": 160, "妥協": 130 } }]),
});

Object.assign(GI_GUIDE_OVERRIDES, {
  "アルハイゼン": { headline: "草激化・開花の投影攻撃を支えるため、公開値の元素熟知300・会心・草共鳴時の元素チャージ130%を優先する。", relicSet: "金メッキの夢 ×4 / 深林の記憶 ×4", planarSet: "草元素ダメージ・会心を基準に、元素熟知は時計とサブステータスで確保", mainStats: [{ slot: "時計", value: "元素熟知 / 攻撃力%" }, { slot: "杯", value: "草元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 350, "目標": 300, "妥協": 200 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 180, "目標": 160, "妥協": 140 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 140, "目標": 130, "妥協": 120 } }], targetContext: "アルハイゼン専用：ナヒーダ・教官・金メッキ4セットの反応後バフ、深林4セットの耐性低下、C2/C4/C6の元素熟知・草ダメージ・会心効果は公開プロフィールへ加算しない。草共鳴なしでは元素チャージ160%前後を検討する。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・KeqingMainsの更新日付き個別ビルド・PTガイドを照合" },
  "胡桃": { headline: "蒸発重撃を支えるため、公開値のHP32,000・元素熟知200・会心率70%・会心ダメージ180%を優先する。", relicSet: "燃え盛る炎の魔女 ×4 / ファントムハンター ×4", planarSet: "HP%・炎元素ダメージ・会心を軸に、蒸発では元素熟知を確保", mainStats: [{ slot: "時計", value: "HP% / 元素熟知" }, { slot: "杯", value: "炎元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 35000, "目標": 32000, "妥協": 28000 } }, { key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 250, "目標": 200, "妥協": 100 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 200, "目標": 180, "妥協": 150 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 120, "目標": 110, "妥協": 100 } }], targetContext: "胡桃専用：HP50%以下の炎ダメージ、元素スキルのHP参照攻撃力、護摩・水共鳴・ファントムハンター・味方・C6の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・KeqingMainsの更新日付き個別ビルド・PTガイドを照合" },
  "久岐忍": { headline: "超開花では元素熟知900を最優先にし、ヒーラー／激化支援型のHP・元素チャージとは混同しない。", relicSet: "超開花：楽園の絶花 ×4 / 金メッキの夢 ×4、支援：千岩牢固 ×4", planarSet: "超開花：元素熟知3部位、支援：HP%と元素チャージ効率", mainStats: [{ slot: "時計", value: "元素熟知（支援はHP%）" }, { slot: "杯", value: "元素熟知（支援はHP%）" }, { slot: "冠", value: "元素熟知（支援は与える治癒効果 / HP%）" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 1000, "目標": 900, "妥協": 800 } }, { key: "hp", label: "HP", unit: "", targets: { "厳選": 28000, "目標": 24000, "妥協": 22000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 130, "目標": 120, "妥協": 110 } }], targetContext: "久岐忍専用：この比較表は超開花の公開値を対象にする。ヒーラー／激化支援では元素熟知を約200、HPを30,000、元素チャージを150%へ切り替える。C6のHP25%未満時の元素熟知+150、雷草の輪、武器・セット・編成バフは公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・KeqingMainsの更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GI_GUIDE_OVERRIDES, {
  "行秋": { headline: "元素爆発を継続するため、公開値の元素チャージ180%・攻撃力1,800・会心率60%・会心ダメージ130%を優先する。", relicSet: "絶縁の旗印 ×4", planarSet: "元素チャージ効率または攻撃力%・水元素ダメージ・会心", mainStats: [{ slot: "時計", value: "元素チャージ効率 / 攻撃力%" }, { slot: "杯", value: "水元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 220, "目標": 180, "妥協": 160 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2000, "目標": 1800, "妥協": 1600 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 70, "目標": 60, "妥協": 50 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 160, "目標": 130, "妥協": 110 } }], targetContext: "行秋専用：祭礼の剣・C6・編成粒子により必要な元素チャージは変動する。雨すだれの剣の軽減・中断耐性、水共鳴、味方・命ノ星座の戦闘中効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "香菱": { headline: "旋火輪を継続するため、公開値の元素チャージ180%・会心率55%・会心ダメージ160%・元素熟知150を優先する。", relicSet: "絶縁の旗印 ×4", planarSet: "元素チャージ効率または攻撃力%・炎元素ダメージ・会心", mainStats: [{ slot: "時計", value: "元素チャージ効率 / 攻撃力% / 元素熟知" }, { slot: "杯", value: "炎元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 230, "目標": 180, "妥協": 160 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 70, "目標": 55, "妥協": 45 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 180, "目標": 160, "妥協": 130 } }, { key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 250, "目標": 150, "妥協": 50 } }], targetContext: "香菱専用：炎元素粒子、雷電将軍・ベネット等の編成回復、蒸発・溶解、C6の炎元素ダメージ、武器・セット効果は戦闘中・条件付きのため公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "フィッシュル": { headline: "オズの控え火力を安定させるため、公開値の攻撃力2,000・会心率60%・会心ダメージ120%・元素チャージ130%を優先する。", relicSet: "黄金の劇団 ×4 / 雷のような怒り ×4", planarSet: "攻撃力%・雷元素ダメージ・会心", mainStats: [{ slot: "時計", value: "攻撃力% / 元素熟知" }, { slot: "杯", value: "雷元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2200, "目標": 2000, "妥協": 1800 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 75, "目標": 60, "妥協": 50 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 160, "目標": 120, "妥協": 100 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 150, "目標": 130, "妥協": 110 } }], targetContext: "フィッシュル専用：2雷編成では元素チャージ110〜130%、単独雷では130〜150%を目安にする。オズの雷付着、激化・感電、黄金の劇団・Hexerei、武器・編成の戦闘中効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GI_GUIDE_OVERRIDES, {
  "白朮": { headline: "草付着・回復支援を安定させるため、公開値の元素チャージ180%を優先し、反応ドライバー型とは分けて扱う。", relicSet: "深林の記憶 ×4 / 旧貴族のしつけ ×4", planarSet: "元素チャージ効率またはHP%・HP%・HP%", mainStats: [{ slot: "時計", value: "元素チャージ効率 / HP%" }, { slot: "杯", value: "HP%" }, { slot: "冠", value: "HP%" }], targets: [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 200, "目標": 180, "妥協": 160 } }], targetContext: "白朮専用：反応ドライバー型は元素熟知・元素チャージを優先し、元素チャージ約160%を目安にする。元素爆発中のシールド・反応強化、武器・編成・C1〜C6の条件付き回復・元素熟知効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
  "八重神子": { headline: "殺生櫻と元素爆発の火力を支えるため、公開値の攻撃力2,000・会心率60〜70%・会心ダメージ175%・元素熟知100〜200を整える。", relicSet: "黄金の劇団 ×4 / 金メッキの夢 ×4", planarSet: "攻撃力%または元素熟知・雷元素ダメージまたは攻撃力%・会心", mainStats: [{ slot: "時計", value: "攻撃力% / 元素熟知" }, { slot: "杯", value: "雷元素ダメージ / 攻撃力%" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2200, "目標": 2000, "妥協": 1800 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 70, "目標": 60, "妥協": 50 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 200, "目標": 175, "妥協": 150 } }, { key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 200, "目標": 100, "妥協": 0 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 160, "目標": 140, "妥協": 130 } }], targetContext: "八重神子専用：雷2名では元素チャージ130〜140%、単独雷では160%以上を目安にする。殺生櫻・星電導・武器・編成、C1〜C6のエネルギー・雷ダメージ・防御無視は戦闘中または条件付きであり、公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
  "宵宮": { headline: "炎通常攻撃を主軸に、攻撃力・会心比率を整え、蒸発型のみ元素熟知を追加で確保する。", relicSet: "追憶のしめ縄 ×4 / 燃え盛る炎の魔女 ×4", planarSet: "攻撃力%・炎元素ダメージ・会心", mainStats: [{ slot: "時計", value: "攻撃力%" }, { slot: "杯", value: "炎元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2200, "目標": 2000, "妥協": 1800 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 200, "目標": 160, "妥協": 130 } }, { key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 150, "目標": 100, "妥協": 0 } }], targetContext: "宵宮専用：元素熟知は蒸発・溶解編成の追加評価項目であり、純炎型では主判定にしない。元素スキル中の炎付与、爆発標識、武器・編成、C1〜C6の攻撃力・炎ダメージ・追加矢は戦闘中または条件付きのため公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GI_GUIDE_OVERRIDES, {
  "アーロイ": { headline: "クイックスワップの元素爆発火力を支えるため、公開値の攻撃力1,600〜1,800・会心・元素チャージ140〜160%を整える。", relicSet: "旧貴族のしつけ ×4 / 絶縁の旗印 ×4 / 氷風を彷徨う勇士 ×2・大地を流浪する楽団 ×2", planarSet: "攻撃力%・氷元素ダメージ・会心", mainStats: [{ slot: "時計", value: "攻撃力% / 元素チャージ効率" }, { slot: "杯", value: "氷元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 1800, "目標": 1600, "妥協": 1500 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 60, "目標": 40, "妥協": 30 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 190, "目標": 170, "妥協": 150 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 160, "目標": 140, "妥協": 120 } }], targetContext: "アーロイ専用：コイル・Rushing Ice、固有天賦の自身/味方攻撃力、氷ダメージの時間経過上昇、武器・聖遺物・元素反応・編成の条件付き効果は公開プロフィールへ加算しない。命ノ星座は公式に未実装のため、未収集/準備中表示を維持する。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Icy Veinsの更新日付き個別ビルド・PTガイドを照合" },
  "アイノ": { headline: "月感電・開花支援の反応性能を支えるため、公開値の元素熟知700〜800と編成に応じた元素チャージを優先する。", relicSet: "Silken Moon's Serenade ×4 / 旧貴族のしつけ ×4 / Instructor ×4", planarSet: "元素熟知または元素チャージ効率・元素熟知・会心または元素熟知", mainStats: [{ slot: "時計", value: "元素熟知 / 元素チャージ効率" }, { slot: "杯", value: "元素熟知" }, { slot: "冠", value: "会心率 / 元素熟知" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 800, "目標": 700, "妥協": 600 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 130 } }], targetContext: "アイノ専用：単水では元素チャージ150〜180%、水2名では110〜130%を目安にする。C1/C6の戦闘中元素熟知・反応ダメージ、武器・聖遺物・Moonsign・編成の外部バフは公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Icy Veinsの更新日付き個別ビルド・PTガイドを照合" },
  "アルベド": { headline: "陽華の防御力参照火力を支えるため、公開値の防御力2,000・会心率60%・会心ダメージ140%を優先する。", relicSet: "華館夢醒形骸記 ×4 / 黄金の劇団 ×4", planarSet: "防御力%・岩元素ダメージまたは防御力%・会心", mainStats: [{ slot: "時計", value: "防御力%" }, { slot: "杯", value: "岩元素ダメージ / 防御力%" }, { slot: "冠", value: "会心率 / 会心ダメージ / 防御力%" }], targets: [{ key: "defense", label: "防御力", unit: "", targets: { "厳選": 3000, "目標": 2000, "妥協": 1800 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 70, "目標": 60, "妥協": 50 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 180, "目標": 140, "妥協": 120 } }], targetContext: "アルベド専用：黎明の神剣前提では会心率80〜90%・会心ダメージ230〜260%の別到達帯となる。C1の一時的防御力、C2/C6の防御力比例ダメージ、C4の落下攻撃、爆発の元素熟知付与、武器・聖遺物・編成バフは公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Icy Veinsの更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GI_GUIDE_OVERRIDES, {
  "アンバー": { headline: "溶解重撃または爆発支援を安定させるため、公開値では会心比率1:2と編成別の元素チャージ効率を確認する。", relicSet: "大地を流浪する楽団 ×4 / 追憶のしめ縄 ×4 / 絶縁の旗印 ×4", planarSet: "攻撃力%または元素熟知・炎元素ダメージ・会心", mainStats: [{ slot: "時計", value: "元素熟知 / 攻撃力% / 元素チャージ効率" }, { slot: "杯", value: "炎元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 120, "目標": 110, "妥協": 100 } }], targetContext: "アンバー専用：溶解重撃は会心率:会心ダメージを1:2で整え、C4以上の溶解型では元素チャージ100〜120%を目安にする。元素熟知・攻撃力は武器・編成・反応・弱点命中で変動し、固定値を推測しない。元素反応、氷共鳴、武器・聖遺物、C6の攻撃力・移動速度は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・GameWith・KeqingMainsの更新日付き個別ビルド・PTガイドを照合" },
  "イアンサ": { headline: "攻撃力バフと元素爆発を安定させるため、公開値の攻撃力2,500・元素チャージ効率180%を優先する。", relicSet: "灰燼の都に立つ英雄の絵巻 ×4", planarSet: "攻撃力%または元素チャージ効率・攻撃力%・攻撃力%（西風なら会心率）", mainStats: [{ slot: "時計", value: "攻撃力% / 元素チャージ効率" }, { slot: "杯", value: "攻撃力%" }, { slot: "冠", value: "攻撃力% / 会心率" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2800, "目標": 2500, "妥協": 2200 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 200, "目標": 180, "妥協": 160 } }], targetContext: "イアンサ専用：単独雷/C0では元素チャージ180〜200%、雷2名では140〜160%が目安となる。西風長槍時だけ会心率30〜50%を補助評価する。バーストの攻撃力バフ、夜魂値、元素反応、C2/C6、武器・セットの戦闘中効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・KeqingMains・Icy Veinsの更新日付き個別ビルド・PTガイドを照合" },
  "イネファ": { headline: "月感電サブDPSを安定させるため、公開値の攻撃力2,000・会心率60%・会心ダメージ150%・元素熟知300を整える。", relicSet: "月紡ぎの曙歌 ×4 / シルケン・ムーンのセレナーデ ×4", planarSet: "攻撃力%または元素熟知・雷元素ダメージまたは元素熟知・会心", mainStats: [{ slot: "時計", value: "攻撃力% / 元素熟知" }, { slot: "杯", value: "雷元素ダメージ / 元素熟知" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2300, "目標": 2000, "妥協": 1800 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 70, "目標": 60, "妥協": 50 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 130 } }, { key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 350, "目標": 300, "妥協": 250 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 170, "目標": 130, "妥協": 110 } }], targetContext: "イネファ専用：雷2名では元素チャージ110〜140%、単独雷では130〜170%を目安にする。月感電、シールド、元素熟知・反応ダメージ、耐性低下、武器・聖遺物・C1〜C6の戦闘中効果は公開プロフィールへ加算しない。ガイドは基礎実装 genshin:10000116 のみに適用し、同名の別sourceIdへは適用しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・KeqingMains・Icy Veinsの更新日付き個別ビルド・PTガイドを照合" },
  "イファ": { headline: "感電・拡散支援を安定させるため、公開値では元素熟知700〜800以上と元素チャージ効率120〜130%を優先する。", relicSet: "翠緑の影 ×4 / 天穹の顕現せし夜 ×4", planarSet: "元素熟知または元素チャージ効率・元素熟知・元素熟知（アタッカー型は風ダメージ・会心）", mainStats: [{ slot: "時計", value: "元素熟知 / 元素チャージ効率" }, { slot: "杯", value: "元素熟知 / 風元素ダメージ" }, { slot: "冠", value: "元素熟知 / 会心率" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 850, "目標": 800, "妥協": 700 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 140, "目標": 130, "妥協": 120 } }, { key: "critRate", label: "会心率（西風時のみ）", unit: "%", targets: { "厳選": 50, "目標": 40, "妥協": 30 } }], targetContext: "イファ専用：この比較表は感電・拡散支援型の公開値を対象にする。アタッカー型の会心・攻撃力とは混在させず、夜魂値、反応ダメージ、元素熟知+80/+100、武器・聖遺物・C1〜C6の条件付き効果は公開プロフィールへ加算しない。イネファとは別実装 genshin:10000113 として扱う。", dataAsOf: "2026-08-24", updatedAt: "2026-08-26", sourceLabel: "Game8・Icy Veins・KeqingMainsの更新日付き個別ビルド・PTガイドを照合" },
  "ヴァレサ": { headline: "夜魂の落下攻撃を安定させるため、公開値では会心率80〜90%・会心ダメージ160〜200%・元素チャージ効率130〜150%を優先する。", relicSet: "長き夜の誓い ×4 / 黒曜の秘典 ×4", planarSet: "攻撃力%・雷元素ダメージ・会心率または会心ダメージ", mainStats: [{ slot: "時計", value: "攻撃力%" }, { slot: "杯", value: "雷元素ダメージ / 攻撃力%" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 90, "目標": 85, "妥協": 80 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 200, "目標": 180, "妥協": 160 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 150, "目標": 140, "妥協": 130 } }], targetContext: "ヴァレサ専用：この比較表は雷夜魂同伴を想定するオンフィールド型の公開値を対象にする。夜魂バーストの攻撃力、落下攻撃、反応、武器・聖遺物、C1〜C6の戦闘中・条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-25", updatedAt: "2026-08-26", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
  "ウェンティ": { headline: "集敵と拡散を安定させるため、支援型は元素熟知3部位を優先し、公開値の元素熟知800・元素チャージ効率160%を基準にする。", relicSet: "翠緑の影 ×4", planarSet: "元素熟知または元素チャージ効率・元素熟知・元素熟知（魔導秘儀アタッカー型は風ダメージ・会心）", mainStats: [{ slot: "時計", value: "元素熟知 / 元素チャージ効率" }, { slot: "杯", value: "元素熟知" }, { slot: "冠", value: "元素熟知" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 900, "目標": 800, "妥協": 700 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 180, "目標": 160, "妥協": 140 } }], targetContext: "ウェンティ専用：この比較表は従来の拡散支援型の公開値を対象にする。魔導秘儀アタッカー型の会心・攻撃力とは混在させず、元素変化、翠緑4セットの耐性低下、終焉を嘆く詩、味方・C1〜C6の戦闘中効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Icy Veins・KeqingMainsの更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GI_GUIDE_OVERRIDES, {
  "エウルア": { headline: "物理元素爆発の火力を支えるため、公開値では攻撃力2,000〜2,400・会心率60〜70%・会心ダメージ130%以上・元素チャージ120〜150%を整える。", relicSet: "蒼白の炎 ×4", planarSet: "攻撃力%・物理ダメージ・会心", mainStats: [{ slot: "時計", value: "攻撃力% / 元素チャージ効率" }, { slot: "杯", value: "物理ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2400, "目標": 2200, "妥協": 2000 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 70, "目標": 60, "妥協": 50 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 160, "目標": 130, "妥協": 110 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 150, "目標": 130, "妥協": 120 } }], targetContext: "エウルア専用：超電導の物理耐性低下、蒼白4セット、武器、雷・氷共鳴、編成・命ノ星座の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-26", sourceLabel: "Game8・Icy Veinsの更新日付き個別ビルド・PTガイドを照合" },
  "エスコフィエ": { headline: "凍結支援と元素爆発回復を安定させるため、公開値では会心率85%・元素チャージ効率150%以上を優先する。", relicSet: "黄金の劇団 ×4 / 千岩牢固 ×4", planarSet: "攻撃力%・氷元素ダメージまたは攻撃力%・会心", mainStats: [{ slot: "時計", value: "攻撃力% / 元素チャージ効率" }, { slot: "杯", value: "氷元素ダメージ / 攻撃力%" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 80, "妥協": 70 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 170, "目標": 150, "妥協": 130 } }], targetContext: "エスコフィエ専用：氷共鳴、水・氷4人条件の耐性低下、回復、モチーフ武器、編成・命ノ星座の効果は戦闘中または条件付きであり公開プロフィールへ加算しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-26", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "エミリエ": { headline: "燃焼を利用する草サブアタッカーとして、公開値では攻撃力2,000以上と会心比率を優先する。", relicSet: "遂げられなかった想い ×4 / 深林の記憶 ×4", planarSet: "攻撃力%・草元素ダメージ・会心", mainStats: [{ slot: "時計", value: "攻撃力%" }, { slot: "杯", value: "草元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2400, "目標": 2000, "妥協": 1800 } }], targetContext: "エミリエ専用：燃焼、炎共鳴、元素反応、瓶のランク、武器・聖遺物・編成・命ノ星座の条件付きダメージや攻撃力は公開プロフィールへ加算しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-26", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GI_GUIDE_OVERRIDES, {
  "オロルン": { headline: "待機中の雷追撃を活かすサブアタッカーとして、公開値の攻撃力2,000・会心率80%・会心ダメージ160%を整える。", relicSet: "灰燼の都に立つ英雄の絵巻 ×4 / 雷のような怒り ×4 / 金メッキの夢 ×4", planarSet: "攻撃力%・雷元素ダメージ・会心", mainStats: [{ slot: "時計", value: "攻撃力% / 元素チャージ効率" }, { slot: "杯", value: "雷元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2200, "目標": 2000, "妥協": 1800 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 80, "妥協": 70 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 180, "目標": 160, "妥協": 140 } }], targetContext: "オロルン専用：夜魂の加護、感電、絵巻、武器、命ノ星座の条件付きダメージ・バフは公開プロフィールへ加算しない。元素爆発の循環に必要な元素チャージはチームと武器で変動するため固定目標にしない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWith・KeqingMainsの更新日付き個別ビルド・PTガイドを照合" },
  "カーヴェ": { headline: "開花の出場アタッカーとして、公開値の元素熟知600以上と編成別の元素チャージを優先する。", relicSet: "楽園の絶花 ×4 / 深林の記憶 ×4 / 金メッキの夢 ×4", planarSet: "元素熟知・元素熟知・元素熟知（ドライバーは草元素ダメージ／会心も候補）", mainStats: [{ slot: "時計", value: "元素熟知 / 元素チャージ効率" }, { slot: "杯", value: "元素熟知 / 草元素ダメージ" }, { slot: "冠", value: "元素熟知 / 会心率" }], targets: [{ key: "energyRecharge", label: "元素チャージ効率（草1人）", unit: "%", targets: { "厳選": 210, "目標": 210, "妥協": 180 } }, { key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 800, "目標": 600, "妥協": 500 } }, { key: "critRate", label: "会心率（西風大剣時）", unit: "%", targets: { "厳選": 50, "目標": 40, "妥協": 30 } }], targetContext: "カーヴェ専用：草元素を2人採用する場合の元素チャージ目安は160%以上へ下がる。草原核、耐性・治療、聖遺物・武器・命ノ星座の攻撃速度・ダメージ等は公開プロフィールへ加算しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
  "ガイア": { headline: "元素爆発主体の氷サブアタッカーとして、公開値では元素チャージ効率150%以上を優先し、攻撃・氷ダメージ・会心を整える。", relicSet: "絶縁の旗印 ×4 / 氷風を彷徨う勇士 ×4 / 旧貴族のしつけ ×4", planarSet: "攻撃力%または元素チャージ効率・氷元素ダメージ・会心", mainStats: [{ slot: "時計", value: "元素チャージ効率 / 攻撃力%" }, { slot: "杯", value: "氷元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 130 } }], targetContext: "ガイア専用：攻撃力・氷元素ダメージ・会心は個別ガイドの優先主ステータスに従う。凍結、氷風4セット、氷共鳴、敵撃破、命ノ星座による会心・シールド・継続時間・回復は公開プロフィールへ加算しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
  "カチーナ": { headline: "絵巻支援を兼ねる岩サブ火力として、公開値の元素チャージ効率200%・会心率60%・会心ダメージ120%を整える。", relicSet: "灰燼の都に立つ英雄の絵巻 ×4 / 華館夢醒形骸記 ×4 / 黄金の劇団 ×4", planarSet: "防御力%または元素チャージ効率・岩元素ダメージまたは防御力%・会心", mainStats: [{ slot: "時計", value: "防御力% / 元素チャージ効率" }, { slot: "杯", value: "岩元素ダメージ / 防御力%" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 220, "目標": 200, "妥協": 180 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 70, "目標": 60, "妥協": 50 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 140, "目標": 120, "妥協": 100 } }], targetContext: "カチーナ専用：夜魂の加護、コマちゃん、絵巻、結晶、夜魂バースト、武器・命ノ星座・編成の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
  "キィニチ": { headline: "燃焼・烈開花の出場アタッカーとして、公開値の攻撃力2,000・会心率60%・会心ダメージ240%を整える。", relicSet: "黒曜の秘典 ×4 / 遂げられなかった想い ×4", planarSet: "攻撃力%・草元素ダメージ・会心", mainStats: [{ slot: "時計", value: "攻撃力%" }, { slot: "杯", value: "草元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2200, "目標": 2000, "妥協": 1800 } }, { key: "critRate", label: "会心率（公開値）", unit: "%", targets: { "厳選": 70, "目標": 60, "妥協": 50 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 260, "目標": 240, "妥協": 210 } }], targetContext: "キィニチ専用：黒曜4セットの夜魂値消費後会心率+40%、夜魂の加護、燃焼・烈開花、武器・命ノ星座の条件付き効果は公開プロフィールへ加算しない。元素爆発は毎ローテーションで使う場合にのみ元素チャージを追加で検討する。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWith・KeqingMainsの更新日付き個別ビルド・PTガイドを照合" },
  "キャンディス": { headline: "元素爆発主体の水元素付与支援として、公開値の元素チャージ効率180%前後を優先し、HPを役割に応じて積む。", relicSet: "旧貴族のしつけ ×4 / HP%・元素チャージ効率の2セット組み合わせ", planarSet: "元素チャージ効率またはHP%・HP%または水元素ダメージ・HP%または会心", mainStats: [{ slot: "時計", value: "元素チャージ効率 / HP%" }, { slot: "杯", value: "HP% / 水元素ダメージ" }, { slot: "冠", value: "HP% / 会心率 / 会心ダメージ" }], targets: [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 200, "目標": 180, "妥協": 160 } }], targetContext: "キャンディス専用：HPは支援量に有効だが、主根拠に固定の公開値閾値がないため推測で設定しない。爆発の水元素付与・ダメージバフ、武器・聖遺物・命ノ星座のHP・水追撃は公開プロフィールへ加算しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWith・Icy Veinsの更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GI_GUIDE_OVERRIDES, {
  "クレー": { headline: "炎元素の通常攻撃・重撃で表火力を担う法器アタッカーとして、会心・攻撃力・炎ダメージ・元素チャージを個別に整える。", relicSet: "燃え盛る炎の魔女 ×4 / 大地を流浪する楽団 ×4 / 烈火を渡る賢者 ×4", planarSet: "攻撃力%・炎元素ダメージ・会心", mainStats: [{ slot: "時計", value: "攻撃力% / 元素熟知" }, { slot: "杯", value: "炎元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [], targetContext: "クレー専用：会心率、会心ダメージ、攻撃力、炎元素ダメージ、元素チャージ効率を公開プロフィールで比較候補とする。元素反応、魔導秘儀、武器・聖遺物・命ノ星座・編成の条件付き効果は公開プロフィールへ加算しない。個別根拠に数値閾値がない項目は推測で登録しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "クロリンデ": { headline: "命の契約を維持して攻撃する雷片手剣アタッカーとして、会心・攻撃力・雷ダメージ・元素チャージを個別に整える。", relicSet: "諧律奇想の断章 ×4 / 雷のような怒り ×4 / 剣闘士のフィナーレ ×4", planarSet: "攻撃力%・雷元素ダメージ・会心", mainStats: [{ slot: "時計", value: "攻撃力%" }, { slot: "杯", value: "雷元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [], targetContext: "クロリンデ専用：会心率、会心ダメージ、攻撃力、雷元素ダメージ、元素チャージ効率を公開プロフィールで比較候補とする。命の契約、夜巡り、元素反応、武器・聖遺物・命ノ星座・編成の一時効果は公開プロフィールへ加算しない。根拠に数値閾値がない項目は推測で登録しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "コレイ": { headline: "元素爆発による草付着と反応起点を担う弓サブアタッカーとして、元素チャージ・元素熟知・会心・攻撃力を個別に整える。", relicSet: "深林の記憶 ×4 / 旧貴族のしつけ ×4 / 教官 ×4", planarSet: "元素チャージ効率または元素熟知・草元素ダメージまたは元素熟知・会心または元素熟知", mainStats: [{ slot: "時計", value: "元素チャージ効率 / 元素熟知" }, { slot: "杯", value: "草元素ダメージ / 元素熟知" }, { slot: "冠", value: "会心率 / 会心ダメージ / 元素熟知" }], targets: [], targetContext: "コレイ専用：元素チャージ効率、元素熟知、会心率、会心ダメージ、攻撃力、草元素ダメージを比較候補とする。元素反応、固有天賦の継続延長、武器・聖遺物・命ノ星座・編成効果は公開プロフィールへ加算しない。根拠に数値閾値がない項目は推測で登録しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "ゴロー": { headline: "岩元素編成の防御・耐性・岩ダメージ支援を担う弓サポーターとして、元素チャージと防御力を優先して整える。", relicSet: "月を紡ぐ夜の歌 ×4 / 旧貴族のしつけ ×4 / 華館夢醒形骸記 ×4", planarSet: "元素チャージ効率または防御力%・防御力%・会心率（西風猟弓時）", mainStats: [{ slot: "時計", value: "元素チャージ効率 / 防御力%" }, { slot: "杯", value: "防御力%" }, { slot: "冠", value: "会心率 / 防御力%" }], targets: [], targetContext: "ゴロー専用：元素チャージ効率、防御力、会心率、会心ダメージ、元素熟知を比較候補とする。岩元素人数による防御・耐性・岩ダメージ、結晶化、元素爆発、武器・聖遺物・命ノ星座の条件付き効果は公開プロフィールへ加算しない。根拠に数値閾値がない項目は推測で登録しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "コロンビーナ": { headline: "月反応の水元素サブアタッカー兼支援として、公開値ではHP35,000と元素チャージ効率200%以上を優先する。", relicSet: "暁の星と月の歌 ×4 / 月を紡ぐ夜の歌 ×4 / 天穹の顕現せし夜 ×4", planarSet: "HP%・HP%または水元素ダメージ・HP%または会心", mainStats: [{ slot: "時計", value: "HP% / 元素チャージ効率" }, { slot: "杯", value: "HP% / 水元素ダメージ" }, { slot: "冠", value: "HP% / 会心率 / 会心ダメージ" }], targets: [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 40000, "目標": 35000, "妥協": 32000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 220, "目標": 200, "妥協": 180 } }], targetContext: "コロンビーナ専用：月反応、引力値、誘月、月兆、武器・聖遺物・命ノ星座・編成の一時効果は公開プロフィールへ加算しない。現在の正規ソースIDに矛盾があるため、命ノ星座は安全に準備中を維持し、名称だけでは別実装を統合しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合（正規source ID未解決の命ノ星座は保留）" },
  "シグウィン": { headline: "HP依存の全体回復と待機中スキル支援を担う水弓ヒーラーとして、公開値ではHP50,000〜65,000を主目標にする。", relicSet: "在りし日の歌 ×4 / 海染硨磲 ×4 / 絶縁の旗印 ×4", planarSet: "HP%・HP%・HP%（元素爆発型は水元素ダメージ・会心も候補）", mainStats: [{ slot: "時計", value: "HP% / 元素チャージ効率" }, { slot: "杯", value: "HP% / 水元素ダメージ" }, { slot: "冠", value: "HP% / 会心率 / 会心ダメージ" }], targets: [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 65000, "目標": 50000, "妥協": 45000 } }], targetContext: "シグウィン専用：元素チャージ効率、会心率、会心ダメージ、水元素ダメージは運用別の比較候補とする。ヒーリングバブル、源水の雫、命の契約、待機中スキル、武器・聖遺物・命ノ星座・共鳴の効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GI_GUIDE_OVERRIDES, {
  "シトラリ": { headline: "夜魂シールドと炎・水反応支援を担う氷法器として、公開値の元素熟知と元素チャージ効率を優先する。", relicSet: "灰燼の都に立つ英雄の絵巻 ×4 / 千岩牢固 ×4 / 教官 ×4", planarSet: "元素チャージ効率または元素熟知・元素熟知・元素熟知", mainStats: [{ slot: "時計", value: "元素チャージ効率 / 元素熟知" }, { slot: "杯", value: "元素熟知" }, { slot: "冠", value: "元素熟知" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 800, "目標": 800, "妥協": 800 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 200, "目標": 170, "妥協": 160 } }], targetContext: "シトラリ専用：夜魂値、シールド、凍結・溶解、耐性低下、武器・聖遺物・命ノ星座・編成の戦闘中または条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・Game8英語版の更新日付き個別ビルド・PTガイドを照合" },
  "シャルロット": { headline: "元素爆発による全体回復を担う氷法器として、公開値の元素チャージ効率を最優先にする。", relicSet: "旧貴族のしつけ ×4 / 絶縁の旗印 ×2・愛される少女 ×2", planarSet: "元素チャージ効率または攻撃力%・攻撃力%・与える治癒効果または攻撃力%", mainStats: [{ slot: "時計", value: "元素チャージ効率 / 攻撃力%" }, { slot: "杯", value: "攻撃力%" }, { slot: "冠", value: "与える治癒効果 / 攻撃力%" }], targets: [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 200, "目標": 200, "妥協": 200 } }], targetContext: "シャルロット専用：攻撃力は治癒量に有効だが、根拠が条件を排した統一数値を示さないため推測で登録しない。フォンテーヌ人数による治癒、氷ダメージ、武器・聖遺物・命ノ星座の戦闘中効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8・KeqingMainsの更新日付き個別ビルド・PTガイドを照合" },
  "シュヴルーズ": { headline: "炎・雷の過負荷支援と回復を担う炎長柄として、公開値のHP40,000と元素チャージ効率を整える。", relicSet: "在りし日の歌 ×4 / 旧貴族のしつけ ×4 / 千岩牢固 ×2・花海甘露の光 ×2", planarSet: "HP%または元素チャージ効率・HP%・HP%または与える治癒効果", mainStats: [{ slot: "時計", value: "HP% / 元素チャージ効率" }, { slot: "杯", value: "HP%" }, { slot: "冠", value: "HP% / 与える治癒効果" }], targets: [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 40000, "目標": 40000, "妥協": 40000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 200, "目標": 160, "妥協": 160 } }], targetContext: "シュヴルーズ専用：炎・雷だけの編成、過負荷、協同戦術の耐性低下、HP参照の攻撃力バフ、C6炎・雷ダメージ、武器・聖遺物の戦闘中または条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8・Game8英語版・KeqingMainsの更新日付き個別ビルド・PTガイドを照合" },
  "ジン": { headline: "翠緑の影による耐性低下と元素爆発の回復を担う風片手剣として、公開値の元素チャージ効率を優先する。", relicSet: "翠緑の影 ×4 / 海染硨磲 ×4 / 旧貴族のしつけ ×4", planarSet: "元素チャージ効率または攻撃力%／元素熟知・攻撃力%／元素熟知／風元素ダメージ・与える治癒効果／元素熟知／会心", mainStats: [{ slot: "時計", value: "元素チャージ効率 / 攻撃力% / 元素熟知" }, { slot: "杯", value: "攻撃力% / 元素熟知 / 風元素ダメージ" }, { slot: "冠", value: "与える治癒効果 / 元素熟知 / 会心" }], targets: [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 200, "目標": 200, "妥協": 200 } }], targetContext: "ジン専用：回復量は攻撃力参照、サンファイアでは元素熟知も必要になるが、共通閾値がないため推測で追加しない。爆発中の回復、翠緑耐性低下、炎拡散、武器・聖遺物・命ノ星座の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8・Game8英語版の更新日付き個別ビルド・PTガイドを照合" },
  "スカーク": { headline: "氷関連反応を用いる出場アタッカーとして、公開値の攻撃力・会心率・会心ダメージを優先する。", relicSet: "深廊の終曲 ×4 / ファントムハンター ×4 / 氷風を彷徨う勇士 ×4", planarSet: "攻撃力%・氷元素ダメージまたは攻撃力%・会心率または会心ダメージ", mainStats: [{ slot: "時計", value: "攻撃力%" }, { slot: "杯", value: "氷元素ダメージ / 攻撃力%" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2100, "目標": 2100, "妥協": 2100 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 70 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 200, "目標": 200, "妥協": 200 } }], targetContext: "スカーク専用：元素エネルギーを使わないため元素チャージ効率は目標にしない。水・氷のみの編成、虚境の裂け目、七相一閃、蛇の狡智、武器・聖遺物・命ノ星座の戦闘中または条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8・Game8英語版の更新日付き個別ビルド・PTガイドを照合" },
  "スクロース": { headline: "翠緑の影による拡散支援を担う風法器として、公開値の元素熟知と元素チャージ効率を優先する。", relicSet: "翠緑の影 ×4 / 教官 ×4", planarSet: "元素熟知または元素チャージ効率・元素熟知・元素熟知（西風秘典時は会心率も候補）", mainStats: [{ slot: "時計", value: "元素熟知 / 元素チャージ効率" }, { slot: "杯", value: "元素熟知" }, { slot: "冠", value: "元素熟知" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 800, "目標": 800, "妥協": 800 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 160, "目標": 130, "妥協": 130 } }], targetContext: "スクロース専用：西風秘典時のみ会心率を補助評価する。拡散時の元素熟知配布、翠緑耐性低下、武器・命ノ星座・元素変化による戦闘中または条件付きバフは公開プロフィールへ加算しない。", dataAsOf: "2026-08-14", updatedAt: "2026-08-27", sourceLabel: "Game8・Game8英語版・KeqingMainsの更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GI_GUIDE_OVERRIDES, {
  "セトス": { headline: "狙い撃ち／元素爆発の主軸を明示し、会心・元素熟知・元素チャージを個別に整える。", relicSet: "大地を流浪する楽団 ×4 / 雷のような怒り ×4 / 金メッキの夢 ×4 / 天穹の顕現せし夜 ×4", planarSet: "元素熟知・雷元素ダメージまたは元素熟知・会心", mainStats: [{ slot: "時計", value: "元素熟知" }, { slot: "杯", value: "雷元素ダメージ / 元素熟知" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [], targetContext: "セトス専用：会心率・会心ダメージを優先し、元素熟知・元素チャージ効率を評価する。貫影の矢・瞑弦の矢、固有天賦、聖遺物・武器・命ノ星座の条件付き効果は公開プロフィールへ加算しない。根拠に固定数値閾値がないため推測で登録しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "セノ": { headline: "激化時の雷元素火力を支えるため、公開値の元素熟知300程度と元素チャージ効率130〜150%を整える。", relicSet: "金メッキの夢 ×4 / 雷のような怒り ×4 / 剣闘士のフィナーレ ×4", planarSet: "攻撃力%または元素熟知・雷元素ダメージ・会心", mainStats: [{ slot: "時計", value: "攻撃力% / 元素熟知" }, { slot: "杯", value: "雷元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 300, "目標": 300, "妥協": 300 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 150, "目標": 130, "妥協": 130 } }], targetContext: "セノ専用：会心ダメージ・会心率・元素熟知・攻撃力を優先する。元素爆発中の元素熟知+100、反応、武器・聖遺物・命ノ星座の戦闘中または条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "ダリア": { headline: "シールドと回復を支えるため、公開値のHP40,000と元素チャージ効率200%以上を優先する。", relicSet: "旧貴族のしつけ ×4 / 千岩牢固 ×2・花海甘露の光 ×2 / 絶縁の旗印 ×2", planarSet: "HP%または元素チャージ効率・HP%・HP%または会心率（西風剣時）", mainStats: [{ slot: "時計", value: "HP% / 元素チャージ効率" }, { slot: "杯", value: "HP%" }, { slot: "冠", value: "HP% / 会心率（西風剣時）" }], targets: [{ key: "hp", label: "HP（元素共鳴なし）", unit: "", targets: { "厳選": 40000, "目標": 40000, "妥協": 34000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 200, "目標": 200, "妥協": 200 } }], targetContext: "原神ダリア専用：HSRの同名実装とは別に扱う。西風の恵み、シールド、攻撃速度、武器・聖遺物・命ノ星座の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "タルタリヤ": { headline: "近接モードの水元素火力を支えるため、会心を最優先に攻撃力・元素チャージ・元素熟知を整える。", relicSet: "水仙の夢 ×4 / 沈淪の心 ×4 / 水元素ダメージ・攻撃力の2セット組み合わせ", planarSet: "攻撃力%・水元素ダメージ・会心", mainStats: [{ slot: "時計", value: "攻撃力%" }, { slot: "杯", value: "水元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [], targetContext: "タルタリヤ専用：会心率≧会心ダメージ、次いで攻撃力・元素チャージ効率・元素熟知を評価する。断流、近接モード、聖遺物・武器・命ノ星座の条件付き効果は公開プロフィールへ加算しない。根拠に固定数値閾値がないため推測で登録しない。", dataAsOf: "2026-08-25", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "チャスカ": { headline: "元素変化する重撃を支えるため、会心・攻撃力・元素熟知を個別に整える。", relicSet: "黒曜の秘典 ×4 / ファントムハンター ×4 / 天穹の顕現せし夜 ×4 / 大地を流浪する楽団 ×4 / 追憶のしめ縄 ×4", planarSet: "攻撃力%または元素熟知・攻撃力%または元素熟知・会心", mainStats: [{ slot: "時計", value: "攻撃力% / 元素熟知" }, { slot: "杯", value: "攻撃力% / 元素熟知" }, { slot: "冠", value: "会心ダメージ / 会心率" }], targets: [], targetContext: "チャスカ専用：会心ダメージ／会心率＞攻撃力＞元素熟知を評価する。夜魂、元素変化、固有天賦、聖遺物・武器・命ノ星座の戦闘中効果は公開プロフィールへ加算しない。根拠に固定数値閾値がないため推測で登録しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "ディオナ": { headline: "シールドと元素爆発の回復を安定させるため、HPと元素チャージ効率を優先する。", relicSet: "旧貴族のしつけ ×4 / 千岩牢固 ×2・絶縁の旗印 ×2 / 愛される少女 ×4", planarSet: "HP%または元素チャージ効率・HP%・HP%", mainStats: [{ slot: "時計", value: "HP% / 元素チャージ効率" }, { slot: "杯", value: "HP%" }, { slot: "冠", value: "HP%" }], targets: [], targetContext: "ディオナ専用：HPと元素チャージ効率を優先する。シールド、元素爆発領域、武器・聖遺物・命ノ星座の戦闘中または条件付き効果は公開プロフィールへ加算しない。根拠に固定数値閾値がないため推測で登録しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "ディシア": { headline: "アタッカー／サポート運用を分け、会心・攻撃力・HPまたはHPを優先して整える。", relicSet: "サポート：千岩牢固 ×4／アタッカー：絶縁の旗印 ×4 / 深林の記憶 ×4 / 花海甘露の光 ×4", planarSet: "攻撃力%またはHP%・炎元素ダメージ・会心", mainStats: [{ slot: "時計", value: "攻撃力% / HP%" }, { slot: "杯", value: "炎元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [], targetContext: "ディシア専用：アタッカーは会心・攻撃力・HP、サポートはHPを優先する。浄焔剣獄、熾炎獅子、肩代わり、武器・聖遺物・命ノ星座の戦闘中効果は公開プロフィールへ加算しない。根拠に固定数値閾値がないため推測で登録しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "ティナリ": { headline: "激化重撃を支えるため、会心・元素熟知・攻撃力・元素チャージを個別に整える。", relicSet: "大地を流浪する楽団 ×4 / 金メッキの夢 ×4 / 深林の記憶 ×4", planarSet: "元素熟知または攻撃力%・草元素ダメージ・会心", mainStats: [{ slot: "時計", value: "元素熟知 / 攻撃力%" }, { slot: "杯", value: "草元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: [], targetContext: "ティナリ専用：会心率／会心ダメージ＞元素熟知＞攻撃力%＞元素チャージ効率を評価する。固有天賦の元素熟知換算、聖遺物・武器・命ノ星座の戦闘中効果は公開プロフィールへ加算しない。根拠に固定数値閾値がないため推測で登録しない。", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
});

function genshinGuide(name: string): GuideDefinition {
  const individualGuide = GI_GUIDE_OVERRIDES[name];
  if (individualGuide) return withGuideMetadata("genshin", { ...individualGuide, targetContext: individualGuide.targetContext ?? `${name}専用の有効ステータス目標です。武器・編成・元素反応・戦闘中バフにより必要値は変動します。` }, name);
  return withGuideMetadata("genshin", generatedGenshinGuide(name), name);
}

function comparisonsFromStats(targets: TargetStatDefinition[], values: Record<string, number>) {
  return targets.map((target): StatComparison => {
    const current = values[target.key] ?? null;
    return {
      ...target,
      current,
      currentDisplay: current === null ? "未取得" : target.unit === "%" ? `${current.toFixed(1)}%` : current.toFixed(0),
      achieved: {
        "厳選": current === null ? null : current >= target.targets["厳選"],
        "目標": current === null ? null : current >= target.targets["目標"],
        "妥協": current === null ? null : current >= target.targets["妥協"],
      },
    };
  });
}

type GenshinCatalog = { characters: RawRecord; loc: RawRecord };
const getGenshinCatalog = createTimedLoader(async (): Promise<GenshinCatalog> => {
  const [characters, loc] = await Promise.all([fetchJson(`${ENKA_STORE}/characters.json`), fetchJson(`${ENKA_STORE}/loc.json`)]);
  return { characters: asRecord(characters), loc: asRecord(loc) };
});

export function normalizeGenshinPayload(payload: unknown, catalog: GenshinCatalog): NormalizedBuild {
  const root = asRecord(payload);
  const player = asRecord(root.playerInfo);
  const characters = asArray(root.avatarInfoList).map(asRecord).map((avatar): CharacterProfile => {
    const id = text(avatar.avatarId);
    const metadata = asRecord(catalog.characters[id]);
    const identity = resolveCharacterIdentity("genshin", id, localized(catalog.loc, metadata.NameTextMapHash));
    const name = identity.displayName;
    const elementMeta = GI_ELEMENTS[text(metadata.Element)] ?? { label: "元素", color: "#c28a42" };
    const fightProps = asRecord(avatar.fightPropMap);
    const statDefs = [
      ["20", "FIGHT_PROP_CRITICAL", "critRate"], ["22", "FIGHT_PROP_CRITICAL_HURT", "critDmg"], ["23", "FIGHT_PROP_CHARGE_EFFICIENCY", "energyRecharge"], ["28", "FIGHT_PROP_ELEMENT_MASTERY", "elementalMastery"],
      ["2000", "FIGHT_PROP_HP", "hp"], ["2001", "FIGHT_PROP_ATTACK", "attack"], ["2002", "FIGHT_PROP_DEFENSE", "defense"],
    ] as const;
    const statValues: Record<string, number> = {};
    const allStats = statDefs.map(([field, prop, key]) => {
      const stat = giStat(prop, number(fightProps[field]));
      statValues[key] = stat.value;
      return { name: stat.name, display: stat.display, icon: null };
    });
    const equipList = asArray(avatar.equipList).map(asRecord);
    const weapon = equipList.find((equip) => Object.keys(asRecord(equip.weapon)).length > 0 || text(asRecord(equip.flat).itemType) === "ITEM_WEAPON");
    const relics = equipList.filter((equip) => Object.keys(asRecord(equip.reliquary)).length > 0 || text(asRecord(equip.flat).itemType) === "ITEM_RELIQUARY").map((equip, index) => {
      const flat = asRecord(equip.flat);
      const reliquary = asRecord(equip.reliquary);
      const main = asRecord(flat.reliquaryMainstat);
      const mainProp = text(main.mainPropId ?? reliquary.mainPropId);
      return {
        id: text(equip.itemId, `${id}-artifact-${index}`),
        name: localized(catalog.loc, flat.nameTextMapHash, GI_ARTIFACT_SLOTS[text(flat.equipType)] ?? "聖遺物"),
        slot: GI_ARTIFACT_SLOTS[text(flat.equipType)] ?? "聖遺物",
        setName: localized(catalog.loc, flat.setNameTextMapHash, "聖遺物セット"),
        level: Math.max(0, number(reliquary.level) - 1), icon: iconUrl(text(flat.icon)) ?? null,
        main: mainProp ? { name: GI_PROP_NAMES[mainProp] ?? mainProp, display: giStat(mainProp, number(main.statValue), false).display } : null,
        subs: asArray(flat.reliquarySubstats).map(asRecord).map((sub) => {
          const prop = text(sub.appendPropId);
          return { name: GI_PROP_NAMES[prop] ?? prop, display: giStat(prop, number(sub.statValue), false).display };
        }),
      };
    });
    const weaponFlat = asRecord(weapon?.flat);
    const weaponInfo = asRecord(weapon?.weapon);
    const guide = genshinGuide(name);
    const comparisons = comparisonsFromStats(guide.targets, statValues);
    const recommendations = priorityRecommendations(comparisons);
    return {
      id: identity.sourceId, identity, name, level: number(asRecord(avatar.propMap)["4001"] && asRecord(asRecord(avatar.propMap)["4001"]).val, null as unknown as number),
      rank: asArray(avatar.talentIdList).length, portrait: iconUrl(text(metadata.SideIconName)) ?? null,
      element: elementMeta.label, elementColor: elementMeta.color, path: GI_WEAPONS[text(metadata.WeaponType)] ?? "武器",
      lightCone: weapon ? { name: localized(catalog.loc, weaponFlat.nameTextMapHash, "武器"), level: number(weaponInfo.level, null as unknown as number), rank: number(Object.values(asRecord(weaponInfo.affixMap))[0], -1) + 1, icon: iconUrl(text(weaponFlat.icon)) ?? null } : null,
      relics, allStats, guide, comparisons, recommendations, equipmentActions: equipmentActionsFor(guide, relics, recommendations), partyRecommendations: partyRecommendationsFor("genshin", name), constellations: constellationProfileFor(identity, asArray(avatar.talentIdList).length),
    };
  });
  return { player: { uid: text(root.uid), name: text(player.nickname, "旅人"), level: number(player.level, null as unknown as number) }, characters };
}

const ZZZ_ELEMENTS: Record<string, { label: string; color: string }> = {
  Fire: { label: "炎", color: "#d45b48" }, Ice: { label: "氷", color: "#76c8dc" }, Elec: { label: "電気", color: "#a278d2" }, Electric: { label: "電気", color: "#a278d2" }, Physical: { label: "物理", color: "#a6a6a6" }, Physics: { label: "物理", color: "#a6a6a6" }, Ether: { label: "エーテル", color: "#d875ce" },
};
const ZZZ_PROFESSIONS: Record<string, string> = { Attack: "強攻", Anomaly: "異常", Stun: "撃破", Support: "支援", Defense: "防護", Rupture: "命破" };
const ZZZ_PROP_FALLBACKS: Record<string, string> = {
  "11101": "HP", "11102": "HP%", "11103": "HP", "12101": "攻撃力", "12102": "攻撃力%", "12103": "攻撃力", "12201": "衝撃力", "12202": "衝撃力%", "13101": "防御力", "13102": "防御力%", "13103": "防御力",
  "20101": "会心率", "20103": "会心率", "21101": "会心ダメージ", "21103": "会心ダメージ", "23101": "貫通率", "23103": "貫通率", "23201": "貫通値", "23203": "貫通値", "30501": "エネルギー自動回復", "31201": "異常マスタリー", "31401": "異常掌握",
};

type ZzzCatalog = { avatars: RawRecord; weapons: RawRecord; equipments: RawRecord; locs: RawRecord; property: RawRecord };
const getZzzCatalog = createTimedLoader(async (): Promise<ZzzCatalog> => {
  const [avatars, weapons, equipments, locs, property] = await Promise.all([
    fetchJson(`${ENKA_STORE}/zzz/avatars.json`), fetchJson(`${ENKA_STORE}/zzz/weapons.json`), fetchJson(`${ENKA_STORE}/zzz/equipments.json`), fetchJson(`${ENKA_STORE}/zzz/locs.json`), fetchJson(`${ENKA_STORE}/zzz/property.json`),
  ]);
  return { avatars: asRecord(avatars), weapons: asRecord(weapons), equipments: asRecord(equipments), locs: asRecord(locs), property: asRecord(property) };
});

function zzzName(catalog: ZzzCatalog, key: unknown, fallback: string) {
  return localized(catalog.locs, key, fallback);
}

function zzzStat(catalog: ZzzCatalog, stat: RawRecord, multiplier: number) {
  const id = text(stat.PropertyId);
  const property = asRecord(catalog.property[id]);
  const rawValue = number(stat.PropertyValue) * multiplier;
  const percent = text(property.Format).includes("%");
  const displayValue = percent ? rawValue / 100 : rawValue;
  const name = ZZZ_PROP_FALLBACKS[id] ?? zzzName(catalog, property.Name, `ステータス #${id}`);
  return { id, name, value: displayValue, display: percent ? `${displayValue.toFixed(1)}%` : displayValue.toFixed(0), percent };
}

function zzzPropertyValue(catalog: ZzzCatalog, propertyId: string, rawValue: number, multiplier = 1) {
  return zzzStat(catalog, { PropertyId: propertyId, PropertyValue: rawValue }, multiplier).value;
}

function addProperty(target: Record<string, number>, propertyId: string, value: number) {
  target[propertyId] = (target[propertyId] ?? 0) + value;
}

function zzzAgentBaseStats(catalog: ZzzCatalog, metadata: RawRecord, avatar: RawRecord) {
  const baseProps = asRecord(metadata.BaseProps);
  const growthProps = asRecord(metadata.GrowthProps);
  const promotionProps = asArray(metadata.PromotionProps).map(asRecord);
  const coreProps = asArray(metadata.CoreEnhancementProps).map(asRecord);
  const promotionIndex = Math.max(0, Math.min(promotionProps.length - 1, number(avatar.PromotionLevel, 1) - 1));
  const coreIndex = Math.max(0, Math.min(coreProps.length - 1, number(avatar.CoreSkillEnhancement, 0)));
  const promotion = promotionProps[promotionIndex] ?? {};
  const core = coreProps[coreIndex] ?? {};
  const level = Math.max(1, number(avatar.Level, 1));
  const allIds = new Set([...Object.keys(baseProps), ...Object.keys(growthProps), ...Object.keys(promotion), ...Object.keys(core)]);
  const values: Record<string, number> = {};
  allIds.forEach((propertyId) => {
    const rawBase = number(baseProps[propertyId]);
    const rawGrowth = number(growthProps[propertyId]) * (level - 1) / 10_000;
    const rawPromotion = number(promotion[propertyId]);
    const rawCore = number(core[propertyId]);
    const property = asRecord(catalog.property[propertyId]);
    const percent = text(property.Format).includes("%");
    const rawTotal = percent || propertyId === "11101" ? rawBase + rawGrowth + rawPromotion + rawCore : Math.floor(rawBase + rawGrowth + rawPromotion + rawCore);
    values[propertyId] = zzzPropertyValue(catalog, propertyId, rawTotal);
  });
  return values;
}

function zzzWeaponStats(catalog: ZzzCatalog, weaponMeta: RawRecord, rawWeapon: RawRecord) {
  const level = Math.max(1, number(rawWeapon.Level, 1));
  const breakLevel = Math.max(0, number(rawWeapon.BreakLevel, 0));
  const values: Record<string, number> = {};
  const main = asRecord(weaponMeta.MainStat);
  const secondary = asRecord(weaponMeta.SecondaryStat);
  const mainId = text(main.PropertyId);
  const secondaryId = text(secondary.PropertyId);
  if (mainId) {
    const value = zzzPropertyValue(catalog, mainId, number(main.PropertyValue), 1 + 0.1568166666666667 * level + 0.8922 * breakLevel);
    addProperty(values, mainId, text(asRecord(catalog.property[mainId]).Format).includes("%") ? value : Math.floor(value));
  }
  if (secondaryId) {
    const value = zzzPropertyValue(catalog, secondaryId, number(secondary.PropertyValue), 1 + 0.3 * breakLevel);
    addProperty(values, secondaryId, text(asRecord(catalog.property[secondaryId]).Format).includes("%") ? value : Math.floor(value));
  }
  return values;
}

function finalZzzStats(catalog: ZzzCatalog, agent: Record<string, number>, weapon: Record<string, number>, equipment: Record<string, number>) {
  const combined: Record<string, number> = {};
  const allIds = new Set([...Object.keys(agent), ...Object.keys(weapon), ...Object.keys(equipment)]);
  allIds.forEach((id) => { combined[id] = (agent[id] ?? 0) + (weapon[id] ?? 0) + (equipment[id] ?? 0); });
  const total = (id: string) => combined[id] ?? 0;
  const scale = (base: string, percent: string, flat: string, roundToNearest = false) => {
    const value = total(base) * (1 + total(percent) / 100) + total(flat);
    return roundToNearest ? Math.round(value) : Math.floor(value);
  };
  const entries: Array<[string, number, boolean]> = [
    ["HP", scale("11101", "11102", "11103", true), false],
    ["攻撃力", scale("12101", "12102", "12103"), false],
    ["防御力", scale("13101", "13102", "13103"), false],
    ["衝撃力", total("12201") * (1 + total("12202") / 100), false],
    ["会心率", total("20101") + total("20103"), true],
    ["会心ダメージ", total("21101") + total("21103"), true],
    ["異常掌握", total("31401") * (1 + total("31402") / 100) + total("31403"), false],
    ["異常マスタリー", total("31201") + total("31203"), false],
    ["貫通率", total("23101") + total("23103"), true],
    ["貫通値", total("23201") + total("23203"), false],
    ["エネルギー自動回復", total("30501") * (1 + total("30502") / 100) + total("30503"), false],
    ["物理属性ダメージボーナス", total("31501") + total("31503"), true],
    ["炎属性ダメージボーナス", total("31601") + total("31603"), true],
    ["氷属性ダメージボーナス", total("31701") + total("31703"), true],
    ["電気属性ダメージボーナス", total("31801") + total("31803"), true],
    ["エーテル属性ダメージボーナス", total("31901") + total("31903"), true],
  ];
  const display = entries.filter(([, value]) => value !== 0).map(([name, value, percent]) => ({ name, value, display: percent ? `${value.toFixed(1)}%` : Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1), icon: null }));
  return {
    display,
    values: {
      attack: scale("12101", "12102", "12103"), critRate: total("20101") + total("20103"), critDmg: total("21101") + total("21103"), attackPercent: total("12102"), hpPercent: total("11102"),
      impact: total("12201") * (1 + total("12202") / 100), anomalyMastery: total("31201") + total("31203"), anomalyProficiency: total("31401") * (1 + total("31402") / 100) + total("31403"), penRatio: total("23101") + total("23103"), energyRegen: total("30501") * (1 + total("30502") / 100) + total("30503"),
    },
  };
}

const ZZZ_CHARACTER_GUIDES: Record<string, GuideDefinition> = {
  "0号・アンビー": {
    headline: "追加攻撃を主軸に、戦闘外の会心率を整えたうえで会心ダメージと攻撃力を伸ばす。",
    relicSet: "シャドウハーモニー ×4 / ウッドペッカー・エレクトロ ×2", planarSet: "会心率70%前後を起点に戦闘中補正を加味",
    mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "電気属性ダメージ / 貫通率" }, { slot: "VI", value: "攻撃力%" }],
    targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 200, "目標": 180, "妥協": 150 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2800, "妥協": 2500 } }],
    targetContext: "0号・アンビー専用：会心率はステータス画面の戦闘外値です。追加能力・シャドウハーモニー4セットの戦闘中補正は判定に含めません。",
  },
  "ビビアン": {
    headline: "控えからの侵蝕・混沌を伸ばすため、異常マスタリーを優先し、音動機に応じた攻撃力を確保する。",
    relicSet: "パエトーンの歌 ×4 / ケイオス・ジャズ ×2", planarSet: "異常マスタリー・エーテル属性ダメージまたは攻撃力%・異常掌握",
    mainStats: [{ slot: "IV", value: "異常マスタリー" }, { slot: "V", value: "エーテル属性ダメージ / 攻撃力%" }, { slot: "VI", value: "異常掌握" }],
    targets: [{ key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 450, "目標": 430, "妥協": 340 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2500, "目標": 2300, "妥協": 2000 } }],
    targetContext: "ビビアン専用：モチーフありは異常マスタリー430以上・攻撃力2,300、モチーフなしは異常マスタリー340以上・攻撃力2,500を目安にする。音動機・パエトーン4セット・追加能力・M1〜M6の条件付き効果は公開プロフィールへ加算しない。",
    dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合",
  },
  "プロメイア": {
    headline: "異常マスタリーを最優先に、攻撃力を積み上げて状態異常火力を安定させる。",
    relicSet: "獄中の手記 ×4 / パエトーンの歌 ×2", planarSet: "異常マスタリーと攻撃力を優先",
    mainStats: [{ slot: "IV", value: "異常マスタリー" }, { slot: "V", value: "氷属性ダメージ / 攻撃力%" }, { slot: "VI", value: "異常マスタリー" }],
    targets: [{ key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 350, "目標": 325, "妥協": 300 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2500, "目標": 2350, "妥協": 2200 } }],
    targetContext: "プロメイア専用：異常マスタリーと攻撃力のみを主判定にし、会心系は評価対象から外します。",
  },
  "エレン": {
    headline: "氷属性の直撃火力へ、公開値の会心率70%以上・会心ダメージ120%・攻撃力2,500を整える。",
    relicSet: "極地のヘヴィメタル ×4 / ウッドペッカー・エレクトロ ×2", planarSet: "会心率または会心ダメージ・貫通率／氷属性ダメージ／攻撃力%",
    mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "貫通率 / 氷属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }],
    targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 65 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 160, "目標": 120, "妥協": 100 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2800, "目標": 2500, "妥協": 2200 } }],
    targetContext: "エレン専用：音動機ありでは会心率65〜80%・会心ダメージ160%を追加目安にする。コア・追加能力・凍結／ブレイク・味方・M1〜M6の条件付き会心・与ダメージ・貫通率は公開プロフィールへ加算しない。",
    dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合",
  },
  "ジェーン": {
    headline: "強撃・混沌を安定させるため、公開値の異常マスタリー400以上と攻撃力2,500を優先する。",
    relicSet: "獣牙のヘヴィメタル ×4 / ケイオス・ジャズ ×2・フリーダム・ブルース ×2", planarSet: "異常マスタリー・物理属性ダメージまたは攻撃力%・異常掌握",
    mainStats: [{ slot: "IV", value: "異常マスタリー" }, { slot: "V", value: "物理属性ダメージ / 攻撃力%" }, { slot: "VI", value: "異常掌握" }],
    targets: [{ key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 450, "目標": 400, "妥協": 375 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2800, "目標": 2500, "妥協": 2200 } }],
    targetContext: "ジェーン専用：モチーフありでは異常マスタリー450、通常は400以上、強撃会心を安定させる目安は375を下限とする。熱狂中の攻撃力・蓄積効率、追加能力、ディスク・音動機、M1〜M6の条件付き効果は公開プロフィールへ加算しない。",
    dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合",
  },
  "星見雅": {
    headline: "霜灼・烈霜の異常蓄積を最大化する会心率80%を優先し、会心ダメージと攻撃力を補強する。",
    relicSet: "折枝の刀歌 ×4", planarSet: "会心率80%を起点に調整",
    mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "氷属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }],
    targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 80, "妥協": 70 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 130 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2800, "妥協": 2600 } }],
    targetContext: "星見雅専用：会心率80%はコアスキルの霜異常蓄積上限の公開値目安。M2の会心率+15%は戦闘中効果として現在値へ加算せず、凸補正として目標側にのみ反映する。",
    dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: "Game8・Icy Veinsの更新日付き個別ビルド・PTガイドを照合",
  },
  "浮波柚葉": {
    headline: "異常チームの支援上限へ到達するため、攻撃力3,000と異常掌握200を個別に確保する。",
    relicSet: "月夜の子守歌 ×4 / ファエトンのメロディ ×2", planarSet: "代替：スイング・ジャズ ×4 / ファエトンのメロディ ×2",
    mainStats: [{ slot: "IV", value: "攻撃力%" }, { slot: "V", value: "攻撃力%" }, { slot: "VI", value: "異常掌握" }],
    targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3200, "目標": 3000, "妥協": 2700 } }, { key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 220, "目標": 200, "妥協": 180 } }],
    targetContext: "浮波柚葉専用：攻撃力・異常掌握は本人の支援上限に使う公開値。味方への攻撃力・異常蓄積・異常／混沌ダメージ、およびM1/M2の効果は戦闘中効果として公開値へ加算しない。",
    dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合",
  },
  "月城柳": {
    headline: "極性混沌を安定して起こすため、異常マスタリー・異常掌握・攻撃力を個別に確保する。",
    relicSet: "霹靂のヘヴィメタル ×4 / ケイオス・ジャズ ×2",
    planarSet: "代替：ケイオス・ジャズ ×4 / 霹靂のヘヴィメタル ×2",
    mainStats: [{ slot: "IV", value: "異常マスタリー" }, { slot: "V", value: "電気属性ダメージ / 貫通率 / 攻撃力%" }, { slot: "VI", value: "異常掌握" }],
    targets: [{ key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 450, "目標": 400, "妥協": 350 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3400, "目標": 3000, "妥協": 2600 } }],
    targetContext: "月城柳専用：異常掌握148〜190以上は音動機・ディスクを含む個別の到達目安。M1以降の戦闘中異常・貫通補正は公開プロフィールへ加算しない。",
  },
  "アストラ": {
    headline: "アイドリック・カデンツァの支援上限へ到達する攻撃力を優先し、6番はエネルギー自動回復で循環を補う。",
    relicSet: "静寂のアストラ ×4 / スイング・ジャズ ×2",
    planarSet: "代替：静寂のアストラ ×4 / ホルモン・パンク ×2",
    mainStats: [{ slot: "IV", value: "攻撃力%" }, { slot: "V", value: "攻撃力%" }, { slot: "VI", value: "エネルギー自動回復 / 攻撃力%" }],
    targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3800, "目標": 3429, "妥協": 3200 } }],
    targetContext: "アストラ・ヤオ専用：無凸では初期攻撃力3,429前後がコア支援の上限目安。心象映画の耐性低下・攻撃力・追撃は戦闘条件として別表示する。",
  },
  "ライト": {
    headline: "炎・氷主力の耐性低下とブレイク延長を最大化するため、衝撃力270を最優先にする。",
    relicSet: "キング・オブ・ザ・サミット ×4 / スイング・ジャズ ×2",
    planarSet: "代替：キング・オブ・ザ・サミット ×4 / ショックスター・ディスコ ×2",
    mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "炎属性ダメージ / 攻撃力%" }, { slot: "VI", value: "衝撃力" }],
    targets: [{ key: "impact", label: "衝撃力", unit: "", targets: { "厳選": 300, "目標": 270, "妥協": 240 } }],
    targetContext: "ライト専用：衝撃力270は追加能力の最大効果を意識した公開値目安。心象映画の耐性低下・ブレイク倍率・追加ダメージは戦闘中効果として扱う。",
  },
  "レミエール": {
    headline: "異常3名編成の昇華・耀変を支えるため、攻撃力4,000と異常マスタリーを個別に優先する。",
    relicSet: "契る翼の運命 ×4 / ケイオス・ジャズ ×2",
    planarSet: "代替：契る翼の運命 ×4 / フリーダム・ブルース ×2",
    mainStats: [{ slot: "IV", value: "異常マスタリー" }, { slot: "V", value: "攻撃力%" }, { slot: "VI", value: "攻撃力%" }],
    targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 4200, "目標": 4000, "妥協": 3600 } }, { key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 500, "目標": 430, "妥協": 360 } }],
    targetContext: "レミエール専用：攻撃力4,000はコアパッシブ上限を意識した公開値目安。心象映画・相転時流・音動機の条件付き全体バフは公開値へ加算しない。",
  },
};

Object.assign(ZZZ_CHARACTER_GUIDES, {
  "セス": { headline: "固定決意の盾と異常支援を安定させるため、公開値の攻撃力2,900・異常掌握250・エネルギー自動回復1.56を優先する。", relicSet: "プロト・パンク ×4 / フリーダム・ブルース ×4", planarSet: "攻撃力%・攻撃力%・異常掌握またはエネルギー自動回復", mainStats: [{ slot: "IV", value: "攻撃力%" }, { slot: "V", value: "攻撃力%" }, { slot: "VI", value: "異常掌握 / エネルギー自動回復" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3200, "目標": 2900, "妥協": 2600 } }, { key: "anomalyMastery", label: "異常掌握", unit: "", targets: { "厳選": 300, "目標": 250, "妥協": 200 } }, { key: "energyRegen", label: "エネルギー自動回復", unit: "", targets: { "厳選": 1.6, "目標": 1.56, "妥協": 1.5 } }, { key: "hp", label: "HP", unit: "", targets: { "厳選": 12000, "目標": 11000, "妥協": 10000 } }], targetContext: "セス専用：固定決意の盾は初期攻撃力を参照し戦闘中の攻撃力バフを反映しない。盾所持中の異常掌握+100、追加能力の蓄積耐性低下、音動機・ディスク・M1〜M6の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
  "パイパー": { headline: "物理異常・混沌の起点として、公開値の異常掌握400・攻撃力2,600・異常マスタリー150を優先する。", relicSet: "牙重金属 ×4 / フリーダム・ブルース ×4", planarSet: "異常マスタリー・物理属性ダメージ／貫通率・異常掌握", mainStats: [{ slot: "IV", value: "異常マスタリー" }, { slot: "V", value: "物理属性ダメージ / 貫通率" }, { slot: "VI", value: "異常掌握" }], targets: [{ key: "anomalyProficiency", label: "異常掌握", unit: "", targets: { "厳選": 450, "目標": 400, "妥協": 350 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2800, "目標": 2600, "妥協": 2500 } }, { key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 180, "目標": 150, "妥協": 130 } }, { key: "penRatio", label: "貫通率", unit: "%", targets: { "厳選": 30, "目標": 20, "妥協": 10 } }], targetContext: "パイパー専用：咆哮の乗車・パワー層・異常／強撃／混沌、音動機・ディスク・支援由来の異常掌握・攻撃力・与ダメージは戦闘中効果として公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
  "蒼角": { headline: "氷主力への旗揚げバフを最大化するため、公開値の攻撃力2,500・エネルギー自動回復1.56を優先する。", relicSet: "月夜の子守歌 ×4 / フリーダム・ブルース ×4", planarSet: "攻撃力%・攻撃力%・エネルギー自動回復または攻撃力%", mainStats: [{ slot: "IV", value: "攻撃力%" }, { slot: "V", value: "攻撃力%" }, { slot: "VI", value: "エネルギー自動回復 / 攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2800, "目標": 2500, "妥協": 2300 } }, { key: "energyRegen", label: "エネルギー自動回復", unit: "", targets: { "厳選": 1.6, "目標": 1.56, "妥協": 1.5 } }, { key: "hp", label: "HP", unit: "", targets: { "厳選": 11000, "目標": 10000, "妥協": 9000 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 60, "目標": 50, "妥協": 30 } }], targetContext: "蒼角専用：旗揚げ・渦流3層による固定攻撃力と氷ダメージ+20%、M4の氷耐性低下、必殺技後の会心率+15%、音動機・ディスクの戦闘中効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
});

Object.assign(ZZZ_CHARACTER_GUIDES, {
  "グレース": { headline: "感電・混沌を安定させるため、公開値の異常掌握400・異常マスタリー160・攻撃力2,500を優先する。", relicSet: "フリーダム・ブルース ×4 / ケイオス・ジャズ ×4", planarSet: "異常マスタリー・電気属性ダメージまたは貫通率・異常掌握", mainStats: [{ slot: "IV", value: "異常マスタリー" }, { slot: "V", value: "電気属性ダメージ / 貫通率" }, { slot: "VI", value: "異常掌握" }], targets: [{ key: "anomalyProficiency", label: "異常掌握", unit: "", targets: { "厳選": 450, "目標": 400, "妥協": 350 } }, { key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 190, "目標": 160, "妥協": 150 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2800, "目標": 2500, "妥協": 2300 } }, { key: "penRatio", label: "貫通率", unit: "%", targets: { "厳選": 24, "目標": 15, "妥協": 0 } }], targetContext: "グレース専用：Zap、追加能力の次の感電ダメージ、PulseのAbloom、音動機・リナ等の編成による異常掌握・貫通率は戦闘中・条件付きのため公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
  "バーニス": { headline: "控えからの燃焼・Afterburnを支えるため、公開値の異常掌握375・異常マスタリー160・攻撃力2,700を優先する。", relicSet: "ケイオス・ジャズ ×4 / インフェルノ・メタル ×2", planarSet: "異常掌握・炎属性ダメージまたは貫通率・異常マスタリー", mainStats: [{ slot: "IV", value: "異常掌握" }, { slot: "V", value: "炎属性ダメージ / 貫通率" }, { slot: "VI", value: "異常マスタリー" }], targets: [{ key: "anomalyProficiency", label: "異常掌握", unit: "", targets: { "厳選": 400, "目標": 375, "妥協": 350 } }, { key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 190, "目標": 160, "妥協": 150 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2700, "妥協": 2500 } }, { key: "penRatio", label: "貫通率", unit: "%", targets: { "厳選": 24, "目標": 15, "妥協": 0 } }], targetContext: "バーニス専用：初期エネルギー自動回復による潜在能力、ニトロ燃料カクテル、Afterburn、追加能力の炎異常蓄積、M2の貫通率は戦闘中・条件付きのため公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
  "ルーシー": { headline: "Cheer On!の支援上限を実用的に満たすため、公開値の攻撃力2,000・エネルギー自動回復1.56を優先する。", relicSet: "月夜の子守歌 ×4 / アストラル・ボイス ×4", planarSet: "攻撃力%・攻撃力%・エネルギー自動回復または攻撃力%", mainStats: [{ slot: "IV", value: "攻撃力% / 会心率" }, { slot: "V", value: "攻撃力%" }, { slot: "VI", value: "エネルギー自動回復 / 攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2400, "目標": 2000, "妥協": 1800 } }, { key: "energyRegen", label: "エネルギー自動回復", unit: "", targets: { "厳選": 1.8, "目標": 1.56, "妥協": 1.4 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 60, "目標": 45, "妥協": 30 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 120, "目標": 100, "妥協": 80 } }], targetContext: "ルーシー専用：Cheer On!の戦闘中攻撃力（最大600）、Quick Assist、Guard Boarの継承、M4の会心ダメージ、音動機・ディスク・編成バフは公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
});

Object.assign(ZZZ_CHARACTER_GUIDES, {
  "シーザー": { headline: "防護・ブレイク支援を安定させるため、公開値の衝撃力145〜170を最優先に、HP・防御力を確保する。", relicSet: "プロト・パンク ×4 / ショックスター・ディスコ ×4", planarSet: "会心率・物理属性ダメージまたは貫通率・衝撃力", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "物理属性ダメージ / 貫通率" }, { slot: "VI", value: "衝撃力" }], targets: [{ key: "impact", label: "衝撃力", unit: "", targets: { "厳選": 170, "目標": 145, "妥協": 145 } }, { key: "hp", label: "HP", unit: "", targets: { "厳選": 14000, "目標": 12000, "妥協": 11000 } }, { key: "defense", label: "防御力", unit: "", targets: { "厳選": 1200, "目標": 1000, "妥協": 900 } }], targetContext: "シーザー専用：攻撃力1,400〜2,000、異常掌握250〜330、または会心型は任意の副軸として扱う。輝きの盾中の攻撃力・敵被ダメージ増加・パーフェクトブロック中の衝撃力、M1〜M6の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
  "リナ": { headline: "感電支援と貫通率バフを最大化するため、公開値の貫通率38〜72%を優先する。", relicSet: "アストラル・ボイス ×4 / スイング・ジャズ ×4", planarSet: "異常掌握・貫通率・異常掌握またはエネルギー自動回復", mainStats: [{ slot: "IV", value: "異常掌握" }, { slot: "V", value: "貫通率" }, { slot: "VI", value: "異常掌握 / エネルギー自動回復" }], targets: [{ key: "penRatio", label: "貫通率", unit: "%", targets: { "厳選": 72, "目標": 38, "妥協": 38 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2600, "目標": 2000, "妥協": 1800 } }, { key: "anomalyProficiency", label: "異常掌握", unit: "", targets: { "厳選": 300, "目標": 200, "妥協": 150 } }], targetContext: "リナ専用：貫通率72%はコアスキル6でチーム貫通率バフ上限に届く目安。人形展開中の貫通率・攻撃力・防御力、感電時の雷ダメージ、M1〜M6の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
  "青衣": { headline: "ブレイク倍率を支えるため、公開値の衝撃力169〜193を最優先に、必要に応じて攻撃力を補う。", relicSet: "ショックスター・ディスコ ×4 / ウッドペッカー・エレクトロ ×4", planarSet: "会心率または会心ダメージ・電気属性ダメージまたは貫通率・衝撃力", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "電気属性ダメージ / 貫通率" }, { slot: "VI", value: "衝撃力" }], targets: [{ key: "impact", label: "衝撃力", unit: "", targets: { "厳選": 193, "目標": 169, "妥協": 169 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2000, "目標": 1800, "妥協": 1600 } }], targetContext: "青衣専用：衝撃力120超過分の追加能力による戦闘中攻撃力、畏服のブレイク弱体倍率、電圧によるダメージ・ブレイク増加、M1〜M6の条件付き会心・耐性効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
});

Object.assign(ZZZ_CHARACTER_GUIDES, {
  "「11号」": { headline: "炎通常攻撃の火力を支えるため、公開値の会心率80%・会心ダメージ140%を優先する。", relicSet: "Dawn's Bloom ×4 / Woodpecker Electro ×4", planarSet: "会心率または会心ダメージ・炎属性ダメージまたは攻撃力%・攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "炎属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 100, "目標": 80, "妥協": 65 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 160, "目標": 140, "妥協": 120 } }], targetContext: "「11号」専用：炎抑制・コアパッシブ・追加能力・心象映画・音動機・ディスクによる戦闘中ダメージ/耐性/会心/攻撃力効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwen・Icy Veinsの更新日付き個別エージェントガイドを照合" },
  "「シード」": { headline: "ヴァンガードと組む電気主力の火力を支えるため、公開値の攻撃力2,700・会心率75%・会心ダメージ110%を優先する。", relicSet: "Dawn's Bloom ×4 / Woodpecker Electro ×2・Branch & Blade Song ×2", planarSet: "会心率または会心ダメージ・電気属性ダメージまたは攻撃力%・攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "電気属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2700, "妥協": 2500 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 90, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 140, "目標": 110, "妥協": 100 } }], targetContext: "「シード」専用：ヴァンガードの攻撃力・会心ダメージ・与ダメージ支援、Onslaught/Direct Strike/Besiege、心象映画の防御無視・会心、音動機・ディスク効果は戦闘中または条件付きのため公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Prydwen・Icy Veinsの更新日付き個別エージェントガイドを照合" },
  "「トリガー」": { headline: "Aftershockのブレイク支援を最大化するため、公開値の会心率90%以上を最優先にする。", relicSet: "Shadow Harmony ×4 / Woodpecker Electro ×2", planarSet: "会心率・電気属性ダメージ・衝撃力", mainStats: [{ slot: "IV", value: "会心率" }, { slot: "V", value: "電気属性ダメージ" }, { slot: "VI", value: "衝撃力" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 100, "目標": 90, "妥協": 80 } }], targetContext: "「トリガー」専用：Aftershockのブレイク倍率、追加能力の会心率比例ブレイク、M1/M2/M4/M6、音動機の敵防御低下・衝撃力、隊員の会心支援は戦闘中または条件付きのため公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwen・Icy Veinsの更新日付き個別エージェントガイドを照合" },
});

Object.assign(ZZZ_CHARACTER_GUIDES, {
  "0号・アンビー": { headline: "Aftershock主体の電気火力を支えるため、公開値の攻撃力2,800・会心率58%・会心ダメージ160%を優先する。", relicSet: "シャドウハーモニー ×4 / ウッドペッカー・エレクトロ ×2", planarSet: "会心率または会心ダメージ・電気属性ダメージまたは攻撃力%・攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "電気属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 78, "目標": 58, "妥協": 50 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 200, "目標": 160, "妥協": 140 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3200, "目標": 2800, "妥協": 2600 } }], targetContext: "0号・アンビー専用：追加能力・コアパッシブ発動後の会心率、白雷/銀星、Aftershock、敵耐性低下、支援バフ、心象映画は公開プロフィールへ加算しない。基礎アンビーとは別の実装 zzz:1381 として扱う。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwen・Icy Veinsの更新日付き個別エージェントガイドを照合" },
  "アリア": { headline: "エーテル異常とAbloomを支えるため、公開値の攻撃力2,600・異常マスタリー184・異常掌握330を優先する。", relicSet: "シャイニング・アリア ×4 / パエトーンのメロディ ×2", planarSet: "異常熟知・エーテル属性ダメージ・異常マスタリー", mainStats: [{ slot: "IV", value: "異常掌握" }, { slot: "V", value: "エーテル属性ダメージ" }, { slot: "VI", value: "異常マスタリー" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2900, "目標": 2600, "妥協": 2400 } }, { key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 244, "目標": 184, "妥協": 160 } }, { key: "anomalyProficiency", label: "異常掌握", unit: "", targets: { "厳選": 420, "目標": 330, "妥協": 300 } }], targetContext: "アリア専用：コアパッシブ、気絶、エーテルベール、Abloom、味方支援、敵防御無視、心象映画による異常・攻撃力・与ダメージは戦闘中または条件付きのため公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwen・Icy Veinsの更新日付き個別エージェントガイドを照合" },
  "アリス": { headline: "物理異常と極性強襲を支えるため、公開値の攻撃力2,600・異常マスタリー140を優先する。", relicSet: "獣牙のヘヴィメタル ×4 / パエトーンのメロディ ×2", planarSet: "異常掌握・貫通率または物理属性ダメージ・異常マスタリー", mainStats: [{ slot: "IV", value: "異常掌握" }, { slot: "V", value: "貫通率 / 物理属性ダメージ" }, { slot: "VI", value: "異常マスタリー" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2900, "目標": 2600, "妥協": 2400 } }, { key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 160, "目標": 140, "妥協": 130 } }], targetContext: "アリス専用：異常マスタリー140超過分の異常熟知変換、強襲・極性強襲・混沌、ブレードエチケット、味方バフ、敵防御/耐性低下、心象映画は戦闘中または条件付きのため公開プロフィールへ加算しない。異常熟知は固定数値根拠がないため比較対象にしない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwen・Icy Veinsの更新日付き個別エージェントガイドを照合" },
});

Object.assign(ZZZ_CHARACTER_GUIDES, {
  "アンドー": { headline: "感電・バーストモードの会心火力を安定させるため、公開値の攻撃力2,400・会心率70%・会心ダメージ130%を優先する。", relicSet: "霹靂のヘヴィメタル ×4 / ウッドペッカー・エレクトロ ×2", planarSet: "会心率または会心ダメージ・電気属性ダメージまたは攻撃力%・攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "電気属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2700, "目標": 2400, "妥協": 2200 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 160, "目標": 130, "妥協": 110 } }], targetContext: "アンドー専用：バーストモード、感電、ブレイク、リナ・青衣などの支援、音動機・ディスク・M1〜M6の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-19", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwen・Icy Veinsの更新日付き個別エージェントガイドを照合" },
  "アンビー": { headline: "ブレイク支援を安定させるため、公開値の衝撃力189を最優先にし、会心・攻撃力は補助として扱う。", relicSet: "ショックスター・ディスコ ×4 / 霹靂のヘヴィメタル ×2", planarSet: "会心率または会心ダメージ・電気属性ダメージまたは攻撃力%・衝撃力", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "電気属性ダメージ / 攻撃力%" }, { slot: "VI", value: "衝撃力" }], targets: [{ key: "impact", label: "衝撃力", unit: "", targets: { "厳選": 189, "目標": 189, "妥協": 160 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 65, "目標": 50, "妥協": 40 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 130, "目標": 100, "妥協": 80 } }], targetContext: "アンビー専用：基礎実装 zzz:1011 のみへ適用する。0号・アンビー（zzz:1381）とは効果・装備・目標を共有しない。連携・終結・追加能力・音動機・ディスク・M1〜M6の電気追加ダメージ、ブレイク、エネルギー回復は戦闘中または条件付きであり公開プロフィールへ加算しない。", dataAsOf: "2026-06-05", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
  "イヴリン": { headline: "連携スキル主体の炎火力を安定させるため、公開値の会心率80%・会心ダメージ160%・攻撃力2,500を優先する。", relicSet: "ホルモン・パンク ×4 / 折枝の刀歌 ×2", planarSet: "会心率または会心ダメージ・炎属性ダメージまたは攻撃力%・攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "炎属性ダメージ / 攻撃力% / 貫通率" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 90, "目標": 80, "妥協": 70 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 180, "目標": 160, "妥協": 140 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2500, "妥協": 2300 } }], targetContext: "イヴリン専用：コアスキルによる戦闘中会心率+25%、ブレイク、クイック支援、音動機・ディスク・M1〜M6の防御無視・会心ダメージ・追撃は公開プロフィールへ加算しない。モチーフ装備時の攻撃力3,000／会心ダメージ150%は別到達帯として注記する。", dataAsOf: "2026-08-19", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
});

Object.assign(ZZZ_CHARACTER_GUIDES, {
  "イドリー": { headline: "HPを消費するカウンター火力を支えるため、公開値では会心率68%まで・会心ダメージ130%以上・HP21,000以上を優先する。", relicSet: "雲嶽は我に似たり ×4 / ウッドペッカー・エレクトロ ×2・折枝の刀歌 ×2", planarSet: "会心率または会心ダメージ・HP%または氷属性ダメージ・HP%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "HP% / 氷属性ダメージ" }, { slot: "VI", value: "HP%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 68, "目標": 65, "妥協": 55 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 150, "目標": 130, "妥協": 120 } }, { key: "hp", label: "HP", unit: "", targets: { "厳選": 23000, "目標": 21000, "妥協": 18000 } }], targetContext: "イドリー専用：HP50%以下、雲嶽4セット・音動機の条件付き会心、透徹ダメージ、カウンター、アドレナリン、支援・ブレイク・心象映画は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8の更新日付き個別エージェントガイドを照合" },
  "ヴェリナ": { headline: "風異常の蓄積とダメージを支えるため、公開値ではエネルギー自動回復2.88を最優先に、異常マスタリーを補助評価する。", relicSet: "風鳴りのサロン ×4 / 月光騎士の讃歌 ×2", planarSet: "異常マスタリー・風属性ダメージまたは攻撃力%・エネルギー自動回復", mainStats: [{ slot: "IV", value: "異常マスタリー" }, { slot: "V", value: "風属性ダメージ / 攻撃力%" }, { slot: "VI", value: "エネルギー自動回復" }], targets: [{ key: "energyRegen", label: "エネルギー自動回復", unit: "", targets: { "厳選": 2.88, "目標": 2.4, "妥協": 2.0 } }], targetContext: "ヴェリナ専用：初期エネルギー自動回復1.2超過分によるコアパッシブ、状態異常、渦、風咬み、音動機・ディスク・隊員・心象映画の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-19", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
  "オルペウス&「鬼火」": { headline: "炎追加攻撃と味方支援を安定させるため、公開値では攻撃力2,500・会心率35%・会心ダメージ140%を優先する。", relicSet: "シャドウハーモニー ×4 / スイング・ジャズ ×2", planarSet: "会心率または会心ダメージ・炎属性ダメージまたは攻撃力%・攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "炎属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2500, "目標": 2400, "妥協": 2000 } }, { key: "critRate", label: "会心率（公開値）", unit: "%", targets: { "厳選": 40, "目標": 35, "妥協": 30 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 160, "目標": 140, "妥協": 120 } }], targetContext: "オルペウス&「鬼火」専用：コア、シャドウハーモニー4セット、モチーフ音動機、フォーカス、追加攻撃、心象映画による会心・攻撃力・与ダメージ・耐性無視は戦闘中または条件付きであり公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
  "カリン": { headline: "物理強攻として、公開値の攻撃力2,400〜3,000・会心率70〜80%・会心ダメージ140〜160%を整える。", relicSet: "ウッドペッカー・エレクトロ ×4 / パファー・エレクトロ ×2", planarSet: "会心率・物理ダメージまたは攻撃力%・攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "物理ダメージ / 攻撃力% / 貫通率" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2700, "妥協": 2400 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 75, "妥協": 70 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 160, "目標": 150, "妥協": 140 } }], targetContext: "カリン専用：持続斬撃、ブレイク、追加能力、音動機・ディスク・心象映画による物理耐性・与ダメージ・エネルギー・追加ダメージは戦闘中または条件付きであり公開プロフィールへ加算しない。", dataAsOf: "2026-08-19", updatedAt: "2026-08-27", sourceLabel: "Game8・Prydwen・GameWithの更新日付き個別エージェントガイドを照合" },
  "クレタ": { headline: "炎撃破として、公開値の衝撃力190を優先し、サブ火力の攻撃力2,500・会心率50%・会心ダメージ100%を整える。", relicSet: "ショックスター・ディスコ ×4 / 炎獄のヘヴィメタル ×2", planarSet: "会心率または会心ダメージ・炎属性ダメージまたは攻撃力%・衝撃力", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "炎属性ダメージ / 攻撃力%" }, { slot: "VI", value: "衝撃力" }], targets: [{ key: "impact", label: "衝撃力", unit: "", targets: { "厳選": 190, "目標": 190, "妥協": 180 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2500, "目標": 2300, "妥協": 2000 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 50, "目標": 50, "妥協": 30 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 100, "目標": 100, "妥協": 60 } }], targetContext: "クレタ専用：ベン併用、ブレイク、追加能力、燃獄ギア等の強化特殊後の衝撃力、ディスク・心象映画による条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-07-31", updatedAt: "2026-08-27", sourceLabel: "Game8・Prydwen・GameWithの更新日付き個別エージェントガイドを照合" },
  "シーシィア": { headline: "電気強攻として、モチーフ運用の公開値の攻撃力1,651・会心率57.8%・会心ダメージ122%を目安にする。", relicSet: "暁に咲く花 ×4 / スイング・ジャズ ×2", planarSet: "会心率または会心ダメージ・電気属性ダメージまたは攻撃力%・攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "電気属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 1800, "目標": 1651, "妥協": 1500 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 65, "目標": 57.8, "妥協": 50 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 140, "目標": 122, "妥協": 110 } }], targetContext: "シーシィア専用：毒素、骨蝕み、防御無視、電気耐性無視、ブレイク、音動機・ディスク・心象映画の戦闘中補正は公開プロフィールへ加算しない。実ソースID未確認のため、心象映画は安全に準備中として扱う。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "GameWithの更新日付き個別エージェントガイドを照合（ID未確認の心象映画は保留）" },
  "シグリッド": { headline: "氷強攻として、公開値の攻撃力2,958・会心率33.8%・会心ダメージ194%を目安に会心ダメージ・攻撃力・貫通を優先する。", relicSet: "極地のヘヴィメタル ×4 / パファー・エレクトロ ×2", planarSet: "会心ダメージ・攻撃力%または貫通率または氷属性ダメージ・攻撃力%", mainStats: [{ slot: "IV", value: "会心ダメージ" }, { slot: "V", value: "攻撃力% / 貫通率 / 氷属性ダメージ" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3200, "目標": 2958, "妥協": 2600 } }, { key: "critRate", label: "会心率（公開値）", unit: "%", targets: { "厳選": 40, "目標": 33.8, "妥協": 25 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 210, "目標": 194, "妥協": 160 } }], targetContext: "シグリッド専用：コアパッシブ等の「不落の構え」会心率+66%、ブレイク、追加能力、音動機・ディスク・心象映画による戦闘中補正は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-27", sourceLabel: "GameWith・Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
  "スターライト･ビリー": { headline: "物理命破として、モチーフ運用の公開値のHP19,194・会心率67.4%・会心ダメージ98%を目安にする。", relicSet: "雲嶽は我に似たり ×4 / 獣牙のヘヴィメタル ×2", planarSet: "会心率または会心ダメージ・物理ダメージまたはHP%・HP%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "物理ダメージ / HP%" }, { slot: "VI", value: "HP%" }], targets: [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 21000, "目標": 19194, "妥協": 17000 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 75, "目標": 67.4, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 120, "目標": 98, "妥協": 80 } }], targetContext: "スターライト･ビリー専用：基礎ビリーとは別実装。HP消費、透徹力、決意、アドレナリン、追加能力、音動機・ディスク・心象映画の戦闘中補正は公開プロフィールへ加算しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "GameWith・Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
  "ダイアリン": { headline: "物理撃破として、モチーフ運用の公開値の攻撃力1,988・会心率99.4%・会心ダメージ117.2%を目安にする。", relicSet: "大山を統べる者 ×4 / ウッドペッカー・エレクトロ ×2", planarSet: "会心率・攻撃力%または物理ダメージ・エネルギー自動回復または衝撃力", mainStats: [{ slot: "IV", value: "会心率" }, { slot: "V", value: "攻撃力% / 物理ダメージ" }, { slot: "VI", value: "エネルギー自動回復 / 衝撃力" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2200, "目標": 1988, "妥協": 1800 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 100, "目標": 99.4, "妥協": 80 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 140, "目標": 117.2, "妥協": 100 } }], targetContext: "ダイアリン専用：終結変換、ブレイク弱体倍率、追加能力、音動機・ディスク・心象映画の攻撃力・耐性無視・追加ダメージ等の戦闘中補正は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-27", sourceLabel: "GameWith・Game8・Prydwenの更新日付き個別エージェントガイドを照合" },
});

Object.assign(ZZZ_CHARACTER_GUIDES, {
  "ニコ": { headline: "集敵と防御デバフを担うエーテル支援として、公開値ではエネルギー自動回復3.20を優先し、モチーフ時は3.58を目安にする。", relicSet: "静寂のアストラ ×4 / 月光騎士の讃歌 ×4 / フリーダム・ブルース ×4", planarSet: "異常マスタリーまたは攻撃力%・エーテル属性ダメージまたは貫通率・エネルギー自動回復", mainStats: [{ slot: "IV", value: "異常マスタリー / 攻撃力%" }, { slot: "V", value: "エーテル属性ダメージ / 貫通率" }, { slot: "VI", value: "エネルギー自動回復" }], targets: [{ key: "energyRegen", label: "エネルギー自動回復（モチーフなし）", unit: "", targets: { "厳選": 3.58, "目標": 3.2, "妥協": 3 } }], targetContext: "ニコ専用：力場、防御デバフ、ディスク・音動機・心象映画・追加能力の戦闘中効果は公開プロフィールへ加算しない。モチーフ音動機使用時の目安3.58は装備による値であり、比較時に現在値へ自動加算しない。", dataAsOf: "2026-08-19", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別エージェントガイドを照合" },
  "ノルムー": { headline: "連携スキル誘発を支える炎撃破として、公開値では会心率76%以上を優先し、モチーフ運用では100%を別目安にする。", relicSet: "大山を統べる者 ×4 / ウッドペッカー・エレクトロ ×2", planarSet: "会心率・炎属性ダメージまたは攻撃力%・衝撃力またはエネルギー自動回復", mainStats: [{ slot: "IV", value: "会心率" }, { slot: "V", value: "炎属性ダメージ / 攻撃力%" }, { slot: "VI", value: "衝撃力 / エネルギー自動回復" }], targets: [{ key: "critRate", label: "会心率（モチーフなし）", unit: "%", targets: { "厳選": 100, "目標": 76, "妥協": 65 } }], targetContext: "ノルムー専用：コアパッシブ、タレット、プレヒート、ブレイク、ディスク・音動機・心象映画の戦闘中または条件付き効果は公開プロフィールへ加算しない。モチーフありの会心率100%は別到達帯として扱う。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別エージェントガイドを照合" },
  "ヒューゴ": { headline: "ブレイク時の単体火力を担う氷強攻として、公開値では会心率88%・会心ダメージ125〜130%・攻撃力2,500を目標にする。", relicSet: "ウッドペッカー・エレクトロ ×2 / 折枝の刀歌 ×2 / 静寂のアストラ ×2", planarSet: "会心率または会心ダメージ・氷属性ダメージまたは攻撃力%・攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "氷属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 95, "目標": 88, "妥協": 80 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 140, "目標": 130, "妥協": 125 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2800, "目標": 2500, "妥協": 2300 } }], targetContext: "ヒューゴ専用：深淵の反響、ブレイク、累算、ディスク・音動機・心象映画の戦闘中または条件付き効果は公開プロフィールへ加算しない。A級音動機では会心ダメージ125%を代替目安とする。", dataAsOf: "2026-07-31", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別エージェントガイドを照合" },
  "ピュロイス": { headline: "終結スキル分岐を用いるエーテル強攻として、公開値では会心率72%を主目標にし、会心ダメージと攻撃力を補助評価する。", relicSet: "夜明けの紀行 ×4 / ウッドペッカー・エレクトロ ×2 / 折枝の刀歌 ×2", planarSet: "会心率または会心ダメージ・エーテル属性ダメージまたは攻撃力%・攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "エーテル属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 72, "妥協": 65 } }], targetContext: "ピュロイス専用：モチーフ・凸で得る会心率、紅焔、日蝕、終結分岐、ディスク・心象映画・編成による条件付き戦闘効果は公開プロフィールへ加算しない。未公開の心象映画M4/M6は推測で登録しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別エージェントガイドを照合（未公開心象映画は保留）" },
  "ビリー": { headline: "遠距離通常攻撃を主軸にする物理強攻として、公開値では会心率50%・会心ダメージ150%以上・攻撃力2,500を目標にする。", relicSet: "獣牙のヘヴィメタル ×4 / ウッドペッカー・エレクトロ ×2 / 折枝の刀歌 ×2", planarSet: "会心率または会心ダメージ・物理属性ダメージまたは攻撃力%・攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "物理属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 60, "目標": 50, "妥協": 40 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 130 } }, { key: "attack", label: "攻撃力（モチーフなし）", unit: "", targets: { "厳選": 3000, "目標": 2500, "妥協": 2300 } }], targetContext: "ビリー専用：しゃがみ撃ち、追加能力、強撃、音動機・ディスク・心象映画・編成の一時効果は公開プロフィールへ加算しない。モチーフ音動機時の攻撃力3,000は別到達帯とし、スターライト・ビリーとは別実装として扱う。", dataAsOf: "2026-06-05", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別エージェントガイドを照合" },
  "プルクラ": { headline: "控えから追加攻撃でブレイク値を蓄積する物理撃破として、公開値では衝撃力189を主目標にする。", relicSet: "大山を統べる者 ×4 / プロト・パンク ×4", planarSet: "会心率または会心ダメージ・物理属性ダメージまたは攻撃力%・衝撃力", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "物理属性ダメージ / 攻撃力%" }, { slot: "VI", value: "衝撃力" }], targets: [{ key: "impact", label: "衝撃力", unit: "", targets: { "厳選": 189, "目標": 189, "妥協": 168 } }], targetContext: "プルクラ専用：控え攻撃、追加攻撃、追加能力、ディスク・音動機・心象映画の条件付きブレイク・会心・攻撃力・与ダメージは公開プロフィールへ加算しない。", dataAsOf: "2026-07-31", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別エージェントガイドを照合" },
});

Object.assign(ZZZ_CHARACTER_GUIDES, {
  "プロメイア": { headline: "氷異常と狂咲を主軸にするエージェントとして、公開値の異常マスタリーと攻撃力を整える。", relicSet: "獄中の手記 ×4 / パエトーンの歌 ×2 / フリーダム・ブルース ×2", planarSet: "異常マスタリー・氷属性ダメージまたは攻撃力%・異常掌握", mainStats: [{ slot: "IV", value: "異常マスタリー" }, { slot: "V", value: "氷属性ダメージ / 攻撃力%" }, { slot: "VI", value: "異常掌握" }], targets: [{ key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 314, "目標": 314, "妥協": 314 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2623, "目標": 2623, "妥協": 2584 } }], targetContext: "プロメイア専用：狂咲・凍結・混沌、コアの異常掌握換算、追加能力、ディスク・音動機・心象映画の戦闘中または条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWith・Icy Veinsの更新日付き個別エージェントガイドを照合" },
  "ベン": { headline: "シールドとガード反撃を担う炎防護として、公開値の防御力を最優先に、モチーフ運用では会心も補助評価する。", relicSet: "支援：プロト・パンク ×4／防御・火力：ウッドペッカー・エレクトロ ×4", planarSet: "防御力%または会心ダメージ・防御力%・防御力%（支援ではエネルギー自動回復も候補）", mainStats: [{ slot: "IV", value: "防御力% / 会心ダメージ" }, { slot: "V", value: "防御力%" }, { slot: "VI", value: "防御力% / エネルギー自動回復" }], targets: [{ key: "defense", label: "防御力", unit: "", targets: { "厳選": 2000, "目標": 2000, "妥協": 2000 } }, { key: "critRate", label: "会心率（モチーフ時）", unit: "%", targets: { "厳選": 30, "目標": 30, "妥協": 30 } }, { key: "critDmg", label: "会心ダメージ（モチーフ時）", unit: "%", targets: { "厳選": 150, "目標": 150, "妥協": 150 } }], targetContext: "ベン専用：防御力→攻撃力換算、シールド、会心率付与、ディスク・音動機・心象映画の戦闘中または条件付き効果は公開プロフィールへ加算しない。会心目標はモチーフ音動機の運用時だけの補助到達帯とする。", dataAsOf: "2026-08-19", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWithの更新日付き個別エージェントガイドを照合" },
  "ライカン": { headline: "氷ブレイクと耐性低下を担う撃破として、公開値の衝撃力194を最優先に整える。", relicSet: "ショックスター・ディスコ ×4 / スイング・ジャズ ×2（単独撃破は大山を統べる者 ×4も候補）", planarSet: "会心率または会心ダメージ・氷属性ダメージまたは攻撃力%・衝撃力", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "氷属性ダメージ / 攻撃力%" }, { slot: "VI", value: "衝撃力" }], targets: [{ key: "impact", label: "衝撃力", unit: "", targets: { "厳選": 194, "目標": 194, "妥協": 190 } }], targetContext: "ライカン専用：ブレイク値、氷耐性低下、ブレイク弱体倍率、ポテンシャル解放、ディスク・音動機・心象映画の戦闘中または条件付き効果は公開プロフィールへ加算しない。A級音動機時は衝撃力190を代替目安とする。", dataAsOf: "2026-08-19", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWith・Prydwenの更新日付き個別エージェントガイドを照合" },
  "リュシア": { headline: "夢境・エーテルベール支援を担うエーテル支援として、公開値のHPを最優先に整える。", relicSet: "月光騎士の讃歌 ×4 / 雲嶽は我に似たり ×2 / スイング・ジャズ ×2", planarSet: "HP%・HP%・HP%", mainStats: [{ slot: "IV", value: "HP%" }, { slot: "V", value: "HP%" }, { slot: "VI", value: "HP%" }], targets: [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 24000, "目標": 24000, "妥協": 22000 } }], targetContext: "リュシア専用：夢境、エーテルベール、破暗、透徹力・会心ダメージ・HP上限の付与、ディスク・音動機・心象映画の戦闘中または条件付き効果は公開プロフィールへ加算しない。モチーフなしではHP22,000を代替目安とする。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWith・Prydwenの更新日付き個別エージェントガイドを照合" },
  "儀玄": { headline: "術法値と透徹攻撃を用いるエーテル命破として、公開値のHP・会心率・会心ダメージを整える。", relicSet: "雲嶽は我に似たり ×4 / 折枝の刀歌 ×2 / ウッドペッカー・エレクトロ ×2", planarSet: "会心率または会心ダメージ・HP%またはエーテル属性ダメージ・HP%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "HP% / エーテル属性ダメージ" }, { slot: "VI", value: "HP%" }], targets: [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 21000, "目標": 21000, "妥協": 21000 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 67.4, "目標": 67.4, "妥協": 67.4 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 128, "目標": 128, "妥協": 128 } }], targetContext: "儀玄専用：術法値、アドレナリン、玄墨値、透徹力、防御無視、終結後の会心ダメージ、ディスク・音動機・心象映画の戦闘中または条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWith・Prydwenの更新日付き個別エージェントガイドを照合" },
  "橘福福": { headline: "連携・終結を支援する炎撃破として、公開値の攻撃力3,400と会心率50%を整える。", relicSet: "大山を統べる者 ×4 / ホルモン・パンク ×2 / 静寂のアストラ ×2 / ショックスター・ディスコ ×2", planarSet: "会心率または攻撃力%・攻撃力%・エネルギー自動回復／衝撃力／攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 攻撃力%" }, { slot: "V", value: "攻撃力%" }, { slot: "VI", value: "エネルギー自動回復 / 衝撃力 / 攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3400, "目標": 3400, "妥協": 3400 } }, { key: "critRate", label: "会心率（大山4時の最低ライン）", unit: "%", targets: { "厳選": 50, "目標": 50, "妥協": 50 } }], targetContext: "橘福福専用：虎威、虎の咆哮、威風・威勢、衝撃力、会心ダメージ、デシベル、ディスク・音動機・心象映画の戦闘中または条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWith・Prydwenの更新日付き個別エージェントガイドを照合" },
});

Object.assign(ZZZ_CHARACTER_GUIDES, {
  "狛野真斗": { headline: "最大HPを参照する炎命破として、会心・HP・攻撃力を個別に整える。", relicSet: "ウッドペッカー・エレクトロ ×2・折枝の刀歌 ×2・雲嶽は我に似たり ×2 / 雲嶽は我に似たり ×4", planarSet: "会心率または会心ダメージ・炎属性ダメージまたはHP%・HP%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "炎属性ダメージ / HP%" }, { slot: "VI", value: "HP%" }], targets: [], targetContext: "狛野真斗専用：会心ダメージ＝会心率≧HP＞攻撃力を優先する。最大HP依存の透徹力、音動機・ディスク・心象映画の条件付き効果は公開プロフィールへ加算しない。根拠に固定数値閾値がないため推測で登録しない。", dataAsOf: "2026-06-05", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別エージェントガイドを照合" },
  "朱鳶": { headline: "強化散弾のエーテル火力を支えるため、公開値の会心・攻撃力をモチーフ有無に応じて整える。", relicSet: "混沌のヘヴィメタル ×4 / スイング・ジャズ ×2 / 折枝の刀歌 ×2", planarSet: "会心率または会心ダメージ・エーテル属性ダメージまたは攻撃力%・攻撃力%またはエネルギー自動回復", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "エーテル属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力% / エネルギー自動回復" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 40, "目標": 40, "妥協": 40 } }, { key: "critDmg", label: "会心ダメージ（モチーフなし）", unit: "%", targets: { "厳選": 175, "目標": 160, "妥協": 160 } }, { key: "attack", label: "攻撃力（モチーフなし）", unit: "", targets: { "厳選": 3500, "目標": 3000, "妥協": 3000 } }], targetContext: "朱鳶専用：会心率≧会心ダメージ＞攻撃力%＞貫通値を優先する。追加能力の会心率+30%、音動機・ディスク・心象映画の戦闘中または条件付き効果は公開プロフィールへ加算しない。モチーフ時は会心ダメージ175%・攻撃力3,500が別到達帯となる。", dataAsOf: "2026-06-05", updatedAt: "2026-08-27", sourceLabel: "Game8の更新日付き個別エージェント・PTガイドを照合" },
  "照": { headline: "HP参照のエーテル支援として、公開値のHP27,000以上を最優先に整える。", relicSet: "雪うさぎワンダーランド ×4 / 雲嶽は我に似たり ×2", planarSet: "HP%・HP%・エネルギー自動回復（モチーフ時）またはHP%", mainStats: [{ slot: "IV", value: "HP%" }, { slot: "V", value: "HP%" }, { slot: "VI", value: "エネルギー自動回復 / HP%" }], targets: [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 27000, "目標": 27000, "妥協": 24000 } }], targetContext: "照専用：HP24,000超はGame8のバフ最大化目安、27,000以上は追加能力の最大条件として扱う。エーテルベール、コア、音動機・ディスク・心象映画の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWithの更新日付き個別エージェント・PTガイドを照合" },
  "千夏": { headline: "味方を支援するエーテル支援として、公開値の開幕攻撃力3,500を優先する。", relicSet: "月光騎士の讃歌 ×4 / 静寂のアストラ ×2 / スイング・ジャズ ×2", planarSet: "攻撃力%・攻撃力%・エネルギー自動回復", mainStats: [{ slot: "IV", value: "攻撃力%" }, { slot: "V", value: "攻撃力%" }, { slot: "VI", value: "エネルギー自動回復" }], targets: [{ key: "attack", label: "攻撃力（開幕）", unit: "", targets: { "厳選": 3500, "目標": 3500, "妥協": 3500 } }], targetContext: "千夏専用：攻撃力%＞攻撃力実数を優先する。エンジェルハーモニー、エーテルベール、ねこにらみ、コア、音動機・ディスク・心象映画の戦闘中または条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWithの更新日付き個別エージェント・PTガイドを照合" },
  "浅羽悠真": { headline: "電気強攻として、公開値の会心・攻撃力をモチーフ有無に応じて整える。", relicSet: "シャドウハーモニー ×4 / 折枝の刀歌 ×2 / ホルモン・パンク ×2", planarSet: "会心率または会心ダメージ・電気属性ダメージまたは攻撃力%または貫通率・攻撃力%", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "電気属性ダメージ / 攻撃力% / 貫通率" }, { slot: "VI", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率（モチーフなし）", unit: "%", targets: { "厳選": 75, "目標": 75, "妥協": 55 } }, { key: "critDmg", label: "会心ダメージ（モチーフなし）", unit: "%", targets: { "厳選": 170, "目標": 150, "妥協": 150 } }, { key: "attack", label: "攻撃力（モチーフなし）", unit: "", targets: { "厳選": 2800, "目標": 2800, "妥協": 2500 } }], targetContext: "浅羽悠真専用：モチーフ時は会心率55%・会心ダメージ170%・攻撃力2,500が別到達帯となる。コア、音動機・ディスクの会心、状態異常・ブレイク時、心象映画の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWithの更新日付き個別エージェント・PTガイドを照合" },
  "南宮羽": { headline: "異常とブレイクを両立する撃破として、異常マスタリーと異常掌握を優先して整える。", relicSet: "パエトーンの歌 ×4 / フリーダム・ブルース ×2 / ショックスター・ディスコ ×4・パエトーンの歌 ×2", planarSet: "異常マスタリー・エーテル属性ダメージまたは攻撃力%または貫通率・異常掌握", mainStats: [{ slot: "IV", value: "異常マスタリー" }, { slot: "V", value: "エーテル属性ダメージ / 攻撃力% / 貫通率" }, { slot: "VI", value: "異常掌握" }], targets: [], targetContext: "南宮羽専用：異常マスタリー＞攻撃力を優先する。コアの異常マスタリー+120、ビート、ナイトフィーバー、音動機・ディスク・心象映画の戦闘中または条件付き効果は公開プロフィールへ加算しない。根拠に固定数値閾値がないため推測で登録しない。", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", sourceLabel: "Game8・GameWithの更新日付き個別エージェント・PTガイドを照合" },
});

function zzzGuide(name: string, profession: string): GuideDefinition {
  const characterGuide = ZZZ_CHARACTER_GUIDES[name];
  if (characterGuide) return withGuideMetadata("zzz", characterGuide, name);
  return withGuideMetadata("zzz", generatedZzzGuide(name, profession), name);
}

export function normalizeZzzPayload(payload: unknown, catalog: ZzzCatalog): NormalizedBuild {
  const root = asRecord(payload);
  const playerInfo = asRecord(root.PlayerInfo);
  const social = asRecord(playerInfo.SocialDetail);
  const profile = asRecord(social.ProfileDetail);
  const showcase = asRecord(playerInfo.ShowcaseDetail);
  const characters = asArray(showcase.AvatarList).map(asRecord).map((avatar): CharacterProfile => {
    const id = text(avatar.Id);
    const metadata = asRecord(catalog.avatars[id]);
    const elements = asArray(metadata.ElementTypes).map((value) => text(value)).map((key) => ZZZ_ELEMENTS[key]).filter(Boolean);
    const profession = text(metadata.ProfessionType);
    const identity = resolveCharacterIdentity("zzz", id, zzzName(catalog, metadata.Name, ""));
    const name = identity.displayName;
    const aggregate: Record<string, number> = {};
    const equipmentByProperty: Record<string, number> = {};
    const suitCounts: Record<string, number> = {};
    const items = asRecord(catalog.equipments.Items);
    const suits = asRecord(catalog.equipments.Suits ?? catalog.equipments.Suit);
    const relics = asArray(avatar.EquippedList).map(asRecord).map((entry, index) => {
      const equipment = asRecord(entry.Equipment);
      const equipmentId = text(equipment.Id);
      const itemMeta = asRecord(items[equipmentId]);
      const suitId = text(itemMeta.SuitId);
      const suit = asRecord(suits[suitId]);
      if (suitId) suitCounts[suitId] = (suitCounts[suitId] ?? 0) + 1;
      const rarity = number(itemMeta.Rarity, 4);
      const scale = ({ 2: 0.3, 3: 0.25, 4: 0.2 } as Record<number, number>)[rarity] ?? 0.2;
      const level = number(equipment.Level);
      const mainStats = asArray(equipment.MainPropertyList).map(asRecord).map((stat) => zzzStat(catalog, stat, 1 + level * scale));
      const subs = asArray(equipment.RandomPropertyList).map(asRecord).map((stat) => zzzStat(catalog, stat, Math.max(1, number(stat.PropertyLevel, 1))));
      [...mainStats, ...subs].forEach((stat) => {
        aggregate[stat.name] = (aggregate[stat.name] ?? 0) + stat.value;
        addProperty(equipmentByProperty, stat.id, stat.value);
      });
      const setName = zzzName(catalog, suit.Name ?? `EquipmentSuit_${suitId}_name`, "ドライバディスクセット");
      const slot = text(entry.Slot, String(index + 1));
      return { id: text(equipment.Uid, `${id}-disc-${index}`), name: `ドライバディスク ${slot}`, slot, setName, level, icon: null, main: mainStats[0] ? { name: mainStats[0].name, display: mainStats[0].display } : null, subs: subs.map((stat) => ({ name: stat.name, display: stat.display })) };
    });
    Object.entries(suitCounts).filter(([, count]) => count >= 2).forEach(([suitId]) => {
      const bonusProps = asRecord(asRecord(suits[suitId]).SetBonusProps);
      Object.entries(bonusProps).forEach(([propertyId, rawValue]) => addProperty(equipmentByProperty, propertyId, zzzPropertyValue(catalog, propertyId, number(rawValue))));
    });
    const guide = zzzGuide(name, profession);
    const rawWeapon = asRecord(avatar.Weapon);
    const weaponId = text(rawWeapon.Id ?? metadata.WeaponId);
    const weaponMeta = asRecord(catalog.weapons[weaponId]);
    const finalStats = finalZzzStats(catalog, zzzAgentBaseStats(catalog, metadata, avatar), zzzWeaponStats(catalog, weaponMeta, rawWeapon), equipmentByProperty);
    const comparisons = comparisonsFromStats(guide.targets, finalStats.values);
    const recommendations = priorityRecommendations(comparisons);
    return {
      id: identity.sourceId, identity, name, level: number(avatar.Level, null as unknown as number), rank: number(avatar.TalentLevel, null as unknown as number), portrait: iconUrl(text(metadata.Image)) ?? null,
      element: elements.map((element) => element?.label).filter(Boolean).join(" / ") || "属性", elementColor: elements[0]?.color ?? "#c28a42", path: (ZZZ_PROFESSIONS[profession] ?? profession) || "役割",
      lightCone: weaponId ? { name: zzzName(catalog, weaponMeta.ItemName, "音動機"), level: number(rawWeapon.Level, null as unknown as number), rank: number(rawWeapon.BreakLevel, null as unknown as number), icon: iconUrl(text(weaponMeta.ImagePath)) ?? null } : null,
      relics, allStats: finalStats.display, statsNote: "エージェント・音動機・コア強化・ドライバディスクを合算した戦闘外の推定最終値です。戦闘中・条件付き効果は含みません。", guide, comparisons, recommendations, equipmentActions: equipmentActionsFor(guide, relics, recommendations), partyRecommendations: partyRecommendationsFor("zzz", name), constellations: constellationProfileFor(identity, number(avatar.TalentLevel, null as unknown as number)),
    };
  });
  return { player: { uid: text(root.uid, text(profile.Uid)), name: text(profile.Nickname, "プロキシ"), level: number(profile.Level, null as unknown as number) }, characters };
}

const genshinCache = new UidResponseCache<NormalizedBuild>();
const zzzCache = new UidResponseCache<NormalizedBuild>();
const genshinInFlight = new Map<string, Promise<BuildLookupResult>>();
const zzzInFlight = new Map<string, Promise<BuildLookupResult>>();

async function lookupWithCache(uid: string, cache: UidResponseCache<NormalizedBuild>, inFlight: Map<string, Promise<BuildLookupResult>>, loader: () => Promise<unknown>, normalize: (payload: unknown) => Promise<NormalizedBuild>): Promise<BuildLookupResult> {
  const cached = cache.getEntry(uid);
  if (cached) {
    const now = new Date();
    return { ...cached.value, cached: true, fetchedAt: now.toISOString(), cacheExpiresAt: new Date(cached.expiresAt).toISOString() };
  }
  const pending = inFlight.get(uid);
  if (pending) return pending;
  const request = loader().then(async (payload) => {
    const normalized = await normalize(payload);
    if (!normalized.characters.length) throw new TRPCError({ code: "NOT_FOUND", message: "公開中のキャラクターが見つかりません。ゲーム内のプロフィール公開設定をご確認ください。" });
    const expiresAt = cache.set(uid, normalized, ttlFromPayload(payload));
    return { ...normalized, cached: false, fetchedAt: new Date().toISOString(), cacheExpiresAt: new Date(expiresAt).toISOString() };
  }).finally(() => inFlight.delete(uid));
  inFlight.set(uid, request);
  return request;
}

async function lookupGenshin(uid: string) {
  return lookupWithCache(uid, genshinCache, genshinInFlight, () => fetchJson(`${ENKA_ORIGIN}/api/uid/${encodeURIComponent(uid)}/`), async (payload) => normalizeGenshinPayload(payload, await getGenshinCatalog()));
}

async function lookupZzz(uid: string) {
  return lookupWithCache(uid, zzzCache, zzzInFlight, () => fetchJson(`${ENKA_ORIGIN}/api/zzz/uid/${encodeURIComponent(uid)}/`), async (payload) => normalizeZzzPayload(payload, await getZzzCatalog()));
}

export async function lookupGameBuild(game: GameId, uid: string) {
  if (game === "hsr") return lookupUidBuild(uid);
  if (game === "genshin") return lookupGenshin(uid);
  return lookupZzz(uid);
}
