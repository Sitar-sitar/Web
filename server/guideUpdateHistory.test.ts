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
    expect(history.characters.find((item) => item.name === "クラーラ")?.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "第9バッチ：個別ビルド・凸・推奨PTを再精査", date: "2026-08-26T18:00:00+09:00" }),
    ]));
    const batch10Names = ["ジェイド", "ジェパード", "セイバー", "セイレンス", "エウルア", "エスコフィエ", "エミリエ", "イドリー", "ヴェリナ", "オルペウス&「鬼火」"];
    const batch10Characters = history.characters.filter((item) => batch10Names.includes(item.name));
    expect(batch10Characters).toHaveLength(10);
    expect(batch10Characters.every((item) => item.events.some((event) => event.title === "第10バッチ：個別ビルド・凸・推奨PTを再精査" && event.date === "2026-08-26T19:00:00+09:00"))).toBe(true);
    const batch11Characters = history.characters.filter((item) => item.events.some((event) => event.title === "第11バッチ：個別ビルド・凸・推奨PTを再精査"));
    expect(batch11Characters).toHaveLength(20);
    expect(batch11Characters.every((item) => item.events.some((event) => event.title === "第11バッチ：個別ビルド・凸・推奨PTを再精査" && event.date === "2026-08-27T01:15:00+09:00"))).toBe(true);
    expect(history.characters.find((item) => item.name === "シーシィア")?.updatedAt).toBe("2026-08-27");
    const batch12Names = ["フック", "ペラ", "ヘルタ", "マダム・ヘルタ", "ミーシャ", "モーディス", "モゼ", "リンクス", "クレー", "クロリンデ", "コレイ", "ゴロー", "コロンビーナ", "シグウィン", "ニコ", "ノルムー", "ヒューゴ", "ピュロイス", "ビリー", "プルクラ"];
    const batch12Characters = history.characters.filter((item) => batch12Names.includes(item.name));
    expect(batch12Characters).toHaveLength(20);
    expect(batch12Characters.every((item) => item.events.some((event) => event.title === "第12バッチ：個別ビルド・凸・推奨PTを再精査" && event.date === "2026-08-27T01:50:00+09:00"))).toBe(true);
    expect(batch12Characters.every((item) => item.events.some((event) => event.changes.includes("公開UIDは明示Searchのみで検証")))).toBe(true);
    expect(history.characters.find((item) => item.name === "アンビー")?.updatedAt).toBe("2026-08-26");
  });
});
