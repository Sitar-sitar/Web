import { describe, expect, it } from "vitest";
import { resolveCharacterIdentity } from "./characterIdentity";
import { ACTIVE_CATALOG_IDENTITIES, EXCLUDED_EMPTY_GENSHIN_CATALOG_IDS } from "./fixtures/identityCatalogSnapshot";

describe("ゲーム横断キャラクター識別", () => {
  it("HSRの別ID実装を基礎キャラクターの銀狼へ統合しない", () => {
    expect(resolveCharacterIdentity("hsr", "1506", "銀狼LV.999")).toMatchObject({
      key: "hsr:1506", displayName: "銀狼Lv.999", variantOf: "銀狼", resolved: true, resolution: "curated-id-map",
    });
  });

  it("原神の数値IDを確認済み名称へ解決し、数値表示を残さない", () => {
    expect(resolveCharacterIdentity("genshin", "10000125")).toMatchObject({
      key: "genshin:10000125", displayName: "コロンビーナ", resolved: true, resolution: "curated-id-map",
    });
  });

  it("未解決IDを既存キャラクター名へ推測置換しない", () => {
    expect(resolveCharacterIdentity("zzz", "999999")).toMatchObject({
      key: "zzz:999999", displayName: "未解決のキャラクター（ID 999999）", variantOf: null, resolved: false, resolution: "unresolved",
    });
  });

  it("公開静的カタログの全281有効実装をID・非数値名称・画像参照として検証する", () => {
    expect(ACTIVE_CATALOG_IDENTITIES).toHaveLength(281);
    for (const entry of ACTIVE_CATALOG_IDENTITIES) {
      const identity = resolveCharacterIdentity(entry.game, entry.sourceId, entry.providerName);
      expect(identity.key, `${entry.game}:${entry.sourceId}`).toBe(`${entry.game}:${entry.sourceId}`);
      expect(identity.resolved, `${entry.game}:${entry.sourceId}`).toBe(true);
      expect(identity.displayName, `${entry.game}:${entry.sourceId}`).not.toMatch(/^#?\d+$/);
      expect(identity.displayName, `${entry.game}:${entry.sourceId}`).not.toMatch(/^\{[A-Z_]+\}$/);
      expect(entry.portrait, `${entry.game}:${entry.sourceId}`).toMatch(/^(?:https:\/\/|\/)/);
    }
  });

  it("公開原神カタログの名称・画像を持たない内部6件はプレイアブル検証対象から明示除外する", () => {
    expect(EXCLUDED_EMPTY_GENSHIN_CATALOG_IDS).toEqual([
      "10000117", "10000118", "10000998", "10000999", "11000998", "11000999",
    ]);
  });
});
