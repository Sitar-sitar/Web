import { describe, expect, it } from "vitest";
import { characterReferenceCatalog, characterReferenceFor } from "./characterReference";

describe("character reference catalog", () => {
  it("全248キャラクターをゲーム別に公開する", () => {
    const catalog = characterReferenceCatalog();
    expect(catalog.total).toBe(248);
    expect(catalog.reviewed).toBe(200);
    expect(catalog.pending).toBe(48);
    expect(catalog.games.hsr).toHaveLength(81);
    expect(catalog.games.genshin).toHaveLength(109);
    expect(catalog.games.zzz).toHaveLength(58);
  });

  it.each([
    ["hsr", "長夜月"],
    ["zzz", "葉瞬光"],
  ] as const)("第15バッチ %s:%s は専用ガイド・3PT・6段階凸を返す", (game, name) => {
    const reference = characterReferenceFor(game, name);
    expect(reference).not.toBeNull();
    expect(reference?.status).toBe("reviewed");
    expect(reference?.batch).toBe(15);
    expect(reference?.guide.updatedAt).toBe("2026-09-05");
    expect(reference?.guide.dataAsOf).toBe("2026-09-05");
    expect(reference?.partyRecommendations.options).toHaveLength(3);
    expect(reference?.constellations.dataStatus).toBe("curated");
    expect(reference?.constellations.effects).toHaveLength(6);
  });

  it("通常キャラクターもUIDなしで推奨情報を返す", () => {
    const reference = characterReferenceFor("hsr", "ホタル");
    expect(reference?.guide.headline).toBeTruthy();
    expect(reference?.guide.mainStats.length).toBeGreaterThan(0);
    expect(reference?.partyRecommendations.options.length).toBeGreaterThan(0);
  });

  it("カタログ外の名前は返さない", () => {
    expect(characterReferenceFor("hsr", "存在しないキャラ")).toBeNull();
  });
});
