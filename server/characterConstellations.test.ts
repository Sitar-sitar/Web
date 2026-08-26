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
      [identity("genshin", "10000103", "シロネン"), "命ノ星座"],
      [identity("zzz", "1091", "星見雅"), "心象映画"],
      [identity("zzz", "1411", "浮波柚葉"), "心象映画"],
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
    const xilonen = constellationProfileFor(identity("genshin", "10000103", "シロネン"), 6);
    const yuzuha = constellationProfileFor(identity("zzz", "1411", "浮波柚葉"), 6);

    expect(belowZero.acquiredRank).toBe(0);
    expect(aboveSix.acquiredRank).toBe(6);
    for (const profile of [firefly, anaxa, xilonen, yuzuha]) {
      expect(profile.activeTargetChanges).toEqual([]);
    }
  });

  it("uses verified source IDs for Xilonen、Yuzuha、Iansan without mapping a neighboring implementation by name", () => {
    expect(constellationProfileFor(identity("genshin", "10000103", "シロネン"), 6).dataStatus).toBe("curated");
    expect(constellationProfileFor(identity("zzz", "1411", "浮波柚葉"), 6).dataStatus).toBe("curated");
    expect(constellationProfileFor(identity("genshin", "10000110", "イアンサ"), 6).dataStatus).toBe("curated");
    expect(constellationProfileFor(identity("genshin", "10000903", "イネファ"), 6).dataStatus).toBe("preparing");
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

  it("第2バッチのHSR3名を正しいIDで解決し、戦闘中星魂効果を公開値へ自動加算しない", () => {
    const entries = [
      identity("hsr", "1309", "ロビン"),
      identity("hsr", "1303", "ルアン・メェイ"),
      identity("hsr", "1220", "飛霄"),
    ];
    entries.forEach((character) => {
      const profile = constellationProfileFor(character, 6);
      expect(profile.dataStatus).toBe("curated");
      expect(profile.effects.map((item) => item.level)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(profile.activeTargetChanges).toEqual([]);
    });
    expect(constellationProfileFor(entries[0]!, 1).effects[0]?.description.ja).toContain("24%");
    expect(constellationProfileFor(entries[1]!, 1).effects[0]?.description.ja).toContain("20%無視");
    expect(constellationProfileFor(entries[2]!, 4).effects[3]?.description.ja).toContain("8%");
  });

  it("第2バッチの月城柳を正しいZZZ IDで解決し、M1〜M6を順に表示する", () => {
    const profile = constellationProfileFor(identity("zzz", "1221", "月城柳"), 6);
    expect(profile.dataStatus).toBe("curated");
    expect(profile.effects.map((item) => item.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(profile.effects[0]?.description.ja).toContain("80");
    expect(profile.activeTargetChanges).toEqual([]);
  });

  it("第2バッチのアストラを正しいZZZ IDで解決し、M1〜M6を順に表示する", () => {
    const profile = constellationProfileFor(identity("zzz", "1311", "アストラ"), 6);
    expect(profile.dataStatus).toBe("curated");
    expect(profile.effects.map((item) => item.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(profile.effects[1]?.description.ja).toContain("400");
    expect(profile.activeTargetChanges).toEqual([]);
  });

  it("第2バッチのライトを正しいZZZ IDで解決し、M1〜M6を順に表示する", () => {
    const profile = constellationProfileFor(identity("zzz", "1161", "ライト"), 6);
    expect(profile.dataStatus).toBe("curated");
    expect(profile.effects.map((item) => item.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(profile.effects[0]?.description.ja).toContain("5秒");
    expect(profile.activeTargetChanges).toEqual([]);
  });

  it("第2バッチのレミエールを実公開UIDと同じIDで解決し、M1〜M6を順に表示する", () => {
    const profile = constellationProfileFor(identity("zzz", "1581", "レミエール"), 2);
    expect(profile.dataStatus).toBe("curated");
    expect(profile.acquiredRank).toBe(2);
    expect(profile.effects.map((item) => item.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(profile.effects[0]?.description.ja).toContain("50%無視");
    expect(profile.activeTargetChanges).toEqual([]);
  });

  it("第2バッチのアルレッキーノを正しい原神IDで解決し、C1〜C6を順に表示する", () => {
    const profile = constellationProfileFor(identity("genshin", "10000096", "アルレッキーノ"), 6);
    expect(profile.dataStatus).toBe("curated");
    expect(profile.effects.map((item) => item.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(profile.effects[1]?.description.ja).toContain("900%");
    expect(profile.activeTargetChanges).toEqual([]);
  });

  it("第2バッチのヌヴィレットを正しい原神IDで解決し、C1〜C6を順に表示する", () => {
    const profile = constellationProfileFor(identity("genshin", "10000087", "ヌヴィレット"), 6);
    expect(profile.dataStatus).toBe("curated");
    expect(profile.effects.map((item) => item.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(profile.effects[1]?.description.ja).toContain("42%");
    expect(profile.activeTargetChanges).toEqual([]);
  });

  it("第2バッチの夜蘭を正しい原神IDで解決し、C1〜C6を順に表示する", () => {
    const profile = constellationProfileFor(identity("genshin", "10000060", "夜蘭"), 6);
    expect(profile.dataStatus).toBe("curated");
    expect(profile.effects.map((item) => item.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(profile.effects[3]?.description.ja).toContain("40%");
    expect(profile.activeTargetChanges).toEqual([]);
  });

  it("never fabricates effects for an uncollected character", () => {
    const profile = constellationProfileFor(identity("genshin", "10000125", "コロンビーナ"), 3);
    expect(profile.dataStatus).toBe("preparing");
    expect(profile.effects).toEqual([]);
    expect(profile.activeTargetChanges).toEqual([]);
  });
});
