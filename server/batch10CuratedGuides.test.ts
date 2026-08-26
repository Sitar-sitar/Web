import { describe, expect, it } from "vitest";
import { guideFor } from "./buildAdvisor";
import { constellationProfileFor } from "./characterConstellations";
import { guideMetadataFor } from "./characterGuideMetadata";
import { guideUpdateHistory } from "./guideUpdateHistory";
import { partyRecommendationsFor } from "./partyRecommendations";

const identity = (game: "hsr" | "genshin" | "zzz", sourceId: string, displayName: string) => ({
  game,
  sourceId,
  key: `${game}:${sourceId}` as const,
  displayName,
  variantOf: null,
  resolved: true,
  resolution: "provider" as const,
});

const profiles = [
  identity("hsr", "1314", "ジェイド"), identity("hsr", "1104", "ジェパード"), identity("hsr", "1014", "セイバー"), identity("hsr", "1410", "セイレンス"),
  identity("genshin", "10000051", "エウルア"), identity("genshin", "10000112", "エスコフィエ"), identity("genshin", "10000099", "エミリエ"),
  identity("zzz", "1051", "イドリー"), identity("zzz", "1561", "ヴェリナ"), identity("zzz", "1301", "オルペウス&「鬼火」"),
];

describe("第10バッチの個別ガイド", () => {
  it("HSR4名を個別の公開プロフィール比較ガイドとして返す", () => {
    const saber = guideFor("セイバー", "壊滅");
    const seirens = guideFor("セイレンス", "虚無");
    expect(saber.targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(134);
    expect(seirens.targets.find((target) => target.key === "effectHitRate")?.targets["目標"]).toBe(120);
    ["ジェイド", "ジェパード", "セイバー", "セイレンス"].forEach((name) => {
      expect(guideFor(name, name === "ジェイド" ? "知恵" : name === "ジェパード" ? "存護" : name === "セイバー" ? "壊滅" : "虚無").targetContext).toContain("公開プロフィール");
    });
  });

  it("全10名を実ソースIDで6段階の凸へ解決し、戦闘中効果を目標補正にしない", () => {
    profiles.forEach((character) => {
      const profile = constellationProfileFor(character, 6);
      expect(profile.dataStatus).toBe("curated");
      expect(profile.effects.map((effect) => effect.level)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(profile.activeTargetChanges).toEqual([]);
      expect(profile.updatedAt).toBe("2026-08-26");
    });
    expect(constellationProfileFor(identity("zzz", "1381", "0号・アンビー"), 6).effects).toHaveLength(6);
  });

  it("全10名へ本人を含む最大3案の更新日付きPTを返し、パーティ補正を公開値へ加算しない", () => {
    profiles.forEach(({ game, displayName }) => {
      const parties = partyRecommendationsFor(game, displayName);
      expect(parties.options).toHaveLength(3);
      expect(parties.options.every((option) => option.members.some((member) => member.name.ja === displayName))).toBe(true);
      expect(parties.options.every((option) => option.targetChanges.length === 0)).toBe(true);
      expect(parties.updatedAt).toBe("2026-08-26");
      expect(guideMetadataFor(game, displayName).updatedAt).toBe("2026-08-26");
    });
    const history = guideUpdateHistory();
    const updated = history.characters.filter((character) => profiles.some((profile) => profile.game === character.game && profile.displayName === character.name));
    expect(updated).toHaveLength(10);
    expect(updated.every((character) => character.events.some((event) => event.title.includes("第10バッチ")))).toBe(true);
  });
});
