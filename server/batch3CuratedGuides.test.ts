import { describe, expect, it } from "vitest";
import { guideFor } from "./buildAdvisor";
import { constellationProfileFor } from "./characterConstellations";
import { guideMetadataFor } from "./characterGuideMetadata";
import { normalizeGenshinPayload, normalizeZzzPayload } from "./gameProviders";
import { guideUpdateHistory } from "./guideUpdateHistory";
import { partyRecommendationsFor } from "./partyRecommendations";

const identity = (game: "hsr" | "genshin" | "zzz", sourceId: string, displayName: string) => ({ game, sourceId, key: `${game}:${sourceId}`, displayName, variantOf: null, resolved: true, resolution: "catalog" as const });

describe("第3バッチのHSR個別ビルド", () => {
  it("サンデー、ブートヒル、黄泉、霊砂をロール共通値ではなく個別目標で返す", () => {
    const sunday = guideFor("サンデー", "調和");
    const boothill = guideFor("ブートヒル", "巡狩");
    const acheron = guideFor("黄泉", "虚無");
    const lingsha = guideFor("霊砂", "豊穣");

    expect(sunday.targets.find((target) => target.key === "critDmg")?.targets["目標"]).toBe(200);
    expect(boothill.targets.find((target) => target.key === "breakEffect")?.targets["目標"]).toBe(200);
    expect(acheron.targets.find((target) => target.key === "attack")?.targets["目標"]).toBe(3200);
    expect(lingsha.targets.find((target) => target.key === "attack")?.targets["目標"]).toBe(2700);
    [sunday, boothill, acheron, lingsha].forEach((guide) => {
      expect(guide.dataAsOf).toBe("2026-08-26");
      expect(guide.targetContext).toMatch(/戦闘中|公開プロフィール/);
    });
    expect(acheron.targetContext).toContain("E0/E1");
    expect(acheron.targetContext).toContain("E2");
  });
});

describe("第3バッチの原神・ZZZ個別ビルド", () => {
  it("原神3名の個別ステータスを公開プロフィール経路で選択する", () => {
    const avatar = (avatarId: number) => ({ avatarId, propMap: { "4001": { val: 90 } }, talentIdList: [1, 2], fightPropMap: { "20": 0.8, "22": 2, "23": 2.2, "28": 800, "2000": 45000, "2001": 1800, "2002": 900 }, equipList: [] });
    const result = normalizeGenshinPayload({ uid: "618285856", playerInfo: { nickname: "テスト旅人", level: 60 }, avatarInfoList: [avatar(10000052), avatar(10000073), avatar(10000030)] }, {
      characters: {
        "10000052": { NameTextMapHash: 1, Element: "Electric", WeaponType: "WEAPON_POLE", SideIconName: "UI_Raiden" },
        "10000073": { NameTextMapHash: 2, Element: "Grass", WeaponType: "WEAPON_CATALYST", SideIconName: "UI_Nahida" },
        "10000030": { NameTextMapHash: 3, Element: "Rock", WeaponType: "WEAPON_POLE", SideIconName: "UI_Zhongli" },
      },
      loc: { ja: { "1": "雷電将軍", "2": "ナヒーダ", "3": "鍾離" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));

    expect(byName["雷電将軍"]?.comparisons.map((comparison) => comparison.key)).toEqual(["energyRecharge", "attack", "critRate", "critDmg"]);
    expect(byName["ナヒーダ"]?.comparisons.map((comparison) => comparison.key)).toEqual(["elementalMastery", "energyRecharge"]);
    expect(byName["鍾離"]?.comparisons.map((comparison) => comparison.key)).toEqual(["hp", "energyRecharge"]);
    ["雷電将軍", "ナヒーダ", "鍾離"].forEach((name) => {
      expect(byName[name]?.guide.dataAsOf).toBe("2026-08-26");
      expect(byName[name]?.guide.targetContext).toContain("公開プロフィール");
    });
    expect(byName["雷電将軍"]?.guide.targetContext).toContain("超開花");
  });

  it("ZZZ3名の個別目標を公開プロフィール経路で選択し、戦闘中効果を現在値に加えない", () => {
    const metadata = { ElementTypes: ["Ether"], ProfessionType: "Anomaly", Image: "/ui/zzz/avatar.png", BaseProps: { "11101": 100, "12101": 100, "20101": 500, "21101": 5000 }, GrowthProps: {}, PromotionProps: [{}], CoreEnhancementProps: [{}] };
    const result = normalizeZzzPayload({ uid: "1300622089", PlayerInfo: { SocialDetail: { ProfileDetail: { Nickname: "テストプロキシ", Level: 60 } }, ShowcaseDetail: { AvatarList: [
      { Id: 1331, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1261, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1191, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
    ] } } }, {
      avatars: { "1331": { ...metadata, Name: "Avatar_Vivian" }, "1261": { ...metadata, Name: "Avatar_Jane", ElementTypes: ["Physical"] }, "1191": { ...metadata, Name: "Avatar_Ellen", ElementTypes: ["Ice"], ProfessionType: "Attack" } },
      weapons: { "12001": { ItemName: "Weapon_Test", ImagePath: "/ui/zzz/weapon.png", MainStat: { PropertyId: 12101, PropertyValue: 50 }, SecondaryStat: {} } },
      equipments: { Items: {}, Suits: {} },
      locs: { ja: { Avatar_Vivian: "ビビアン", Avatar_Jane: "ジェーン", Avatar_Ellen: "エレン", Weapon_Test: "テスト音動機" } },
      property: { "11101": { Name: "HP", Format: "{0:0}" }, "12101": { Name: "AttackBase", Format: "{0:0}" }, "20101": { Name: "CritRateBase", Format: "{0:0.0}%" }, "21101": { Name: "CritDmgBase", Format: "{0:0.0}%" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));

    expect(byName["ビビアン"]?.comparisons.find((comparison) => comparison.key === "anomalyMastery")?.targets["目標"]).toBe(430);
    expect(byName["ジェーン"]?.comparisons.find((comparison) => comparison.key === "anomalyMastery")?.targets["目標"]).toBe(400);
    expect(byName["エレン"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(2500);
    ["ビビアン", "ジェーン", "エレン"].forEach((name) => {
      expect(byName[name]?.guide.dataAsOf).toBe("2026-08-26");
      expect(byName[name]?.constellations.activeTargetChanges).toEqual([]);
    });
  });
});

describe("第3バッチの凸・推奨PT・履歴", () => {
  const profiles = [
    identity("hsr", "1313", "サンデー"), identity("hsr", "1315", "ブートヒル"), identity("hsr", "1308", "黄泉"), identity("hsr", "1222", "霊砂"),
    identity("genshin", "10000052", "雷電将軍"), identity("genshin", "10000073", "ナヒーダ"), identity("genshin", "10000030", "鍾離"),
    identity("zzz", "1331", "ビビアン"), identity("zzz", "1261", "ジェーン"), identity("zzz", "1191", "エレン"),
  ];

  it("全10名をIDキーで6段階の凸へ解決し、条件付き戦闘効果を目標補正にしない", () => {
    profiles.forEach((character) => {
      const profile = constellationProfileFor(character, 6);
      expect(profile.dataStatus).toBe("curated");
      expect(profile.effects.map((effect) => effect.level)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(profile.activeTargetChanges).toEqual([]);
      expect(profile.updatedAt).toBe("2026-08-26");
    });
    expect(constellationProfileFor(identity("hsr", "1308", "黄泉"), 1).effects[0]?.description.ja).toContain("18%");
  });

  it("全10名へ本人を含む最大3案の個別PTと更新履歴を返す", () => {
    const expectedFirstMembers: Array<["hsr" | "genshin" | "zzz", string]> = [
      ["hsr", "サンデー"], ["hsr", "ブートヒル"], ["hsr", "黄泉"], ["hsr", "霊砂"], ["genshin", "雷電将軍"], ["genshin", "ナヒーダ"], ["genshin", "鍾離"], ["zzz", "ビビアン"], ["zzz", "ジェーン"], ["zzz", "エレン"],
    ];
    expectedFirstMembers.forEach(([game, name]) => {
      const parties = partyRecommendationsFor(game, name);
      expect(parties.options).toHaveLength(3);
      expect(parties.options.every((option) => option.members.some((member) => member.name.ja === name))).toBe(true);
      expect(parties.updatedAt).toBe("2026-08-26");
      expect(guideMetadataFor(game, name).updatedAt).toBe("2026-08-26");
    });
    const acheron = partyRecommendationsFor("hsr", "黄泉");
    expect(acheron.options[0]?.synergy[0]?.ja).toContain("E0/E1");
    expect(acheron.options[2]?.synergy[0]?.ja).toContain("E2");
    const history = guideUpdateHistory();
    const updated = history.characters.filter((character) => profiles.some((profile) => profile.game === character.game && profile.displayName === character.name));
    expect(updated).toHaveLength(10);
    expect(updated.every((character) => character.events.some((event) => event.title.includes("第3バッチ")))).toBe(true);
  });
});
