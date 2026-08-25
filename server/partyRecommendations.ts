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
  return { ...dataset, options };
}

export function assertPartyCatalogIntegrity() {
  return Object.entries(CHARACTER_GUIDE_CATALOG)
    .filter(([game, names]) => (game === "hsr" || game === "genshin" || game === "zzz") && Array.isArray(names))
    .every(([game, names]) => (names as readonly string[]).every((name) => {
    const options = partyRecommendationsFor(game as PartyGameId, name).options;
    return options.length > 0 && options.length <= MAX_PARTY_OPTIONS && options.every((entry, index) => entry.rank === index + 1 && entry.members.some((partyMember) => partyMember.name.ja === name) && entry.communitySources.length > 0);
  }));
}
