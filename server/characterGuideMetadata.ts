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

export function guideMetadataFor(game: CatalogGameId, name?: string): CharacterGuideMetadata {
  const record = name ? CHARACTER_GUIDE_METADATA[game][name] : undefined;
  return record ?? {
    profileId: "curated",
    dataAsOf: CHARACTER_GUIDE_CATALOG.dataAsOf,
    updatedAt: CHARACTER_GUIDE_CATALOG.dataAsOf,
    sourceLabel: SOURCE_LABELS[game],
  };
}
