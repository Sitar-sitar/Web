import type { GuideDefinition, TargetStatDefinition } from "./buildAdvisor";

type GameId = "hsr" | "genshin" | "zzz";
type ProfileId = "crit" | "dot" | "break" | "support" | "sustain" | "tank" | "hp" | "def" | "em" | "anomaly" | "stun" | "rupture";

const target = (key: TargetStatDefinition["key"], label: string, unit: "%" | "", strict: number, goal: number, base: number): TargetStatDefinition => ({ key, label, unit, targets: { "厳選": strict, "目標": goal, "妥協": base } });
const hsrMain = (value: string): GuideDefinition["mainStats"] => [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度 / 攻撃力%" }, { slot: "次元界オーブ", value: "属性ダメージ" }, { slot: "連結縄", value }];
const giMain = (clock: string, cup = "元素ダメージ", crown = "会心率 / 会心ダメージ"): GuideDefinition["mainStats"] => [{ slot: "時計", value: clock }, { slot: "杯", value: cup }, { slot: "冠", value: crown }];
const zzzMain = (iv: string, v: string, vi: string): GuideDefinition["mainStats"] => [{ slot: "IV", value: iv }, { slot: "V", value: v }, { slot: "VI", value: vi }];

const HSR_PROFILES: Record<Exclude<ProfileId, "em" | "anomaly" | "stun" | "rupture">, Omit<GuideDefinition, "headline">> = {
  crit: { relicSet: "公開ビルドに基づく火力向け遺物", planarSet: "会心・行動回数に合うオーナメント", mainStats: hsrMain("攻撃力%"), targets: [target("critRate", "会心率", "%", 85, 75, 65), target("critDmg", "会心ダメ", "%", 200, 170, 140), target("speed", "速度", "", 143, 134, 120), target("attackPercent", "攻撃力%", "%", 75, 60, 45)] },
  dot: { relicSet: "公開ビルドに基づく持続ダメージ向け遺物", planarSet: "速度・攻撃力向けオーナメント", mainStats: [{ slot: "胴体", value: "効果命中 / 攻撃力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }], targets: [target("effectHitRate", "効果命中", "%", 120, 90, 67), target("speed", "速度", "", 160, 147, 134), target("attackPercent", "攻撃力%", "%", 90, 75, 60)] },
  break: { relicSet: "公開ビルドに基づく撃破向け遺物", planarSet: "撃破特効・速度向けオーナメント", mainStats: [{ slot: "胴体", value: "攻撃力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "撃破特効" }], targets: [target("breakEffect", "撃破特効", "%", 300, 240, 180), target("speed", "速度", "", 160, 150, 145), target("attackPercent", "攻撃力%", "%", 60, 45, 30)] },
  support: { relicSet: "公開ビルドに基づく支援向け遺物", planarSet: "速度・耐久向けオーナメント", mainStats: [{ slot: "胴体", value: "HP% / 防御力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 防御力%" }, { slot: "連結縄", value: "EP回復効率" }], targets: [target("speed", "速度", "", 161, 145, 134), target("effectRes", "効果抵抗", "%", 45, 30, 20), target("hpPercent", "HP%", "%", 45, 32, 20)] },
  sustain: { relicSet: "公開ビルドに基づく耐久・回復向け遺物", planarSet: "速度・耐久向けオーナメント", mainStats: [{ slot: "胴体", value: "治癒量 / HP%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP% / 防御力%" }, { slot: "連結縄", value: "EP回復効率" }], targets: [target("speed", "速度", "", 160, 145, 134), target("effectRes", "効果抵抗", "%", 45, 30, 20), target("hpPercent", "HP%", "%", 50, 35, 25)] },
  tank: { relicSet: "公開ビルドに基づくバリア・防護向け遺物", planarSet: "耐久向けオーナメント", mainStats: [{ slot: "胴体", value: "防御力% / HP%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "防御力% / HP%" }, { slot: "連結縄", value: "EP回復効率 / 防御力%" }], targets: [target("speed", "速度", "", 150, 134, 120), target("defPercent", "防御力%", "%", 90, 70, 50), target("effectRes", "効果抵抗", "%", 45, 30, 20)] },
  hp: { relicSet: "公開ビルドに基づくHP依存火力向け遺物", planarSet: "HP・会心向けオーナメント", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度 / HP%" }, { slot: "次元界オーブ", value: "属性ダメージ / HP%" }, { slot: "連結縄", value: "HP%" }], targets: [target("critRate", "会心率", "%", 85, 75, 65), target("critDmg", "会心ダメ", "%", 200, 170, 140), target("hpPercent", "HP%", "%", 65, 50, 35)] },
  def: { relicSet: "公開ビルドに基づく防御依存向け遺物", planarSet: "防御・会心向けオーナメント", mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度 / 防御力%" }, { slot: "次元界オーブ", value: "防御力%" }, { slot: "連結縄", value: "防御力%" }], targets: [target("defPercent", "防御力%", "%", 100, 80, 60), target("critRate", "会心率", "%", 75, 65, 55), target("critDmg", "会心ダメ", "%", 180, 150, 120)] },
};

const GI_PROFILES: Record<"crit" | "hp" | "def" | "em" | "support" | "sustain", Omit<GuideDefinition, "headline">> = {
  crit: { relicSet: "公開ビルドに基づく会心火力向け聖遺物", planarSet: "編成・武器に応じて元素チャージ効率を調整", mainStats: giMain("攻撃力% / 元素熟知"), targets: [target("critRate", "会心率", "%", 85, 75, 65), target("critDmg", "会心ダメージ", "%", 220, 180, 150), target("energyRecharge", "元素チャージ効率", "%", 160, 130, 115)] },
  hp: { relicSet: "公開ビルドに基づくHP依存向け聖遺物", planarSet: "元素爆発を使う場合は元素チャージ効率を優先", mainStats: giMain("HP% / 元素チャージ効率", "HP% / 元素ダメージ"), targets: [target("hp", "HP", "", 45000, 38000, 32000), target("critRate", "会心率", "%", 80, 70, 60), target("energyRecharge", "元素チャージ効率", "%", 220, 180, 150)] },
  def: { relicSet: "公開ビルドに基づく防御力依存向け聖遺物", planarSet: "元素爆発を使う場合は元素チャージ効率を調整", mainStats: giMain("防御力%", "岩元素ダメージ / 防御力%"), targets: [target("defense", "防御力", "", 2800, 2400, 2000), target("critRate", "会心率", "%", 80, 70, 60), target("critDmg", "会心ダメージ", "%", 220, 180, 150)] },
  em: { relicSet: "公開ビルドに基づく元素反応向け聖遺物", planarSet: "元素熟知・元素チャージ効率を優先", mainStats: giMain("元素熟知", "元素熟知", "元素熟知"), targets: [target("elementalMastery", "元素熟知", "", 1000, 800, 650), target("energyRecharge", "元素チャージ効率", "%", 190, 160, 140)] },
  support: { relicSet: "公開ビルドに基づく支援向け聖遺物", planarSet: "元素爆発の循環と必要耐久を優先", mainStats: giMain("元素チャージ効率", "HP% / 攻撃力%", "会心率 / 与える治癒効果"), targets: [target("energyRecharge", "元素チャージ効率", "%", 250, 200, 170), target("hp", "HP", "", 35000, 28000, 23000)] },
  sustain: { relicSet: "公開ビルドに基づく回復・耐久向け聖遺物", planarSet: "元素爆発を使う場合は元素チャージ効率を優先", mainStats: giMain("HP% / 元素チャージ効率", "HP%", "HP% / 与える治癒効果"), targets: [target("hp", "HP", "", 45000, 38000, 30000), target("energyRecharge", "元素チャージ効率", "%", 220, 180, 150)] },
};

const ZZZ_PROFILES: Record<"crit" | "anomaly" | "stun" | "support" | "tank" | "rupture", Omit<GuideDefinition, "headline">> = {
  crit: { relicSet: "公開ビルドに基づく直撃火力向けドライバディスク", planarSet: "戦闘外会心率を起点に条件付き補正を加味", mainStats: zzzMain("会心率 / 会心ダメージ", "属性ダメージ / 貫通率", "攻撃力%"), targets: [target("critRate", "会心率", "%", 80, 70, 60), target("critDmg", "会心ダメージ", "%", 200, 160, 130), target("attack", "攻撃力", "", 3000, 2700, 2400)] },
  anomaly: { relicSet: "公開ビルドに基づく状態異常向けドライバディスク", planarSet: "異常マスタリーと攻撃力を優先", mainStats: zzzMain("異常マスタリー", "属性ダメージ / 攻撃力%", "異常掌握 / 異常マスタリー"), targets: [target("anomalyMastery", "異常マスタリー", "", 420, 360, 300), target("attack", "攻撃力", "", 3000, 2700, 2400)] },
  stun: { relicSet: "公開ビルドに基づくブレイク支援向けドライバディスク", planarSet: "衝撃力を優先し、必要な行動回数を確保", mainStats: zzzMain("会心率 / 攻撃力%", "属性ダメージ / 攻撃力%", "衝撃力"), targets: [target("impact", "衝撃力", "", 190, 175, 160), target("attack", "攻撃力", "", 2600, 2300, 2000)] },
  support: { relicSet: "公開ビルドに基づく支援向けドライバディスク", planarSet: "バフ条件に必要な固有ステータスを優先", mainStats: zzzMain("攻撃力% / HP%", "攻撃力% / HP%", "エネルギー自動回復"), targets: [target("attack", "攻撃力", "", 3600, 3200, 2800), target("energyRegen", "エネルギー自動回復", "", 1.8, 1.2, 0.8)] },
  tank: { relicSet: "公開ビルドに基づく防護向けドライバディスク", planarSet: "HP・防御力・固有バフ条件を優先", mainStats: zzzMain("HP% / 防御力%", "HP% / 防御力%", "HP% / 攻撃力%"), targets: [target("hpPercent", "HP%", "%", 55, 40, 30), target("attack", "攻撃力", "", 2400, 2100, 1800)] },
  rupture: { relicSet: "公開ビルドに基づく命破向けドライバディスク", planarSet: "HP・会心・固有スケーリングを優先", mainStats: zzzMain("会心率 / 会心ダメージ", "属性ダメージ / HP%", "HP% / 攻撃力%"), targets: [target("critRate", "会心率", "%", 80, 70, 60), target("critDmg", "会心ダメージ", "%", 200, 160, 130), target("hpPercent", "HP%", "%", 50, 35, 25)] },
};

const GENS_HIT_REACTION = new Set(["楓原万葉", "スクロース", "ウェンティ", "早柚", "夢見月瑞希", "ナヒーダ", "久岐忍", "雷主人公"]);
const GENS_HP = new Set(["胡桃", "夜蘭", "フリーナ", "ヌヴィレット", "ニィロウ", "鍾離", "珊瑚宮心海", "白朮", "シグウィン", "キャンディス", "トーマ", "ディシア", "レイラ", "シャルロット", "ダリア"]);
const GENS_DEF = new Set(["荒瀧一斗", "千織", "アルベド", "ノエル", "雲菫", "ゴロー", "シロネン", "カチーナ"]);
const GENS_SUPPORT = new Set(["ベネット", "九条裟羅", "ファルザン", "オロルン", "イアンサ", "藍硯", "ヨォーヨ", "コレイ", "ディオナ", "バーバラ", "七七", "ドリー"]);
const HSR_DOT = new Set(["カフカ", "ブラックスワン", "サンポ", "ルカ", "桂乃芬", "セイレンス", "ヒーゼル", "ダリア"]);
const HSR_BREAK = new Set(["ホタル", "ブートヒル", "乱破", "帰忘の流離人", "ルアン・メェイ", "ギャラガー", "霊砂"]);
const HSR_HP = new Set(["刃", "キャストリス", "モーディス", "ヒアンシー", "長夜月"]);
const HSR_DEF = new Set(["アベンチュリン"]);
const HSR_SUSTAIN = new Set(["白露", "羅刹", "フォフォ", "リンクス", "ナターシャ", "ジェパード", "符玄", "丹恒・騰荒"]);
const HSR_PATH_LABELS: Record<string, string> = { Warrior: "壊滅", Rogue: "巡狩", Mage: "知恵", Shaman: "調和", Knight: "存護", Warlock: "虚無", Priest: "豊穣", Memory: "記憶", Elation: "歓楽" };

function copyProfile(name: string, profileId: string, profile: Omit<GuideDefinition, "headline">, label: string): GuideDefinition {
  return { ...profile, profileId, headline: `${name}の${label}を軸に、公開プロフィールで比較できる有効ステータスを整える。` };
}

export function generatedHsrGuide(name: string, path: string): GuideDefinition {
  const normalizedPath = HSR_PATH_LABELS[path] ?? path;
  const profileId = HSR_DOT.has(name) ? "dot" : HSR_BREAK.has(name) ? "break" : HSR_HP.has(name) ? "hp" : HSR_DEF.has(name) ? "def" : HSR_SUSTAIN.has(name) ? "sustain" : normalizedPath === "調和" || normalizedPath === "記憶" ? "support" : normalizedPath === "存護" ? "tank" : "crit";
  return { ...copyProfile(name, profileId, HSR_PROFILES[profileId], "個別ビルド方針"), targetContext: `${name}用の現行公開ガイドを、公開プロフィールと比較可能な戦闘外ステータスへ整理した目安です。` };
}

export function generatedGenshinGuide(name: string): GuideDefinition {
  const profileId = GENS_HIT_REACTION.has(name) ? "em" : GENS_HP.has(name) ? "hp" : GENS_DEF.has(name) ? "def" : GENS_SUPPORT.has(name) ? "support" : "crit";
  return { ...copyProfile(name, profileId, GI_PROFILES[profileId], "個別ビルド方針"), targetContext: `${name}用の現行公開ビルドを、武器・編成・元素反応による変動を除いた比較目安として整理しています。` };
}

export function generatedZzzGuide(name: string, profession: string): GuideDefinition {
  const profileId = profession === "Anomaly" ? "anomaly" : profession === "Stun" ? "stun" : profession === "Support" ? "support" : profession === "Defense" ? "tank" : profession === "Rupture" ? "rupture" : "crit";
  return { ...copyProfile(name, profileId, ZZZ_PROFILES[profileId], "個別ビルド方針"), targetContext: `${name}用の現行公開ビルドを、推定最終ステータスと比較できる戦闘外目安として整理しています。` };
}
