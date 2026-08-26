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
};

const NEXT_BATCH: Record<CatalogGameId, readonly string[]> = {
  hsr: ["Dr.レイシオ", "カフカ", "ブラックスワン", "鏡流"],
  genshin: ["行秋", "香菱", "フィッシュル"],
  zzz: ["グレース", "バーニス", "ルーシー"],
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
    nextBatch: { id: 5, names: nextBatch },
    criteria: "各キャラクターについて、更新日付き個別ビルド根拠、全6段階の凸効果、最大3案の推奨PT、戦闘内補正の公開値分離、回帰テスト、公開UID画面確認を完了してから公開する。",
    entries,
  };
}
