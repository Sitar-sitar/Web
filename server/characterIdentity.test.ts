import { describe, expect, it } from "vitest";
import { resolveCharacterIdentity } from "./characterIdentity";

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
});
