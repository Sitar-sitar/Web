import { describe, expect, it, vi } from "vitest";
import { equipmentActionsFor, guideFor, lookupUidBuild, lookupWithFallback, UidResponseCache, normalizeMihomoPayload, priorityRecommendations, withGuideMetadata } from "./buildAdvisor";
import { normalizeEnkaPayload } from "./enkaFallback";
import { CHARACTER_GUIDE_CATALOG, HSR_RUNTIME_PATHS, ZZZ_RUNTIME_PROFESSIONS } from "./characterGuideCatalog";
import { CHARACTER_GUIDE_METADATA, guideMetadataFor } from "./characterGuideMetadata";
import { expectedProfileFor } from "./expectedGuideProfiles";
import { generatedGenshinGuide, generatedZzzGuide } from "./individualGuides";

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
          { field: "break_dmg", name: "撃破特効", value: 2.4, display: "240.0%", percent: true },
          { field: "attack_added_ratio", name: "攻撃力%", value: 0.5, display: "50.0%", percent: true },
        ],
        relics: [{ id: "1", name: "鉄騎", set_name: "鉄騎の執行者", level: 15, icon: "https://example.com/relic.png", main_affix: { name: "攻撃力%", value: 0.4, display: "43.2%", percent: true }, sub_affix: [] }],
      }],
    });

    expect(data.player.name).toBe("テスト開拓者");
    expect(data.characters[0]?.relics).toHaveLength(1);
    expect(data.characters[0]?.guide.relicSet).toContain("鉄騎");
    expect(data.characters[0]?.comparisons.find((item) => item.key === "speed")?.achieved["目標"]).toBe(true);
    expect(data.characters[0]?.comparisons.find((item) => item.key === "breakEffect")?.current).toBe(240);
    expect(data.characters[0]?.equipmentActions.find((action) => action.recommendationKey === "breakEffect")).toMatchObject({ slot: "連結縄", action: "主ステータスを変更" });
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

  it("第1バッチHSR4名は最新の個別目標を返し、ロール共通値へ戻らない", () => {
    const guides = Object.fromEntries([
      ["ホタル", guideFor("ホタル", "壊滅")],
      ["アグライア", guideFor("アグライア", "記憶")],
      ["アナイクス", guideFor("アナイクス", "知恵")],
      ["キャストリス", guideFor("キャストリス", "記憶")],
    ]);

    expect(guides["ホタル"]?.targets.map((target) => target.key)).toEqual(["breakEffect", "speed", "attackPercent"]);
    expect(guides["アグライア"]?.targets.map((target) => target.key)).toEqual(["critRate", "critDmg", "speed"]);
    expect(guides["アナイクス"]?.targets.map((target) => target.key)).toEqual(["critRate", "critDmg", "speed", "attack"]);
    expect(guides["アナイクス"]?.targets.find((target) => target.key === "critRate")?.targets["目標"]).toBe(80);
    expect(guides["キャストリス"]?.mainStats.find((stat) => stat.slot === "脚部")?.value).toBe("HP%");
    Object.values(guides).forEach((guide) => {
      expect(guide?.dataAsOf).toBe("2026-08-25");
      expect(guide?.sourceLabel).toContain("Game8");
      expect(guide?.targetContext).toBeTruthy();
    });
  });

  it("HSR取得元の開拓者名称マクロをID別実装ラベルへ正規化する", () => {
    const data = normalizeMihomoPayload({
      player: { uid: "800000004", nickname: "テスト開拓者" },
      characters: [{ id: "8005", name: "{NICKNAME}", portrait: "https://example.com/trailblazer.png", path: { name: "調和" }, element: { name: "虚数" }, properties: [], relics: [] }],
    });

    expect(data.characters[0]).toMatchObject({
      name: "開拓者（虚数・調和）",
      identity: { key: "hsr:8005", variantOf: "開拓者", resolution: "curated-id-map" },
      portrait: "https://example.com/trailblazer.png",
    });
    expect(data.characters[0]?.guide.targetContext).toContain("開拓者（虚数・調和）");
  });

  it("既存の精密定義がないキャラクターにも個別プロファイルとデータ時点を付与する", () => {
    const data = normalizeMihomoPayload({
      player: { uid: "800000003", nickname: "テスト開拓者" },
      characters: [
        { id: "1002", name: "丹恒", path: { name: "巡狩" }, element: { name: "風" }, properties: [], relics: [] },
        { id: "1211", name: "白露", path: { name: "豊穣" }, element: { name: "雷" }, properties: [], relics: [] },
      ],
    });
    const byName = Object.fromEntries(data.characters.map((character) => [character.name, character]));

    expect(byName["丹恒"]?.guide.targetContext).toContain("丹恒用");
    expect(byName["白露"]?.comparisons.map((comparison) => comparison.key)).toEqual(["speed", "effectRes", "hpPercent"]);
    expect(byName["丹恒"]?.guide.dataAsOf).toBe("2026-08-18");
    expect(byName["白露"]?.guide.sourceLabel).toContain("KQM");
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
      characters: { "1310": { name: "ホタル", element: "Fire", path: "Warrior" }, "1506": { name: "銀狼LV.999", element: "Imaginary", path: "Elation" } },
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
    expect(data.characters[0]?.comparisons.map((item) => item.key)).toEqual(["breakEffect", "speed", "attackPercent"]);
    expect(data.characters[0]?.guide.targetContext).toContain("ホタル専用");
    expect(data.characters[0]?.comparisons.find((item) => item.label === "速度")?.current).toBe(112.9);
    expect(data.characters[1]).toMatchObject({ id: "1506", name: "銀狼Lv.999", element: "虚数", path: "歓楽", identity: { key: "hsr:1506", variantOf: "銀狼", resolution: "curated-id-map" } });
    expect(data.characters[1]?.guide.targetContext).toContain("銀狼Lv.999");
    expect(data.characters[1]?.guide.targetContext).not.toContain("銀狼専用");

    const unresolved = normalizeEnkaPayload({ detailInfo: { avatarDetailList: [{ avatarId: 1310, level: 80, equipment: { tid: 99999, level: 80 }, relicList: [{ tid: 1, type: 1, level: 0, _flat: { setID: 99999, props: [] } }] }] } }, { characters: { "1310": { name: "ホタル", element: "Fire", path: "Warrior" } }, lightCones: {}, relicSets: {}, characterPromotions: {}, skillTrees: {} });
    expect(unresolved.characters[0]?.lightCone?.name).toBe("未解決（ID: 99999）");
    expect(unresolved.characters[0]?.relics[0]?.setName).toBe("未解決（ID: 99999）");
  });
});

describe("全キャラクターガイドの網羅性", () => {
  it("収集済みの全キャラクター一覧に個別プロファイル・基準日・参照範囲を割り当てる", () => {
    const hsrGuides = CHARACTER_GUIDE_CATALOG.hsr.map((name) => guideFor(name, HSR_RUNTIME_PATHS[name] ?? ""));
    const genshinGuides = CHARACTER_GUIDE_CATALOG.genshin.map((name) => withGuideMetadata("genshin", generatedGenshinGuide(name), name));
    const zzzGuides = CHARACTER_GUIDE_CATALOG.zzz.map((name) => withGuideMetadata("zzz", generatedZzzGuide(name, ZZZ_RUNTIME_PROFESSIONS[name] ?? ""), name));

    expect(CHARACTER_GUIDE_CATALOG.dataAsOf).toBe("2026-08-18");
    expect(Object.keys(HSR_RUNTIME_PATHS)).toHaveLength(CHARACTER_GUIDE_CATALOG.hsr.length);
    expect(Object.keys(ZZZ_RUNTIME_PROFESSIONS)).toHaveLength(CHARACTER_GUIDE_CATALOG.zzz.length);
    expect(hsrGuides).toHaveLength(CHARACTER_GUIDE_CATALOG.hsr.length);
    expect(genshinGuides).toHaveLength(CHARACTER_GUIDE_CATALOG.genshin.length);
    expect(zzzGuides).toHaveLength(CHARACTER_GUIDE_CATALOG.zzz.length);
    const guideRecords = [
      ...CHARACTER_GUIDE_CATALOG.hsr.map((name, index) => ({ game: "hsr" as const, name, guide: hsrGuides[index]! })),
      ...CHARACTER_GUIDE_CATALOG.genshin.map((name, index) => ({ game: "genshin" as const, name, guide: genshinGuides[index]! })),
      ...CHARACTER_GUIDE_CATALOG.zzz.map((name, index) => ({ game: "zzz" as const, name, guide: zzzGuides[index]! })),
    ];
    guideRecords.forEach(({ game, name, guide }) => {
      const metadata = guideMetadataFor(game, name);
      expect(guide.targets.length).toBeGreaterThan(0);
      expect(guide.profileId).toBeTruthy();
      expect(guide.dataAsOf).toBe(metadata.dataAsOf);
      expect(guide.updatedAt).toBe(metadata.updatedAt);
      expect(guide.sourceLabel).toBeTruthy();
      expect(guide.targetContext).not.toContain("未登録");
    });
    (Object.keys(CHARACTER_GUIDE_METADATA) as Array<keyof typeof CHARACTER_GUIDE_METADATA>).forEach((game) => {
      expect(Object.keys(CHARACTER_GUIDE_METADATA[game])).toHaveLength(CHARACTER_GUIDE_CATALOG[game].length);
      CHARACTER_GUIDE_CATALOG[game].forEach((name) => {
        expect(CHARACTER_GUIDE_METADATA[game][name]).toMatchObject({ profileId: expect.any(String), dataAsOf: expect.stringMatching(/^2026-08-(18|25|26)$/), updatedAt: expect.stringMatching(/^2026-08-(18|25|26)$/) });
      });
    });
    CHARACTER_GUIDE_CATALOG.hsr.forEach((name, index) => expect(hsrGuides[index]?.profileId).toBe(expectedProfileFor("hsr", name)));
    CHARACTER_GUIDE_CATALOG.genshin.forEach((name, index) => expect(genshinGuides[index]?.profileId).toBe(expectedProfileFor("genshin", name)));
    CHARACTER_GUIDE_CATALOG.zzz.forEach((name, index) => expect(zzzGuides[index]?.profileId).toBe(expectedProfileFor("zzz", name)));
  });
});

describe("未達ステータスの優先強化提案", () => {
  it("目標水準までの相対不足が大きい項目を優先し、未取得値は提案から除外する", () => {
    const recommendations = priorityRecommendations([
      { key: "critRate", label: "会心率", unit: "%", current: 55, currentDisplay: "55.0%", targets: { "厳選": 85, "目標": 75, "妥協": 65 }, achieved: { "厳選": false, "目標": false, "妥協": false } },
      { key: "speed", label: "速度", unit: "", current: 128, currentDisplay: "128", targets: { "厳選": 160, "目標": 134, "妥協": 120 }, achieved: { "厳選": false, "目標": false, "妥協": true } },
      { key: "attack", label: "攻撃力", unit: "", current: null, currentDisplay: "未取得", targets: { "厳選": 3000, "目標": 2800, "妥協": 2500 }, achieved: { "厳選": null, "目標": null, "妥協": null } },
    ]);
    expect(recommendations).toHaveLength(2);
    expect(recommendations[0]).toMatchObject({ key: "critRate", priority: "最優先", deficit: 20 });
    expect(recommendations[1]).toMatchObject({ key: "speed", priority: "次点", deficit: 6 });
  });

  it("装備部位の主ステータス変更とサブステータス厳選を、現在の装備に応じて分けて提案する", () => {
    const guide = guideFor("黄泉", "虚無");
    const actions = equipmentActionsFor(guide, [
      { name: "遺物 3", slot: "胴体", main: { name: "HP%", display: "43.2%" } },
      { name: "遺物 4", slot: "脚部", main: { name: "速度", display: "25" } },
    ], [
      { key: "critDmg", label: "会心ダメ", unit: "%", current: 120, target: 150, deficit: 30, priority: "優先", rationale: "不足" },
      { key: "speed", label: "速度", unit: "", current: 120, target: 134, deficit: 14, priority: "優先", rationale: "不足" },
    ]);

    expect(actions[0]).toMatchObject({ slot: "胴体", action: "主ステータスを変更", desiredStat: "会心ダメ" });
    expect(actions[1]).toMatchObject({ slot: "脚部", action: "サブステータスを厳選", desiredStat: "速度" });
  });
});
