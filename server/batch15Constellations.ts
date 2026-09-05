import type { CharacterGameId } from "./characterIdentity";
import type { ConstellationEffect, ConstellationProfile, LocalizedText } from "./characterConstellations";
import { BATCH15_DATE } from "./batch15Guides";

const t = (ja: string, en = ja, zh = ja): LocalizedText => ({ ja, en, "zh-CN": zh });
const effect = (level: 1 | 2 | 3 | 4 | 5 | 6, description: string): ConstellationEffect => ({
  level,
  name: t(`${level}段階`, `Rank ${level}`, `第${level}阶段`),
  description: t(description),
  caution: t("戦闘中・条件付き効果は公開プロフィール値へ自動加算しない。", "Conditional combat effects are not added to public-profile stats.", "战斗内条件效果不会自动计入公开面板。"),
});

type Spec = { sourceUrl: string; effects: [string, string, string, string, string, string] };

const SPECS: Record<string, Spec> = {
  "hsr:御空": { sourceUrl: "https://game8.jp/houkaistarrail/526440", effects: [
    "戦闘開始時、味方全体の速度+10%、2ターン。", "任意の味方のEPが満タンになると御空がEPを5回復。味方ごとに1回、御空の必殺技後に回数リセット。", "戦闘スキルLv.+2、通常攻撃Lv.+1。", "鳴弦号令がある間、御空の与ダメージ+30%。", "必殺技Lv.+2、天賦Lv.+2。", "必殺技発動時、先に鳴弦号令を1層獲得する。",
  ]},
  "hsr:三月なのか": { sourceUrl: "https://game8.jp/houkaistarrail/524695", effects: [
    "必殺技で敵を凍結するたびEPを6回復。", "戦闘開始時、残りHP割合が最も低い味方へ防御力24%+320のバリアを3ターン付与。", "必殺技Lv.+2、通常攻撃Lv.+1。", "各ターンのカウンター発動回数+1。カウンターダメージ基礎値に防御力30%分を追加。", "戦闘スキルLv.+2、天賦Lv.+2。", "戦闘スキルのバリアで守られた味方は、自ターンごとに最大HP4%+106回復。",
  ]},
  "hsr:長夜月": { sourceUrl: "https://game8.jp/houkaistarrail/708951", effects: [
    "敵数に応じて味方記憶精霊の与ダメージ倍率を強化し、単体時は最大150%相当まで上昇。", "長夜月と記憶精霊の会心ダメージ+40%。憶質獲得量と必殺技の至暗の謎チャージも増加。", "戦闘スキルLv.+2、通常攻撃Lv.+1、記憶精霊天賦Lv.+1。", "味方記憶精霊の弱点撃破効率+25%、自身の記憶精霊はさらに+25%。", "必殺技Lv.+2、天賦Lv.+2、記憶精霊スキルLv.+1。", "味方全体の全属性耐性貫通+20%。記憶精霊攻撃後に消費した憶質の一部を回復。",
  ]},
  "hsr:停雲": { sourceUrl: "https://game8.jp/houkaistarrail/524678", effects: [
    "賜福状態の味方が必殺技を発動した後、速度+20%、1ターン。", "賜福状態の味方が敵を倒すとEPを5回復。1ターンに1回。", "必殺技Lv.+2、通常攻撃Lv.+1。", "賜福による付加ダメージ倍率+20%。", "戦闘スキルLv.+2、天賦Lv.+2。", "必殺技が対象へ回復するEPをさらに+10（合計60）。",
  ]},
  "hsr:白露": { sourceUrl: "https://game8.jp/houkaistarrail/523995", effects: [
    "生生終了時、その味方が満HPならEPを8回復。", "必殺技発動後、白露の治癒量+15%、2ターン。", "戦闘スキルLv.+2、天賦Lv.+2。", "戦闘スキルで治癒を受けた味方の与ダメージ+10%、最大3層、2ターン。", "必殺技Lv.+2、通常攻撃Lv.+1。", "一度の戦闘で蘇生効果の発動可能回数+1。",
  ]},
  "hsr:緋英": { sourceUrl: "https://game8.jp/houkaistarrail/756941", effects: [
    "全属性耐性貫通+20%。Fox先生の攻撃後に追加の愉悦スキルを発動し、褒美獲得も増加。", "会心ダメージ+36%。褒美の獲得効率を強化。", "必殺技Lv.+2、通常攻撃Lv.+1、愉悦スキルLv.+1。", "与えるダメージが敵の防御力15%を無視。", "戦闘スキルLv.+2、天賦Lv.+2、愉悦スキルLv.+1。", "褒美の継続ターン+1。愉悦ダメージを増やし、褒美量に応じて追加強化。初回必殺技後に固定EPを回復する効果も追加。",
  ]},
  "hsr:彦卿": { sourceUrl: "https://game8.jp/houkaistarrail/524675", effects: [
    "凍結状態の敵へ攻撃すると、攻撃力60%分の氷属性付加ダメージ。", "智剣連心中、EP回復効率+10%。", "戦闘スキルLv.+2、通常攻撃Lv.+1。", "HP80%以上の時、氷属性耐性貫通+12%。", "必殺技Lv.+2、天賦Lv.+2。", "必殺技の強化効果中に敵を倒すと、その強化効果の継続ターン+1。",
  ]},
  "hsr:姫子": { sourceUrl: "https://game8.jp/houkaistarrail/524693", effects: [
    "乗勝追撃発動後、速度+20%、2ターン。", "HP50%以下の敵への与ダメージ+15%。", "戦闘スキルLv.+2、通常攻撃Lv.+1。", "戦闘スキルで敵を弱点撃破するとチャージを追加で1獲得。", "必殺技Lv.+2、天賦Lv.+2。", "必殺技のヒット数+2。追加ヒットはランダムな敵へ本来の40%分の炎属性ダメージ。",
  ]},
  "genshin:ディルック": { sourceUrl: "https://game8.jp/genshin/352605", effects: [
    "HP50%超の敵への与ダメージ+15%。", "ダメージを受けると攻撃力+10%、攻撃速度+5%、10秒。最大3層。", "元素スキルLv.+3。", "元素スキル発動2秒後、次の元素スキルダメージ+40%、2秒。", "元素爆発Lv.+3。", "元素スキル後6秒以内、次の通常攻撃2回の攻撃速度+30%、ダメージ+30%。元素スキルで通常コンボをリセットしなくなる。",
  ]},
  "genshin:ドゥリン": { sourceUrl: "https://game8.jp/genshin/707122", effects: [
    "元素爆発の形態に応じて輪廻啓発を20層付与。白焔では味方の各種攻撃、黒蝕では自身の元素爆発ダメージを攻撃力参照で強化。", "元素爆発後20秒間、蒸発・溶解・燃焼・過負荷・炎拡散・炎結晶などを起点に対応元素ダメージ+50%、6秒。", "元素爆発Lv.+3。", "元素爆発ダメージ+40%。1凸の輪廻啓発消費が30%で消費されない。", "元素スキルLv.+3。", "元素爆発ダメージが敵防御力30%を無視。白焔は敵防御力-30%、黒蝕は追加で防御力40%を無視。",
  ]},
  "genshin:トーマ": { sourceUrl: "https://game8.jp/genshin/395527", effects: [
    "トーマ以外のシールド中の味方が被弾すると、元素スキルと元素爆発のクールタイム-3秒。20秒ごとに1回。", "元素爆発の継続時間+3秒。", "元素スキルLv.+3。", "元素爆発発動時、元素エネルギー15回復。", "元素爆発Lv.+3。", "シールド獲得/更新時、チーム全員の通常・重撃・落下攻撃ダメージ+15%、6秒。",
  ]},
  "genshin:ドリー": { sourceUrl: "https://game8.jp/genshin/466770", effects: [
    "元素スキルの追撃弾+1。", "ランプ精がリンク対象を治療すると、対象から攻撃力50%分のジンニー砲を発射。", "元素爆発Lv.+3。", "リンク対象がHP50%未満なら受ける治療効果+50%、元素エネルギー50%未満なら元素チャージ効率+30%。", "元素スキルLv.+3。", "元素スキル後3秒、雷元素付与を獲得。通常攻撃命中でチーム全員をドリーの最大HP4%分回復。",
  ]},
  "genshin:ナヴィア": { sourceUrl: "https://game8.jp/genshin/539458", effects: [
    "元素スキルで裂晶の欠片を1個消費するごとにEP3回復、元素爆発CT-1秒。最大EP9/CT3秒。", "元素スキルで裂晶の欠片1個につき会心率+12%、最大36%。命中時に元素爆発扱いの火力支援を追加。", "元素スキルLv.+3。", "元素爆発命中で敵の岩元素耐性-20%、8秒。", "元素爆発Lv.+3。", "元素スキルで3個を超えて消費した裂晶の欠片1個につき会心ダメージ+45%。超過分の欠片を返還。",
  ]},
  "genshin:ニィロウ": { sourceUrl: "https://game8.jp/genshin/468761", effects: [
    "元素スキルの水月ダメージ+65%、水環の継続時間+6秒。", "金盃の豊穣中、水ダメージ後に水耐性-35%、開花/月開花ダメージ後に草耐性-35%。各10秒。", "元素爆発Lv.+3。", "元素スキル3段目命中でEP15回復、元素爆発ダメージ+50%、8秒。", "元素スキルLv.+3。", "最大HP1000ごとに会心率+0.6%、会心ダメージ+1.2%。上限は会心率30%/会心ダメージ60%。",
  ]},
  "genshin:ネフェル": { sourceUrl: "https://game8.jp/genshin/707118", effects: [
    "幻の戯による月開花反応の基礎ダメージを元素熟知60%分加算。", "偽りの帳の継続時間+5秒、最大5層。幻の戯が最大140%相当まで強化され、5層時に元素熟知+200、8秒。", "元素スキルLv.+3。", "影の舞中、草露獲得速度+25%。周囲の敵の草元素耐性-20%。", "元素爆発Lv.+3。", "幻の戯の追加段を月開花扱いへ強化し、元素熟知参照の追加範囲ダメージを発生。月兆・満照時は月開花ダメージ+15%。",
  ]},
  "genshin:ノエル": { sourceUrl: "https://game8.jp/genshin/352610", effects: [
    "大掃除と護心鎧が同時に有効な時、護心鎧のHP回復発動率100%。", "重撃のスタミナ消費-20%、重撃ダメージ+15%。", "元素スキルLv.+3。", "護心鎧終了/破壊時、周囲へ攻撃力400%分の岩元素ダメージ。", "元素爆発Lv.+3。", "大掃除発動時、防御力50%相当を追加で攻撃力へ変換。敵撃破ごとに継続時間+1秒、最大10秒。",
  ]},
  "zzz:猫又": { sourceUrl: "https://game8.jp/zenless/607805", effects: [
    "背面攻撃時、敵の物理属性ダメージ耐性を16%無視。ブレイク中の敵への攻撃はすべて背面扱い。", "敵が1体のみで自身が出場中、エネルギー獲得効率+25%。", "主要スキルLv.+2。", "強化特殊スキル発動時、会心率+7%、最大2層、各15秒。", "主要スキルLv.+2。", "連携/終結を起点に会心ダメージを段階強化し、敵撃破時は最大層まで即時獲得。",
  ]},
  "zzz:盤岳": { sourceUrl: "https://game8.jp/zenless/723895", effects: [
    "強化特殊で戦慄を付与し炎耐性-10%。対象への透徹ダメージ+10%、山嵐でブレイク時間を2秒延長。", "コアの会心ダメージ補正+15%、炎属性ダメージ補正+15%。怒髪天中の強化特殊でアドレナリン5回復。", "主要スキルLv.+2。", "強化特殊の主要派生と通常攻撃の傾山/山嵐のダメージ+30%。", "主要スキルLv.+2。", "強化特殊で明王を獲得し炎属性ダメージ補正を追加+8%、30秒。山嵐で透徹力600%分の追加炎ダメージ。",
  ]},
  "zzz:葉瞬光": { sourceUrl: "https://game8.jp/zenless/682698", effects: [
    "入場時に青溟剣勢6Pt。合一の与ダメージを追加+10%、敵防御力を20%無視。", "器量/圧巻の上限を拡張。澄心境中の剣勢消費で圧巻を獲得し、強化特殊と終結が敵防御力40%を無視。", "主要スキルLv.+2。", "入場時デシベル1000Pt。エーテルベール・決裁の弱体倍率上限が200%。", "主要スキルLv.+2。", "ともし火の願いを蓄積し、特定条件で終結スキルへ変換。強化特殊/終結の最終段に攻撃力1500%分の追加物理ダメージ。",
  ]},
  "zzz:潘引壺": { sourceUrl: "https://game8.jp/zenless/682680", effects: [
    "全ユニットが絶気状態の敵へ与えるダメージ+10%。", "剛破6Pt消費ごとにエネルギー4回復。特殊スキルの絶気継続時間を12秒へ延長。", "主要スキルLv.+2。", "終結の即時/持続回復効果+25%。非常食備蓄を獲得し、味方HP減少時に追加回復。", "主要スキルLv.+2。", "コアの覚醒が追加で攻撃力6%分の透徹力を付与し、この追加分は最大720Pt。",
  ]},
};

function versionFor(game: CharacterGameId) { return game === "hsr" ? "4.5" : game === "genshin" ? "7.0" : "3.1"; }
function rankLabel(game: CharacterGameId) {
  return game === "hsr" ? t("星魂", "Eidolon", "星魂") : game === "genshin" ? t("命ノ星座", "Constellation", "命座") : t("心象映画", "Mindscape Cinema", "意象影画");
}

export function batch15ConstellationFor(game: CharacterGameId, name: string, acquiredRank: number | null): ConstellationProfile | null {
  const spec = SPECS[`${game}:${name}`];
  if (!spec) return null;
  return {
    rankLabel: rankLabel(game), acquiredRank: Math.max(0, Math.min(6, acquiredRank ?? 0)), dataStatus: "curated", gameVersion: versionFor(game), dataAsOf: BATCH15_DATE, updatedAt: BATCH15_DATE,
    sourceLabel: t("Game8の更新日付き個別データを照合", "Cross-checked dated Game8 character data", "已核对Game8带日期的角色数据"), sourceUrl: spec.sourceUrl,
    effects: spec.effects.map((description, index) => effect((index + 1) as 1 | 2 | 3 | 4 | 5 | 6, description)), activeTargetChanges: [],
  };
}
