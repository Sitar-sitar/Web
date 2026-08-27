import { CHARACTER_GUIDE_CATALOG, type CatalogGameId } from "./characterGuideCatalog";

export type UpdateLedgerStatus = "reviewed" | "pending";

export type CharacterUpdateLedgerEntry = {
  game: CatalogGameId;
  name: string;
  status: UpdateLedgerStatus;
  batch: number | null;
};

export type CharacterUpdateLedger = {
  total: number;
  reviewed: number;
  pending: number;
  byGame: Record<CatalogGameId, { total: number; reviewed: number; pending: number }>;
  nextBatch: { id: number; names: CharacterUpdateLedgerEntry[] };
  criteria: string;
  entries: CharacterUpdateLedgerEntry[];
};

const REVIEWED_BATCHES: Record<number, Record<CatalogGameId, readonly string[]>> = {
  1: {
    hsr: ["アグライア", "アナイクス", "キャストリス", "ホタル"],
    genshin: ["フリーナ", "楓原万葉", "ベネット", "シロネン"],
    zzz: ["星見雅", "浮波柚葉"],
  },
  2: {
    hsr: ["ロビン", "ルアン・メェイ", "飛霄"],
    genshin: ["アルレッキーノ", "ヌヴィレット", "夜蘭"],
    zzz: ["月城柳", "アストラ", "ライト", "レミエール"],
  },
  3: {
    hsr: ["サンデー", "ブートヒル", "黄泉", "霊砂"],
    genshin: ["雷電将軍", "ナヒーダ", "鍾離"],
    zzz: ["ビビアン", "ジェーン", "エレン"],
  },
  4: {
    hsr: ["アベンチュリン", "トパーズ&カブ", "花火", "丹恒・飲月"],
    genshin: ["アルハイゼン", "胡桃", "久岐忍"],
    zzz: ["セス", "パイパー", "蒼角"],
  },
  5: {
    hsr: ["Dr.レイシオ", "カフカ", "ブラックスワン", "鏡流"],
    genshin: ["行秋", "香菱", "フィッシュル"],
    zzz: ["グレース", "バーニス", "ルーシー"],
  },
  6: {
    hsr: ["ブローニャ", "銀狼", "符玄", "羅刹"],
    genshin: ["白朮", "八重神子", "宵宮"],
    zzz: ["シーザー", "リナ", "青衣"],
  },
  7: {
    hsr: ["アーチャー", "アーラン", "アスター", "アルジェンティ"],
    genshin: ["アーロイ", "アイノ", "アルベド"],
    zzz: ["「11号」", "「シード」", "「トリガー」"],
  },
  8: {
    hsr: ["ヴェルト", "ギャラガー", "キュレネ", "ギルガメッシュ"],
    genshin: ["アンバー", "イアンサ", "イネファ"],
    zzz: ["0号・アンビー", "アリア", "アリス"],
  },
  9: {
    hsr: ["クラーラ", "ケリュドラ", "サフェル", "サンポ"],
    genshin: ["イファ", "ヴァレサ", "ウェンティ"],
    zzz: ["アンドー", "アンビー", "イヴリン"],
  },
  10: {
    hsr: ["ジェイド", "ジェパード", "セイバー", "セイレンス"],
    genshin: ["エウルア", "エスコフィエ", "エミリエ"],
    zzz: ["イドリー", "ヴェリナ", "オルペウス&「鬼火」"],
  },
  11: {
    hsr: ["セーバル", "ゼーレ", "ダリア", "トリビー", "ナターシャ", "ヒアンシー", "ファイノン", "フォフォ"],
    genshin: ["オロルン", "カーヴェ", "ガイア", "カチーナ", "キィニチ", "キャンディス"],
    zzz: ["カリン", "クレタ", "シーシィア", "シグリッド", "スターライト･ビリー", "ダイアリン"],
  },
  12: {
    hsr: ["フック", "ペラ", "ヘルタ", "マダム・ヘルタ", "ミーシャ", "モーディス", "モゼ", "リンクス"],
    genshin: ["クレー", "クロリンデ", "コレイ", "ゴロー", "コロンビーナ", "シグウィン"],
    zzz: ["ニコ", "ノルムー", "ヒューゴ", "ピュロイス", "ビリー", "プルクラ"],
  },
};

const NEXT_BATCH: Record<CatalogGameId, readonly string[]> = {
  hsr: ["ルカ", "雲璃", "遠坂凛", "火花", "寒鴉", "帰忘の流離人", "景元", "桂乃芬"],
  genshin: ["シトラリ", "シャルロット", "シュヴルーズ", "ジン", "スカーク", "スクロース"],
  zzz: ["プロメイア", "ベン", "ライカン", "リュシア", "儀玄", "橘福福"],
};

function batchFor(game: CatalogGameId, name: string) {
  return Object.entries(REVIEWED_BATCHES).find(([, games]) => games[game].includes(name))?.[0];
}

export function characterUpdateLedger(): CharacterUpdateLedger {
  const games: CatalogGameId[] = ["hsr", "genshin", "zzz"];
  const entries = games.flatMap((game) => CHARACTER_GUIDE_CATALOG[game].map((name) => {
    const batch = batchFor(game, name);
    return { game, name, status: batch ? "reviewed" as const : "pending" as const, batch: batch ? Number(batch) : null };
  }));
  const byGame = Object.fromEntries(games.map((game) => {
    const gameEntries = entries.filter((entry) => entry.game === game);
    const reviewed = gameEntries.filter((entry) => entry.status === "reviewed").length;
    return [game, { total: gameEntries.length, reviewed, pending: gameEntries.length - reviewed }];
  })) as CharacterUpdateLedger["byGame"];
  const reviewed = entries.filter((entry) => entry.status === "reviewed").length;
  const nextBatch = games.flatMap((game) => NEXT_BATCH[game].map((name) => {
    const entry = entries.find((candidate) => candidate.game === game && candidate.name === name);
    if (!entry) throw new Error(`Next batch character is absent from catalog: ${game}:${name}`);
    return entry;
  }));
  return {
    total: entries.length,
    reviewed,
    pending: entries.length - reviewed,
    byGame,
    nextBatch: { id: 13, names: nextBatch },
    criteria: "20キャラクター単位で、各キャラクターの更新日付き個別ビルド根拠、全6段階の凸効果、最大3案の推奨PT、戦闘内補正の公開値分離、回帰テスト、公開UID画面確認を完了してから公開する。",
    entries,
  };
}
