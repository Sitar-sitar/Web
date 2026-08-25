import { TRPCError } from "@trpc/server";
import { fetchEnkaPayload } from "./enkaFallback";
import { generatedHsrGuide } from "./individualGuides";
import { guideMetadataFor } from "./characterGuideMetadata";
import { partyRecommendationsFor, type PartyRecommendationSet } from "./partyRecommendations";
import { resolveCharacterIdentity, type CharacterIdentity } from "./characterIdentity";

export type TierName = "厳選" | "目標" | "妥協";
export type StatKey = "critRate" | "critDmg" | "speed" | "attack" | "attackPercent" | "breakEffect" | "effectHitRate" | "effectRes" | "hp" | "hpPercent" | "defense" | "defPercent" | "energyRecharge" | "elementalMastery" | "anomalyMastery" | "impact" | "penRatio" | "energyRegen";

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
  energyRecharge: ["元素チャージ", "EP回復", "エネルギー"], elementalMastery: ["元素熟知"], anomalyMastery: ["異常マスタリー"], impact: ["衝撃力"], penRatio: ["貫通"], energyRegen: ["エネルギー"],
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
    headline: "超撃破を軸に、速度と撃破特効の均衡を整える。",
    relicSet: "鉄騎の執行者 ×4",
    planarSet: "劫火と灯鋒 ×2",
    mainStats: [
      { slot: "胴体", value: "攻撃力%" },
      { slot: "脚部", value: "速度" },
      { slot: "次元界オーブ", value: "攻撃力%" },
      { slot: "連結縄", value: "撃破特効" },
    ],
    targets: BREAK_TARGETS,
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
  "黄泉": damageGuide("必殺技を主軸に、会心と速度をバランス良く高める。", "死水に潜る先駆者 ×4", "出雲顕世と高天神国 ×2"),
  "ゼーレ": damageGuide("再現性のある連続行動へ、会心の安定感を優先する。", "星の如く輝く天才 ×4", "サルソットの出陣 ×2"),
  "景元": damageGuide("神君の追撃を伸ばすため、会心と攻撃力を整える。", "灰燼を燃やし尽くす大公 ×4", "サルソットの出陣 ×2"),
  "姫子": damageGuide("追加攻撃の回転と瞬間火力を、会心ステータスで支える。", "灰燼を燃やし尽くす大公 ×4", "サルソットの出陣 ×2"),
  "Dr.レイシオ": damageGuide("単体への追加攻撃を最大化する、会心重視の設計。", "荒海を歩む旅人 ×4", "サルソットの出陣 ×2"),
  "トパーズ＆カブ": damageGuide("追加攻撃の頻度と火力を、会心と攻撃力で支える。", "灰燼を燃やし尽くす大公 ×4", "サルソットの出陣 ×2"),
  "飲月": damageGuide("強化通常攻撃の一撃を、会心比率で磨き上げる。", "荒海を歩む旅人 ×4", "ルサカの海中世界 ×2"),
  "刃": { headline: "HPを基盤に、会心と速度で追加攻撃の価値を高める。", relicSet: "宝命長存の蒔者 ×4", planarSet: "自転が止まったサルソット ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "風属性ダメージ / HP%" }, { slot: "連結縄", value: "HP%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 190, "目標": 160, "妥協": 130 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 134, "目標": 134, "妥協": 120 } }, { key: "hpPercent", label: "HP%", unit: "%", targets: { "厳選": 55, "目標": 45, "妥協": 35 } }] },
  "ブートヒル": { headline: "弱点撃破へ直結する、速度と撃破特効を研ぎ澄ます。", relicSet: "流星の跡を追う怪盗 ×2 / 鉄騎の執行者 ×2", planarSet: "盗賊公国タリア ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "物理属性ダメージ" }, { slot: "連結縄", value: "撃破特効" }], targets: BREAK_TARGETS },
  "ルアン・メェイ": { headline: "撃破特効と速度で、味方全体の戦闘テンポを形作る。", relicSet: "流星の跡を追う怪盗 ×2 / 仮想空間を漫遊するメッセンジャー ×2", planarSet: "盗賊公国タリア ×2", mainStats: [{ slot: "胴体", value: "HP% / 防御力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 防御力%" }, { slot: "連結縄", value: "撃破特効" }], targets: [{ key: "breakEffect", label: "撃破特効", unit: "%", targets: { "厳選": 180, "目標": 160, "妥協": 140 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 145, "妥協": 134 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }] },
  "花火": supportGuide("会心ダメージと高速行動で、主力アタッカーを引き上げる。", "仮想空間を漫遊するメッセンジャー ×4", "折れた竜骨 ×2", [{ key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 230, "目標": 200, "妥協": 170 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 161, "目標": 160, "妥協": 145 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }]),
  "ブローニャ": supportGuide("行動順の最適化を最優先に、耐久を添える。", "仮想空間を漫遊するメッセンジャー ×4", "折れた竜骨 ×2"),
  "符玄": { headline: "味方の生存を支えるため、HP・防御・速度を厚く積む。", relicSet: "宝命長存の蒔者 ×2 / 純庭教会の聖騎士 ×2", planarSet: "竜骨の守護者 ×2", mainStats: [{ slot: "胴体", value: "HP%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP%" }, { slot: "連結縄", value: "HP% / EP回復効率" }], targets: SUPPORT_TARGETS },
  "アベンチュリン": { headline: "防御力を基盤に、バリアと追加攻撃の両面を整える。", relicSet: "純庭教会の聖騎士 ×4", planarSet: "ベロブルグの建築家 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ / 防御力%" }, { slot: "脚部", value: "速度 / 防御力%" }, { slot: "次元界オーブ", value: "防御力%" }, { slot: "連結縄", value: "防御力%" }], targets: [{ key: "speed", label: "速度", unit: "", targets: { "厳選": 134, "目標": 134, "妥協": 120 } }, { key: "defPercent", label: "防御力%", unit: "%", targets: { "厳選": 90, "目標": 70, "妥協": 50 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }] },
  "フォフォ": supportGuide("回復と必殺技回転を安定させる、速度中心の構成。", "仮想空間を漫遊するメッセンジャー ×2 / 流雲無痕の過客 ×2", "折れた竜骨 ×2"),
  "ギャラガー": { headline: "弱点撃破と回復の両立を、撃破特効と速度で組み立てる。", relicSet: "流星の跡を追う怪盗 ×2 / 仮想空間を漫遊するメッセンジャー ×2", planarSet: "盗賊公国タリア ×2", mainStats: [{ slot: "胴体", value: "治癒量 / HP%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP%" }, { slot: "連結縄", value: "撃破特効" }], targets: [{ key: "breakEffect", label: "撃破特効", unit: "%", targets: { "厳選": 180, "目標": 150, "妥協": 120 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 145, "妥協": 134 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }] },
  "キャストリス": { headline: "HPを火力へ転換するため、会心とHPを優先して整える。", relicSet: "詩人のサルソー ×4", planarSet: "巨樹の葉を掴む静謐な荘園 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "HP% / 速度" }, { slot: "次元界オーブ", value: "量子属性ダメージ / HP%" }, { slot: "連結縄", value: "HP%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 80, "目標": 70, "妥協": 60 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 220, "目標": 180, "妥協": 150 } }, { key: "hp", label: "HP", unit: "", targets: { "厳選": 10000, "目標": 8500, "妥協": 7500 } }] },
  "アグライア": { headline: "召喚物の手数を支える速度と、会心比率を優先する。", relicSet: "流星を追う怪盗 ×4", planarSet: "奔狼の都藍王朝 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "雷属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 190, "目標": 160, "妥協": 130 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 134, "妥協": 120 } }] },
  "アナイクス": damageGuide("拡散攻撃の総火力を、会心・攻撃力・行動回数で支える。", "知識の海に溺れる学者 ×4", "出雲顕世と高天神国 ×2"),
  "飛霄": damageGuide("追加攻撃と必殺技の確定会心を活かし、会心ダメージを優先する。", "風雲を薙ぎ払う勇烈 ×4", "自転が止まったサルソット ×2", [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 90, "目標": 80, "妥協": 70 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 210, "目標": 180, "妥協": 150 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 143, "目標": 134, "妥協": 120 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 70, "目標": 55, "妥協": 40 } }]),
  "雲璃": damageGuide("反撃の一撃を安定させるため、会心と攻撃力を優先する。", "灰燼を燃やし尽くす大公 ×4", "自転が止まったサルソット ×2"),
  "霊砂": { headline: "撃破特効を回復・追加攻撃へ還元するため、速度と撃破特効を整える。", relicSet: "蝗害を掃討せし鉄騎 ×4", planarSet: "盗賊公国タリア ×2", mainStats: [{ slot: "胴体", value: "治癒量 / 攻撃力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "攻撃力%" }, { slot: "連結縄", value: "撃破特効" }], targets: [{ key: "breakEffect", label: "撃破特効", unit: "%", targets: { "厳選": 220, "目標": 180, "妥協": 150 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 145, "妥協": 134 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 60, "目標": 45, "妥協": 30 } }] },
  "椒丘": { headline: "必殺技の付与を安定させるため、効果命中と速度を最優先する。", relicSet: "死水に潜る先駆者 ×2 / 仮想空間を漫遊するメッセンジャー ×2", planarSet: "海に沈んだルサカ ×2", mainStats: [{ slot: "胴体", value: "効果命中" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 炎属性ダメージ" }, { slot: "連結縄", value: "EP回復効率" }], targets: [{ key: "effectHitRate", label: "効果命中", unit: "%", targets: { "厳選": 178, "目標": 160, "妥協": 140 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 145, "妥協": 134 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }] },
  "ブラックスワン": { headline: "持続ダメージの命中と行動回数を、効果命中・速度・攻撃力で整える。", relicSet: "深い牢獄の囚人 ×4", planarSet: "囚われの歌姫 ×2", mainStats: [{ slot: "胴体", value: "効果命中" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "風属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "effectHitRate", label: "効果命中", unit: "%", targets: { "厳選": 150, "目標": 120, "妥協": 100 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 147, "妥協": 134 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 90, "目標": 75, "妥協": 60 } }] },
  "サンデー": { headline: "会心ダメージによる支援量と、主力に合わせた行動順を優先する。", relicSet: "仮想空間を漫遊するメッセンジャー ×4", planarSet: "海に沈んだルサカ ×2", mainStats: [{ slot: "胴体", value: "会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 防御力%" }, { slot: "連結縄", value: "EP回復効率" }], targets: [{ key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 230, "目標": 200, "妥協": 170 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 161, "目標": 134, "妥協": 120 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }] },
  "ロビン": { headline: "攻撃力から得る支援効果を優先し、必殺技循環を補助する。", relicSet: "仮想空間を漫遊するメッセンジャー ×2 / 野穂伴う快走の盗賊 ×2", planarSet: "海に沈んだルサカ ×2", mainStats: [{ slot: "胴体", value: "攻撃力%" }, { slot: "脚部", value: "攻撃力%" }, { slot: "次元界オーブ", value: "攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "attack", label: "攻撃力", unit: "", targets: { "厳選": 4000, "目標": 3500, "妥協": 3000 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 134, "目標": 120, "妥協": 110 } }, { key: "effectRes", label: "効果抵抗", unit: "%", targets: { "厳選": 40, "目標": 30, "妥協": 20 } }] },
  "クラーラ": { headline: "反撃の確実なダメージを、会心と攻撃力で優先して高める。", relicSet: "灰燼を燃やし尽くす大公 ×4 / 成り上がりチャンピオン ×4", planarSet: "自転が止まったサルソット ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "攻撃力%" }, { slot: "次元界オーブ", value: "物理属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 190, "目標": 160, "妥協": 130 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 100, "目標": 85, "妥協": 70 } }] },
  "サフェル": { headline: "追撃と追加ダメージの回転を、会心・速度・攻撃力で整える。", relicSet: "灰燼を燃やし尽くす大公 ×4", planarSet: "奔狼の都藍王朝 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "量子属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 200, "目標": 170, "妥協": 140 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 160, "目標": 134, "妥協": 120 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 75, "目標": 60, "妥協": 45 } }] },
  "マダム・ヘルタ": { headline: "知恵の範囲火力を伸ばすため、会心・攻撃力・行動回数を優先する。", relicSet: "灰燼を燃やし尽くす大公 ×4", planarSet: "奔狼の都藍王朝 ×2", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度 / 攻撃力%" }, { slot: "次元界オーブ", value: "氷属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }], targets: [{ key: "critRate", label: "会心率", unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 } }, { key: "critDmg", label: "会心ダメ", unit: "%", targets: { "厳選": 220, "目標": 180, "妥協": 150 } }, { key: "speed", label: "速度", unit: "", targets: { "厳選": 143, "目標": 134, "妥協": 120 } }, { key: "attackPercent", label: "攻撃力%", unit: "%", targets: { "厳選": 80, "目標": 65, "妥協": 50 } }] },
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
