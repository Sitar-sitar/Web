import { describe, expect, it } from "vitest";
import { UidResponseCache, normalizeMihomoPayload } from "./buildAdvisor";

describe("MiHoMoデータ正規化", () => {
  it("公開キャラクターの装備と目標達成度を表示モデルに変換する", () => {
    const data = normalizeMihomoPayload({
      player: { uid: "800000001", nickname: "テスト開拓者", level: 70 },
      characters: [{
        id: "1310", name: "ホタル", level: 80, rank: 1,
        portrait: "https://example.com/firefly.png", path: { name: "壊滅" }, element: { name: "炎", color: "#dc553a" },
        light_cone: { name: "夢が帰り着く場所", level: 80, rank: 1, icon: "https://example.com/cone.png" },
        properties: [
          { field: "speed", name: "速度", value: 154, display: "154", percent: false },
          { field: "break_dmg", name: "撃破特効", value: 3.2, display: "320.0%", percent: true },
          { field: "attack_added_ratio", name: "攻撃力%", value: 0.5, display: "50.0%", percent: true },
        ],
        relics: [{ id: "1", name: "鉄騎", set_name: "鉄騎の執行者", level: 15, icon: "https://example.com/relic.png", main_affix: { name: "攻撃力%", value: 0.4, display: "43.2%", percent: true }, sub_affix: [] }],
      }],
    });

    expect(data.player.name).toBe("テスト開拓者");
    expect(data.characters[0]?.relics).toHaveLength(1);
    expect(data.characters[0]?.guide.relicSet).toContain("鉄騎");
    expect(data.characters[0]?.comparisons.find((item) => item.key === "speed")?.achieved["目標"]).toBe(true);
    expect(data.characters[0]?.comparisons.find((item) => item.key === "breakEffect")?.current).toBe(320);
  });

  it("主要キャラクターには個別の遺物推奨定義を適用する", () => {
    const data = normalizeMihomoPayload({
      player: { uid: "800000002", nickname: "テスト開拓者" },
      characters: [{
        id: "1308", name: "黄泉", path: { name: "虚無" }, element: { name: "雷" }, properties: [], relics: [],
      }],
    });

    expect(data.characters[0]?.guide.relicSet).toBe("死水に潜る先駆者 ×4");
    expect(data.characters[0]?.guide.mainStats.find((stat) => stat.slot === "胴体")?.value).toContain("会心率");
  });
});

describe("UIDキャッシュ", () => {
  it("TTLの有効期限内だけ値を返し、期限後に破棄する", () => {
    const cache = new UidResponseCache<string>();
    cache.set("800000001", "cached", 1_000, 100);
    expect(cache.get("800000001", 1_099)).toBe("cached");
    expect(cache.get("800000001", 1_100)).toBeNull();
  });
});
