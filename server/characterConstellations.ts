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
const effect = (level: 1 | 2 | 3 | 4 | 5 | 6, jaName: string, enName: string, zhName: string, ja: string, en: string, zh: string, options: Pick<ConstellationEffect, "targetChanges" | "caution"> = {}): ConstellationEffect => ({ level, name: t(jaName, enName, zhName), description: t(ja, en, zh), ...options });

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
};

const LABELS: Record<CharacterIdentity["game"], LocalizedText> = {
  hsr: t("星魂", "Eidolons", "星魂"),
  genshin: t("命ノ星座", "Constellations", "命之座"),
  zzz: t("心象映画", "Mindscape Cinema", "心象电影"),
};

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
