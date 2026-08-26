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
    expect(history.characters.find((item) => item.name === "0号・アンビー")).toMatchObject({ profileId: "crit", dataAsOf: "2026-08-26" });
    expect(history.characters.find((item) => item.name === "レミエール")?.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "第2バッチ：個別ビルド・凸・推奨PTを再精査", date: "2026-08-25T12:14:00+09:00" }),
    ]));
    expect(history.characters.find((item) => item.name === "飛霄")?.updatedAt).toBe("2026-08-25");
    expect(history.characters.find((item) => item.name === "ホタル")?.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "第1バッチ：個別ビルド・凸・推奨PTを再監査", date: "2026-08-25T12:35:00+09:00" }),
    ]));
    expect(history.characters.find((item) => item.name === "星見雅")?.updatedAt).toBe("2026-08-25");
  });
});
