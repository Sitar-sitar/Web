import { describe, expect, it } from "vitest";
import { CHARACTER_GUIDE_CATALOG } from "./characterGuideCatalog";
import { guideUpdateHistory } from "./guideUpdateHistory";

describe("ガイド更新履歴", () => {
  it("サイト全体の更新と全キャラクターの個別基準記録を返す", () => {
    const history = guideUpdateHistory();
    const expectedCount = CHARACTER_GUIDE_CATALOG.hsr.length + CHARACTER_GUIDE_CATALOG.genshin.length + CHARACTER_GUIDE_CATALOG.zzz.length;
    expect(history.currentBaseline).toBe("2026-08-18");
    expect(history.siteEvents.length).toBeGreaterThan(0);
    expect(history.characters).toHaveLength(expectedCount);
    expect(history.characters.find((item) => item.name === "0号・アンビー")).toMatchObject({ profileId: "crit", dataAsOf: "2026-08-18" });
  });
});
