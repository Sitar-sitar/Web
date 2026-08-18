import { TRPCError } from "@trpc/server";
import {
  BuildLookupResult,
  CharacterProfile,
  GuideDefinition,
  StatComparison,
  TargetStatDefinition,
  UidResponseCache,
  lookupUidBuild,
  withGuideMetadata,
} from "./buildAdvisor";
import { generatedGenshinGuide, generatedZzzGuide } from "./individualGuides";

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
  "ナヒーダ": { headline: "元素熟知を土台に、反応火力と元素スキルの循環を整える。", relicSet: "深林の記憶 / 金メッキの夢", planarSet: "元素熟知・会心を役割に応じて調整", mainStats: [{ slot: "時計", value: "元素熟知" }, { slot: "杯", value: "元素熟知 / 草元素ダメージ" }, { slot: "冠", value: "元素熟知 / 会心" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 900, "目標": 750, "妥協": 600 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 65, "目標": 55, "妥協": 45 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 140, "目標": 110, "妥協": 90 } }] },
  "楓原万葉": { headline: "元素熟知と元素チャージ効率を優先し、拡散支援を安定させる。", relicSet: "翠緑の影 ×4", planarSet: "元素熟知・元素チャージ効率を優先", mainStats: [{ slot: "時計", value: "元素熟知" }, { slot: "杯", value: "元素熟知" }, { slot: "冠", value: "元素熟知" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 1000, "目標": 850, "妥協": 700 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 180, "目標": 160, "妥協": 140 } }] },
};

Object.assign(GI_GUIDE_OVERRIDES, {
  "神里綾華": giGuide("氷風4セットと氷共鳴による戦闘中会心率を前提に、会心ダメージと元素爆発の循環を優先する。", "氷風を彷徨う勇士 ×4", [{ slot: "時計", value: "攻撃力%" }, { slot: "杯", value: "氷元素ダメージ" }, { slot: "冠", value: "会心ダメージ" }], [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 55, "目標": 45, "妥協": 35 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 280, "目標": 240, "妥協": 210 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 150, "目標": 130, "妥協": 115 } }], "氷風4セット・氷共鳴の戦闘中会心率を別途加味"),
  "雷電将軍": giGuide("元素爆発の回転とダメージを両立するため、元素チャージ効率を最優先に会心を整える。", "絶縁の旗印 ×4", [{ slot: "時計", value: "元素チャージ効率 / 攻撃力%" }, { slot: "杯", value: "雷元素ダメージ / 攻撃力%" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 300, "目標": 270, "妥協": 240 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 75, "目標": 65, "妥協": 55 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 170, "目標": 140, "妥協": 120 } }]),
  "ヌヴィレット": giGuide("HPから得る重撃火力を土台に、戦闘中会心率補正を考慮して会心ダメージを伸ばす。", "ファントムハンター ×4", [{ slot: "時計", value: "HP%" }, { slot: "杯", value: "水元素ダメージ / HP%" }, { slot: "冠", value: "会心ダメージ" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 45000, "目標": 40000, "妥協": 35000 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 65, "目標": 55, "妥協": 45 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 260, "目標": 220, "妥協": 180 } }], "ファントムハンター4セットの戦闘中会心率を別途加味"),
  "フリーナ": giGuide("元素スキルの火力とチーム全体のバフを、HPと元素爆発の循環で安定させる。", "黄金の劇団 ×4", [{ slot: "時計", value: "HP% / 元素チャージ効率" }, { slot: "杯", value: "HP% / 水元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 45000, "目標": 40000, "妥協": 35000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 220, "目標": 190, "妥協": 160 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }]),
  "夜蘭": giGuide("HP依存の元素爆発を安定させるため、HP・元素チャージ・会心を順に整える。", "絶縁の旗印 ×4", [{ slot: "時計", value: "HP% / 元素チャージ効率" }, { slot: "杯", value: "水元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 40000, "目標": 35000, "妥協": 30000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 240, "目標": 210, "妥協": 180 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }]),
  "珊瑚宮心海": giGuide("回復と水付着を安定させるため、HPと元素爆発の循環を優先する。", "千岩牢固 ×4 / 海染硨磲 ×4", [{ slot: "時計", value: "HP% / 元素チャージ効率" }, { slot: "杯", value: "HP%" }, { slot: "冠", value: "与える治癒効果" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 45000, "目標": 40000, "妥協": 35000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 220, "目標": 190, "妥協": 160 } }]),
  "鍾離": giGuide("シールド耐久を最優先に、HPを大きく確保する。", "千岩牢固 ×4", [{ slot: "時計", value: "HP%" }, { slot: "杯", value: "HP%" }, { slot: "冠", value: "HP%" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 55000, "目標": 45000, "妥協": 35000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 160, "目標": 140, "妥協": 120 } }]),
  "ニィロウ": giGuide("開花ダメージ上限へ近づけるため、HPを最優先に積み上げる。", "千岩牢固 ×2 / 花海甘露の光 ×2", [{ slot: "時計", value: "HP%" }, { slot: "杯", value: "HP%" }, { slot: "冠", value: "HP%" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 76000, "目標": 70000, "妥協": 65000 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 120 } }]),
  "アルハイゼン": giGuide("草激化・開花の両面を支える元素熟知と、会心比率を優先する。", "金メッキの夢 ×4 / 深林の記憶 ×4", [{ slot: "時計", value: "元素熟知" }, { slot: "杯", value: "草元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 400, "目標": 300, "妥協": 200 } }, ...GI_STANDARD_CRIT_TARGETS]),
  "アルレッキーノ": giGuide("通常攻撃の安定火力へ、会心比率と元素爆発の最低限の循環を整える。", "諧律奇想の断章 ×4", GI_CRIT_MAIN_STATS, GI_STANDARD_CRIT_TARGETS),
  "ナヴィア": giGuide("結晶の破片による元素スキル火力を、会心比率と元素爆発の循環で安定させる。", "残響の森で囁かれる夜話 ×4", GI_CRIT_MAIN_STATS, [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 230, "目標": 190, "妥協": 160 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 150, "目標": 130, "妥協": 115 } }]),
  "胡桃": giGuide("HPを火力に転換するため、HP・会心・元素爆発の循環を両立する。", "燃え盛る炎の魔女 ×4 / ファントムハンター ×4", [{ slot: "時計", value: "HP% / 元素熟知" }, { slot: "杯", value: "炎元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 40000, "目標": 35000, "妥協": 30000 } }, ...GI_STANDARD_CRIT_TARGETS]),
  "シロネン": giGuide("防御力を軸に耐性低下と回復を支えるため、防御力と元素爆発の循環を優先する。", "灰燼の都に立つ英雄の絵巻 ×4", [{ slot: "時計", value: "防御力%" }, { slot: "杯", value: "防御力%" }, { slot: "冠", value: "防御力% / 与える治癒効果" }], [{ key: "defense", label: "防御力", unit: "", targets: { "厳選": 3500, "目標": 3200, "妥協": 2800 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 200, "目標": 180, "妥協": 150 } }]),
  "閑雲": giGuide("落下攻撃支援と回復量を伸ばすため、攻撃力と元素爆発の循環を優先する。", "翠緑の影 ×4 / 旧貴族のしつけ ×4", [{ slot: "時計", value: "攻撃力% / 元素チャージ効率" }, { slot: "杯", value: "攻撃力%" }, { slot: "冠", value: "攻撃力% / 与える治癒効果" }], [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 4500, "目標": 3800, "妥協": 3200 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 220, "目標": 190, "妥協": 160 } }]),
  "ベネット": giGuide("元素爆発の回転と回復を優先するため、元素チャージとHPを確保する。", "旧貴族のしつけ ×4", [{ slot: "時計", value: "元素チャージ効率" }, { slot: "杯", value: "HP%" }, { slot: "冠", value: "与える治癒効果 / HP%" }], [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 260, "目標": 220, "妥協": 190 } }, { key: "hp", label: "HP", unit: "", targets: { "厳選": 30000, "目標": 25000, "妥協": 20000 } }]),
  "アンバー": giGuide("重撃または元素爆発の火力を伸ばすため、会心比率と攻撃力を優先する。", "燃え盛る炎の魔女 ×4 / 大地を流浪する楽団 ×4", GI_CRIT_MAIN_STATS, GI_STANDARD_CRIT_TARGETS),
  "甘雨": giGuide("重撃の会心火力を主軸に、編成に応じて元素熟知または元素爆発の循環を調整する。", "氷風を彷徨う勇士 ×4 / 大地を流浪する楽団 ×4", [{ slot: "時計", value: "攻撃力% / 元素熟知" }, { slot: "杯", value: "氷元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 75, "目標": 65, "妥協": 55 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 250, "目標": 210, "妥協": 180 } }, { key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 300, "目標": 200, "妥協": 100 } }], "凍結型では氷風4セット・氷共鳴の会心率補正、溶解型では元素熟知を別途加味"),
  "行秋": giGuide("元素爆発を途切れさせない元素チャージを最優先に、会心火力を整える。", "絶縁の旗印 ×4", [{ slot: "時計", value: "元素チャージ効率 / 攻撃力%" }, { slot: "杯", value: "水元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], [{ key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 250, "目標": 220, "妥協": 190 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 190, "目標": 160, "妥協": 130 } }]),
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
    const name = localized(catalog.loc, metadata.NameTextMapHash, `キャラクター #${id}`);
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
    return {
      id, name, level: number(asRecord(avatar.propMap)["4001"] && asRecord(asRecord(avatar.propMap)["4001"]).val, null as unknown as number),
      rank: asArray(avatar.talentIdList).length, portrait: iconUrl(text(metadata.SideIconName)) ?? null,
      element: elementMeta.label, elementColor: elementMeta.color, path: GI_WEAPONS[text(metadata.WeaponType)] ?? "武器",
      lightCone: weapon ? { name: localized(catalog.loc, weaponFlat.nameTextMapHash, "武器"), level: number(weaponInfo.level, null as unknown as number), rank: number(Object.values(asRecord(weaponInfo.affixMap))[0], -1) + 1, icon: iconUrl(text(weaponFlat.icon)) ?? null } : null,
      relics, allStats, guide, comparisons: comparisonsFromStats(guide.targets, statValues),
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
      impact: total("12201") * (1 + total("12202") / 100), anomalyMastery: total("31201") + total("31203"), penRatio: total("23101") + total("23103"), energyRegen: total("30501") * (1 + total("30502") / 100) + total("30503"),
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
    headline: "異常ダメージの基礎となる異常マスタリーを最優先し、攻撃力で控えからの付与火力を補強する。",
    relicSet: "パエトーンの歌 ×4", planarSet: "異常マスタリーを優先して選択",
    mainStats: [{ slot: "IV", value: "異常マスタリー" }, { slot: "V", value: "エーテル属性ダメージ / 攻撃力%" }, { slot: "VI", value: "異常マスタリー" }],
    targets: [{ key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 500, "目標": 430, "妥協": 380 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3200, "目標": 3000, "妥協": 2800 } }],
    targetContext: "ビビアン専用：異常マスタリーを最優先に表示します。会心系は主判定対象に含めません。",
  },
  "プロメイア": {
    headline: "異常マスタリーを最優先に、攻撃力を積み上げて状態異常火力を安定させる。",
    relicSet: "獄中の手記 ×4 / パエトーンの歌 ×2", planarSet: "異常マスタリーと攻撃力を優先",
    mainStats: [{ slot: "IV", value: "異常マスタリー" }, { slot: "V", value: "氷属性ダメージ / 攻撃力%" }, { slot: "VI", value: "異常マスタリー" }],
    targets: [{ key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 350, "目標": 325, "妥協": 300 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2500, "目標": 2350, "妥協": 2200 } }],
    targetContext: "プロメイア専用：異常マスタリーと攻撃力のみを主判定にし、会心系は評価対象から外します。",
  },
  "アストラ": {
    headline: "支援バフの基礎となる攻撃力を最優先に、安定してバフ条件を満たす。",
    relicSet: "スイング・ジャズ ×4", planarSet: "攻撃力の到達を優先",
    mainStats: [{ slot: "IV", value: "攻撃力%" }, { slot: "V", value: "攻撃力%" }, { slot: "VI", value: "攻撃力%" }],
    targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3700, "目標": 3429, "妥協": 3200 } }],
    targetContext: "アストラ専用：攻撃力を主判定にします。会心・異常系の値は支援性能の到達基準としては扱いません。",
  },
  "エレン": {
    headline: "氷属性の直撃火力を支える、会心率・会心ダメージ・攻撃力のバランスを整える。",
    relicSet: "極地のヘヴィメタル ×4", planarSet: "会心率70%以上を起点に調整",
    mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "氷属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }],
    targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 130 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2800, "妥協": 2500 } }],
    targetContext: "エレン専用：会心率を優先し、コアスキル由来の会心ダメージ補正を前提に会心バランスを確認します。",
  },
  "星見雅": {
    headline: "霜灼・烈霜の火力を支える会心率を優先し、会心ダメージと攻撃力を補強する。",
    relicSet: "折枝の刀歌 ×4", planarSet: "会心率68%を起点に調整",
    mainStats: [{ slot: "IV", value: "会心率 / 会心ダメージ" }, { slot: "V", value: "氷属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }],
    targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 68, "妥協": 60 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 130 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2800, "妥協": 2600 } }],
    targetContext: "星見雅専用：無凸・モチーフ音動機を想定した戦闘外の目安です。異常マスタリーは主判定ではなく補助値として扱います。",
  },
};

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
    const name = zzzName(catalog, metadata.Name, `エージェント #${id}`);
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
      return { id: text(equipment.Uid, `${id}-disc-${index}`), name: `ドライバディスク ${text(entry.Slot, String(index + 1))}`, setName, level, icon: null, main: mainStats[0] ? { name: mainStats[0].name, display: mainStats[0].display } : null, subs: subs.map((stat) => ({ name: stat.name, display: stat.display })) };
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
    return {
      id, name, level: number(avatar.Level, null as unknown as number), rank: number(avatar.TalentLevel, null as unknown as number), portrait: iconUrl(text(metadata.Image)) ?? null,
      element: elements.map((element) => element?.label).filter(Boolean).join(" / ") || "属性", elementColor: elements[0]?.color ?? "#c28a42", path: (ZZZ_PROFESSIONS[profession] ?? profession) || "役割",
      lightCone: weaponId ? { name: zzzName(catalog, weaponMeta.ItemName, "音動機"), level: number(rawWeapon.Level, null as unknown as number), rank: number(rawWeapon.BreakLevel, null as unknown as number), icon: iconUrl(text(weaponMeta.ImagePath)) ?? null } : null,
      relics, allStats: finalStats.display, statsNote: "エージェント・音動機・コア強化・ドライバディスクを合算した戦闘外の推定最終値です。戦闘中・条件付き効果は含みません。", guide, comparisons: comparisonsFromStats(guide.targets, finalStats.values),
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
