import { describe, expect, it, vi } from "vitest";
import { lookupUidBuild, lookupWithFallback, UidResponseCache, normalizeMihomoPayload } from "./buildAdvisor";
import { normalizeEnkaPayload } from "./enkaFallback";

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

describe("MiHoMoからEnkaへのフォールバック", () => {
  it("主系統の取得に失敗した場合、代替系統の正常な結果を返す", async () => {
    const result = await lookupWithFallback(
      async () => { throw new Error("MiHoMo 502"); },
      async () => ({ source: "Enka", characterCount: 8, firstCharacter: "遠坂凛" }),
    );

    expect(result).toEqual({ source: "Enka", characterCount: 8, firstCharacter: "遠坂凛" });
  });

  it("UID照会の実経路でMiHoMo障害後にEnkaのキャラクター情報を返す", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes("api.mihomo.me")) return new Response("<!DOCTYPE html><title>502</title>", { status: 502, headers: { "content-type": "text/html" } });
      if (url.includes("enka.network/api/hsr/uid")) return new Response(JSON.stringify({ uid: "999000001", detailInfo: { nickname: "Fallback", avatarDetailList: [{ avatarId: 1310, level: 80, promotion: 0, equipment: { tid: 23061, level: 80, rank: 1 }, relicList: [{ tid: 1, type: 1, level: 15, _flat: { setID: 108, props: [{ type: "SpeedDelta", value: 8.9 }] } }] }] } }), { headers: { "content-type": "application/json" } });
      if (url.endsWith("characters.json")) return new Response(JSON.stringify({ "1310": { name: "ホタル", element: "Fire", path: "Warrior" } }), { headers: { "content-type": "application/json" } });
      if (url.endsWith("light_cones.json")) return new Response(JSON.stringify({ "23061": { name: "テスト光円錐" } }), { headers: { "content-type": "application/json" } });
      if (url.endsWith("relic_sets.json")) return new Response(JSON.stringify({ "108": { name: "テスト遺物セット" } }), { headers: { "content-type": "application/json" } });
      if (url.endsWith("character_promotions.json")) return new Response(JSON.stringify({ "1310": { values: [{ spd: { base: 104 }, crit_rate: { base: 0.05 }, crit_dmg: { base: 0.5 } }] } }), { headers: { "content-type": "application/json" } });
      return new Response(JSON.stringify({}), { headers: { "content-type": "application/json" } });
    }));

    try {
      const result = await lookupUidBuild("999000001");
      expect(result.dataSource).toBe("Enka");
      expect(result.characters[0]).toMatchObject({ name: "ホタル", path: "壊滅", element: "炎" });
      expect(result.characters[0]?.lightCone?.name).toBe("テスト光円錐");
      expect(result.characters[0]?.relics[0]?.setName).toBe("テスト遺物セット");
      expect(result.characters[0]?.comparisons.find((item) => item.label === "速度")?.current).toBe(112.9);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("Enkaフォールバック正規化", () => {
  it("生データの公開キャラクターと遺物を表示モデルへ変換する", () => {
    const data = normalizeEnkaPayload({
      uid: "806071233",
      detailInfo: {
        nickname: "したーる", level: 70,
        avatarDetailList: [{ avatarId: 1310, level: 80, rank: 1, equipment: { tid: 23061, level: 80, rank: 1 }, relicList: [{ tid: 61081, type: 1, level: 15, _flat: { setID: 108, props: [{ type: "HPDelta", value: 705.6 }, { type: "SpeedDelta", value: 8.9 }, { type: "CriticalChance", value: 0.02916 }] } }] }, { avatarId: 1506, level: 80, rank: 0, relicList: [] }],
      },
    }, {
      characters: { "1310": { name: "ホタル", element: "Fire", path: "Warrior" }, "1506": { name: "銀狼LV.999", element: "Unknown", path: "Unknown" } },
      lightCones: { "23061": { name: "Flickering Stars" } },
      relicSets: { "108": { name: "星の如く輝く天才" } },
      characterPromotions: { "1310": { values: [{ spd: { base: 104 }, crit_rate: { base: 0.05 }, crit_dmg: { base: 0.5 } }] } },
      skillTrees: {},
    });

    expect(data.player.name).toBe("したーる");
    expect(data.characters[0]?.name).toBe("ホタル");
    expect(data.characters[0]?.path).toBe("壊滅");
    expect(data.characters[0]?.lightCone?.name).toBe("Flickering Stars");
    expect(data.characters[0]?.relics[0]?.setName).toBe("星の如く輝く天才");
    expect(data.characters[0]?.relics[0]?.main?.display).toBe("706");
    expect(data.characters[0]?.allStats.find((stat) => stat.name === "会心率")?.display).toBe("7.9%");
    expect(data.characters[0]?.comparisons.find((item) => item.label === "会心率")?.current).toBe(7.916);
    expect(data.characters[0]?.comparisons.find((item) => item.label === "速度")?.current).toBe(112.9);
    expect(data.characters[1]).toMatchObject({ name: "銀狼", element: "量子", path: "虚無" });

    const unresolved = normalizeEnkaPayload({ detailInfo: { avatarDetailList: [{ avatarId: 1310, level: 80, equipment: { tid: 99999, level: 80 }, relicList: [{ tid: 1, type: 1, level: 0, _flat: { setID: 99999, props: [] } }] }] } }, { characters: { "1310": { name: "ホタル", element: "Fire", path: "Warrior" } }, lightCones: {}, relicSets: {}, characterPromotions: {}, skillTrees: {} });
    expect(unresolved.characters[0]?.lightCone?.name).toBe("未解決（ID: 99999）");
    expect(unresolved.characters[0]?.relics[0]?.setName).toBe("未解決（ID: 99999）");
  });
});
