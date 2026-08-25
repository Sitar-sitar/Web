import { describe, expect, it } from "vitest";
import { constellationProfileFor } from "./characterConstellations";
import type { CharacterIdentity } from "./characterIdentity";

const identity = (game: CharacterIdentity["game"], sourceId: string, displayName: string): CharacterIdentity => ({
  game,
  sourceId,
  key: `${game}:${sourceId}`,
  displayName,
  variantOf: null,
  resolved: true,
  resolution: "provider",
});

describe("constellationProfileFor", () => {
  it("provides six ordered curated effects for every character in the first ten-character batch", () => {
    const entries: Array<[CharacterIdentity, string]> = [
      [identity("hsr", "1310", "ホタル"), "星魂"],
      [identity("hsr", "1402", "アグライア"), "星魂"],
      [identity("hsr", "1405", "アナイクス"), "星魂"],
      [identity("hsr", "1407", "キャストリス"), "星魂"],
      [identity("genshin", "10000089", "フリーナ"), "命ノ星座"],
      [identity("genshin", "10000047", "楓原万葉"), "命ノ星座"],
      [identity("genshin", "10000032", "ベネット"), "命ノ星座"],
      [identity("genshin", "10000110", "シロネン"), "命ノ星座"],
      [identity("zzz", "1091", "星見雅"), "心象映画"],
      [identity("zzz", "141", "浮波柚葉"), "心象映画"],
    ];

    for (const [character, label] of entries) {
      const profile = constellationProfileFor(character, 6);
      expect(profile.dataStatus, character.displayName).toBe("curated");
      expect(profile.rankLabel.ja, character.displayName).toBe(label);
      expect(profile.effects.map((item) => item.level), character.displayName).toEqual([1, 2, 3, 4, 5, 6]);
    }
  });

  it("clamps rank and exposes target changes only from the two reviewed combat-only effects", () => {
    const belowZero = constellationProfileFor(identity("hsr", "1402", "アグライア"), -1);
    const aboveSix = constellationProfileFor(identity("hsr", "1407", "キャストリス"), 9);
    const firefly = constellationProfileFor(identity("hsr", "1310", "ホタル"), 6);
    const anaxa = constellationProfileFor(identity("hsr", "1405", "アナイクス"), 6);
    const xilonen = constellationProfileFor(identity("genshin", "10000110", "シロネン"), 6);
    const yuzuha = constellationProfileFor(identity("zzz", "141", "浮波柚葉"), 6);

    expect(belowZero.acquiredRank).toBe(0);
    expect(aboveSix.acquiredRank).toBe(6);
    for (const profile of [firefly, anaxa, xilonen, yuzuha]) {
      expect(profile.activeTargetChanges).toEqual([]);
    }
  });

  it("returns all six reviewed Firefly Eidolons while showing only unlocked effects as active", () => {
    const profile = constellationProfileFor(identity("hsr", "1310", "ホタル"), 1);
    expect(profile.dataStatus).toBe("curated");
    expect(profile.rankLabel.ja).toBe("星魂");
    expect(profile.acquiredRank).toBe(1);
    expect(profile.effects).toHaveLength(6);
    expect(profile.effects[0]?.description.ja).toContain("15%無視");
    expect(profile.activeTargetChanges).toEqual([]);
  });

  it("applies Kazuha C2's in-combat Elemental Mastery target change only after C2 is unlocked", () => {
    const c1 = constellationProfileFor(identity("genshin", "10000047", "楓原万葉"), 1);
    const c2 = constellationProfileFor(identity("genshin", "10000047", "楓原万葉"), 2);
    expect(c1.activeTargetChanges).toEqual([]);
    expect(c2.activeTargetChanges).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "elementalMastery", targets: { "厳選": 800, "目標": 650, "妥協": 500 } }),
    ]));
  });

  it("applies Miyabi M2's in-combat CRIT Rate target change without adding it to the public value", () => {
    const profile = constellationProfileFor(identity("zzz", "1091", "星見雅"), 2);
    expect(profile.rankLabel.ja).toBe("心象映画");
    expect(profile.activeTargetChanges).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "critRate", targets: { "厳選": 65, "目標": 55, "妥協": 45 } }),
    ]));
  });

  it("never fabricates effects for an uncollected character", () => {
    const profile = constellationProfileFor(identity("genshin", "10000125", "コロンビーナ"), 3);
    expect(profile.dataStatus).toBe("preparing");
    expect(profile.effects).toEqual([]);
    expect(profile.activeTargetChanges).toEqual([]);
  });
});
