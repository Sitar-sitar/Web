export type CharacterGameId = "hsr" | "genshin" | "zzz";

export type CharacterIdentity = {
  game: CharacterGameId;
  sourceId: string;
  key: `${CharacterGameId}:${string}`;
  displayName: string;
  /** 基礎キャラクターとは別の実装・形態である場合だけ設定する。 */
  variantOf: string | null;
  /** 公式／取得元の名称を解決できたか。未解決時に別キャラクター名へ推測置換しない。 */
  resolved: boolean;
  resolution: "provider" | "curated-id-map" | "unresolved";
};

type CuratedIdentity = Pick<CharacterIdentity, "displayName" | "variantOf">;

/**
 * 取得元カタログの欠落を補う、確認済みの最小IDマッピング。
 * 表示名をIDに逆引きしてはいけない。派生・別バージョンを基礎名へ統合しないためである。
 */
const CURATED_IDENTITIES: Partial<Record<CharacterGameId, Record<string, CuratedIdentity>>> = {
  hsr: {
    "1014": { displayName: "セイバー", variantOf: null },
    "1310": { displayName: "ホタル", variantOf: null },
    "1407": { displayName: "キャストリス", variantOf: null },
    // Enka HSR の 1506 は「銀狼」の基礎実装（1006）とは別IDとして公開される。
    // 属性・運命を銀狼から継承せず、取得元が解決できるまで未解決メタデータとして扱う。
    "1506": { displayName: "銀狼Lv.999", variantOf: "銀狼" },
    "1508": { displayName: "遠坂凛", variantOf: null },
    "1509": { displayName: "ギルガメッシュ", variantOf: null },
    // 取得元の {NICKNAME} はユーザー名マクロであり、キャラクター名としては表示しない。
    "8001": { displayName: "開拓者（物理・壊滅）", variantOf: "開拓者" },
    "8002": { displayName: "開拓者（物理・壊滅）", variantOf: "開拓者" },
    "8003": { displayName: "開拓者（炎・存護）", variantOf: "開拓者" },
    "8004": { displayName: "開拓者（炎・存護）", variantOf: "開拓者" },
    "8005": { displayName: "開拓者（虚数・調和）", variantOf: "開拓者" },
    "8006": { displayName: "開拓者（虚数・調和）", variantOf: "開拓者" },
    "8007": { displayName: "開拓者（氷・記憶）", variantOf: "開拓者" },
    "8008": { displayName: "開拓者（氷・記憶）", variantOf: "開拓者" },
    "8009": { displayName: "開拓者（雷・歓楽）", variantOf: "開拓者" },
    "8010": { displayName: "開拓者（雷・歓楽）", variantOf: "開拓者" },
  },
  genshin: {
    // HoYoVerse 公開のキャラクターID一覧に基づく現在の表示名。
    "10000125": { displayName: "コロンビーナ", variantOf: null },
  },
};

function isUsableProviderName(value: string) {
  const normalized = value.trim();
  return Boolean(normalized)
    && !/^#?\d+$/.test(normalized)
    && !/^(?:キャラクター|エージェント|avatar)\s*#?\d+$/i.test(normalized)
    && !/^\{[A-Z_]+\}$/.test(normalized)
    && !/^unknown$/i.test(normalized);
}

export function resolveCharacterIdentity(game: CharacterGameId, sourceId: string | number, providerName?: string | null): CharacterIdentity {
  const id = String(sourceId).trim() || "unknown";
  const curated = CURATED_IDENTITIES[game]?.[id];
  const rawName = providerName?.trim() ?? "";
  const displayName = curated?.displayName ?? (isUsableProviderName(rawName) ? rawName : `未解決のキャラクター（ID ${id}）`);
  return {
    game,
    sourceId: id,
    key: `${game}:${id}`,
    displayName,
    variantOf: curated?.variantOf ?? null,
    resolved: Boolean(curated || isUsableProviderName(rawName)),
    resolution: curated ? "curated-id-map" : isUsableProviderName(rawName) ? "provider" : "unresolved",
  };
}

export function unresolvedCharacterName(game: CharacterGameId, sourceId: string | number) {
  return resolveCharacterIdentity(game, sourceId).displayName;
}
