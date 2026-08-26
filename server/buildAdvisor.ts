import { TRPCError } from "@trpc/server";
import { fetchEnkaPayload } from "./enkaFallback";
import { generatedHsrGuide } from "./individualGuides";
import { guideMetadataFor } from "./characterGuideMetadata";
import { partyRecommendationsFor, type PartyRecommendationSet } from "./partyRecommendations";
import { resolveCharacterIdentity, type CharacterIdentity } from "./characterIdentity";
import { constellationProfileFor, type ConstellationProfile } from "./characterConstellations";

export type TierName = "厳選" | "目標" | "妥協";
export type StatKey = "critRate" | "critDmg" | "speed" | "attack" | "attackPercent" | "breakEffect" | "effectHitRate" | "effectRes" | "hp" | "hpPercent" | "defense" | "defPercent" | "energyRecharge" | "elementalMastery" | "anomalyMastery" | "anomalyProficiency" | "impact" | "penRatio" | "energyRegen";

type RawRecord = Record<string, unknown>;

export type TargetStatDefinition = {
  key: StatKey;
  label: string;
  unit: "%" | "";
  targets: Record<TierName, number>;
};

export type GuideDefinition = {
  headline: string;
  relicSet: string;
  planarSet: string;
  mainStats: Array<{ slot: string; value: string }>;
  targets: TargetStatDefinition[];
  targetContext?: string;
  dataAsOf?: string;
  updatedAt?: string;
  sourceLabel?: string;
  profileId?: string;
};

export const GUIDE_DATASET_STATUS = {
  dataAsOf: "2026-08-18",
  updatedAt: "2026-08-18",
  sourceLabels: {
    hsr: "KQM・StarDB・Game8の公開ビルド情報を照合",
    genshin: "GameWith・Game8の公開ビルド情報を照合",
    zzz: "Prydwen・公開エージェントデータを照合",
  },
} as const;

export function withGuideMetadata(game: "hsr" | "genshin" | "zzz", guide: GuideDefinition, characterName?: string): GuideDefinition {
  const record = guideMetadataFor(game, characterName);
  return {
    ...guide,
    dataAsOf: guide.dataAsOf ?? record.dataAsOf,
    updatedAt: guide.updatedAt ?? record.updatedAt,
    sourceLabel: guide.sourceLabel ?? record.sourceLabel,
    profileId: guide.profileId ?? record.profileId ?? `curated:${characterName ?? "individual"}`,
  };
}

export type StatComparison = TargetStatDefinition & {
  current: number | null;
  currentDisplay: string;
  achieved: Record<TierName, boolean | null>;
};

export type PriorityRecommendation = {
  key: StatKey;
  label: string;
  unit: "" | "%";
  current: number;
  target: number;
  deficit: number;
  priority: "最優先" | "優先" | "次点";
  rationale: string;
};

export type EquipmentAction = {
  recommendationKey: StatKey;
  statLabel: string;
  action: "主ステータスを変更" | "サブステータスを厳選";
  slot: string;
  equippedName: string | null;
  currentMain: string | null;
  desiredStat: string;
  reason: string;
};

/** 公開プロフィールで計測できる値を、目標水準までの相対不足量で優先表示する。 */
export function priorityRecommendations(comparisons: StatComparison[]): PriorityRecommendation[] {
  return comparisons
    .filter((comparison): comparison is StatComparison & { current: number } => comparison.current !== null && comparison.current < comparison.targets["目標"])
    .map((comparison) => {
      const target = comparison.targets["目標"];
      const deficit = target - comparison.current;
      const severity = deficit / Math.max(target, 1);
      const priority: PriorityRecommendation["priority"] = severity >= 0.25 ? "最優先" : severity >= 0.1 ? "優先" : "次点";
      return {
        key: comparison.key,
        label: comparison.label,
        unit: comparison.unit,
        current: comparison.current,
        target,
        deficit,
        priority,
        rationale: `目標 ${target}${comparison.unit} まであと ${deficit.toFixed(comparison.unit === "%" ? 1 : 0)}${comparison.unit}`,
      };
    })
    .sort((left, right) => (right.deficit / Math.max(right.target, 1)) - (left.deficit / Math.max(left.target, 1)))
    .slice(0, 3);
}

type RelicForAction = { name: string; slot?: string; main: { name: string; display: string } | null };

const STAT_MAIN_LABELS: Record<StatKey, string[]> = {
  critRate: ["会心率"], critDmg: ["会心ダメ"], speed: ["速度"], attack: ["攻撃力"], attackPercent: ["攻撃力"], breakEffect: ["撃破特効"],
  effectHitRate: ["効果命中"], effectRes: ["効果抵抗"], hp: ["HP"], hpPercent: ["HP"], defense: ["防御力"], defPercent: ["防御力"],
  energyRecharge: ["元素チャージ", "EP回復", "エネルギー"], elementalMastery: ["元素熟知"], anomalyMastery: ["異常マスタリー"], anomalyProficiency: ["異常掌握"], impact: ["衝撃力"], penRatio: ["貫通"], energyRegen: ["エネルギー"],
};

function guideFamily(guide: GuideDefinition): "hsr" | "genshin" | "zzz" {
  const slots = guide.mainStats.map((entry) => entry.slot).join(" ");
  if (/時計|杯|冠/.test(slots)) return "genshin";
  if (/(^|\s)(IV|V|VI)(\s|$)/.test(slots)) return "zzz";
  return "hsr";
}

function defaultSlotsForStat(family: "hsr" | "genshin" | "zzz", key: StatKey): string[] {
  if (key === "critRate" || key === "critDmg") return [family === "genshin" ? "冠" : family === "zzz" ? "IV" : "胴体"];
  if (key === "speed") return family === "hsr" ? ["脚部"] : family === "zzz" ? ["VI"] : [];
  if (key === "energyRecharge") return family === "genshin" ? ["時計"] : family === "hsr" ? ["連結縄"] : ["VI"];
  if (key === "elementalMastery") return family === "genshin" ? ["時計", "杯", "冠"] : [];
  if (key === "anomalyMastery") return family === "zzz" ? ["IV", "VI"] : [];
  if (key === "anomalyProficiency") return family === "zzz" ? ["VI"] : [];
  if (key === "impact" || key === "energyRegen") return family === "zzz" ? ["VI"] : [];
  if (key === "penRatio") return family === "zzz" ? ["V"] : [];
  if (key === "breakEffect") return family === "hsr" ? ["連結縄"] : [];
  if (key === "effectHitRate") return family === "hsr" ? ["胴体"] : [];
  if (key === "attack" || key === "attackPercent") return family === "genshin" ? ["時計", "杯"] : family === "zzz" ? ["V", "VI"] : ["脚部", "連結縄"];
  if (key === "hp" || key === "hpPercent" || key === "defense" || key === "defPercent") return family === "genshin" ? ["時計", "杯", "冠"] : ["胴体", "次元界オーブ", "連結縄"];
  return [];
}

function normalizedSlot(slot: string) {
  const normalized = slot.replace("時の砂", "時計").replace("空の杯", "杯").replace("理の冠", "冠").replace("ドライバディスク ", "").trim();
  return ({ IV: "4", V: "5", VI: "6" } as Record<string, string>)[normalized] ?? normalized;
}

function mainStatMatchesGuide(currentMain: string | null, guideValue: string | undefined, labels: string[]) {
  if (!currentMain) return false;
  const current = currentMain.replace("ボーナス", "");
  return labels.some((label) => current.includes(label)) || Boolean(guideValue && (guideValue.includes(current) || current.includes(guideValue.replace("%", ""))));
}

/** 未達ステータスを、公開プロフィール上の装備部位と主・サブステータスの具体的な見直しへ変換する。 */
export function equipmentActionsFor(guide: GuideDefinition, relics: RelicForAction[], recommendations: PriorityRecommendation[]): EquipmentAction[] {
  const family = guideFamily(guide);
  return recommendations.map((recommendation) => {
    const labels = STAT_MAIN_LABELS[recommendation.key];
    const configuredSlots = guide.mainStats.filter((entry) => labels.some((label) => entry.value.includes(label))).map((entry) => entry.slot);
    const slot = (configuredSlots.length ? configuredSlots : defaultSlotsForStat(family, recommendation.key))[0] ?? guide.mainStats[0]?.slot ?? "装備部位";
    const equipped = relics.find((relic) => normalizedSlot(relic.slot ?? relic.name) === normalizedSlot(slot)) ?? null;
    const currentMain = equipped?.main?.name ?? null;
    const guideValue = guide.mainStats.find((entry) => normalizedSlot(entry.slot) === normalizedSlot(slot))?.value;
    const mainMatches = mainStatMatchesGuide(currentMain, guideValue, labels);
    const desiredStat = labels[0] ?? recommendation.label;
    const action: EquipmentAction["action"] = mainMatches ? "サブステータスを厳選" : "主ステータスを変更";
    return {
      recommendationKey: recommendation.key, statLabel: recommendation.label, action, slot,
      equippedName: equipped?.name ?? null, currentMain, desiredStat,
      reason: mainMatches
        ? `${slot}の主ステータスは${currentMain}です。${desiredStat}のサブステータスが付く個体を優先して厳選します。`
        : `${slot}${currentMain ? `は現在${currentMain}` : ""}です。${desiredStat}を主ステータスにした${equipped?.name ?? "装備"}へ変更すると不足分を補いやすくなります。`,
    };
  });
}

export type CharacterProfile = {
  id: string;
  identity: CharacterIdentity;
  name: string;
  level: number | null;
  rank: number | null;
  portrait: string | null;
  element: string;
  elementColor: string | null;
  path: string;
  lightCone: {
    name: string;
    level: number | null;
    rank: number | null;
    icon: string | null;
  } | null;
  relics: Array<{
    id: string;
    name: string;
    slot?: string;
    setName: string;
    level: number | null;
    icon: string | null;
    main: { name: string; display: string } | null;
    subs: Array<{ name: string; display: string }>;
  }>;
  allStats: Array<{ name: string; display: string; icon: string | null }>;
  statsNote?: string;
  guide: GuideDefinition;
  comparisons: StatComparison[];
  recommendations: PriorityRecommendation[];
  equipmentActions: EquipmentAction[];
  partyRecommendations: PartyRecommendationSet;
  constellations: ConstellationProfile;
};

export type BuildLookupResult = {
  player: { uid: string; name: string; level: number | null };
  characters: CharacterProfile[];
  dataSource?: "MiHoMo" | "Enka";
  cached: boolean;
  cacheExpiresAt: string;
  fetchedAt: string;
};

const DAMAGE_TARGETS: TargetStatDefinition[] = [
  { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } },
  { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 120 } },
  { key: "speed", label: "速度", unit: "", targets: { "厳選": 134, "目標": 134, "妥協": 120 } },
  { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 70, "目標": 55, "妥協": 40 } },
];

const SUPPORT_TARGETS: TargetStatDefinition[] = [
  { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 145, "妥協": 134 } },
  { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 45, "目標": 30, "妥協": 20 } },
  { key: "hpPercent", label: "HP%", unit: "%", targets: { "厳選": 45, "目標": 32, "妥協": 20 } },
];

const BREAK_TARGETS: TargetStatDefinition[] = [
  { key: "breakEffect", label: "撃破特効", unit: "%", targets: { "厳選": 360, "目標": 300, "妥協": 240 } },
  { key: "speed", label: "速度", unit: "", targets: { "厳選": 154, "目標": 150, "妥協": 145 } },
  { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 45, "目標": 35, "妥協": 25 } },
];

const DOT_TARGETS: TargetStatDefinition[] = [
  { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 147, "妥協": 134 } },
  { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 90, "目標": 75, "妥協": 60 } },
  { key: "effectHitRate", label: "効果命中", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } },
];

function damageGuide(headline: string, relicSet: string, planarSet: string, targets = DAMAGE_TARGETS): GuideDefinition {
  return { headline, relicSet, planarSet, mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度 / 攻撃力%" }, { slot: "次元界オーブ", value: "属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets };
}

function supportGuide(headline: string, relicSet: string, planarSet: string, targets = SUPPORT_TARGETS): GuideDefinition {
  return { headline, relicSet, planarSet, mainStats: [{ slot: "胴体", value: "HP% / 防御力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 防御力%" }, { slot: "連結縄", value: "EP回復効率" }], targets };
}

const GUIDE_OVERRIDES: Record<string, GuideDefinition> = {
  "ホタル": {
    headline: "超撃破を軸に、戦闘外の速度と撃破特効を整える。",
    relicSet: "鉄騎の執行者 ×4",
    planarSet: "劫火と灯鋒 ×2",
    mainStats: [
      { slot: "胴体", value: "攻撃力%" },
      { slot: "脚部", value: "速度" },
      { slot: "次元界オーブ", value: "攻撃力%" },
      { slot: "連結縄", value: "撃破特効" },
    ],
    targets: BREAK_TARGETS,
    targetContext: "ホタル専用：撃破特効360%は戦闘中の自己・味方補正を含む到達点として扱い、公開プロフィールでは撃破特効300%・速度150を基準にする。",
    dataAsOf: "2026-08-25",
    updatedAt: "2026-08-25",
    sourceLabel: "Game8・Icy Veinsの更新日付き個別ビルド・PTガイドを照合",
  },
  "カフカ": {
    headline: "持続ダメージを安定させるため、速度と攻撃力を優先する。",
    relicSet: "深い牢獄の囚人 ×4",
    planarSet: "宇宙封印ステーション ×2",
    mainStats: [
      { slot: "胴体", value: "攻撃力%" },
      { slot: "脚部", value: "速度" },
      { slot: "次元界オーブ", value: "雷属性ダメージ" },
      { slot: "連結縄", value: "攻撃力%" },
    ],
    targets: DOT_TARGETS,
  },
  "銀狼": {
    headline: "弱点付与の安定性を支える、効果命中と速度の設計。",
    relicSet: "流星の跡を追う怪盗 ×2 / 仮想空間を漫遊するメッセンジャー ×2",
    planarSet: "折れた竜骨 ×2",
    mainStats: [
      { slot: "胴体", value: "効果命中" },
      { slot: "脚部", value: "速度" },
      { slot: "次元界オーブ", value: "HP% / 防御力%" },
      { slot: "連結縄", value: "EP回復効率" },
    ],
    targets: [
      { key: "effectHitRate", label: "効果命中", unit: "%", targets: { "厳選": 96, "目標": 85, "妥協": 70 } },
      { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 145, "妥協": 134 } },
      { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } },
    ],
  },
};

const ROLE_GUIDES: Record<string, GuideDefinition> = {
  "調和": {
    headline: "味方への支援を最優先に、行動順と耐久を設計する。",
    relicSet: "仮想空間を漫遊するメッセンジャー ×4",
    planarSet: "折れた竜骨 ×2",
    mainStats: [
      { slot: "胴体", value: "HP% / 防御力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 防御力%" }, { slot: "連結縄", value: "EP回復効率" },
    ],
    targets: SUPPORT_TARGETS,
  },
  "虚無": {
    headline: "デバフの命中精度と行動頻度を優先する。",
    relicSet: "深い牢獄の囚人 ×4",
    planarSet: "宇宙封印ステーション ×2",
    mainStats: [
      { slot: "胴体", value: "効果命中 / 攻撃力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" },
    ],
    targets: DOT_TARGETS,
  },
  "豊穣": {
    headline: "回復の安定性を支える、速度と耐久のバランス。",
    relicSet: "流雲無痕の過客 ×2 / 仮想空間を漫遊するメッセンジャー ×2",
    planarSet: "折れた竜骨 ×2",
    mainStats: [
      { slot: "胴体", value: "治癒量 / HP%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP%" }, { slot: "連結縄", value: "EP回復効率" },
    ],
    targets: SUPPORT_TARGETS,
  },
  "存護": {
    headline: "被弾を抑えつつ、味方を守る行動頻度を確保する。",
    relicSet: "純庭教会の聖騎士 ×4",
    planarSet: "折れた竜骨 ×2",
    mainStats: [
      { slot: "胴体", value: "防御力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "防御力%" }, { slot: "連結縄", value: "EP回復効率 / 防御力%" },
    ],
    targets: [
      { key: "speed", label: "速度", unit: "", targets: { "厳選": 150, "目標": 134, "妥協": 120 } },
      { key: "defPercent", label: "防御力%", unit: "%", targets: { "厳選": 80, "目標": 60, "妥協": 45 } },
      { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 45, "目標": 30, "妥協": 20 } },
    ],
  },
};

Object.assign(GUIDE_OVERRIDES, {
  "黄泉": { headline: "必殺技を主軸に、戦闘外の会心率・会心ダメージ・攻撃力を整え、速度は101型または135型を選ぶ。", relicSet: "死水に潜る先駆者 ×4", planarSet: "出雲顕世と高天神国 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "攻撃力% / 速度" }, { slot: "次元界オーブ", value: "雷属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 190, "目標": 160, "妥協": 140 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3500, "目標": 3200, "妥協": 3000 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 135, "目標": 101, "妥協": 100 } }], targetContext: "黄泉専用：E0/E1は虚無2名、E2は虚無1名と調和1名という追加能力の編成条件を別に扱う。E1のデバフ対象への会心率+18%など、星魂・デバフ・味方による戦闘中効果は公開プロフィールの現在値・目標値へ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "ゼーレ": damageGuide("再現性のある連続行動へ、会心の安定感を優先する。", "星の如く輝く天才 ×4", "サルソットの出陣 ×2"),
  "景元": damageGuide("神君の追撃を伸ばすため、会心と攻撃力を整える。", "灰燼を燃やし尽くす大公 ×4", "サルソットの出陣 ×2"),
  "姫子": damageGuide("追加攻撃の回転と瞬間火力を、会心ステータスで支える。", "灰燼を燃やし尽くす大公 ×4", "サルソットの出陣 ×2"),
  "Dr.レイシオ": damageGuide("単体への追加攻撃を最大化する、会心重視の設計。", "荒海を歩む旅人 ×4", "サルソットの出陣 ×2"),
  "トパーズ＆カブ": damageGuide("追加攻撃の頻度と火力を、会心と攻撃力で支える。", "灰燼を燃やし尽くす大公 ×4", "サルソットの出陣 ×2"),
  "飲月": damageGuide("強化通常攻撃の一撃を、会心比率で磨き上げる。", "荒海を歩む旅人 ×4", "ルサカの海中世界 ×2"),
  "刃": { headline: "HPを基盤に、会心と速度で追加攻撃の価値を高める。", relicSet: "宝命長存の蒔者 ×4", planarSet: "自転が止まったサルソット ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "風属性ダメージ / HP%" }, { slot: "連結縄", value: "HP%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 190, "目標": 160, "妥協": 130 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 134, "目標": 134, "妥協": 120 } }, { key: "hpPercent", label: "HP%", unit: "%", targets: { "厳選": 55, "目標": 45, "妥協": 35 } }] },
  "ブートヒル": { headline: "決闘と弱点撃破の火力を支える、公開値の撃破特効200%以上と速度145を優先する。", relicSet: "蝗害を掃討せし鉄騎 ×4", planarSet: "盗賊公国タリア ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "物理属性ダメージ" }, { slot: "連結縄", value: "撃破特効" }], targets: [{ key: "breakEffect", label: "撃破特効", unit: "%", targets: { "厳選": 240, "目標": 200, "妥協": 180 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 145, "妥協": 135 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 55, "目標": 45, "妥協": 40 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 70, "目標": 50, "妥協": 40 } }], targetContext: "ブートヒル専用：タリアの速度145、超撃破支援、E1の防御無視・E2の撃破特効などは用途・戦闘中条件を持つ。公開プロフィールの現在値へ加算せず、撃破特効200%と速度145を基準に比較する。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "ルアン・メェイ": { headline: "戦闘中180%へ届く撃破特効と速度134を基準に、超撃破・持続ダメージ双方を支える。", relicSet: "流星の跡を追う怪盗 ×2 / 仮想空間を漫遊するメッセンジャー ×2", planarSet: "盗賊公国タリア ×2", mainStats: [{ slot: "胴体", value: "HP% / 防御力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 防御力%" }, { slot: "連結縄", value: "撃破特効" }], targets: [{ key: "breakEffect", label: "撃破特効", unit: "%", targets: { "厳選": 180, "目標": 160, "妥協": 140 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 145, "目標": 134, "妥協": 120 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }], targetContext: "ルアン・メェイ専用：追加能力由来の戦闘中撃破特効を含め180%以上に届く公開値160%を通常目標にする。タリア採用時のみ速度145を個別の上位目標とする。", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: "Game8・Prydwenの更新日付き個別ガイドを照合" },
  "花火": supportGuide("会心ダメージと高速行動で、主力アタッカーを引き上げる。", "仮想空間を漫遊するメッセンジャー ×4", "折れた竜骨 ×2", [{ key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 230, "目標": 200, "妥協": 170 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 161, "目標": 160, "妥協": 145 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }]),
  "ブローニャ": supportGuide("行動順の最適化を最優先に、耐久を添える。", "仮想空間を漫遊するメッセンジャー ×4", "折れた竜骨 ×2"),
  "符玄": { headline: "味方の生存を支えるため、HP・防御・速度を厚く積む。", relicSet: "宝命長存の蒔者 ×2 / 純庭教会の聖騎士 ×2", planarSet: "竜骨の守護者 ×2", mainStats: [{ slot: "胴体", value: "HP%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP%" }, { slot: "連結縄", value: "HP% / EP回復効率" }], targets: SUPPORT_TARGETS },
  "アベンチュリン": { headline: "防御力を基盤に、バリアと追加攻撃の両面を整える。", relicSet: "純庭教会の聖騎士 ×4", planarSet: "ベロブルグの建築家 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ / 防御力%" }, { slot: "脚部", value: "速度 / 防御力%" }, { slot: "次元界オーブ", value: "防御力%" }, { slot: "連結縄", value: "防御力%" }], targets: [{ key: "speed", label: "速度", unit: "", targets: { "厳選": 134, "目標": 134, "妥協": 120 } }, { key: "defPercent", label: "防御力%", unit: "%", targets: { "厳選": 90, "目標": 70, "妥協": 50 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }] },
  "フォフォ": supportGuide("回復と必殺技回転を安定させる、速度中心の構成。", "仮想空間を漫遊するメッセンジャー ×2 / 流雲無痕の過客 ×2", "折れた竜骨 ×2"),
  "ギャラガー": { headline: "弱点撃破と回復の両立を、撃破特効と速度で組み立てる。", relicSet: "流星の跡を追う怪盗 ×2 / 仮想空間を漫遊するメッセンジャー ×2", planarSet: "盗賊公国タリア ×2", mainStats: [{ slot: "胴体", value: "治癒量 / HP%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP%" }, { slot: "連結縄", value: "撃破特効" }], targets: [{ key: "breakEffect", label: "撃破特効", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 120 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 145, "妥協": 134 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }] },
  "キャストリス": { headline: "記憶精霊とHP消費の火力を支えるため、HP・会心を優先し、速度は戦闘外に積みすぎない。", relicSet: "詩人のサルソー ×4", planarSet: "巨樹の葉を掴む静謐な荘園 ×2", mainStats: [{ slot: "胴体", value: "会心ダメ" }, { slot: "脚部", value: "HP%" }, { slot: "次元界オーブ", value: "HP% / 量子属性ダメージ" }, { slot: "連結縄", value: "HP%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 220, "目標": 180, "妥協": 150 } }, { key: "hp", label: "HP", unit: "", targets: { "厳選": 10000, "目標": 8500, "妥協": 7500 } }], targetContext: "キャストリス専用：詩人4セット・味方・記憶精霊による戦闘内会心および耐性貫通は公開プロフィールへ加算しない。HP7,000以上と戦闘中会心率100%は個別セット条件を含む目安。", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "アグライア": { headline: "召喚物の手数を支える速度と会心比率を優先し、サンデー・キュレネ編成では戦闘中支援を別扱いにする。", relicSet: "流星を追う怪盗 ×4", planarSet: "奔狼の都藍王朝 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "雷属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 190, "目標": 160, "妥協": 130 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 134, "妥協": 120 } }], targetContext: "アグライア専用：サンデー・キュレネ・ガーメントメーカーの戦闘中支援は公開プロフィール値へ加算しない。", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "アナイクス": { headline: "弱点付与を活かすスキル火力のため、会心率80%以上・速度134/135・攻撃力2,500以上を個別に整える。", relicSet: "星の如く輝く天才 ×4 / 知識の海に溺れる学者 ×4", planarSet: "自転が止まったサルソット ×2", mainStats: [{ slot: "胴体", value: "会心率" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "風属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 100, "目標": 80, "妥協": 70 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 150, "目標": 120, "妥協": 100 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 135, "目標": 134, "妥協": 120 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2800, "目標": 2500, "妥協": 2200 } }], targetContext: "アナイクス専用：マダム・ヘルタ・味方・弱点付与・防御無視に由来する戦闘内効果は公開プロフィールへ加算しない。速度は行動加速支援より1高い設計を優先する。", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "飛霄": { headline: "飛黄を溜める味方の手数を活かし、会心率・攻撃力・速度134を公開値で整える。", relicSet: "風雲を薙ぎ払う勇烈 ×4", planarSet: "自転が止まったサルソット ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度 / 攻撃力%" }, { slot: "次元界オーブ", value: "風属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 90, "目標": 80, "妥協": 70 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 180, "目標": 140, "妥協": 120 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3400, "目標": 2900, "妥協": 2600 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 134, "妥協": 120 } }], targetContext: "飛霄専用：速度143／160は手数と厳選度に応じた上位到達点。星魂・味方の行動加速・戦闘中速度は公開値へ加算しない。", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "雲璃": damageGuide("反撃の一撃を安定させるため、会心と攻撃力を優先する。", "灰燼を燃やし尽くす大公 ×4", "自転が止まったサルソット ×2"),
  "霊砂": { headline: "撃破編成での回復・追加攻撃を安定させるため、公開値の速度160・撃破特効140%・攻撃力2,700を整える。", relicSet: "蝗害を掃討せし鉄騎 ×4 / 流雲無痕の過客 ×2・メッセンジャー ×2", planarSet: "盗賊公国タリア ×2", mainStats: [{ slot: "胴体", value: "治癒量 / 攻撃力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "攻撃力%" }, { slot: "連結縄", value: "EP回復効率 / 撃破特効" }], targets: [{ key: "breakEffect", label: "撃破特効", unit: "%", targets: { "厳選": 170, "目標": 140, "妥協": 120 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 160, "妥協": 145 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2700, "妥協": 2400 } }], targetContext: "霊砂専用：戦闘中の撃破特効200%／鉄騎4セット時250%には光円錐・味方セット・編成バフが含まれるため、公開プロフィールに混在させない。E1/E2/E4/E6の条件付き効果も現在値・目標へ自動加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
  "椒丘": { headline: "必殺技の付与を安定させるため、効果命中と速度を最優先する。", relicSet: "死水に潜る先駆者 ×2 / 仮想空間を漫遊するメッセンジャー ×2", planarSet: "海に沈んだルサカ ×2", mainStats: [{ slot: "胴体", value: "効果命中" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 炎属性ダメージ" }, { slot: "連結縄", value: "EP回復効率" }], targets: [{ key: "effectHitRate", label: "効果命中", unit: "%", targets: { "厳選": 178, "目標": 160, "妥協": 140 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 145, "妥協": 134 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }] },
  "ブラックスワン": { headline: "持続ダメージの命中と行動回数を、効果命中・速度・攻撃力で整える。", relicSet: "深い牢獄の囚人 ×4", planarSet: "囚われの歌姫 ×2", mainStats: [{ slot: "胴体", value: "効果命中" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "風属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "effectHitRate", label: "効果命中", unit: "%", targets: { "厳選": 150, "目標": 120, "妥協": 100 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 147, "妥協": 134 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 90, "目標": 75, "妥協": 60 } }] },
  "サンデー": { headline: "主力より1低い行動順または高速型を選び、会心ダメージ200%以上と効果抵抗30%を公開値で整える。", relicSet: "仮想空間を漫遊するメッセンジャー ×4", planarSet: "折れた竜骨 ×2 / 海に沈んだルサカ ×2", mainStats: [{ slot: "胴体", value: "会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 防御力%" }, { slot: "連結縄", value: "EP回復効率" }], targets: [{ key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 220, "目標": 200, "妥協": 180 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 134, "妥協": 120 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }], targetContext: "サンデー専用：低速型は主力アタッカーより速度を1低く、高速型は160以上を目安にする。E1〜E6の防御無視・与ダメージ・EP・会心率効果は戦闘中・条件付きであり、公開プロフィールの現在値・目標へ直接加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "ロビン": { headline: "追加攻撃・協奏支援を攻撃力へ換算するため、会心より攻撃力4,000と初動速度を優先する。", relicSet: "仮想空間を漫遊するメッセンジャー ×2 / 野穂伴う快走の盗賊 ×2", planarSet: "海に沈んだルサカ ×2", mainStats: [{ slot: "胴体", value: "攻撃力%" }, { slot: "脚部", value: "攻撃力%" }, { slot: "次元界オーブ", value: "攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 4300, "目標": 4000, "妥協": 3600 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 134, "目標": 120, "妥協": 110 } }], targetContext: "ロビン専用：会心系は協奏中の付加ダメージの主判定対象にしない。E1耐性貫通・E2速度は戦闘中効果として公開値へ加算しない。", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: "Game8・Prydwenの更新日付き個別ガイドを照合" },
  "クラーラ": { headline: "反撃の確実なダメージを、会心と攻撃力で優先して高める。", relicSet: "灰燼を燃やし尽くす大公 ×4 / 成り上がりチャンピオン ×4", planarSet: "自転が止まったサルソット ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "攻撃力%" }, { slot: "次元界オーブ", value: "物理属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 190, "目標": 160, "妥協": 130 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 100, "目標": 85, "妥協": 70 } }] },
  "サフェル": { headline: "追撃と追加ダメージの回転を、会心・速度・攻撃力で整える。", relicSet: "灰燼を燃やし尽くす大公 ×4", planarSet: "奔狼の都藍王朝 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "量子属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 200, "目標": 170, "妥協": 140 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 134, "妥協": 120 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 75, "目標": 60, "妥協": 45 } }] },
  "マダム・ヘルタ": { headline: "知恵の範囲火力を伸ばすため、会心・攻撃力・行動回数を優先する。", relicSet: "灰燼を燃やし尽くす大公 ×4", planarSet: "奔狼の都藍王朝 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度 / 攻撃力%" }, { slot: "次元界オーブ", value: "氷属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 220, "目標": 180, "妥協": 150 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 143, "目標": 134, "妥協": 120 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 80, "目標": 65, "妥協": 50 } }] },
});

Object.assign(GUIDE_OVERRIDES, {
  "アベンチュリン": { headline: "バリアと追加攻撃を安定させるため、公開値の防御力4,000と速度134を優先する。", relicSet: "純庭教会の聖騎士 ×4 / 灰燼を燃やし尽くす大公 ×4", planarSet: "ベロブルグの建築家 ×2 / 奔狼の都藍王朝 ×2", mainStats: [{ slot: "胴体", value: "防御力% / 会心率" }, { slot: "脚部", value: "速度 / 防御力%" }, { slot: "次元界オーブ", value: "防御力%" }, { slot: "連結縄", value: "防御力%" }], targets: [{ key: "defense", label: "防御力", unit: "", targets: { "厳選": 4300, "目標": 4000, "妥協": 3700 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 143, "目標": 134, "妥協": 120 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }], targetContext: "アベンチュリン専用：防御力4,000で解放される追加能力の会心率最大48%、天賦・味方・E4の防御力、護盾中の効果抵抗は戦闘中効果として公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "トパーズ&カブ": { headline: "追加攻撃の火力を安定させるため、会心率80%・会心ダメージ150%・攻撃力2,500・速度134を公開値で整える。", relicSet: "灰燼を燃やし尽くす大公 ×4", planarSet: "奔狼の都藍王朝 ×2 / 自転が止まったサルソット ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "炎属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 90, "目標": 80, "妥協": 70 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 170, "目標": 150, "妥協": 140 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2800, "目標": 2500, "妥協": 2100 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 143, "目標": 134, "妥協": 120 } }], targetContext: "トパーズ&カブ専用：負債証明の被ダメージ上昇、カブの行動順前進、必殺技「大当たり」中の会心ダメージ、味方・光円錐・遺物の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "花火": { headline: "主力より1低い低速型または高速型を選び、公開値の会心ダメージ200%以上・効果抵抗30%以上を優先する。", relicSet: "仮想空間を漫遊するメッセンジャー ×4 / 風雲を薙ぎ払う勇烈 ×4", planarSet: "折れた竜骨 ×2 / 海に沈んだルサカ ×2", mainStats: [{ slot: "胴体", value: "会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 防御力%" }, { slot: "連結縄", value: "EP回復効率" }], targets: [{ key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 230, "目標": 200, "妥協": 180 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 200, "目標": 184, "妥協": 168 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }], targetContext: "花火専用：低速型は主力アタッカーより速度を1低く設定する。会心ダメージ付与・最大SP・SP回復・全体攻撃力・耐性貫通、E1〜E6の速度・攻撃力などは戦闘中効果として公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "丹恒・飲月": { headline: "SP消費型の強化通常攻撃を支えるため、公開値の会心率75%・会心ダメージ145%・攻撃力2,500を優先し、速度は加速役に応じて選ぶ。", relicSet: "荒海を歩む旅人 ×4 / 死水に潜る先駆者 ×4", planarSet: "ルサカの海中世界 ×2 / 自転が止まったサルソット ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "攻撃力% / 速度" }, { slot: "次元界オーブ", value: "虚数属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 70 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 165, "目標": 145, "妥協": 140 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2600, "目標": 2500, "妥協": 2200 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 134, "目標": 102, "妥協": 102 } }], targetContext: "丹恒・飲月専用：花火・サンデーの行動順加速を採る低速型では基礎速度を維持する。強化通常攻撃のSP消費、逆鱗、追加能力、光円錐・味方・E1〜E6の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GUIDE_OVERRIDES, {
  "Dr.レイシオ": { headline: "敵デバフを満たす追加攻撃を安定させるため、公開値の会心率70%・会心ダメージ150%・攻撃力2,600・速度134を優先する。", relicSet: "荒海を歩む旅人 ×4 / 灰燼を燃やし尽くす大公 ×4", planarSet: "自転が止まったサルソット ×2 / 奔狼の都藍王朝 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "虚数属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 170, "目標": 150, "妥協": 140 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2900, "目標": 2600, "妥協": 2300 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 143, "目標": 134, "妥協": 120 } }], targetContext: "Dr.レイシオ専用：Summationの会心率+15%・会心ダメージ+30%、敵デバフ数、味方・光円錐・星魂の条件付き効果は戦闘中にのみ適用されるため、公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "カフカ": { headline: "DoT起爆支援を安定させるため、公開値の速度160・効果命中75%・攻撃力2,500を優先する。", relicSet: "深い牢獄の囚人 ×4", planarSet: "蒼穹戦線グラモス ×2 / 宇宙封印ステーション ×2", mainStats: [{ slot: "胴体", value: "効果命中 / 攻撃力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "雷属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "EP回復効率 / 攻撃力%" }], targets: [{ key: "speed", label: "速度", unit: "", targets: { "厳選": 170, "目標": 160, "妥協": 156 } }, { key: "effectHitRate", label: "効果命中", unit: "%", targets: { "厳選": 90, "目標": 75, "妥協": 67 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2500, "妥協": 2300 } }, { key: "energyRecharge", label: "EP回復効率", unit: "%", targets: { "厳選": 19.4, "目標": 19.4, "妥協": 0 } }], targetContext: "カフカ専用：DoT即時起爆、追加能力Tortureの効果命中75%達成時の味方攻撃力、光円錐・味方・星魂の効果は戦闘中・編成条件であり、公開プロフィールへ加算しない。本人火力型の攻撃力3,600以上は別ビルドとして扱う。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "ブラックスワン": { headline: "アルカナとDoTを安定させるため、公開値の効果命中120%・攻撃力3,600・速度143を優先する。", relicSet: "深い牢獄の囚人 ×4", planarSet: "囚われの歌姫 ×2 / 蒼穹戦線グラモス ×2", mainStats: [{ slot: "胴体", value: "効果命中" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "風属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "effectHitRate", label: "効果命中", unit: "%", targets: { "厳選": 130, "目標": 120, "妥協": 100 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3900, "目標": 3600, "妥協": 3200 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 143, "妥協": 135 } }, { key: "hp", label: "HP", unit: "", targets: { "厳選": 3400, "目標": 3000, "妥協": 2800 } }], targetContext: "ブラックスワン専用：Candleflame's Portent、アルカナ蓄積、悟りによる被ダメージ増加、カフカより先行する行動順、味方・星魂の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "鏡流": { headline: "HP参照へ移行した特殊状態の火力を支えるため、公開値のHP6,000・会心率45%・会心ダメージ150%を優先し、速度型は135を選ぶ。", relicSet: "雪の密林の狩人 ×4 / 宝命長存の蒔者 ×4", planarSet: "自転が止まったサルソット ×2 / 奔狼の都藍王朝 ×2", mainStats: [{ slot: "胴体", value: "会心ダメ" }, { slot: "脚部", value: "HP% / 速度" }, { slot: "次元界オーブ", value: "氷属性ダメージ / HP%" }, { slot: "連結縄", value: "HP%" }], targets: [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 7000, "目標": 6000, "妥協": 5500 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 50, "目標": 45, "妥協": 40 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 130 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 135, "目標": 96, "妥協": 96 } }], targetContext: "鏡流専用：特殊状態の会心率+50%と月光由来の会心ダメージ、味方HP変動、行動順操作、星魂効果は戦闘中・条件付きのため公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GUIDE_OVERRIDES, {
  "ブローニャ": { headline: "主力より僅かに遅い行動順または速度160以上の高速型を選び、公開値の会心ダメージ150%・効果抵抗30%を整える。", relicSet: "再び苦難の道を歩む司祭 ×4", planarSet: "折れた竜骨 ×2", mainStats: [{ slot: "胴体", value: "会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 防御力%" }, { slot: "連結縄", value: "EP回復効率" }], targets: [{ key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 120 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 134, "妥協": 120 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 45, "目標": 30, "妥協": 20 } }], targetContext: "ブローニャ専用：高速型は速度160以上、調整型は主力アタッカーより速度を1〜2低くする。戦闘開始時の防御力・与ダメージ・味方攻撃力、E1〜E6のSP・速度・追加攻撃・継続時間効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
  "銀狼": { headline: "弱点付与を安定させるため、公開値の効果命中67%以上と速度160以上を優先する。", relicSet: "再び苦難の道を歩む司祭 ×2 / 仮想空間を漫遊するメッセンジャー ×2", planarSet: "海に沈んだルサカ ×2", mainStats: [{ slot: "胴体", value: "効果命中" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "量子属性ダメージ" }, { slot: "連結縄", value: "EP回復効率" }], targets: [{ key: "effectHitRate", label: "効果命中", unit: "%", targets: { "厳選": 96, "目標": 67, "妥協": 67 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 170, "目標": 160, "妥協": 145 } }], targetContext: "銀狼専用：専用光円錐を使う高速型は速度170を目安にする。弱点埋め込み・耐性低下・防御力低下、星魂のEP・与ダメージ効果は戦闘中または敵依存であり、公開プロフィールへ加算しない。hsr:1506の銀狼Lv.999にはこの基礎銀狼用ガイドを適用しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "符玄": { headline: "味方の生存を安定させるため、公開値のHP7,000・防御力1,500・速度134・効果抵抗30%を整える。", relicSet: "宝命長存の蒔者 ×2 / 雪の密林の狩人 ×2", planarSet: "折れた竜骨 ×2", mainStats: [{ slot: "胴体", value: "HP%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP%" }, { slot: "連結縄", value: "EP回復効率 / HP%" }], targets: [{ key: "hp", label: "HP", unit: "", targets: { "厳選": 8000, "目標": 7000, "妥協": 6500 } }, { key: "defense", label: "防御力", unit: "", targets: { "厳選": 1600, "目標": 1500, "妥協": 1400 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 143, "目標": 134, "妥協": 120 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }], targetContext: "符玄専用：行列中のHP・防御力の目安、被ダメージ分配、味方会心率・ダメージ軽減、E1〜E6の会心・蘇生・EP・必殺技効果は戦闘中・条件付きのため公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "羅刹": { headline: "結界中の継続回復を安定させるため、公開値の攻撃力2,400と速度135を優先する。", relicSet: "仮想空間を漫遊するメッセンジャー ×2 / 流雲無痕の過客 ×2", planarSet: "巨樹の葉を掴む静謐な荘園 ×2", mainStats: [{ slot: "胴体", value: "治癒量" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "攻撃力%" }, { slot: "連結縄", value: "EP回復効率 / 攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2800, "目標": 2400, "妥協": 2000 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 143, "目標": 135, "妥協": 120 } }], targetContext: "羅刹専用：高投資時の戦闘中速度180/200、結界の自動回復、味方攻撃力・会心ダメージ支援、E1〜E6の条件付き回復・デバフ効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GUIDE_OVERRIDES, {
  "アーチャー": { headline: "スキル連射の量子火力を安定させるため、公開値の会心率100%・会心ダメージ120%・攻撃力2,600を優先する。", relicSet: "知識の海に溺れる学者 ×4", planarSet: "奔狼の都藍王朝 ×2", mainStats: [{ slot: "胴体", value: "会心率" }, { slot: "脚部", value: "攻撃力%" }, { slot: "次元界オーブ", value: "量子属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 100, "目標": 100, "妥協": 90 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 150, "目標": 120, "妥協": 100 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2600, "妥協": 2300 } }], targetContext: "アーチャー専用：追加能力の会心ダメージ、SP供給、敵の量子耐性・防御力低下、味方の行動順支援、E1〜E6の条件付き効果は戦闘中・敵依存であり、公開プロフィールへ加算しない。速度は個別ガイドで優先不要とされるため比較対象に含めない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "アーラン": { headline: "低HP時の雷火力を支えるため、公開値の会心率60%・会心ダメージ120%・攻撃力2,500・速度135を整える。", relicSet: "知識の海に溺れる学者 ×4", planarSet: "蒼穹戦線グラモス ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "雷属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 70, "目標": 60, "妥協": 50 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 140, "目標": 120, "妥協": 100 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2800, "目標": 2500, "妥協": 2400 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 143, "目標": 135, "妥協": 134 } }], targetContext: "アーラン専用：HP消費による天賦の与ダメージ、低HP時のE1/E6、シールド・味方の会心/速度/攻撃力、E2/E4の解除・生存効果は戦闘中または条件付きのため公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "アスター": { headline: "味方への速度・攻撃力支援を安定させるため、公開値の速度134・HP3,800・防御力1,000を優先する。", relicSet: "仮想空間を漫遊するメッセンジャー ×4", planarSet: "折れた竜骨 ×2", mainStats: [{ slot: "胴体", value: "HP% / 防御力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 防御力%" }, { slot: "連結縄", value: "EP回復効率" }], targets: [{ key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 134, "妥協": 120 } }, { key: "hp", label: "HP", unit: "", targets: { "厳選": 4500, "目標": 3800, "妥協": 3400 } }, { key: "defense", label: "防御力", unit: "", targets: { "厳選": 1200, "目標": 1000, "妥協": 850 } }], targetContext: "アスター専用：必殺技の味方速度、天賦の味方攻撃力、炎ダメージ支援、E2/E4/E6のチャージ・EP変化、光円錐・遺物の戦闘中バフは公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "アルジェンティ": { headline: "180EP必殺技の範囲火力を支えるため、公開値の会心率60%・会心ダメージ150%・攻撃力2,500・速度134を整える。", relicSet: "知識の海に溺れる学者 ×4", planarSet: "自転が止まったサルソット ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "攻撃力% / 速度" }, { slot: "次元界オーブ", value: "物理属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 60, "妥協": 50 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 130 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2500, "妥協": 2200 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 143, "目標": 134, "妥協": 110 } }], targetContext: "アルジェンティ専用：天賦の戦闘中会心率、低HP敵への与ダメージ、E1/E2/E4/E6、味方のエネルギー・攻撃力・会心・行動順支援は公開プロフィールへ加算しない。速度110型は支援による行動順調整を前提とした代替である。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
});

Object.assign(GUIDE_OVERRIDES, {
  "ヴェルト": { headline: "虚数デバフと必殺技火力を支えるため、公開値の攻撃力2,500・速度135・効果命中80%・会心ダメージ120%を整える。", relicSet: "死水に潜る先駆者 ×4", planarSet: "汎銀河商事 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 効果命中" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "虚数属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 2800, "目標": 2500, "妥協": 2200 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 143, "目標": 135, "妥協": 120 } }, { key: "effectHitRate", label: "効果命中", unit: "%", targets: { "厳選": 100, "目標": 80, "妥協": 60 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 150, "目標": 120, "妥協": 100 } }], targetContext: "ヴェルト専用：会心率90%は戦闘中条件を含む目安として公開値には加えない。減速・禁錮・敵耐性低下、味方の会心・攻撃・行動順支援、E1〜E6の条件付き効果も公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "ギャラガー": { headline: "撃破と回復の両立を支えるため、公開値の速度143・撃破特効150%を優先する。", relicSet: "流雲無痕の過客 ×2 / 仮想空間を漫遊するメッセンジャー ×2", planarSet: "盗賊公国タリア ×2", mainStats: [{ slot: "胴体", value: "治癒量 / HP%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 防御力%" }, { slot: "連結縄", value: "撃破特効 / EP回復効率" }], targets: [{ key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 143, "妥協": 134 } }, { key: "breakEffect", label: "撃破特効", unit: "%", targets: { "厳選": 150, "目標": 120, "妥協": 60 } }], targetContext: "ギャラガー専用：治癒量変換上限の撃破特効150%は戦闘中の特性を伴う。光円錐・遺物・味方による撃破特効、酩酊の与ダメージ、E1〜E6の効果抵抗・弱点撃破効率・治癒は公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwen・Icy Veinsの更新日付き個別ビルド・PTガイドを照合" },
  "キュレネ": { headline: "記憶精霊とChrysos支援の回転を支えるため、公開値の速度180・HP4,000・会心率50%を整える。", relicSet: "再び苦難の道を歩む司祭 ×2 / 仮想空間を漫遊するメッセンジャー ×2", planarSet: "生命のウェンワーク ×2", mainStats: [{ slot: "胴体", value: "HP% / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 氷属性ダメージ" }, { slot: "連結縄", value: "HP%" }], targets: [{ key: "speed", label: "速度", unit: "", targets: { "厳選": 200, "目標": 180, "妥協": 160 } }, { key: "hp", label: "HP", unit: "", targets: { "厳選": 4500, "目標": 4000, "妥協": 3600 } }, { key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 60, "目標": 50, "妥協": 40 } }], targetContext: "キュレネ専用：速度180到達時の全体与ダメージ、必殺技後の会心率、記憶霊・Chrysos Heirへの固有バフ、真ダメージ、耐性貫通、行動順操作は戦闘中・条件付きのため公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・KeqingMainsの更新日付き個別ビルド・PTガイドを照合" },
  "ギルガメッシュ": { headline: "Interestを消費する雷火力を支えるため、公開値の攻撃力2,800・会心ダメージ120%を優先する。", relicSet: "知識の海に溺れる学者 ×4", planarSet: "宇宙生命科学研究所 ×2", mainStats: [{ slot: "胴体", value: "会心率" }, { slot: "脚部", value: "攻撃力%" }, { slot: "次元界オーブ", value: "雷属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2800, "妥協": 2600 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 150, "目標": 120, "妥協": 100 } }], targetContext: "ギルガメッシュ専用：会心率100%と速度上昇はInterestを含む戦闘中自己バフとして公開値には加えない。王の承認の防御無視、共同追撃、EP回復、味方耐性貫通、E1〜E6の条件付き効果も公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
});

const DEFAULT_GUIDE: GuideDefinition = {
  headline: "基礎火力を軸に、会心・速度・攻撃力の優先度を整える。",
  relicSet: "キャラクター適性に応じた属性セット ×4",
  planarSet: "攻撃系オーナメント ×2",
  mainStats: [
    { slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度 / 攻撃力%" }, { slot: "次元界オーブ", value: "属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" },
  ],
  targets: DAMAGE_TARGETS,
};

const STAT_MATCHERS: Record<StatKey, RegExp[]> = {
  critRate: [/crit.*rate/i, /critical.*chance/i, /会心率/i],
  critDmg: [/crit.*dmg/i, /critical.*damage/i, /会心ダメ/i],
  speed: [/^speed$/i, /spd/i, /速度/i],
  attack: [/^attack$/i, /^atk$/i, /攻撃力$/i],
  attackPercent: [/attack.*ratio/i, /atk.*ratio/i, /attack.*percent/i, /攻撃力%/i],
  breakEffect: [/break/i, /撃破特効/i],
  effectHitRate: [/effect.*hit/i, /status.*hit/i, /効果命中/i],
  effectRes: [/effect.*res/i, /status.*res/i, /効果抵抗/i],
  hp: [/^hp$/i, /^health$/i, /^HP$/],
  hpPercent: [/hp.*ratio/i, /hp.*percent/i, /HP%/i],
  defense: [/^defense$/i, /^defence$/i, /^def$/i, /^防御力$/],
  defPercent: [/def.*ratio/i, /def.*percent/i, /防御力%/i],
  energyRecharge: [/energy.*recharge/i, /charge.*efficiency/i, /元素チャージ/i],
  elementalMastery: [/elemental.*mastery/i, /元素熟知/i],
  anomalyMastery: [/anomaly.*mastery/i, /異常マスタリー/i],
  anomalyProficiency: [/anomaly.*proficiency/i, /異常掌握/i],
  impact: [/impact/i, /衝撃力/i],
  penRatio: [/pen.*ratio/i, /貫通率/i],
  energyRegen: [/energy.*regen/i, /energy.*recovery/i, /エネルギー自動回復/i],
};

function asRecord(value: unknown): RawRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RawRecord : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : fallback;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function statDisplay(stat: RawRecord): string {
  const shown = text(stat.display);
  if (shown) return shown;
  const value = nullableNumber(stat.value);
  if (value === null) return "—";
  const percent = stat.percent === true || text(stat.field).includes("ratio");
  return percent ? `${(value <= 1 ? value * 100 : value).toFixed(1)}%` : value.toFixed(0);
}

function statNumber(stat: RawRecord): number | null {
  const value = nullableNumber(stat.value);
  const display = statDisplay(stat);
  if (display.includes("%")) {
    const displayedPercent = Number.parseFloat(display.replace(/,/g, ""));
    if (Number.isFinite(displayedPercent)) return displayedPercent;
  }
  const isPercent = stat.percent === true || display.includes("%") || /ratio|percent/i.test(text(stat.field));
  if (value !== null) return isPercent && value <= 1 ? value * 100 : value;
  const parsed = Number.parseFloat(display.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

Object.assign(GUIDE_OVERRIDES, {
  "クラーラ": { headline: "カウンターの安定火力を支えるため、公開値では会心率を優先し、会心ダメージを1:2比率へ近づける。", relicSet: "成り上がりチャンピオン ×4 / 灰燼を燃やし尽くす大公 ×4", planarSet: "奔狼の都藍王朝 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "攻撃力%" }, { slot: "次元界オーブ", value: "物理属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 190, "目標": 160, "妥協": 130 } }], targetContext: "クラーラ専用：会心率を優先し会心率:会心ダメージを1:2へ近づける。反撃主体のため速度は主目標にせず、被弾・ヘイト・追加攻撃・光円錐・E2/E4/E6の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-21", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "ケリュドラ": { headline: "単体主力を強化するため、公開値では攻撃力4,000・会心ダメージ160%・主力より速い行動順を優先する。", relicSet: "再び苦難の道を歩む司祭 ×4", planarSet: "海に沈んだルサカ ×2", mainStats: [{ slot: "胴体", value: "会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "攻撃力%" }, { slot: "連結縄", value: "EP回復効率" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 4300, "目標": 4000, "妥協": 3600 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 180, "目標": 160, "妥協": 140 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 134, "妥協": 120 } }], targetContext: "ケリュドラ専用：速度は主力アタッカーより1以上速い行動順を優先する。追加能力上限の攻撃力4,000、軍功、必殺、味方支援、星魂の与ダメージ・防御無視・EP効果は戦闘中または条件付きであり公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8の更新日付き個別ビルド・PTガイドを照合" },
  "サフェル": { headline: "追加攻撃と記録ダメージを安定させるため、公開値では速度170以上を最優先にし、必要な効果命中を確保する。", relicSet: "死水に潜る先駆者 ×4 / 風雲を薙ぎ払う勇烈 ×2・メッセンジャー ×2", planarSet: "海に沈んだルサカ ×2 / 蒼穹戦線グラモス ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "量子属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "EP回復効率 / 攻撃力%" }], targets: [{ key: "speed", label: "速度", unit: "", targets: { "厳選": 180, "目標": 170, "妥協": 160 } }, { key: "effectHitRate", label: "効果命中", unit: "%", targets: { "厳選": 50, "目標": 39, "妥協": 30 } }], targetContext: "サフェル専用：速度170で追加能力の会心率・記録量上昇を得るが、これは戦闘時の効果として現在値へ加算しない。お得意様、敵被ダメージ増加、戦闘スキルの攻撃力、光円錐、E1〜E6の条件付き効果も公開プロフィールへ加算しない。", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合" },
  "サンポ": { headline: "風化とDoT被ダメージ増加を安定させるため、公開値では効果命中67%・攻撃力2,600・速度135以上を優先する。", relicSet: "深い牢獄の囚人 ×4", planarSet: "酩酊の海域 ×2 / 蒼穹戦線グラモス ×2", mainStats: [{ slot: "胴体", value: "効果命中 / 攻撃力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "風属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "effectHitRate", label: "効果命中", unit: "%", targets: { "厳選": 80, "目標": 67, "妥協": 60 } }, { key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 3000, "目標": 2600, "妥協": 2300 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 135, "妥協": 120 } }], targetContext: "サンポ専用：カフカ編成ではカフカより先行する速度135以上を基準にする。風化、必殺技のDoT被ダメージ増加、遺物・光円錐・味方・E1〜E6の条件付き効果は公開プロフィールへ加算しない。", dataAsOf: "2026-08-14", updatedAt: "2026-08-26", sourceLabel: "Game8・Prydwen・GameWithの更新日付き個別ビルド・PTガイドを照合" },
});

export function guideFor(name: string, path: string, identity?: Pick<CharacterIdentity, "variantOf">): GuideDefinition {
  const individualGuide = identity?.variantOf ? undefined : GUIDE_OVERRIDES[name];
  if (individualGuide) {
    return withGuideMetadata("hsr", { ...individualGuide, targetContext: individualGuide.targetContext ?? `${name}専用の有効ステータス目標です。編成・光円錐・戦闘中バフによる変動分は含みません。` }, name);
  }
  return withGuideMetadata("hsr", generatedHsrGuide(name, path), name);
}

function comparisonFor(properties: RawRecord[], target: TargetStatDefinition): StatComparison {
  const match = properties.find((property) => {
    const haystack = `${text(property.field)} ${text(property.name)}`;
    return STAT_MATCHERS[target.key].some((pattern) => pattern.test(haystack));
  });
  const current = match ? statNumber(match) : null;
  return {
    ...target,
    current,
    currentDisplay: match ? statDisplay(match) : "未取得",
    achieved: {
      "厳選": current === null ? null : current >= target.targets["厳選"],
      "目標": current === null ? null : current >= target.targets["目標"],
      "妥協": current === null ? null : current >= target.targets["妥協"],
    },
  };
}

function parseCharacter(source: RawRecord): CharacterProfile {
  const path = asRecord(source.path);
  const element = asRecord(source.element);
  const lightCone = asRecord(source.light_cone ?? source.lightCone);
  const properties = asArray(source.properties).map(asRecord);
  const identity = resolveCharacterIdentity("hsr", text(source.id, "unknown"), text(source.name));
  const name = identity.displayName;
  const guide = guideFor(name, text(path.name), identity);
  const hsrSlots = ["頭部", "手部", "胴体", "脚部", "次元界オーブ", "連結縄"];
  const relics = asArray(source.relics).map((entry, index) => {
    const relic = asRecord(entry);
    const main = asRecord(relic.main_affix ?? relic.mainAffix);
    return {
      id: text(relic.id, `${name}-relic-${index}`),
      name: text(relic.name, "遺物"),
      slot: hsrSlots[index] ?? text(relic.type ?? relic.slot),
      setName: text(relic.set_name ?? relic.setName),
      level: nullableNumber(relic.level),
      icon: text(relic.icon) || null,
      main: Object.keys(main).length ? { name: text(main.name), display: statDisplay(main) } : null,
      subs: asArray(relic.sub_affix ?? relic.subAffix).map(asRecord).map((sub) => ({ name: text(sub.name), display: statDisplay(sub) })),
    };
  });

  const comparisons = guide.targets.map((target) => comparisonFor(properties, target));
  const recommendations = priorityRecommendations(comparisons);
  return {
    id: identity.sourceId,
    identity,
    name,
    level: nullableNumber(source.level),
    rank: nullableNumber(source.rank),
    portrait: text(source.portrait ?? source.preview ?? source.icon) || null,
    element: text(element.name),
    elementColor: text(element.color) || null,
    path: text(path.name),
    lightCone: Object.keys(lightCone).length ? {
      name: text(lightCone.name, "光円錐"),
      level: nullableNumber(lightCone.level),
      rank: nullableNumber(lightCone.rank),
      icon: text(lightCone.icon) || null,
    } : null,
    relics,
    allStats: properties.map((stat) => ({ name: text(stat.name), display: statDisplay(stat), icon: text(stat.icon) || null })).filter((stat) => stat.name),
    guide,
    comparisons,
    recommendations,
    equipmentActions: equipmentActionsFor(guide, relics, recommendations),
    partyRecommendations: partyRecommendationsFor("hsr", name),
    constellations: constellationProfileFor(identity, nullableNumber(source.rank)),
  };
}

export function normalizeMihomoPayload(payload: unknown): Omit<BuildLookupResult, "cached" | "cacheExpiresAt" | "fetchedAt"> {
  const root = asRecord(payload);
  const player = asRecord(root.player);
  return {
    player: {
      uid: text(player.uid ?? root.uid),
      name: text(player.nickname ?? player.name, "開拓者"),
      level: nullableNumber(player.level),
    },
    characters: asArray(root.characters).map(asRecord).map(parseCharacter),
  };
}

export class UidResponseCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();

  getEntry(key: string, now = Date.now()): { value: T; expiresAt: number } | null {
    const entry = this.cache.get(key);
    if (!entry || entry.expiresAt <= now) {
      this.cache.delete(key);
      return null;
    }
    return entry;
  }

  get(key: string, now = Date.now()): T | null {
    return this.getEntry(key, now)?.value ?? null;
  }

  set(key: string, value: T, ttlMs: number, now = Date.now()): number {
    const expiresAt = now + ttlMs;
    this.cache.set(key, { value, expiresAt });
    return expiresAt;
  }
}

const lookupCache = new UidResponseCache<Omit<BuildLookupResult, "cached" | "cacheExpiresAt" | "fetchedAt">>();
const inFlightLookups = new Map<string, Promise<BuildLookupResult>>();
const FALLBACK_TTL_MS = 4 * 60 * 1000;
// リバースプロキシの要求上限内で Enka フォールバックを必ず試行できるよう、主取得には短い予算を割り当てる。
const MIHOMO_PRIMARY_TIMEOUT_MS = 6_000;

function ttlFromPayload(payload: unknown): number {
  const ttlSeconds = nullableNumber(asRecord(payload).ttl);
  if (ttlSeconds === null) return FALLBACK_TTL_MS;
  return Math.max(60_000, Math.min(ttlSeconds * 1000, 10 * 60 * 1000));
}

async function requestMihomo(uid: string): Promise<BuildLookupResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MIHOMO_PRIMARY_TIMEOUT_MS);
  try {
    const response = await fetch(`https://api.mihomo.me/sr_info_parsed/${encodeURIComponent(uid)}?lang=jp`, {
      headers: { "User-Agent": "Star-Rail-Build-Advisor/1.0 (personal-use)" },
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") ?? "";
    const rawBody = await response.text();
    const payload: unknown = contentType.toLowerCase().includes("application/json")
      ? JSON.parse(rawBody || "{}")
      : {};
    if (!response.ok || !contentType.toLowerCase().includes("application/json") || asRecord(payload).detail) {
      const detail = text(asRecord(payload).detail, "データを取得できませんでした。");
      const message = response.status === 429
        ? "照会が集中しています。数分後に再度お試しください。"
        : response.status >= 500 || !contentType.toLowerCase().includes("application/json")
          ? "外部データサービスが一時的に応答していません。数分後に再度お試しください。"
          : detail;
      throw new TRPCError({ code: response.status === 404 ? "NOT_FOUND" : "BAD_GATEWAY", message });
    }
    const normalized = normalizeMihomoPayload(payload);
    if (!normalized.characters.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "公開中のキャラクターが見つかりません。ゲーム内の巡星ビザ設定をご確認ください。" });
    }
    const expiresAt = lookupCache.set(uid, normalized, ttlFromPayload(payload));
    const fetchedAt = new Date().toISOString();
    return { ...normalized, dataSource: "MiHoMo", cached: false, fetchedAt, cacheExpiresAt: new Date(expiresAt).toISOString() };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: "BAD_GATEWAY", message: "外部データサービスへ接続できませんでした。少し時間を置いて再試行してください。", cause: error });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestEnka(uid: string): Promise<BuildLookupResult> {
  const fallback = await fetchEnkaPayload(uid);
  const expiresAt = lookupCache.set(uid, fallback.data, fallback.ttlSeconds === null ? FALLBACK_TTL_MS : Math.max(60_000, Math.min(fallback.ttlSeconds * 1000, 10 * 60 * 1000)));
  const fetchedAt = new Date().toISOString();
  return { ...fallback.data, dataSource: "Enka", cached: false, fetchedAt, cacheExpiresAt: new Date(expiresAt).toISOString() };
}

export async function lookupUidBuild(uid: string): Promise<BuildLookupResult> {
  const cached = lookupCache.getEntry(uid);
  if (cached) {
    const now = new Date();
    return { ...cached.value, cached: true, fetchedAt: now.toISOString(), cacheExpiresAt: new Date(cached.expiresAt).toISOString() };
  }
  const pending = inFlightLookups.get(uid);
  if (pending) return pending;
  const request = lookupWithFallback(() => requestMihomo(uid), () => requestEnka(uid)).finally(() => inFlightLookups.delete(uid));
  inFlightLookups.set(uid, request);
  return request;
}

export async function lookupWithFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch {
    return fallback();
  }
}
