import { describe, expect, it } from "vitest";
import { guideFor } from "./buildAdvisor";
import { constellationProfileFor } from "./characterConstellations";
import { guideMetadataFor } from "./characterGuideMetadata";
import { normalizeGenshinPayload, normalizeZzzPayload } from "./gameProviders";
import { guideUpdateHistory } from "./guideUpdateHistory";
import { partyRecommendationsFor } from "./partyRecommendations";

const identity = (game: "hsr" | "genshin" | "zzz", sourceId: string, displayName: string) => ({ game, sourceId, key: `${game}:${sourceId}` as const, displayName, variantOf: null, resolved: true, resolution: "provider" as const });

describe("第4バッチのHSR個別ビルド", () => {
  it("アベンチュリン、トパーズ&カブ、花火、丹恒・飲月をロール共通値ではなく個別目標で返す", () => {
    const aventurine = guideFor("アベンチュリン", "存護");
    const topaz = guideFor("トパーズ&カブ", "巡狩");
    const sparkle = guideFor("花火", "調和");
    const danHeng = guideFor("丹恒・飲月", "壊滅");

    expect(aventurine.targets.find((target) => target.key === "defense")?.targets["目標"]).toBe(4000);
    expect(topaz.targets.find((target) => target.key === "critRate")?.targets["目標"]).toBe(80);
    expect(sparkle.targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(184);
    expect(danHeng.targets.find((target) => target.key === "attack")?.targets["目標"]).toBe(2500);
    [aventurine, topaz, sparkle, danHeng].forEach((guide) => {
      expect(guide.dataAsOf).toBe("2026-08-26");
      expect(guide.targetContext).toContain("公開プロフィール");
    });
  });
});

describe("第4バッチの原神・ZZZ個別ビルド", () => {
  it("原神3名の個別ステータスを公開プロフィール経路で選択する", () => {
    const avatar = (avatarId: number) => ({ avatarId, propMap: { "4001": { val: 90 } }, talentIdList: [1, 2], fightPropMap: { "20": 0.7, "22": 1.8, "23": 1.3, "28": 300, "2000": 32000, "2001": 1800, "2002": 900 }, equipList: [] });
    const result = normalizeGenshinPayload({ uid: "618285856", playerInfo: { nickname: "テスト旅人", level: 60 }, avatarInfoList: [avatar(10000078), avatar(10000046), avatar(10000065)] }, {
      characters: {
        "10000078": { NameTextMapHash: 1, Element: "Grass", WeaponType: "WEAPON_SWORD_ONE_HAND", SideIconName: "UI_Alhaitham" },
        "10000046": { NameTextMapHash: 2, Element: "Fire", WeaponType: "WEAPON_POLE", SideIconName: "UI_Hutao" },
        "10000065": { NameTextMapHash: 3, Element: "Electric", WeaponType: "WEAPON_SWORD_ONE_HAND", SideIconName: "UI_Kuki" },
      },
      loc: { ja: { "1": "アルハイゼン", "2": "胡桃", "3": "久岐忍" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));

    expect(byName["アルハイゼン"]?.comparisons.map((comparison) => comparison.key)).toEqual(["elementalMastery", "critRate", "critDmg", "energyRecharge"]);
    expect(byName["胡桃"]?.comparisons.find((comparison) => comparison.key === "elementalMastery")?.targets["目標"]).toBe(200);
    expect(byName["久岐忍"]?.comparisons.find((comparison) => comparison.key === "elementalMastery")?.targets["目標"]).toBe(900);
    ["アルハイゼン", "胡桃", "久岐忍"].forEach((name) => {
      expect(byName[name]?.guide.dataAsOf).toBe("2026-08-26");
      expect(byName[name]?.guide.targetContext).toContain("公開プロフィール");
    });
  });

  it("ZZZ3名の個別目標で異常掌握を衝撃力と混同せず、戦闘中効果を現在値に加えない", () => {
    const metadata = { ElementTypes: ["Physical"], ProfessionType: "Anomaly", Image: "/ui/zzz/avatar.png", BaseProps: { "11101": 100, "12101": 100, "12201": 86, "20101": 500, "21101": 5000, "31201": 150, "31401": 400 }, GrowthProps: {}, PromotionProps: [{}], CoreEnhancementProps: [{}] };
    const result = normalizeZzzPayload({ uid: "1300622089", PlayerInfo: { SocialDetail: { ProfileDetail: { Nickname: "テストプロキシ", Level: 60 } }, ShowcaseDetail: { AvatarList: [
      { Id: 1271, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1281, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1131, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
    ] } } }, {
      avatars: { "1271": { ...metadata, Name: "Avatar_Seth", ProfessionType: "Defense" }, "1281": { ...metadata, Name: "Avatar_Piper" }, "1131": { ...metadata, Name: "Avatar_Soukaku", ElementTypes: ["Ice"], ProfessionType: "Support" } },
      weapons: { "12001": { ItemName: "Weapon_Test", ImagePath: "/ui/zzz/weapon.png", MainStat: { PropertyId: 12101, PropertyValue: 50 }, SecondaryStat: {} } },
      equipments: { Items: {}, Suits: {} },
      locs: { ja: { Avatar_Seth: "セス", Avatar_Piper: "パイパー", Avatar_Soukaku: "蒼角", Weapon_Test: "テスト音動機" } },
      property: { "11101": { Name: "HP", Format: "{0:0}" }, "12101": { Name: "AttackBase", Format: "{0:0}" }, "12201": { Name: "Impact", Format: "{0:0}" }, "20101": { Name: "CritRateBase", Format: "{0:0.0}%" }, "21101": { Name: "CritDmgBase", Format: "{0:0.0}%" }, "31201": { Name: "AnomalyMastery", Format: "{0:0}" }, "31401": { Name: "AnomalyProficiency", Format: "{0:0}" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));

    expect(byName["セス"]?.comparisons.find((comparison) => comparison.key === "anomalyMastery")?.targets["目標"]).toBe(250);
    expect(byName["パイパー"]?.comparisons.find((comparison) => comparison.key === "anomalyProficiency")?.targets["目標"]).toBe(400);
    expect(byName["パイパー"]?.comparisons.find((comparison) => comparison.key === "impact")).toBeUndefined();
    expect(byName["蒼角"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(2500);
    ["セス", "パイパー", "蒼角"].forEach((name) => {
      expect(byName[name]?.guide.dataAsOf).toBe("2026-08-26");
      expect(byName[name]?.constellations.activeTargetChanges).toEqual([]);
    });
  });
});

describe("第4バッチの凸・推奨PT・履歴", () => {
  const profiles = [
    identity("hsr", "1304", "アベンチュリン"), identity("hsr", "1112", "トパーズ&カブ"), identity("hsr", "1306", "花火"), identity("hsr", "1213", "丹恒・飲月"),
    identity("genshin", "10000078", "アルハイゼン"), identity("genshin", "10000046", "胡桃"), identity("genshin", "10000065", "久岐忍"),
    identity("zzz", "1271", "セス"), identity("zzz", "1281", "パイパー"), identity("zzz", "1131", "蒼角"),
  ];

  it("全10名をIDキーで6段階の凸へ解決し、条件付き戦闘効果を目標補正にしない", () => {
    profiles.forEach((character) => {
      const profile = constellationProfileFor(character, 6);
      expect(profile.dataStatus).toBe("curated");
      expect(profile.effects.map((effect) => effect.level)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(profile.activeTargetChanges).toEqual([]);
      expect(profile.updatedAt).toBe("2026-08-26");
    });
    expect(constellationProfileFor(identity("hsr", "1304", "アベンチュリン"), 4).effects[3]?.description.ja).toContain("40%");
  });

  it("全10名へ本人を含む最大3案の個別PTと第4バッチ更新履歴を返す", () => {
    profiles.forEach(({ game, displayName }) => {
      const parties = partyRecommendationsFor(game, displayName);
      expect(parties.options).toHaveLength(3);
      expect(parties.options.every((option) => option.members.some((member) => member.name.ja === displayName))).toBe(true);
      expect(parties.updatedAt).toBe("2026-08-26");
      expect(guideMetadataFor(game, displayName).updatedAt).toBe("2026-08-26");
    });
    expect(partyRecommendationsFor("hsr", "花火").options[2]?.synergy[0]?.ja).toContain("E2");
    const history = guideUpdateHistory();
    const updated = history.characters.filter((character) => profiles.some((profile) => profile.game === character.game && profile.displayName === character.name));
    expect(updated).toHaveLength(10);
    expect(updated.every((character) => character.events.some((event) => event.title.includes("第4バッチ")))).toBe(true);
  });
});
