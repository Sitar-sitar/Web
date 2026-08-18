import { describe, expect, it } from "vitest";
import { normalizeGenshinPayload, normalizeZzzPayload } from "./gameProviders";

describe("原神公開プロフィールの正規化", () => {
  it("武器・聖遺物・主要ステータスを共通表示モデルへ変換する", () => {
    const result = normalizeGenshinPayload({
      uid: "618285856",
      playerInfo: { nickname: "テスト旅人", level: 60 },
      avatarInfoList: [{
        avatarId: 10000002,
        propMap: { "4001": { val: 90 } }, talentIdList: [1, 2],
        fightPropMap: { "20": 0.72, "22": 1.55, "23": 1.42, "28": 120, "2000": 18000, "2001": 2100, "2002": 900 },
        equipList: [
          { itemId: 1, weapon: { level: 90, affixMap: { "1": 2 } }, flat: { itemType: "ITEM_WEAPON", nameTextMapHash: 2, icon: "Weapon_Test" } },
          { itemId: 2, reliquary: { level: 21, mainPropId: "FIGHT_PROP_CRITICAL" }, flat: { itemType: "ITEM_RELIQUARY", nameTextMapHash: 3, setNameTextMapHash: 4, icon: "Artifact_Test", reliquaryMainstat: { mainPropId: "FIGHT_PROP_CRITICAL", statValue: 0.311 }, reliquarySubstats: [{ appendPropId: "FIGHT_PROP_CRITICAL_HURT", statValue: 0.202 }] } },
        ],
      }],
    }, {
      characters: { "10000002": { NameTextMapHash: 1, Element: "Ice", WeaponType: "WEAPON_SWORD_ONE_HAND", SideIconName: "UI_AvatarIcon_Side_Ayaka" } },
      loc: { ja: { "1": "神里綾華", "2": "テスト武器", "3": "テスト聖遺物", "4": "氷風を彷徨う勇士" } },
    });

    expect(result.player.name).toBe("テスト旅人");
    expect(result.characters[0]?.name).toBe("神里綾華");
    expect(result.characters[0]?.lightCone?.name).toBe("テスト武器");
    expect(result.characters[0]?.relics[0]?.setName).toBe("氷風を彷徨う勇士");
    expect(result.characters[0]?.comparisons.find((comparison) => comparison.key === "critRate")?.current).toBe(72);
    expect(result.characters[0]?.comparisons.find((comparison) => comparison.key === "critDmg")?.current).toBe(155);
  });
});

describe("ZZZ公開プロフィールの正規化", () => {
  it("音動機・ドライバディスク・会心ステータスを共通表示モデルへ変換する", () => {
    const result = normalizeZzzPayload({
      uid: "17287976",
      PlayerInfo: {
        SocialDetail: { ProfileDetail: { Nickname: "テストプロキシ", Level: 60 } },
        ShowcaseDetail: { AvatarList: [{
          Id: 1011, Level: 60, TalentLevel: 1, Weapon: { Id: 12001, Level: 60, BreakLevel: 3 },
          EquippedList: [{ Slot: 4, Equipment: { Id: 32641, Level: 15, Uid: 99, MainPropertyList: [{ PropertyId: 12103, PropertyValue: 79 }], RandomPropertyList: [{ PropertyId: 20103, PropertyLevel: 2, PropertyValue: 240 }] } }, { Slot: 5, Equipment: { Id: 32642, Level: 15, Uid: 100, MainPropertyList: [], RandomPropertyList: [] } }],
        }] },
      },
    }, {
      avatars: { "1011": { Name: "Avatar_Test", ElementTypes: ["Elec"], ProfessionType: "Attack", Image: "/ui/zzz/avatar.png", BaseProps: { "11101": 100, "12101": 100, "20101": 500, "21101": 5000 }, GrowthProps: {}, PromotionProps: [{}], CoreEnhancementProps: [{}] } },
      weapons: { "12001": { ItemName: "Weapon_Test", ImagePath: "/ui/zzz/weapon.png", MainStat: { PropertyId: 12101, PropertyValue: 50 }, SecondaryStat: { PropertyId: 21101, PropertyValue: 4800 } } },
      equipments: { Items: { "32641": { Rarity: 4, SuitId: 32600 }, "32642": { Rarity: 4, SuitId: 32600 } }, Suits: { "32600": { Name: "EquipmentSuit_32600_name", SetBonusProps: { "20103": 800 } } } },
      locs: { ja: { Avatar_Test: "0号・アンビー", Weapon_Test: "テスト音動機", EquipmentSuit_32600_name: "テストディスク", CritRate: "会心率", AttackFlat: "攻撃力" } },
      property: { "11101": { Name: "HP", Format: "{0:0}" }, "12101": { Name: "AttackBase", Format: "{0:0}" }, "12103": { Name: "AttackFlat", Format: "{0:0}" }, "20101": { Name: "CritRateBase", Format: "{0:0.0}%" }, "20103": { Name: "CritRate", Format: "{0:0.0}%" }, "21101": { Name: "CritDmgBase", Format: "{0:0.0}%" } },
    });

    expect(result.player.name).toBe("テストプロキシ");
    expect(result.characters[0]?.name).toBe("0号・アンビー");
    expect(result.characters[0]?.lightCone?.name).toBe("テスト音動機");
    expect(result.characters[0]?.relics[0]?.setName).toBe("テストディスク");
    expect(result.characters[0]?.comparisons.find((comparison) => comparison.key === "critRate")?.current).toBe(17.8);
    expect(result.characters[0]?.comparisons.find((comparison) => comparison.key === "critDmg")?.current).toBe(141.2);
    expect(result.characters[0]?.allStats.find((stat) => stat.name === "攻撃力")?.display).toBe("1070");
    expect(result.characters[0]?.comparisons.map((comparison) => comparison.key)).toEqual(["critRate", "critDmg", "attack"]);
    expect(result.characters[0]?.guide.targetContext).toContain("0号・アンビー専用");
  });

  it("キャラクターごとに異なる有効ステータスと優先度注記を選択する", () => {
    const baseMetadata = { ElementTypes: ["Elec"], ProfessionType: "Attack", Image: "/ui/zzz/avatar.png", BaseProps: { "11101": 100, "12101": 100, "20101": 500, "21101": 5000 }, GrowthProps: {}, PromotionProps: [{}], CoreEnhancementProps: [{}] };
    const result = normalizeZzzPayload({
      uid: "17287976",
      PlayerInfo: { SocialDetail: { ProfileDetail: { Nickname: "テストプロキシ", Level: 60 } }, ShowcaseDetail: { AvatarList: [
        { Id: 1011, Level: 60, TalentLevel: 0, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
        { Id: 1331, Level: 60, TalentLevel: 0, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
        { Id: 1311, Level: 60, TalentLevel: 0, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      ] } },
    }, {
      avatars: { "1011": { ...baseMetadata, Name: "Avatar_Anby" }, "1331": { ...baseMetadata, Name: "Avatar_Vivian" }, "1311": { ...baseMetadata, Name: "Avatar_Astra" } },
      weapons: { "12001": { ItemName: "Weapon_Test", ImagePath: "/ui/zzz/weapon.png", MainStat: { PropertyId: 12101, PropertyValue: 50 }, SecondaryStat: {} } },
      equipments: { Items: {}, Suits: {} },
      locs: { ja: { Avatar_Anby: "0号・アンビー", Avatar_Vivian: "ビビアン", Avatar_Astra: "アストラ", Weapon_Test: "テスト音動機" } },
      property: { "11101": { Name: "HP", Format: "{0:0}" }, "12101": { Name: "AttackBase", Format: "{0:0}" }, "20101": { Name: "CritRateBase", Format: "{0:0.0}%" }, "21101": { Name: "CritDmgBase", Format: "{0:0.0}%" } },
    });

    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));
    expect(byName["0号・アンビー"]?.comparisons.map((comparison) => comparison.key)).toEqual(["critRate", "critDmg", "attack"]);
    expect(byName["ビビアン"]?.comparisons.map((comparison) => comparison.key)).toEqual(["anomalyMastery", "attack"]);
    expect(byName["アストラ"]?.comparisons.map((comparison) => comparison.key)).toEqual(["attack"]);
    expect(byName["0号・アンビー"]?.guide.targetContext).toContain("0号・アンビー専用");
    expect(byName["ビビアン"]?.guide.targetContext).toContain("ビビアン専用");
    expect(byName["アストラ"]?.guide.targetContext).toContain("アストラ専用");
  });
});
