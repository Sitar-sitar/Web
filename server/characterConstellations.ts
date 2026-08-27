import type { CharacterIdentity } from "./characterIdentity";
import type { StatKey, TierName } from "./buildAdvisor";

export type LocalizedText = { ja: string; en: string; "zh-CN": string };
export type ConstellationTargetChange = {
  key: StatKey;
  label: LocalizedText;
  unit: "%" | "";
  targets: Record<TierName, number>;
  reason: LocalizedText;
};
export type ConstellationEffect = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  name: LocalizedText;
  description: LocalizedText;
  targetChanges?: ConstellationTargetChange[];
  caution?: LocalizedText;
};
export type ConstellationProfile = {
  rankLabel: LocalizedText;
  acquiredRank: number;
  dataStatus: "curated" | "preparing";
  gameVersion: string;
  dataAsOf: string;
  updatedAt: string;
  sourceLabel: LocalizedText;
  sourceUrl: string;
  effects: ConstellationEffect[];
  activeTargetChanges: ConstellationTargetChange[];
};

const t = (ja: string, en: string, zh: string): LocalizedText => ({ ja, en, "zh-CN": zh });
const target = (key: StatKey, ja: string, en: string, zh: string, unit: "%" | "", strict: number, goal: number, baseline: number, reasonJa: string, reasonEn: string, reasonZh: string): ConstellationTargetChange => ({ key, label: t(ja, en, zh), unit, targets: { "厳選": strict, "目標": goal, "妥協": baseline }, reason: t(reasonJa, reasonEn, reasonZh) });
function effect(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  jaName: string,
  enName: string,
  zhNameOrJa: string,
  jaOrEn: string,
  enOrZh: string,
  zhOrOptions?: string | Pick<ConstellationEffect, "targetChanges" | "caution">,
  maybeOptions: Pick<ConstellationEffect, "targetChanges" | "caution"> = {},
): ConstellationEffect {
  const shorthand = typeof zhOrOptions !== "string";
  const zhName = shorthand
    ? jaName.replaceAll("命ノ星座", "命之座").replaceAll("心象映画", "心象电影")
    : zhNameOrJa;
  const ja = shorthand ? zhNameOrJa : jaOrEn;
  const en = shorthand ? jaOrEn : enOrZh;
  const zh = shorthand ? enOrZh : zhOrOptions;
  const options = (shorthand ? zhOrOptions : maybeOptions) ?? {};
  return { level, name: t(jaName, enName, zhName), description: t(ja, en, zh), ...options };
}

type CuratedEntry = Omit<ConstellationProfile, "rankLabel" | "acquiredRank" | "dataStatus" | "activeTargetChanges">;

const SOURCE = {
  hsr: { gameVersion: "4.4", sourceLabel: t("Game8・StarRailStaticAPIの公開データを照合", "Cross-checked against Game8 and StarRailStaticAPI public data", "已对照Game8与StarRailStaticAPI公开数据"), sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/437263" },
  genshin: { gameVersion: "7.0", sourceLabel: t("Game8の更新日付き公開ガイドを照合", "Cross-checked against Game8's dated public guides", "已对照Game8带更新日期的公开指南"), sourceUrl: "https://game8.co/games/Genshin-Impact/archives/Furina-Best-Builds" },
  zzz: { gameVersion: "3.1", sourceLabel: t("Game8の更新日付き公開ガイドを照合", "Cross-checked against Game8's dated public guides", "已对照Game8带更新日期的公开指南"), sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/436881" },
} as const;

const CURATED: Record<string, CuratedEntry> = {
  "hsr:1310": {
    ...SOURCE.hsr, dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "安眠せし赤染の繭", "In Red Cocoon, Once Slumbering", "沉眠绯茧", "強化戦闘スキルで防御力を15%無視し、SPを消費しない。", "Enhanced Skill ignores 15% DEF and consumes no Skill Point.", "强化战技无视15%防御力且不消耗战技点。"),
      effect(2, "砕かれし空からの墜落", "From Shattered Sky I Free Fall", "自破碎天空坠落", "完全燃焼中、撃破または敵撃破で追加ターンを得る（1ターンの再発動制限）。", "During Complete Combustion, defeating or breaking an enemy grants an extra turn, once per turn.", "完全燃烧期间击杀或击破敌人可获得额外回合，每回合限一次。"),
      effect(3, "静かな星の川で眠る", "Amidst Quiet Stars, I Rest", "静谧星河中安眠", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
      effect(4, "いつか蛍火をこの目に", "Upon Firefly's Flicker", "终将目睹萤火", "完全燃焼中の効果抵抗を50%上げる。", "Raises Effect RES by 50% during Complete Combustion.", "完全燃烧期间效果抵抗提高50%。"),
      effect(5, "夢なき長い夜が明ける", "When Long Night Dreams End", "无梦长夜终将破晓", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
      effect(6, "終わりの明日に咲き誇る", "In Final Morning, Bloom", "于终末之晨绽放", "完全燃焼中に炎耐性貫通20%と弱点撃破効率50%を得る。", "During Complete Combustion, gains 20% Fire RES PEN and 50% Weakness Break Efficiency.", "完全燃烧期间获得20%火属性抗性穿透与50%弱点击破效率。"),
    ],
  },
  "hsr:1402": {
    ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/485982", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "Drift at the Whim of Venus", "Drift at the Whim of Venus", "随维纳斯之意漂流", "「縫い目」の敵の被ダメージを15%上げ、アグライアまたはガーメントメーカーの攻撃後にEPを20回復する。", "Seam Stitch targets take 15% more DMG; attacking them restores 20 Energy.", "带有「缝线」的敌人受到伤害提高15%，攻击后回复20点能量。"),
      effect(2, "Sail on the Raft of Eyelids", "Sail on the Raft of Eyelids", "于眼睑之筏航行", "アグライアまたはガーメントメーカーの行動時、与ダメージが敵防御力を最大42%無視する。", "When Aglaea or Garmentmaker acts, their DMG can ignore up to 42% DEF.", "阿格莱雅或衣匠行动时，造成的伤害最多无视42%防御力。"),
      effect(3, "Bequeath in the Coalescence of Dew", "Bequeath in the Coalescence of Dew", "于露水凝结处授予", "戦闘スキルを2、通常攻撃とメモスプライト天賦を1レベル上げる。", "Raises Skill by 2 and Basic ATK plus Memosprite Talent by 1.", "战技提高2级，普攻与忆灵天赋提高1级。"),
      effect(4, "Flicker Below the Surface of Marble", "Flicker Below the Surface of Marble", "大理石表面下的闪烁", "メモスプライト天賦の速度上昇の上限を1層増やし、攻撃後にガーメントメーカーも同効果を得る。", "Raises the Memosprite Talent SPD-boost cap and lets Garmentmaker gain it after Aglaea attacks.", "提高忆灵天赋速度增益的层数上限，并使衣匠在阿格莱雅攻击后获得该效果。"),
      effect(5, "Weave Under the Shroud of Woe", "Weave Under the Shroud of Woe", "于哀伤帷幕下编织", "必殺技と天賦を2、メモスプライトスキルを1レベル上げる。", "Raises Ultimate and Talent by 2 and Memosprite Skill by 1.", "终结技与天赋提高2级，忆灵技提高1级。"),
      effect(6, "Fluctuate in the Tapestry of Fates", "Fluctuate in the Tapestry of Fates", "于命运织锦中起伏", "至高の姿中に雷属性耐性貫通20%を得て、速度に応じ連携攻撃ダメージを最大60%上げる。", "In Supreme Stance, gains 20% Lightning RES PEN and up to 60% Joint ATK DMG based on SPD.", "在至高姿态下获得20%雷属性抗性穿透，并按速度使联合攻击伤害最多提高60%。"),
    ],
  },
  "hsr:1405": {
    ...SOURCE.hsr, sourceUrl: "https://www.icy-veins.com/honkai-star-rail/anaxa-profile", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "Magician, Isolated by Stars", "Magician, Isolated by Stars", "被群星孤立的魔术师", "戦闘スキル初回使用時にSPを1回復し、スキル命中対象の防御力を16%下げる（2ターン）。", "The first Skill restores 1 SP; Skill hits reduce target DEF by 16% for 2 turns.", "首次施放战技回复1点战技点；战技命中使目标防御力降低16%，持续2回合。"),
      effect(2, "Soul, True to History", "Soul, True to History", "忠于历史的灵魂", "敵の登場時に天賦の弱点付与を1回発動し、全属性耐性を20%下げる。", "When enemies enter, triggers a Talent Weakness Implant and reduces All-Type RES by 20%.", "敌人入场时触发一次天赋弱点植入，并使全属性抗性降低20%。"),
      effect(3, "Pupil, Etched into Cosmos", "Pupil, Etched into Cosmos", "刻入宇宙的瞳孔", "必殺技を2、通常攻撃を1レベル上げる。", "Raises Ultimate by 2 and Basic ATK by 1.", "终结技提高2级，普攻提高1级。"),
      effect(4, "Blaze, Plunged to Canyon", "Blaze, Plunged to Canyon", "坠入峡谷的火焰", "戦闘スキル使用時、攻撃力を30%上げる（2ターン、最大2層）。", "Using Skill grants 30% ATK for 2 turns, stacking up to 2 times.", "施放战技后攻击力提高30%，持续2回合，最多叠加2层。"),
      effect(5, "Embryo, Set Beyond Vortex", "Embryo, Set Beyond Vortex", "置于漩涡之外的胚胎", "戦闘スキルと天賦を3レベル上げる。", "Raises Skill and Talent by 3.", "战技与天赋提高3级。"),
      effect(6, "Everything Is in Everything", "Everything Is in Everything", "万物皆在万物之中", "アナイクスの与ダメージを130%にし、追加能力「必然的中断」の両効果を編成条件なしで発動する。", "Sets Anaxa's DMG to 130% and activates both Imperative Hiatus effects without team restrictions.", "使阿那克萨造成的伤害变为130%，并无队伍限制触发「必然性中断」的两种效果。"),
    ],
  },
  "hsr:1407": {
    ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/486305", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "Snowbound Maiden, Memory to Tomb", "Snowbound Maiden, Memory to Tomb", "雪葬的少女", "敵のHPが最大HPの80%/50%以下の時、主要攻撃とメモスプライト攻撃のダメージ倍率を120%/140%にする。", "Against enemies at 80%/50% or less of Castorice's Max HP, key attacks deal 120%/140% of original DMG.", "敌人生命低于卡斯托丽斯最大生命值的80%/50%时，主要攻击与忆灵攻击造成120%/140%的原伤害。"),
      effect(2, "Crown on Wings of Bloom", "Crown on Wings of Bloom", "绽放之翼的冠冕", "メモスプライト召喚後に「灼意」を2層得てHP消費を相殺し、行動順を100%早め、新芽を最大値の30%得る。", "After summoning Netherwing, gains two Ardent Will stacks, offsets HP cost, advances 100%, and gains 30% max Newbud.", "召唤死龙后获得2层「炽意」，抵消生命消耗、行动提前100%，并获得最大新蕊的30%。"),
      effect(3, "Pious Pilgrim, Dance in Doom", "Pious Pilgrim, Dance in Doom", "虔诚旅者，末路起舞", "必殺技を2、通常攻撃とメモスプライト天賦を1レベル上げる。", "Raises Ultimate by 2 and Basic ATK plus Memosprite Talent by 1.", "终结技提高2级，普攻与忆灵天赋提高1级。"),
      effect(4, "Rest in Songs of Gloom", "Rest in Songs of Gloom", "安眠于哀歌", "キャストリスがフィールド上にいる間、味方の被回復量を20%上げる。", "While Castorice is on the field, allies receive 20% more healing.", "卡斯托丽斯在场时，全队受治疗量提高20%。"),
      effect(5, "Pristine Pages, Prophecy as Plume", "Pristine Pages, Prophecy as Plume", "洁白书页，预言为羽", "戦闘スキルと天賦を2、メモスプライトスキルを1レベル上げる。", "Raises Skill and Talent by 2 and Memosprite Skill by 1.", "战技与天赋提高2级，忆灵技提高1级。"),
      effect(6, "Await for Years to Loom", "Await for Years to Loom", "静候岁月织就", "キャストリスまたは死龍の攻撃時、量子耐性貫通20%を得る。死龍は弱点タイプを無視して靭性を削る。", "Castorice or Netherwing attacks gain 20% Quantum RES PEN; Netherwing can reduce Toughness regardless of Weakness Type.", "卡斯托丽斯或死龙攻击时获得20%量子抗性穿透；死龙可无视弱点类型削减韧性。"),
    ],
  },
  "hsr:1309": {
    ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/Robin-Best-Builds", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "笑顔の国", "Land of Smiles", "Land of Smiles", "協奏状態中、味方全体の全属性耐性貫通を24%上げる。", "While Concerto is active, all allies gain 24% All-Type RES PEN.", "协奏状态期间，全队获得24%全属性抗性穿透。"),
      effect(2, "二人の午後の茶会", "Afternoon Tea For Two", "Afternoon Tea For Two", "協奏状態中、味方全体の速度を16%上げ、天賦のEP回復量を1増やす。", "While Concerto is active, all allies gain 16% SPD and the Talent restores 1 more Energy.", "协奏状态期间，全队速度提高16%，天赋额外回复1点能量。"),
      effect(3, "逆転の調律", "Inverted Tuning", "Inverted Tuning", "戦闘スキルと必殺技を2レベル上げる。", "Raises Skill and Ultimate by 2.", "战技与终结技提高2级。"),
      effect(4, "雨だれの鍵", "Raindrop Key", "Raindrop Key", "必殺技使用時に味方全体の行動制限系デバフを解除し、協奏状態中の効果抵抗を50%上げる。", "Using Ultimate dispels Crowd Control debuffs from all allies and grants 50% Effect RES during Concerto.", "施放终结技时解除全队控制类负面效果，协奏期间效果抵抗提高50%。"),
      effect(5, "孤星の嘆き", "Lonestar's Lament", "Lonestar's Lament", "通常攻撃を1、天賦を2レベル上げる。", "Raises Basic ATK by 1 and Talent by 2.", "普攻提高1级，天赋提高2级。"),
      effect(6, "月のない真夜中", "Moonless Midnight", "Moonless Midnight", "協奏状態中の必殺技による追加物理ダメージの会心ダメージを450%上げる。1回の必殺技につき最大8回発動する。", "During Concerto, Ultimate Additional Physical DMG gains 450% CRIT DMG, up to 8 triggers per Ultimate.", "协奏期间，终结技追加物理伤害的暴击伤害提高450%，每次终结技最多触发8次。"),
    ],
  },
  "hsr:1303": {
    ...SOURCE.hsr, sourceUrl: "https://www.prydwen.gg/star-rail/characters/ruan-mei", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "神経刺繍", "Neuronic Embroidery", "Neuronic Embroidery", "必殺技の結界中、味方全体の与ダメージは敵防御力を20%無視する。", "While the Ultimate field is active, all allies' DMG ignores 20% of enemy DEF.", "终结技结界期间，全队伤害无视敌方20%防御力。"),
      effect(2, "葦辺の散歩道", "Reedside Promenade", "Reedside Promenade", "ルアン・メェイがフィールドにいる時、弱点撃破状態の敵へ与える味方全体の攻撃力を40%上げる。", "With Ruan Mei on the field, allies gain 40% ATK when damaging Weakness-Broken enemies.", "阮·梅在场时，全队攻击弱点击破敌人获得40%攻击力。"),
      effect(3, "翠緑のピルエット", "Viridescent Pirouette", "Viridescent Pirouette", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
      effect(4, "玉虫色の輝き", "Chatoyant Éclat", "Chatoyant Éclat", "敵の弱点撃破時、ルアン・メェイの撃破特効を3ターン100%上げる。", "When an enemy is Weakness Broken, increases Ruan Mei's Break Effect by 100% for 3 turns.", "敌人弱点击破时，阮·梅的击破特攻提高100%，持续3回合。"),
      effect(5, "けだるい髪飾り", "Languid Barrette", "Languid Barrette", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
      effect(6, "サッシュの滝", "Sash Cascade", "Sash Cascade", "必殺技の結界を1ターン延長し、天賦の弱点撃破ダメージ倍率をさらに200%上げる。", "Extends the Ultimate field by 1 turn and increases the Talent's Break DMG multiplier by 200%.", "终结技结界延长1回合，天赋的弱点击破伤害倍率额外提高200%。"),
    ],
  },
  "hsr:1220": {
    ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/462222", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "天を鎮める", "Skyward I Quell", "Skyward I Quell", "必殺技「天堕の烈弓」または「斧天の裂傷」後、その必殺技中の与ダメージを元の10%分、最大5層まで上げる。", "After either Ultimate attack, increases Ultimate DMG by 10% of the original DMG per stack, up to 5 stacks for that Ultimate action.", "施放两种终结技攻击后，使该次终结技伤害按原伤害的10%提高，最多5层。"),
      effect(2, "月に願う", "Moonward I Wish", "Moonward I Wish", "味方が追加攻撃を1回行うごとに「飛黄」を1獲得する。1ターンに最大6回発動する。", "For every allied follow-up attack, gains 1 Flying Aureus, up to 6 times per turn.", "每次队友发动追加攻击获得1点飞黄，每回合最多6次。"),
      effect(3, "星に兆す", "Starward I Bode", "Starward I Bode", "必殺技を2、通常攻撃を1レベル上げる。", "Raises Ultimate by 2 and Basic ATK by 1.", "终结技提高2级，普攻提高1级。"),
      effect(4, "嵐を聞く", "Stormward I Hear", "Stormward I Hear", "天賦の追加攻撃の靭性削りを100%上げ、発動時に速度を2ターン8%上げる。", "Increases Talent follow-up Toughness Reduction by 100%; when it triggers, gains 8% SPD for 2 turns.", "天赋追加攻击的削韧提高100%，发动时速度提高8%，持续2回合。"),
      effect(5, "天へ跳ぶ", "Heavenward I Leap", "Heavenward I Leap", "戦闘スキルと天賦を2レベル上げる。", "Raises Skill and Talent by 2.", "战技与天赋提高2级。"),
      effect(6, "故郷へ近づく", "Homeward I Near", "Homeward I Near", "必殺技ダメージの全属性耐性貫通を20%上げ、天賦の追加攻撃を必殺技ダメージとして扱い、その倍率を140%上げる。", "Ultimate DMG gains 20% All-Type RES PEN; Talent follow-up counts as Ultimate DMG and gains 140% multiplier.", "终结技伤害获得20%全属性抗性穿透；天赋追加攻击视为终结技伤害且倍率提高140%。"),
    ],
  },
  "genshin:楓原万葉": {
    ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/332826", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "赤穂百目鬼", "Scarlet Hills", "赤穗百目鬼", "元素スキルのクールダウンを10%短縮し、元素爆発後にリセットする。", "Reduces Elemental Skill cooldown by 10% and resets it after Burst.", "元素战技冷却缩短10%，施放元素爆发后重置。"),
      effect(2, "山嵐残心", "Yamaarashi Tailwind", "山岚残心", "元素爆発の領域内で本人と味方の元素熟知を200上げる。", "The Burst field grants 200 Elemental Mastery to Kazuha and allies inside it.", "元素爆发领域内，万叶与其中队友元素精通提高200。", { targetChanges: [target("elementalMastery", "元素熟知", "Elemental Mastery", "元素精通", "", 800, 650, 500, "C2の戦闘中元素熟知+200を加味し、公開プロフィールの目標を200下げて表示する。現在値には加算しない。", "C2 grants 200 in-combat EM, so the public-profile target is shown 200 lower. The current value is not increased.", "C2提供200点战斗内元素精通，因此公开面板目标下调200；不增加当前面板数值。")] }),
      effect(3, "楓袖奇譚", "Maple Monogatari", "枫袖奇谭", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
      effect(4, "大空幻法", "Oozora Genpou", "大空幻法", "元素エネルギーが45未満なら元素スキルと滑翔で元素エネルギーを回復する。", "Below 45 Energy, Skill use and gliding restore Energy.", "元素能量低于45时，施放战技和滑翔可回复能量。"),
      effect(5, "万世集", "Wisdom of Bansei", "万世集", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
      effect(6, "紅葉に染まる庭", "Crimson Momiji", "红叶时雨", "元素スキルまたは元素爆発後、5秒間風元素付与を得て、元素熟知に応じ通常・重撃・落下攻撃が強化される。", "After Skill or Burst, gains 5s Anemo Infusion; Normal, Charged, and Plunging DMG scales with Elemental Mastery.", "施放战技或爆发后获得5秒风元素附魔，普攻、重击和下落攻击随元素精通提高。"),
    ],
  },
  "genshin:ベネット": {
    ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/Bennett-Best-Builds", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "夢と真心", "Grand Expectation", "梦想与真心", "元素爆発の攻撃力上昇からHP制限を外し、基礎攻撃力の20%を追加する。", "Removes the HP restriction on Burst ATK buff and adds 20% of Base ATK.", "元素爆发攻击力加成不再受生命限制，并额外获得基础攻击力20%。"),
      effect(2, "絶境踏破", "Impasse Conqueror", "踏破绝境", "HPが70%未満の時、元素チャージ効率を30%上げる。", "Below 70% HP, gains 30% Energy Recharge.", "生命值低于70%时，元素充能效率提高30%。"),
      effect(3, "炎の情熱", "Unstoppable Fervor", "火热的激情", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
      effect(4, "消えない熱情", "Unexpected Odyssey", "意外的旅程", "元素スキル1段チャージの2撃目に通常攻撃を行うと、追加攻撃を発生させる。", "A Normal Attack during the second hit of Skill Charge 1 triggers an extra attack.", "在元素战技一段蓄力第二击期间使用普攻可追加一次攻击。"),
      effect(5, "不屈の開拓者", "True Explorer", "真正的开拓者", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
      effect(6, "炎の情熱", "Fire Ventures with Me", "烈火与勇气", "元素爆発領域内の片手剣・両手剣・長柄武器キャラクターに炎元素ダメージ15%と炎元素付与を与える。", "Sword, Claymore, and Polearm users in the Burst field gain 15% Pyro DMG and Pyro Infusion.", "元素爆发领域内的单手剑、双手剑、长柄武器角色获得15%火伤并附魔火元素。", { caution: t("既存の元素付与や物理運用を阻害する場合があるため、編成ごとに確認してください。", "This can override existing infusions or physical setups; check each team.", "可能覆盖既有附魔或影响物理玩法，请按队伍确认。") }),
    ],
  },
  "genshin:フリーナ": {
    ...SOURCE.genshin, dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "愛は夢のように、鳥のように囚われない", "Love Is a Rebellious Bird", "爱如飞鸟般难以驯服", "元素爆発時にテンションを150獲得し、上限を100増やす。", "Burst grants 150 Fanfare and increases its cap by 100.", "施放元素爆发时获得150点气氛值，上限提高100。"),
      effect(2, "水に揺らめく藻のように", "A Woman Adapts Like Duckweed", "女人如水中浮萍般适应", "テンション獲得量を250%上げ、上限超過分に応じて最大HPを最大140%まで上げる。", "Increases Fanfare gain by 250%; excess Fanfare raises Max HP up to 140%.", "气氛值获取提高250%，超出上限部分可使最大生命值最多提高140%。"),
      effect(3, "秘密は心の奥に", "My Secret Is Hidden Within Me", "秘密藏于心底", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
      effect(4, "生を知らぬ者にこそ", "They Know Not Life", "不知生命者", "サロンメンバー命中または回復で元素エネルギーを4回復する（5秒に1回）。", "Salon hits or Singer healing restore 4 Energy once every 5s.", "沙龙成员命中或治疗时回复4点元素能量，每5秒一次。"),
      effect(5, "名もなき私", "His Name I Now Know", "我已知晓其名", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
      effect(6, "さあ、愛の杯を掲げよう", "Hear Me — Raise the Chalice", "听我颂歌，为爱举杯", "元素スキル後に通常・重撃・落下攻撃へ水元素付与と最大HP参照の追加ダメージを得る。", "After Skill, gains Hydro Infusion and Max-HP-scaling bonus damage for Normal, Charged, and Plunging Attacks.", "施放战技后，普攻、重击和下落攻击获得水元素附魔与基于最大生命值的额外伤害。"),
    ],
  },
  "genshin:10000103": {
    ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/461997", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "休日の句", "Sabbatical Phrase", "休假的韵律", "夜魂の加護状態の消費を30%下げ、継続時間を延ばす。", "Reduces Nightsoul Blessing consumption by 30% and extends its uptime.", "夜魂加持状态的消耗降低30%，并延长持续时间。"),
      effect(2, "千年的祭礼", "Chiucue Mix", "千年的祭礼", "元素に応じてチームを強化する。炎は攻撃力、 水は最大HP、雷は元素エネルギー、氷は会心率・会心ダメージ、岩は与ダメージを上げる。", "Grants element-dependent team buffs: ATK for Pyro, Max HP for Hydro, Energy for Electro, CRIT for Cryo, and DMG for Geo.", "按元素给予队伍增益：火提高攻击力，水提高生命上限，雷回复能量，冰提高双暴，岩提高伤害。"),
      effect(3, "太陽の星", "Tonal Shift", "太阳之星", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
      effect(4, "小さな祝福", "Suchitl's Trance", "小小的祝福", "元素スキル後、味方の通常・重撃・落下攻撃へ防御力参照の追加ダメージを与える。", "After Skill, allies' Normal, Charged, and Plunging Attacks gain DEF-scaling bonus damage.", "施放战技后，队友的普攻、重击和下落攻击获得基于防御力的额外伤害。"),
      effect(5, "諸日こそ諸夜", "The World's Song", "诸日即诸夜", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
      effect(6, "不朽の夜の祝祭", "Imperishable Night Carnival", "不灭之夜的狂欢", "夜魂の加護中の支援・回復・自身の防御力参照ダメージを強化する。", "Enhances support, healing, and DEF-scaling damage during Nightsoul Blessing.", "强化夜魂加持期间的辅助、治疗以及自身防御力倍率伤害。"),
    ],
  },
  "genshin:10000096": {
    ...SOURCE.genshin, sourceUrl: "https://gamewith.net/genshin-impact/article/show/30553", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "すべての報復と負債は私が背負おう", "All Reprisals And Arrears Are Mine To Bear", "All Reprisals And Arrears Are Mine To Bear", "赤死の仮面の強化値を120%へ上げ、通常攻撃中の中断耐性を上げる。", "Raises Masque of the Red Death's enhancement value to 120% and increases interruption resistance during Normal Attacks.", "赤月之形的强化数值提高至120%，普通攻击期间抗打断能力提高。"),
      effect(2, "すべての報いと罰は私が与えよう", "All Rewards And Retribution, Mine To Bestow", "All Rewards And Retribution, Mine To Bestow", "血償の勅令を即座に血償の清算状態とし、吸収時に前方へ攻撃力900%の炎元素範囲ダメージを与える（10秒に1回）。", "Blood-Debt Directives are immediately Due; absorbing one deals 900% ATK AoE Pyro DMG once every 10s.", "血偿敕令立即成为血偿清算；吸收时造成攻击力900%的火元素范围伤害，每10秒一次。"),
      effect(3, "あなたも我が家族の一員となる", "You Shall Become A New Member Of Our Family", "You Shall Become A New Member Of Our Family", "通常攻撃「斬首への招待状」を3レベル上げる。", "Raises Normal Attack: Invitation To A Beheading by 3.", "普通攻击「斩首之邀」提高3级。"),
      effect(4, "あなたたちを愛し、守るのだ", "You Shall Love And Protect Each Other Henceforth", "You Shall Love And Protect Each Other Henceforth", "血償の勅令を吸収すると元素爆発のクールダウンを2秒短縮し、元素エネルギーを15回復する（10秒に1回）。", "Absorbing a Blood-Debt Directive reduces Burst cooldown by 2s and restores 15 Energy once every 10s.", "吸收血偿敕令时，元素爆发冷却缩短2秒并回复15点能量，每10秒一次。"),
      effect(5, "孤独では、いずれ死を迎える", "For Alone, We Are As Good As Dead", "For Alone, We Are As Good As Dead", "元素爆発「昇りゆく凶月」を3レベル上げる。", "Raises Elemental Burst: Balemoon Rising by 3.", "元素爆发「厄月将升」提高3级。"),
      effect(6, "今日から新たな人生を謳歌しよう", "From This Day On, We Shall Delight In New Life Together", "From This Day On, We Shall Delight In New Life Together", "元素爆発ダメージを現在の命の契約割合に応じて強化する。元素スキル後20秒間、通常攻撃と元素爆発の会心率を10%、会心ダメージを70%上げる。", "Strengthens Burst based on current Bond of Life; for 20s after Skill, Normal Attacks and Burst gain 10% CRIT Rate and 70% CRIT DMG.", "元素爆发伤害随当前生命之契强化；施放战技后20秒内，普攻与元素爆发暴击率提高10%、暴击伤害提高70%。"),
    ],
  },
  "genshin:10000087": {
    ...SOURCE.genshin, sourceUrl: "https://gamewith.net/genshin-impact/article/show/39683", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "古き制度", "Venerable Institution", "Venerable Institution", "出場時に固有天賦「古海継嗣の権威」の遺龍の栄光を1層獲得し、強化重撃中の中断耐性を上げる。", "On entering, gains one Past Draconic Glory stack from the Passive Talent and increased interruption resistance during Charged Attacks.", "登场时获得固有天赋的1层古龙大权，强化重击期间抗打断能力提高。"),
      effect(2, "律法の訓戒", "Juridical Exhortation", "Juridical Exhortation", "遺龍の栄光1層ごとに重撃・衡平な裁量の会心ダメージを14%上げる。最大42%まで。", "Each Past Draconic Glory stack raises Charged Attack: Equitable Judgment CRIT DMG by 14%, up to 42%.", "每层古龙大权使重击·衡平推裁暴击伤害提高14%，最多42%。"),
      effect(3, "古き推論", "Ancient Postulation", "Ancient Postulation", "通常攻撃「水の如き平衡」を3レベル上げる。", "Raises Normal Attack: As Water Seeks Equilibrium by 3.", "普通攻击「如水从平」提高3级。"),
      effect(4, "哀れみの冠", "Crown Of Commiseration", "Crown Of Commiseration", "ヌヴィレットがフィールド上で回復を受けると、4秒に1回、源水の雫を1個生成する。", "When Neuvillette is healed on-field, generates one Sourcewater Droplet once every 4s.", "那维莱特在场上受到治疗时，每4秒生成1枚源水之滴。"),
      effect(5, "公理の裁き", "Axiomatic Judgment", "Axiomatic Judgment", "元素爆発「万潮奔流」を3レベル上げる。", "Raises Elemental Burst: O Tides, I Have Returned by 3.", "元素爆发「潮水啊，我已归来」提高3级。"),
      effect(6, "憤怒の報い", "Wrathful Recompense", "Wrathful Recompense", "重撃・衡平な裁量で周囲の源水の雫を吸収し、1個ごとに継続時間を1秒延長する。命中時は2秒ごとに最大HP10%の水流を2本追加発射する。", "Equitable Judgment absorbs nearby Sourcewater Droplets to extend its duration by 1s each and fires two 10% Max-HP Hydro currents every 2s on hit.", "衡平推裁吸收附近源水之滴，每个延长1秒；命中时每2秒额外发射两道相当于最大生命值10%的水流。"),
    ],
  },
  "genshin:10000060": {
    ...SOURCE.genshin, sourceUrl: "https://gamewith.net/genshin-impact/article/show/33289", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "策謀への進入", "Enter The Plotters", "Enter The Plotters", "元素スキル「絡み合う命の糸」の使用可能回数を1回増やす。", "Grants one additional charge of Elemental Skill: Lingering Lifeline.", "元素战技「萦络纵命索」可使用次数增加1次。"),
      effect(2, "すべての敵を迎え撃つ", "Taking All Comers", "Taking All Comers", "元素爆発の連携攻撃時、夜蘭の最大HP14%分の水元素ダメージを与える追加水矢を放つ。", "When Exquisite Throw makes a coordinated attack, fires an additional Hydro arrow dealing 14% of Yelan's Max HP.", "玄掷玲珑进行协同攻击时，额外发射造成夜兰最大生命值14%水元素伤害的水箭。"),
      effect(3, "詐術のサイコロに注意", "Beware The Trickster's Dice", "Beware The Trickster's Dice", "元素爆発「深き玲瓏の骰子」を3レベル上げる。", "Raises Elemental Burst: Depth-Clarion Dice by 3.", "元素爆发「渊图玲珑骰」提高3级。"),
      effect(4, "餌と入れ替え", "Bait-And-Switch", "Bait-And-Switch", "命の糸の爆発で標記した敵1体ごとに、味方全員の最大HPを25秒間10%上げる。最大40%まで。", "Each enemy marked when Lifeline explodes increases all party members' Max HP by 10% for 25s, up to 40%.", "命之丝爆炸时，每个被标记敌人使全队最大生命值提高10%，持续25秒，最多40%。"),
      effect(5, "ディーラーの手練", "Dealer's Sleight", "Dealer's Sleight", "元素スキル「絡み合う命の糸」を3レベル上げる。", "Raises Elemental Skill: Lingering Lifeline by 3.", "元素战技「萦络纵命索」提高3级。"),
      effect(6, "勝者総取り", "Winner Takes All", "Winner Takes All", "元素爆発後、夜蘭は「神算」状態へ入り、通常攻撃が特殊な破局の矢となる。これは重撃ダメージとして扱われ、通常の破局の矢の156%ダメージを与える。", "After Burst, enters Mastermind: Normal Attacks become special Breakthrough Barbs treated as Charged Attack DMG at 156% of normal Breakthrough Barb damage.", "施放元素爆发后进入运筹帷幄状态，普通攻击变为特殊破局矢，视为重击伤害并造成普通破局矢156%的伤害。"),
    ],
  },
  "zzz:1091": {
    ...SOURCE.zzz, dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "霜雪の頂", "Frost Atop the Snow", "霜雪之巅", "霜月の型で落霜消費ごとに防御無視を得て、チームの異常蓄積効率を10秒間20%上げる。", "In Shimotsuki Stance, Fallen Frost grants DEF ignore; a charged hit raises squad Anomaly Buildup Rate by 20% for 10s.", "在霜月姿态中，落霜提供无视防御；蓄力攻击可使全队异常积蓄效率提高20%，持续10秒。"),
      effect(2, "呼吸法", "Breath Technique", "呼吸法", "入場時に落霜を6獲得し、会心率を15%上げる。", "On entry, gains 6 Fallen Frost and 15% CRIT Rate.", "入场时获得6点落霜与15%暴击率。", { targetChanges: [target("critRate", "会心率", "CRIT Rate", "暴击率", "%", 65, 55, 45, "M2の戦闘中会心率+15%を加味し、公開プロフィールの会心率目標を15%下げて表示する。現在値には加算しない。", "M2 grants 15% in-combat CRIT Rate, so public-profile CRIT targets are shown 15% lower. The current value is not increased.", "M2提供15%战斗内暴击率，因此公开面板暴击目标下调15%；不增加当前面板数值。")] }),
      effect(3, "武芸", "Martial Discipline", "武艺", "基本・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(4, "断裂", "Rupture", "断裂", "霜灼・ブレイクのダメージを30%上げ、発動時にデシベルを追加で250得る。", "Increases Frostburn–Break DMG by 30% and grants 250 extra Decibels on trigger.", "霜灼·破的伤害提高30%，触发时额外获得250点喧响值。"),
      effect(5, "記念日", "Anniversary", "纪念日", "基本・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(6, "天賦", "Prodigious Talent", "天赋", "霜月の型中に通常攻撃・霜月のダメージを30%上げ、落霜消費に連動した追加斬撃を行う。", "In Shimotsuki Stance, increases Basic Attack: Shimotsuki DMG by 30% and enables extra slashes tied to Fallen Frost use.", "霜月姿态中，霜月普攻伤害提高30%，并随落霜消耗追加斩击。"),
    ],
  },
  "zzz:1411": {
    ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/527726", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "幸運体質", "Lucky Constitution", "幸运体质", "入場時にエネルギー30を回復し、スイートスケア対象の全属性耐性を10%下げ、異常・混沌ダメージ支援を強化する。", "Restores 30 Energy on entry, reduces Sweet Scare targets' All-Attribute RES by 10%, and strengthens Anomaly/Disorder support.", "入场回复30能量，降低甜蜜惊吓目标10%全属性抗性，并强化异常与紊乱增益。"),
      effect(2, "色とりどりの仲間", "Full of Colorful Company", "五彩斑斓的伙伴", "EX特殊または終結技命中で、チームの与ダメージと異常蓄積効率を40秒間15%上げる。", "EX Special or Ultimate hit grants the squad 15% DMG and Anomaly Buildup Rate for 40s.", "强化特殊技或终结技命中后，全队伤害和异常积蓄效率提高15%，持续40秒。"),
      effect(3, "お化け屋敷のおとぎ話", "Fairytale of the Haunted City", "鬼屋童话", "基本・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(4, "落下する魔法", "Falling Magic", "坠落魔法", "支援追撃のダメージを30%、異常蓄積効率を20%上げ、命中時にクイック支援を発動する。", "Raises Assist Follow-Up DMG by 30% and Anomaly Buildup Rate by 20%; hit triggers Quick Assist.", "支援追击伤害提高30%、异常积蓄效率提高20%，命中时触发快速支援。"),
      effect(5, "色褪せる冬の夢", "Dreams of a Fading Winter", "褪色冬日之梦", "基本・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(6, "根を下ろす", "Put Down Roots", "扎根", "パリィ成功で糖分ポイントを追加し、強化支援追撃でチームの混沌ダメージ倍率を上げる。", "Successful parries grant extra Sugar Points; charged Assist Follow-Up raises squad Disorder damage multiplier.", "成功格挡获得额外糖分点；蓄力支援追击提高全队紊乱伤害倍率。"),
    ],
  },
  "zzz:1221": {
    ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/474448", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "己を知り、敵を知る", "Know Thy Self, Know Thy Enemy", "Know Thy Self, Know Thy Enemy", "任意の味方が異常を付与すると「澄明」を1層得る。1層以上で異常マスタリーを80上げ、被弾時に1層消費して1秒無敵になる。", "When the squad inflicts Anomaly, gains Clarity; with a stack, increases Anomaly Proficiency by 80 and can consume a stack for 1s invulnerability when hit.", "队伍施加异常时获得澄明；拥有层数时异常精通提高80点，受击可消耗一层获得1秒无敌。"),
      effect(2, "卓越した適応力", "Outstanding Adaptability", "Outstanding Adaptability", "EX特殊スキルの突き刺しによる電気異常蓄積効率を20%上げ、追加の突き刺しで極性混沌ダメージ倍率を強化する。", "Raises Electric Anomaly Buildup from EX Special thrusts by 20% and additional thrusts strengthen the Polarity Disorder multiplier.", "强化特殊技突刺的电气异常积蓄效率提高20%，额外突刺强化极性紊乱倍率。"),
      effect(3, "月城流管理術", "Tsukishiro Style Management", "Tsukishiro Style Management", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(4, "チェスマスター", "Chessmaster", "Chessmaster", "属性異常ダメージを与えた敵に15秒の「露出」を付与し、その敵への攻撃の貫通率を16%上げる。", "Attribute Anomaly DMG inflicts Exposed for 15s; attacks against Exposed enemies gain 16% PEN Ratio.", "造成属性异常伤害时赋予敌人15秒暴露，对暴露敌人的攻击穿透率提高16%。"),
      effect(5, "もう一人の母", "Other Mother", "Other Mother", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(6, "非人の血", "Inhuman Blood", "Inhuman Blood", "EX特殊スキルの突き刺し後、森羅万象状態を30秒へ延長する。状態中は攻撃力15%、EX特殊スキルダメージ20%を上げ、追加突き刺しの上限を増やす。", "After an EX Special thrust, extends Shinrabanshou to 30s; while active gains 15% ATK, 20% EX Special DMG, and more additional thrusts.", "强化特殊技突刺后将森罗万象延长至30秒；期间攻击力提高15%、强化特殊技伤害提高20%，并增加额外突刺次数。"),
    ],
  },
  "zzz:1311": {
    ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/490842", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "十二平均律", "12-Tone Equal Temperament", "12-Tone Equal Temperament", "攻撃命中時、対象の全属性耐性を6%下げる（最大3層、30秒）。入場時にデシベルを1,000獲得し、必殺技で味方全体へ1秒無敵となる防護効果を与える。", "Hits reduce the target's All-Attribute RES by 6%, up to 3 stacks for 30s; grants 1,000 Decibels on entry and an Ultimate protection stack for allies.", "攻击命中使目标全属性抗性降低6%，最多3层持续30秒；入场获得1000喧响值，终结技给予全队防护层。"),
      effect(2, "欲望の技法", "Art of Greed", "Art of Greed", "コアパッシブの攻撃力バフを19%強化し、上限を400増やす。アイドリック・カデンツァ中、特定の支援交代で追加追撃を行う。", "Strengthens the Core Passive ATK buff by 19% and raises its cap by 400; enables additional follow-ups on specified assists during Idyllic Cadenza.", "核心被动攻击增益额外提高19%，上限增加400；田园咏叹调期间特定支援切换可发动追加追击。"),
      effect(3, "交差する譜表", "Interwoven Staff Notation", "Interwoven Staff Notation", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(4, "うなじの髪", "Hair Upon Your Nape", "Hair Upon Your Nape", "連携スキルまたは必殺技後、コードがなくてもクイック支援を発動できる。特性に応じて攻撃・異常蓄積・ブレイクを強化する。", "After a Chain Attack or Ultimate, can trigger Quick Assist without Chords and grants specialty-based Attack, Anomaly Buildup, or Daze bonuses.", "连携技或终结技后无需和弦即可触发快速支援，并按特性强化攻击、异常积蓄或失衡值。"),
      effect(5, "プロキシと絹糸", "Proxy and Silk String", "Proxy and Silk String", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(6, "私たちは世界", "We Are the World", "We Are the World", "アイドリック・カデンツァ中、トレモロと音球のダメージ倍率を200%へ上げ、会心率を80%上げる。精密支援では強化された追撃を行う。", "During Idyllic Cadenza, raises Tremolo and Tone Cluster multiplier to 200% and CRIT Rate by 80%, with an empowered follow-up on Precise Assist.", "田园咏叹调期间，颤音与音球倍率提高至200%、暴击率提高80%，精准支援时发动强化追击。"),
    ],
  },
  "zzz:1161": {
    ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/474509", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "チャンピオン", "The Champion", "The Champion", "コアパッシブの「崩壊」でブレイク時間を5秒延長し、氷・炎耐性をさらに10%下げる。士気を使い切った後の強化フィニッシュのダメージを30%上げる。", "Core Passive Collapse extends Stun by 5s, further reduces Ice and Fire RES by 10%, and raises the empowered finishing move by 30%.", "核心被动的崩坏延长5秒失衡，冰火抗性额外降低10%，强化终结动作伤害提高30%。"),
      effect(2, "赤いスカーフ", "Red Scarf", "Red Scarf", "「崩壊」付与時、敵のブレイクダメージ倍率を25%上げる。追加能力の炎・氷ダメージ上昇を元の120%へ強化する。", "Applying Collapse raises the target's Stun DMG Multiplier by 25% and strengthens Additional Ability Ice/Fire DMG to 120% of its original value.", "施加崩坏时，敌人的失衡伤害倍率提高25%，额外能力的冰火伤害增益强化至原本的120%。"),
      effect(3, "傭兵団長", "Mercenary Leader", "Mercenary Leader", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(4, "サングラス", "Sunglasses", "Sunglasses", "ライトが控えにいる時、表キャラクターのエネルギー自動回復を10%上げる。士気爆発突入時、控えの味方を回復する。", "While Lighter is off-field, increases the on-field character's Energy Regen by 10%; entering Morale Burst restores Energy to off-field allies.", "莱特在后台时，前场角色能量自动回复提高10%；进入士气爆发时为后台队友回复能量。"),
      effect(5, "意思決定者", "Decision Maker", "Decision Maker", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(6, "生存者", "Survivor", "Survivor", "士気回復効率を200%へ上げ、重撃命中で炎属性追加ダメージ「灼熱衝撃」を発生させる。衝撃力170超過分はその倍率をさらに上げる。", "Raises Morale recovery efficiency to 200% and heavy strikes trigger Blazing Impact Fire DMG; Impact above 170 further raises its multiplier.", "士气回复效率提高至200%，重击触发灼热冲击火伤；冲击力超过170后进一步提高倍率。"),
    ],
  },
  "zzz:1581": {
    ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/588854", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "無垢な誓い", "Naive Oath", "Naive Oath", "入場時に特別な虚炎を3得る。耀変ダメージ時に敵の全属性耐性を50%無視し、相転状態中は他の味方の属性異常ダメージを10%上げる。", "Gains 3 special Voidflares on entry; Luminize ignores 50% All-Attribute RES and Phase Flow raises other allies' Attribute Anomaly DMG by 10%.", "入场获得3个特殊虚炎；耀变伤害无视50%全属性抗性，相转状态使其他队友属性异常伤害提高10%。"),
      effect(2, "雑音へ落ちる", "Fall Into the Noise", "Fall Into the Noise", "昇華係数を20%上げる。編成内の異常キャラクターがプリズマティック状態の敵へ異常ダメージを与える時、敵防御力を15%無視する。", "Raises Refringe Coefficient by 20%; Anomaly squad members dealing Anomaly DMG to Prismatic enemies ignore 15% DEF.", "昇华系数提高20%；队伍异常角色对棱彩状态敌人造成异常伤害时无视15%防御力。"),
      effect(3, "分岐する時の庭", "The Garden of Diverging Time", "The Garden of Diverging Time", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(4, "長い別れ", "The Long Goodbye", "The Long Goodbye", "耀変のダメージ倍率を12%上げ、特別な虚炎をすべて消費した後に一度だけ最大数まで回復できる。", "Raises Luminize DMG multiplier by 12% and can refill special Voidflares to maximum once after all are consumed.", "耀变伤害倍率提高12%，特殊虚炎全部消耗后可一次恢复至最大数量。"),
      effect(5, "忘却を飲む", "To Drink Forgetfulness", "To Drink Forgetfulness", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(6, "孤独な羽の果てなき飛翔", "Lone Feather's Endless Flight", "Lone Feather's Endless Flight", "通常攻撃「虹の終焉」または「流れる恩寵」使用時、耀変を2回発動する。通常攻撃4段目命中後に特別な虚炎を3得る。", "Basic Attack: Rainbow's End or Fleeting Grace triggers Luminize twice; the fourth Basic hit grants 3 special Voidflares.", "使用普攻「虹之终焉」或「流逝恩泽」时触发两次耀变；普攻第四段命中后获得3个特殊虚炎。"),
    ],
  },
  "hsr:1313": {
    ...SOURCE.hsr, sourceUrl: "https://www.prydwen.gg/star-rail/characters/sunday", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "星魂1", "Eidolon 1", "星魂1", "戦闘スキル対象の与ダメージに防御力無視を付与する。", "The Skill target gains DEF ignore for its damage.", "战技目标造成伤害时获得无视防御。"),
      effect(2, "星魂2", "Eidolon 2", "星魂2", "初回必殺技使用時にSPを回復し、スキル対象の与ダメージを上げる。", "The first Ultimate restores Skill Points and raises the Skill target's damage.", "首次施放终结技恢复战技点并提高战技目标造成的伤害。"),
      effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルとメモスプライト関連天賦のレベルを上げる。", "Raises Skill and Memosprite-related Talent levels.", "提高战技和忆灵相关天赋等级。"),
      effect(4, "星魂4", "Eidolon 4", "星魂4", "サンデーまたはメモスプライトの行動時にEPを回復する。", "Restores Energy when Sunday or his memosprite acts.", "星期日或其忆灵行动时恢复能量。"),
      effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技・天賦・メモスプライトスキルのレベルを上げる。", "Raises Ultimate, Talent, and Memosprite Skill levels.", "提高终结技、天赋和忆灵技能等级。"),
      effect(6, "星魂6", "Eidolon 6", "星魂6", "会心率バフをスタック化し、100%を超える会心率を会心ダメージへ変換する。", "Makes the CRIT Rate buff stack and converts CRIT Rate above 100% into CRIT DMG.", "使暴击率增益可叠加，并将超过100%的暴击率转化为暴击伤害。"),
    ],
  },
  "hsr:1315": {
    ...SOURCE.hsr, sourceUrl: "https://www.prydwen.gg/star-rail/characters/boothill", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "星魂1", "Eidolon 1", "星魂1", "決闘状態の敵への攻撃で防御力無視を得て、ポケットトリックショットを獲得する。", "Attacks against Standoff enemies gain DEF ignore and grant Pocket Trickshot.", "攻击决斗状态敌人时获得无视防御并取得袖珍绝技。"),
      effect(2, "星魂2", "Eidolon 2", "星魂2", "弱点撃破時に撃破特効を得て、決闘の準備を補助する。", "Weakness Break grants Break Effect and helps set up Standoff.", "弱点击破时获得击破特攻并辅助准备决斗。"),
      effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルと通常攻撃のレベルを上げる。", "Raises Skill and Basic ATK levels.", "提高战技与普攻等级。"),
      effect(4, "星魂4", "Eidolon 4", "星魂4", "決闘状態の敵との戦闘で被ダメージと与ダメージを変化させる。", "Changes damage taken and dealt during Standoff combat.", "在决斗状态战斗中改变受到与造成的伤害。"),
      effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦のレベルを上げる。", "Raises Ultimate and Talent levels.", "提高终结技与天赋等级。"),
      effect(6, "星魂6", "Eidolon 6", "星魂6", "強化通常攻撃に追加の撃破ダメージを発生させる。", "Adds extra Break damage to the enhanced Basic ATK.", "使强化普攻追加造成击破伤害。"),
    ],
  },
  "hsr:1308": {
    ...SOURCE.hsr, sourceUrl: "https://www.prydwen.gg/star-rail/characters/acheron", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "星魂1", "Eidolon 1", "星魂1", "デバフ状態の敵への会心率を18%上げる。", "Increases CRIT Rate by 18% against debuffed enemies.", "攻击陷入负面状态的敌人时暴击率提高18%。"),
      effect(2, "星魂2", "Eidolon 2", "星魂2", "追加能力の虚無人数条件を緩和し、自身のターン開始時に残夢を得る。", "Relaxes the Nihility-count requirement and grants Slashed Dream at the start of Acheron's turn.", "放宽额外能力的虚无角色人数要求，并在自身回合开始时获得残梦。"),
      effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技のレベルを上げる。", "Raises Ultimate level.", "提高终结技等级。"),
      effect(4, "星魂4", "Eidolon 4", "星魂4", "デバフ付与時に、対象が受ける必殺技ダメージを上げる。", "Applying a debuff increases Ultimate damage taken by the target.", "施加负面效果时提高目标受到的终结技伤害。"),
      effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルのレベルを上げる。", "Raises Skill level.", "提高战技等级。"),
      effect(6, "星魂6", "Eidolon 6", "星魂6", "必殺技以外の攻撃も必殺技ダメージとして扱い、全属性耐性貫通を得る。", "Treats non-Ultimate attacks as Ultimate damage and grants All-Type RES PEN.", "将非终结技攻击也视为终结技伤害，并获得全属性抗性穿透。"),
    ],
  },
  "hsr:1222": {
    ...SOURCE.hsr, sourceUrl: "https://gamewith.jp/houkaistarrail/article/show/457049", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "星魂1", "Eidolon 1", "星魂1", "弱点撃破効率を上げ、弱点撃破状態の敵の防御力を下げる。", "Raises Weakness Break Efficiency and reduces the DEF of Weakness-Broken enemies.", "提高弱点击破效率并降低弱点击破状态敌人的防御力。"),
      effect(2, "星魂2", "Eidolon 2", "星魂2", "必殺技使用時に味方全体の撃破特効を上げる。", "Using Ultimate raises all allies' Break Effect.", "施放终结技时提高全队击破特攻。"),
      effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルのレベルを上げる。", "Raises Skill level.", "提高战技等级。"),
      effect(4, "星魂4", "Eidolon 4", "星魂4", "回復対象のHPが低い時に回復量を増やす。", "Increases healing for targets at low HP.", "目标生命较低时提高治疗量。"),
      effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦のレベルを上げる。", "Raises Ultimate and Talent levels.", "提高终结技与天赋等级。"),
      effect(6, "星魂6", "Eidolon 6", "星魂6", "攻撃で敵の全属性耐性を下げ、浮元の追加攻撃を強化する。", "Attacks reduce enemies' All-Type RES and strengthen Fuyuan follow-ups.", "攻击降低敌人全属性抗性并强化浮元追加攻击。"),
    ],
  },
  "genshin:10000052": {
    ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/337161", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "命ノ星座1", "Constellation 1", "命之座1", "元素爆発による願力の獲得量を元素種別に応じて増やす。", "Increases Resolve gained from Elemental Bursts based on element type.", "按元素类型提高元素爆发获得的愿力。"),
      effect(2, "命ノ星座2", "Constellation 2", "命之座2", "夢想の一太刀と夢想の一心の攻撃が敵防御力60%を無視する。", "Musou no Hitotachi and Musou Isshin attacks ignore 60% of enemy DEF.", "梦想的一刀与梦想一心攻击无视敌人60%防御力。"),
      effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素爆発のレベルを3上げる。", "Raises Elemental Burst level by 3.", "元素爆发等级提高3级。"),
      effect(4, "命ノ星座4", "Constellation 4", "命之座4", "夢想の一心終了後、周囲の味方の攻撃力を上げる。", "After Musou Isshin ends, increases nearby allies' ATK.", "梦想一心结束后提高附近队友的攻击力。"),
      effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素スキルのレベルを3上げる。", "Raises Elemental Skill level by 3.", "元素战技等级提高3级。"),
      effect(6, "命ノ星座6", "Constellation 6", "命之座6", "夢想の一心中の攻撃命中で、他の味方の元素爆発クールダウンを短縮する。", "Hits during Musou Isshin reduce other party members' Elemental Burst cooldowns.", "梦想一心期间攻击命中可缩短其他队友元素爆发冷却时间。"),
    ],
  },
  "genshin:10000073": {
    ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/Nahida-Best-Builds", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "命ノ星座1", "Constellation 1", "命之座1", "元素爆発の元素種別カウントを各1増やす。", "Adds one to each elemental-type count for the Elemental Burst.", "元素爆发的各元素类型计数均增加1。"),
      effect(2, "命ノ星座2", "Constellation 2", "命之座2", "開花系反応の会心と激化系反応の敵防御低下を可能にする。", "Enables Bloom-family CRIT effects and DEF reduction for Quicken-family reactions.", "使绽放类反应能够暴击，并使激化类反应降低敌人防御力。"),
      effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルのレベルを3上げる。", "Raises Elemental Skill level by 3.", "元素战技等级提高3级。"),
      effect(4, "命ノ星座4", "Constellation 4", "命之座4", "蕴種印を付与した近くの敵数に応じて元素熟知を上げる。", "Raises Elemental Mastery based on nearby enemies marked by Seed of Skandha.", "按附近被蕴种印标记的敌人数量提高元素精通。"),
      effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発のレベルを3上げる。", "Raises Elemental Burst level by 3.", "元素爆发等级提高3级。"),
      effect(6, "命ノ星座6", "Constellation 6", "命之座6", "元素爆発後の通常・重撃で滅浄三業を強化し、追加の草元素ダメージを与える。", "Normal and Charged Attacks after Burst enhance Tri-Karma Purification and deal extra Dendro damage.", "元素爆发后的普攻与重击强化灭净三业并造成额外草元素伤害。"),
    ],
  },
  "genshin:10000030": {
    ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/305858", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "命ノ星座1", "Constellation 1", "命之座1", "岩柱の同時存在上限を2本に増やす。", "Increases the maximum simultaneous Stone Steles to two.", "将岩脊的同时存在上限提高至2根。"),
      effect(2, "命ノ星座2", "Constellation 2", "命之座2", "元素爆発時、近くのキャラクターに玉璋シールドを付与する。", "Elemental Burst grants nearby characters a Jade Shield.", "元素爆发时为附近角色赋予玉璋护盾。"),
      effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルのレベルを3上げる。", "Raises Elemental Skill level by 3.", "元素战技等级提高3级。"),
      effect(4, "命ノ星座4", "Constellation 4", "命之座4", "元素爆発の範囲を広げ、石化時間を延長する。", "Increases the Elemental Burst area and Petrification duration.", "扩大元素爆发范围并延长石化时间。"),
      effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発のレベルを3上げる。", "Raises Elemental Burst level by 3.", "元素爆发等级提高3级。"),
      effect(6, "命ノ星座6", "Constellation 6", "命之座6", "玉璋シールドが受けたダメージの一部を現在キャラクターのHP回復へ変換する。", "Converts part of Jade Shield damage into HP restoration for the active character.", "将玉璋护盾受到的部分伤害转化为当前角色生命恢复。"),
    ],
  },
  "zzz:1331": {
    ...SOURCE.zzz, sourceUrl: "https://game8.jp/zenless/673769", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "心象映画1", "Mindscape 1", "心象电影1", "侵蝕・混沌の敵が受けるダメージを上げ、編成の侵蝕関連効果を強化する。", "Raises damage taken by Corruption/Disorder targets and strengthens Corruption-related team effects.", "提高侵蚀与紊乱目标受到的伤害，并强化队伍的侵蚀相关效果。"),
      effect(2, "心象映画2", "Mindscape 2", "心象电影2", "特殊攻撃の異常蓄積効率と条件付きの耐性無視を強化する。", "Strengthens Special Attack Anomaly buildup and conditional RES ignore.", "强化特殊攻击的异常积累效率与条件性的无视抗性。"),
      effect(3, "心象映画3", "Mindscape 3", "心象电影3", "基本・回避・支援・特殊・連携スキルのレベルを上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skill levels.", "提高普攻、闪避、支援、特殊技和连携技等级。"),
      effect(4, "心象映画4", "Mindscape 4", "心象电影4", "条件を満たす攻撃で会心・攻撃力関連の強化を得る。", "Qualifying attacks grant conditional CRIT and ATK-related enhancements.", "满足条件的攻击获得暴击与攻击力相关强化。"),
      effect(5, "心象映画5", "Mindscape 5", "心象电影5", "基本・回避・支援・特殊・連携スキルのレベルを上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skill levels.", "提高普攻、闪避、支援、特殊技和连携技等级。"),
      effect(6, "心象映画6", "Mindscape 6", "心象电影6", "エーテル与ダメージと特殊な狂咲攻撃を強化する。", "Strengthens Ether damage and the special Abloom attack.", "强化以太伤害与特殊的狂咲攻击。"),
    ],
  },
  "zzz:1261": {
    ...SOURCE.zzz, sourceUrl: "https://game8.jp/zenless/625565", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "心象映画1", "Mindscape 1", "心象电影1", "熱狂状態の異常蓄積効率と与ダメージを強化する。", "Strengthens Anomaly buildup and damage while Passion is active.", "强化热狂状态下的异常积累效率与造成的伤害。"),
      effect(2, "心象映画2", "Mindscape 2", "心象电影2", "強撃関連の防御無視と会心ダメージを強化する。", "Strengthens Assault-related DEF ignore and CRIT DMG.", "强化强击相关的无视防御与暴击伤害。"),
      effect(3, "心象映画3", "Mindscape 3", "心象电影3", "基本・回避・支援・特殊・連携スキルのレベルを上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skill levels.", "提高普攻、闪避、支援、特殊技和连携技等级。"),
      effect(4, "心象映画4", "Mindscape 4", "心象电影4", "チームの状態異常ダメージを条件付きで強化する。", "Conditionally strengthens squad Attribute Anomaly damage.", "条件性强化全队属性异常伤害。"),
      effect(5, "心象映画5", "Mindscape 5", "心象电影5", "基本・回避・支援・特殊・連携スキルのレベルを上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skill levels.", "提高普攻、闪避、支援、特殊技和连携技等级。"),
      effect(6, "心象映画6", "Mindscape 6", "心象电影6", "会心と追加攻撃を強化し、熱狂中の強撃火力を高める。", "Strengthens CRIT and follow-up attacks, increasing Passion-state Assault damage.", "强化暴击与追加攻击，提高热狂状态下的强击火力。"),
    ],
  },
  "zzz:1191": {
    ...SOURCE.zzz, sourceUrl: "https://game8.jp/zenless/607800", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "心象映画1", "Mindscape 1", "心象电影1", "急凍消費時の会心率と氷属性攻撃を強化する。", "Strengthens CRIT Rate and Ice attacks when Flash Freeze is consumed.", "消耗急冻时强化暴击率与冰属性攻击。"),
      effect(2, "心象映画2", "Mindscape 2", "心象电影2", "急凍消費時の会心ダメージと急凍関連攻撃を強化する。", "Strengthens CRIT DMG and Flash Freeze-related attacks when it is consumed.", "消耗急冻时强化暴击伤害与急冻相关攻击。"),
      effect(3, "心象映画3", "Mindscape 3", "心象电影3", "基本・回避・支援・特殊・連携スキルのレベルを上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skill levels.", "提高普攻、闪避、支援、特殊技和连携技等级。"),
      effect(4, "心象映画4", "Mindscape 4", "心象电影4", "凍結・ブレイク時に急凍を回復する。", "Restores Flash Freeze when Freeze or Stun conditions occur.", "在冻结或失衡时恢复急冻。"),
      effect(5, "心象映画5", "Mindscape 5", "心象电影5", "基本・回避・支援・特殊・連携スキルのレベルを上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skill levels.", "提高普攻、闪避、支援、特殊技和连携技等级。"),
      effect(6, "心象映画6", "Mindscape 6", "心象电影6", "貫通率と与ダメージを強化し、急凍関連攻撃をさらに伸ばす。", "Strengthens PEN Ratio and damage, further raising Flash Freeze-related attacks.", "强化穿透率与造成的伤害，进一步提高急冻相关攻击。"),
    ],
  },
  "hsr:1304": {
    ...SOURCE.hsr, sourceUrl: "https://www.prydwen.gg/star-rail/characters/aventurine", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "星魂1", "Eidolon 1", "星魂1", "護盾所持者の会心ダメージを20%上げ、必殺技後に全体へ護盾を付与する。", "Shielded allies gain 20% CRIT DMG, and the Ultimate grants a teamwide shield.", "使持有护盾的队友暴击伤害提高20%，终结技后为全队提供护盾。"),
      effect(2, "星魂2", "Eidolon 2", "星魂2", "通常攻撃時、敵の全属性耐性を12%下げる。", "Basic ATK reduces the target's All-Type RES by 12%.", "普通攻击使目标全属性抗性降低12%。"),
      effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技を2、通常攻撃を1レベル上げる。", "Raises Ultimate by 2 and Basic ATK by 1.", "终结技提高2级，普攻提高1级。"),
      effect(4, "星魂4", "Eidolon 4", "星魂4", "追加攻撃時に防御力を40%上げ、ヒット数を3増やす（2ターン）。", "Follow-up attacks grant 40% DEF and add 3 hits for 2 turns.", "发动追加攻击时防御力提高40%，并增加3段攻击，持续2回合。"),
      effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルと天賦を2レベル上げる。", "Raises Skill and Talent by 2.", "战技与天赋提高2级。"),
      effect(6, "星魂6", "Eidolon 6", "星魂6", "護盾を持つ味方1人につき自身の与ダメージを50%上げ、最大150%まで。", "Each shielded ally raises Aventurine's DMG by 50%, up to 150%.", "每有1名持盾队友，自身造成的伤害提高50%，最多150%。"),
    ],
  },
  "hsr:1112": {
    ...SOURCE.hsr, sourceUrl: "https://www.prydwen.gg/star-rail/characters/topaz", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "星魂1", "Eidolon 1", "星魂1", "負債証明の敵への追加攻撃命中時、追加攻撃会心ダメージ+25%の債務者を最大2層付与する。", "Follow-ups hitting Proof of Debt targets apply up to 2 Debtor stacks, each granting 25% Follow-up CRIT DMG.", "追加攻击命中负债证明目标时施加最多2层债务人，每层使追加攻击暴击伤害提高25%。"),
      effect(2, "星魂2", "Eidolon 2", "星魂2", "カブの行動後にEPを5回復する。", "Restores 5 Energy after Numby's action.", "账账行动后回复5点能量。"),
      effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
      effect(4, "星魂4", "Eidolon 4", "星魂4", "カブの行動開始時、トパーズの行動順を20%早める。", "At the start of Numby's turn, advances Topaz's action by 20%.", "账账回合开始时，使托帕的行动提前20%。"),
      effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
      effect(6, "星魂6", "Eidolon 6", "星魂6", "大当たり中のカブ攻撃回数を1増やし、炎属性耐性貫通を10%得る。", "During Windfall Bonanza, Numby gains 1 extra hit and 10% Fire RES PEN.", "大赚状态下账账攻击次数增加1次，并获得10%火属性抗性穿透。"),
    ],
  },
  "hsr:1306": {
    ...SOURCE.hsr, sourceUrl: "https://www.prydwen.gg/star-rail/characters/sparkle", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "星魂1", "Eidolon 1", "星魂1", "暗号所持味方の攻撃力を40%上げ、花火の速度を15%上げる（2ターン）。", "Cipher allies gain 40% ATK and Sparkle gains 15% SPD for 2 turns.", "持有密语的队友攻击力提高40%，花火速度提高15%，持续2回合。"),
      effect(2, "星魂2", "Eidolon 2", "星魂2", "天賦スタックごとに、敵防御力を10%下げる。", "Each Talent stack reduces enemy DEF by 10%.", "每层天赋效果使敌人防御力降低10%。"),
      effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
      effect(4, "星魂4", "Eidolon 4", "星魂4", "必殺技のSP回復を1増やし、最大SPを1増やす。", "Increases Ultimate Skill Point recovery by 1 and maximum Skill Points by 1.", "终结技额外恢复1点战技点，战技点上限提高1点。"),
      effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
      effect(6, "星魂6", "Eidolon 6", "星魂6", "戦闘スキルの会心ダメージ補正に花火会心ダメージの30%を追加し、暗号所持味方へ拡張する。", "Adds 30% of Sparkle's CRIT DMG to her Skill's CRIT DMG modifier and extends it to Cipher allies.", "战技的暴击伤害加成额外获得花火暴击伤害的30%，并扩展至持有密语的队友。"),
    ],
  },
  "hsr:1213": {
    ...SOURCE.hsr, sourceUrl: "https://www.prydwen.gg/star-rail/characters/imbibitor-lunae", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "星魂1", "Eidolon 1", "星魂1", "「逆鱗」の最大層数を4増やし、攻撃ヒットごとに追加で逆鱗を得る。", "Increases the maximum Squama Sacrosancta by 4 and grants additional stacks for each attack hit.", "逆鳞的上限提高4层，攻击每段命中额外获得逆鳞。"),
      effect(2, "星魂2", "Eidolon 2", "星魂2", "必殺技後に行動順を100%早め、逆鱗を1得る。", "After Ultimate, advances action by 100% and grants 1 Squama Sacrosancta.", "施放终结技后行动提前100%，并获得1层逆鳞。"),
      effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
      effect(4, "星魂4", "Eidolon 4", "星魂4", "「轟天」の会心ダメージ効果を次ターン終了まで延長する。", "Extends Fulgurant Leap's CRIT DMG effect until the end of the next turn.", "延长轰天的暴击伤害效果至下一回合结束。"),
      effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
      effect(6, "星魂6", "Eidolon 6", "星魂6", "他味方の必殺技後、次の「飛翔する天照」は虚数耐性貫通+20%を最大3層得る。", "After other allies use Ultimate, the next Fulgurant Leap gains up to 3 stacks of 20% Imaginary RES PEN.", "其他队友施放终结技后，下一次飞天神照获得最多3层20%虚数抗性穿透。"),
    ],
  },
  "genshin:10000078": {
    ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/383712", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "命ノ星座1", "Constellation 1", "命之座1", "投影攻撃命中時、元素スキルのクールダウンを1.2秒短縮する。", "Projection Attack hits reduce Elemental Skill cooldown by 1.2s.", "琢光镜投影攻击命中时，元素战技冷却时间减少1.2秒。"),
      effect(2, "命ノ星座2", "Constellation 2", "命之座2", "琢光鏡生成ごとに元素熟知を50上げる（8秒、最大4層）。", "Each mirror creation grants 50 Elemental Mastery for 8s, up to 4 stacks.", "每生成一枚琢光镜，元素精通提高50点，持续8秒，最多4层。"),
      effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
      effect(4, "命ノ星座4", "Constellation 4", "命之座4", "元素爆発で消費した鏡数に応じ、味方の元素熟知または本人の草元素ダメージを15秒上げる。", "Burst mirror consumption grants allies Elemental Mastery or Alhaitham Dendro DMG for 15s.", "根据元素爆发消耗的琢光镜数量，提高队友元素精通或艾尔海森草元素伤害，持续15秒。"),
      effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
      effect(6, "命ノ星座6", "Constellation 6", "命之座6", "元素爆発2秒後に琢光鏡を3枚生成し、最大時の再生成で会心率+10%・会心ダメージ+70%を得る（6秒）。", "Creates 3 mirrors 2s after Burst; recreating them at maximum grants 10% CRIT Rate and 70% CRIT DMG for 6s.", "元素爆发2秒后生成3枚琢光镜；满层时再次生成可获得10%暴击率与70%暴击伤害，持续6秒。"),
    ],
  },
  "genshin:10000046": {
    ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/314347", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "命ノ星座1", "Constellation 1", "命之座1", "蝶導来世中の重撃はスタミナを消費しない。", "Charged Attacks consume no Stamina during Paramita Papilio.", "蝶引来生状态下重击不消耗体力。"),
      effect(2, "命ノ星座2", "Constellation 2", "命之座2", "血梅香ダメージに付与時HP上限の10%を加算し、元素爆発にも血梅香を付与する。", "Blood Blossom gains 10% of Hu Tao's Max HP at application, and Burst also applies Blood Blossom.", "血梅香伤害额外获得施加时胡桃生命上限的10%，元素爆发也会施加血梅香。"),
      effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
      effect(4, "命ノ星座4", "Constellation 4", "命之座4", "自身の血梅香の敵撃破時、本人以外の味方の会心率を12%上げる（15秒）。", "Defeating a Blood Blossom target grants other allies 12% CRIT Rate for 15s.", "击败受自身血梅香影响的敌人时，除自身外的队友暴击率提高12%，持续15秒。"),
      effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
      effect(6, "命ノ星座6", "Constellation 6", "命之座6", "HP25%未満または致死被弾時、10秒間全元素・物理耐性+200%・会心率+100%・中断耐性上昇を得る（60秒に1回）。", "Below 25% HP or on a lethal hit, gains 200% All-Elemental/Physical RES, 100% CRIT Rate, and interruption resistance for 10s, once every 60s.", "生命低于25%或受到致命伤害时，获得200%全元素与物理抗性、100%暴击率及抗打断能力，持续10秒，每60秒一次。"),
    ],
  },
  "genshin:10000065": {
    ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/346199", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "命ノ星座1", "Constellation 1", "命之座1", "元素爆発の範囲を50%広げる。", "Increases Elemental Burst area by 50%.", "元素爆发的范围扩大50%。"),
      effect(2, "命ノ星座2", "Constellation 2", "命之座2", "雷草の輪の継続時間を3秒延長する。", "Extends Grass Ring of Sanctification duration by 3s.", "越祓草轮的持续时间延长3秒。"),
      effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
      effect(4, "命ノ星座4", "Constellation 4", "命之座4", "雷草の輪所持キャラクターの通常・重撃・落下攻撃命中時、HP上限9.7%の雷範囲ダメージを与える（5秒に1回）。", "When a Grass Ring character hits with Normal, Charged, or Plunging Attacks, deals AoE Electro DMG equal to 9.7% of Kuki's Max HP once every 5s.", "草轮角色的普攻、重击或下落攻击命中时，造成相当于久岐忍生命上限9.7%的雷元素范围伤害，每5秒一次。"),
      effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
      effect(6, "命ノ星座6", "Constellation 6", "命之座6", "致死ダメージを1回無効にし、HP25%未満で元素熟知+150を得る（15秒、60秒に1回）。", "Negates one lethal hit and grants 150 Elemental Mastery below 25% HP for 15s, once every 60s.", "可免除一次致命伤害，生命低于25%时元素精通提高150点，持续15秒，每60秒一次。"),
    ],
  },
  "zzz:1271": {
    ...SOURCE.zzz, sourceUrl: "https://www.prydwen.gg/zenless/characters/seth", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "心象映画1", "Mindscape 1", "心象电影1", "固定決意の盾量・上限を30%上げ、盾終了後の異常掌握増加を10秒延長する。", "Increases the shield value and cap of Resolute Shield by 30% and extends its post-shield Anomaly Proficiency increase by 10s.", "使正义之盾的护盾值与上限提高30%，并将护盾结束后的异常掌握提升延长10秒。"),
      effect(2, "心象映画2", "Mindscape 2", "心象电影2", "開幕時に決意を75%得て、強化通常攻撃の感電蓄積を35%上げる。", "Starts combat with 75% Resolve and increases enhanced Basic Attack Shock buildup by 35%.", "开场获得75%意气值，强化普攻的感电异常积蓄提高35%。"),
      effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
      effect(4, "心象映画4", "Mindscape 4", "心象电影4", "防御支援のブレイク値を25%上げる。", "Increases Defensive Assist Daze by 25%.", "防御支援造成的失衡值提高25%。"),
      effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
      effect(6, "心象映画6", "Mindscape 6", "心象电影6", "強化通常攻撃のフィニッシュに攻撃力500%の追加ダメージ・確定会心・会心ダメージ+60%を付与する。", "The enhanced Basic finisher gains 500% ATK bonus damage, guaranteed CRIT, and 60% CRIT DMG.", "强化普攻终结段获得攻击力500%的额外伤害、必定暴击与60%暴击伤害。"),
    ],
  },
  "zzz:1281": {
    ...SOURCE.zzz, sourceUrl: "https://www.prydwen.gg/zenless/characters/piper", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "心象映画1", "Mindscape 1", "心象电影1", "回転斬り命中時50%で追加パワーを獲得し、上限を30層にする。", "Spin hits have a 50% chance to grant extra Power, raising the cap to 30 stacks.", "旋转攻击命中有50%概率获得额外动力，层数上限提高至30层。"),
      effect(2, "心象映画2", "Mindscape 2", "心象电影2", "回転中の移動速度を上げ、叩きつけの物理ダメージを10%とパワー1層ごとに1%上げる。", "Raises movement speed while spinning and increases Slam Physical DMG by 10% plus 1% per Power stack.", "旋转期间移动速度提高，砸击物理伤害提高10%并且每层动力额外提高1%。"),
      effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
      effect(4, "心象映画4", "Mindscape 4", "心象电影4", "味方が状態異常を付与するとEPを20回復する（30秒に1回）。", "When an ally inflicts Anomaly, restores 20 Energy once every 30s.", "队友施加异常时回复20点能量，每30秒一次。"),
      effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
      effect(6, "心象映画6", "Mindscape 6", "心象电影6", "EX特殊スキルの持続時間を2秒、パワーの持続時間を4秒延長する。", "Extends EX Special duration by 2s and Power duration by 4s.", "强化特殊技持续时间延长2秒，动力持续时间延长4秒。"),
    ],
  },
  "zzz:1131": {
    ...SOURCE.zzz, sourceUrl: "https://www.prydwen.gg/zenless/characters/soukaku", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
      effect(1, "心象映画1", "Mindscape 1", "心象电影1", "コアパッシブ・追加能力のバフ時間を8秒延長する。", "Extends Core Passive and Additional Ability buff duration by 8s.", "核心被动和额外能力的增益持续时间延长8秒。"),
      effect(2, "心象映画2", "Mindscape 2", "心象电影2", "通常・ダッシュ・回避反撃・クイック支援命中時15%で渦流を1得る（毎秒1回）。最大時の余剰はEP1.2に変換する。", "Basic, Dash, Dodge Counter, and Quick Assist hits have a 15% chance to grant 1 Vortex once per second; excess at max converts to 1.2 Energy.", "普攻、冲刺、闪避反击和快速支援命中有15%概率获得1层涡流，每秒一次；满层后的额外层数转化为1.2点能量。"),
      effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
      effect(4, "心象映画4", "Mindscape 4", "心象电影4", "旗揚げ命中時、敵の氷耐性を10%下げる（8秒）。", "Fly the Flag hits reduce enemy Ice RES by 10% for 8s.", "旗扬命中时，敌人的冰属性抗性降低10%，持续8秒。"),
      effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
      effect(6, "心象映画6", "Mindscape 6", "心象电影6", "霜旗状態の強化通常・ダッシュの使用可能回数を12回にし、与ダメージを45%上げる。", "In Frosted Banner, increases enhanced Basic/Dash uses to 12 and raises their DMG by 45%.", "霜旗状态下强化普攻和冲刺攻击可使用12次，造成的伤害提高45%。"),
    ],
  },
};

Object.assign(CURATED, {
  "hsr:1305": { ...SOURCE.hsr, sourceUrl: "https://www.prydwen.gg/star-rail/characters/dr-ratio", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "開幕時にSummationを4層得て、上限を4層増やす。", "Starts with 4 Summation stacks and raises its cap by 4.", "开场获得4层推演，并使其上限提高4层。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "天賦追加攻撃時、敵デバフ数に応じて攻撃力20%の虚数追加ダメージを最大4回与える。", "Talent follow-ups deal up to 4 additional Imaginary hits worth 20% ATK per enemy debuff.", "天赋追加攻击会按敌方减益数量，最多造成4次相当于攻击力20%的虚数追加伤害。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技を2、通常攻撃を1レベル上げる。", "Raises Ultimate by 2 and Basic ATK by 1.", "终结技提高2级，普攻提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "天賦追加攻撃の発動時にEPを15回復する。", "Restores 15 Energy when the Talent follow-up triggers.", "天赋追加攻击触发时回复15点能量。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルと天賦を2レベル上げる。", "Raises Skill and Talent by 2.", "战技与天赋提高2级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "賢者の愚行の追撃回数を1増やし、天賦追加攻撃ダメージを50%上げる。", "Adds 1 Wiseman's Folly follow-up and raises Talent follow-up DMG by 50%.", "贤者的短见追加攻击次数增加1次，天赋追加攻击伤害提高50%。"),
  ] },
  "hsr:1005": { ...SOURCE.hsr, sourceUrl: "https://www.prydwen.gg/star-rail/characters/kafka", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "攻撃時、敵の受けるDoTダメージを30%上げる（2ターン）。", "Attacks increase the target's DoT taken by 30% for 2 turns.", "攻击会使目标受到的持续伤害提高30%，持续2回合。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "カフカ在場中、味方全体のDoTダメージを33%上げる。", "While Kafka is on the field, all allies deal 33% more DoT.", "卡芙卡在场时，全队持续伤害提高33%。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "カフカ由来の感電ダメージ発生時にEPを2回復する。", "Restores 2 Energy whenever Kafka's Shock deals damage.", "卡芙卡施加的触电造成伤害时回复2点能量。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "必殺技・秘技・天賦追撃の感電倍率を156%上げ、継続を1ターン延長する。", "Raises Shock multipliers from Ultimate, Technique, and Talent follow-ups by 156% and extends them by 1 turn.", "终结技、秘技与天赋追击的触电倍率提高156%，持续时间延长1回合。"),
  ] },
  "hsr:1214": { ...SOURCE.hsr, sourceUrl: "https://www.prydwen.gg/star-rail/characters/black-swan", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "DoTを受ける敵の対応属性耐性を25%下げる。", "Enemies taking DoT lose 25% of the corresponding Attribute RES.", "受到持续伤害的敌人对应属性抗性降低25%。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "敵出現時、基礎確率100%でアルカナ30層を付与する。", "When enemies enter, has a 100% base chance to apply 30 Arcana stacks.", "敌人登场时，有100%基础概率施加30层奥迹。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルと天賦を2レベル上げる。", "Raises Skill and Talent by 2.", "战技与天赋提高2级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "悟り状態の敵の被ダメージを20%上げ、ターン開始・撃破時にEPを8回復する。", "Epiphany enemies take 20% more damage and restore 8 Energy on turn start or defeat.", "顿悟状态敌人受到的伤害提高20%，回合开始或被击败时回复8点能量。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技を2、通常攻撃を1レベル上げる。", "Raises Ultimate by 2 and Basic ATK by 1.", "终结技提高2级，普攻提高1级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "アルカナ上限を30増やし、味方攻撃時のアルカナ付与と本人の同時付与数を強化する。", "Raises the Arcana cap by 30 and strengthens Arcana application from allied attacks and Black Swan's own application.", "奥迹上限提高30层，并强化队友攻击时的奥迹施加与自身同时施加数量。"),
  ] },
  "hsr:1212": { ...SOURCE.hsr, sourceUrl: "https://www.prydwen.gg/star-rail/characters/jingliu", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "必殺技または強化戦闘スキル時に会心ダメージ+36%（1ターン）と主目標への氷追加ダメージを得る。", "Ultimate or enhanced Skill grants 36% CRIT DMG for 1 turn and extra Ice damage to the main target.", "终结技或强化战技会获得36%暴击伤害（持续1回合），并对主目标造成额外冰伤。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "必殺技後、次の強化戦闘スキルダメージを80%上げる。", "After Ultimate, increases the next enhanced Skill's DMG by 80%.", "施放终结技后，下一次强化战技伤害提高80%。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "特殊状態中、月光1層ごとに会心ダメージを20%上げる。", "While in the special state, each Moonlight stack grants 20% CRIT DMG.", "特殊状态下，每层月光使暴击伤害提高20%。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "特殊状態進入時にシジジー上限+1・2層獲得・氷耐性貫通+30%を得る。", "Entering the special state raises Syzygy cap by 1, grants 2 stacks, and provides 30% Ice RES PEN.", "进入特殊状态时，朔望上限提高1层、获得2层并获得30%冰抗性穿透。"),
  ] },
  "genshin:10000025": { ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/297531", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "雨すだれの剣の最大数を1増やす。", "Increases the maximum number of Rain Swords by 1.", "雨帘剑的最大数量增加1柄。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "元素爆発を3秒延長し、剣雨命中敵の水元素耐性を15%下げる（4秒）。", "Extends Burst by 3s and lowers Hydro RES of Rain Sword targets by 15% for 4s.", "元素爆发持续时间延长3秒，剑雨命中敌人的水抗降低15%，持续4秒。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "元素爆発中、元素スキルダメージを50%上げる。", "Increases Elemental Skill DMG by 50% during Burst.", "元素爆发期间元素战技伤害提高50%。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "剣雨2回発動後の3回目を強化し、命中時にEPを3回復する。", "Empowers the third Rain Sword wave after two triggers and restores 3 Energy on hit.", "两次剑雨触发后强化第三波，命中时回复3点元素能量。"),
  ] },
  "genshin:10000023": { ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/297530", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "グゥオパァ命中敵の炎元素耐性を15%下げる（6秒）。", "Guoba hits lower Pyro RES by 15% for 6s.", "锅巴命中敌人的火抗降低15%，持续6秒。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "通常攻撃最終段後に攻撃力75%の炎範囲ダメージを与える。", "After the final Normal hit, deals AoE Pyro DMG equal to 75% ATK.", "普攻最后一段后造成相当于攻击力75%的火元素范围伤害。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "旋火輪の継続時間を40%延長する。", "Extends Pyronado duration by 40%.", "旋火轮持续时间延长40%。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "旋火輪中、味方全体の炎元素ダメージを15%上げる。", "During Pyronado, all allies gain 15% Pyro DMG.", "旋火轮期间，全队火元素伤害提高15%。"),
  ] },
  "genshin:10000031": { ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/297524", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "オズ不在でも通常攻撃時に攻撃力22%の協同雷攻撃を行う。", "Even without Oz, Normal Attacks trigger a coordinated Electro hit worth 22% ATK.", "即使奥兹不在场，普攻时也会进行相当于攻击力22%的协同雷元素攻击。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "元素スキル使用時に攻撃力200%の追加雷ダメージを与え、範囲を50%広げる。", "Skill casting deals an extra 200% ATK Electro hit with 50% more area.", "施放元素战技时额外造成攻击力200%的雷伤，范围扩大50%。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "元素爆発時に周囲へ攻撃力222%の雷ダメージを与え、終了時にHPを20%回復する。", "Burst deals 222% ATK AoE Electro DMG and restores 20% HP on completion.", "元素爆发时造成攻击力222%的雷元素范围伤害，结束时回复20%生命。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "オズの継続を2秒延長し、通常キャラクターと協同する雷攻撃を追加する。", "Extends Oz by 2s and adds coordinated Electro attacks with the active character.", "奥兹持续时间延长2秒，并增加与当前角色协同的雷元素攻击。"),
  ] },
  "zzz:1181": { ...SOURCE.zzz, sourceUrl: "https://www.prydwen.gg/zenless/characters/grace-howard", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "通常攻撃4段目命中時、全隊員にEP0.25を与える（同一技最大2回）。", "The fourth Basic hit grants the squad 0.25 Energy, up to twice per skill.", "普攻第四段命中时为全队回复0.25点能量，同一技能最多2次。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "手榴弾命中敵の雷耐性と雷異常蓄積耐性を8.5%下げる（8秒）。", "Grenade hits lower Electric RES and Electric Anomaly buildup RES by 8.5% for 8s.", "手榴弹命中敌人时，电抗与电异常积蓄抗性降低8.5%，持续8秒。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "EX特殊後にCharge6層を得て、通常・ダッシュ攻撃で消費時のEP獲得率を20%上げる。", "After EX Special, gains 6 Charge stacks that raise Energy generation from consuming them by 20%.", "强化特殊技后获得6层电荷，普攻或冲刺攻击消耗时能量获取率提高20%。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "Zap全消費の特殊／EX特殊時に追加手榴弾を投げ、各手榴弾ダメージを200%へ増加する。", "Special or EX Special consuming all Zap throws extra grenades and raises each grenade's DMG to 200%.", "完全消耗电荷的特殊技或强化特殊技会投掷额外手榴弹，并使每枚手榴弹伤害提高至200%。"),
  ] },
  "zzz:1171": { ...SOURCE.zzz, sourceUrl: "https://www.prydwen.gg/zenless/characters/burnice", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "Heat上限を140、出場時Heatを+40し、Afterburn倍率と炎異常蓄積を上げる。", "Raises Heat cap to 140, grants 40 Heat on entry, and increases Afterburn scaling and Fire buildup.", "Heat上限提高至140，入场时额外获得40点，并提高余烬伤害倍率与火异常积蓄。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "Afterburn時に熱侵入を最大5層付与し、味方命中ごとに貫通率を最大20%上げる。", "Afterburn applies up to 5 Thermal Penetration stacks, granting allies up to 20% PEN Ratio on hit.", "余烬会施加最多5层热穿透，队友命中时最多获得20%穿透率。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "EX特殊／支援攻撃の会心率を30%上げ、Double Shot最大噴射を1秒延長する。", "Raises EX Special and Assist Attack CRIT Rate by 30% and extends Double Shot's maximum spray by 1s.", "强化特殊技与支援攻击暴击率提高30%，双重喷射最大持续时间延长1秒。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "Double Shotに特殊Afterburn、炎耐性-25%、燃焼敵への追加燃焼ダメージを付与する。", "Double Shot gains special Afterburn, 25% Fire RES ignore, and extra Burn damage against Burned enemies.", "双重喷射获得特殊余烬、25%火抗无视，以及对燃烧敌人的额外燃烧伤害。"),
  ] },
  "zzz:1151": { ...SOURCE.zzz, sourceUrl: "https://www.prydwen.gg/zenless/characters/lucy", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "Guard BoarのSpinning Swing時にEPを2回復する（15秒、各Boar別管理）。", "Guard Boar Spinning Swing restores 2 Energy every 15s per Boar.", "守卫小猪施放旋转挥击时恢复2点能量，每只小猪独立计时15秒。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "連携／終結スキル時に全隊員・Bangboo・BoarへCheer On!を10秒付与する。", "Chain Attack or Ultimate grants Cheer On! to the squad, Bangboo, and Boars for 10s.", "连携技或终结技会为全队、邦布与小猪赋予持续10秒的加油效果。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "Cheer On!中の味方会心ダメージを10%上げる。", "Raises allies' CRIT DMG by 10% while Cheer On! is active.", "加油状态下，队友暴击伤害提高10%。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "Cheer On!中の味方EX特殊命中時にBoarが落下し、バフを最大30秒まで延長する。", "Allied EX Special hits during Cheer On! drop a Boar attack and extend the buff up to 30s.", "加油状态下队友强化特殊技命中会落下小猪攻击，并将增益最多延长至30秒。"),
  ] },
});

Object.assign(CURATED, {
  "hsr:1101": { ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/405750", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "戦闘スキル使用時、50%でSPを1回復する（1ターンに1回）。", "Using Skill has a 50% chance to recover 1 Skill Point, once per turn.", "施放战技时有50%概率回复1点战技点，每回合一次。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "戦闘スキルの対象が行動後、速度を1ターン30%上げる。", "After the Skill target acts, increases its SPD by 30% for 1 turn.", "战技目标行动后，速度提高30%，持续1回合。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "味方が風弱点の敵へ通常攻撃後、ブローニャが追加攻撃を行う（各ターン1回）。", "After an ally uses Basic ATK on a Wind-weak enemy, Bronya makes a follow-up attack once per turn.", "队友对风弱点敌人施放普攻后，布洛妮娅追加攻击，每回合一次。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "戦闘スキルによる与ダメージ上昇の継続時間を1ターン延長する。", "Extends the Skill's DMG-boost duration by 1 turn.", "战技造成的伤害提高效果持续时间延长1回合。"),
  ] },
  "hsr:1006": { ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/405757", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "必殺技後、対象のデバフ数に応じてEPを回復する（最大5個）。", "After Ultimate, restores Energy per debuff on the target, up to 5 debuffs.", "施放终结技后，按目标负面效果数量回复能量，最多计5个。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "敵が戦闘に入る時、その敵の効果抵抗を20%下げる。", "When an enemy enters battle, reduces its Effect RES by 20%.", "敌人进入战斗时，其效果抵抗降低20%。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルと天賦を2レベル上げる。", "Raises Skill and Talent by 2.", "战技与天赋提高2级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "必殺技後、対象のデバフ数に応じて攻撃力20%分の量子追加ダメージを与える（最大5回）。", "After Ultimate, deals up to 5 additional Quantum hits worth 20% ATK per target debuff.", "终结技后，按目标负面效果数量最多造成5次相当于攻击力20%的量子追加伤害。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技を2、通常攻撃を1レベル上げる。", "Raises Ultimate by 2 and Basic ATK by 1.", "终结技提高2级，普攻提高1级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "敵のデバフ1個ごとに自身の与ダメージを20%上げる（最大5層）。", "Raises Silver Wolf's DMG by 20% per enemy debuff, up to 5 stacks.", "敌人每有1个负面效果，自身造成的伤害提高20%，最多5层。"),
  ] },
  "hsr:1208": { ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/405760", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "行列状態中、味方全体の会心ダメージを30%上げる。", "While Matrix is active, all allies gain 30% CRIT DMG.", "穷观阵状态下，全队暴击伤害提高30%。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "行列中の味方が致死ダメージを受ける時、1戦闘に1回だけ戦闘不能を防ぎHPを70%回復する。", "Once per battle, Matrix allies survive lethal damage and restore 70% HP.", "穷观阵中的队友受到致命伤害时，每场战斗一次防止战斗不能并回复70%生命。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルと天賦を2レベル上げる。", "Raises Skill and Talent by 2.", "战技与天赋提高2级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "行列中の味方が攻撃を受けると、符玄のEPを5回復する。", "When a Matrix ally is hit, restores 5 Energy to Fu Xuan.", "穷观阵中的队友受击时，符玄回复5点能量。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技を2、通常攻撃を1レベル上げる。", "Raises Ultimate by 2 and Basic ATK by 1.", "终结技提高2级，普攻提高1级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "戦闘中に味方全体が失ったHP合計に応じ、必殺技ダメージを上げる。", "Raises Ultimate DMG based on total HP lost by all allies during battle.", "按战斗中全队累计损失生命值提高终结技伤害。"),
  ] },
  "hsr:1203": { ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/405764", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "結界中、味方全体の攻撃力を20%上げる。", "While the field is active, all allies gain 20% ATK.", "结界中，全队攻击力提高20%。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "スキルの治癒対象がHP50%未満なら治癒量を増やし、50%以上ならバリアを付与する。", "Skill increases healing below 50% HP or grants a shield at 50% HP or above.", "战技目标生命低于50%时提高治疗量，50%及以上时提供护盾。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "結界中、敵の与ダメージを12%下げる。", "While the field is active, enemies deal 12% less DMG.", "结界中，敌方造成的伤害降低12%。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "必殺技使用時、敵全体の全属性耐性を20%下げる。", "Using Ultimate reduces all enemies' All-Type RES by 20%.", "施放终结技时，使全体敌人的全属性抗性降低20%。"),
  ] },
  "genshin:10000082": { ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/314348", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "元素スキルの使用可能回数を1回増やす。", "Grants 1 additional Elemental Skill charge.", "元素战技可使用次数增加1次。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "出場キャラの通常・重撃・落下・スキル・爆発命中時、追加の草攻撃と回復を行う。", "When the active character hits with attacks or abilities, triggers additional Dendro damage and healing.", "当前角色的普攻、重击、下落、战技或爆发命中时，触发额外草伤与治疗。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "元素爆発中、味方全体の元素熟知を80上げる。", "During Burst, increases all party members' Elemental Mastery by 80.", "元素爆发期间，全队元素精通提高80。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "最大HPに応じて元素爆発のシールドと追加追撃を強化する。", "Enhances Burst shields and additional attacks based on Max HP.", "按最大生命值强化元素爆发护盾和额外追击。"),
  ] },
  "genshin:10000058": { ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/327533", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "殺生櫻が破壊されるたび、元素エネルギーを回復する。", "Restores Elemental Energy whenever a Sesshou Sakura is destroyed.", "每有一株杀生樱被摧毁时，回复元素能量。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "殺生櫻が初期ランク2となり、最大ランクを1上げ、落雷範囲を広げる。", "Sesshou Sakura start at Level 2, gain 1 maximum level, and have a larger strike area.", "杀生樱初始等级变为2级，等级上限提高1级，落雷范围扩大。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "殺生櫻の落雷後、近くの味方全員の雷元素ダメージを20%上げる。", "After a Sesshou Sakura strike, nearby allies gain 20% Electro DMG Bonus.", "杀生樱落雷后，附近队友获得20%雷元素伤害加成。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "殺生櫻の攻撃が敵防御力の一部を無視する。", "Sesshou Sakura attacks ignore a portion of enemy DEF.", "杀生樱攻击会无视部分敌方防御力。"),
  ] },
  "genshin:10000049": { ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/333497", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "琉金の雲間草の持続を4秒延長し、対象撃破時に攻撃力を20%上げる。", "Extends Aurous Blaze by 4s and grants 20% ATK for 20s when an affected enemy is defeated.", "琉金火光持续时间延长4秒，受影响敌人被击败时攻击力提高20%，持续20秒。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "炎元素ダメージが会心時、炎元素ダメージを6秒間25%上げる。", "Pyro CRIT hits grant 25% Pyro DMG Bonus for 6s.", "火元素伤害造成暴击时，获得25%火元素伤害加成，持续6秒。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "自身の琉金の雲間草が爆発すると、元素スキルのクールダウンを1.2秒短縮する。", "When Yoimiya's own Aurous Blaze explodes, reduces Skill cooldown by 1.2s.", "宵宫自身的琉金火光爆炸时，元素战技冷却缩短1.2秒。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "命ノ星座6", "元素スキル中、通常攻撃は50%で元の60%倍率の追加矢を放つ。", "During Skill, Normal Attacks have a 50% chance to fire an extra arrow for 60% original DMG.", "元素战技期间，普通攻击有50%概率发射一枚造成原伤害60%的额外箭矢。"),
  ] },
  "zzz:1071": { ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/464303", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "出場・交代時にチームへ輝きの盾を付与し、盾保持者近傍の敵の属性耐性を15%下げる。", "On entry or swap, grants Radiant Aegis; nearby enemies lose 15% Attribute RES while it is held.", "入场或换人时为队伍赋予辉光之盾，持盾者附近敌人的属性抗性降低15%。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "盾中のエネルギー回復を10%上げ、攻撃力上昇効果を150%へ強化する。", "Raises Energy generation under shield by 10% and enhances its ATK increase to 150%.", "护盾期间能量回复提高10%，攻击力提升效果强化至150%。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "連携または終結スキルで追加支援ポイントを得て、条件付きでEX特殊を強化する。", "Chain Attack or Ultimate grants an extra Assist Point and conditionally enhances EX Special.", "连携技或终结技获得额外支援点，并条件强化强化特殊技。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "EX特殊・支援追撃の会心を固定し、ダメージと会心効果を強化する。", "Makes EX Special and Assist Follow-Up hits guaranteed CRITs and enhances their damage and CRIT effects.", "强化特殊技和支援追击必定暴击，并强化伤害与暴击效果。"),
  ] },
  "zzz:1211": { ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/436876", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "人形の場残り時間を5.5秒延長し、10m以内ではコア効果を130%へ強化する。", "Extends puppet field time by 5.5s and raises Core effect to 130% within 10m.", "人偶在场时间延长5.5秒，10米内核心效果提高至130%。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "出場時、自身の与ダメージを15%上げる。", "On entry, increases Rina's DMG by 15%.", "入场时，自身造成的伤害提高15%。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "2体の人形を展開中、エネルギー自動回復を上げる。", "Increases Energy Regen while both puppets are deployed.", "两个人偶均部署时，提高能量自动回复。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "EX特殊・連携・終結スキル命中後、味方全体の電気属性ダメージを15%上げる。", "After EX Special, Chain Attack, or Ultimate hits, all allies gain 15% Electric DMG.", "强化特殊技、连携技或终结技命中后，全队电气属性伤害提高15%。"),
  ] },
  "zzz:1251": { ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/460407", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "開幕時に電圧を最大まで得て蓄積速度を30%上げ、最大時に敵防御力を15%下げ自身の会心率を20%上げる。", "Starts at maximum Voltage and gains 30% buildup; at maximum, reduces enemy DEF by 15% and gains 20% CRIT Rate.", "开场获得满层电压并使积累速度提高30%；满层时敌方防御降低15%，自身暴击率提高20%。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "畏服1層のブレイク倍率を135%へ上げ、最大層でブレイクを15%上げる。", "Raises one Subjugation stack's stun multiplier to 135% and grants 15% stun at maximum stacks.", "将1层威服的失衡倍率提高至135%，满层时失衡提高15%。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "電圧状態の出入りで最大HP10%のシールドを得て、条件付きでエネルギーを回復する。", "Entering or leaving Voltage grants a shield worth 10% Max HP and conditionally restores Energy.", "进出电压状态时获得相当于最大生命10%的护盾，并条件回复能量。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "強化通常の中断耐性と会心ダメージを100%上げ、敵全属性耐性を20%下げる。", "Raises enhanced Basic interruption resistance and CRIT DMG by 100%, and reduces enemy All-Attribute RES by 20%.", "强化普攻的抗打断能力与暴击伤害提高100%，敌方全属性抗性降低20%。"),
  ] },
});

Object.assign(CURATED, {
  "hsr:1015": { ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/519877", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "同一ターンにスキルを3回使用後、味方SPを2回復する。", "After using Skill 3 times in one turn, restores 2 Skill Points for allies.", "同一回合施放3次战技后，为队伍恢复2点战技点。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "必殺技時、対象の量子耐性を20%下げ、量子弱点を付与する（2ターン）。", "Ultimate reduces the target's Quantum RES by 20% and implants Quantum Weakness for 2 turns.", "施放终结技时，目标量子抗性降低20%，并植入量子弱点，持续2回合。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "必殺技ダメージを150%上げる。", "Increases Ultimate DMG by 150%.", "终结技伤害提高150%。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "ターン開始時に味方SPを1回復し、スキルの与ダメージ上昇上限を1増やし、防御力20%無視を得る。", "At turn start recovers 1 Skill Point, raises the Skill DMG-boost cap by 1, and grants 20% DEF ignore.", "回合开始时恢复1点战技点，战技伤害提升上限增加1层，并获得20%无视防御。"),
  ] },
  "hsr:1008": { ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/405754", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "HP50%以下時、スキルダメージを10%上げる。", "Increases Skill DMG by 10% while HP is at or below 50%.", "生命值低于或等于50%时，战技伤害提高10%。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "スキルまたは必殺技使用時、自身のデバフを1個解除する。", "Using Skill or Ultimate removes 1 debuff from Arlan.", "施放战技或终结技时，解除自身1个负面效果。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "致死ダメージ時、HP25%で1度だけ耐える（発動または2ターンで消失）。", "Once prevents lethal damage at 25% HP; the effect ends after triggering or 2 turns.", "受到致命伤害时以25%生命值存活一次；触发后或2回合后失效。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "HP50%以下時、必殺技ダメージを20%上げ、隣接敵への倍率を主対象と同等へ上げる。", "Below 50% HP, raises Ultimate DMG by 20% and makes adjacent-target scaling equal to the main target.", "生命值低于50%时，终结技伤害提高20%，相邻目标倍率提升至与主目标相同。"),
  ] },
  "hsr:1009": { ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/405743", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "スキルの追加ヒット回数を1増やす。", "Adds 1 extra hit to Skill.", "战技额外命中次数增加1次。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "必殺技後、次のターンにチャージ段階が減少しない。", "After Ultimate, Charge stacks do not decrease on the next turn.", "施放终结技后，下回合蓄能层数不会减少。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルと天賦を2レベル上げる。", "Raises Skill and Talent by 2.", "战技与天赋提高2级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "チャージ2以上でEP回復効率を15%上げる。", "At 2 or more Charge stacks, increases Energy Regeneration Rate by 15%.", "蓄能层数不少于2时，能量恢复效率提高15%。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技を2、通常攻撃を1レベル上げる。", "Raises Ultimate by 2 and Basic ATK by 1.", "终结技提高2级，普攻提高1级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "毎ターン失うチャージ段階を1減らす。", "Reduces Charge stacks lost each turn by 1.", "每回合损失的蓄能层数减少1层。"),
  ] },
  "hsr:1302": { ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/428046", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "崇高1層ごとに会心ダメージを4%上げる。", "Each Apotheosis stack increases CRIT DMG by 4%.", "每层升格使暴击伤害提高4%。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "必殺技時に敵が3体以上なら、攻撃力を1ターン40%上げる。", "When using Ultimate against 3 or more enemies, increases ATK by 40% for 1 turn.", "施放终结技时若敌人不少于3名，攻击力提高40%，持续1回合。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルと天賦を2レベル上げる。", "Raises Skill and Talent by 2.", "战技与天赋提高2级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "戦闘開始時に崇高を2得て、上限を2上げる。", "At battle start gains 2 Apotheosis stacks and raises their maximum by 2.", "战斗开始时获得2层升格，并使上限提高2层。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技を2、通常攻撃を1レベル上げる。", "Raises Ultimate by 2 and Basic ATK by 1.", "终结技提高2级，普攻提高1级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "必殺技時、敵の防御力を30%無視する。", "Ultimate ignores 30% of enemy DEF.", "终结技无视敌人30%防御力。"),
  ] },
  "genshin:10000121": { ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/537903", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "スキルまたは爆発後、自身と近くの味方の元素熟知を80上げる（15秒）。", "After Skill or Burst, increases Aino and nearby allies' Elemental Mastery by 80 for 15s.", "施放战技或元素爆发后，自身与附近队友元素精通提高80点，持续15秒。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "元素爆発領域中に待機していると、一定間隔で追加の水弾を放つ。", "While waiting within the Burst field, periodically fires additional Hydro projectiles.", "待在元素爆发领域内时，会间隔发射额外水弹。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "スキル命中時、10秒ごとにEPを10回復する。", "Skill hits restore 10 Energy once every 10s.", "战技命中时每10秒恢复10点元素能量。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "爆発後15秒、近くの出場キャラの感電・開花・月感電・月開花ダメージを15%上げ、Ascendant Gleam中はさらに20%上げる。", "For 15s after Burst, increases nearby active characters' Electro-Charged, Bloom, Lunar-Charged, and Lunar-Bloom DMG by 15%, plus 20% during Ascendant Gleam.", "元素爆发后15秒，附近场上角色的感电、绽放、月感电和月绽放伤害提高15%，处于升耀状态时额外提高20%。"),
  ] },
  "genshin:10000038": { ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/312182", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "刹那の花が生成するエネルギーを1.2回復し、スキル後20秒間、防御力を50%上げる。", "Transient Blossoms restore 1.2 Energy and Skill grants 50% DEF for 20s.", "刹那之花回复1.2点能量，施放战技后防御力提高50%，持续20秒。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "刹那の花でFatal Reckoningを得て、爆発時に最大4層を消費し防御力基準のダメージを強化する。", "Transient Blossoms grant Fatal Reckoning; Burst consumes up to 4 stacks to enhance DEF-scaling damage.", "刹那之花获得命运之核，元素爆发时消耗最多4层以强化基于防御力的伤害。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "陽華領域内の出場キャラの落下攻撃ダメージを30%上げる。", "Increases active characters' Plunging Attack DMG by 30% inside Solar Isotoma.", "阳华领域内场上角色的下落攻击伤害提高30%。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "結晶シールド下で陽華領域内の与ダメージを17%上げ、爆発で追加のFatal Reckoningを消費して刹那の花を強化する。", "Under a Crystallize shield, increases DMG by 17% in Solar Isotoma and lets Burst consume extra Fatal Reckoning to enhance Blossoms.", "处于结晶护盾下时，阳华领域内造成的伤害提高17%，元素爆发可额外消耗命运之核强化刹那之花。"),
  ] },
  "zzz:1041": { ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/436882", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "出場・交代時にEPを80まで回復する（50秒ごと）。", "On entry or switch-in, restores Energy up to 80 once every 50s.", "入场或切换上场时，将能量回复至80点，每50秒一次。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "炎抑制発動時、通常・ダッシュ・回避反撃のダメージを最大12層まで上げる。", "Activating Fire Suppression increases Basic, Dash, and Dodge Counter DMG by up to 12 stacks.", "触发火力镇压时，提高普攻、冲刺攻击和闪避反击伤害，最多12层。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "特定の通常・ダッシュ攻撃中に被ダメージ軽減と無敵効果を得る。", "Gains damage reduction and invulnerability during specified Basic and Dash attacks.", "在特定普攻和冲刺攻击期间获得减伤与无敌效果。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "EX特殊・連携・終結でChargeを8層得て、炎抑制中に消費すると敵炎耐性を25%無視する。", "EX Special, Chain Attack, and Ultimate grant 8 Charge; spending it during Fire Suppression ignores 25% Fire RES.", "强化特殊技、连携技和终结技获得8层蓄能，火力镇压期间消耗时无视25%火抗。"),
  ] },
  "zzz:1461": { ...SOURCE.zzz, sourceUrl: "https://www.prydwen.gg/zenless/characters/seed", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "Downfallの鋼鉄チャージ必要量を100へ下げ、出場/終結時の鋼鉄チャージを増やし、会心ダメージを上げる。", "Lowers Downfall's Steel Charge requirement to 100, grants extra Steel Charge on entry/Ultimate, and raises its CRIT DMG.", "将坠落攻击所需钢铁蓄力降至100，入场或终结技时获得额外钢铁蓄力，并提高其暴击伤害。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "Besiege中、対象エージェントのダメージは防御力を20%無視し、EX特殊の消費上限を拡張する。", "While Besiege is active, the affected agent ignores 20% DEF and EX Special can consume more Energy.", "围攻状态下，受影响代理人无视20%防御，强化特殊技可消耗更多能量。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "Besiege中、デシベル生成率を10%、終結ダメージを20%上げる。", "While Besiege is active, increases Decibel generation by 10% and Ultimate DMG by 20%.", "围攻状态下，喧响值获取率提高10%，终结技伤害提高20%。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "会心ダメージを50%上げ、Slaughter時に追加レーザー3本を発射する。", "Increases CRIT DMG by 50% and fires 3 additional lasers when using Slaughter.", "暴击伤害提高50%，施放屠戮时额外发射3道激光。"),
  ] },
  "zzz:1361": { ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/495167", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "コアのブレイク倍率を追加で20%上げ、Purge上限を125へ引き上げる。", "Raises the Core stun multiplier by an additional 20% and increases the Purge cap to 125.", "核心技的失衡倍率额外提高20%，净化值上限提高至125。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "Aftershock等で得るHunter's Gazeにより、全隊の会心ダメージを最大24%上げる。", "Hunter's Gaze gained through Aftershocks and related actions raises squad CRIT DMG by up to 24%.", "通过追击等获得猎人凝视，使全队暴击伤害最多提高24%。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "Coordinated Support中のAftershockで追加ダメージとブレイクを与える。", "Aftershocks during Coordinated Support deal additional damage and Daze.", "协同支援期间的追击造成额外伤害与失衡值。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・支援・回避・特殊・連携スキルを2レベル上げる。", "Raises Basic, Assist, Dodge, Special, and Chain skills by 2.", "普攻、支援、闪避、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "Armor Break Roundsを使う狙撃に追加の電気ダメージを与える。", "Sniper attacks using Armor Break Rounds deal additional Electric DMG.", "使用破甲弹的狙击造成额外电气伤害。"),
  ] },
  "hsr:1004": { ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/405763", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "必殺技後、次の通常攻撃またはスキル2回に追加虚数ダメージを与える。", "After Ultimate, the next 2 Basic ATKs or Skills deal additional Imaginary DMG.", "施放终结技后，接下来的2次普攻或战技造成额外虚数伤害。"),
    effect(2, "星魂2", "Eidolon 2", "天賦発動時にEPを3回復する。", "When Talent triggers, restores 3 Energy.", "天赋触发时回复3点能量。"),
    effect(3, "星魂3", "Eidolon 3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "戦闘スキルの速度低下の基礎確率を35%上げる。", "Raises Skill's base chance to reduce SPD by 35%.", "战技降低速度的基础概率提高35%。"),
    effect(5, "星魂5", "Eidolon 5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
    effect(6, "星魂6", "Eidolon 6", "戦闘スキルがランダムな敵へ追加で1ヒットする。", "Skill deals 1 additional hit to a random enemy.", "战技额外随机攻击1名敌人一次。"),
  ] },
  "hsr:1301": { ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/437255", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "戦闘開始時にEPを20回復し、効果抵抗を50%上げる。", "At battle start restores 20 Energy and gains 50% Effect RES.", "战斗开始时回复20点能量，效果抵抗提高50%。"),
    effect(2, "星魂2", "Eidolon 2", "戦闘スキルでデバフを1つ解除し、効果抵抗を2ターン30%上げる。", "Skill removes 1 debuff and grants 30% Effect RES for 2 turns.", "战技解除1个负面效果，并使效果抵抗提高30%，持续2回合。"),
    effect(3, "星魂3", "Eidolon 3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "酩酊状態の持続時間を1ターン延長する。", "Extends Besotted's duration by 1 turn.", "延长酩酊状态1回合。"),
    effect(5, "星魂5", "Eidolon 5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
    effect(6, "星魂6", "Eidolon 6", "撃破特効を20%上げ、弱点撃破効率を20%上げる。", "Increases Break Effect by 20% and Weakness Break Efficiency by 20%.", "击破特攻提高20%，削韧效率提高20%。"),
  ] },
  "hsr:1415": { ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/541348", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "Ode to Ego中に追憶を6得て、跳弾数を12増やす。", "During Ode to Ego, gains 6 Remembrance and 12 additional bounces.", "自我颂歌期间获得6点追忆，跳弹次数增加12次。"),
    effect(2, "星魂2", "Eidolon 2", "開幕時に追憶を12得て、固有バフ対象数に応じ真ダメージ倍率を上げる。", "Starts with 12 Remembrance and raises True DMG scaling by the number of innate-buff targets.", "开场获得12点追忆，并按固有增益目标数提高真实伤害倍率。"),
    effect(3, "星魂3", "Eidolon 3", "必殺技と天賦を2、記憶霊スキルを1レベル上げる。", "Raises Ultimate and Talent by 2 and Memosprite Skill by 1.", "终结技与天赋提高2级，忆灵技提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "Minuet使用ごとにOde to Egoの跳弾倍率を6%上げる（最大4層）。", "Each Minuet increases Ode to Ego bounce scaling by 6%, up to 4 stacks.", "每次使用小步舞曲使自我颂歌跳弹倍率提高6%，最多4层。"),
    effect(5, "星魂5", "Eidolon 5", "戦闘スキルを2、通常攻撃と記憶霊天賦を1レベル上げる。", "Raises Skill by 2 and Basic ATK plus Memosprite Talent by 1.", "战技提高2级，普攻与忆灵天赋提高1级。"),
    effect(6, "星魂6", "Eidolon 6", "初回必殺技で全体行動順を100%早め、以後は防御低下と行動順前進を付与する。", "The first Ultimate advances all allies by 100%; later effects grant DEF reduction and action advance.", "首次终结技使全队行动提前100%，后续赋予减防与行动提前。"),
  ] },
  "hsr:1509": { ...SOURCE.hsr, sourceUrl: "https://game8.co/games/Honkai-Star-Rail/archives/601941", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "王の承認の防御無視を味方へ共有し、自身の攻撃力を60%上げ、スキル時にEPを40回復する。", "Shares King's Approval DEF ignore with allies, gains 60% ATK, and restores 40 Energy on Skill.", "与队友共享王之认可的无视防御，自身攻击力提高60%，施放战技回复40点能量。"),
    effect(2, "星魂2", "Eidolon 2", "開幕または必殺技時にInterestを5得て、スキル倍率を上げる。", "At battle start or on Ultimate, gains 5 Interest and increases Skill scaling.", "战斗开始或施放终结技时获得5点Interest，并提高战技倍率。"),
    effect(3, "星魂3", "Eidolon 3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "EP回復効率を20%上げる。", "Increases Energy Regeneration Rate by 20%.", "能量恢复效率提高20%。"),
    effect(5, "星魂5", "Eidolon 5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
    effect(6, "星魂6", "Eidolon 6", "必殺技の跳弾倍率を80%上げ、味方全体に全属性耐性貫通20%を与える。", "Raises Ultimate bounce scaling by 80% and grants allies 20% All-Type RES PEN.", "终结技跳弹倍率提高80%，全队获得20%全属性抗性穿透。"),
  ] },
  "genshin:10000021": { ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/297535", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "狙い撃ちが2本になり、2本目は20%ダメージを与える。", "Aimed Shot fires 2 arrows; the second deals 20% DMG.", "瞄准射击变为2支箭，第二支造成20%伤害。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "フルチャージ狙い撃ちでウサギ伯爵を手動起爆し、200%追加ダメージを与える。", "A fully charged Aimed Shot can manually detonate Baron Bunny for 200% extra DMG.", "满蓄力瞄准射击可手动引爆兔兔伯爵，造成200%额外伤害。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "爆弾人形のクールダウンを20%短縮し、使用回数を1増やす。", "Reduces Baron Bunny cooldown by 20% and grants 1 extra charge.", "兔兔伯爵冷却时间缩短20%，使用次数增加1次。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "元素爆発後、味方全体の移動速度を15%、攻撃力を15%上げる（10秒）。", "After Burst, increases party Movement SPD and ATK by 15% for 10s.", "元素爆发后，全队移动速度和攻击力提高15%，持续10秒。"),
  ] },
  "genshin:10000110": { ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/345881", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "夜魂値を6消費するごとに元素エネルギーを15回復する（18秒ごと）。", "Every 6 Nightsoul points consumed restores 15 Energy, once every 18s.", "每消耗6点夜魂值回复15点元素能量，每18秒一次。"),
    effect(2, "命ノ星座2", "Constellation 2", "元素爆発時に精密な動きを得て、待機中の出場キャラの攻撃力を30%上げる。", "Burst grants Precise Movement and raises the active character's ATK by 30%.", "施放元素爆发获得精准动作，并使场上角色攻击力提高30%。"),
    effect(3, "命ノ星座3", "Constellation 3", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "味方の元素爆発後に夜魂値の回復量を増やし、余剰分を次回へ繰り越す。", "After an ally's Burst, improves Nightsoul recovery and carries excess to the next use.", "队友施放元素爆发后提高夜魂值回复，溢出部分可继承至下次。"),
    effect(5, "命ノ星座5", "Constellation 5", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "動力エネルギースケールの持続を3秒延長し、条件達成時に出場キャラの与ダメージを25%上げる。", "Extends Kinetic Energy Scale by 3s and conditionally raises the active character's DMG by 25%.", "动力能量标尺持续时间延长3秒，满足条件时场上角色伤害提高25%。"),
  ] },
  "genshin:10000116": { ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/531360", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "シールド展開後、攻撃力に応じて月感電ダメージを最大50%上げる。", "After deploying a shield, increases Lunar-Charged DMG by up to 50% based on ATK.", "展开护盾后，按攻击力使月感电伤害最多提高50%。"),
    effect(2, "命ノ星座2", "Constellation 2", "元素爆発命中後に裁きの布告で月感電範囲ダメージを与え、味方にシールドを張る。", "After Burst hits, Verdict Decree deals AoE Lunar-Charged DMG and shields allies.", "元素爆发命中后，裁决宣告造成月感电范围伤害并为队友提供护盾。"),
    effect(3, "命ノ星座3", "Constellation 3", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "月感電発生時に元素エネルギーを5回復する（4秒ごと）。", "Lunar-Charged restores 5 Energy once every 4s.", "触发月感电时回复5点元素能量，每4秒一次。"),
    effect(5, "命ノ星座5", "Constellation 5", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "C1の効果中、雷雲発生後に攻撃力135%の月感電範囲ダメージを与える。", "During C1's effect, after a thundercloud appears, deals AoE Lunar-Charged DMG equal to 135% ATK.", "C1效果期间，雷云生成后造成相当于攻击力135%的月感电范围伤害。"),
  ] },
  "zzz:1381": { ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/495109", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "EX特殊で白雷追加ダメージを3回発動し、白雷を消費しない。", "EX Special triggers White Thunder bonus DMG 3 times without consuming White Thunder.", "强化特殊技触发3次白雷追加伤害，且不消耗白雷。"),
    effect(2, "心象映画2", "Mindscape 2", "会心率を12%上げ、必殺技後にThunder's Cryを6層得る。", "Increases CRIT Rate by 12% and grants 6 Thunder's Cry stacks after Ultimate.", "暴击率提高12%，施放终结技后获得6层雷鸣。"),
    effect(3, "心象映画3", "Mindscape 3", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "銀星状態の敵に対して電気耐性を12%無視する。", "Ignores 12% Electric RES against Silver Star enemies.", "对银星状态敌人无视12%电气抗性。"),
    effect(5, "心象映画5", "Mindscape 5", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "白雷追加ダメージ6回後、攻撃力1,000%の電気Aftershockを与える。", "After 6 White Thunder bonus hits, deals an Electric Aftershock equal to 1,000% ATK.", "白雷追加伤害累计6次后，造成相当于攻击力1000%的电气追击。"),
  ] },
  "zzz:1501": { ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/572601", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "エーテル異常蓄積耐性を10%無視し、Abloomが会心可能になる。", "Ignores 10% Ether Anomaly buildup RES and lets Abloom CRIT.", "无视10%以太异常积蓄抗性，并使Abloom能够暴击。"),
    effect(2, "心象映画2", "Mindscape 2", "攻撃とAbloomで防御力を16%無視し、妄想の瞬間中はさらに8%無視する。", "Attacks and Abloom ignore 16% DEF, plus 8% more during Delusional Moment.", "攻击与Abloom无视16%防御，妄想时刻期间额外无视8%。"),
    effect(3, "心象映画3", "Mindscape 3", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "Abloom発生時にエネルギー4とデシベル70を回復する（10秒ごと）。", "Abloom restores 4 Energy and 70 Decibels once every 10s.", "触发Abloom时回复4点能量和70点喧响值，每10秒一次。"),
    effect(5, "心象映画5", "Mindscape 5", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "開幕時にデシベルを1,200得て、妄想の瞬間中の強化通常・必殺のエーテルダメージを40%上げる。", "Starts with 1,200 Decibels and raises Ether DMG of enhanced Basic and Ultimate by 40% during Delusional Moment.", "开场获得1200点喧响值，妄想时刻期间强化普攻与终结技的以太伤害提高40%。"),
  ] },
  "zzz:1401": { ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/527839", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "極性強襲でブレードエチケットを25獲得し、強襲時に敵防御力を20%下げる（30秒）。", "Polarized Assault grants 25 Blade Etiquette and Assault reduces enemy DEF by 20% for 30s.", "极性强击获得25点刃之礼仪，强击使敌方防御降低20%，持续30秒。"),
    effect(2, "心象映画2", "Mindscape 2", "必殺技最終段で極性強襲を発動し、全体強襲・物理異常中の混沌ダメージを15%上げる。", "Ultimate's final hit triggers Polarized Assault and raises squad Assault and Disorder DMG by 15% while Physical Anomaly is active.", "终结技最后一段触发极性强击，物理异常期间全队强击与紊乱伤害提高15%。"),
    effect(3, "心象映画3", "Mindscape 3", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "物理耐性を10%無視し、強化通常の物理異常蓄積を25%上げる。", "Ignores 10% Physical RES and raises enhanced Basic's Physical Anomaly buildup by 25%.", "无视10%物理抗性，强化普攻物理异常积蓄提高25%。"),
    effect(5, "心象映画5", "Mindscape 5", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "3段チャージ通常または必殺技後に勝利状態となり、味方命中時の追撃を最大6回発動する。", "After a 3-stage charged Basic or Ultimate, enters Victory state and triggers up to 6 ally-hit follow-ups.", "三段蓄力普攻或终结技后进入胜利状态，队友命中时最多触发6次追击。"),
  ] },
});

Object.assign(CURATED, {
  "hsr:1107": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/524682", dataAsOf: "2026-08-21", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "戦闘スキル後、反撃の印を解除しなくなる。", "Using Skill no longer removes Marks of Counter.", "施放战技后不再解除反击之印。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "必殺技後、攻撃力を30%上げる（2ターン）。", "After Ultimate, increases ATK by 30% for 2 turns.", "施放终结技后攻击力提高30%，持续2回合。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "攻撃を受けた後、次のターン開始まで被ダメージを30%下げる。", "After being hit, reduces DMG taken by 30% until the next turn starts.", "受到攻击后，受到伤害降低30%，持续至下回合开始。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "味方が攻撃を受けると固定倍率の反撃を行い、必殺技時の強化反撃回数を1増やす。", "When allies are hit, performs a fixed-scaling counter and grants 1 extra enhanced counter during Ultimate.", "队友受击时进行固定倍率反击，并使终结技期间的强化反击次数增加1次。"),
  ] },
  "hsr:1412": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/698898", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "軍功対象の防御無視を強化し、戦闘スキル対象のEPを追加回復する。", "Strengthens DEF ignore for the Merit target and restores additional Energy to the Skill target.", "强化军功目标的无视防御，并额外回复战技目标能量。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "軍功対象の与ダメージを40%上げ、追加の軍功関連効果を得る。", "Raises the Merit target's DMG by 40% and adds further Merit-related effects.", "使军功目标造成的伤害提高40%，并获得额外军功相关效果。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "必殺技のダメージ倍率を240%上げる。", "Raises Ultimate DMG scaling by 240%.", "终结技伤害倍率提高240%。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "軍功対象に耐性貫通と付加ダメージ倍率上昇を与える。", "Grants RES PEN and increased Additional DMG scaling to the Merit target.", "为军功目标提供抗性穿透与附加伤害倍率提升。"),
  ] },
  "hsr:1406": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/678974", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "記録ダメージを元値の150%にし、天賦追加攻撃時に攻撃力を80%上げる（2ターン）。", "Sets recorded DMG to 150% of its base value and grants 80% ATK for 2 turns when Talent follow-up triggers.", "记录伤害变为原值150%，天赋追击时攻击力提高80%，持续2回合。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "命中時、基礎確率120%で敵の被ダメージを30%上げる（2ターン）。", "On hit, has a 120% base chance to increase enemy DMG taken by 30% for 2 turns.", "命中时有120%基础概率使敌人受到伤害提高30%，持续2回合。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技を2、通常攻撃を1レベル上げる。", "Raises Ultimate by 2 and Basic ATK by 1.", "终结技提高2级，普攻提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "味方が「お得意様」を攻撃した後、攻撃力50%分の量子追加ダメージを与える。", "After an ally attacks Patron, deals Quantum Additional DMG equal to 50% ATK.", "队友攻击常客后，造成相当于攻击力50%的量子附加伤害。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルと天賦を2レベル上げる。", "Raises Skill and Talent by 2.", "战技与天赋提高2级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "天賦追加攻撃ダメージを350%上げ、追加記録と必殺技時の一部返還を得る。", "Raises Talent follow-up DMG by 350% and grants extra recording plus partial refund on Ultimate.", "天赋追击伤害提高350%，获得额外记录与终结技时的部分返还。"),
  ] },
  "hsr:1108": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/524681", dataAsOf: "2026-08-11", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "戦闘スキルが追加で1ヒットする。", "Skill gains 1 additional hit.", "战技额外造成1次命中。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "風化状態の敵を倒すと、敵全体へ風化を1層付与する。", "Defeating a Wind Shear enemy applies 1 Wind Shear stack to all enemies.", "击败处于风化状态的敌人时，对全体敌人施加1层风化。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルを2、通常攻撃を1レベル上げる。", "Raises Skill by 2 and Basic ATK by 1.", "战技提高2级，普攻提高1级。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "風化5層以上の敵へスキル命中時、本来ダメージ8%分の風化を追加で発生させる。", "When Skill hits an enemy with 5+ Wind Shear stacks, triggers extra Wind Shear equal to 8% of original DMG.", "战技命中5层以上风化的敌人时，额外触发相当于原伤害8%的风化。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦を2レベル上げる。", "Raises Ultimate and Talent by 2.", "终结技与天赋提高2级。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "天賦の風化ダメージ倍率を15%上げる。", "Increases Talent Wind Shear DMG scaling by 15%.", "天赋的风化伤害倍率提高15%。"),
  ] },
});

const LABELS: Record<CharacterIdentity["game"], LocalizedText> = {
  hsr: t("星魂", "Eidolons", "星魂"),
  genshin: t("命ノ星座", "Constellations", "命之座"),
  zzz: t("心象映画", "Mindscape Cinema", "心象电影"),
};

Object.assign(CURATED, {
  "genshin:10000113": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/639101", dataAsOf: "2026-08-24", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "援護射撃命中時に元素エネルギーを6回復する（8秒ごと）。", "A Supportive Fire hit restores 6 Energy once every 8s.", "援护射击命中时回复6点元素能量，每8秒一次。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "夜魂値に応じて救命の理念を追加獲得し、所持上限を50増やす。", "Gains extra Lifesaving Principles based on Nightsoul points and raises the cap by 50.", "按夜魂值额外获得救命理念，持有上限提高50。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "元素爆発後、元素熟知を100上げる（15秒）。", "After Burst, increases Elemental Mastery by 100 for 15s.", "元素爆发后元素精通提高100，持续15秒。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "長押し援護射撃時、50%で攻撃力120%分の追加風ダメージを与え、非戦闘時の夜魂値・燃素消費を20%下げる。", "Holding Supportive Fire has a 50% chance to fire bonus Anemo DMG equal to 120% ATK and reduces out-of-combat Nightsoul/Phlogiston consumption by 20%.", "长按援护射击有50%概率造成攻击力120%的额外风伤，并使非战斗时夜魂值与燃素消耗降低20%。"),
  ] },
  "genshin:10000111": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/669311", dataAsOf: "2026-08-13", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "特殊落下攻撃時に攻撃力180%分の追加ダメージを与え、探索中の消費を30%下げる。", "Special Plunges deal bonus DMG equal to 180% ATK and reduce exploration consumption by 30%.", "特殊下落攻击造成攻击力180%的额外伤害，并使探索消耗降低30%。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "落下後にマキシマムドライブ化し、元素エネルギーを11.5回復する。", "After a Plunge, enters Maximum Drive and restores 11.5 Energy.", "下落攻击后进入极限驱动并回复11.5点元素能量。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "条件に応じて攻撃力500%分（上限20,000）の落下強化、または元素爆発ダメージ100%上昇を得る。", "Conditionally grants a Plunge boost equal to 500% ATK (max 20,000) or 100% increased Burst DMG.", "按条件获得攻击力500%（上限20000）的下落强化，或元素爆发伤害提高100%。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "通常攻撃を3レベル上げる。", "Raises Normal Attack by 3.", "普通攻击提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "マキシマムドライブ時に元素エネルギーを30回復し、落下・爆発の会心率を10%、会心ダメージを100%上げる。", "During Maximum Drive, restores 30 Energy and increases Plunge/Burst CRIT Rate by 10% and CRIT DMG by 100%.", "极限驱动期间回复30点元素能量，下落与爆发的暴击率提高10%、暴击伤害提高100%。"),
  ] },
  "genshin:10000022": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/352607", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "狙い撃ち時に追加の暴風の矢を発射する。", "Aimed Shots fire additional Storm Arrows.", "瞄准射击时额外发射暴风之箭。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "元素スキル後、敵の風・物理耐性を24%下げる。", "After Skill, reduces enemy Anemo and Physical RES by 24%.", "元素战技后，敌人的风与物理抗性降低24%。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "スキルまたは爆発後、自身とフィールド上キャラの風元素ダメージを25%上げる。", "After Skill or Burst, increases Anemo DMG for Venti and the active character by 25%.", "施放战技或爆发后，温迪与场上角色的风元素伤害提高25%。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "元素爆発命中敵の風耐性を20%下げ、元素変化時は該当元素の耐性も20%下げる。", "Burst-hit enemies lose 20% Anemo RES; when absorption occurs, corresponding Elemental RES is also reduced by 20%.", "元素爆发命中的敌人风抗降低20%；发生元素转化时，对应元素抗性也降低20%。"),
  ] },
});

Object.assign(CURATED, {
  "zzz:1111": { ...SOURCE.zzz, sourceUrl: "https://game8.jp/zenless/607797", dataAsOf: "2026-08-19", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "ドリル攻撃命中時、スキルあたり最大5エネルギーを追加で得る。", "Drill attacks grant up to 5 extra Energy per Skill.", "钻头攻击命中时，每次战技最多额外获得5点能量。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "バーストモード移行時に最大HP7.5%分のシールドを得る。", "Entering Burst Mode grants a shield equal to 7.5% Max HP.", "进入爆发模式时获得相当于生命上限7.5%的护盾。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "連携スキルまたは終結スキル時、全員の会心率を10%上げる（12秒）。", "Chain or Ultimate raises squad CRIT Rate by 10% for 12s.", "连携技或终结技使全队暴击率提高10%，持续12秒。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "パイルドライバー会心時、バースト通常・回避反撃の与ダメージを4%上げる（30秒、最大6層）。", "Pile Driver CRIT raises Burst Basic and Dodge Counter DMG by 4% for 30s, up to 6 stacks.", "打桩机暴击时，爆发普攻与闪避反击伤害提高4%，持续30秒，最多6层。"),
  ] },
  "zzz:1011": { ...SOURCE.zzz, sourceUrl: "https://game8.jp/zenless/607757", dataAsOf: "2026-06-05", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "通常攻撃4段目命中時、エネルギー獲得効率を12%上げる（30秒）。", "Hitting the fourth Basic hit raises Energy generation by 12% for 30s.", "普通攻击第四段命中时，能量获取效率提高12%，持续30秒。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "ブレイク敵へ落雷ダメージを30%上げ、非ブレイク敵へ強化特殊のブレイク値を10%上げる。", "Raises thunderbolt DMG against stunned enemies by 30% and EX Special Daze against non-stunned enemies by 10%.", "对失衡敌人的落雷伤害提高30%，对非失衡敌人的强化特殊技失衡值提高10%。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "連携/終結時、控えの電気メンバーのエネルギーを回復する。", "On Chain/Ultimate, restores Energy to off-field Electric allies.", "施放连携/终结技时，回复后台电系队友的能量。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "強化特殊で最大8層を得て、通常/ダッシュ命中時に1層消費し当該ダメージを45%上げる。", "EX Special gains up to 8 stacks; Basic/Dash hits consume one to increase that hit's DMG by 45%.", "强化特殊技获得最多8层，普攻/冲刺命中时消耗1层并使该次伤害提高45%。"),
  ] },
  "zzz:1321": { ...SOURCE.zzz, sourceUrl: "https://game8.jp/zenless/658501", dataAsOf: "2026-08-19", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "入場時にデシベル1,500を得て、束縛敵への防御無視12%を得る。", "On entry gains 1,500 Decibels and 12% DEF ignore against Entangled enemies.", "入场时获得1500点喧响值，并对束缚敌人无视12%防御。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "攻撃力を15%上げ、連携・終結時の追加の火力効果を得る。", "Increases ATK by 15% and adds Chain/Ultimate damage effects.", "攻击力提高15%，并获得连携与终结技的额外输出效果。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "連携/終結時に最大HP10%分のシールドを得て、シールド中の会心ダメージを40%上げる。", "Chain/Ultimate grants a shield equal to 10% Max HP and 40% CRIT DMG while shielded.", "连携/终结技获得相当于生命上限10%的护盾，持盾时暴击伤害提高40%。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "連携/終結後に攻撃力375%分の炎追撃を最大16回発動する。", "After Chain/Ultimate, triggers up to 16 Fire follow-ups equal to 375% ATK.", "连携/终结技后最多触发16次相当于攻击力375%的火系追击。"),
  ] },
});

Object.assign(CURATED, {
  "hsr:1014": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/686759", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "必殺技ダメージ+60%。通常攻撃または戦闘スキル後に炉心共鳴を1層得る。", "Ultimate DMG +60%; Basic or Skill grants one Core Resonance stack.", "终结技伤害提高60%；普攻或战技后获得1层炉心共鸣。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "炉心共鳴1層ごとに防御を1%無視（最大15層）し、戦闘スキル倍率を追加で上げる。", "Each Core Resonance stack ignores 1% DEF, up to 15 stacks, and further boosts Skill scaling.", "每层炉心共鸣无视1%防御，最多15层，并额外提升战技倍率。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技Lv.+2、通常攻撃Lv.+1。", "Ultimate Lv. +2 and Basic ATK Lv. +1.", "终结技等级+2，普攻等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "風属性耐性貫通+8%。必殺技後にさらに+4%（最大3層）。", "Wind RES PEN +8%, with another +4% after Ultimate up to 3 stacks.", "风属性抗性穿透提高8%，终结技后额外提高4%，最多3层。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルと天賦Lv.+2。", "Skill and Talent Lv. +2.", "战技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "必殺技の風属性耐性貫通+20%。超過EP上限が200になり、初回必殺技後にEPを300回復する。", "Ultimate gains 20% Wind RES PEN; excess Energy cap becomes 200 and the first Ultimate restores 300 Energy.", "终结技获得20%风抗穿透；溢出能量上限变为200，首次终结技后恢复300能量。"),
  ] },
  "hsr:1410": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/698610", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "フィールド上にいる間、味方の持続ダメージが本来の116%になり、天賦のDoTを追加で1つ付与できる。", "While on field, allies' DoT becomes 116% and Talent DoTs can apply one additional instance.", "在场时，队友持续伤害变为原本的116%，天赋DoT可额外附加1次。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "結界中、軌跡の与ダメージアップ効果を味方全体へ適用する。", "While the field is active, applies the Trace DMG increase to all allies.", "结界存在时，将行迹的增伤效果施加给全队。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技Lv.+2、通常攻撃Lv.+1。", "Ultimate Lv. +2 and Basic ATK Lv. +1.", "终结技等级+2，普攻等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "結界継続中、敵全体の全属性耐性-20%。", "While the field persists, all enemies lose 20% All-Type RES.", "结界持续期间，敌方全体全属性抗性降低20%。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルと天賦Lv.+2。", "Skill and Talent Lv. +2.", "战技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "結界中、物理持続ダメージ系デバフの発動上限が12回になり、与ダメージ倍率+20%。", "While the field persists, Physical DoT debuff triggers cap at 12 and its multiplier gains 20%.", "结界持续期间，物理持续伤害类减益触发上限变为12次，倍率提高20%。"),
  ] },
});

Object.assign(CURATED, {
  "hsr:1314": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/605745", dataAsOf: "2026-08-11", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "追加攻撃の与ダメージ+32%。敵が1体または2体のみの場合、チャージを追加で得る。", "Follow-up DMG +32%; gains extra Charges when there are only one or two enemies.", "追加攻击伤害提高32%；敌人仅有1或2名时额外获得充能。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "質草が15層以上の時、会心率+18%。", "At 15 or more Pawned Asset stacks, CRIT Rate +18%.", "质料达到15层或以上时，暴击率提高18%。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルと天賦Lv.+2。", "Skill and Talent Lv. +2.", "战技与天赋等级+2。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "必殺技使用時、敵防御を12%無視する（3ターン）。", "Using Ultimate ignores 12% of enemy DEF for 3 turns.", "施放终结技时无视敌人12%防御，持续3回合。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技Lv.+2、通常攻撃Lv.+1。", "Ultimate Lv. +2 and Basic ATK Lv. +1.", "终结技等级+2，普攻等级+1。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "債権回収者がいる時、量子耐性貫通+20%となり、自身も債権回収者扱いになる。", "With a Debt Collector present, gains 20% Quantum RES PEN and Jade also counts as a Debt Collector.", "存在收债人时获得20%量子抗性穿透，翡翠自身也视为收债人。"),
  ] },
  "hsr:1104": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/524685", dataAsOf: "2026-08-21", updatedAt: "2026-08-26", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "戦闘スキルの凍結基礎確率+35%。", "Skill base Freeze chance +35%.", "战技的冻结基础概率提高35%。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "凍結解除後、敵の速度-20%（1ターン）。", "After Freeze ends, enemy SPD -20% for 1 turn.", "冻结解除后，敌方速度降低20%，持续1回合。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技と天賦Lv.+2。", "Ultimate and Talent Lv. +2.", "终结技与天赋等级+2。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "味方全体の効果抵抗+20%。", "All allies gain 20% Effect RES.", "全体队友效果抵抗提高20%。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルLv.+2、通常攻撃Lv.+1。", "Skill Lv. +2 and Basic ATK Lv. +1.", "战技等级+2，普攻等级+1。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "天賦発動時の即時行動と回復量を最大HP50%分上昇する。", "Talent activation advances action and raises its recovery by 50% of Max HP.", "天赋触发时立即行动，并使恢复量提高至生命上限的50%。"),
  ] },
});

Object.assign(CURATED, {
  "genshin:10000112": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/678671", dataAsOf: "2026-08-13", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "水・氷4名編成時、元素スキルまたは爆発後15秒、チーム全員の氷ダメージ会心ダメージ+60%。", "In four Hydro/Cryo teams, Skill or Burst grants the party 60% Cryo CRIT DMG for 15s.", "水冰四人队中，施放战技或爆发后15秒，全队冰伤暴击伤害提高60%。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "チルドモード起動時に料理効果を5層得て、氷ダメージ命中時に1層を消費しエスコフィエ攻撃力240%分を加算する。", "Entering Chilled Mode grants 5 stacks; allies' Cryo hits consume a stack to add 240% of Escoffier's ATK.", "进入冷藏模式获得5层效果；队友冰伤命中时消耗1层，附加艾斯科菲耶攻击力240%的伤害。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "回復料理の継続時間+6秒。回復時、会心率に応じて回復量を100%上げ、元素エネルギーを2回復する（最大7回）。", "Healing dish lasts 6s longer; healing can double based on CRIT Rate and restore 2 Energy, up to 7 times.", "治疗料理持续时间延长6秒；治疗时按暴击率概率使治疗量翻倍并恢复2点能量，最多7次。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "チルドモード中、通常・重撃・落下攻撃命中時に攻撃力500%分の氷範囲ダメージを追加で放つ（最大6回）。", "While Chilled Mode is active, Normal/Charged/Plunge hits fire bonus AoE Cryo DMG equal to 500% ATK, up to 6 times.", "冷藏模式期间，普攻、重击或下落命中时额外造成攻击力500%的冰元素范围伤害，最多6次。"),
  ] },
  "genshin:10000099": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/574298", dataAsOf: "2026-08-13", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "元素スキルと固有追撃ダメージ+20%。燃焼または燃焼敵への草攻撃時に芳香を追加生成する。", "Skill and passive follow-up DMG +20%; Burning reactions or Dendro hits on Burning enemies create extra Fragrance.", "元素战技与固有追击伤害提高20%；触发燃烧或攻击燃烧敌人时额外生成芳香。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "スキル・爆発・固有追撃命中時、敵の草元素耐性-30%（10秒）。", "Skill, Burst, or passive follow-up hits reduce enemy Dendro RES by 30% for 10s.", "战技、爆发或固有追击命中时，敌方草元素抗性降低30%，持续10秒。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "元素爆発の継続時間+2秒、標的選択間隔-0.3秒。", "Burst duration +2s and target-selection interval -0.3s.", "元素爆发持续时间+2秒，目标选择间隔缩短0.3秒。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "スキルまたは爆発時に溜まる香りを得て、通常・重撃を草元素化し、与ダメージを攻撃力300%分上げる。", "Using Skill or Burst grants a state that infuses Normal and Charged Attacks with Dendro and adds 300% ATK damage.", "施放战技或爆发获得状态，使普攻和重击转为草元素伤害，并额外提高攻击力300%的伤害。"),
  ] },
});

Object.assign(CURATED, {
  "zzz:1051": { ...SOURCE.zzz, sourceUrl: "https://gamewith.jp/zenless/514877", dataAsOf: "2026-08-26", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "強化特殊に必要なアドレナリン-10。HP回復の代わりに強化特殊へ繋げられ、回復量+100%、氷耐性20%無視を得る。", "EX Special needs 10 less Adrenaline; enables a chained EX Special with 100% more healing and 20% Ice RES ignore.", "强化特殊所需肾上腺素减少10点；可衔接强化特殊，治疗量提高100%，并无视20%冰抗。"),
    effect(2, "心象映画2", "Mindscape 2", "会心电影2", "会心ダメージ+40%。寒風または追砕成功時、アドレナリンを毎秒0.5回復する（最大30秒）。", "CRIT DMG +40%; successful Cold Wind or follow-up restores 0.5 Adrenaline per second for up to 30s.", "暴击伤害提高40%；成功触发寒风或追击时，每秒恢复0.5点肾上腺素，最多30秒。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "HP低下時のデシベル獲得+10。エーテルベール・湧泉中、最大HP+5%。", "Gains 10 more Decibels when HP drops; while Ether Veil: Well is active, Max HP +5%.", "生命降低时额外获得10点喧响值；以太帷幕·涌泉期间最大生命提高5%。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "エーテルベール・湧泉の発動または延長後、透徹ダメージ+25%（30秒）。初回致命傷後5秒間は戦闘不能にならずHP25%を回復する。", "After activating or extending Ether Veil: Well, Sheer DMG +25% for 30s; the first fatal hit grants 5s of survival and restores 25% HP.", "发动或延长以太帷幕·涌泉后，透彻伤害提高25%，持续30秒；首次致命伤后5秒内不会倒下并恢复25%生命。"),
  ] },
});

Object.assign(CURATED, {
  "zzz:1561": { ...SOURCE.zzz, sourceUrl: "https://www.prydwen.gg/zenless/characters/velina", dataAsOf: "2026-08-19", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "追加能力の旋風によるブレイク+20%。渦発動時に敵全属性耐性20%を無視し、風襲ダメージ時は風耐性も20%無視する。", "Additional Ability cyclone Daze +20%; Vortex ignores 20% All-Attribute RES and Windswept DMG ignores 20% Wind RES.", "额外能力旋风的失衡值提高20%；触发涡流时无视20%全属性抗性，风咬伤害额外无视20%风抗。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "風襲発動時に風咬みを1点得る。色彩変化後の旋風は対応属性の異常蓄積を行い、追加能力の風襲・渦ダメージ上昇をさらに15%上げる。", "Windswept grants Windbite; Chromatic Tint cyclones build matching Anomaly and Additional Ability Windswept/Vortex DMG gains another 15%.", "触发风咬时获得1点风咬；色彩变换后的旋风积累对应异常，额外能力的风咬与涡流增伤再提高15%。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "強化特殊スキル使用後、攻撃力+15%（40秒）。", "After using EX Special Attack, ATK +15% for 40s.", "使用强化特殊技后，攻击力提高15%，持续40秒。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "渦の強化時に風咬みを1点回復する。風異常の敵への異常蓄積+20%、既存風襲への再付与は残り時間に応じてダメージを最大40%上げる。", "Enhanced Vortex restores Windbite; Wind Anomaly buildup against Wind-Anomalied enemies +20%, and refreshing Windswept can raise its DMG up to 40% based on remaining duration.", "强化涡流时恢复1点风咬；对风异常敌人的异常积累提高20%，刷新风咬时按剩余时间最多提高40%伤害。"),
  ] },
});

Object.assign(CURATED, {
  "genshin:10000051": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/383079", dataAsOf: "2026-08-13", updatedAt: "2026-08-26", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "冷酷な心を消費すると物理ダメージ+30%（6秒）。1つ消費するごとに継続時間+6秒、最大18秒。", "Consuming Grimheart grants 30% Physical DMG for 6s; each stack consumed extends it by 6s, up to 18s.", "消耗冷酷之心后物理伤害提高30%，持续6秒；每消耗1层延长6秒，最多18秒。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "元素スキル長押しのクールタイムを一回押しと同じに短縮する。", "Reduces Hold Skill cooldown to match Press Skill cooldown.", "使长按元素战技的冷却时间与点按相同。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "HP50%未満の敵に対する光臨の剣ダメージ+25%。", "Lightfall Sword DMG against enemies below 50% HP +25%.", "对生命低于50%的敌人，光降之剑伤害提高25%。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "元素爆発の光臨の剣は即時にエネルギーを5つ得る。通常・スキル・爆発でエネルギー獲得時、50%でさらに1つ得る。", "The Lightfall Sword immediately gains 5 stacks; when gaining stacks from Normal, Skill, or Burst, has a 50% chance to gain one extra.", "元素爆发的光降之剑立即获得5层能量；通过普攻、战技或爆发获得能量时，有50%概率额外获得1层。"),
  ] },
});

Object.assign(CURATED, {
  "zzz:1301": { ...SOURCE.zzz, sourceUrl: "https://gamewith.jp/zenless/511491", dataAsOf: "2026-08-25", updatedAt: "2026-08-26", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "特定の特殊・強化特殊の炎ダメージは炎耐性を15%無視する。フォーカス状態メンバーの与ダメージ+20%。", "Specified Special and EX Special Fire DMG ignores 15% Fire RES; Focused agents deal 20% more DMG.", "特定特殊技和强化特殊技的火伤无视15%火抗；处于聚焦状态的成员造成伤害提高20%。"),
    effect(2, "心象映画2", "Mindscape 2", "追加攻撃発動ごとにデシベル65を得る（4秒に1回）。終結スキル後、攻撃力+20%（最大45秒）。", "Each Aftershock grants 65 Decibels once every 4s; after Ultimate, ATK +20% for up to 45s.", "每次追加攻击获得65点喧响值，每4秒最多一次；终结技后攻击力提高20%，最多45秒。"),
    effect(3, "心象映画3", "Mindscape 3", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(4, "心象映画4", "Mindscape 4", "フォーカスの基本継続時間を16秒にし、指定の強化特殊または終結スキルダメージ+40%。", "Sets Focus base duration to 16s and increases specified EX Special or Ultimate DMG by 40%.", "将聚焦基础持续时间设为16秒，并使指定强化特殊技或终结技伤害提高40%。"),
    effect(5, "心象映画5", "Mindscape 5", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(6, "心象映画6", "Mindscape 6", "エネルギー十分時に指定通常後から強化特殊へ連携できる。蓄炎を10得て、指定ビーム命中時に攻撃力250%分の炎ダメージを追加する。", "With sufficient Energy, chains a specified Basic into EX Special; gains 10 Bottled Heat and specified beam hits add Fire DMG equal to 250% ATK.", "能量充足时可由指定普攻衔接强化特殊；获得10点蓄炎，指定光束命中时额外造成攻击力250%的火伤。"),
  ] },
});

Object.assign(CURATED, {
  "hsr:1103": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/524686", dataAsOf: "2026-08-21", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "通常攻撃対象に隣接する敵へ通常攻撃60%分の雷ダメージ。", "Basic attacks deal Lightning DMG equal to 60% of Basic ATK to adjacent enemies.", "普攻对目标相邻敌人造成等同普攻60%的雷属性伤害。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "天賦の追加ダメージ発生時、EPを4回復する。", "Talent's extra damage restores 4 Energy.", "天赋追加伤害触发时，恢复4点能量。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルLv.+2、通常攻撃Lv.+1。", "Skill Lv. +2 and Basic ATK Lv. +1.", "战技等级+2，普攻等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "必殺技は未感電の敵にも基礎確率100%で感電を付与する。", "Ultimate has a 100% base chance to inflict Shock on unshocked enemies.", "终结技对未触电敌人有100%基础概率施加触电。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦Lv.+2。", "Ultimate and Talent Lv. +2.", "终结技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "感電状態の敵への与ダメージ+30%。", "Deals 30% more DMG to Shocked enemies.", "对触电状态敌人造成的伤害提高30%。"),
  ] },
  "hsr:1102": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/524687", dataAsOf: "2026-08-21", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "HP80%以下の敵への会心率+15%、防御力20%無視。", "Against enemies below 80% HP, CRIT Rate +15% and ignores 20% DEF.", "对生命低于80%的敌人，暴击率提高15%，无视20%防御。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "戦闘スキルによる速度上昇を2層まで累積できる。", "The Skill's SPD increase can stack up to 2 times.", "战技提供的速度提升最多可叠加2层。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルLv.+2、通常攻撃Lv.+1。", "Skill Lv. +2 and Basic ATK Lv. +1.", "战技等级+2，普攻等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "敵撃破時にEPを15回復する。", "Defeating an enemy restores 15 Energy.", "击败敌人时恢复15点能量。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技Lv.+2、通常攻撃Lv.+1。", "Ultimate Lv. +2 and Basic ATK Lv. +1.", "终结技等级+2，普攻等级+1。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "必殺技後3ターン、被攻撃時に必殺技ダメージ30%分の確定ダメージを与える。", "For 3 turns after Ultimate, attacks received trigger Fixed DMG equal to 30% of Ultimate DMG.", "终结技后3回合内，受击时造成等同终结技伤害30%的附加伤害。"),
  ] },
  "hsr:1321": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/732480", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "ダンスパートナーの超撃破倍率を全体へ適用し、本人はさらに+40%。", "Applies Dance Partner's Super Break scaling to all allies; Dahlia gains another 40%.", "将舞伴的超击破倍率施加给全队，达莉娅自身额外提高40%。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "フィールド中の敵全体の全属性耐性-20%、敵登場時に枯萎を付与。", "Enemies in the field lose 20% All-Type RES; arriving enemies receive Wither.", "领域内敌人全属性抗性降低20%，敌人入场时附加枯萎。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技Lv.+2、通常攻撃Lv.+1。", "Ultimate Lv. +2 and Basic ATK Lv. +1.", "终结技等级+2，普攻等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "天賦追撃の段数+5、各段の被ダメージ+12%（2ターン）。", "Talent follow-up gains 5 hits and each hit raises target DMG taken by 12% for 2 turns.", "天赋追加攻击段数+5，每段使目标受伤提高12%，持续2回合。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルと天賦Lv.+2。", "Skill and Talent Lv. +2.", "战技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "ダンスパートナーの撃破特効+150%、天賦追撃時に行動順20%短縮。", "Dance Partner gains 150% Break Effect and Talent follow-ups advance action by 20%.", "舞伴击破特攻提高150%，天赋追击时行动提前20%。"),
  ] },
  "hsr:1403": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/662211", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "結界の付加ダメージ対象へ攻撃総ダメージ24%分の確定ダメージを与える。", "Field additional-DMG targets take Fixed DMG equal to 24% of total ally ATK.", "结界附加伤害目标受到等同全队攻击力24%的附加伤害。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "結界の付加ダメージを120%化し、追加で1回発生。", "Field additional DMG becomes 120% and triggers one extra time.", "结界附加伤害提高至120%，并额外触发1次。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技と通常攻撃Lv.+2。", "Ultimate and Basic ATK Lv. +2.", "终结技与普攻等级+2。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "神の啓示状態の味方は敵防御を18%無視する。", "Allies in Divine Revelation ignore 18% of enemy DEF.", "神启状态下的队友无视敌人18%防御。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルと天賦Lv.+2。", "Skill and Talent Lv. +2.", "战技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "必殺技後に追加攻撃を行い、そのダメージ+729%。", "After Ultimate, launches an extra attack with 729% more DMG.", "终结技后发动追加攻击，其伤害提高729%。"),
  ] },
  "hsr:1105": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/524684", dataAsOf: "2026-08-21", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "HP30%以下で被弾時、最大HP15%+400を自己回復。", "When hit below 30% HP, heals self for 15% Max HP plus 400.", "生命低于30%受击时，恢复自身15%生命上限+400点生命。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "必殺技後、HP30%以下の味方へ持続回復を付与。", "After Ultimate, grants regeneration to allies below 30% HP.", "终结技后，为生命低于30%的队友附加持续治疗。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルLv.+2、通常攻撃Lv.+1。", "Skill Lv. +2 and Basic ATK Lv. +1.", "战技等级+2，普攻等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "被弾時にEPを5回復する。", "When hit, restores 5 Energy.", "受击时恢复5点能量。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦Lv.+2。", "Ultimate and Talent Lv. +2.", "终结技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "通常攻撃に最大HP40%分の物理ダメージを追加する。", "Basic ATK gains bonus Physical DMG equal to 40% Max HP.", "普攻额外造成等同生命上限40%的物理伤害。"),
  ] },
  "hsr:1409": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/677023", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "雨上がり中の味方最大HP+50%、攻撃後に自身を回復。", "While After the Rain is active, allies' Max HP +50% and Hyacine heals after attacking.", "雨后状态下队友生命上限提高50%，攻击后自身恢复生命。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "味方のHP減少時、速度+30%（2ターン）。", "When an ally loses HP, SPD +30% for 2 turns.", "队友生命降低时，速度提高30%，持续2回合。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技Lv.+2、通常攻撃Lv.+1、メモスプライトスキルLv.+1。", "Ultimate +2, Basic +1, and memosprite Skill +1.", "终结技等级+2，普攻等级+1，忆灵技等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "速度超過1ごとに自身とイカルンの会心ダメージ+2%。", "For every 1 SPD above the threshold, Hyacine and Ica gain 2% CRIT DMG.", "每超过1点速度，风堇与伊卡的暴击伤害提高2%。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルと天賦Lv.+2、メモスプライト天賦Lv.+1。", "Skill and Talent +2, memosprite Talent +1.", "战技与天赋等级+2，忆灵天赋等级+1。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "出場中、味方全体の全属性耐性貫通+20%。", "While on field, all allies gain 20% All-Type RES PEN.", "在场时，全队全属性抗性穿透提高20%。"),
  ] },
  "hsr:1408": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/666526", dataAsOf: "2026-05-31", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "追加ターンの基礎速度継承を66%へ上げ、必殺技後に会心ダメージ+50%（3ターン）。", "Extra turns inherit 66% base SPD; after Ultimate, CRIT DMG +50% for 3 turns.", "额外回合继承66%基础速度；终结技后暴击伤害提高50%，持续3回合。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "物理耐性貫通+20%、「星滅」の追加ターンを得る。", "Gains 20% Physical RES PEN and an extra turn after Starfall.", "获得20%物理抗性穿透，并在星灭后获得额外回合。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技Lv.+2、通常攻撃Lv.+1。", "Ultimate Lv. +2 and Basic ATK Lv. +1.", "终结技等级+2，普攻等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "災厄使用時に魂焼を4層得る。", "Using Calamity grants 4 Soulburn stacks.", "施放灾厄时获得4层魂焚。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルと天賦Lv.+2。", "Skill and Talent Lv. +2.", "战技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "コアフレイム上限を撤廃し、星滅後に最大HP敵へ総ダメージ36%の確定ダメージ。", "Removes Coreflame cap and after Starfall deals Fixed DMG equal to 36% total DMG to the highest-HP enemy.", "取消核心火焰上限，星灭后对最高生命敌人造成总伤害36%的附加伤害。"),
  ] },
  "hsr:1217": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/556584", dataAsOf: "2026-08-19", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "厄払いの継続延長、治癒量+20%、味方速度+12%。", "Extends Divine Provision and grants 20% Healing plus 12% SPD to allies.", "延长禳命状态，治疗量提高20%，队友速度提高12%。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "条件を満たす味方の戦闘不能を1回防ぎ、HP50%を回復する。", "Once, prevents an eligible ally's fatal blow and restores 50% HP.", "满足条件时，1次阻止队友陷入无法战斗并恢复50%生命。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技と天賦Lv.+2。", "Ultimate and Talent Lv. +2.", "终结技与天赋等级+2。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "治療対象のHPが低いほど治癒量を上げる。", "Healing increases as the target's HP becomes lower.", "治疗目标生命越低，治疗量越高。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルと通常攻撃Lv.+2。", "Skill and Basic ATK Lv. +2.", "战技与普攻等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "治療時、対象の与ダメージ+50%（2ターン）。", "Healing grants the target 50% more DMG for 2 turns.", "治疗时使目标造成的伤害提高50%，持续2回合。"),
  ] },
});

Object.assign(CURATED, {
  "genshin:10000105": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/624946", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "宿霊玉の移動+2、夜冥対象への顕象超感覚ダメージ+50%。", "Spirit Orbs travel 2 more times and Hypersense DMG against Nightwraith targets +50%.", "灵魂珠额外移动2次，对夜魂目标的显象超感伤害提高50%。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "元素爆発後の雷ダメージを最大32%上げる。", "Increases Electro DMG after Burst by up to 32%.", "元素爆发后雷元素伤害最多提高32%。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "設置物の回転+25%、爆発後に元素エネルギー8回復。", "Construct rotation +25%; restores 8 Energy after Burst.", "装置旋转速度提高25%，爆发后恢复8点元素能量。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "顕象超感覚後、出場キャラの攻撃力+10%（最大3層）と爆発時の追加攻撃。", "After Hypersense, the active character gains 10% ATK per stack, up to 3, and Burst gains an extra attack.", "显象超感后，当前场上角色攻击力每层提高10%，最多3层，爆发获得追加攻击。"),
  ] },
  "genshin:10000081": { ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/Kaveh-Best-Builds", dataAsOf: "2026-08-12", updatedAt: "2026-08-27", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "スキル後、草元素耐性+50%、受ける治療+25%（3秒）。", "After Skill, Dendro RES +50% and Incoming Healing Bonus +25% for 3s.", "施放战技后，草元素抗性提高50%，受治疗加成提高25%，持续3秒。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "元素爆発中の通常攻撃速度+15%。", "Normal Attack SPD +15% during Burst.", "元素爆发期间普通攻击速度提高15%。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "自身の開花・月開花の草原核ダメージ+60%。", "Kaveh's Bloom and Lunar-Bloom core DMG +60%.", "卡维触发的绽放与月绽放草原核伤害提高60%。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "爆発中の通常・重撃・落下命中時に草範囲ダメージと草原核起爆（3秒ごと）。", "During Burst, Normal, Charged, and Plunging hits deal AoE Dendro DMG and detonate cores once every 3s.", "爆发期间普攻、重击、下落命中时造成草范围伤害并引爆草原核，每3秒一次。"),
  ] },
  "genshin:10000015": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/352603", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "氷元素影響敵への通常・重撃会心率+15%。", "Normal and Charged Attack CRIT Rate +15% against Cryo-affected enemies.", "对受冰元素影响敌人的普攻与重击暴击率提高15%。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "爆発中の敵撃破ごとに継続+2.5秒、最大15秒。", "Each enemy defeated during Burst extends duration by 2.5s, up to 15s.", "爆发期间每击败1名敌人延长2.5秒，最多15秒。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "HP20%以下で、HP上限30%分の氷に強いシールドを得る。", "Below 20% HP, gains a Cryo-absorbing shield equal to 30% Max HP.", "生命低于20%时，获得吸收量为生命上限30%的冰元素护盾。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "爆発の氷柱+1、発動時に元素エネルギー15回復。", "Burst gains one extra icicle and restores 15 Energy on cast.", "元素爆发额外生成1枚冰棱，施放时恢复15点元素能量。"),
  ] },
});

Object.assign(CURATED, {
  "genshin:10000100": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/622963", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "コマちゃん乗降時に結晶を回収し、結晶反応で元素エネルギー3回復（5秒ごと）。", "Mounting or dismounting Turbo Twirly collects Crystallize shards and restores 3 Energy once every 5s.", "乘降冲天转转时收集结晶，触发结晶反应时每5秒恢复3点元素能量。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "爆発時に夜魂値20回復しコマちゃんを召喚。", "Burst restores 20 Nightsoul points and summons Turbo Twirly.", "爆发时恢复20点夜魂值并召唤冲天转转。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "スーパードリル領域の出場キャラに敵数に応じ防御力+8/12/16/20%。", "Active characters in the drill field gain 8/12/16/20% DEF based on enemy count.", "超级钻钻领域内当前角色按敌人数获得8/12/16/20%防御力。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "シールドの交換・破壊時、自身の防御力200%分の岩範囲ダメージ（5秒ごと）。", "Swapping or breaking a shield deals AoE Geo DMG equal to 200% DEF once every 5s.", "护盾更替或破碎时造成防御力200%的岩元素范围伤害，每5秒一次。"),
  ] },
  "genshin:10000101": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/622965", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "着地後の移動速度+30%、廻狩貫鱗砲の会心ダメージ+100%。", "Landing grants 30% Move SPD and Scalespiker Cannon CRIT DMG +100%.", "落地后移动速度提高30%，廻猎贯鳞炮暴击伤害提高100%。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "スキル命中時に草耐性-30%、初撃ダメージ+100%・範囲拡大。", "Skill hits reduce Dendro RES by 30% and its first hit gains 100% DMG and larger AoE.", "战技命中时草元素抗性降低30%，首段伤害提高100%且范围扩大。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "円軌道射撃または廻狩貫鱗砲後に元素エネルギー5回復（2.8秒ごと）、爆発ダメージ+70%。", "Orbit shots or Scalespiker Cannon restore 5 Energy once every 2.8s; Burst DMG +70%.", "环轨射击或廻猎贯鳞炮后每2.8秒恢复5点能量，爆发伤害提高70%。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "廻狩貫鱗砲命中後、攻撃力700%分の草バウンドダメージを与える。", "After Scalespiker Cannon hits, deals bouncing Dendro DMG equal to 700% ATK.", "廻猎贯鳞炮命中后造成攻击力700%的草元素弹跳伤害。"),
  ] },
  "genshin:10000072": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/475655", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "元素爆発中の祝福の継続時間+3秒。", "Elemental Burst's Prayer duration +3s.", "元素爆发期间的祷祝持续时间延长3秒。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "元素スキル命中時にHP上限+20%（15秒）。", "Skill hits grant 20% Max HP for 15s.", "元素战技命中时生命上限提高20%，持续15秒。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "長押しスキルのクールタイムを短縮する。", "Reduces Hold Skill cooldown.", "缩短长按元素战技的冷却时间。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "爆発中、他出場キャラの元素通常攻撃でHP上限15%分の水範囲ダメージ（2.3秒ごと）。", "During Burst, other active characters' elemental Normal Attacks trigger AoE Hydro DMG equal to 15% Max HP once every 2.3s.", "爆发期间，其他当前角色的元素普攻每2.3秒触发一次生命上限15%的水范围伤害。"),
  ] },
});

Object.assign(CURATED, {
  "zzz:1061": { ...SOURCE.zzz, sourceUrl: "https://game8.jp/zenless/607798", dataAsOf: "2026-08-19", updatedAt: "2026-08-27", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "連携・終結命中時、対象への与ダメージ+12%（15秒）。", "Chain or Ultimate hits increase DMG dealt to the target by 12% for 15s.", "连携技或终结技命中时，对该目标造成的伤害提高12%，持续15秒。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "強化特殊・連携・終結命中時、物理耐性-0.5%（最大20層・5秒）。", "EX Special, Chain, or Ultimate hits reduce Physical RES by 0.5%, up to 20 stacks for 5s.", "强化特殊技、连携技或终结技命中时，物理抗性降低0.5%，最多20层，持续5秒。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "クイック支援・パリィ支援・連携時にエネルギー7.2回復（16秒ごと）。", "Quick Assist, Defensive Assist, or Chain restores 7.2 Energy once every 16s.", "快速支援、招架支援或连携时，每16秒恢复7.2点能量。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "持続斬撃のチャージ消費時、1層ごとに攻撃力3%分の追加ダメージ。", "Consuming a charged sustained slash deals bonus DMG equal to 3% ATK per stack.", "持续斩击消耗蓄力时，每层额外造成攻击力3%的伤害。"),
  ] },
  "zzz:1101": { ...SOURCE.zzz, sourceUrl: "https://game8.jp/zenless/607803", dataAsOf: "2026-07-31", updatedAt: "2026-08-27", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "通常2/4段または強化通常後の特殊・強化特殊のブレイク値+15%。", "Special and EX Special after Basic 2/4 or enhanced Basic gain 15% Daze.", "普攻第2/4段或强化普攻后的特殊技、强化特殊技失衡值提高15%。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "強化特殊命中時にエネルギー60回復（45秒ごと）。", "EX Special hits restore 60 Energy once every 45s.", "强化特殊技命中时恢复60点能量，每45秒一次。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "溶炉昇温消費後の連携・終結ダメージをパワー1層ごとに+18%（最大2層）。", "After consuming Furnace Heat, Chain and Ultimate DMG +18% per Power stack, up to 2.", "消耗熔炉升温后，连携与终结技伤害每层能量提高18%，最多2层。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "強化特殊・連携・終結の爆発命中時、攻撃力360%分の追加ダメージ。", "EX Special, Chain, and Ultimate explosions deal bonus DMG equal to 360% ATK.", "强化特殊技、连携技与终结技的爆炸命中时，额外造成攻击力360%的伤害。"),
  ] },
  "zzz:1591": { ...SOURCE.zzz, sourceUrl: "https://gamewith.jp/zenless/560635", dataAsOf: "2026-08-26", updatedAt: "2026-08-27", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "円舞3段後に追加使用1回、上限超過時に攻撃力100%分の氷追加ダメージと攻撃力+25%。", "After Dance stage 3, grants one extra use; overflow adds 100% ATK Ice DMG and 25% ATK.", "圆舞第3段后获得1次额外使用；超过上限时追加攻击力100%的冰伤并提高25%攻击力。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "指定攻撃の貫通率+24%、不落の構え+2秒、デシベル獲得+10%。", "Specified attacks gain 24% PEN Ratio; Unfallen Stance +2s and Decibel gain +10%.", "指定攻击的穿透率提高24%，不落之势持续时间+2秒，喧响值获取效率提高10%。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "不落の構え更新時、与ダメージ+18%（8秒、最大40秒）。", "Refreshing Unfallen Stance grants 18% DMG for 8s, up to 40s.", "刷新不落之势时，造成的伤害提高18%，持续8秒，最多40秒。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "円舞1/2/3段の最終段に攻撃力80/90/100%分の氷追加ダメージ。", "Dance stages 1/2/3 final hits gain 80/90/100% ATK Ice bonus DMG.", "圆舞1/2/3段的最后一击额外造成攻击力80/90/100%的冰伤。"),
  ] },
  "zzz:1531": { ...SOURCE.zzz, sourceUrl: "https://gamewith.jp/zenless/551848", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "開幕アドレナリン+60、強化特殊命中後に物理耐性18%無視（45秒）。", "Starts with 60 Adrenaline; EX Special hits gain 18% Physical RES ignore for 45s.", "开局获得60点肾上腺素；强化特殊技命中后无视18%物理抗性，持续45秒。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "強化通常・クールウィリー・終結の与ダメージ+50%などの強化を得る。", "Enhanced Basic, Cool Willy, and Ultimate gain 50% DMG and related upgrades.", "强化普攻、酷酷威利与终结技伤害提高50%等强化。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "ドライブサプレッションごとに会心ダメージ+8%（最大2層・45秒）。", "Each Drive Suppression grants 8% CRIT DMG, up to 2 stacks for 45s.", "每次驱动压制使暴击伤害提高8%，最多2层，持续45秒。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "終結・強化通常の透徹ダメージ+18%などの強化を得る。", "Ultimate and enhanced Basic gain 18% Sheer DMG and related upgrades.", "终结技与强化普攻的透彻伤害提高18%等强化。"),
  ] },
  "zzz:1481": { ...SOURCE.zzz, sourceUrl: "https://gamewith.jp/zenless/522882", dataAsOf: "2026-08-26", updatedAt: "2026-08-27", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "好評の毎秒・攻撃獲得量+16%、全属性耐性15%無視。", "Favorable Review gain per second and attack +16%; ignores 15% All-Type RES.", "好评每秒与攻击获得量提高16%，无视15%全属性抗性。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "悪質クレーム敵へのブレイク弱体倍率+20%、全体与ダメージ+15%。", "Against Malicious Complaint enemies, Stun Vulnerability +20% and squad DMG +15%.", "对恶意投诉敌人的失衡易伤倍率提高20%，全队伤害提高15%。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "開幕エネルギー+20、好評中に攻撃力+500。", "Starts with 20 Energy; while Favorable Review is active, ATK +500.", "开局能量+20；好评状态下攻击力提高500。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "終結変換で入場した味方へアフタートーンを付与し、命中時に攻撃力480%分の物理追加ダメージ。", "Ultimate conversion grants Aftertone; its hits deal bonus Physical DMG equal to 480% ATK.", "终结转换入场的队友获得余韵，命中时额外造成攻击力480%的物理伤害。"),
  ] },
});

Object.assign(CURATED, {
  "hsr:1109": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/524680", dataAsOf: "2026-08-11", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "強化後の戦闘スキル与ダメージ+40%。", "Enhanced Skill DMG +40%.", "强化战技造成的伤害提高40%。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "戦闘スキルで付与する燃焼状態の継続時間+1ターン。", "Burn inflicted by Skill lasts 1 additional turn.", "战技施加的灼烧状态持续时间延长1回合。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルLv.+2、通常攻撃Lv.+1。", "Skill Lv. +2 and Basic ATK Lv. +1.", "战技等级+2，普攻等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "天賦発動時、隣接敵へ基礎確率100%で燃焼を付与する。", "When Talent triggers, has a 100% base chance to Burn adjacent enemies.", "天赋触发时，有100%基础概率使相邻敌人陷入灼烧。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦Lv.+2。", "Ultimate and Talent Lv. +2.", "终结技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "燃焼状態の敵への与ダメージ+20%。", "Deals 20% more DMG to Burned enemies.", "对灼烧状态敌人造成的伤害提高20%。"),
  ] },
  "hsr:1106": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/524683", dataAsOf: "2026-08-21", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "敵撃破時にEPを5回復する。", "Defeating an enemy restores 5 Energy.", "击败敌人时恢复5点能量。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "戦闘スキルでバフを解除すると速度+10%（2ターン）。", "Removing a buff with Skill grants 10% SPD for 2 turns.", "用战技解除增益时，速度提高10%，持续2回合。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルLv.+2、通常攻撃Lv.+1。", "Skill Lv. +2 and Basic ATK Lv. +1.", "战技等级+2，普攻等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "戦闘スキル発動時、基礎確率100%で敵の氷耐性-12%（2ターン）。", "Skill has a 100% base chance to reduce enemy Ice RES by 12% for 2 turns.", "施放战技时，有100%基础概率使敌方冰抗降低12%，持续2回合。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦Lv.+2。", "Ultimate and Talent Lv. +2.", "终结技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "攻撃後、デバフ状態の敵へ攻撃力40%分の氷付加ダメージ。", "After attacking, deals bonus Ice DMG equal to 40% ATK to debuffed enemies.", "攻击后，对处于负面状态的敌人额外造成攻击力40%的冰属性伤害。"),
  ] },
  "hsr:1013": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/524689", dataAsOf: "2026-08-11", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "HP50%以下の敵への通常攻撃に攻撃力40%分の氷付加ダメージ。", "Basic ATK deals bonus Ice DMG equal to 40% ATK to enemies at 50% HP or less.", "普攻攻击生命低于50%的敌人时，额外造成攻击力40%的冰伤。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "天賦発動ごとに会心率+3%、最大5層。", "Each Talent trigger grants 3% CRIT Rate, up to 5 stacks.", "每次触发天赋使暴击率提高3%，最多5层。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルLv.+2、通常攻撃Lv.+1。", "Skill Lv. +2 and Basic ATK Lv. +1.", "战技等级+2，普攻等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "天賦による与ダメージ+10%。", "Talent DMG +10%.", "天赋造成的伤害提高10%。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦Lv.+2。", "Ultimate and Talent Lv. +2.", "终结技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "必殺技発動後、攻撃力+25%（1ターン）。", "After Ultimate, ATK +25% for 1 turn.", "施放终结技后，攻击力提高25%，持续1回合。"),
  ] },
  "hsr:1401": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/654345", dataAsOf: "2026-08-25", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "強化スキルの解読計算に最多層の50%分を加え、リセット後は15層にする。", "Enhanced Skill adds 50% of the highest Interpretation stack count and resets it to 15 stacks.", "强化战技额外计入最高层数50%的解读，重置后保留15层。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "戦闘開始・必殺技後に第六感+1、強化スキル後に行動順35%早化。", "At battle start and after Ultimate, gains 1 Inspired; Enhanced Skill advances action by 35%.", "战斗开始及终结技后获得1层灵感；强化战技后行动提前35%。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルと天賦Lv.+2。", "Skill and Talent Lv. +2.", "战技与天赋等级+2。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "知恵の味方の速度+12%。", "Erudition allies gain 12% SPD.", "智识命途队友速度提高12%。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技Lv.+2、通常攻撃Lv.+1。", "Ultimate Lv. +2 and Basic ATK Lv. +1.", "终结技等级+2，普攻等级+1。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "氷耐性貫通+20%。敵数に応じ必殺技倍率+140/250/400%。", "Ice RES PEN +20%; Ultimate multiplier increases by 140/250/400% based on enemy count.", "冰属性抗性穿透提高20%；终结技倍率按敌人数提高140/250/400%。"),
  ] },
  "hsr:1312": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/582412", dataAsOf: "2026-08-21", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "必殺技発動時、敵1体につき攻撃段数+1、最大+5。", "When casting Ultimate, gains 1 hit per enemy, up to 5 extra hits.", "施放终结技时，每有1名敌人增加1段攻击，最多增加5段。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "必殺技各段の前に、基礎確率24%で敵の防御力-16%（3ターン）。", "Before each Ultimate hit, has a 24% base chance to reduce enemy DEF by 16% for 3 turns.", "终结技每段攻击前有24%基础概率使敌方防御降低16%，持续3回合。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "必殺技Lv.+2、通常攻撃Lv.+1。", "Ultimate Lv. +2 and Basic ATK Lv. +1.", "终结技等级+2，普攻等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "必殺技の各段攻撃ダメージ倍率+6%。", "Each Ultimate hit's DMG multiplier +6%.", "终结技每段攻击伤害倍率提高6%。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "戦闘スキルと天賦Lv.+2。", "Skill and Talent Lv. +2.", "战技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "必殺技時の与ダメージ+30%。次の戦闘スキル後にSPを1回復。", "Ultimate grants 30% DMG until next turn ends; next Skill restores 1 SP.", "施放终结技时造成的伤害提高30%，下次施放战技后恢复1点战技点。"),
  ] },
  "hsr:1404": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/662245", dataAsOf: "2026-08-11", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "最大強化スキルのメイン倍率+30%、同倍率で全体虚数ダメージ。", "Max enhanced Skill main multiplier +30% and deals matching AoE Imaginary DMG.", "最大强化战技主目标倍率提高30%，并以相同倍率造成全体虚数伤害。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "血の報復中に防御力15%無視。治癒量40%をチャージへ変換する。", "During Bloodscent, ignores 15% DEF and converts 40% of healing into Charge.", "血仇状态下无视15%防御，并将40%治疗量转化为蓄力。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルLv.+2、通常攻撃Lv.+2。", "Skill and Basic ATK Lv. +2.", "战技与普攻等级+2。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "血の報復中、会心ダメージ+30%。被弾後に最大HP10%を回復。", "During Bloodscent, CRIT DMG +30%; after being hit, heals 10% Max HP.", "血仇状态下暴击伤害提高30%；受击后恢复10%生命上限。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦Lv.+2。", "Ultimate and Talent Lv. +2.", "终结技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "戦闘開始時に血の報復へ入り、最大強化スキル必要チャージを100にする。", "Starts battle in Bloodscent and sets max enhanced Skill Charge requirement to 100.", "战斗开始时进入血仇状态，最大强化战技所需蓄力变为100。"),
  ] },
  "hsr:1223": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/626982", dataAsOf: "2026-08-21", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "戦闘開始後にEPを20回復。天賦付加ダメージごとにEPを2回復。", "Restores 20 Energy at battle start and 2 Energy for each Talent additional DMG.", "进入战斗后恢复20点能量；每次天赋附加伤害恢复2点能量。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "味方が獲物状態の敵に与える会心ダメージ+40%。", "Allies deal 40% more CRIT DMG to the Prey target.", "队友对猎物状态敌人的暴击伤害提高40%。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルと天賦Lv.+2。", "Skill and Talent Lv. +2.", "战技与天赋等级+2。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "必殺技発動時、与ダメージ+30%（2ターン）。", "When casting Ultimate, DMG +30% for 2 turns.", "施放终结技时，造成的伤害提高30%，持续2回合。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技Lv.+2、通常攻撃Lv.+1。", "Ultimate Lv. +2 and Basic ATK Lv. +1.", "终结技等级+2，普攻等级+1。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "天賦による追加攻撃のダメージ倍率+25%。", "Talent follow-up DMG multiplier +25%.", "天赋追加攻击的伤害倍率提高25%。"),
  ] },
  "hsr:1110": { ...SOURCE.hsr, sourceUrl: "https://game8.jp/houkaistarrail/539919", dataAsOf: "2026-08-11", updatedAt: "2026-08-27", effects: [
    effect(1, "星魂1", "Eidolon 1", "星魂1", "HP50%以下の味方への治癒量+20%。", "Healing to allies at 50% HP or less +20%.", "对生命低于50%的队友治疗量提高20%。"),
    effect(2, "星魂2", "Eidolon 2", "星魂2", "サバイバル反応対象はデバフ付与を1回抵抗する。", "Survival Response targets resist one debuff application.", "持有求生反应的目标可抵抗1次负面效果。"),
    effect(3, "星魂3", "Eidolon 3", "星魂3", "戦闘スキルLv.+2、通常攻撃Lv.+1。", "Skill Lv. +2 and Basic ATK Lv. +1.", "战技等级+2，普攻等级+1。"),
    effect(4, "星魂4", "Eidolon 4", "星魂4", "サバイバル反応付与時、対象の攻撃力をリンクス最大HPの3%分上昇（1ターン）。", "Applying Survival Response raises target ATK by 3% of Lynx's Max HP for 1 turn.", "施加求生反应时，目标攻击力提高相当于玲可生命上限3%的数值，持续1回合。"),
    effect(5, "星魂5", "Eidolon 5", "星魂5", "必殺技と天賦Lv.+2。", "Ultimate and Talent Lv. +2.", "终结技与天赋等级+2。"),
    effect(6, "星魂6", "Eidolon 6", "星魂6", "サバイバル反応のHP上昇を最大HP6%分追加し、対象の効果抵抗+30%。", "Survival Response gains another 6% Max HP and its target gains 30% Effect RES.", "求生反应额外提高6%生命上限，目标效果抵抗提高30%。"),
  ] },
  "genshin:10000029": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/352608", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "攻撃・スキル時に確率追撃。発動後12秒、攻撃力+60%。", "Attacks and Skill can trigger follow-up damage; after it triggers, ATK +60% for 12s.", "攻击或战技时概率追加攻击；触发后攻击力提高60%，持续12秒。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "元素スキル命中時、敵の防御力-23%（10秒）。", "Skill hits reduce enemy DEF by 23% for 10s.", "元素战技命中时，敌方防御力降低23%，持续10秒。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "元素爆発中の交代または終了時に炎範囲ダメージ。場にいる時は+100%。", "Swapping during or ending Burst deals AoE Pyro DMG; it is 100% stronger while Klee is on field.", "元素爆发期间切换或结束时造成火元素范围伤害；可莉在场时提高100%。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "爆発中、他メンバーの元素エネルギーを回復し炎ダメージ+10%。自身の炎ダメージ+50%。", "During Burst, restores teammates' Energy and grants 10% Pyro DMG; Klee gains 50% Pyro DMG.", "爆发期间为其他队员恢复元素能量并提高10%火伤；可莉自身火伤提高50%。"),
  ] },
  "genshin:10000098": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/539444", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "夜巡り中の通常攻撃命中時、攻撃力30%相当の雷連携攻撃を2回。", "During Night Vigil, Normal hits trigger two coordinated Electro strikes worth 30% ATK.", "夜巡状态下普攻命中时，触发2次攻击力30%的雷元素协同攻击。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "雷反応後の固有天賦倍率を強化し、中断耐性を上げる。", "Strengthens passive scaling after Electro reactions and raises interruption resistance.", "雷元素反应后强化固有天赋倍率，并提高抗打断能力。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "元素爆発の命の契約1%ごとにダメージ+2%、最大+200%。", "Burst DMG +2% per 1% Bond of Life, up to 200%.", "元素爆发伤害按每1%生命之契提高2%，最多提高200%。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "夜巡り後12秒、会心率+10%・会心ダメージ+70%と追撃・耐久強化を得る。", "For 12s after Night Vigil, gains 10% CRIT Rate, 70% CRIT DMG, and stronger follow-up and survival effects.", "夜巡结束后12秒内，暴击率提高10%、暴击伤害提高70%，并强化追击与生存能力。"),
  ] },
  "genshin:10000067": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/466765", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "待機中の元素チャージ効率+20%。", "Energy Recharge +20% while off field.", "处于队伍后台时，元素充能效率提高20%。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "草反応で芽生え状態の継続時間を延長する。", "Dendro reactions extend the Sprout effect duration.", "触发草元素反应时延长飞叶轮舞状态持续时间。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "元素爆発後、本人を除く周囲チームの元素熟知+60（12秒）。", "After Burst, nearby party members except Collei gain 60 Elemental Mastery for 12s.", "元素爆发后，附近队伍中除柯莱外的角色元素精通提高60点，持续12秒。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "リーフブーメラン命中時、攻撃力200%分の草元素追加ダメージ。", "Leaf Boomerang hits deal bonus Dendro DMG equal to 200% ATK.", "飞叶轮命中时额外造成攻击力200%的草元素伤害。"),
  ] },
  "genshin:10000055": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/395529", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "領域内の他キャラが岩ダメージ時、元素スキルCT-2秒。", "When another character in the field deals Geo DMG, Skill CD -2s.", "领域内其他角色造成岩元素伤害时，元素战技冷却缩短2秒。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "結晶の欠片取得または月結晶時、爆発継続+1秒、最大+3秒。", "Picking up a Crystallize shard or Lunar Crystallize extends Burst by 1s, up to 3s.", "拾取结晶碎片或触发月结晶时，元素爆发持续时间延长1秒，最多3秒。"),
    effect(3, "命ノ星座3", "Constellation 3", "命之座3", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "特定領域時、1.5秒ごとに防御力50%分を回復する。", "In the appropriate field state, heals 50% DEF every 1.5s.", "处于指定领域时，每1.5秒恢复防御力50%等值的生命。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "領域状態に応じ、周囲チームの岩元素会心ダメージ+10/20/40%（12秒）。", "Depending on field state, nearby party Geo CRIT DMG +10/20/40% for 12s.", "按领域状态，附近队伍岩元素暴击伤害提高10/20/40%，持续12秒。"),
  ] },
  "genshin:10000095": { ...SOURCE.genshin, sourceUrl: "https://game8.jp/genshin/539463", dataAsOf: "2026-08-13", updatedAt: "2026-08-27", effects: [
    effect(1, "命ノ星座1", "Constellation 1", "命之座1", "バブルの追加3回バウンドと待機中スキルバフの上限強化。", "Adds 3 Bubble bounces and raises the off-field Skill-buff cap.", "生命之契气泡额外弹跳3次，并提高后台战技增益上限。"),
    effect(2, "命ノ星座2", "Constellation 2", "命之座2", "HP上限30%のシールドを得て、水耐性-35%（8秒）。", "Gains a shield worth 30% Max HP and reduces Hydro RES by 35% for 8s.", "获得相当于生命上限30%的护盾，并使水抗降低35%，持续8秒。"),
    effect(3, "命ノ星座3", "Constellation 3", "元素战技等级+3", "元素スキルLv.+3。", "Elemental Skill Lv. +3.", "元素战技等级+3。"),
    effect(4, "命ノ星座4", "Constellation 4", "命之座4", "元素爆発の継続時間+3秒。", "Elemental Burst duration +3s.", "元素爆发持续时间延长3秒。"),
    effect(5, "命ノ星座5", "Constellation 5", "命之座5", "元素爆発Lv.+3。", "Elemental Burst Lv. +3.", "元素爆发等级+3。"),
    effect(6, "命ノ星座6", "Constellation 6", "命之座6", "治療時、HP依存で元素爆発の会心率最大+20%・会心ダメージ最大+110%（15秒）。", "When healing, Burst gains up to 20% CRIT Rate and 110% CRIT DMG based on HP for 15s.", "治疗时，按生命值使元素爆发最多获得20%暴击率与110%暴击伤害，持续15秒。"),
  ] },
  "zzz:1571": { ...SOURCE.zzz, sourceUrl: "https://game8.jp/zenless/760639", dataAsOf: "2026-08-27", updatedAt: "2026-08-27", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "ミサイル命中時、敵の全属性耐性-15%（15秒）。", "Missile hits reduce enemy All-Attribute RES by 15% for 15s.", "导弹命中时，敌方全属性抗性降低15%，持续15秒。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "技術格差のブレイク弱体倍率を上げ、エネルギーを回復する。", "Improves the Technical Gap Stun Vulnerability multiplier and restores Energy.", "提高技术差距的失衡易伤倍率，并恢复能量。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "連携誘発時、デシベル値を200回復する。", "Triggering a Chain restores 200 Decibels.", "触发连携时恢复200点喧响值。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "敵ブレイク時、控えからミサイル攻撃を行う。", "When an enemy is Stunned, launches a missile attack from off field.", "敌人失衡时，从后台发动导弹攻击。"),
  ] },
  "zzz:1291": { ...SOURCE.zzz, sourceUrl: "https://game8.jp/zenless/666110", dataAsOf: "2026-07-31", updatedAt: "2026-08-27", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "累算発動時、会心率+12%、会心ダメージ+30%。", "When Reverb triggers, CRIT Rate +12% and CRIT DMG +30%.", "触发累算时，暴击率提高12%，暴击伤害提高30%。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "終結スキルの累算でブレイク状態が終了せず、防御力15%無視。", "Ultimate's Reverb does not end Stun and ignores 15% DEF.", "终结技的累算不会结束失衡状态，并无视15%防御。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "チャージ射撃命中後、氷耐性を12%無視する。", "After a charged shot hits, ignores 12% Ice RES.", "蓄力射击命中后无视12%冰抗。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "深淵の反響を発動し、累算ととどめの一撃を強化する。", "Triggers Deep Echo and strengthens Reverb and finishing attacks.", "触发深渊回响，强化累算与终结一击。"),
  ] },
  "zzz:1081": { ...SOURCE.zzz, sourceUrl: "https://game8.jp/zenless/607806", dataAsOf: "2026-06-05", updatedAt: "2026-08-27", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "ダッシュ攻撃または回避反撃命中時にエネルギーを回復する。", "Dash attacks and dodge counters restore Energy on hit.", "冲刺攻击或闪避反击命中时恢复能量。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "回避反撃ダメージ+25%、身躱し射撃が回避扱いになる。", "Dodge Counter DMG +25%, and crouched shots count as dodges.", "闪避反击伤害提高25%，蹲伏射击视为闪避。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "強化特殊スキルの距離に応じ、会心率最大+32%。", "EX Special gains up to 32% CRIT Rate based on distance.", "强化特殊技按距离最多获得32%暴击率。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "累計攻撃命中または極限回避後、与ダメージ+6%（最大5重）。", "After cumulative hits or Perfect Dodge, DMG +6%, up to 5 stacks.", "累计攻击命中或极限闪避后，造成的伤害提高6%，最多5层。"),
  ] },
  "zzz:1351": { ...SOURCE.zzz, sourceUrl: "https://game8.jp/zenless/665675", dataAsOf: "2026-07-31", updatedAt: "2026-08-27", effects: [
    effect(1, "心象映画1", "Mindscape 1", "心象电影1", "囚縛対象へのダメージ時、会心率+10%。", "When damaging a Binding target, CRIT Rate +10%.", "对束缚目标造成伤害时，暴击率提高10%。"),
    effect(2, "心象映画2", "Mindscape 2", "心象电影2", "猟歩中、攻撃力+10%。", "While Hunter's Gait is active, ATK +10%.", "狩猎步伐状态下，攻击力提高10%。"),
    effect(3, "心象映画3", "Mindscape 3", "心象电影3", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(4, "心象映画4", "Mindscape 4", "心象电影4", "強化特殊スキルに必要なエネルギー-5。", "EX Special Energy cost -5.", "强化特殊技所需能量降低5点。"),
    effect(5, "心象映画5", "Mindscape 5", "心象电影5", "通常・回避・支援・特殊・連携スキルLv.+2。", "Basic, Dodge, Assist, Special, and Chain skills Lv. +2.", "普攻、闪避、支援、特殊技与连携技等级+2。"),
    effect(6, "心象映画6", "Mindscape 6", "心象电影6", "特殊スキル与ダメージ+15%、重複攻撃回数+2、囚縛の適用範囲を拡大する。", "Special Skill DMG +15%, gains 2 extra repeated attacks, and expands Binding coverage.", "特殊技伤害提高15%，重复攻击次数+2，并扩大束缚适用范围。"),
  ] },
});

export function constellationProfileFor(identity: CharacterIdentity, rank: number | null): ConstellationProfile {
  const entry = CURATED[identity.key] ?? CURATED[`${identity.game}:${identity.displayName}`];
  const acquiredRank = Math.max(0, Math.min(6, rank ?? 0));
  if (!entry) {
    const source = SOURCE[identity.game];
    return { rankLabel: LABELS[identity.game], acquiredRank, dataStatus: "preparing", ...source, dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [], activeTargetChanges: [] };
  }
  return {
    ...entry,
    rankLabel: LABELS[identity.game],
    acquiredRank,
    dataStatus: "curated",
    activeTargetChanges: entry.effects.filter((item) => item.level <= acquiredRank).flatMap((item) => item.targetChanges ?? []),
  };
}
