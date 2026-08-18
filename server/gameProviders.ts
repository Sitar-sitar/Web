import { TRPCError } from "@trpc/server";
import {
  BuildLookupResult,
  CharacterProfile,
  GuideDefinition,
  StatComparison,
  TargetStatDefinition,
  UidResponseCache,
  lookupUidBuild,
} from "./buildAdvisor";

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
  FIGHT_PROP_FIRE_ADD_HURT: "炎元素ダメージ", FIGHT_PROP_ELEC_ADD_HURT: "雷元素ダメージ", FIGHT_PROP_WATER_ADD_HURT: "水元素ダメージ", FIGHT_PROP_WIND_ADD_HURT: "風元素ダメージ", FIGHT_PROP_ICE_ADD_HURT: "氷元素ダメージ", FIGHT_PROP_ROCK_ADD_HURT: "岩元素ダメージ", FIGHT_PROP_GRASS_ADD_HURT: "草元素ダメージ",
};

const GI_ARTIFACT_SLOTS: Record<string, string> = {
  EQUIP_BRACER: "生の花", EQUIP_NECKLACE: "死の羽", EQUIP_SHOES: "時の砂", EQUIP_RING: "空の杯", EQUIP_DRESS: "理の冠",
};

const GI_PERCENT_PROPS = new Set([
  "FIGHT_PROP_HP_PERCENT", "FIGHT_PROP_ATTACK_PERCENT", "FIGHT_PROP_DEFENSE_PERCENT", "FIGHT_PROP_CRITICAL", "FIGHT_PROP_CRITICAL_HURT", "FIGHT_PROP_CHARGE_EFFICIENCY", "FIGHT_PROP_HEAL_ADD",
  "FIGHT_PROP_FIRE_ADD_HURT", "FIGHT_PROP_ELEC_ADD_HURT", "FIGHT_PROP_WATER_ADD_HURT", "FIGHT_PROP_WIND_ADD_HURT", "FIGHT_PROP_ICE_ADD_HURT", "FIGHT_PROP_ROCK_ADD_HURT", "FIGHT_PROP_GRASS_ADD_HURT",
]);

function giStat(prop: string, rawValue: number) {
  const percent = GI_PERCENT_PROPS.has(prop);
  const value = percent ? (rawValue <= 1 ? rawValue * 100 : rawValue) : rawValue;
  return { name: GI_PROP_NAMES[prop] ?? prop, display: percent ? `${value.toFixed(1)}%` : value.toFixed(0), value, percent };
}

const GI_DEFAULT_TARGETS: TargetStatDefinition[] = [
  { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } },
  { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 200, "目標": 160, "妥協": 130 } },
  { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 160, "目標": 140, "妥協": 120 } },
  { key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 220, "目標": 160, "妥協": 100 } },
];

const GI_GUIDE_OVERRIDES: Record<string, GuideDefinition> = {
  "ナヒーダ": { headline: "元素熟知を土台に、反応火力と元素スキルの循環を整える。", relicSet: "深林の記憶 / 金メッキの夢", planarSet: "元素熟知・会心を役割に応じて調整", mainStats: [{ slot: "時計", value: "元素熟知" }, { slot: "杯", value: "元素熟知 / 草元素ダメージ" }, { slot: "冠", value: "元素熟知 / 会心" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 900, "目標": 750, "妥協": 600 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 65, "目標": 55, "妥協": 45 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 140, "目標": 110, "妥協": 90 } }] },
  "楓原万葉": { headline: "元素熟知と元素チャージ効率を優先し、拡散支援を安定させる。", relicSet: "翠緑の影 ×4", planarSet: "元素熟知・元素チャージ効率を優先", mainStats: [{ slot: "時計", value: "元素熟知" }, { slot: "杯", value: "元素熟知" }, { slot: "冠", value: "元素熟知" }], targets: [{ key: "elementalMastery", label: "元素熟知", unit: "", targets: { "厳選": 1000, "目標": 850, "妥協": 700 } }, { key: "energyRecharge", label: "元素チャージ効率", unit: "%", targets: { "厳選": 180, "目標": 160, "妥協": 140 } }] },
};

function genshinGuide(name: string): GuideDefinition {
  return GI_GUIDE_OVERRIDES[name] ?? {
    headline: "会心・元素チャージ・元素熟知の優先度を、チーム内での役割に合わせて調整する。",
    relicSet: "キャラクター適性に応じた聖遺物 ×4", planarSet: "主ステータスとサブステータスを役割に合わせて選択",
    mainStats: [{ slot: "時計", value: "攻撃力% / HP% / 元素熟知" }, { slot: "杯", value: "元素ダメージ / 攻撃力%" }, { slot: "冠", value: "会心率 / 会心ダメージ" }], targets: GI_DEFAULT_TARGETS,
  };
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
        main: mainProp ? { name: GI_PROP_NAMES[mainProp] ?? mainProp, display: giStat(mainProp, number(main.statValue)).display } : null,
        subs: asArray(flat.reliquarySubstats).map(asRecord).map((sub) => {
          const prop = text(sub.appendPropId);
          return { name: GI_PROP_NAMES[prop] ?? prop, display: giStat(prop, number(sub.statValue)).display };
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
  Fire: { label: "炎", color: "#d45b48" }, Ice: { label: "氷", color: "#76c8dc" }, Elec: { label: "電気", color: "#a278d2" }, Electric: { label: "電気", color: "#a278d2" }, Physical: { label: "物理", color: "#a6a6a6" }, Ether: { label: "エーテル", color: "#d875ce" },
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

function zzzGuide(name: string, profession: string): GuideDefinition {
  const base = {
    headline: "役割に合う主ステータスと、ドライバディスクのサブステータスを両立させる。",
    relicSet: "役割に合うドライバディスクセット", planarSet: `役割：${(ZZZ_PROFESSIONS[profession] ?? profession) || "未設定"}`,
    mainStats: [{ slot: "IV", value: "会心 / 異常マスタリー" }, { slot: "V", value: "属性ダメージ / 貫通率" }, { slot: "VI", value: "攻撃力% / 異常掌握" }],
  };
  if (profession === "Anomaly") return { ...base, headline: "異常マスタリーと異常掌握を軸に、状態異常ダメージの安定性を整える。", targets: [{ key: "anomalyMastery", label: "異常マスタリー", unit: "", targets: { "厳選": 180, "目標": 140, "妥協": 100 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 30, "目標": 20, "妥協": 12 } }, { key: "penRatio", label: "貫通率", unit: "%", targets: { "厳選": 24, "目標": 16, "妥協": 8 } }] };
  if (profession === "Stun") return { ...base, headline: "衝撃力と攻撃系ステータスを整え、ブレイクの価値を引き上げる。", targets: [{ key: "impact", label: "衝撃力", unit: "", targets: { "厳選": 30, "目標": 20, "妥協": 12 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 30, "目標": 20, "妥協": 12 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 35, "目標": 25, "妥協": 15 } }] };
  if (profession === "Support" || profession === "Defense") return { ...base, headline: "エネルギーと耐久を整え、支援・防護性能を安定させる。", targets: [{ key: "energyRegen", label: "エネルギー自動回復", unit: "", targets: { "厳選": 1.5, "目標": 1.0, "妥協": 0.5 } }, { key: "hpPercent", label: "HP%", unit: "%", targets: { "厳選": 35, "目標": 25, "妥協": 15 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 25, "目標": 16, "妥協": 8 } }] };
  return { ...base, targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 60, "目標": 50, "妥協": 40 } }, { key: "critDmg", label: "会心ダメージ", unit: "%", targets: { "厳選": 120, "目標": 100, "妥協": 80 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 35, "目標": 25, "妥協": 15 } }] };
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
    const items = asRecord(catalog.equipments.Items);
    const suits = asRecord(catalog.equipments.Suits ?? catalog.equipments.Suit);
    const relics = asArray(avatar.EquippedList).map(asRecord).map((entry, index) => {
      const equipment = asRecord(entry.Equipment);
      const equipmentId = text(equipment.Id);
      const itemMeta = asRecord(items[equipmentId]);
      const suitId = text(itemMeta.SuitId);
      const suit = asRecord(suits[suitId]);
      const rarity = number(itemMeta.Rarity, 4);
      const scale = ({ 2: 0.3, 3: 0.25, 4: 0.2 } as Record<number, number>)[rarity] ?? 0.2;
      const level = number(equipment.Level);
      const mainStats = asArray(equipment.MainPropertyList).map(asRecord).map((stat) => zzzStat(catalog, stat, 1 + level * scale));
      const subs = asArray(equipment.RandomPropertyList).map(asRecord).map((stat) => zzzStat(catalog, stat, Math.max(1, number(stat.PropertyLevel, 1))));
      [...mainStats, ...subs].forEach((stat) => { aggregate[stat.name] = (aggregate[stat.name] ?? 0) + stat.value; });
      const setName = zzzName(catalog, suit.Name ?? `EquipmentSuit_${suitId}_name`, "ドライバディスクセット");
      return { id: text(equipment.Uid, `${id}-disc-${index}`), name: `ドライバディスク ${text(entry.Slot, String(index + 1))}`, setName, level, icon: null, main: mainStats[0] ? { name: mainStats[0].name, display: mainStats[0].display } : null, subs: subs.map((stat) => ({ name: stat.name, display: stat.display })) };
    });
    const allStats = Object.entries(aggregate).sort(([, left], [, right]) => right - left).slice(0, 10).map(([name, value]) => ({ name, display: name.includes("%") || name.includes("会心") || name.includes("貫通率") ? `${value.toFixed(1)}%` : value.toFixed(0), icon: null }));
    const guide = zzzGuide(name, profession);
    const values = {
      critRate: aggregate["会心率"] ?? 0, critDmg: aggregate["会心ダメージ"] ?? 0, attackPercent: aggregate["攻撃力%"] ?? 0, hpPercent: aggregate["HP%"] ?? 0,
      impact: aggregate["衝撃力"] ?? 0, anomalyMastery: aggregate["異常マスタリー"] ?? 0, penRatio: aggregate["貫通率"] ?? 0, energyRegen: aggregate["エネルギー自動回復"] ?? 0,
    };
    const rawWeapon = asRecord(avatar.Weapon);
    const weaponId = text(rawWeapon.Id ?? metadata.WeaponId);
    const weaponMeta = asRecord(catalog.weapons[weaponId]);
    return {
      id, name, level: number(avatar.Level, null as unknown as number), rank: number(avatar.TalentLevel, null as unknown as number), portrait: iconUrl(text(metadata.Image)) ?? null,
      element: elements.map((element) => element?.label).filter(Boolean).join(" / ") || "属性", elementColor: elements[0]?.color ?? "#c28a42", path: (ZZZ_PROFESSIONS[profession] ?? profession) || "役割",
      lightCone: weaponId ? { name: zzzName(catalog, weaponMeta.ItemName, "音動機"), level: number(rawWeapon.Level, null as unknown as number), rank: number(rawWeapon.BreakLevel, null as unknown as number), icon: iconUrl(text(weaponMeta.ImagePath)) ?? null } : null,
      relics, allStats, guide, comparisons: comparisonsFromStats(guide.targets, values),
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
