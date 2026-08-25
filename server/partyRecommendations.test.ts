import { describe, expect, it } from "vitest";
import { assertPartyCatalogIntegrity, MAX_PARTY_OPTIONS, partyRecommendationsFor } from "./partyRecommendations";

describe("推奨パーティー編成カタログ", () => {
  it("各登録キャラクターの案は最大3件で、順位が連続している", () => {
    expect(MAX_PARTY_OPTIONS).toBe(3);
    expect(assertPartyCatalogIntegrity()).toBe(true);
  });

  it("編成ごとに対応バージョン・基準日・更新日を保持する", () => {
    const teams = partyRecommendationsFor("zzz", "星見雅");
    expect(teams.gameVersion).toBe("3.1");
    expect(teams.options).toHaveLength(3);
    expect(teams.options[0]).toMatchObject({ gameVersion: "3.1", dataAsOf: "2026-08-25", updatedAt: "2026-08-25" });
  });

  it("編成による目標ステータスの変化を明示的な補正データとして返す", () => {
    const teams = partyRecommendationsFor("genshin", "アルレッキーノ");
    expect(teams.options[0]?.targetChanges).toContainEqual(expect.objectContaining({ key: "elementalMastery", targets: { "厳選": 220, "目標": 160, "妥協": 100 } }));
  });

  it("HSR・原神・ZZZの代表キャラクターで、最大3案とゲーム別のバージョン情報を返す", () => {
    const coverage = [
      { game: "hsr" as const, character: "ホタル", version: "4.4", changedKey: "speed" },
      { game: "genshin" as const, character: "神里綾華", version: "7.0", changedKey: "critRate" },
      { game: "zzz" as const, character: "星見雅", version: "3.1", changedKey: "critRate" },
    ];
    coverage.forEach(({ game, character, version, changedKey }) => {
      const teams = partyRecommendationsFor(game, character);
      expect(teams).toMatchObject({ gameVersion: version, dataAsOf: "2026-08-25", updatedAt: "2026-08-25" });
      expect(teams.options).toHaveLength(MAX_PARTY_OPTIONS);
      expect(teams.options.map((option) => option.rank)).toEqual([1, 2, 3]);
      expect(teams.options.some((option) => option.targetChanges.some((change) => change.key === changedKey))).toBe(true);
    });
  });
});
