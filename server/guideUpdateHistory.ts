import { CHARACTER_GUIDE_CATALOG, type CatalogGameId } from "./characterGuideCatalog";
import { CHARACTER_GUIDE_METADATA } from "./characterGuideMetadata";
import { characterUpdateLedger } from "./characterUpdateLedger";

export type GuideUpdateEvent = {
  date: string;
  scope: "site" | "character";
  title: string;
  summary: string;
  changes: string[];
  rationale: string;
  games: CatalogGameId[];
};

const CURRENT_BASELINE = "2026-08-18";

const SITE_EVENTS: GuideUpdateEvent[] = [
  {
    date: "2026-08-18T02:50:00+09:00",
    scope: "site",
    title: "3タイトルの公開UID照会を統合",
    summary: "崩壊：スターレイル、原神、ゼンレスゾーンゼロを同一の照会画面で切り替えられるようにしました。",
    changes: ["ゲーム別UID照会アダプターを追加", "武器・遺物・ドライバディスクの表示をゲーム別に正規化"],
    rationale: "公開プロフィールの装備評価を、タイトル横断で同じ操作手順へ統一するため。",
    games: ["hsr", "genshin", "zzz"],
  },
  {
    date: "2026-08-18T04:10:00+09:00",
    scope: "site",
    title: "ZZZの推定最終ステータスを更新",
    summary: "エージェント基礎値、音動機、コア強化、ドライバディスクとセット効果を合算する比較へ更新しました。",
    changes: ["最終HP・攻撃力・会心系の合算ロジックを追加", "戦闘中・条件付き効果を判定外として明示"],
    rationale: "ゲーム内の公開ステータス画面に近い、装備評価の基礎値を表示するため。",
    games: ["zzz"],
  },
  {
    date: "2026-08-18T06:20:00+09:00",
    scope: "site",
    title: "キャラクター別の有効ステータスへ移行",
    summary: "ロール共通の固定値から、キャラクターごとの有効ステータスと目標水準を選択する方式へ移行しました。",
    changes: ["ZZZ・原神・HSRの個別ガイドを追加", "個別優先度と戦闘中補正の扱いを注記"],
    rationale: "同じロールでも必要な会心・異常・チャージ・耐久ステータスが異なるため。",
    games: ["hsr", "genshin", "zzz"],
  },
  {
    date: "2026-08-18T08:10:00+09:00",
    scope: "site",
    title: "全キャラクター個別ガイドを基準化",
    summary: "HSR 81件、原神109件、ZZZ 58件の目標プロファイル、参照範囲、基準日、更新日を統一しました。",
    changes: ["全248件へ個別プロファイルを割当", "採用プロファイルと参照範囲をキャラクター単位で記録"],
    rationale: "ロール共通の固定目標ではなく、公開プロフィールで確認しやすいキャラクター固有の有効ステータスへ移行するため。",
    games: ["hsr", "genshin", "zzz"],
  },
  {
    date: "2026-08-18T08:20:00+09:00",
    scope: "site",
    title: "データ時点の表示を追加",
    summary: "各キャラクターの目標ステータスに、データ基準日・最終更新日・参照範囲を表示するようにしました。",
    changes: ["目標ステータス表に基準日・最終更新日を表示", "参照範囲を画面と対応表に記録"],
    rationale: "目標値がどの時点の公開ガイドに基づくかを、照会時に確認できるようにするため。",
    games: ["hsr", "genshin", "zzz"],
  },
];

const CHARACTER_CHANGE_EVENTS: Partial<Record<CatalogGameId, Record<string, GuideUpdateEvent[]>>> = {
  zzz: {
    "0号・アンビー": [{ date: "2026-08-18T06:20:00+09:00", scope: "character", title: "会心・攻撃力の個別目標へ移行", summary: "会心率・会心ダメージ・最終攻撃力の比較へ更新しました。", changes: ["強攻共通の比較から会心・攻撃力の3項目へ変更", "戦闘中補正を判定外として注記"], rationale: "追加攻撃の戦闘外ビルドをより直接的に評価するため。", games: ["zzz"] }],
    "ビビアン": [{ date: "2026-08-18T06:20:00+09:00", scope: "character", title: "異常マスタリー優先の個別目標へ移行", summary: "会心系を主判定から外し、異常マスタリー・攻撃力を比較します。", changes: ["主判定を異常マスタリーと攻撃力へ変更", "会心系を補助値として扱う注記を追加"], rationale: "異常ダメージへの寄与を優先して比較するため。", games: ["zzz"] }],
  },
  genshin: {
    "ナヒーダ": [{ date: "2026-08-18T06:20:00+09:00", scope: "character", title: "元素熟知を軸とする個別目標を更新", summary: "元素熟知・会心率・会心ダメージの比較を登録しました。", changes: ["元素熟知の目標を専用値に設定", "反応・武器による変動を注記"], rationale: "元素反応における元素熟知の重要度を比較へ反映するため。", games: ["genshin"] }],
  },
  hsr: {
    "ホタル": [{ date: "2026-08-18T06:20:00+09:00", scope: "character", title: "超撃破向けの目標を更新", summary: "撃破特効・速度・攻撃力%を専用の比較項目として登録しました。", changes: ["撃破特効を最優先として設定", "超撃破に不要な会心を主判定から除外"], rationale: "超撃破ビルドの主要な到達条件を優先して確認するため。", games: ["hsr"] }],
  },
};

const BATCH_2_UPDATED_NAMES: Record<CatalogGameId, readonly string[]> = {
  hsr: ["ロビン", "ルアン・メェイ", "飛霄"],
  genshin: ["アルレッキーノ", "ヌヴィレット", "夜蘭"],
  zzz: ["月城柳", "アストラ", "ライト", "レミエール"],
};

const BATCH_1_REVIEWED_NAMES: Record<CatalogGameId, readonly string[]> = {
  hsr: ["アグライア", "アナイクス", "キャストリス", "ホタル"],
  genshin: ["フリーナ", "楓原万葉", "ベネット", "シロネン"],
  zzz: ["星見雅", "浮波柚葉"],
};

function batch2UpdateEvent(game: CatalogGameId, name: string): GuideUpdateEvent | undefined {
  if (!BATCH_2_UPDATED_NAMES[game].includes(name)) return undefined;
  return {
    date: "2026-08-25T12:14:00+09:00",
    scope: "character",
    title: "第2バッチ：個別ビルド・凸・推奨PTを再精査",
    summary: `${name}の公開プロフィールで比較する目標値、全6段階の凸効果、最大3案の推奨PTを更新日付き個別ガイドで照合しました。`,
    changes: ["ロール共通の目標値を個別ビルドへ置換", "全6段階の凸効果を追加", "条件付きの戦闘内効果を公開値から分離", "最新の個別根拠で推奨PTを更新"],
    rationale: "ビルド・凸・編成の前提をキャラクターごとに明確化し、公開プロフィールと混同しない比較にするため。",
    games: [game],
  };
}

function batch1ReviewEvent(game: CatalogGameId, name: string): GuideUpdateEvent | undefined {
  if (!BATCH_1_REVIEWED_NAMES[game].includes(name)) return undefined;
  return {
    date: "2026-08-25T12:35:00+09:00",
    scope: "character",
    title: "第1バッチ：個別ビルド・凸・推奨PTを再監査",
    summary: `${name}の初回バッチを、最新の更新日付き個別ガイドで再照合し、公開値・戦闘内補正・推奨PTの分離を見直しました。`,
    changes: ["個別ビルドの目標値・主ステータス・条件注記を再確認", "全6段階の凸効果を更新日付き根拠と照合", "戦闘中・条件付きの効果を公開プロフィール値から分離", "最大3案の推奨PTを個別ガイドと照合"],
    rationale: "初回適用データも同一基準で再点検し、キャラクター固有の条件が汎用目標へ混入しないようにするため。",
    games: [game],
  };
}

export function guideUpdateHistory() {
  const games: CatalogGameId[] = ["hsr", "genshin", "zzz"];
  const characters = games.flatMap((game) => CHARACTER_GUIDE_CATALOG[game].map((name) => {
    const metadata = CHARACTER_GUIDE_METADATA[game][name];
    return {
      game,
      name,
      profileId: metadata.profileId,
      dataAsOf: metadata.dataAsOf,
      updatedAt: metadata.updatedAt,
      sourceLabel: metadata.sourceLabel,
      events: [
        ...(CHARACTER_CHANGE_EVENTS[game]?.[name] ?? []),
        ...(batch2UpdateEvent(game, name) ? [batch2UpdateEvent(game, name)!] : []),
        ...(batch1ReviewEvent(game, name) ? [batch1ReviewEvent(game, name)!] : []),
        {
        date: metadata.updatedAt,
        scope: "character" as const,
        title: "個別目標ステータスの基準を登録",
        summary: `採用プロファイル: ${metadata.profileId}。公開プロフィールで比較可能な戦闘外の目標値を設定しました。`,
        changes: ["profileId・参照範囲・基準日・更新日を記録"],
        rationale: "目標値の時点と比較条件を、キャラクターごとに追跡可能にするため。",
        games: [game],
      }],
    };
  }));
  return { currentBaseline: CURRENT_BASELINE, siteEvents: SITE_EVENTS, characters, updateLedger: characterUpdateLedger() };
}
