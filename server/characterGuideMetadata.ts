import { CHARACTER_GUIDE_CATALOG, type CatalogGameId } from "./characterGuideCatalog";
import { expectedProfileFor } from "./expectedGuideProfiles";

export type CharacterGuideMetadata = {
  profileId: string;
  dataAsOf: string;
  updatedAt: string;
  sourceLabel: string;
};

const SOURCE_LABELS: Record<CatalogGameId, string> = {
  hsr: "KQM・StarDB・Game8の公開ビルド情報を照合",
  genshin: "GameWith・Game8の公開ビルド情報を照合",
  zzz: "Prydwen・公開エージェントデータを照合",
};

function profileFor(game: CatalogGameId, name: string) {
  return expectedProfileFor(game, name);
}

function createGameRecords(game: CatalogGameId): Record<string, CharacterGuideMetadata> {
  return Object.fromEntries(CHARACTER_GUIDE_CATALOG[game].map((name) => [name, {
    profileId: profileFor(game, name),
    dataAsOf: CHARACTER_GUIDE_CATALOG.dataAsOf,
    updatedAt: CHARACTER_GUIDE_CATALOG.dataAsOf,
    sourceLabel: SOURCE_LABELS[game],
  }]));
}

/** 公開メタデータの全名称に対する、キャラクター単位の更新記録。 */
export const CHARACTER_GUIDE_METADATA: Record<CatalogGameId, Record<string, CharacterGuideMetadata>> = {
  hsr: createGameRecords("hsr"),
  genshin: createGameRecords("genshin"),
  zzz: createGameRecords("zzz"),
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

const BATCH_3_UPDATED_NAMES: Record<CatalogGameId, readonly string[]> = {
  hsr: ["サンデー", "ブートヒル", "黄泉", "霊砂"],
  genshin: ["雷電将軍", "ナヒーダ", "鍾離"],
  zzz: ["ビビアン", "ジェーン", "エレン"],
};

const BATCH_4_UPDATED_NAMES: Record<CatalogGameId, readonly string[]> = {
  hsr: ["アベンチュリン", "トパーズ&カブ", "花火", "丹恒・飲月"],
  genshin: ["アルハイゼン", "胡桃", "久岐忍"],
  zzz: ["セス", "パイパー", "蒼角"],
};

const BATCH_5_UPDATED_NAMES: Record<CatalogGameId, readonly string[]> = {
  hsr: ["Dr.レイシオ", "カフカ", "ブラックスワン", "鏡流"],
  genshin: ["行秋", "香菱", "フィッシュル"],
  zzz: ["グレース", "バーニス", "ルーシー"],
};

const BATCH_6_UPDATED_NAMES: Record<CatalogGameId, readonly string[]> = {
  hsr: ["ブローニャ", "銀狼", "符玄", "羅刹"],
  genshin: ["白朮", "八重神子", "宵宮"],
  zzz: ["シーザー", "リナ", "青衣"],
};

const BATCH_7_UPDATED_NAMES: Record<CatalogGameId, readonly string[]> = {
  hsr: ["アーチャー", "アーラン", "アスター", "アルジェンティ"],
  genshin: ["アーロイ", "アイノ", "アルベド"],
  zzz: ["「11号」", "「シード」", "「トリガー」"],
};

const BATCH_8_UPDATED_NAMES: Record<CatalogGameId, readonly string[]> = {
  hsr: ["ヴェルト", "ギャラガー", "キュレネ", "ギルガメッシュ"],
  genshin: ["アンバー", "イアンサ", "イネファ"],
  zzz: ["0号・アンビー", "アリア", "アリス"],
};

const BATCH_9_UPDATED_NAMES: Record<CatalogGameId, readonly string[]> = {
  hsr: ["クラーラ", "ケリュドラ", "サフェル", "サンポ"],
  genshin: ["イファ", "ヴァレサ", "ウェンティ"],
  zzz: ["アンドー", "アンビー", "イヴリン"],
};

Object.entries(BATCH_2_UPDATED_NAMES).forEach(([game, names]) => {
  const gameId = game as CatalogGameId;
  names.forEach((name) => {
    const record = CHARACTER_GUIDE_METADATA[gameId][name];
    if (!record) return;
    record.dataAsOf = "2026-08-25";
    record.updatedAt = "2026-08-25";
    record.sourceLabel = gameId === "hsr"
      ? "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合"
      : gameId === "genshin"
        ? "Game8の更新日付き個別ビルド・PTガイドを照合"
        : "Game8・Prydwenの更新日付き個別エージェントガイドを照合";
  });
});

Object.entries(BATCH_1_REVIEWED_NAMES).forEach(([game, names]) => {
  const gameId = game as CatalogGameId;
  names.forEach((name) => {
    const record = CHARACTER_GUIDE_METADATA[gameId][name];
    if (!record) return;
    record.dataAsOf = "2026-08-25";
    record.updatedAt = "2026-08-25";
    record.sourceLabel = gameId === "hsr"
      ? "Game8・Icy Veinsの更新日付き個別ビルド・PTガイドを照合"
      : gameId === "genshin"
        ? "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合"
        : "Game8・Icy Veinsの更新日付き個別エージェントガイドを照合";
  });
});

Object.entries(BATCH_3_UPDATED_NAMES).forEach(([game, names]) => {
  const gameId = game as CatalogGameId;
  names.forEach((name) => {
    const record = CHARACTER_GUIDE_METADATA[gameId][name];
    if (!record) return;
    record.dataAsOf = "2026-08-26";
    record.updatedAt = "2026-08-26";
    record.sourceLabel = gameId === "hsr"
      ? "Game8・Prydwen・GameWithの更新日付き個別ビルド・PTガイドを照合"
      : gameId === "genshin"
        ? "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合"
        : "Game8・Prydwenの更新日付き個別エージェントガイドを照合";
  });
});

Object.entries(BATCH_4_UPDATED_NAMES).forEach(([game, names]) => {
  const gameId = game as CatalogGameId;
  names.forEach((name) => {
    const record = CHARACTER_GUIDE_METADATA[gameId][name];
    if (!record) return;
    record.dataAsOf = "2026-08-26";
    record.updatedAt = "2026-08-26";
    record.sourceLabel = gameId === "hsr"
      ? "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合"
      : gameId === "genshin"
        ? "Game8・KeqingMainsの更新日付き個別ビルド・PTガイドを照合"
        : "Game8・Prydwenの更新日付き個別エージェントガイドを照合";
  });
});

Object.entries(BATCH_5_UPDATED_NAMES).forEach(([game, names]) => {
  const gameId = game as CatalogGameId;
  names.forEach((name) => {
    const record = CHARACTER_GUIDE_METADATA[gameId][name];
    if (!record) return;
    record.dataAsOf = "2026-08-26";
    record.updatedAt = "2026-08-26";
    record.sourceLabel = gameId === "hsr"
      ? "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合"
      : gameId === "genshin"
        ? "Game8の更新日付き個別ビルド・PTガイドを照合"
        : "Game8・Prydwenの更新日付き個別エージェントガイドを照合";
  });
});

Object.entries(BATCH_6_UPDATED_NAMES).forEach(([game, names]) => {
  const gameId = game as CatalogGameId;
  names.forEach((name) => {
    const record = CHARACTER_GUIDE_METADATA[gameId][name];
    if (!record) return;
    record.dataAsOf = "2026-08-26";
    record.updatedAt = "2026-08-26";
    record.sourceLabel = gameId === "hsr"
      ? "Game8・Prydwen・GameWithの更新日付き個別ビルド・PTガイドを照合"
      : gameId === "genshin"
        ? "Game8・GameWithの更新日付き個別ビルド・PTガイドを照合"
        : "Game8・Prydwenの更新日付き個別エージェントガイドを照合";
  });
});

Object.entries(BATCH_7_UPDATED_NAMES).forEach(([game, names]) => {
  const gameId = game as CatalogGameId;
  names.forEach((name) => {
    const record = CHARACTER_GUIDE_METADATA[gameId][name];
    if (!record) return;
    record.dataAsOf = "2026-08-26";
    record.updatedAt = "2026-08-26";
    record.sourceLabel = gameId === "hsr"
      ? "Game8・Prydwenの更新日付き個別ビルド・PTガイドを照合"
      : gameId === "genshin"
        ? "Game8・Icy Veinsの更新日付き個別ビルド・PTガイドを照合"
        : "Game8・Prydwen・Icy Veinsの更新日付き個別エージェントガイドを照合";
  });
});

Object.entries(BATCH_8_UPDATED_NAMES).forEach(([game, names]) => {
  const gameId = game as CatalogGameId;
  names.forEach((name) => {
    const record = CHARACTER_GUIDE_METADATA[gameId][name];
    if (!record) return;
    record.dataAsOf = "2026-08-26";
    record.updatedAt = "2026-08-26";
    record.sourceLabel = gameId === "hsr"
      ? "Game8・Prydwen・KeqingMainsの更新日付き個別ビルド・PTガイドを照合"
      : gameId === "genshin"
        ? "Game8・KeqingMains・Icy Veinsの更新日付き個別ビルド・PTガイドを照合"
        : "Game8・Prydwen・Icy Veinsの更新日付き個別エージェントガイドを照合";
  });
});

Object.entries(BATCH_9_UPDATED_NAMES).forEach(([game, names]) => {
  const gameId = game as CatalogGameId;
  names.forEach((name) => {
    const record = CHARACTER_GUIDE_METADATA[gameId][name];
    if (!record) return;
    record.dataAsOf = name === "クラーラ" ? "2026-08-21"
      : name === "サンポ" ? "2026-08-14"
        : name === "イファ" ? "2026-08-24"
          : name === "ヴァレサ" ? "2026-08-25"
            : name === "アンドー" || name === "イヴリン" ? "2026-08-19"
              : name === "アンビー" ? "2026-06-05"
                : "2026-08-26";
    record.updatedAt = "2026-08-26";
    record.sourceLabel = gameId === "hsr"
      ? "Game8・Prydwen・GameWithの更新日付き個別ビルド・PTガイドを照合"
      : gameId === "genshin"
        ? "Game8・Icy Veins・KeqingMainsの更新日付き個別ビルド・PTガイドを照合"
        : "Game8・Prydwen・Icy Veinsの更新日付き個別エージェントガイドを照合";
  });
});

export function guideMetadataFor(game: CatalogGameId, name?: string): CharacterGuideMetadata {
  const record = name ? CHARACTER_GUIDE_METADATA[game][name] : undefined;
  return record ?? {
    profileId: "curated",
    dataAsOf: CHARACTER_GUIDE_CATALOG.dataAsOf,
    updatedAt: CHARACTER_GUIDE_CATALOG.dataAsOf,
    sourceLabel: SOURCE_LABELS[game],
  };
}
