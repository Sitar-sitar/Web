import { TRPCError } from "@trpc/server";
import { equipmentActionsFor, guideFor, priorityRecommendations, type BuildLookupResult, type CharacterProfile } from "./buildAdvisor";
import { partyRecommendationsFor } from "./partyRecommendations";
import { resolveCharacterIdentity } from "./characterIdentity";

type RawRecord = Record<string, unknown>;
type LookupData = Omit<BuildLookupResult, "cached" | "cacheExpiresAt" | "fetchedAt">;
type StaticIndex = { characters: Record<string, RawRecord>; lightCones: Record<string, RawRecord>; relicSets: Record<string, RawRecord>; characterPromotions: Record<string, RawRecord>; skillTrees: Record<string, RawRecord> };

const STATIC_BASE = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/jp";
const STATIC_TTL_MS = 24 * 60 * 60 * 1000;
let staticCache: { value: StaticIndex; expiresAt: number } | null = null;

const FALLBACK_META: Record<string, { name: string; element?: string; path?: string }> = {
  "1014": { name: "セイバー" }, "1310": { name: "ホタル" }, "1407": { name: "キャストリス" }, "1506": { name: "銀狼Lv.999" }, "1508": { name: "遠坂凛" }, "1509": { name: "ギルガメッシュ" },
};
const PROP_NAMES: Record<string, string> = {
  BaseHP: "HP", HPDelta: "HP", HPAddedRatio: "HP%", BaseAttack: "攻撃力", AttackDelta: "攻撃力", AttackAddedRatio: "攻撃力%",
  BaseDefence: "防御力", DefenceDelta: "防御力", DefenceAddedRatio: "防御力%", SpeedDelta: "速度", CriticalChance: "会心率",
  CriticalChanceBase: "会心率", CriticalDamage: "会心ダメ", CriticalDamageBase: "会心ダメ", BreakDamageAddedRatio: "撃破特効",
  StatusProbability: "効果命中", StatusProbabilityBase: "効果命中", StatusResistance: "効果抵抗", StatusResistanceBase: "効果抵抗", BaseSpeed: "速度",
};
const PATH_NAMES: Record<string, string> = { Knight: "存護", Mage: "知恵", Priest: "豊穣", Rogue: "巡狩", Shaman: "調和", Warlock: "虚無", Warrior: "壊滅", Memory: "記憶", Elation: "歓楽" };
const ELEMENT_NAMES: Record<string, string> = { Fire: "炎", Ice: "氷", Imaginary: "虚数", Physical: "物理", Quantum: "量子", Thunder: "雷", Wind: "風" };

function record(value: unknown): RawRecord { return value && typeof value === "object" && !Array.isArray(value) ? value as RawRecord : {}; }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function str(value: unknown, fallback = ""): string { return typeof value === "string" ? value : typeof value === "number" ? String(value) : fallback; }
function num(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function map(value: unknown): Record<string, RawRecord> { const source = record(value); return Object.fromEntries(Object.entries(source).map(([key, item]) => [key, record(item)])); }

async function fetchStaticMap(endpoint: string): Promise<Record<string, RawRecord>> {
  try {
    const response = await fetch(`${STATIC_BASE}/${endpoint}.json`, { headers: { "User-Agent": "Star-Rail-Build-Advisor/1.0 (personal-use)" } });
    return response.ok ? map(await response.json()) : {};
  } catch { return {}; }
}

async function getStaticIndex(): Promise<StaticIndex> {
  if (staticCache && staticCache.expiresAt > Date.now()) return staticCache.value;
  const [characters, lightCones, relicSets, characterPromotions, skillTrees] = await Promise.all([fetchStaticMap("characters"), fetchStaticMap("light_cones"), fetchStaticMap("relic_sets"), fetchStaticMap("character_promotions"), fetchStaticMap("character_skill_trees")]);
  const value = { characters, lightCones, relicSets, characterPromotions, skillTrees };
  staticCache = { value, expiresAt: Date.now() + STATIC_TTL_MS };
  return value;
}

function property(source: RawRecord): { name: string; display: string; value: number | null } {
  const type = str(source.type); const value = num(source.value); const ratio = /AddedRatio|Critical|StatusProbability|StatusResistance/i.test(type);
  const name = PROP_NAMES[type] ?? (type.endsWith("AddedRatio") ? `${type.replace("AddedRatio", "")}属性ダメージ` : type || "ステータス");
  return { name, display: value === null ? "—" : ratio ? `${(value * 100).toFixed(1)}%` : value.toFixed(type === "SpeedDelta" ? 1 : 0), value: ratio && value !== null ? value * 100 : value };
}

function totalsFrom(sources: RawRecord[], base: Record<string, number>) {
  const totals = new Map<string, number>();
  for (const [name, value] of Object.entries(base)) totals.set(name, value);
  for (const source of sources) { const current = property(source); if (current.value !== null) totals.set(current.name, (totals.get(current.name) ?? 0) + current.value); }
  return totals;
}

function aggregate(sources: RawRecord[], base: Record<string, number>) {
  const totals = totalsFrom(sources, base);
  return Array.from(totals.entries()).map(([name, value]) => ({ name, display: name.includes("%") || /会心|撃破|効果/.test(name) ? `${value.toFixed(1)}%` : value.toFixed(name === "速度" ? 1 : 0), icon: null }));
}

function characterBase(avatarId: string, promotion: number | null, staticData: StaticIndex): Record<string, number> {
  const values = array(staticData.characterPromotions[avatarId]?.values);
  const stage = record(values[Math.max(0, Math.min(promotion ?? 0, values.length - 1))]);
  const critRate = num(record(stage.crit_rate).base);
  const critDmg = num(record(stage.crit_dmg).base);
  const speed = num(record(stage.spd).base);
  return { "会心率": (critRate ?? 0.05) * 100, "会心ダメ": (critDmg ?? 0.5) * 100, "速度": speed ?? 100 };
}

function traceProperties(avatar: RawRecord, staticData: StaticIndex): RawRecord[] {
  return array(avatar.skillTreeList).map(record).flatMap((node) => {
    const tree = staticData.skillTrees[str(node.pointId)]; const unlockedLevel = num(node.level) ?? 0;
    return array(tree?.levels).map(record).filter((entry) => (num(entry.level) ?? 0) <= unlockedLevel).flatMap((entry) => array(entry.properties).map(record));
  });
}

function calculatedValue(label: string, totals: Map<string, number>): number | null {
  return totals.get(label) ?? null;
}

export function normalizeEnkaPayload(payload: unknown, staticData: StaticIndex = { characters: {}, lightCones: {}, relicSets: {}, characterPromotions: {}, skillTrees: {} }): LookupData {
  const root = record(payload); const detail = record(root.detailInfo);
  const characters = array(detail.avatarDetailList).map(record).map((avatar, index) => {
    const avatarId = str(avatar.avatarId); const avatarMeta = staticData.characters[avatarId] ?? {}; const fallbackMeta = FALLBACK_META[avatarId] ?? { name: "" };
    const rawName = str(avatarMeta.name); const identity = resolveCharacterIdentity("hsr", avatarId, rawName);
    const metaName = identity.displayName;
    const propertyRecords = [...array(avatar.relicList).map(record).flatMap((relic) => array(record(relic._flat).props).map(record)), ...traceProperties(avatar, staticData)];
    const base = characterBase(avatarId, num(avatar.promotion), staticData); const calculatedTotals = totalsFrom(propertyRecords, base);
    const relics = array(avatar.relicList).map(record).map((relic, relicIndex) => {
      const flat = record(relic._flat); const props = array(flat.props).map(record).map(property); const setId = str(flat.setID);
      const slots = ["頭部", "手部", "胴体", "脚部", "次元界オーブ", "連結縄"];
      return { id: `${str(relic.tid, "relic")}-${str(relic.type, String(relicIndex))}`, name: `遺物 ${relicIndex + 1}`, slot: slots[relicIndex], setName: str(staticData.relicSets[setId]?.name) || `未解決（ID: ${setId || "不明"}）`, level: num(relic.level), icon: null, main: props[0] ? { name: props[0].name, display: props[0].display } : null, subs: props.slice(1).map((item) => ({ name: item.name, display: item.display })) };
    });
    const cone = record(avatar.equipment); const coneId = str(cone.tid); const path = PATH_NAMES[str(avatarMeta.path)] ?? PATH_NAMES[fallbackMeta.path ?? ""] ?? "未設定"; const guide = guideFor(metaName, path, identity);
    const comparisons = guide.targets.map((target) => { const current = calculatedValue(target.label, calculatedTotals); return { ...target, current, currentDisplay: current === null ? "未取得" : `算出 ${current.toFixed(target.unit === "%" ? 1 : 0)}${target.unit}`, achieved: { "厳選": current === null ? null : current >= target.targets["厳選"], "目標": current === null ? null : current >= target.targets["目標"], "妥協": current === null ? null : current >= target.targets["妥協"] } }; });
    const recommendations = priorityRecommendations(comparisons);
    return {
      id: identity.sourceId, identity, name: metaName, level: num(avatar.level), rank: num(avatar.rank),
      portrait: avatarId ? `https://enka.network/ui/hsr/SpriteOutput/AvatarRoundIcon/Avatar/${avatarId}.png` : null, element: ELEMENT_NAMES[str(avatarMeta.element)] ?? ELEMENT_NAMES[fallbackMeta.element ?? ""] ?? "未解決", elementColor: null, path,
      lightCone: Object.keys(cone).length ? { name: str(staticData.lightCones[coneId]?.name) || `未解決（ID: ${coneId || "不明"}）`, level: num(cone.level), rank: num(cone.rank), icon: null } : null,
      relics, allStats: aggregate(propertyRecords, base), guide,
      comparisons,
      recommendations,
      equipmentActions: equipmentActionsFor(guide, relics, recommendations),
      partyRecommendations: partyRecommendationsFor("hsr", metaName),
    } satisfies CharacterProfile;
  });
  return { player: { uid: str(root.uid ?? detail.uid), name: str(detail.nickname, "開拓者"), level: num(detail.level) }, characters };
}

export async function fetchEnkaPayload(uid: string): Promise<{ data: LookupData; ttlSeconds: number | null }> {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 14_000);
  try {
    const response = await fetch(`https://enka.network/api/hsr/uid/${encodeURIComponent(uid)}/`, { headers: { "User-Agent": "Star-Rail-Build-Advisor/1.0 (personal-use)" }, signal: controller.signal });
    const raw = await response.text(); const payload: unknown = JSON.parse(raw || "{}"); const data = normalizeEnkaPayload(payload, await getStaticIndex());
    if (!response.ok || !data.characters.length) throw new TRPCError({ code: response.status === 404 ? "NOT_FOUND" : "BAD_GATEWAY", message: "公開中のキャラクターが見つかりません。ゲーム内の巡星ビザ設定をご確認ください。" });
    return { data, ttlSeconds: num(record(payload).ttl) };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: "BAD_GATEWAY", message: "公開データサービスへ接続できませんでした。数分後に再度お試しください。", cause: error });
  } finally { clearTimeout(timeout); }
}
