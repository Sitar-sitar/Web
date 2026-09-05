import type { GuideDefinition, TargetStatDefinition } from "./buildAdvisor";
import type { CharacterGameId } from "./characterIdentity";

export const BATCH15_DATE = "2026-09-05";

type GuidePatch = Omit<Partial<GuideDefinition>, "targets"> & { targets?: TargetStatDefinition[] };

const target = (
  key: TargetStatDefinition["key"],
  label: string,
  unit: TargetStatDefinition["unit"],
  strict: number,
  goal: number,
  baseline: number,
): TargetStatDefinition => ({ key, label, unit, targets: { "厳選": strict, "目標": goal, "妥協": baseline } });

const PATCHES: Record<string, GuidePatch> = {
  "hsr:御空": {
    headline: "鳴弦号令を主力の直前へ合わせるため、速度調整と会心支援を優先する。",
    relicSet: "仮想空間を漫遊するメッセンジャー ×2 / 荒地で盗みを働く廃土客 ×2",
    planarSet: "老いぬ者の仙舟 ×2 / 折れた竜骨 ×2",
    mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "虚数属性ダメージ / HP%" }, { slot: "連結縄", value: "EP回復効率" }],
    targetContext: "御空専用：主力アタッカーより僅かに速く動く速度調整を優先する。鳴弦号令、必殺技の会心率・会心ダメージ、星魂の速度・与ダメージは戦闘中効果として公開プロフィールへ加算しない。",
    sourceLabel: "Game8の更新日付き御空ビルド・星魂情報を照合", profileId: "curated:batch15:yukong",
  },
  "hsr:三月なのか": {
    headline: "存護の三月なのかとして、防御力を基盤にバリア・凍結・カウンターを安定させる。",
    relicSet: "純庭教会の聖騎士 ×4 / 雪の密林の狩人 ×2・聖騎士 ×2", planarSet: "ベロブルグの建築家 ×2 / 折れた竜骨 ×2",
    mainStats: [{ slot: "胴体", value: "防御力% / 効果命中" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "防御力%" }, { slot: "連結縄", value: "防御力% / EP回復効率" }],
    targets: [target("effectHitRate", "効果命中", "%", 60, 50, 40)],
    targetContext: "三月なのか（存護）専用：凍結を重視する場合は効果命中50%前後を目安にする。バリア対象へのヘイト、凍結、星魂のカウンター・回復など条件付き効果は公開プロフィールへ加算しない。",
    sourceLabel: "Game8の更新日付き三月なのか（存護）ビルド・星魂情報を照合", profileId: "curated:batch15:march-preservation",
  },
  "hsr:長夜月": {
    headline: "記憶精霊の火力と回転を支えるため、HP・会心ダメージを軸に速度型と低速HP型を使い分ける。", relicSet: "天地再創の救世主 ×4", planarSet: "静謐な拾骨地 ×2",
    mainStats: [{ slot: "胴体", value: "会心ダメ" }, { slot: "脚部", value: "HP% / 速度" }, { slot: "次元界オーブ", value: "氷属性ダメージ / HP%" }, { slot: "連結縄", value: "HP%" }],
    targetContext: "長夜月専用：記憶精霊、憶質、味方記憶精霊への補正、星魂の会心ダメージ・耐性貫通・弱点撃破効率は戦闘中または条件付きのため公開プロフィールへ加算しない。", sourceLabel: "Game8のVer4.5更新済み長夜月ビルド・星魂情報を照合", profileId: "curated:batch15-evernight",
  },
  "hsr:停雲": {
    headline: "賜福と必殺技の回転を安定させるため、攻撃力・速度・EP回復を優先する。", relicSet: "仮想空間を漫遊するメッセンジャー ×4 / 再び苦難の道を歩む司祭 ×4", planarSet: "老いぬ者の仙舟 ×2 / 海に沈んだルサカ ×2",
    mainStats: [{ slot: "胴体", value: "攻撃力%" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "攻撃力% / HP%" }, { slot: "連結縄", value: "EP回復効率" }],
    targetContext: "停雲専用：賜福の攻撃力補正、必殺技の与ダメージ・EP回復、E1速度などは戦闘中または対象依存のため公開プロフィールへ加算しない。", sourceLabel: "Game8の更新日付き停雲ビルド・星魂情報を照合", profileId: "curated:batch15:tingyun",
  },
  "hsr:白露": {
    headline: "最大HP依存の回復と蘇生を安定させるため、HP・速度・EP回復効率を優先する。", relicSet: "流雲無痕の過客 ×4 / 仮想空間を漫遊するメッセンジャー ×2・過客 ×2", planarSet: "老いぬ者の仙舟 ×2 / 折れた竜骨 ×2",
    mainStats: [{ slot: "胴体", value: "治癒量" }, { slot: "脚部", value: "速度" }, { slot: "次元界オーブ", value: "HP%" }, { slot: "連結縄", value: "EP回復効率 / HP%" }],
    targetContext: "白露専用：生生、蘇生、星魂によるEP回復・治癒量・与ダメージ上昇は戦闘中または条件付きのため公開プロフィールへ加算しない。", sourceLabel: "Game8の更新日付き白露ビルド・星魂情報を照合", profileId: "curated:batch15:bailu",
  },
  "hsr:緋英": {
    headline: "Ver4.5の愉悦アタッカーとして、公開値の会心率70%・会心ダメージ200%以上を基準に火力を整える。", relicSet: "功績輝く魔法少女 ×4", planarSet: "ステージゼロ：パンクロード ×2",
    mainStats: [{ slot: "胴体", value: "会心ダメ / 会心率" }, { slot: "脚部", value: "攻撃力% / 速度" }, { slot: "次元界オーブ", value: "炎属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力% / EP回復効率" }],
    targets: [target("critRate", "会心率", "%", 80, 70, 60), target("critDmg", "会心ダメ", "%", 230, 200, 180)],
    targetContext: "緋英専用：爻光モチーフ光円錐を装備する場合は公開会心率60%前後も実用圏。爆笑の褒美、味方愉悦、星魂の耐性貫通・防御無視・与ダメージは戦闘中条件として公開値へ加算しない。", sourceLabel: "Game8の2026-09-04更新済み緋英ビルド・星魂・編成情報を照合", profileId: "curated:batch15:hiei",
  },
  "hsr:彦卿": {
    headline: "智剣連心を維持して単体氷火力を伸ばすため、会心ダメージ・攻撃力を優先し、シールド役と組ませる。", relicSet: "知識の海に溺れる学者 ×4 / 雪の密林の狩人 ×4", planarSet: "自転が止まったサルソット ×2 / 星々の競技場 ×2",
    mainStats: [{ slot: "胴体", value: "会心ダメ" }, { slot: "脚部", value: "攻撃力% / 速度" }, { slot: "次元界オーブ", value: "氷属性ダメージ" }, { slot: "連結縄", value: "攻撃力%" }],
    targetContext: "彦卿専用：智剣連心の会心率・会心ダメージ、凍結、HP80%以上での星魂耐性貫通などは戦闘中条件のため公開プロフィールへ加算しない。", sourceLabel: "Game8の更新日付き彦卿ビルド・星魂・編成情報を照合", profileId: "curated:batch15:yanqing",
  },
  "hsr:姫子": {
    headline: "弱点撃破から追加攻撃を回す範囲アタッカーとして、公開値の会心率65%・会心ダメージ130%・攻撃力3,000を基準に整える。", relicSet: "灰燼を燃やし尽くす大公 ×4", planarSet: "荒涼の惑星ツガンニヤ ×2 / 自転が止まったサルソット ×2",
    mainStats: [{ slot: "胴体", value: "会心率 / 会心ダメ" }, { slot: "脚部", value: "攻撃力% / 速度" }, { slot: "次元界オーブ", value: "炎属性ダメージ / 攻撃力%" }, { slot: "連結縄", value: "攻撃力%" }],
    targets: [target("critRate", "会心率", "%", 75, 65, 55), target("critDmg", "会心ダメ", "%", 160, 130, 110), target("attack", "攻撃力", "", 3600, 3000, 2700)],
    targetContext: "姫子専用：攻撃力オーブ型は攻撃力3,600前後を上位目安とする。HP80%以上での会心率+15%、乗勝追撃、星魂の速度・与ダメージは戦闘中条件のため公開プロフィールへ加算しない。", sourceLabel: "Game8の2026-08-21更新済み姫子ビルド・星魂・編成情報を照合", profileId: "curated:batch15:himeko",
  },
  "genshin:ディルック": {
    headline: "炎元素通常・スキルを蒸発/溶解へ繋ぐメイン火力として、会心・攻撃力・元素熟知をバランス良く整える。", relicSet: "燃え盛る炎の魔女 ×4", planarSet: "蒸発/溶解編成を標準想定",
    mainStats: [{ slot: "時計", value: "攻撃力% / 元素熟知" }, { slot: "杯", value: "炎元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメ" }], targetContext: "ディルック専用：蒸発・溶解、炎付与、C1/C2/C4/C6の条件付き与ダメージ・攻撃速度・攻撃力は公開プロフィールへ加算しない。", sourceLabel: "Game8の2026-08更新済みディルックビルド・命ノ星座情報を照合", profileId: "curated:batch15:diluc",
  },
  "genshin:ドゥリン": {
    headline: "元素爆発を主軸にサブ火力/耐性デバフを担うため、攻撃力2,500を最優先し会心を整える。", relicSet: "旧貴族のしつけ ×4 / 絶縁の旗印 ×4", planarSet: "白焔サポート / 黒蝕蒸発・溶解を使い分け",
    mainStats: [{ slot: "時計", value: "攻撃力% / 元素チャージ効率" }, { slot: "杯", value: "炎元素ダメージ / 攻撃力%" }, { slot: "冠", value: "会心率 / 会心ダメ" }], targets: [target("attack", "攻撃力", "", 2800, 2500, 2300)],
    targetContext: "ドゥリン専用：固有天賦の元素爆発ダメージ補正が最大になる攻撃力2,500を公開値目標にする。1ローテ目を元素エネルギー0から始める特殊条件では元素チャージ効率約200%が目安だが、通常目標へ固定加算しない。", sourceLabel: "Game8のドゥリン個別ガイド・命ノ星座情報を照合", profileId: "curated:batch15:durin",
  },
  "genshin:トーマ": {
    headline: "シールド支援ではHP・元素チャージ、烈開花では元素熟知へ特化して役割を明確にする。", relicSet: "千岩牢固 ×2 / 絶縁の旗印 ×2（シールド） / 楽園の絶花 ×4（烈開花）", planarSet: "シールド型と烈開花型を混在させず選択",
    mainStats: [{ slot: "時計", value: "HP% / 元素チャージ効率 / 元素熟知（烈開花）" }, { slot: "杯", value: "HP% / 元素熟知（烈開花）" }, { slot: "冠", value: "HP% / 元素熟知（烈開花）" }], targetContext: "トーマ専用：シールド型はHP・元素チャージ、烈開花型は元素熟知を優先する。C6の通常/重撃/落下攻撃ダメージ+15%などは戦闘中バフとして公開値へ加算しない。", sourceLabel: "Game8の更新日付きトーマビルド・命ノ星座情報を照合", profileId: "curated:batch15:thoma",
  },
  "genshin:ドリー": {
    headline: "元素爆発による回復とエネルギー供給を安定させるため、元素チャージ効率とHPを優先する。", relicSet: "旧貴族のしつけ ×4 / 海染硨磲 ×4", planarSet: "回復・エネルギー支援を標準想定", mainStats: [{ slot: "時計", value: "元素チャージ効率 / HP%" }, { slot: "杯", value: "HP%" }, { slot: "冠", value: "与える治療効果 / HP%" }], targetContext: "ドリー専用：ランプの精による継続回復・元素エネルギー回復、C4の治療/元素チャージ補正、C6の雷付与と全体回復は戦闘中条件のため公開プロフィールへ加算しない。", sourceLabel: "Game8の更新日付きドリービルド・命ノ星座情報を照合", profileId: "curated:batch15:dori",
  },
  "genshin:ナヴィア": {
    headline: "結晶の裂晶の欠片を元素スキルへ集約する岩アタッカーとして、会心・攻撃力・岩元素ダメージを優先する。", relicSet: "残響の森で囁かれる夜話 ×4", planarSet: "結晶反応を継続して起こせる編成を標準想定", mainStats: [{ slot: "時計", value: "攻撃力%" }, { slot: "杯", value: "岩元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメ" }], targetContext: "ナヴィア専用：裂晶の欠片数、C2の元素スキル会心率最大+36%、C4の岩耐性低下、C6の会心ダメージは戦闘中条件のため公開プロフィールへ加算しない。", sourceLabel: "Game8の更新日付きナヴィアビルド・命ノ星座情報を照合", profileId: "curated:batch15:navia",
  },
  "genshin:ニィロウ": {
    headline: "豊穣の核の上限倍率へ近づけるため、開花運用ではHPを最優先し74,444を上位到達点とする。", relicSet: "千岩牢固 ×2 / 花海甘露の光 ×2", planarSet: "水元素+草元素のみの豊穣開花編成を標準想定", mainStats: [{ slot: "時計", value: "HP%" }, { slot: "杯", value: "HP%" }, { slot: "冠", value: "HP%" }], targets: [target("hp", "HP", "", 74444, 68000, 60000)], targetContext: "ニィロウ専用：HP30,000超過分で豊穣の核ダメージが上昇し、上限到達はHP74,444。武器により60,000〜74,444を現実的目標帯とする。C6の会心率・会心ダメージは条件付きのため公開目標へ加算しない。", sourceLabel: "Game8の更新日付きニィロウビルド・命ノ星座・豊穣開花情報を照合", profileId: "curated:batch15:nilou",
  },
  "genshin:ネフェル": {
    headline: "月開花と特殊重撃を主軸にする草アタッカーとして、元素熟知と会心を優先する。", relicSet: "天穹の顕現せし夜 ×4", planarSet: "月開花編成を標準想定", mainStats: [{ slot: "時計", value: "元素熟知" }, { slot: "杯", value: "元素熟知 / 草元素ダメージ" }, { slot: "冠", value: "会心ダメ / 会心率" }], targetContext: "ネフェル専用：偽りの帳、月兆・満照、C1/C2/C6の元素熟知参照月開花ダメージ、C4の草元素耐性低下は戦闘中条件のため公開プロフィールへ加算しない。", sourceLabel: "Game8のネフェル個別ガイド・命ノ星座・月開花情報を照合", profileId: "curated:batch15:nefer",
  },
  "genshin:ノエル": {
    headline: "防御力を攻撃・回復・シールドへ変換する岩アタッカーとして、防御力・会心・岩元素ダメージを優先する。", relicSet: "華館夢醒形骸記 ×4", planarSet: "岩共鳴・フリーナ支援など長時間の爆発運用を標準想定", mainStats: [{ slot: "時計", value: "防御力%" }, { slot: "杯", value: "岩元素ダメージ" }, { slot: "冠", value: "会心率 / 会心ダメ" }], targetContext: "ノエル専用：大掃除中の防御力→攻撃力変換、C1回復確定、C6の追加防御力50%相当の攻撃力変換と継続時間延長は戦闘中条件のため公開プロフィールへ加算しない。", sourceLabel: "Game8の更新日付きノエルビルド・命ノ星座情報を照合", profileId: "curated:batch15:noelle",
  },
  "zzz:猫又": {
    headline: "背面・ブレイク時の物理強攻として、会心・攻撃力を優先し短時間の高火力を伸ばす。", relicSet: "ウッドペッカー・エレクトロ ×4 / 獣牙のヘヴィメタル ×2", planarSet: "物理強攻ビルド", mainStats: [{ slot: "IV", value: "会心率 / 会心ダメ" }, { slot: "V", value: "物理属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }], targetContext: "猫又専用：背面判定、ブレイク中の背面扱い、M4会心率、M6会心ダメージは戦闘中条件のため公開プロフィールへ加算しない。", sourceLabel: "Game8の2026-09-04更新済み猫又ビルド・心象映画・編成情報を照合", profileId: "curated:batch15:nekomata",
  },
  "zzz:盤岳": {
    headline: "炎・命破アタッカーとして、HPと会心を整えつつ透徹ダメージを主軸にする。", relicSet: "雲嶽は我に似たり ×4 / ウッドペッカー・エレクトロ ×2", planarSet: "炎・命破ビルド", mainStats: [{ slot: "IV", value: "会心率" }, { slot: "V", value: "HP% / 炎属性ダメージ" }, { slot: "VI", value: "HP%" }], targetContext: "盤岳専用：戦慄、明王、怒髪天、M1/M2/M6の炎耐性低下・透徹ダメージ・会心ダメージ・炎ダメージ補正は戦闘中条件のため公開プロフィールへ加算しない。", sourceLabel: "Game8の2026-09-04更新済み盤岳ビルド・心象映画情報を照合", profileId: "curated:batch15:pangyue",
  },
  "zzz:葉瞬光": {
    headline: "凛刃・強攻の変身火力を伸ばすため、会心ダメージを軸に会心率と攻撃力を整える。", relicSet: "純白の行歌 ×4 / 折枝の刀歌 ×2", planarSet: "凛刃・強攻ビルド", mainStats: [{ slot: "IV", value: "会心ダメ" }, { slot: "V", value: "貫通率 / 物理属性ダメージ / 攻撃力%" }, { slot: "VI", value: "攻撃力%" }], targetContext: "葉瞬光専用：コア・ディスク由来の戦闘中会心率、合一、圧巻、M1/M2/M4/M6の防御無視・弱体倍率・追加ダメージは公開プロフィールへ加算しない。", sourceLabel: "Game8の2026-09-04更新済み葉瞬光ビルド・心象映画・編成情報を照合", profileId: "curated:batch15:ye-shunguang",
  },
  "zzz:潘引壺": {
    headline: "透徹力支援を最大化するため攻撃力3,000以上を最優先し、到達後はエネルギー回復を補う。", relicSet: "月光騎士の頌歌 ×4 / 攻撃力系2セット", planarSet: "命破支援ビルド", mainStats: [{ slot: "IV", value: "攻撃力%" }, { slot: "V", value: "攻撃力%" }, { slot: "VI", value: "攻撃力% / エネルギー自動回復" }], targets: [target("attack", "攻撃力", "", 3200, 3000, 2800)], targetContext: "潘引壺専用：透徹力バフの上限を得る攻撃力3,000以上を公開値目標にする。到達後はVIをエネルギー自動回復へ切り替え可能。絶気、覚醒、M6の追加透徹力は戦闘中効果として公開値へ加算しない。", sourceLabel: "Game8の2026-09-04更新済み潘引壺ビルド・心象映画・編成情報を照合", profileId: "curated:batch15:pan-yinhu",
  },
};

function mergeTargets(current: TargetStatDefinition[], overrides?: TargetStatDefinition[]) {
  if (!overrides?.length) return current;
  const byKey = new Map(current.map((entry) => [entry.key, entry]));
  for (const override of overrides) byKey.set(override.key, override);
  return [...byKey.values()];
}

export const BATCH15_CHARACTERS: Record<CharacterGameId, readonly string[]> = {
  hsr: ["御空", "三月なのか", "長夜月", "停雲", "白露", "緋英", "彦卿", "姫子"],
  genshin: ["ディルック", "ドゥリン", "トーマ", "ドリー", "ナヴィア", "ニィロウ", "ネフェル", "ノエル"],
  zzz: ["猫又", "盤岳", "葉瞬光", "潘引壺"],
};

export function batch15GuideFor(game: CharacterGameId, name: string, current: GuideDefinition): GuideDefinition | null {
  const patch = PATCHES[`${game}:${name}`];
  if (!patch) return null;
  return { ...current, ...patch, targets: mergeTargets(current.targets, patch.targets), dataAsOf: BATCH15_DATE, updatedAt: BATCH15_DATE };
}
