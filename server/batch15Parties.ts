import type { CharacterGameId } from "./characterIdentity";
import type { LocalizedText, PartyMember, PartyRecommendation, PartyRecommendationSet } from "./partyRecommendations";
import { BATCH15_DATE } from "./batch15Guides";

const t = (ja: string, en = ja, zh = ja): LocalizedText => ({ ja, en, "zh-CN": zh });
type TeamSpec = { sourceUrl: string; teams: [string[], string[], string[]] };

const SPECS: Record<string, TeamSpec> = {
  "hsr:御空": { sourceUrl: "https://game8.jp/houkaistarrail/526440", teams: [["丹恒・飲月", "御空", "花火", "羅刹"], ["Dr.レイシオ", "御空", "ペラ", "アベンチュリン"], ["青雀", "御空", "停雲", "リンクス"]] },
  "hsr:三月なのか": { sourceUrl: "https://game8.jp/houkaistarrail/524695", teams: [["彦卿", "三月なのか", "停雲", "ギャラガー"], ["クラーラ", "三月なのか", "ロビン", "リンクス"], ["丹恒", "三月なのか", "アスター", "ナターシャ"]] },
  "hsr:長夜月": { sourceUrl: "https://game8.jp/houkaistarrail/708951", teams: [["長夜月", "ロビン・夏空の歌", "キュレネ", "ヒアンシー"], ["長夜月", "キュレネ", "サンデー", "ヒアンシー"], ["長夜月", "記憶主人公", "トリビー", "フォフォ"]] },
  "hsr:停雲": { sourceUrl: "https://game8.jp/houkaistarrail/524678", teams: [["景元", "停雲", "サンデー", "符玄"], ["アルジェンティ", "停雲", "花火", "フォフォ"], ["丹恒", "停雲", "アスター", "ギャラガー"]] },
  "hsr:白露": { sourceUrl: "https://game8.jp/houkaistarrail/523995", teams: [["刃", "ブローニャ", "記憶主人公", "白露"], ["姫子", "ヘルタ", "アスター", "白露"], ["彦卿", "停雲", "ペラ", "白露"]] },
  "hsr:緋英": { sourceUrl: "https://game8.jp/houkaistarrail/756941", teams: [["緋英", "愉悦主人公", "爻光", "フォフォ"], ["緋英", "爻光", "ロビン・夏空の歌", "フォフォ"], ["緋英", "愉悦主人公", "花火", "フォフォ"]] },
  "hsr:彦卿": { sourceUrl: "https://game8.jp/houkaistarrail/524675", teams: [["彦卿", "サンデー", "ケリュドラ", "丹恒・騰荒"], ["彦卿", "ロビン", "ペラ", "アベンチュリン"], ["彦卿", "停雲", "三月なのか", "ギャラガー"]] },
  "hsr:姫子": { sourceUrl: "https://game8.jp/houkaistarrail/524693", teams: [["姫子", "姫子・旅立ち", "トリビー", "フォフォ"], ["姫子", "帰忘の流離人", "ダリア", "霊砂"], ["姫子", "ヘルタ", "アスター", "ギャラガー"]] },

  "genshin:ディルック": { sourceUrl: "https://game8.jp/genshin/352605", teams: [["ディルック", "フリーナ", "閑雲", "ベネット"], ["ディルック", "夜蘭", "行秋", "ベネット"], ["ディルック", "ガイア", "スクロース", "ベネット"]] },
  "genshin:ドゥリン": { sourceUrl: "https://game8.jp/genshin/707122", teams: [["ドゥリン", "ムアラニ", "シロネン", "シグウィン"], ["ドゥリン", "キィニチ", "エミリエ", "ベネット"], ["ドゥリン", "クロリンデ", "シュヴルーズ", "ベネット"]] },
  "genshin:トーマ": { sourceUrl: "https://game8.jp/genshin/395527", teams: [["リオセスリ", "エミリエ", "トーマ", "ベネット"], ["神里綾人", "ナヒーダ", "トーマ", "白朮"], ["宵宮", "夜蘭", "雲菫", "トーマ"]] },
  "genshin:ドリー": { sourceUrl: "https://game8.jp/genshin/466770", teams: [["セノ", "ナヒーダ", "フリーナ", "ドリー"], ["エウルア", "雷電将軍", "ロサリア", "ドリー"], ["リサ", "旅人", "行秋", "ドリー"]] },
  "genshin:ナヴィア": { sourceUrl: "https://game8.jp/genshin/539458", teams: [["ナヴィア", "フリーナ", "シロネン", "ベネット"], ["ナヴィア", "ドゥリン", "シロネン", "ベネット"], ["ナヴィア", "凝光", "香菱", "ベネット"]] },
  "genshin:ニィロウ": { sourceUrl: "https://game8.jp/genshin/468761", teams: [["ニィロウ", "ナヒーダ", "ラウマ", "珊瑚宮心海"], ["ニィロウ", "ナヒーダ", "コレイ", "バーバラ"], ["ニィロウ", "旅人", "ヨォーヨ", "行秋"]] },
  "genshin:ネフェル": { sourceUrl: "https://game8.jp/genshin/707118", teams: [["ネフェル", "ラウマ", "コロンビーナ", "ニィロウ"], ["ネフェル", "ナヒーダ", "コロンビーナ", "珊瑚宮心海"], ["ネフェル", "ナヒーダ", "行秋", "白朮"]] },
  "genshin:ノエル": { sourceUrl: "https://game8.jp/genshin/352610", teams: [["ノエル", "フリーナ", "ゴロー", "夜蘭"], ["ノエル", "シロネン", "フリーナ", "夜蘭"], ["ノエル", "ゴロー", "雲菫", "アルベド"]] },

  "zzz:猫又": { sourceUrl: "https://game8.jp/zenless/607805", teams: [["千夏", "猫又", "ノルムー"], ["アストラ", "猫又", "プルクラ"], ["アンビー", "ニコ", "猫又"]] },
  "zzz:盤岳": { sourceUrl: "https://game8.jp/zenless/723895", teams: [["リュシア", "盤岳", "ダイアリン"], ["盤岳", "ライト", "オルペウス&「鬼火」"], ["盤岳", "潘引壺", "プルクラ"]] },
  "zzz:葉瞬光": { sourceUrl: "https://game8.jp/zenless/682698", teams: [["千夏", "葉瞬光", "ダイアリン"], ["葉瞬光", "橘福福", "トリガー"], ["葉瞬光", "ザオ", "ニコ"]] },
  "zzz:潘引壺": { sourceUrl: "https://game8.jp/zenless/682680", teams: [["儀玄", "橘福福", "潘引壺"], ["儀玄", "アストラ", "潘引壺"], ["猫又", "プルクラ", "潘引壺"]] },
};

function member(name: string, selected: string): PartyMember {
  return { name: t(name), role: name === selected ? t("主軸", "Core", "核心") : t("相性枠", "Synergy slot", "协同位") };
}
function versionFor(game: CharacterGameId) { return game === "hsr" ? "4.5" : game === "genshin" ? "7.0" : "3.1"; }
function title(rank: 1 | 2 | 3) { return rank === 1 ? t("現行推奨", "Current recommendation", "当前推荐") : rank === 2 ? t("代替編成", "Alternative", "替代阵容") : t("所持対応", "Accessible option", "持有适配"); }
function option(game: CharacterGameId, selected: string, sourceUrl: string, names: string[], rank: 1 | 2 | 3): PartyRecommendation {
  return {
    id: `batch15-${game}-${selected}-${rank}`, rank, title: title(rank), members: names.map((name) => member(name, selected)),
    synergy: [t("更新日付き個別ガイドの役割・相性を基準に、対象キャラクターを必ず含む編成として整理。", "Built from the dated character guide and always includes the selected character.", "依据带日期的角色指南整理，并始终包含目标角色。")],
    targetChanges: [],
    targetSummary: t("編成・凸・戦闘中バフは公開プロフィールの現在値へ自動加算しない。", "Team, constellation and in-combat buffs are not added to public-profile stats.", "队伍、命座与战斗内增益不会自动计入公开面板。"),
    gameVersion: versionFor(game), dataAsOf: BATCH15_DATE, updatedAt: BATCH15_DATE,
    sourceLabel: t("Game8の更新日付き個別ガイドを照合", "Cross-checked dated Game8 guide", "已核对Game8带日期的角色指南"), sourceUrl, communitySources: [],
  };
}
export function batch15PartyFor(game: CharacterGameId, name: string): PartyRecommendationSet | null {
  const spec = SPECS[`${game}:${name}`];
  if (!spec) return null;
  return { gameVersion: versionFor(game), dataAsOf: BATCH15_DATE, updatedAt: BATCH15_DATE, options: spec.teams.map((names, index) => option(game, name, spec.sourceUrl, names, (index + 1) as 1 | 2 | 3)) };
}
