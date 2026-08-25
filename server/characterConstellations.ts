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
  "genshin:シロネン": {
    ...SOURCE.genshin, sourceUrl: "https://game8.co/games/Genshin-Impact/archives/461997", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "休日の句", "Sabbatical Phrase", "休假的韵律", "夜魂の加護状態の消費を30%下げ、継続時間を延ばす。", "Reduces Nightsoul Blessing consumption by 30% and extends its uptime.", "夜魂加持状态的消耗降低30%，并延长持续时间。"),
      effect(2, "千年的祭礼", "Chiucue Mix", "千年的祭礼", "元素に応じてチームを強化する。炎は攻撃力、 水は最大HP、雷は元素エネルギー、氷は会心率・会心ダメージ、岩は与ダメージを上げる。", "Grants element-dependent team buffs: ATK for Pyro, Max HP for Hydro, Energy for Electro, CRIT for Cryo, and DMG for Geo.", "按元素给予队伍增益：火提高攻击力，水提高生命上限，雷回复能量，冰提高双暴，岩提高伤害。"),
      effect(3, "太陽の星", "Tonal Shift", "太阳之星", "元素スキルを3レベル上げる。", "Raises Elemental Skill by 3.", "元素战技提高3级。"),
      effect(4, "小さな祝福", "Suchitl's Trance", "小小的祝福", "元素スキル後、味方の通常・重撃・落下攻撃へ防御力参照の追加ダメージを与える。", "After Skill, allies' Normal, Charged, and Plunging Attacks gain DEF-scaling bonus damage.", "施放战技后，队友的普攻、重击和下落攻击获得基于防御力的额外伤害。"),
      effect(5, "諸日こそ諸夜", "The World's Song", "诸日即诸夜", "元素爆発を3レベル上げる。", "Raises Elemental Burst by 3.", "元素爆发提高3级。"),
      effect(6, "不朽の夜の祝祭", "Imperishable Night Carnival", "不灭之夜的狂欢", "夜魂の加護中の支援・回復・自身の防御力参照ダメージを強化する。", "Enhances support, healing, and DEF-scaling damage during Nightsoul Blessing.", "强化夜魂加持期间的辅助、治疗以及自身防御力倍率伤害。"),
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
  "zzz:浮波柚葉": {
    ...SOURCE.zzz, sourceUrl: "https://game8.co/games/Zenless-Zone-Zero/archives/527726", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", effects: [
      effect(1, "幸運体質", "Lucky Constitution", "幸运体质", "入場時にエネルギー30を回復し、スイートスケア対象の全属性耐性を10%下げ、異常・混沌ダメージ支援を強化する。", "Restores 30 Energy on entry, reduces Sweet Scare targets' All-Attribute RES by 10%, and strengthens Anomaly/Disorder support.", "入场回复30能量，降低甜蜜惊吓目标10%全属性抗性，并强化异常与紊乱增益。"),
      effect(2, "色とりどりの仲間", "Full of Colorful Company", "五彩斑斓的伙伴", "EX特殊または終結技命中で、チームの与ダメージと異常蓄積効率を40秒間15%上げる。", "EX Special or Ultimate hit grants the squad 15% DMG and Anomaly Buildup Rate for 40s.", "强化特殊技或终结技命中后，全队伤害和异常积蓄效率提高15%，持续40秒。"),
      effect(3, "お化け屋敷のおとぎ話", "Fairytale of the Haunted City", "鬼屋童话", "基本・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(4, "落下する魔法", "Falling Magic", "坠落魔法", "支援追撃のダメージを30%、異常蓄積効率を20%上げ、命中時にクイック支援を発動する。", "Raises Assist Follow-Up DMG by 30% and Anomaly Buildup Rate by 20%; hit triggers Quick Assist.", "支援追击伤害提高30%、异常积蓄效率提高20%，命中时触发快速支援。"),
      effect(5, "色褪せる冬の夢", "Dreams of a Fading Winter", "褪色冬日之梦", "基本・回避・支援・特殊・連携スキルを2レベル上げる。", "Raises Basic, Dodge, Assist, Special, and Chain skills by 2.", "普攻、闪避、支援、特殊技和连携技提高2级。"),
      effect(6, "根を下ろす", "Put Down Roots", "扎根", "パリィ成功で糖分ポイントを追加し、強化支援追撃でチームの混沌ダメージ倍率を上げる。", "Successful parries grant extra Sugar Points; charged Assist Follow-Up raises squad Disorder damage multiplier.", "成功格挡获得额外糖分点；蓄力支援追击提高全队紊乱伤害倍率。"),
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
