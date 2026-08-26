import type { StatKey, TierName } from "./buildAdvisor";
import { CHARACTER_GUIDE_CATALOG, HSR_RUNTIME_PATHS, ZZZ_RUNTIME_PROFESSIONS } from "./characterGuideCatalog";
import { generatedGenshinGuide, generatedHsrGuide, generatedZzzGuide } from "./individualGuides";

/**
 * 推奨編成の手動キュレーションデータ。
 * バージョン更新時は GAME_PARTY_DATASET と PARTY_CATALOG の該当ゲームだけを更新する。
 * 表示件数は MAX_PARTY_OPTIONS に固定し、比較可能な戦闘外ステータスだけを targetChanges に記録する。
 */
export type PartyGameId = "hsr" | "genshin" | "zzz";
export type LocalizedText = { ja: string; en: string; "zh-CN": string };

export type PartyMember = { name: LocalizedText; role: LocalizedText };
export type PartyTargetChange = {
  key: StatKey;
  label: LocalizedText;
  unit: "%" | "";
  targets: Record<TierName, number>;
  reason: LocalizedText;
};

export type PartyCommunitySource = {
  label: LocalizedText;
  url: string;
  checkedAt: string;
  note: LocalizedText;
  status: "crossChecked" | "watching";
};

export type PartyRecommendation = {
  id: string;
  rank: 1 | 2 | 3;
  title: LocalizedText;
  members: PartyMember[];
  synergy: LocalizedText[];
  targetChanges: PartyTargetChange[];
  targetSummary: LocalizedText;
  gameVersion: string;
  dataAsOf: string;
  updatedAt: string;
  sourceLabel: LocalizedText;
  sourceUrl: string;
  communitySources: PartyCommunitySource[];
};

export type PartyRecommendationSet = {
  gameVersion: string;
  dataAsOf: string;
  updatedAt: string;
  options: PartyRecommendation[];
};

export const MAX_PARTY_OPTIONS = 3;

const t = (ja: string, en: string, zh: string): LocalizedText => ({ ja, en, "zh-CN": zh });
const member = (ja: string, en: string, zh: string, roleJa: string, roleEn: string, roleZh: string): PartyMember => ({ name: t(ja, en, zh), role: t(roleJa, roleEn, roleZh) });
const change = (key: StatKey, ja: string, en: string, zh: string, unit: "%" | "", strict: number, goal: number, base: number, reasonJa: string, reasonEn: string, reasonZh: string): PartyTargetChange => ({
  key, label: t(ja, en, zh), unit, targets: { "厳選": strict, "目標": goal, "妥協": base }, reason: t(reasonJa, reasonEn, reasonZh),
});

const GAME_PARTY_DATASET: Record<PartyGameId, Omit<PartyRecommendationSet, "options">> = {
  hsr: { gameVersion: "4.4", dataAsOf: "2026-08-25", updatedAt: "2026-08-25" },
  genshin: { gameVersion: "7.0", dataAsOf: "2026-08-25", updatedAt: "2026-08-25" },
  zzz: { gameVersion: "3.1", dataAsOf: "2026-08-25", updatedAt: "2026-08-25" },
};

const sourceFor = (game: PartyGameId) => game === "hsr"
  ? { label: t("公開チームガイドを照合", "Cross-checked public team guides", "交叉核对公开配队指南"), url: "https://game8.co/games/Honkai-Star-Rail/archives/409824" }
  : game === "genshin"
    ? { label: t("公開チームガイドを照合", "Cross-checked public team guides", "交叉核对公开配队指南"), url: "https://game8.co/games/Genshin-Impact/archives/301819" }
    : { label: t("公開エージェントガイドを照合", "Cross-checked public agent guides", "交叉核对公开代理人指南"), url: "https://game8.co/games/Zenless-Zone-Zero/archives/458656" };

const communitySourcesFor = (game: PartyGameId): PartyCommunitySource[] => game === "hsr"
  ? [{ label: t("HoYoLAB由来の4.4編成議論（Reddit公開投稿）", "HoYoLAB-derived 4.4 team discussion (public Reddit post)", "来自HoYoLAB的4.4配队讨论（Reddit公开帖）"), url: "https://www.reddit.com/r/HonkaiStarRail/comments/1vmdw4d/here_is_the_strongest_teams_in_version_44_by/", checkedAt: "2026-08-25", note: t("主ガイドの構成傾向と照合し、代替枠の検討にのみ使用。", "Checked against the primary guide and used only to assess alternatives.", "已与主指南交叉核对，仅用于评估替代位。"), status: "crossChecked" }]
  : game === "genshin"
    ? [{ label: t("Game8原神ガイドの公開Xアカウント", "Game8 Genshin public X account", "Game8原神公开X账号"), url: "https://x.com/G8_Genshin", checkedAt: "2026-08-25", note: t("更新日付き主ガイドと併読し、環境更新・代替編成の確認に使用。", "Used with the dated primary guide to monitor meta updates and alternatives.", "与带更新日期的主指南结合，用于确认环境更新和替代配队。"), status: "crossChecked" }]
    : [{ label: t("Game8 ZZZガイドの公開Xアカウント", "Game8 ZZZ public X account", "Game8 ZZZ公开X账号"), url: "https://x.com/Zenless_Game8", checkedAt: "2026-08-25", note: t("更新日付き主ガイドと併読し、編成の代替枠と環境変化を確認。", "Used with the dated primary guide to monitor alternative slots and meta changes.", "与带更新日期的主指南结合，确认替代位和环境变化。"), status: "crossChecked" }];

function option(game: PartyGameId, input: Omit<PartyRecommendation, "gameVersion" | "dataAsOf" | "updatedAt" | "sourceLabel" | "sourceUrl" | "communitySources">): PartyRecommendation {
  const dataset = GAME_PARTY_DATASET[game];
  const source = sourceFor(game);
  return { ...input, ...dataset, sourceLabel: source.label, sourceUrl: source.url, communitySources: communitySourcesFor(game) };
}

const PARTY_CATALOG: Record<string, PartyRecommendation[]> = {
  "hsr:ホタル": [
    option("hsr", { id: "firefly-superbreak", rank: 1, title: t("超撃破・完成形", "Premium Super Break", "超击破完整队"), members: [member("ホタル", "Firefly", "流萤", "主力", "Main DPS", "主C"), member("ルアン・メェイ", "Ruan Mei", "阮·梅", "撃破支援", "Break support", "击破辅助"), member("開拓者（調和）", "Trailblazer (Harmony)", "开拓者（同谐）", "超撃破支援", "Super Break support", "超击破辅助"), member("霊砂", "Lingsha", "灵砂", "耐久", "Sustain", "生存位")], synergy: [t("ルアン・メェイの戦闘中速度補正と弱点撃破支援で、超撃破の回転を整える。", "Ruan Mei's in-combat SPD bonus and break support stabilize Super Break rotations.", "阮·梅的战斗内速度加成与击破辅助可稳定超击破循环。")], targetChanges: [change("speed", "速度", "SPD", "速度", "", 154, 150, 145, "ルアン・メェイ編成では戦闘中速度補正を加味し、公開プロフィールでは速度150を目標にする。", "With Ruan Mei, account for in-combat SPD; target 150 SPD on the public profile.", "搭配阮·梅时计入战斗内速度加成，公开面板以150速度为目标。")], targetSummary: t("速度は戦闘外の公開値。撃破特効は戦闘中バフを含めずに比較する。", "SPD is an out-of-combat value; Break Effect is compared without combat buffs.", "速度为战斗外面板值；击破特攻不计入战斗内增益。") }),
    option("hsr", { id: "firefly-fugue", rank: 2, title: t("超撃破・代替支援", "Super Break Alternative", "超击破替代辅助队"), members: [member("ホタル", "Firefly", "流萤", "主力", "Main DPS", "主C"), member("帰忘の流離人", "Fugue", "忘归人", "撃破支援", "Break support", "击破辅助"), member("開拓者（調和）", "Trailblazer (Harmony)", "开拓者（同谐）", "超撃破支援", "Super Break support", "超击破辅助"), member("ギャラガー", "Gallagher", "加拉赫", "耐久", "Sustain", "生存位")], synergy: [t("弱点撃破へ寄せた支援とギャラガーの撃破寄り回復で、超撃破の発動回数を確保する。", "Break-focused support and Gallagher's break-oriented sustain maintain Super Break triggers.", "击破向辅助与加拉赫的击破型生存位可维持超击破触发次数。")], targetChanges: [change("speed", "速度", "SPD", "速度", "", 160, 154, 150, "ルアン・メェイの戦闘中速度補正を受けないため、公開プロフィールの速度目標を引き上げる。", "Without Ruan Mei's in-combat SPD, raise the public-profile SPD target.", "不享受阮·梅的战斗内速度加成，因此提高公开面板的速度目标。")], targetSummary: t("速度はこの編成では高めに必要。撃破特効の比較方法は第1案と同じ。", "This team needs more out-of-combat SPD; Break Effect is assessed as in Plan 1.", "此队更需要较高战斗外速度；击破特攻按第1案的方式评估。") }),
    option("hsr", { id: "firefly-accessible", rank: 3, title: t("超撃破・入手しやすい案", "Accessible Super Break", "易获取超击破队"), members: [member("ホタル", "Firefly", "流萤", "主力", "Main DPS", "主C"), member("アスター", "Asta", "艾丝妲", "速度支援", "SPD support", "速度辅助"), member("開拓者（調和）", "Trailblazer (Harmony)", "开拓者（同谐）", "超撃破支援", "Super Break support", "超击破辅助"), member("ギャラガー", "Gallagher", "加拉赫", "耐久", "Sustain", "生存位")], synergy: [t("アスターの速度支援と調和開拓者の超撃破で、限定支援がいない場合の軸を作る。", "Asta's SPD support plus Harmony Trailblazer's Super Break forms an accessible core.", "艾丝妲的速度辅助与同谐开拓者的超击破构成易获取核心。")], targetChanges: [change("speed", "速度", "SPD", "速度", "", 160, 154, 150, "速度バフの稼働率が編成・ローテーションで変わるため、公開値は154を目安にする。", "Since SPD-buff uptime depends on rotation, aim for 154 SPD on the public profile.", "速度增益覆盖率取决于队伍和循环，公开面板以154速度为参考。")], targetSummary: t("速度補正の常時適用を前提にせず、公開値で循環を確保する。", "Do not assume permanent SPD buffs; secure rotations with the public value.", "不要假定速度增益永久覆盖，应以公开面板值保证循环。") }),
  ],
  "hsr:飛霄": [
    option("hsr", { id: "feixiao-fua", rank: 1, title: t("追加攻撃・高相性", "Follow-Up Premium", "追击高协同队"), members: [member("飛霄", "Feixiao", "飞霄", "主力", "Main DPS", "主C"), member("トパーズ&カブ", "Topaz & Numby", "托帕&账账", "副火力", "Sub DPS", "副C"), member("ロビン", "Robin", "知更鸟", "支援", "Support", "辅助"), member("アベンチュリン", "Aventurine", "砂金", "耐久", "Sustain", "生存位")], synergy: [t("頻繁な追加攻撃で飛霄の「飛黄」蓄積を加速し、ロビンの全体支援で単体火力を伸ばす。", "Frequent follow-ups accelerate Flying Aureus stacks while Robin boosts team damage.", "高频追击加快「飞黄」叠层，知更鸟提升全队伤害。")], targetChanges: [], targetSummary: t("会心・攻撃力・速度の公開値は基本目標を維持。戦闘中バフは別表示として扱う。", "Keep the baseline out-of-combat CRIT, ATK, and SPD targets; combat buffs stay separate.", "维持基础战斗外暴击、攻击和速度目标；战斗内增益单独处理。") }),
    option("hsr", { id: "feixiao-hunt", rank: 2, title: t("巡狩連携・低コスト", "Hunt Synergy Accessible", "巡猎联动易获取队"), members: [member("飛霄", "Feixiao", "飞霄", "主力", "Main DPS", "主C"), member("三月なのか（巡狩）", "March 7th (Hunt)", "三月七（巡猎）", "副火力", "Sub DPS", "副C"), member("開拓者（記憶）", "Trailblazer (Remembrance)", "开拓者（记忆）", "支援", "Support", "辅助"), member("ナターシャ", "Natasha", "娜塔莎", "耐久", "Sustain", "生存位")], synergy: [t("三月なのかの攻撃と師匠効果で相互に行動回数を増やし、飛黄の蓄積を補助する。", "March's attacks and Shifu effect raise joint action frequency and help build Flying Aureus.", "三月七的攻击与师傅效果增加协同行动频率，辅助积累「飞黄」。")], targetChanges: [change("speed", "速度", "SPD", "速度", "", 143, 134, 120, "三月なのかの師匠効果で戦闘中速度を得られるため、公開値は速度134の到達を優先する。", "March's Shifu can grant in-combat SPD, so prioritize reaching 134 SPD on the public profile.", "三月七的师傅效果可提供战斗内速度，公开面板优先达到134速度。")], targetSummary: t("師匠効果は戦闘中補正。会心・攻撃力は公開値で比較する。", "Shifu is an in-combat modifier; compare CRIT and ATK by public values.", "师傅效果为战斗内修正；暴击和攻击以公开面板比较。") }),
    option("hsr", { id: "feixiao-alternative", rank: 3, title: t("追加攻撃・代替枠", "Follow-Up Alternatives", "追击替代队"), members: [member("飛霄", "Feixiao", "飞霄", "主力", "Main DPS", "主C"), member("モゼ", "Moze", "貊泽", "副火力", "Sub DPS", "副C"), member("トリビー", "Tribbie", "缇宝", "支援", "Support", "辅助"), member("フォフォ", "Huohuo", "藿藿", "耐久", "Sustain", "生存位")], synergy: [t("モゼとトリビーの追加攻撃で飛黄を補助し、単体戦の手数を増やす。", "Moze and Tribbie supply follow-ups to build Flying Aureus in single-target fights.", "貊泽与缇宝提供追击，在单体战中辅助积累「飞黄」。")], targetChanges: [], targetSummary: t("速度134以上を起点に、会心率と会心ダメージの比率を公開値で整える。", "Use 134 SPD as the baseline and tune out-of-combat CRIT ratio.", "以134速度为起点，调整战斗外暴击率与暴击伤害比例。") }),
  ],
  "genshin:神里綾華": [
    option("genshin", { id: "ayaka-freeze", rank: 1, title: t("凍結・氷共鳴", "Freeze with Cryo Resonance", "冻结与双冰共鸣"), members: [member("神里綾華", "Kamisato Ayaka", "神里绫华", "主力", "Main DPS", "主C"), member("申鶴", "Shenhe", "申鹤", "氷支援", "Cryo support", "冰系辅助"), member("楓原万葉", "Kaedehara Kazuha", "枫原万叶", "耐性低下", "RES shred", "减抗"), member("珊瑚宮心海", "Sangonomiya Kokomi", "珊瑚宫心海", "水付着・回復", "Hydro & healing", "挂水与治疗")], synergy: [t("凍結維持、氷共鳴、氷風4セットの会心率補正を前提に、元素爆発へ火力を集中する。", "Freeze uptime, Cryo Resonance, and Blizzard Strayer CRIT bonuses focus damage into Ayaka's Burst.", "维持冻结、双冰共鸣与冰风套暴击加成，集中强化元素爆发。")], targetChanges: [change("critRate", "会心率", "CRIT Rate", "暴击率", "%", 55, 45, 35, "氷共鳴と氷風4セットを前提にした、戦闘外会心率の目安。", "Out-of-combat CRIT Rate target assuming Cryo Resonance and 4pc Blizzard Strayer.", "以双冰共鸣与冰风4件套为前提的战斗外暴击率目标。")], targetSummary: t("この案は氷共鳴・氷風4セットを前提に会心率目標を下げる。", "This plan lowers the public CRIT Rate target through Cryo Resonance and Blizzard Strayer.", "此方案因双冰共鸣与冰风套而降低公开面板暴击率目标。") }),
    option("genshin", { id: "ayaka-mono-cryo", rank: 2, title: t("氷元素集中", "Mono Cryo", "纯冰队"), members: [member("神里綾華", "Kamisato Ayaka", "神里绫华", "主力", "Main DPS", "主C"), member("申鶴", "Shenhe", "申鹤", "氷支援", "Cryo support", "冰系辅助"), member("ロサリア", "Rosaria", "罗莎莉亚", "会心補助", "CRIT support", "暴击辅助"), member("ディオナ", "Diona", "迪奥娜", "耐久", "Sustain", "生存位")], synergy: [t("氷元素粒子と氷共鳴を活かし、元素爆発の循環と会心補助を安定させる。", "Cryo particles and resonance stabilize Burst uptime and CRIT support.", "利用冰元素粒子与双冰共鸣，稳定元素爆发循环和暴击辅助。")], targetChanges: [change("critRate", "会心率", "CRIT Rate", "暴击率", "%", 55, 45, 35, "氷共鳴と氷風4セットを使う場合の戦闘外会心率目安。", "Out-of-combat CRIT Rate target when using Cryo Resonance and Blizzard Strayer.", "使用双冰共鸣与冰风套时的战斗外暴击率参考。")], targetSummary: t("会心率補正は戦闘中に発生するため、公開値と混同しない。", "CRIT bonuses occur in combat and should not be confused with the public stat value.", "暴击加成发生在战斗中，不应与公开面板混淆。") }),
    option("genshin", { id: "ayaka-non-resonance", rank: 3, title: t("非氷共鳴・柔軟枠", "Flexible Non-Resonance", "非双冰灵活队"), members: [member("神里綾華", "Kamisato Ayaka", "神里绫华", "主力", "Main DPS", "主C"), member("フリーナ", "Furina", "芙宁娜", "水支援", "Hydro support", "水系辅助"), member("楓原万葉", "Kaedehara Kazuha", "枫原万叶", "耐性低下", "RES shred", "减抗"), member("閑雲", "Xianyun", "闲云", "回復・支援", "Healing support", "治疗辅助")], synergy: [t("水付着・全体バフ・耐性低下を組み合わせるが、氷共鳴は得ない柔軟な編成。", "Hydro, team buffs, and RES shred offer flexibility, but this team has no Cryo Resonance.", "组合挂水、全队增益与减抗，但不享受双冰共鸣。")], targetChanges: [change("critRate", "会心率", "CRIT Rate", "暴击率", "%", 70, 60, 50, "氷共鳴を得ないため、公開プロフィールの会心率目標を15%高く置く。", "Without Cryo Resonance, raise the public CRIT Rate target by 15%.", "没有双冰共鸣时，公开面板暴击率目标提高15%。")], targetSummary: t("氷共鳴なしでは会心率の公開値を追加で確保する。", "Without Cryo Resonance, secure more out-of-combat CRIT Rate.", "没有双冰共鸣时，需要额外堆叠战斗外暴击率。") }),
  ],
  "genshin:アルレッキーノ": [
    option("genshin", { id: "arlecchino-vaporize", rank: 1, title: t("蒸発・高火力", "Vaporize High Damage", "蒸发高伤队"), members: [member("アルレッキーノ", "Arlecchino", "阿蕾奇诺", "主力", "Main DPS", "主C"), member("モナ", "Mona", "莫娜", "水付着・バフ", "Hydro & buffs", "挂水与增益"), member("フィッシュル", "Fischl", "菲谢尔", "副火力", "Sub DPS", "副C"), member("ベネット", "Bennett", "班尼特", "攻撃支援", "ATK support", "攻击辅助")], synergy: [t("水付着に炎を当てる蒸発を軸に、攻撃力バフと控え火力を重ねる。", "Apply Pyro onto Hydro for Vaporize while stacking ATK buffs and off-field damage.", "以火附着水触发蒸发为核心，叠加攻击增益与后台输出。")], targetChanges: [change("elementalMastery", "元素熟知", "Elemental Mastery", "元素精通", "", 220, 160, 100, "蒸発反応を安定して起こす案では、会心・攻撃力に加えて元素熟知を比較対象へ加える。", "For a consistent Vaporize team, add Elemental Mastery to CRIT and ATK checks.", "稳定蒸发队除暴击和攻击外，还应将元素精通纳入比较。")], targetSummary: t("蒸発案では元素熟知が追加目標。元素反応を使わない案とは評価軸が異なる。", "Vaporize adds Elemental Mastery as a target; it uses a different evaluation axis than non-reaction teams.", "蒸发队新增元素精通目标，与非反应队的评价维度不同。") }),
    option("genshin", { id: "arlecchino-overload", rank: 2, title: t("過負荷・炎雷限定", "Overload Pyro-Electro", "超载火雷队"), members: [member("アルレッキーノ", "Arlecchino", "阿蕾奇诺", "主力", "Main DPS", "主C"), member("シュヴルーズ", "Chevreuse", "夏沃蕾", "耐性低下", "RES shred", "减抗"), member("フィッシュル", "Fischl", "菲谢尔", "副火力", "Sub DPS", "副C"), member("ベネット", "Bennett", "班尼特", "攻撃支援", "ATK support", "攻击辅助")], synergy: [t("炎・雷のみで編成して耐性低下を有効化し、攻撃バフと控え火力を両立する。", "Use only Pyro and Electro to enable RES shred while retaining ATK buffs and off-field damage.", "仅使用火雷角色以启用减抗，同时保留攻击增益与后台输出。")], targetChanges: [], targetSummary: t("会心率・会心ダメージ・攻撃力は基本目標を維持。元素熟知は主比較対象にしない。", "Keep baseline CRIT and ATK targets; Elemental Mastery is not a primary check.", "维持基础暴击与攻击目标；元素精通不是主要比较项。") }),
    option("genshin", { id: "arlecchino-melt", rank: 3, title: t("溶解・氷付着", "Melt with Cryo", "融化挂冰队"), members: [member("アルレッキーノ", "Arlecchino", "阿蕾奇诺", "主力", "Main DPS", "主C"), member("シトラリ", "Citlali", "茜特菈莉", "氷付着", "Cryo application", "挂冰"), member("ベネット", "Bennett", "班尼特", "攻撃支援", "ATK support", "攻击辅助"), member("楓原万葉", "Kaedehara Kazuha", "枫原万叶", "耐性低下", "RES shred", "减抗")], synergy: [t("控えからの氷付着で溶解を狙い、攻撃バフと炎耐性低下を重ねる。", "Off-field Cryo enables Melt while ATK buffs and Pyro RES shred amplify damage.", "后台挂冰触发融化，并叠加攻击增益与火抗降低。")], targetChanges: [change("elementalMastery", "元素熟知", "Elemental Mastery", "元素精通", "", 220, 160, 100, "溶解の一撃を重視するため、元素熟知を追加目標として扱う。", "Treat Elemental Mastery as an additional target for Melt hits.", "重视融化单次伤害时，将元素精通作为附加目标。")], targetSummary: t("溶解案は元素熟知も不足判定に含める。", "The Melt plan includes Elemental Mastery in its shortage assessment.", "融化方案会将元素精通纳入不足判定。") }),
  ],
  "zzz:エレン": [
    option("zzz", { id: "ellen-ice-core", rank: 1, title: t("氷・ブレイク連携", "Ice Stun Core", "冰系失衡核心队"), members: [member("エレン", "Ellen", "艾莲", "主力", "Main DPS", "主C"), member("ライカン", "Von Lycaon", "莱卡恩", "撃破", "Stun", "击破"), member("蒼角", "Soukaku", "苍角", "氷支援", "Ice support", "冰系辅助")], synergy: [t("ライカンのブレイク支援と蒼角の氷・攻撃支援で、エレンの氷属性直撃火力を伸ばす。", "Lycaon's stun support and Soukaku's Ice and ATK buffs amplify Ellen's Ice damage.", "莱卡恩的失衡辅助与苍角的冰伤、攻击增益提升艾莲的冰属性直伤。")], targetChanges: [], targetSummary: t("会心率・会心ダメージ・攻撃力は公開プロフィールの基本目標を維持する。", "Keep baseline public-profile CRIT and ATK targets.", "维持公开面板的基础暴击与攻击目标。") }),
    option("zzz", { id: "ellen-premium", rank: 2, title: t("氷・支援強化", "Ice Premium Support", "冰系高配支援队"), members: [member("エレン", "Ellen", "艾莲", "主力", "Main DPS", "主C"), member("ライト", "Lighter", "莱特", "撃破", "Stun", "击破"), member("アストラ", "Astra", "耀嘉音", "支援", "Support", "辅助")], synergy: [t("ブレイク時間と支援バフを重ね、短い火力窓でエレンの直撃ダメージを集中させる。", "Stack stun windows and support buffs to concentrate Ellen's direct damage in burst windows.", "叠加失衡窗口与辅助增益，在短暂爆发期集中艾莲的直伤。")], targetChanges: [], targetSummary: t("戦闘中の攻撃・ダメージ補正は公開値へ加算せず、基本目標で比較する。", "Do not add in-combat ATK and DMG buffs to public stats; compare with baseline targets.", "不将战斗内攻击与伤害增益计入公开面板，按基础目标比较。") }),
    option("zzz", { id: "ellen-accessible", rank: 3, title: t("氷・入手しやすい案", "Accessible Ice Team", "易获取冰队"), members: [member("エレン", "Ellen", "艾莲", "主力", "Main DPS", "主C"), member("アンビー", "Anby", "安比", "撃破", "Stun", "击破"), member("蒼角", "Soukaku", "苍角", "氷支援", "Ice support", "冰系辅助")], synergy: [t("アンビーでブレイク機会を作り、蒼角の氷支援をエレンへ渡す入手しやすい構成。", "Anby creates stun opportunities while Soukaku passes Ice support to Ellen.", "安比创造失衡机会，苍角向艾莲提供冰系辅助，是易获取的组合。")], targetChanges: [], targetSummary: t("基本目標を維持し、会心率70%以上を起点に会心ダメージと攻撃力を整える。", "Keep baseline targets; start around 70% CRIT Rate and balance CRIT DMG with ATK.", "维持基础目标，以70%以上暴击率为起点平衡暴伤与攻击。") }),
  ],
  "zzz:星見雅": [
    option("zzz", { id: "miyabi-disorder", rank: 1, title: t("混沌・異常連携", "Disorder Anomaly", "紊乱异常联动队"), members: [member("星見雅", "Hoshimi Miyabi", "星见雅", "主力", "Main DPS", "主C"), member("浮波柚葉", "Ukinami Yuzuha", "浮波柚叶", "支援", "Support", "辅助"), member("月城柳", "Tsukishiro Yanagi", "月城柳", "異常", "Anomaly", "异常")], synergy: [t("異常・混沌の発生で落霜を得やすくし、氷異常と火力バフを重ねる。", "Disorder triggers help generate Fallen Frost while stacking Frost Anomaly and damage buffs.", "触发紊乱更容易获得落霜，并叠加霜异常与伤害增益。")], targetChanges: [change("critRate", "会心率", "CRIT Rate", "暴击率", "%", 80, 80, 70, "コアスキルによる霜異常蓄積を最大化するため、会心率80%を公開値の目標にする。", "Target 80% public CRIT Rate to maximize Frost Anomaly buildup from the Core Skill.", "为最大化核心技的霜异常积累，公开面板以80%暴击率为目标。")], targetSummary: t("この案では会心率80%が重要。戦闘中の異常・ダメージ補正は別扱い。", "80% CRIT Rate matters in this plan; combat anomaly and damage buffs stay separate.", "此方案80%暴击率很关键；战斗内异常和伤害增益单独处理。") }),
    option("zzz", { id: "miyabi-f2p", rank: 2, title: t("氷・入手しやすい案", "Accessible Ice Team", "易获取冰队"), members: [member("星見雅", "Hoshimi Miyabi", "星见雅", "主力", "Main DPS", "主C"), member("アンビー", "Anby", "安比", "撃破", "Stun", "击破"), member("蒼角", "Soukaku", "苍角", "氷支援", "Ice support", "冰系辅助")], synergy: [t("アンビーのブレイクと蒼角の氷・攻撃支援で、凍結状態の火力を支える。", "Anby's stun and Soukaku's Ice and ATK support strengthen Frozen-state damage.", "安比的失衡与苍角的冰伤、攻击辅助支撑冻结状态下的输出。")], targetChanges: [change("critRate", "会心率", "CRIT Rate", "暴击率", "%", 80, 80, 70, "コアスキルの霜異常蓄積を最大化する会心率目安は維持する。", "Retain the CRIT Rate benchmark that maximizes Core Skill Frost Anomaly buildup.", "维持最大化核心技霜异常积累的暴击率基准。")], targetSummary: t("会心率80%を優先し、会心ダメージと攻撃力は基本目標で比較する。", "Prioritize 80% CRIT Rate; compare CRIT DMG and ATK with baseline targets.", "优先80%暴击率；暴伤与攻击按基础目标比较。") }),
    option("zzz", { id: "miyabi-generalist", rank: 3, title: t("ブレイク・汎用案", "Generalist Stun Team", "通用失衡队"), members: [member("星見雅", "Hoshimi Miyabi", "星见雅", "主力", "Main DPS", "主C"), member("ライト", "Lighter", "莱特", "撃破", "Stun", "击破"), member("ルーシー", "Lucy", "露西", "支援", "Support", "辅助")], synergy: [t("ブレイクと攻撃支援を重ね、単一の異常連携に依存しない扱いやすい編成。", "Stack stun and ATK support in a flexible team that does not rely on a specific Disorder pairing.", "叠加失衡与攻击辅助，不依赖特定紊乱搭配的易用队伍。")], targetChanges: [change("critRate", "会心率", "CRIT Rate", "暴击率", "%", 80, 80, 70, "星見雅のコアスキルを活かすため、会心率80%を維持する。", "Maintain 80% CRIT Rate to support Miyabi's Core Skill.", "为发挥星见雅核心技，保持80%暴击率。")], targetSummary: t("会心率80%を目標にし、その他は公開プロフィールの基本目標を使う。", "Target 80% CRIT Rate and use baseline public targets for other stats.", "以80%暴击率为目标，其他属性使用公开面板基础目标。") }),
  ],
};

type ManualPlan = { members: string[]; synergy: LocalizedText; targetChanges?: PartyTargetChange[] };

const manualMember = (name: string, index: number, selectedRole: LocalizedText): PartyMember => index === 0
  ? { name: t(name, name, name), role: selectedRole }
  : member(name, name, name, index === 1 ? "主力・副火力" : index === 2 ? "支援・反応" : "耐久・補助", index === 1 ? "DPS / Sub DPS" : index === 2 ? "Support / Reaction" : "Sustain / utility", index === 1 ? "主C/副C" : index === 2 ? "辅助/反应" : "生存/功能位");

function manualOptions(game: PartyGameId, name: string, sourceUrl: string, selectedRole: LocalizedText, plans: [ManualPlan, ManualPlan, ManualPlan]): PartyRecommendation[] {
  const planTitles = [t("実戦・高相性", "Curated High Synergy", "实战高协同"), t("実戦・代替編成", "Curated Alternative", "实战替代队"), t("実戦・所持対応", "Curated Roster Option", "实战配队适配")];
  const profile = genericProfileFor(game, name);
  return plans.map((plan, index) => {
    const rank = (index + 1) as 1 | 2 | 3;
    const recommendation = option(game, {
      id: `curated-${game}-${name}-${rank}`,
      rank,
      title: planTitles[index],
      members: plan.members.map((partyMember, memberIndex) => manualMember(partyMember, memberIndex, selectedRole)),
      synergy: [plan.synergy],
      targetChanges: plan.targetChanges ?? [],
      targetSummary: t(`${name}の現行エンドコンテンツ向けに手動精査した編成。戦闘中バフは公開プロフィールの現在値へ加算しない。`, `Manually curated for ${name} in the current endgame environment. In-combat buffs are not added to public-profile stats.`, `针对${name}当前终局环境手动精查的配队。战斗内增益不会计入公开面板。`),
    });
    return { ...recommendation, sourceLabel: t("手動精査：個別・総合チームガイド", "Manually curated: individual and general team guides", "手动精查：角色与综合配队指南"), sourceUrl };
  });
}

const plan = (members: string[], ja: string, en: string, zh: string, targetChanges?: PartyTargetChange[]): ManualPlan => ({ members, synergy: t(ja, en, zh), targetChanges });
const mainDps = t("主力", "Main DPS", "主C");
const support = t("支援", "Support", "辅助");
const anomaly = t("異常", "Anomaly", "异常");
const batch3Options = (game: PartyGameId, name: string, sourceUrl: string, selectedRole: LocalizedText, plans: [ManualPlan, ManualPlan, ManualPlan]) => manualOptions(game, name, sourceUrl, selectedRole, plans).map((entry) => ({
  ...entry,
  dataAsOf: "2026-08-26",
  updatedAt: "2026-08-26",
  communitySources: entry.communitySources.map((source) => ({ ...source, checkedAt: "2026-08-26" })),
}));
const batch4Options = (game: PartyGameId, name: string, sourceUrl: string, selectedRole: LocalizedText, plans: [ManualPlan, ManualPlan, ManualPlan]) => manualOptions(game, name, sourceUrl, selectedRole, plans).map((entry) => ({
  ...entry,
  dataAsOf: "2026-08-26",
  updatedAt: "2026-08-26",
  communitySources: entry.communitySources.map((source) => ({ ...source, checkedAt: "2026-08-26" })),
}));
const batch5Options = (game: PartyGameId, name: string, sourceUrl: string, selectedRole: LocalizedText, plans: [ManualPlan, ManualPlan, ManualPlan]) => manualOptions(game, name, sourceUrl, selectedRole, plans).map((entry) => ({
  ...entry,
  dataAsOf: "2026-08-26",
  updatedAt: "2026-08-26",
  communitySources: entry.communitySources.map((source) => ({ ...source, checkedAt: "2026-08-26" })),
}));
const batch6Options = (game: PartyGameId, name: string, sourceUrl: string, selectedRole: LocalizedText, plans: [ManualPlan, ManualPlan, ManualPlan]) => manualOptions(game, name, sourceUrl, selectedRole, plans).map((entry) => ({
  ...entry,
  dataAsOf: "2026-08-26",
  updatedAt: "2026-08-26",
  communitySources: entry.communitySources.map((source) => ({ ...source, checkedAt: "2026-08-26" })),
}));
const batch7Options = (game: PartyGameId, name: string, sourceUrl: string, selectedRole: LocalizedText, plans: [ManualPlan, ManualPlan, ManualPlan]) => manualOptions(game, name, sourceUrl, selectedRole, plans).map((entry) => ({
  ...entry,
  dataAsOf: "2026-08-26",
  updatedAt: "2026-08-26",
  communitySources: entry.communitySources.map((source) => ({ ...source, checkedAt: "2026-08-26" })),
}));
const batch8Options = (game: PartyGameId, name: string, sourceUrl: string, selectedRole: LocalizedText, plans: [ManualPlan, ManualPlan, ManualPlan]) => manualOptions(game, name, sourceUrl, selectedRole, plans).map((entry) => ({
  ...entry,
  dataAsOf: "2026-08-26",
  updatedAt: "2026-08-26",
  communitySources: entry.communitySources.map((source) => ({ ...source, checkedAt: "2026-08-26" })),
}));

/**
 * 公開使用率・現行エンドコンテンツ・更新日付きチームガイドを照合した上位20の手動精査データ。
 * 既存の PARTY_CATALOG は代表6名を保持し、この表が同名キーを優先して上書きする。
 */
const MANUALLY_CURATED_HIGH_USAGE_CATALOG: Record<string, PartyRecommendation[]> = {
  "hsr:アグライア": manualOptions("hsr", "アグライア", "https://game8.co/games/Honkai-Star-Rail/archives/409824", mainDps, [
    plan(["アグライア", "サンデー", "ロビン", "フォフォ"], "サンデーの行動支援とロビンの全体火力支援で、記憶主力の手数と火力窓を重ねる。", "Sunday's action support and Robin's team buffs stack turns and burst windows for the Remembrance carry.", "星期日的行动辅助与知更鸟的全队增益叠加记忆主C的行动和爆发窗口。"),
    plan(["アグライア", "サンデー", "トリビー", "アベンチュリン"], "単体火力と耐久を重視する代替案。支援2枠で主力の行動価値を高める。", "A durable single-target alternative that uses two supports to raise the carry's turn value.", "重视单体输出与生存的替代队，以双辅助提高主C的行动价值。"),
    plan(["アグライア", "開拓者（記憶）", "ロビン", "ギャラガー"], "記憶開拓者を活かし、限定支援の所持状況に対応する実用案。", "A practical roster option built around Remembrance Trailblazer when premium supports vary.", "利用记忆开拓者、适应限定辅助持有情况的实用方案。"),
  ]),
  "hsr:アナイクス": manualOptions("hsr", "アナイクス", "https://game8.co/games/Honkai-Star-Rail/archives/409824", mainDps, [
    plan(["アナイクス", "ロビン", "サンデー", "フォフォ"], "行動支援と全体バフを重ね、知恵主力のスキル・必殺技回転を安定させる。", "Action support and team buffs stabilize the Erudition carry's skill and Ultimate rotation.", "叠加行动辅助和全队增益，稳定智识主C的技能与终结技循环。"),
    plan(["アナイクス", "トリビー", "ルアン・メェイ", "アベンチュリン"], "範囲火力と弱点撃破補助を両立する、複数敵向けの編成。", "A multi-target setup that combines AoE output with Weakness Break assistance.", "兼顾范围输出和弱点击破辅助的多目标配队。"),
    plan(["アナイクス", "ペラ", "アスター", "ギャラガー"], "防御低下と速度支援を使う低コスト代替案。", "A lower-cost alternative using DEF shred and SPD support.", "利用减防与速度辅助的低成本替代队。"),
  ]),
  "hsr:キャストリス": manualOptions("hsr", "キャストリス", "https://game8.co/games/Honkai-Star-Rail/archives/486305", mainDps, [
    plan(["キャストリス", "永夜", "キュレネ", "ヒアンシー"], "記憶・HP消費の相性を最大化し、主力と召喚物の火力を一体で伸ばす。", "Maximizes Remembrance and HP-consumption synergy to raise both carry and memosprite damage.", "最大化记忆与生命消耗协同，同时提高主C和忆灵伤害。"),
    plan(["キャストリス", "開拓者（記憶）", "トリビー", "霊砂"], "記憶開拓者の行動補助と範囲支援を重ねる実戦代替案。", "A practical alternative that combines Remembrance Trailblazer action support with AoE buffs.", "结合记忆开拓者行动辅助与范围增益的实战替代队。"),
    plan(["キャストリス", "開拓者（記憶）", "ペラ", "リンクス"], "公式ガイド掲載の低コスト軸。会心・HPを公開値で整え、速度は過度に積まない。", "The guide's accessible core; tune public CRIT and HP without over-investing in SPD.", "指南中的易获取核心；公开面板调整暴击与生命，不宜过度堆速度。"),
  ]),
  "hsr:ホタル": PARTY_CATALOG["hsr:ホタル"],
  "hsr:ロビン": manualOptions("hsr", "ロビン", "https://game8.jp/houkaistarrail/598842", support, [
    plan(["ロビン", "飛霄", "トパーズ&カブ", "アベンチュリン"], "追加攻撃の頻度を全体支援へ変換し、飛霄の蓄積と決定打を同時に伸ばす。", "Converts Follow-Up frequency into team value while accelerating Feixiao's stacks and finishers.", "将追击频率转化为全队收益，同时加快飞霄叠层与终结爆发。"),
    plan(["ロビン", "アグライア", "サンデー", "フォフォ"], "行動支援を重ねる記憶主力編成。ロビンは主力でなく全体火力の軸として扱う。", "A Remembrance-carry setup with stacked action support; Robin remains the team-wide damage core.", "叠加行动辅助的记忆主C队，知更鸟作为全队伤害核心。"),
    plan(["ロビン", "雪衣", "モゼ", "ギャラガー"], "追加攻撃を軸にしつつ、限定主力の所持状況に対応する案。", "An accessible follow-up-oriented option for rosters without the premium carry core.", "以追击为轴、适应未持有高配主C的方案。"),
  ]),
  "hsr:ルアン・メェイ": manualOptions("hsr", "ルアン・メェイ", "https://game8.jp/houkaistarrail/573084", support, [
    plan(["ルアン・メェイ", "ホタル", "帰忘の流離人", "ダリア"], "弱点撃破効率・耐性貫通・超撃破を重ねる現行の完成形。", "A current premium Super Break core stacking Break Efficiency, RES PEN, and Super Break.", "叠加击破效率、减抗与超击破的当前高配核心队。"),
    plan(["ルアン・メェイ", "乱破", "帰忘の流離人", "霊砂"], "範囲型の超撃破主力を、撃破効率と耐久で支える案。", "An AoE Super Break option that supports the carry with Break Efficiency and sustain.", "以击破效率与生存辅助范围超击破主C的方案。"),
    plan(["ルアン・メェイ", "カフカ", "セイレンス", "フォフォ"], "撃破以外の持続ダメージ主力でも全体支援を活かす案。", "A DoT option that uses her team support outside Break-centered teams.", "在非击破的持续伤害队中发挥全队辅助价值的方案。"),
  ]),
  "hsr:飛霄": manualOptions("hsr", "飛霄", "https://game8.jp/houkaistarrail/625602", mainDps, [
    plan(["飛霄", "サフェル", "サンデー", "丹恒・騰荒"], "行動回数と追加攻撃を重ね、飛黄の蓄積と必殺技の決定打を伸ばす現行主力案。", "A current premium core stacking actions and follow-ups for Flying Aureus buildup and Ultimate finishers.", "叠加行动与追击、提高飞黄积累和终结爆发的当前高配方案。"),
    plan(["飛霄", "サフェル", "トリビー", "丹恒・騰荒"], "追加攻撃頻度と範囲対応を両立する実戦代替案。", "A practical alternative balancing follow-up frequency and multi-target coverage.", "兼顾追击频率和范围应对的实战替代方案。"),
    plan(["飛霄", "三月なのか（巡狩）", "開拓者（記憶）", "ナターシャ"], "巡狩連携の行動回数を活かす所持対応案。", "A roster-friendly option that uses Hunt synergy for more actions.", "利用巡猎联动增加行动次数的持有适配方案。"),
  ]),

  "genshin:フリーナ": manualOptions("genshin", "フリーナ", "https://game8.co/games/Genshin-Impact/archives/301819", support, [
    plan(["フリーナ", "ヌヴィレット", "楓原万葉", "シロネン"], "HP変動を活かす主力と耐性低下・回復支援を組み、全体バフの稼働を安定させる。", "Pairs an HP-fluctuation carry with RES shred and healing support to stabilize team buffs.", "搭配生命波动主C与减抗、治疗辅助，稳定全队增益。"),
    plan(["フリーナ", "アルレッキーノ", "シロネン", "ベネット"], "炎主力の直接火力と全体バフを組み合わせる高火力軸。", "A high-damage core combining a Pyro carry's direct output with team buffs.", "结合火系主C直伤与全队增益的高伤核心队。"),
    plan(["フリーナ", "胡桃", "閑雲", "夜蘭"], "HP変動と蒸発を両立する代替案。元素爆発を回すための元素チャージ効率を優先する。", "A Vaporize alternative built around HP fluctuation; prioritize ER to maintain Bursts.", "兼顾生命波动与蒸发的替代队，优先元素充能以维持爆发。"),
  ]),
  "genshin:シロネン": manualOptions("genshin", "シロネン", "https://game8.co/games/Genshin-Impact/archives/301819", support, [
    plan(["シロネン", "ヌヴィレット", "フリーナ", "楓原万葉"], "耐性低下・回復・バフを水主力へ集中させる現行の高採用軸。", "A high-adoption current core focusing RES shred, healing, and buffs on a Hydro carry.", "将减抗、治疗与增益集中给水系主C的高使用核心队。"),
    plan(["シロネン", "アルレッキーノ", "夜蘭", "ベネット"], "蒸発補助と攻撃支援を組み合わせ、炎主力の安定した火力窓を作る。", "Combines Vaporize enabling and ATK support for reliable Pyro carry damage windows.", "组合蒸发辅助与攻击增益，为火系主C创造稳定输出窗口。"),
    plan(["シロネン", "ナヴィア", "フリーナ", "ベネット"], "結晶反応を利用する岩主力向けの実戦代替。", "A practical alternative for a Geo carry that leverages Crystallize.", "利用结晶反应的岩系主C实战替代队。"),
  ]),
  "genshin:楓原万葉": manualOptions("genshin", "楓原万葉", "https://game8.co/games/Genshin-Impact/archives/332826", support, [
    plan(["楓原万葉", "ヌヴィレット", "フリーナ", "シロネン"], "拡散による耐性低下と元素ダメージ支援をHP変動主力へ合わせる。", "Matches Swirl RES shred and elemental support to an HP-fluctuation carry.", "将扩散减抗与元素增益配合生命波动主C。"),
    plan(["楓原万葉", "アルレッキーノ", "シトラリ", "ベネット"], "炎耐性低下と溶解補助を組み、短時間火力を高める。", "Combines Pyro RES shred and Melt enabling for stronger short damage windows.", "结合火抗降低与融化辅助，提高短时间爆发。"),
    plan(["楓原万葉", "マーヴィカ", "シロネン", "ベネット"], "元素ダメージ支援を主力へ集約する代替案。", "An alternative that concentrates elemental damage support on the carry.", "将元素伤害增益集中给主C的替代队。"),
  ]),
  "genshin:ベネット": manualOptions("genshin", "ベネット", "https://game8.co/games/Genshin-Impact/archives/301819", support, [
    plan(["ベネット", "アルレッキーノ", "夜蘭", "シロネン"], "攻撃バフ・水付着・耐性低下で蒸発主力の実戦火力を伸ばす。", "ATK buffs, Hydro application, and RES shred raise a Vaporize carry's practical damage.", "攻击增益、挂水与减抗提高蒸发主C的实战伤害。"),
    plan(["ベネット", "マーヴィカ", "楓原万葉", "シロネン"], "炎主力の元素ダメージと攻撃力を同時に伸ばす軸。", "A Pyro core that raises both elemental damage and ATK.", "同时提高火系主C元素伤害与攻击的核心队。"),
    plan(["ベネット", "ナヴィア", "フリーナ", "シロネン"], "攻撃力を参照する岩主力の火力窓を補助する代替案。", "An alternative that supports an ATK-scaling Geo carry's damage window.", "辅助攻击力收益岩系主C输出窗口的替代队。"),
  ]),
  "genshin:アルレッキーノ": manualOptions("genshin", "アルレッキーノ", "https://game8.jp/genshin/605945", mainDps, [
    plan(["アルレッキーノ", "ベネット", "シロネン", "シトラリ"], "氷付着・耐性低下・攻撃支援を重ね、一撃の溶解を重視する現行主力案。", "A current premium Melt team stacking Cryo application, RES shred, and ATK support for larger hits.", "叠加挂冰、减抗与攻击增益、重视单次融化伤害的当前高配方案。", [change("elementalMastery", "元素熟知", "Elemental Mastery", "元素精通", "", 220, 160, 100, "溶解反応を主軸にするため、元素熟知を追加の比較対象として扱う。", "Melt is the core reaction, so include Elemental Mastery as an additional comparison stat.", "以融化反应为核心，因此将元素精通纳入额外比较属性。")]),
    plan(["アルレッキーノ", "ベネット", "夜蘭", "シロネン"], "水付着を安定させ、蒸発・攻撃支援・耐性低下を両立する案。", "A Vaporize option with stable Hydro application, ATK support, and RES shred.", "兼顾稳定挂水、蒸发、攻击增益与减抗的方案。", [change("elementalMastery", "元素熟知", "Elemental Mastery", "元素精通", "", 220, 160, 100, "蒸発反応を主軸にするため、元素熟知を追加の比較対象として扱う。", "Vaporize is the core reaction, so include Elemental Mastery as an additional comparison stat.", "以蒸发反应为核心，因此将元素精通纳入额外比较属性。")]),
    plan(["アルレッキーノ", "シュヴルーズ", "フィッシュル", "ベネット"], "炎・雷限定で耐性低下を活かす過負荷代替。", "An Overload alternative using a Pyro-Electro-only RES-shred core.", "利用火雷限定减抗核心的超载替代队。"),
  ]),
  "genshin:ヌヴィレット": manualOptions("genshin", "ヌヴィレット", "https://game8.jp/genshin/353144", mainDps, [
    plan(["ヌヴィレット", "コロンビーナ", "イネファ", "シロネン"], "月感電と中断対策を両立し、固有天賦の反応条件も満たす現行案。", "A current Lunar-Charged option that provides interruption resistance and fulfills reaction conditions for his passive.", "兼顾月感电与抗打断，并满足固有天赋反应条件的当前方案。"),
    plan(["ヌヴィレット", "フリーナ", "シロネン", "楓原万葉"], "水共鳴、HP変動、耐性低下を重ねる高相性の水主体案。", "A high-synergy Hydro core stacking Hydro Resonance, HP fluctuation, and RES shred.", "叠加水元素共鸣、生命波动与减抗的高协同水系核心队。"),
    plan(["ヌヴィレット", "マーヴィカ", "シロネン", "シトラリ"], "蒸発と複数反応を用いて、無凸でも固有天賦条件を満たしやすくする案。", "A Vaporize option using multiple reactions to more easily fulfill his passive at C0.", "利用蒸发与多种反应、让零命更容易满足固有天赋条件的方案。"),
  ]),
  "genshin:夜蘭": manualOptions("genshin", "夜蘭", "https://game8.jp/genshin/558856", support, [
    plan(["夜蘭", "胡桃", "行秋", "鍾離"], "水付着を厚くし、蒸発主力の通常攻撃連動と耐久を両立する定番軸。", "A classic core with dense Hydro application, Normal Attack synergy, and sustain for a Vaporize carry.", "兼顾高频挂水、普攻联动与生存的经典蒸发核心队。"),
    plan(["珊瑚宮心海", "夜蘭", "フリーナ", "楓原万葉"], "回復・水共鳴・全体バフを重ねる水主体の個別相性案。", "A Hydro-focused option that combines healing, Hydro Resonance, and team buffs.", "组合治疗、水元素共鸣与全队增益的水系高协同方案。"),
    plan(["夜蘭", "ナヒーダ", "ニィロウ", "白朮"], "豊穣開花の水付着と回復を支える開花案。", "A Bloom option that supplies Hydro application and sustain for Nilou's Bountiful Cores.", "为妮露绽放提供挂水与生存支持的绽放方案。"),
  ]),

  "zzz:星見雅": PARTY_CATALOG["zzz:星見雅"],
  "zzz:浮波柚葉": manualOptions("zzz", "浮波柚葉", "https://game8.co/games/Zenless-Zone-Zero/archives/458656", support, [
    plan(["浮波柚葉", "星見雅", "月城柳"], "異常・混沌の発生を支援し、星見雅の落霜蓄積と主力火力を補助する。", "Supports Anomaly and Disorder triggers to help Miyabi's Fallen Frost stacks and carry damage.", "辅助异常与紊乱触发，帮助星见雅积累落霜并提高主C伤害。"),
    plan(["浮波柚葉", "星見雅", "蒼角"], "月城柳不在時に氷支援へ置き換える実用案。", "A practical Ice-support alternative when Yanagi is unavailable.", "月城柳不在时替换为冰系辅助的实用方案。"),
    plan(["浮波柚葉", "アリス", "ビビアン"], "異常2枠を活かして混沌と控え火力を両立する代替。", "An alternative that uses two Anomaly slots for Disorder and off-field damage.", "利用双异常位兼顾紊乱与后台输出的替代队。"),
  ]),
  "zzz:月城柳": manualOptions("zzz", "月城柳", "https://game8.co/games/Zenless-Zone-Zero/archives/474448", anomaly, [
    plan(["月城柳", "星見雅", "浮波柚葉"], "星見雅の異常蓄積を助けつつ、月城柳側の異常・混沌ダメージも活かす完成形。", "A premium Disorder core that helps Miyabi's buildup while enabling Yanagi's own Anomaly damage.", "协助星见雅积累异常，同时发挥月城柳自身异常伤害的完成队。"),
    plan(["月城柳", "ビビアン", "アストラ"], "柳を表に出し、異常付与とクイック支援で混沌を回す案。", "An on-field Yanagi option that rotates Disorder through Anomaly application and Quick Assist support.", "以柳站场、通过异常附着与快速支援循环紊乱的方案。"),
    plan(["月城柳", "セス", "リナ"], "電気編成で防護と貫通率支援を組み合わせる所持対応案。", "A roster-friendly Electric option combining Defense and PEN support.", "结合防护与穿透辅助的电气队持有适配方案。"),
  ]),
  "zzz:アストラ": manualOptions("zzz", "アストラ", "https://game8.co/games/Zenless-Zone-Zero/archives/490842", support, [
    plan(["アストラ", "イヴリン", "ライト"], "ライトのブレイクと炎支援、アストラの火力バフをイヴリンの短時間火力へ集中する。", "Lighter's stun and Fire support plus Astra's buffs concentrate Evelyn's short burst window.", "莱特的失衡与火系辅助、耀嘉音的增益集中强化伊芙琳的短爆发窗口。"),
    plan(["アストラ", "星見雅", "月城柳"], "全体ダメージ支援と異常連鎖を組み合わせる異常編成。", "An Anomaly composition combining team damage support with Disorder chains.", "结合全队伤害辅助与紊乱连锁的异常队。"),
    plan(["アストラ", "0号・アンビー", "トリガー"], "控えブレイクと電気主力の切替をクイック支援で支える案。", "An Electric option that supports off-field stun and carry swaps through Quick Assist.", "通过快速支援辅助后台失衡与电气主C切换的方案。"),
  ]),
  "zzz:ライト": manualOptions("zzz", "ライト", "https://game8.co/games/Zenless-Zone-Zero/archives/474509", t("撃破", "Stun", "击破"), [
    plan(["ライト", "イヴリン", "アストラ"], "炎主力の火力窓をブレイクと支援で伸ばす、個別ガイドの高相性軸。", "The individual guide's high-synergy core for extending a Fire carry's damage window with stun and buffs.", "个别指南推荐的高协同核心，以失衡与增益延长火系主C输出窗口。"),
    plan(["ライト", "エレン", "蒼角"], "氷耐性低下と氷支援を重ね、エレンのブレイク火力を伸ばす案。", "An Ice option stacking Ice RES shred and Ice support for Ellen's stun-window damage.", "叠加冰抗降低与冰系辅助、提升艾莲失衡窗口伤害的方案。"),
    plan(["ライト", "星見雅", "ルーシー"], "炎・氷系の異常ダメージと攻撃支援を両立する代替案。", "An alternative combining Fire/Ice-oriented Anomaly damage with ATK support.", "兼顾炎冰系异常伤害与攻击增益的替代方案。"),
  ]),
  "zzz:レミエール": manualOptions("zzz", "レミエール", "https://game8.co/games/Zenless-Zone-Zero/archives/588854", anomaly, [
    plan(["レミエール", "ヴェリナ", "プロメイア"], "異常3名で昇華・耀変・全体攻撃力バフを最大化する現行主力案。", "A current premium three-Anomaly core maximizing Refringe, Luminize, and team ATK buffs.", "以三异常最大化昇华、耀变与全队攻击增益的当前高配方案。"),
    plan(["レミエール", "ヴェリナ", "ジェーン・ドゥ"], "物理異常の高速蓄積で昇華を回す案。", "An option that uses rapid Physical Anomaly buildup to cycle Refringe.", "利用高速物理异常积累循环昇华的方案。"),
    plan(["レミエール", "パイパー・ウィール", "グレース・ハワード"], "異常3名を維持する所持対応の代替案。", "A roster-friendly alternative that retains the three-Anomaly condition.", "保持三异常条件的持有适配替代方案。"),
  ]),

  "hsr:サンデー": batch3Options("hsr", "サンデー", "https://game8.co/games/Honkai-Star-Rail/archives/437272", support, [
    plan(["サンデー", "アグライア", "ロビン", "フォフォ"], "アグライアと召喚物の行動をサンデーで補助し、ロビンの全体火力支援と耐久を重ねる。", "Sunday advances Aglaea and her summon while Robin supplies team damage and Huohuo sustains the core.", "星期日拉条阿格莱雅及其召唤物，知更鸟提供全队增益，藿藿维持生存。"),
    plan(["サンデー", "飲月", "花火", "フォフォ"], "単体ハイパーキャリーで行動順操作とSP供給を組み、主力より1低い速度設計を活かす。", "A hypercarry core that combines action control and Skill Point supply while using the carry-minus-one SPD setup.", "单核队结合行动控制与战技点供给，利用比主C低1点速度的配速。"),
    plan(["サンデー", "姫子", "ジェイド", "霊砂"], "姫子・ジェイドの2アタッカー連携に行動支援と撃破寄り耐久を添える。", "Pairs Sunday’s action support with the Himeko–Jade dual-DPS core and break-oriented sustain.", "以星期日的行动辅助搭配姬子、翡翠双输出与击破向生存位。"),
  ]),
  "hsr:ブートヒル": batch3Options("hsr", "ブートヒル", "https://game8.co/games/Honkai-Star-Rail/archives/Boothill-Best-Builds", mainDps, [
    plan(["ブートヒル", "サンデー", "ルアン・メェイ", "霊砂"], "行動補助・弱点撃破効率・撃破回復を重ね、決闘と物理撃破を安定させる。", "Action support, Break Efficiency, and break sustain stabilize Boothill’s duels and Physical Breaks.", "叠加行动辅助、击破效率与击破生存，稳定波提欧的决斗与物理击破。"),
    plan(["ブートヒル", "帰忘の流離人", "ダリア", "霊砂"], "超撃破と撃破支援を組み、弱点撃破後の追撃価値を高める。", "Combines Super Break and break support to raise payoff after Weakness Breaks.", "结合超击破与击破辅助，提高弱点击破后的收益。"),
    plan(["ブートヒル", "開拓者（調和）", "アスター", "ナターシャ"], "調和開拓者の超撃破と速度支援を使う、所持対応の撃破編成。", "A roster-friendly Break team using Harmony Trailblazer’s Super Break and Asta’s SPD support.", "使用同谐开拓者超击破与艾丝妲速度辅助的持有适配击破队。"),
  ]),
  "hsr:黄泉": batch3Options("hsr", "黄泉", "https://game8.co/games/Honkai-Star-Rail/archives/436053", mainDps, [
    plan(["黄泉", "椒丘", "ペラ", "フォフォ"], "E0/E1では虚無2名を配置し、デバフ頻度で必殺技の残夢蓄積を支える。", "For E0/E1, two Nihility allies supply frequent debuffs and support Slashed Dream stacks.", "E0/E1使用两名虚无角色，以高频减益辅助残梦积累。"),
    plan(["黄泉", "モルトナックス・ブレード", "サフェル", "アベンチュリン"], "虚無2名の追加能力条件を満たしつつ、デバフと耐久を両立する代替案。", "An alternative that preserves the two-Nihility passive requirement while balancing debuffs and sustain.", "在满足双虚无额外能力条件的同时兼顾减益与生存的替代方案。"),
    plan(["黄泉", "椒丘", "花火", "アベンチュリン"], "E2限定で虚無1名と調和1名を採用し、行動加速を必殺技回転へ変換する。", "E2-only: uses one Nihility and one Harmony unit, converting action advance into Ultimate cycling.", "仅限E2：采用一名虚无与一名同谐，将拉条转化为终结技循环。"),
  ]),
  "hsr:霊砂": batch3Options("hsr", "霊砂", "https://game8.co/games/Honkai-Star-Rail/archives/462279", t("耐久", "Sustain", "生存位"), [
    plan(["霊砂", "ホタル", "帰忘の流離人", "ダリア"], "超撃破の撃破機会と霊砂の回復・追加攻撃を重ねる完成形。", "A premium Super Break core that layers break opportunities with Lingsha’s healing and follow-ups.", "超击破高配队叠加击破机会与灵砂的治疗、追加攻击。"),
    plan(["霊砂", "マダム・ヘルタ", "アナイクス", "トリビー"], "知恵の範囲火力へ回復・追加攻撃を添える非撃破の実戦案。", "A non-Break practical team that adds healing and follow-ups to an Erudition AoE core.", "为智识范围输出核心补充治疗与追加攻击的非击破实战队。"),
    plan(["霊砂", "三月なのか（巡狩）", "開拓者（調和）", "ルアン・メェイ"], "撃破支援と超撃破を組み、霊砂自身の撃破特効運用を活かす案。", "Combines Break support and Super Break to use Lingsha’s own Break Effect build.", "结合击破辅助与超击破，发挥灵砂自身击破特攻配装。"),
  ]),
  "genshin:雷電将軍": batch3Options("genshin", "雷電将軍", "https://game8.co/games/Genshin-Impact/archives/337161", mainDps, [
    plan(["雷電将軍", "行秋", "香菱", "ベネット"], "高コスト元素爆発の循環を雷電の回復で支える雷電ナショナル。", "Raiden National uses her Energy restoration to sustain the team’s high-cost Bursts.", "雷电国家队利用雷电的回能维持队伍高能量终结技循环。"),
    plan(["雷電将軍", "楓原万葉", "九条裟羅", "ベネット"], "雷元素ダメージ・攻撃力・会心支援を重ねる高投資ハイパーキャリー。", "A high-investment hypercarry stacking Electro DMG, ATK, and CRIT support.", "叠加雷伤、攻击与暴击辅助的高投入单核队。"),
    plan(["雷電将軍", "ナヒーダ", "夜蘭", "白朮"], "超開花のトリガーとして運用し、元素熟知1,000前後の別ビルドを選ぶ。", "Uses Raiden as a Hyperbloom trigger with the separate ~1,000 Elemental Mastery build.", "作为超绽放触发器使用，选择约1000元素精通的独立配装。", [change("elementalMastery", "元素熟知", "Elemental Mastery", "元素精通", "", 1100, 1000, 800, "超開花型は元素爆発DPSの会心・攻撃力・元素チャージではなく元素熟知を比較する。", "Hyperbloom compares Elemental Mastery rather than the Burst DPS CRIT, ATK, and ER package.", "超绽放比较元素精通，而非元素爆发输出的暴击、攻击与充能组合。")]),
  ]),
  "genshin:ナヒーダ": batch3Options("genshin", "ナヒーダ", "https://game8.co/games/Genshin-Impact/archives/Nahida-Best-Builds", support, [
    plan(["ナヒーダ", "ラウマ", "ニィロウ", "珊瑚宮心海"], "深林4セットの草付着と元素熟知支援で、豊穣開花の反応密度を支える。", "Deepwood Dendro application and Elemental Mastery support sustain dense Bountiful Core reactions.", "以深林套草附着和元素精通辅助维持丰穰之核的高反应密度。"),
    plan(["ナヒーダ", "アルハイゼン", "夜蘭", "久岐忍"], "高頻度の草・水・雷付着で超開花を回し、控えからも草元素を維持する。", "Frequent Dendro, Hydro, and Electro application sustains Hyperbloom while Nahida applies Dendro off-field.", "高频草、水、雷附着维持超绽放，纳西妲在后台持续挂草。"),
    plan(["ナヒーダ", "アルハイゼン", "八重神子", "鍾離"], "草激化・激化の火力を、草付着・雷副火力・中断耐性で安定させる。", "Stabilizes Spread/Aggravate with Dendro application, Electro sub-DPS, and interruption resistance.", "以草附着、雷系副输出与抗打断稳定蔓激化和超激化。"),
  ]),
  "genshin:鍾離": batch3Options("genshin", "鍾離", "https://game8.co/games/Genshin-Impact/archives/305858", t("耐久", "Sustain", "生存位"), [
    plan(["鍾離", "ヌヴィレット", "フリーナ", "シャルロット"], "護盾・耐性低下で重撃主力の中断を抑え、フリーナのHP変動編成を安定させる。", "Shielding and RES shred protect a Charged Attack carry while stabilizing Furina’s HP-fluctuation team.", "护盾和减抗保护重击主C，并稳定芙宁娜生命波动队。"),
    plan(["鍾離", "荒瀧一斗", "アルベド", "ゴロー"], "岩共鳴と岩粒子を活かし、耐久と岩主力の継続火力を両立する。", "Uses Geo Resonance and Geo particles to combine sustain with a Geo carry’s sustained output.", "利用岩元素共鸣与岩元素微粒，兼顾生存和岩系主C持续输出。"),
    plan(["鍾離", "胡桃", "行秋", "夜蘭"], "護盾で中断を防ぎ、水付着を厚くして蒸発主力の攻撃時間を守る。", "The shield prevents interruption while double Hydro supports Vaporize carry uptime.", "护盾防止打断，双水保证蒸发主C的输出时间。"),
  ]),
  "zzz:ビビアン": batch3Options("zzz", "ビビアン", "https://game8.jp/zenless/673769", anomaly, [
    plan(["ビビアン", "月城柳", "浮波柚葉"], "エーテル・電気の異常と混沌を重ね、柚葉の異常支援で侵蝕を活かす。", "Layers Ether and Electric Anomaly/Disorder while Yuzuha supports Anomaly buildup and Corruption.", "叠加以太和电气异常、紊乱，并以柚叶辅助异常积累与侵蚀。"),
    plan(["ビビアン", "アリス", "浮波柚葉"], "異常2枠と支援で混沌の回数を確保する代替編成。", "An alternative with two Anomaly agents and support to sustain Disorder frequency.", "以双异常角色和辅助维持紊乱频率的替代队。"),
    plan(["ビビアン", "パイパー", "ルーシー"], "物理異常と攻撃支援を組み、限定支援不在時にも混沌を回す所持対応案。", "Pairs Physical Anomaly with ATK support for a roster-friendly Disorder option.", "组合物理异常与攻击辅助，适合缺少限定辅助时的持有适配紊乱队。"),
  ]),
  "zzz:ジェーン": batch3Options("zzz", "ジェーン", "https://game8.jp/zenless/625565", anomaly, [
    plan(["ジェーン", "セス", "浮波柚葉"], "防護と異常支援で強撃の蓄積・会心・生存を支える物理異常軸。", "Defense and Anomaly support stabilize Assault buildup, crit behavior, and sustain for the Physical Anomaly core.", "防护与异常辅助稳定物理异常核心的强击积累、会心与生存。"),
    plan(["ジェーン", "レミエール", "ヴェリナ"], "異常3人編成の相乗を活かし、複数の状態異常で混沌を回す案。", "Uses three-Anomaly synergy and multiple statuses to cycle Disorder.", "利用三异常协同与多种异常状态循环紊乱。"),
    plan(["ジェーン", "セス", "ルーシー"], "防護と攻撃支援を使う所持対応の物理異常編成。", "A roster-friendly Physical Anomaly team with Defense and ATK support.", "结合防护与攻击辅助的持有适配物理异常队。"),
  ]),
  "zzz:エレン": batch3Options("zzz", "エレン", "https://game8.jp/zenless/607800", mainDps, [
    plan(["エレン", "ダイアリン", "千夏"], "ブレイクと氷支援を重ね、エレンの急凍を火力窓へ変える現行高難度案。", "A current endgame core that layers stun and Ice support to convert Flash Freeze into damage windows.", "当前高难度核心队叠加失衡和冰系辅助，将急冻转化为输出窗口。"),
    plan(["エレン", "シーザー", "ライト"], "耐久支援と氷耐性低下・ブレイク延長を組み、短時間の直撃火力を伸ばす。", "Combines defensive support with Ice RES shred and extended stun windows for burst damage.", "结合防护辅助、冰抗降低与延长失衡窗口，提高短爆发直伤。"),
    plan(["エレン", "蒼角", "ルーシー"], "氷・攻撃力支援を使う入手しやすい代替案。", "An accessible alternative using Ice and ATK support.", "使用冰系与攻击辅助的易获取替代方案。"),
  ]),
  "hsr:アベンチュリン": batch4Options("hsr", "アベンチュリン", "https://game8.co/games/Honkai-Star-Rail/archives/429966", t("耐久", "Sustain", "生存位"), [
    plan(["アベンチュリン", "飛霄", "サフェル", "ロビン"], "追加攻撃の頻度を耐久・会心支援へつなげ、飛霄の蓄積と決定打を安定させる。", "Connects follow-up frequency to sustain and CRIT support, stabilizing Feixiao’s stack building and finisher.", "将追击频率转化为生存与暴击辅助，稳定飞霄的叠层与终结爆发。"),
    plan(["アベンチュリン", "Dr.レイシオ", "トパーズ&カブ", "ロビン"], "デバフと追加攻撃を連鎖させ、単体主力の追撃回数を伸ばす。", "Chains debuffs and follow-ups to increase a single-target carry’s follow-up frequency.", "串联减益与追击，提高单体主C的追击频率。"),
    plan(["アベンチュリン", "黄泉", "椒丘", "サフェル"], "耐久枠のデバフも残夢蓄積に活かす虚無軸。", "A Nihility core that also turns the sustain slot’s debuffs into Slashed Dream stacks.", "将生存位减益也用于残梦积累的虚无核心队。"),
  ]),
  "hsr:トパーズ&カブ": batch4Options("hsr", "トパーズ&カブ", "https://game8.co/games/Honkai-Star-Rail/archives/421778", mainDps, [
    plan(["トパーズ&カブ", "飛霄", "ロビン", "アベンチュリン"], "頻繁な追加攻撃を相互に増やし、飛霄の飛黄とカブの行動を循環させる。", "Mutual frequent follow-ups cycle Feixiao’s Flying Aureus and Numby’s turns.", "以高频互相追击循环飞霄的飞黄与账账行动。"),
    plan(["トパーズ&カブ", "Dr.レイシオ", "銀狼", "羅刹"], "単体デバフと追加攻撃を重ね、レイシオとカブの追撃条件を満たす。", "Stacks single-target debuffs and follow-ups to meet Dr. Ratio and Numby follow-up conditions.", "叠加单体减益与追击，满足真理医生和账账的追击条件。"),
    plan(["トパーズ&カブ", "姫子", "銀狼", "符玄"], "炎・量子の火力軸に単体追撃を加える所持対応案。", "A roster-friendly Fire/Quantum damage core with a single-target follow-up slot.", "为火量输出核心加入单体追击位的持有适配方案。"),
  ]),
  "hsr:花火": batch4Options("hsr", "花火", "https://game8.co/games/Honkai-Star-Rail/archives/Sparkle-Best-Builds", support, [
    plan(["花火", "丹恒・飲月", "停雲", "羅刹"], "SP供給と行動順操作を重ね、強化通常攻撃を継続するハイパーキャリー。", "Stacks Skill Point supply and action control to sustain enhanced Basic Attacks in hypercarry play.", "叠加战技点供给与行动控制，维持强化普攻的单核队。"),
    plan(["花火", "アーチャー", "サフェル", "ギャラガー"], "会心支援と行動順操作を単体主力へ集約する代替案。", "An alternative concentrating CRIT support and action control on a single-target carry.", "将暴击辅助与行动控制集中给单体主C的替代方案。"),
    plan(["花火", "黄泉", "椒丘", "アベンチュリン"], "黄泉E2限定で虚無1名と調和1名を採用し、行動加速を必殺技回転へ変える。", "E2 Acheron only: uses one Nihility and one Harmony unit to turn action advance into Ultimate cycling.", "仅限E2黄泉：采用一名虚无与一名同谐，将拉条转化为终结技循环。"),
  ]),
  "hsr:丹恒・飲月": batch4Options("hsr", "丹恒・飲月", "https://game8.co/games/Honkai-Star-Rail/archives/417235", mainDps, [
    plan(["丹恒・飲月", "花火", "停雲", "アベンチュリン"], "SP供給・行動順操作・耐久を組み、強化通常攻撃の3SP消費を安定させる。", "Combines Skill Point supply, action control, and sustain to stabilize 3-SP enhanced Basic Attacks.", "组合战技点供给、行动控制与生存，稳定三战技点强化普攻。"),
    plan(["丹恒・飲月", "花火", "銀狼", "羅刹"], "虚数寄りのデバフとSP供給を組み合わせる単体戦向け案。", "A single-target option combining Imaginary-oriented debuffs and Skill Point supply.", "结合虚数向减益与战技点供给的单体战方案。"),
    plan(["丹恒・飲月", "ロビン", "サンデー", "アベンチュリン"], "SP収支を確認しつつ、行動支援を強化通常攻撃の回数へ変換する編成。", "A setup that monitors Skill Point economy while converting action support into more enhanced Basic Attacks.", "在关注战技点收支的同时，将行动辅助转化为更多强化普攻。"),
  ]),
  "genshin:アルハイゼン": batch4Options("genshin", "アルハイゼン", "https://game8.co/games/Genshin-Impact/archives/383712", mainDps, [
    plan(["アルハイゼン", "ナヒーダ", "夜蘭", "久岐忍"], "草・水・雷の高頻度付着で超開花を回し、鏡の投影攻撃を反応へつなげる。", "Frequent Dendro, Hydro, and Electro application sustains Hyperbloom and converts mirror projections into reaction damage.", "高频草、水、雷附着维持超绽放，将琢光镜投影转化为反应伤害。"),
    plan(["アルハイゼン", "ナヒーダ", "八重神子", "鍾離"], "草激化・超激化の火力を草付着・雷副火力・耐性低下で安定させる。", "Stabilizes Spread/Aggravate with Dendro application, Electro sub-DPS, and RES shred.", "以草附着、雷系副输出与减抗稳定蔓激化和超激化。"),
    plan(["アルハイゼン", "フィッシュル", "フリーナ", "白朮"], "フリーナのHP変動と草激化を組み合わせる所持対応の火力案。", "A roster option combining Furina’s HP fluctuation with Spread/Aggravate.", "组合芙宁娜生命波动与激化的持有适配输出方案。"),
  ]),
  "genshin:胡桃": batch4Options("genshin", "胡桃", "https://game8.co/games/Genshin-Impact/archives/314347", mainDps, [
    plan(["胡桃", "フリーナ", "夜蘭", "閑雲"], "HP変動・水付着・落下蒸発を重ね、重撃以外の高火力窓も作る。", "Stacks HP fluctuation, Hydro application, and plunging Vaporize for additional high-damage windows.", "叠加生命波动、挂水与下落蒸发，创造重击以外的高伤窗口。"),
    plan(["胡桃", "行秋", "夜蘭", "鍾離"], "二重水の安定した水付着と護盾で、蒸発重撃の中断を抑える定番軸。", "A classic core using double Hydro application and a shield to protect Vaporize Charged Attacks.", "以双水稳定挂水和护盾保护蒸发重击的经典核心队。"),
    plan(["胡桃", "行秋", "ロサリア", "シトラリ"], "蒸発と溶解の反応機会を組み、会心と元素熟知を活かす代替案。", "An alternative combining Vaporize and Melt opportunities to use CRIT and Elemental Mastery.", "结合蒸发与融化机会，发挥暴击和元素精通的替代方案。"),
  ]),
  "genshin:久岐忍": batch4Options("genshin", "久岐忍", "https://game8.co/games/Genshin-Impact/archives/346199", support, [
    plan(["久岐忍", "アルハイゼン", "夜蘭", "ナヒーダ"], "雷草の輪で超開花を起こし、回復と持続雷付着を同時に担う。", "The Sanctifying Ring triggers Hyperbloom while providing healing and sustained Electro application.", "草轮同时触发超绽放、治疗与持续雷附着。"),
    plan(["久岐忍", "ナヒーダ", "行秋", "夜蘭"], "二重水の種生成を超開花へ変換する実戦的な反応軸。", "A practical reaction core that converts double-Hydro seed generation into Hyperbloom.", "将双水产种转化为超绽放的实战反应核心。"),
    plan(["久岐忍", "アルハイゼン", "八重神子", "ナヒーダ"], "回復を確保しながら草激化・超激化を回す支援型案。", "A support-oriented option that sustains Spread/Aggravate while retaining healing.", "在保留治疗的同时循环蔓激化和超激化的支援型方案。"),
  ]),
  "zzz:セス": batch4Options("zzz", "セス", "https://game8.co/games/Zenless-Zone-Zero/archives/460687", t("防護", "Defense", "防护"), [
    plan(["セス", "ジェーン", "ビビアン"], "主力異常の直後に入り、盾・異常掌握付与・クイック支援で強撃と混沌をつなぐ。", "Placed after the primary Anomaly agent, Seth links Assault and Disorder through shields, Anomaly Proficiency, and Quick Assist.", "置于主异常角色之后，以护盾、异常精通与快速支援衔接强击和紊乱。"),
    plan(["セス", "ジェーン", "月城柳"], "物理・電気の状態異常を重ね、盾支援で主力の行動を守る。", "Layers Physical and Electric Anomaly while shield support protects the carry’s actions.", "叠加物理与电气异常，并以护盾辅助保护主C行动。"),
    plan(["セス", "グレース", "リナ"], "電気異常の蓄積と貫通支援を組み合わせる電気軸。", "An Electric core combining Anomaly buildup with PEN support.", "结合异常积累与穿透辅助的电气核心队。"),
  ]),
  "zzz:パイパー": batch4Options("zzz", "パイパー", "https://game8.co/games/Zenless-Zone-Zero/archives/459818", anomaly, [
    plan(["パイパー", "ビビアン", "浮波柚葉"], "物理・エーテル異常を重ね、柚葉の支援で混沌と控え火力を回す。", "Layers Physical and Ether Anomaly while Yuzuha support sustains Disorder and off-field damage.", "叠加物理和以太异常，以柚叶辅助循环紊乱与后台伤害。"),
    plan(["パイパー", "バーニス", "アストラ"], "炎・物理の異常を交互に起こし、全体支援で混沌の価値を高める。", "Alternates Fire and Physical Anomaly while team buffs raise Disorder payoff.", "交替触发火与物理异常，以全队增益提高紊乱收益。"),
    plan(["パイパー", "アンビー", "ニコ"], "状態異常・ブレイク・集敵を使う入手しやすい物理軸。", "An accessible Physical option using Anomaly, stun, and grouping.", "使用异常、失衡与聚怪的易获取物理队。"),
  ]),
  "zzz:蒼角": batch4Options("zzz", "蒼角", "https://game8.co/games/Zenless-Zone-Zero/archives/436880", support, [
    plan(["蒼角", "星見雅", "月城柳"], "旗揚げの攻撃力・氷ダメージ支援と異常連鎖で、霜灼・烈霜の回転を支える。", "Fly the Flag’s ATK/Ice support and Anomaly chains sustain Frostburn and Fallen Frost rotations.", "以旗扬的攻击力、冰伤辅助和异常连锁支撑霜灼与落霜循环。"),
    plan(["蒼角", "エレン", "ライト"], "氷ダメージ支援と氷耐性低下・ブレイク延長を重ね、エレンの直撃火力を伸ばす。", "Stacks Ice support with Ice RES shred and longer stun windows for Ellen’s direct damage.", "叠加冰系辅助、冰抗降低与延长失衡窗口，提高艾莲直伤。"),
    plan(["蒼角", "星見雅", "ライカン"], "氷軸の耐性低下・ブレイクと旗揚げを組む実戦代替案。", "A practical Ice alternative combining RES shred, stun, and Fly the Flag.", "结合减抗、失衡与旗扬的实战冰系替代队。"),
  ]),
  "hsr:Dr.レイシオ": batch5Options("hsr", "Dr.レイシオ", "https://game8.co/games/Honkai-Star-Rail/archives/431768", mainDps, [
    plan(["Dr.レイシオ", "サフェル", "ロビン", "アベンチュリン"], "デバフと追加攻撃を重ね、敵デバフ数を満たしてレイシオの追撃を安定させる。", "Stacks debuffs and follow-ups to stabilize Ratio's Talent follow-up conditions.", "叠加减益与追击，稳定满足真理医生天赋追击条件。"),
    plan(["Dr.レイシオ", "トパーズ&カブ", "銀狼", "羅刹"], "単体デバフと追加攻撃を組み、カブとレイシオ双方の追撃条件を満たす。", "Combines single-target debuffs and follow-ups for both Numby and Ratio.", "组合单体减益与追击，满足账账和真理医生的追击条件。"),
    plan(["Dr.レイシオ", "三月なのか（巡狩）", "アスター", "ナターシャ"], "デバフ供給を補助しつつ行動回数を確保する所持対応案。", "A roster-friendly option that supports debuffs and action frequency.", "兼顾减益供给与行动次数的持有适配方案。"),
  ]),
  "hsr:カフカ": batch5Options("hsr", "カフカ", "https://game8.co/games/Honkai-Star-Rail/archives/405755", anomaly, [
    plan(["カフカ", "ヒアンシー", "ルアン・メェイ", "フォフォ"], "DoTの付与と起爆、全体支援、EP回復を重ねて持続ダメージ循環を整える。", "Combines DoT application and detonation with team support and Energy recovery.", "结合持续伤害施加、引爆、全队辅助与能量回复，稳定循环。"),
    plan(["カフカ", "ブラックスワン", "椒丘", "ギャラガー"], "アルカナ・燃焼・感電の起爆を重ねるDoT／デバフ案。", "A DoT and debuff option layering Arcana, Burn, and Shock detonation.", "叠加奥迹、灼烧与触电引爆的持续伤害减益方案。"),
    plan(["カフカ", "サンポ", "アスター", "ナターシャ"], "入手しやすいDoT付与と速度支援で起爆頻度を確保する。", "An accessible DoT core with SPD support for frequent detonation.", "以易获取的持续伤害与速度辅助保证引爆频率。"),
  ]),
  "hsr:ブラックスワン": batch5Options("hsr", "ブラックスワン", "https://game8.co/games/Honkai-Star-Rail/archives/Black-Swan-Best-Builds", anomaly, [
    plan(["ブラックスワン", "カフカ", "ルアン・メェイ", "フォフォ"], "アルカナを先行付与してカフカの起爆へつなげ、DoT支援とEP回復を重ねる。", "Applies Arcana before Kafka detonates it while adding DoT support and Energy recovery.", "先施加奥迹再由卡芙卡引爆，并叠加持续伤害辅助与能量回复。"),
    plan(["ブラックスワン", "カフカ", "椒丘", "ギャラガー"], "複数デバフとDoTを重ね、単体・範囲の継続ダメージを同時に支える。", "Layers multiple debuffs and DoTs for single-target and AoE damage over time.", "叠加多种减益与持续伤害，同时支撑单体和群体输出。"),
    plan(["ブラックスワン", "セーバル", "アスター", "ナターシャ"], "雷DoTと速度支援を使う入手しやすい代替案。", "An accessible alternative using Lightning DoT and SPD support.", "利用雷属性持续伤害与速度辅助的易获取替代队。"),
  ]),
  "hsr:鏡流": batch5Options("hsr", "鏡流", "https://game8.co/games/Honkai-Star-Rail/archives/411783", mainDps, [
    plan(["鏡流", "サンデー", "トリビー", "ヒアンシー"], "行動順支援とHP変動支援で特殊状態とHP参照火力を維持する。", "Action support and HP fluctuation support maintain her special state and HP-scaling damage.", "以行动辅助与生命波动辅助维持特殊状态和生命倍率输出。"),
    plan(["鏡流", "刃", "トリビー", "ヒアンシー"], "HP消費を共有するダブルDPSで、味方HP変動の価値を高める。", "A double-DPS option that shares HP consumption to maximize HP fluctuation value.", "共享生命消耗的双C方案，提高队伍生命波动收益。"),
    plan(["鏡流", "アスター", "開拓者（記憶）", "リンクス"], "行動補助・HP管理・回復を組み合わせる所持対応案。", "A roster-friendly option combining action aid, HP management, and healing.", "结合行动辅助、生命管理与治疗的持有适配方案。"),
  ]),
  "genshin:行秋": batch5Options("genshin", "行秋", "https://game8.co/games/Genshin-Impact/archives/297531", support, [
    plan(["行秋", "胡桃", "夜蘭", "鍾離"], "二重水の水付着と護盾で蒸発重撃の中断を抑え、元素爆発を安定させる。", "Double Hydro application and a shield stabilize Vaporize Charged Attacks and Bursts.", "双水挂水与护盾稳定蒸发重击和元素爆发。"),
    plan(["行秋", "アルハイゼン", "ナヒーダ", "久岐忍"], "水・草・雷の高頻度付着で超開花を回し、水付着と軽減を担う。", "Frequent Hydro, Dendro, and Electro application sustains Hyperbloom while Xingqiu supplies mitigation.", "高频水草雷附着维持超绽放，并由行秋提供挂水与减伤。"),
    plan(["行秋", "雷電将軍", "香菱", "ベネット"], "元素爆発の相互回復と水付着で雷電ナショナルの蒸発循環を作る。", "Mutual Burst recovery and Hydro application support Raiden National rotations.", "以元素爆发互充和水附着支持雷神国家队循环。"),
  ]),
  "genshin:香菱": batch5Options("genshin", "香菱", "https://game8.co/games/Genshin-Impact/archives/297530", anomaly, [
    plan(["香菱", "行秋", "雷電将軍", "ベネット"], "水付着・EP回復・攻撃支援で旋火輪の蒸発と循環を安定させる。", "Hydro application, Energy recovery, and ATK support stabilize Pyronado Vaporize rotations.", "挂水、能量回复与攻击辅助稳定旋火轮蒸发循环。"),
    plan(["香菱", "タルタリヤ", "楓原万葉", "ベネット"], "高頻度水付着と炎耐性低下で国際編成の範囲蒸発を伸ばす。", "High-frequency Hydro and Pyro RES shred amplify International-team AoE Vaporize.", "高频挂水与火抗降低强化国际队的范围蒸发。"),
    plan(["香菱", "クロリンデ", "フィッシュル", "シュヴルーズ"], "炎・雷限定の過負荷軸で控え炎と雷副火力を重ねる。", "A Pyro-Electro Overload core layering off-field Pyro and Electro damage.", "火雷限定超载核心，叠加后台火与雷伤害。"),
  ]),
  "genshin:フィッシュル": batch5Options("genshin", "フィッシュル", "https://game8.co/games/Genshin-Impact/archives/297524", anomaly, [
    plan(["フィッシュル", "クロリンデ", "ナヒーダ", "楓原万葉"], "オズの雷付着と草激化を重ね、主力の反応火力と控えダメージを補助する。", "Oz's Electro application supports Aggravate, reaction damage, and off-field output.", "奥兹的雷附着支持超激化、反应伤害与后台输出。"),
    plan(["フィッシュル", "行秋", "北斗", "スクロース"], "感電と集敵を重ねる入手しやすい感電編成。", "An accessible Electro-Charged option combining reaction damage and grouping.", "叠加感电与聚怪的易获取感电队。"),
    plan(["フィッシュル", "雷電将軍", "行秋", "楓原万葉"], "2雷の粒子と水付着・耐性低下で元素爆発とオズを維持する。", "Double Electro particles, Hydro, and RES shred maintain Burst and Oz uptime.", "双雷粒子、挂水与减抗维持元素爆发和奥兹覆盖。"),
  ]),
  "zzz:グレース": batch5Options("zzz", "グレース", "https://game8.co/games/Zenless-Zone-Zero/archives/436878", anomaly, [
    plan(["グレース", "星見雅", "浮波柚葉"], "電気・氷の異常と支援を重ね、感電・混沌の発生を安定させる。", "Layers Electric and Ice Anomaly with support to stabilize Shock and Disorder.", "叠加电、冰异常与辅助，稳定触电和紊乱。"),
    plan(["グレース", "浅羽悠真", "リナ"], "感電の蓄積と電気主力・貫通支援を組み合わせる電気軸。", "An Electric core combining Shock buildup, an Electric carry, and PEN support.", "结合触电积蓄、电系主C与穿透辅助的电气核心队。"),
    plan(["グレース", "アンビー", "蒼角"], "ブレイク・氷支援を併用する入手しやすい代替案。", "An accessible alternative using stun and Ice support.", "使用失衡与冰系辅助的易获取替代队。"),
  ]),
  "zzz:バーニス": batch5Options("zzz", "バーニス", "https://game8.co/games/Zenless-Zone-Zero/archives/464323", anomaly, [
    plan(["バーニス", "星見雅", "浮波柚葉"], "控え燃焼と氷異常を重ね、混沌とAfterburnを同時に回す。", "Layers off-field Burn and Ice Anomaly for Disorder and Afterburn.", "叠加后台燃烧与冰异常，循环紊乱和余烬。"),
    plan(["バーニス", "ジェーン", "シーザー"], "炎・物理の異常を交互に起こし、防護で混沌の主力行動を守る。", "Alternates Fire and Physical Anomaly while Defense support protects Disorder rotations.", "交替触发火与物理异常，并以防护保障紊乱循环。"),
    plan(["バーニス", "「11号」", "ルーシー"], "燃焼と炎主力の直撃を共存させ、ルーシーの支援で炎属性案を組む。", "Combines Burn with a Fire carry and Lucy's support in a Fire-focused option.", "结合燃烧、火系主C和露西辅助的火属性方案。"),
  ]),
  "zzz:ルーシー": batch5Options("zzz", "ルーシー", "https://game8.co/games/Zenless-Zone-Zero/archives/459730", support, [
    plan(["ルーシー", "バーニス", "ジェーン"], "Cheer On!の攻撃支援で異常2名の混沌と控え火力を伸ばす。", "Cheer On! ATK support raises two Anomaly agents' Disorder and off-field damage.", "以加油攻击辅助提升双异常角色的紊乱与后台伤害。"),
    plan(["ルーシー", "「11号」", "ライト"], "炎主力・ブレイク・攻撃支援を重ねる炎属性の直撃編成。", "A Fire direct-damage core layering a Fire carry, stun, and ATK support.", "叠加火系主C、失衡与攻击辅助的火属性直伤队。"),
    plan(["ルーシー", "パイパー", "バーニス"], "カリュドーンの異常連携で物理・炎の混沌と長時間の支援を両立する。", "Sons of Calydon Anomaly synergy sustains Physical-Fire Disorder and long support uptime.", "卡吕冬异常联动兼顾物理火紊乱与长时间辅助覆盖。"),
  ]),
  "hsr:ブローニャ": batch6Options("hsr", "ブローニャ", "https://game8.co/games/Honkai-Star-Rail/archives/405750", support, [
    plan(["ブローニャ", "ファイノン", "サンデー", "開拓者（記憶）"], "行動順操作を主力と記憶支援へ集約し、ブローニャの再行動で火力窓を増やす。", "Concentrates action control on the carry and Remembrance support, using Bronya's Advance Forward for more damage windows.", "将行动控制集中给主C与记忆辅助，通过布洛妮娅拉条增加输出窗口。"),
    plan(["ブローニャ", "刃", "トリビー", "ヒアンシー"], "単体主力の再行動とHP変動支援を重ね、刃の行動価値を高める。", "Combines Advance Forward with HP-fluctuation support to raise Blade's turn value.", "结合拉条与生命波动辅助，提高刃每次行动的价值。"),
    plan(["ブローニャ", "ゼーレ", "開拓者（存護）", "ナターシャ"], "単体主力へスキルを集中する所持対応案。耐久枠で再行動中の被弾を補う。", "A roster-friendly hypercarry option that focuses Skill use on a single-target carry while covering survival.", "将战技集中给单体主C、并用生存位保障再行动窗口的持有适配方案。"),
  ]),
  "hsr:銀狼": batch6Options("hsr", "銀狼", "https://game8.co/games/Honkai-Star-Rail/archives/405757", support, [
    plan(["銀狼", "黄泉", "椒丘", "ギャラガー"], "敵デバフを重ねて黄泉の必殺技回転を支え、銀狼は弱点付与と防御低下を担う。", "Stacks enemy debuffs for Acheron's Ultimate rotation while Silver Wolf supplies Weakness Implant and DEF shred.", "叠加敌方减益支撑黄泉终结技循环，由银狼提供弱点植入与减防。"),
    plan(["銀狼", "ゼーレ", "花火", "符玄"], "量子主力への弱点付与と行動順支援を重ねる量子寄せ編成。", "A Quantum-leaning team that pairs Weakness Implant with action-order support for the carry.", "为量子主C叠加弱点植入与行动辅助的量子倾向队。"),
    plan(["銀狼", "Dr.レイシオ", "トパーズ&カブ", "羅刹"], "単体デバフでレイシオとカブの追加攻撃条件を満たす案。", "Uses single-target debuffs to satisfy follow-up conditions for Dr. Ratio and Numby.", "以单体减益满足真理医生与账账追击条件的方案。"),
  ]),
  "hsr:符玄": batch6Options("hsr", "符玄", "https://game8.co/games/Honkai-Star-Rail/archives/405760", t("耐久", "Sustain", "生存位"), [
    plan(["符玄", "ゼーレ", "花火", "銀狼"], "量子主力の単体火力と弱点付与を守り、被ダメージ分配で行動を継続させる。", "Protects a Quantum single-target core and preserves its actions through damage redistribution.", "保护量子单体核心，并以伤害分摊维持行动。"),
    plan(["符玄", "ゼーレ", "花火", "停雲"], "行動順支援とEP支援を重ね、ゼーレの高頻度行動を安定させる。", "Combines action-order and Energy support to stabilize Seele's frequent turns.", "叠加行动辅助与能量辅助，稳定希儿的高频行动。"),
    plan(["符玄", "丹恒", "アスター", "御空"], "速度・攻撃支援と耐久を組む所持対応の単体火力案。", "A roster-friendly single-target team combining SPD, ATK support, and sustain.", "结合速度、攻击辅助与生存的持有适配单体队。"),
  ]),
  "hsr:羅刹": batch6Options("hsr", "羅刹", "https://game8.co/games/Honkai-Star-Rail/archives/405764", t("耐久", "Sustain", "生存位"), [
    plan(["羅刹", "キャストリス", "開拓者（記憶）", "トリビー"], "HP消費と記憶支援を継続回復で支え、主力と召喚物の行動を守る。", "Sustains HP consumption and Remembrance support with continuous healing for the carry and summon.", "以持续治疗支撑生命消耗和记忆辅助，保护主C与忆灵行动。"),
    plan(["羅刹", "モーディス", "サンデー", "トリビー"], "行動順支援を重ねるHP参照主力を、結界回復と解除で安定させる。", "Stabilizes an HP-scaling carry with stacked action support through field healing and cleansing.", "以结界治疗和解除保障叠加行动辅助的生命倍率主C。"),
    plan(["羅刹", "クラーラ", "停雲", "アスター"], "反撃主力への継続回復とEP・速度支援を組み合わせる所持対応案。", "A roster-friendly option combining sustain for a counter carry with Energy and SPD support.", "为反击主C提供持续治疗并结合能量、速度辅助的持有适配方案。"),
  ]),
  "genshin:白朮": batch6Options("genshin", "白朮", "https://game8.co/games/Genshin-Impact/archives/314348", support, [
    plan(["白朮", "セノ", "ナヒーダ", "夜蘭"], "草・水・雷の付着を維持し、白朮の回復と中断耐性で激化・開花の主力行動を守る。", "Maintains Dendro, Hydro, and Electro application while Baizhu's healing and interruption resistance protect the carry.", "维持草水雷附着，并以白术的治疗和抗打断保护主C行动。"),
    plan(["白朮", "アルハイゼン", "八重神子", "フィッシュル"], "草激化・超激化の付着と控え雷火力を、草支援と回復で安定させる。", "Stabilizes Spread/Aggravate application and off-field Electro damage with Dendro support and healing.", "以草系辅助与治疗稳定蔓激化、超激化附着和后台雷伤。"),
    plan(["白朮", "ニィロウ", "ナヒーダ", "行秋"], "豊穣の核を草・水だけで回し、継続回復で開花の自傷を補う。", "Runs Bountiful Cores with Dendro and Hydro only, offsetting Bloom self-damage with continuous healing.", "仅以草水角色运行丰穰之核，并用持续治疗抵消绽放自伤。"),
  ]),
  "genshin:八重神子": batch6Options("genshin", "八重神子", "https://game8.co/games/Genshin-Impact/archives/327533", anomaly, [
    plan(["八重神子", "アルハイゼン", "ナヒーダ", "白朮"], "草付着と雷追撃を重ね、激化反応と回復で控え・表火力を両立する。", "Layers Dendro application and Electro follow-ups for Aggravate damage with reliable healing.", "叠加草附着与雷追击，以激化伤害和稳定治疗兼顾前后台输出。"),
    plan(["八重神子", "クロリンデ", "シュヴルーズ", "ベネット"], "炎・雷限定で過負荷と耐性低下を有効化し、八重神子は控え雷火力を担う。", "Uses a Pyro-Electro-only core to enable Overload and RES shred, with Yae supplying off-field Electro damage.", "使用纯火雷核心触发超载与减抗，由八重神子提供后台雷伤。"),
    plan(["八重神子", "雷電将軍", "楓原万葉", "珊瑚宮心海"], "二雷の粒子と耐性低下・回復を組み、殺生櫻と元素爆発の循環を支える。", "Combines double-Electro particles, RES shred, and healing to support Sesshou Sakura and Burst rotations.", "结合双雷粒子、减抗与治疗，支撑杀生樱和元素爆发循环。"),
  ]),
  "genshin:宵宮": batch6Options("genshin", "宵宮", "https://game8.co/games/Genshin-Impact/archives/333497", mainDps, [
    plan(["宵宮", "行秋", "ベネット", "雲菫"], "継続水付着と通常攻撃支援を重ね、宵宮の蒸発通常攻撃を中断しにくくする。", "Combines sustained Hydro application and Normal Attack support for stable Vaporize strings.", "叠加持续挂水与普攻辅助，使宵宫的蒸发普攻连段更稳定。"),
    plan(["宵宮", "夜蘭", "雲菫", "鍾離"], "水付着・通常攻撃支援・護盾で単体主力の連射を保つ。", "Uses Hydro application, Normal Attack support, and a shield to preserve single-target attack strings.", "以挂水、普攻辅助与护盾维持单体主C连射。"),
    plan(["宵宮", "八重神子", "フィッシュル", "シュヴルーズ"], "炎・雷限定の過負荷で、遠距離通常攻撃と控え雷火力を組み合わせる。", "A Pyro-Electro-only Overload team combining ranged Normal Attacks with off-field Electro damage.", "火雷限定超载队，结合远程普攻与后台雷伤。"),
  ]),
  "zzz:シーザー": batch6Options("zzz", "シーザー", "https://game8.co/games/Zenless-Zone-Zero/archives/464303", t("防護", "Defense", "防护"), [
    plan(["シーザー", "エレン", "蒼角"], "防護支援でエレンの通常攻撃を守り、氷支援とブレイクで直撃火力を伸ばす。", "Defense support protects Ellen's attacks while Ice support and stun improve direct-damage windows.", "防护辅助保护艾莲的攻击，并以冰系辅助和失衡强化直伤窗口。"),
    plan(["シーザー", "ビビアン", "月城柳"], "防護で異常主力の行動を守り、エーテル・電気の混沌を継続する。", "Protects Anomaly rotations while sustaining Ether-Electric Disorder.", "以防护保障异常循环，并维持以太、电气紊乱。"),
    plan(["シーザー", "ビリー", "ニコ"], "護盾・集敵・遠距離主力を組む所持対応の物理直撃案。", "A roster-friendly Physical direct-damage team with shielding, grouping, and a ranged carry.", "结合护盾、聚怪与远程主C的持有适配物理直伤队。"),
  ]),
  "zzz:リナ": batch6Options("zzz", "リナ", "https://game8.co/games/Zenless-Zone-Zero/archives/436876", support, [
    plan(["リナ", "星見雅", "月城柳"], "人形の貫通率支援と電気異常を重ね、烈霜・極性混沌の回転を補助する。", "Pairs puppet-based PEN support with Electric Anomaly to assist Frost and Polarized Disorder rotations.", "将人偶穿透辅助与电气异常结合，辅助烈霜与极性紊乱循环。"),
    plan(["リナ", "浅羽悠真", "青衣"], "電気主力・ブレイク・貫通率支援を組み、短いブレイク時間の直撃火力を伸ばす。", "Combines an Electric carry, stun, and PEN support for stronger direct damage during short stun windows.", "结合电系主C、失衡与穿透辅助，提高短暂失衡期的直伤。"),
    plan(["リナ", "アンビー", "ビリー"], "感電付着・ブレイク・遠距離主力を組み合わせる入手しやすい電気案。", "An accessible Electric team combining Shock application, stun, and a ranged carry.", "结合感电附着、失衡与远程主C的易获取电气队。"),
  ]),
  "zzz:青衣": batch6Options("zzz", "青衣", "https://game8.co/games/Zenless-Zone-Zero/archives/460407", t("撃破", "Stun", "击破"), [
    plan(["青衣", "アストラ", "朱鳶"], "畏服によるブレイク倍率と支援バフを重ね、朱鳶の爆発窓を作る。", "Stacks Subjugation's stun multiplier with support buffs to create Zhu Yuan burst windows.", "叠加威服的失衡倍率与辅助增益，为朱鸢创造爆发窗口。"),
    plan(["青衣", "アストラ", "浅羽悠真"], "電気主力へブレイク時間と支援を渡し、短時間の連続攻撃を支える。", "Passes stun windows and support to an Electric carry for short burst sequences.", "为电系主C提供失衡窗口与辅助，支撑短时间连段爆发。"),
    plan(["青衣", "ニコ", "ビリー"], "集敵・防御低下・ブレイクを遠距離主力へ繋ぐ入手しやすい案。", "An accessible option linking grouping, DEF reduction, and stun to a ranged carry.", "将聚怪、减防与失衡衔接给远程主C的易获取方案。"),
  ]),
  "hsr:アーチャー": batch7Options("hsr", "アーチャー", "https://game8.co/games/Honkai-Star-Rail/archives/519877", mainDps, [
    plan(["アーチャー", "花火", "開拓者（記憶）", "パーマンソー・テラエ"], "SP供給と行動順支援を重ね、スキル連射と量子単体火力を安定させる。", "Combines Skill Point supply and action support to stabilize repeated Skills and Quantum single-target damage.", "叠加战技点供给与行动辅助，稳定战技连发和量子单体输出。"),
    plan(["アーチャー", "開拓者（記憶）", "寒鴉", "リンクス"], "SP回復・行動順補助・回復を組み、限定支援の所持状況に対応する。", "Uses SP recovery, action support, and healing as a roster-friendly alternative.", "结合战技点回复、行动辅助与治疗，适配限定辅助持有情况。"),
    plan(["アーチャー", "花火", "爻光", "パーマンソー・テラエ"], "高SP環境と支援を重ね、主力のターン内スキル回数を伸ばす。", "Stacks high-SP conditions and support to increase the carry's in-turn Skill uses.", "叠加高战技点环境与辅助，增加主C单回合战技次数。"),
  ]),
  "hsr:アーラン": batch7Options("hsr", "アーラン", "https://game8.co/games/Honkai-Star-Rail/archives/405754", mainDps, [
    plan(["アーラン", "御空", "アスター", "開拓者（存護）"], "速度・攻撃支援とシールドを組み、低HP運用の火力と生存を両立する。", "Combines SPD/ATK support with shielding for low-HP damage and survival.", "结合速度、攻击辅助与护盾，兼顾低血量输出与生存。"),
    plan(["アーラン", "ブローニャ", "停雲", "アベンチュリン"], "再行動とEP支援を高耐久シールドで守り、攻撃機会を増やす。", "Protects extra actions and Energy support with strong shielding to create more attack windows.", "以高强度护盾保护再行动与能量辅助，增加输出机会。"),
    plan(["アーラン", "サンデー", "丹恒・騰荒", "フォフォ"], "行動順・耐久・回復を重ね、低HP依存の主力を継続させる。", "Stacks action support, sustain, and healing to keep a low-HP-dependent carry active.", "叠加行动辅助、生存与治疗，维持低血量主C的持续输出。"),
  ]),
  "hsr:アスター": batch7Options("hsr", "アスター", "https://game8.co/games/Honkai-Star-Rail/archives/405743", support, [
    plan(["アスター", "姫子", "トパーズ&カブ", "符玄"], "炎弱点・追加攻撃の手数を、速度と攻撃力支援・耐久で支える。", "Supports Fire weakness and follow-up frequency with SPD/ATK buffs and sustain.", "以速度、攻击辅助与生存支撑火弱点和追击频率。"),
    plan(["アスター", "フック", "銀狼", "アベンチュリン"], "炎主力への速度支援と弱点付与を重ね、単体戦を安定させる。", "Combines SPD support for a Fire carry with Weakness Implant for stable single-target play.", "将炎系主C的速度辅助与弱点植入结合，稳定单体战。"),
    plan(["アスター", "ホタル", "開拓者（調和）", "ギャラガー"], "速度支援と超撃破を組み、撃破主力の行動回数を補う。", "Pairs SPD support with Super Break to add actions for a Break carry.", "结合速度辅助与超击破，补足击破主C的行动次数。"),
  ]),
  "hsr:アルジェンティ": batch7Options("hsr", "アルジェンティ", "https://game8.co/games/Honkai-Star-Rail/archives/428046", mainDps, [
    plan(["アルジェンティ", "サンデー", "トリビー", "フォフォ"], "行動順・全体支援・EP回復を重ね、180EP必殺技の回転を支える。", "Stacks action support, team buffs, and Energy recovery for 180-Energy Ultimate rotations.", "叠加行动辅助、全队增益与能量回复，支撑180能量终结技循环。"),
    plan(["アルジェンティ", "マダム・ヘルタ", "トリビー", "フォフォ"], "範囲火力を並べ、複数敵への必殺技価値と耐久を両立する。", "Pairs AoE damage dealers to raise Ultimate value against multiple enemies while retaining sustain.", "组合范围输出角色，提高多目标终结技价值并保留生存。"),
    plan(["アルジェンティ", "御空", "開拓者（記憶）", "ナターシャ"], "会心・行動順・回復を組む所持対応の必殺技回転案。", "A roster-friendly Ultimate rotation using CRIT support, action support, and healing.", "使用暴击辅助、行动辅助与治疗的持有适配终结技循环队。"),
  ]),
  "genshin:アーロイ": batch7Options("genshin", "アーロイ", "https://www.icy-veins.com/genshin-impact/aloy-team-guide", mainDps, [
    plan(["アーロイ", "フリーナ", "ジン", "甘雨"], "水付着・HP変動支援・回復・氷粒子を組み、爆発クイックスワップを回す。", "Combines Hydro, HP-fluctuation support, healing, and Cryo particles for Burst quickswap rotations.", "结合挂水、生命波动辅助、治疗与冰元素微粒，循环爆发速切。"),
    plan(["アーロイ", "神里綾華", "珊瑚宮心海", "申鶴"], "凍結・氷粒子・氷支援を重ね、氷チームの爆発枠として扱う。", "Layers Freeze, Cryo particles, and Cryo support to use Aloy as a Burst slot in a Cryo team.", "叠加冻结、冰元素微粒与冰系辅助，将埃洛伊作为冰队爆发位。"),
    plan(["アーロイ", "ベネット", "香菱", "楓原万葉"], "炎付着と集敵で溶解を狙い、爆発を主軸にする。", "Uses Pyro application and grouping for Melt-focused Burst damage.", "利用火元素附着与聚怪打出融化，以元素爆发为核心。"),
  ]),
  "genshin:アイノ": batch7Options("genshin", "アイノ", "https://game8.co/games/Genshin-Impact/archives/537903", support, [
    plan(["アイノ", "フリンズ", "イネファ", "スクロース"], "水・雷・風の反応と元素熟知支援を組み、月感電の主力を補助する。", "Combines Hydro-Electro-Anemo reactions and Elemental Mastery support for a Lunar-Charged carry.", "结合水雷风反应与元素精通辅助，支撑月感电主C。"),
    plan(["アイノ", "ナヒーダ", "ニィロウ", "白朮"], "草水のみで開花を回し、元素熟知支援と継続回復を両立する。", "Runs Bloom with Dendro and Hydro only, balancing Elemental Mastery support and sustained healing.", "以草水角色运行绽放，兼顾元素精通辅助与持续治疗。"),
    plan(["アイノ", "アルレッキーノ", "イネファ", "ベネット"], "水・雷反応支援と攻撃支援を組み、炎主力の行動時間を確保する。", "Combines Hydro-Electro reaction support and ATK support for a Pyro carry's field time.", "结合水雷反应辅助与攻击辅助，保障火系主C的站场时间。"),
  ]),
  "genshin:アルベド": batch7Options("genshin", "アルベド", "https://game8.co/games/Genshin-Impact/archives/312182", support, [
    plan(["アルベド", "ナヴィア", "ドゥリン", "ベネット"], "岩共鳴と結晶反応を支え、控え岩火力と主力の元素スキル火力を重ねる。", "Supports Geo Resonance and Crystallize while stacking off-field Geo damage with the carry's Skill damage.", "支撑岩元素共鸣与结晶反应，叠加后台岩伤与主C元素战技伤害。"),
    plan(["アルベド", "荒瀧一斗", "ゴロー", "鍾離"], "岩共鳴・防御支援・護盾を揃え、陽華の控え火力を岩主力へ重ねる。", "Uses Geo Resonance, DEF support, and shielding to layer Solar Isotoma damage into a Geo carry team.", "组合岩元素共鸣、防御辅助与护盾，将阳华后台伤害叠加至岩系主C队。"),
    plan(["アルベド", "胡桃", "行秋", "鍾離"], "結晶と護盾で中断を抑え、蒸発主力へ控え火力を足す。", "Uses Crystallize and shielding to reduce interruption while adding off-field damage to a Vaporize carry.", "以结晶与护盾减少打断，并为蒸发主C补充后台输出。"),
  ]),
  "zzz:「11号」": batch7Options("zzz", "「11号」", "https://game8.co/games/Zenless-Zone-Zero/archives/436882", mainDps, [
    plan(["「11号」", "ライト", "アストラ"], "炎耐性低下・ブレイク・全体支援を重ね、炎抑制中の通常攻撃を伸ばす。", "Stacks Fire RES shred, stun, and team support for stronger Fire Suppression Basic Attacks.", "叠加火抗降低、失衡与全队辅助，强化火力镇压期间的普攻。"),
    plan(["「11号」", "トリガー", "アストラ"], "短い表時間でブレイク倍率と支援を渡し、炎主力の火力窓を作る。", "Passes stun multiplier and support through low field time to create Fire carry damage windows.", "以短站场提供失衡倍率和辅助，为火系主C创造输出窗口。"),
    plan(["「11号」", "ベン", "ニコ"], "炎追加能力の条件と護盾・集敵を組み、入手しやすい炎直撃編成にする。", "Meets the Fire additional-ability condition while adding shielding and grouping in an accessible Fire team.", "满足火系额外能力条件，并以护盾、聚怪构成易获取火系直伤队。"),
  ]),
  "zzz:「シード」": batch7Options("zzz", "「シード」", "https://www.prydwen.gg/zenless/characters/seed", mainDps, [
    plan(["「シード」", "0号・アンビー", "トリガー"], "強攻ヴァンガードとオフフィールドブレイクを組み、相互のEX特殊を回して鋼鉄チャージを確保する。", "Pairs an Attack Vanguard with off-field stun to cycle both EX Specials and build Steel Charge.", "结合强攻先锋与后台失衡，通过双方强化特殊循环积累钢铁蓄力。"),
    plan(["「シード」", "オルペウス&「鬼火」", "トリガー"], "オボルス隊の強攻2名とブレイクを重ね、素早い交代で主力2名の火力を活かす。", "Combines two Obol Squad Attack agents with stun for quick swaps and dual-carry damage.", "组合两名奥波勒斯小队强攻与失衡，以快速切换发挥双主C伤害。"),
    plan(["「シード」", "「11号」", "アストラ"], "炎・電気の強攻2名と支援を組み、ヴァンガード条件と持続的なEX特殊循環を満たす。", "Uses two Attack agents and support to meet Vanguard requirements and sustain EX Special cycles.", "使用两名强攻与辅助，满足先锋条件并维持强化特殊循环。"),
  ]),
  "zzz:「トリガー」": batch7Options("zzz", "「トリガー」", "https://game8.co/games/Zenless-Zone-Zero/archives/495167", t("撃破", "Stun", "击破"), [
    plan(["「トリガー」", "アストラ", "0号・アンビー"], "オフフィールドAftershockと支援を重ね、電気主力の短い火力窓を増幅する。", "Combines off-field Aftershocks and support to amplify an Electric carry's burst windows.", "结合后台追击与辅助，放大电系主C的爆发窗口。"),
    plan(["「トリガー」", "アストラ", "浅羽悠真"], "電気主力の連続攻撃をAftershockのブレイク支援と全体バフで補助する。", "Supports an Electric carry's attack strings with Aftershock stun support and team buffs.", "以追击失衡辅助和全队增益支撑电系主C的连续攻击。"),
    plan(["「トリガー」", "ニコ", "ビリー"], "集敵・防御低下・遠距離主力をAftershockで補助する所持対応案。", "A roster-friendly option where Aftershocks support grouping, DEF reduction, and a ranged carry.", "以追击辅助聚怪、减防和远程主C的持有适配方案。"),
  ]),
  "hsr:ヴェルト": batch8Options("hsr", "ヴェルト", "https://game8.co/games/Honkai-Star-Rail/archives/405763", mainDps, [
    plan(["ヴェルト", "花火", "トリビー", "丹恒・騰荒"], "会心支援と行動順操作を虚数主力へ集約し、必殺技・戦闘スキルの火力窓を作る。", "Focuses CRIT support and action control on the Imaginary carry to create Ultimate and Skill damage windows.", "将暴击辅助与行动控制集中给虚数主C，创造终结技和战技输出窗口。"),
    plan(["ヴェルト", "黄泉", "銀狼", "丹恒・騰荒"], "減速・禁錮とデバフを重ね、黄泉の必殺技回転を補助する。", "Layers slow, Imprisonment, and debuffs to support Acheron's Ultimate rotation.", "叠加减速、禁锢与减益，辅助黄泉的终结技循环。"),
    plan(["ヴェルト", "開拓者（記憶）", "アスター", "丹恒・騰荒"], "行動順支援と耐久を組み合わせる所持対応の虚数火力案。", "A roster-friendly Imaginary damage option combining action support and sustain.", "结合行动辅助与生存位的持有适配虚数输出方案。"),
  ]),
  "hsr:ギャラガー": batch8Options("hsr", "ギャラガー", "https://game8.co/games/Honkai-Star-Rail/archives/437255", t("耐久・撃破", "Sustain & Break", "生存与击破"), [
    plan(["ギャラガー", "ホタル", "帰忘の流離人", "ダリア"], "撃破特効・弱点撃破・回復を重ね、超撃破主力の継続火力を支える。", "Combines Break, weakness breaking, and healing to sustain a Super Break carry.", "结合击破、弱点击破与治疗，支撑超击破主C的持续输出。"),
    plan(["ギャラガー", "黄泉", "椒丘", "ペラ"], "デバフ付与と回復を両立し、黄泉の必殺技回転を補助する。", "Pairs debuff application with healing to support Acheron's Ultimate rotation.", "兼顾减益施加与治疗，辅助黄泉的终结技循环。"),
    plan(["ギャラガー", "三月なのか（巡狩）", "開拓者（調和）", "アスター"], "撃破と速度支援を入手しやすい枠で組む代替案。", "An accessible alternative combining Break and SPD support.", "以易获取角色结合击破与速度辅助的替代方案。"),
  ]),
  "hsr:キュレネ": batch8Options("hsr", "キュレネ", "https://game8.co/games/Honkai-Star-Rail/archives/541348", support, [
    plan(["キュレネ", "キャストリス", "長夜月", "ヒアンシー"], "ChrysosのHP消費・記憶精霊・回復を連動させ、長い火力循環を支える。", "Links Chrysos HP expenditure, memosprites, and healing for sustained rotations.", "联动Chrysos生命消耗、忆灵与治疗，支撑持续循环。"),
    plan(["キュレネ", "アグライア", "サンデー", "丹恒・騰荒"], "記憶主力の行動順と記憶精霊支援を重ね、手数を確保する。", "Stacks action control and memosprite support for a Remembrance carry.", "叠加行动控制与忆灵辅助，保证记忆主C的行动次数。"),
    plan(["キュレネ", "アナイクス", "ケリュドラ", "丹恒・騰荒"], "弱点付与とChrysos支援を組み、風知恵主力の範囲火力を支える。", "Combines weakness application and Chrysos support for an Erudition carry's AoE damage.", "结合弱点附加与Chrysos辅助，支撑智识主C的范围输出。"),
  ]),
  "hsr:ギルガメッシュ": batch8Options("hsr", "ギルガメッシュ", "https://game8.co/games/Honkai-Star-Rail/archives/601941", mainDps, [
    plan(["ギルガメッシュ", "セイバー", "モーテナックス・ブレード", "フォフォ"], "Fate連携の追撃・EP回復・耐久を重ね、Interestの消費機会を増やす。", "Stacks Fate follow-ups, Energy recovery, and sustain to create more Interest spending windows.", "叠加Fate联动追击、能量回复与生存位，增加消耗Interest的机会。"),
    plan(["ギルガメッシュ", "セイバー", "開拓者（記憶）", "フォフォ"], "記憶支援とEP回復を組み、限定補助の所持状況に対応する。", "Pairs Remembrance support and Energy recovery as a roster-flexible alternative.", "结合记忆辅助与能量回复，适配限定辅助持有情况。"),
    plan(["ギルガメッシュ", "アシュヴェイル", "モーテナックス・ブレード", "フォフォ"], "追撃の連鎖と耐久を組み、雷主力の必殺技回転を支える。", "Combines follow-up chains and sustain to support the Lightning carry's Ultimate rotation.", "结合追击连锁与生存位，支撑雷系主C的终结技循环。"),
  ]),
  "genshin:アンバー": batch8Options("genshin", "アンバー", "https://game8.co/games/Genshin-Impact/archives/297535", mainDps, [
    plan(["アンバー", "シトラリ", "シロネン", "ベネット"], "氷付着・耐性低下・攻撃支援を重ね、溶解重撃を主軸にする。", "Stacks Cryo application, RES shred, and ATK support for Melt Charged Shots.", "叠加冰附着、减抗与攻击辅助，以融化重击为核心。"),
    plan(["アンバー", "ロサリア", "鍾離", "ベネット"], "氷付着と中断耐性を確保し、重撃を安全に継続する。", "Provides Cryo application and interruption resistance for safer sustained Charged Shots.", "提供冰附着与抗打断，使重击更稳定持续。"),
    plan(["アンバー", "シトラリ", "スクロース", "ベネット"], "拡散と元素熟知支援を加え、C4以降の爆弾人形連携も活かす。", "Adds Swirl and Elemental Mastery support while enabling C4+ Baron Bunny sequences.", "加入扩散与元素精通辅助，并利用C4后的兔兔伯爵连携。"),
  ]),
  "genshin:イアンサ": batch8Options("genshin", "イアンサ", "https://game8.co/games/Genshin-Impact/archives/345881", support, [
    plan(["イアンサ", "マーヴィカ", "シトラリ", "シロネン"], "夜魂・炎・氷・岩の相性を重ね、主力への攻撃支援と耐性低下を両立する。", "Combines Nightsoul, Pyro, Cryo, and Geo synergies for ATK support and RES shred.", "结合夜魂、火、冰、岩的协同，兼顾攻击辅助与减抗。"),
    plan(["イアンサ", "ヴァレサ", "フリーナ", "閑雲"], "雷主力の移動条件とHP変動支援・回復を組み、ハイパー運用を支える。", "Supports an Electro carry's movement conditions with HP-fluctuation buffs and healing.", "以生命波动增益与治疗支撑雷系主C的移动条件和强化输出。"),
    plan(["イアンサ", "クロリンデ", "ベネット", "シュヴルーズ"], "炎・雷限定の過負荷で攻撃支援と耐性低下を組み合わせる。", "Uses a Pyro-Electro-only Overload core for ATK support and RES shred.", "使用纯火雷超载核心，结合攻击辅助与减抗。"),
  ]),
  "genshin:イネファ": batch8Options("genshin", "イネファ", "https://game8.co/games/Genshin-Impact/archives/531360", t("月感電サブDPS", "Lunar-Charged sub DPS", "月感电副C"), [
    plan(["イネファ", "フリンズ", "アイノ", "スクロース"], "水・雷・風の反応と元素熟知支援を重ね、月感電の主力を補助する。", "Combines Hydro-Electro-Anemo reactions and Elemental Mastery support for a Lunar-Charged carry.", "结合水雷风反应与元素精通辅助，支撑月感电主C。"),
    plan(["イネファ", "イファ", "オロルン", "フリーナ"], "水・雷の控え火力と回復・HP変動支援を組み、反応を継続する。", "Uses off-field Hydro-Electro damage with healing and HP-fluctuation support for sustained reactions.", "利用后台水雷伤害、治疗与生命波动辅助维持反应。"),
    plan(["イネファ", "ラウマ", "ヌヴィレット", "フリーナ"], "水主力と草・雷反応を組み、月反応複合の控え火力を加える。", "Pairs a Hydro carry with Dendro-Electro reactions and off-field Lunar reaction damage.", "结合水系主C、草雷反应与后台月反应伤害。"),
  ]),
  "zzz:0号・アンビー": batch8Options("zzz", "0号・アンビー", "https://game8.co/games/Zenless-Zone-Zero/archives/495109", mainDps, [
    plan(["0号・アンビー", "トリガー", "アストラ"], "Aftershockのブレイク支援と全体バフを重ね、電気主力の短い火力窓を伸ばす。", "Stacks Aftershock stun support and team buffs for an Electric carry's burst windows.", "叠加追击失衡辅助与全队增益，强化电系主C的爆发窗口。"),
    plan(["0号・アンビー", "アンビー", "ニコ"], "電気・ブレイク・集敵を組む所持対応の直撃案。", "An accessible direct-damage option combining Electric synergy, stun, and grouping.", "结合电系协同、失衡与聚怪的易获取直伤方案。"),
    plan(["0号・アンビー", "オルペウス&「鬼火」", "トリガー"], "Aftershockと強攻2名の交代を組み、電気・炎の手数を活かす。", "Pairs Aftershocks with two Attack agents for rapid Electric-Fire swaps.", "结合追击与双强攻，通过电火快速切换发挥手数。"),
  ]),
  "zzz:アリア": batch8Options("zzz", "アリア", "https://game8.co/games/Zenless-Zone-Zero/archives/572601", anomaly, [
    plan(["アリア", "スンナ", "南宮羽"], "同陣営の異常・支援を組み、エーテル異常とAbloomを継続させる。", "Uses faction synergy to sustain Ether Anomaly and Abloom rotations.", "利用同阵营协同，维持以太异常与Abloom循环。"),
    plan(["アリア", "プロメイア", "南宮羽"], "異常蓄積と支援を重ね、Abloomの発動回数を確保する。", "Stacks Anomaly buildup and support to increase Abloom triggers.", "叠加异常积蓄与辅助，确保Abloom的触发次数。"),
    plan(["アリア", "アンビー", "ニコ"], "ブレイク・集敵・エーテル主力を組む入手しやすい代替案。", "An accessible alternative combining stun, grouping, and an Ether carry.", "结合失衡、聚怪与以太主C的易获取替代方案。"),
  ]),
  "zzz:アリス": batch8Options("zzz", "アリス", "https://game8.co/games/Zenless-Zone-Zero/archives/527839", anomaly, [
    plan(["アリス", "ヴェリナ", "レミエール"], "異常3名の反応連鎖を組み、極性強襲・混沌の回転を支える。", "Combines three Anomaly agents for Polarized Assault and Disorder rotations.", "组合三名异常角色，支撑极性强击与紊乱循环。"),
    plan(["アリス", "カリン", "ニコ"], "物理主力・集敵・防御低下を組む入手しやすい代替案。", "An accessible alternative combining a Physical carry, grouping, and DEF reduction.", "结合物理主C、聚怪与减防的易获取替代方案。"),
    plan(["アリス", "アストラ", "セス"], "支援・護盾・異常補助を組み、前線での強襲蓄積を安定させる。", "Uses support, shielding, and Anomaly aid to stabilize Assault buildup on field.", "结合辅助、护盾与异常补助，稳定前线强击积蓄。"),
  ]),
};

type GenericProfile = "crit" | "dot" | "break" | "support" | "sustain" | "tank" | "hp" | "def" | "em" | "anomaly" | "stun" | "rupture";

const ownMember = (name: string, roleJa: string, roleEn: string, roleZh: string) => member(name, name, name, roleJa, roleEn, roleZh);
const roleMember = (name: string, roleJa: string, roleEn: string, roleZh: string) => member(name, name, name, roleJa, roleEn, roleZh);

function genericProfileFor(game: PartyGameId, name: string): GenericProfile {
  if (game === "hsr") return generatedHsrGuide(name, HSR_RUNTIME_PATHS[name] ?? "").profileId as GenericProfile;
  if (game === "genshin") return generatedGenshinGuide(name).profileId as GenericProfile;
  return generatedZzzGuide(name, ZZZ_RUNTIME_PROFESSIONS[name] ?? "Attack").profileId as GenericProfile;
}

function genericTargetChanges(game: PartyGameId, profile: GenericProfile): PartyTargetChange[] {
  if (game === "hsr" && profile === "break") return [change("speed", "速度", "SPD", "速度", "", 160, 150, 145, "超撃破・撃破編成の行動回数を確保する戦闘外速度の目安。", "Out-of-combat SPD benchmark to secure actions in Break and Super Break teams.", "确保击破与超击破队行动次数的战斗外速度参考。")];
  if (game === "hsr" && profile === "support") return [change("speed", "速度", "SPD", "速度", "", 161, 145, 134, "支援スキルの循環を優先する戦闘外速度の目安。", "Out-of-combat SPD benchmark that prioritizes support-skill rotations.", "优先辅助技能循环的战斗外速度参考。")];
  if (game === "genshin" && profile === "em") return [change("elementalMastery", "元素熟知", "Elemental Mastery", "元素精通", "", 1000, 800, 650, "反応ダメージを主軸にする案では元素熟知を比較対象にする。", "For reaction-focused teams, include Elemental Mastery in the comparison.", "以反应伤害为主的队伍应将元素精通纳入比较。")];
  if (game === "genshin" && profile === "support") return [change("energyRecharge", "元素チャージ効率", "Energy Recharge", "元素充能效率", "%", 250, 200, 170, "元素爆発による支援を維持する元素チャージ効率の目安。", "Energy Recharge benchmark for maintaining Burst-based support.", "维持元素爆发辅助的元素充能效率参考。")];
  if (game === "zzz" && profile === "anomaly") return [change("anomalyMastery", "異常マスタリー", "Anomaly Mastery", "异常精通", "", 420, 360, 300, "状態異常・混沌を主軸にする案では異常マスタリーを比較する。", "For Anomaly and Disorder teams, compare Anomaly Mastery.", "以异常与紊乱为主的队伍应比较异常精通。")];
  if (game === "zzz" && profile === "stun") return [change("impact", "衝撃力", "Impact", "冲击力", "", 190, 175, 160, "ブレイク支援を担うため、衝撃力を優先して比較する。", "Prioritize Impact for agents responsible for stunning enemies.", "承担失衡支援时，优先比较冲击力。")];
  return [];
}

function genericMembers(game: PartyGameId, name: string, profile: GenericProfile, rank: 1 | 2 | 3): PartyMember[] {
  if (game === "hsr") {
    if (profile === "break") return rank === 1 ? [ownMember(name, "主力", "Main DPS", "主C"), roleMember("ルアン・メェイ", "撃破支援", "Break support", "击破辅助"), roleMember("開拓者（調和）", "超撃破支援", "Super Break support", "超击破辅助"), roleMember("霊砂", "耐久", "Sustain", "生存位")] : rank === 2 ? [ownMember(name, "主力", "Main DPS", "主C"), roleMember("帰忘の流離人", "撃破支援", "Break support", "击破辅助"), roleMember("開拓者（調和）", "超撃破支援", "Super Break support", "超击破辅助"), roleMember("ギャラガー", "耐久", "Sustain", "生存位")] : [ownMember(name, "主力", "Main DPS", "主C"), roleMember("アスター", "速度支援", "SPD support", "速度辅助"), roleMember("開拓者（調和）", "超撃破支援", "Super Break support", "超击破辅助"), roleMember("ギャラガー", "耐久", "Sustain", "生存位")];
    if (profile === "dot") return rank === 1 ? [ownMember(name, "持続ダメージ", "DoT", "持续伤害"), roleMember("カフカ", "起爆", "Detonator", "引爆"), roleMember("ブラックスワン", "持続ダメージ", "DoT", "持续伤害"), roleMember("フォフォ", "耐久", "Sustain", "生存位")] : [ownMember(name, "持続ダメージ", "DoT", "持续伤害"), roleMember("サンポ", "持続ダメージ", "DoT", "持续伤害"), roleMember("ペラ", "デバフ", "Debuff", "减益"), roleMember("ギャラガー", "耐久", "Sustain", "生存位")];
    if (profile === "support" || profile === "sustain" || profile === "tank") return [profile === "sustain" || profile === "tank" ? ownMember(name, "耐久", "Sustain", "生存位") : ownMember(name, "支援", "Support", "辅助"), roleMember("アグライア", "主力", "Main DPS", "主C"), roleMember("ロビン", "支援", "Support", "辅助"), roleMember("トリビー", "支援", "Support", "辅助")];
    return rank === 1 ? [ownMember(name, "主力", "Main DPS", "主C"), roleMember("ロビン", "支援", "Support", "辅助"), roleMember("トリビー", "支援", "Support", "辅助"), roleMember("アベンチュリン", "耐久", "Sustain", "生存位")] : [ownMember(name, "主力", "Main DPS", "主C"), roleMember("花火", "支援", "Support", "辅助"), roleMember("ペラ", "デバフ", "Debuff", "减益"), roleMember("リンクス", "耐久", "Sustain", "生存位")];
  }
  if (game === "genshin") {
    if (profile === "em") return [ownMember(name, "反応役", "Reaction driver", "反应位"), roleMember("ナヒーダ", "草付着", "Dendro application", "草元素附着"), roleMember("行秋", "水付着", "Hydro application", "水元素附着"), roleMember("久岐忍", "反応・回復", "Reaction & healing", "反应与治疗")];
    if (profile === "support" || profile === "sustain") return [profile === "sustain" ? ownMember(name, "回復・耐久", "Healing & sustain", "治疗与生存") : ownMember(name, "支援", "Support", "辅助"), roleMember("アルレッキーノ", "主力", "Main DPS", "主C"), roleMember("楓原万葉", "耐性低下", "RES shred", "减抗"), roleMember("鍾離", "耐久", "Sustain", "生存位")];
    if (profile === "def") return [ownMember(name, "主力", "Main DPS", "主C"), roleMember("ゴロー", "防御支援", "DEF support", "防御辅助"), roleMember("フリーナ", "全体バフ", "Team buffs", "全队增益"), roleMember("鍾離", "耐久", "Sustain", "生存位")];
    if (profile === "hp") return [ownMember(name, "主力", "Main DPS", "主C"), roleMember("フリーナ", "全体バフ", "Team buffs", "全队增益"), roleMember("楓原万葉", "耐性低下", "RES shred", "减抗"), roleMember("白朮", "回復", "Healing", "治疗")];
    return rank === 1 ? [ownMember(name, "主力", "Main DPS", "主C"), roleMember("フリーナ", "水・全体バフ", "Hydro & team buffs", "水元素与全队增益"), roleMember("楓原万葉", "耐性低下", "RES shred", "减抗"), roleMember("ベネット", "攻撃支援", "ATK support", "攻击辅助")] : [ownMember(name, "主力", "Main DPS", "主C"), roleMember("行秋", "水付着", "Hydro application", "水元素附着"), roleMember("フィッシュル", "副火力", "Sub DPS", "副C"), roleMember("鍾離", "耐久", "Sustain", "生存位")];
  }
  if (profile === "anomaly") return [ownMember(name, "異常", "Anomaly", "异常"), roleMember("浮波柚葉", "支援", "Support", "辅助"), roleMember("ビビアン", "異常", "Anomaly", "异常")];
  if (profile === "stun") return [ownMember(name, "撃破", "Stun", "击破"), roleMember("エレン", "主力", "Main DPS", "主C"), roleMember("蒼角", "支援", "Support", "辅助")];
  if (profile === "support" || profile === "tank") return [profile === "tank" ? ownMember(name, "防護", "Defense", "防护") : ownMember(name, "支援", "Support", "辅助"), roleMember("星見雅", "主力", "Main DPS", "主C"), roleMember("月城柳", "異常", "Anomaly", "异常")];
  if (profile === "rupture") return [ownMember(name, "命破", "Rupture", "命破"), roleMember("橘福福", "撃破", "Stun", "击破"), roleMember("リュシア", "支援", "Support", "辅助")];
  return [ownMember(name, "主力", "Main DPS", "主C"), roleMember("ライト", "撃破", "Stun", "击破"), roleMember("アストラ", "支援", "Support", "辅助")];
}

function genericOptionsFor(game: PartyGameId, name: string): PartyRecommendation[] {
  const profile = genericProfileFor(game, name);
  const titles = [t("相性重視", "Synergy Core", "高协同核心队"), t("代替・所持状況対応", "Alternative Roster", "替代阵容"), t("汎用・入手しやすい案", "Generalist Accessible", "通用易获取队")];
  const summary = t(`${name}の役割と公開プロフィールで比較できる戦闘外ステータスを基準にした個別編成案。`, `A character-specific team for ${name}, based on role fit and out-of-combat public-profile stats.`, `以${name}的定位和可在公开面板比较的战斗外属性为基础的专属配队。`);
  return ([1, 2, 3] as const).map((rank) => option(game, {
    id: `generated-${game}-${name}-${rank}`,
    rank,
    title: titles[rank - 1],
    members: genericMembers(game, name, profile, rank),
    synergy: [t(`${name}の役割に合う主力・支援・耐久または反応枠を組み合わせ、主根拠とSNS補助根拠を照合した編成。`, `Combines role-appropriate damage, support, sustain, or reaction slots for ${name}, cross-checked with the primary guide and community reference.`, `为${name}组合符合定位的输出、辅助、生存或反应位，并与主指南和社区参考交叉核对。`)],
    targetChanges: rank === 1 ? genericTargetChanges(game, profile) : [],
    targetSummary: summary,
  }));
}

export const PARTY_CATALOG_CHARACTER_COUNT = Object.values(CHARACTER_GUIDE_CATALOG).filter(Array.isArray).reduce((total, names) => total + names.length, 0);

export function partyRecommendationsFor(game: PartyGameId, characterName: string): PartyRecommendationSet {
  const key = `${game}:${characterName}`;
  const options = (MANUALLY_CURATED_HIGH_USAGE_CATALOG[key] ?? PARTY_CATALOG[key] ?? genericOptionsFor(game, characterName)).slice(0, MAX_PARTY_OPTIONS);
  const dataset = GAME_PARTY_DATASET[game];
  const optionDataset = options[0] ? { gameVersion: options[0].gameVersion, dataAsOf: options[0].dataAsOf, updatedAt: options[0].updatedAt } : dataset;
  return { ...optionDataset, options };
}

export function assertPartyCatalogIntegrity() {
  return Object.entries(CHARACTER_GUIDE_CATALOG)
    .filter(([game, names]) => (game === "hsr" || game === "genshin" || game === "zzz") && Array.isArray(names))
    .every(([game, names]) => (names as readonly string[]).every((name) => {
    const options = partyRecommendationsFor(game as PartyGameId, name).options;
    return options.length > 0 && options.length <= MAX_PARTY_OPTIONS && options.every((entry, index) => entry.rank === index + 1 && entry.members.some((partyMember) => partyMember.name.ja === name) && entry.communitySources.length > 0);
  }));
}
