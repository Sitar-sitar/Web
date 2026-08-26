import { describe, expect, it } from "vitest";
import { guideFor } from "./buildAdvisor";
import { constellationProfileFor } from "./characterConstellations";
import { guideMetadataFor } from "./characterGuideMetadata";
import { normalizeGenshinPayload, normalizeZzzPayload } from "./gameProviders";
import { guideUpdateHistory } from "./guideUpdateHistory";
import { partyRecommendationsFor } from "./partyRecommendations";

const identity = (game: "hsr" | "genshin" | "zzz", sourceId: string, displayName: string) => ({ game, sourceId, key: `${game}:${sourceId}` as const, displayName, variantOf: null, resolved: true, resolution: "provider" as const });

describe("第6バッチの個別ビルド", () => {
  it("HSR4名をロール共通値ではなく更新日付きの個別公開値で返す", () => {
    const bronya = guideFor("ブローニャ", "調和");
    const silverWolf = guideFor("銀狼", "虚無");
    const fuXuan = guideFor("符玄", "存護");
    const luocha = guideFor("羅刹", "豊穣");
    expect(bronya.targets.find((target) => target.key === "critDmg")?.targets["目標"]).toBe(150);
    expect(silverWolf.targets.find((target) => target.key === "effectHitRate")?.targets["目標"]).toBe(67);
    expect(fuXuan.targets.find((target) => target.key === "hp")?.targets["目標"]).toBe(7000);
    expect(luocha.targets.find((target) => target.key === "attack")?.targets["目標"]).toBe(2400);
    [bronya, silverWolf, fuXuan, luocha].forEach((guide) => {
      expect(guide.dataAsOf).toBe("2026-08-26");
      expect(guide.targetContext).toContain("公開プロフィール");
    });
    expect(silverWolf.targetContext).toContain("hsr:1506");
  });

  it("原神3名を個別の公開プロフィール比較で正規化する", () => {
    const avatar = (avatarId: number) => ({ avatarId, propMap: { "4001": { val: 90 } }, talentIdList: [1, 2], fightPropMap: { "20": 0.7, "22": 1.6, "23": 1.8, "28": 150, "2000": 30000, "2001": 2000, "2002": 800 }, equipList: [] });
    const result = normalizeGenshinPayload({ uid: "618285856", playerInfo: { nickname: "テスト旅人", level: 60 }, avatarInfoList: [avatar(10000082), avatar(10000058), avatar(10000049)] }, {
      characters: {
        "10000082": { NameTextMapHash: 1, Element: "Grass", WeaponType: "WEAPON_CATALYST", SideIconName: "UI_Baizhu" },
        "10000058": { NameTextMapHash: 2, Element: "Electric", WeaponType: "WEAPON_CATALYST", SideIconName: "UI_Yae" },
        "10000049": { NameTextMapHash: 3, Element: "Fire", WeaponType: "WEAPON_BOW", SideIconName: "UI_Yoimiya" },
      },
      loc: { ja: { "1": "白朮", "2": "八重神子", "3": "宵宮" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));
    expect(byName["白朮"]?.comparisons.find((comparison) => comparison.key === "energyRecharge")?.targets["目標"]).toBe(180);
    expect(byName["八重神子"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(2000);
    expect(byName["宵宮"]?.comparisons.find((comparison) => comparison.key === "critDmg")?.targets["目標"]).toBe(160);
    ["白朮", "八重神子", "宵宮"].forEach((name) => expect(byName[name]?.guide.targetContext).toContain("公開プロフィール"));
  });

  it("ZZZ3名を個別比較し、心象映画由来の戦闘中補正を現在値へ足さない", () => {
    const base = { Image: "/ui/zzz/avatar.png", BaseProps: { "11101": 12000, "12101": 1800, "12201": 169, "20101": 500, "21101": 5000, "23101": 3800, "31201": 200, "31401": 200 }, GrowthProps: {}, PromotionProps: [{}], CoreEnhancementProps: [{}] };
    const result = normalizeZzzPayload({ uid: "1300622089", PlayerInfo: { SocialDetail: { ProfileDetail: { Nickname: "テストプロキシ", Level: 60 } }, ShowcaseDetail: { AvatarList: [
      { Id: 1071, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1211, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1251, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
    ] } } }, {
      avatars: { "1071": { ...base, Name: "Avatar_Caesar", ElementTypes: ["Physical"], ProfessionType: "Defense" }, "1211": { ...base, Name: "Avatar_Rina", ElementTypes: ["Electric"], ProfessionType: "Support" }, "1251": { ...base, Name: "Avatar_Qingyi", ElementTypes: ["Electric"], ProfessionType: "Stun" } },
      weapons: { "12001": { ItemName: "Weapon_Test", ImagePath: "/ui/zzz/weapon.png", MainStat: { PropertyId: 12101, PropertyValue: 50 }, SecondaryStat: {} } }, equipments: { Items: {}, Suits: {} },
      locs: { ja: { Avatar_Caesar: "シーザー", Avatar_Rina: "リナ", Avatar_Qingyi: "青衣", Weapon_Test: "テスト音動機" } },
      property: { "11101": { Name: "HP", Format: "{0:0}" }, "12101": { Name: "AttackBase", Format: "{0:0}" }, "12201": { Name: "Impact", Format: "{0:0}" }, "20101": { Name: "CritRateBase", Format: "{0:0.0}%" }, "21101": { Name: "CritDmgBase", Format: "{0:0.0}%" }, "23101": { Name: "PenRatio", Format: "{0:0.0}%" }, "31201": { Name: "AnomalyMastery", Format: "{0:0}" }, "31401": { Name: "AnomalyProficiency", Format: "{0:0}" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));
    expect(byName["シーザー"]?.comparisons.find((comparison) => comparison.key === "impact")?.targets["目標"]).toBe(145);
    expect(byName["リナ"]?.comparisons.find((comparison) => comparison.key === "penRatio")?.targets["目標"]).toBe(38);
    expect(byName["青衣"]?.comparisons.find((comparison) => comparison.key === "impact")?.targets["目標"]).toBe(169);
    expect(byName["青衣"]?.allStats.find((stat) => stat.name === "会心率")?.display).toBe("5.0%");
  });
});

describe("第6バッチの凸と推奨PT", () => {
  const profiles = [
    identity("hsr", "1101", "ブローニャ"), identity("hsr", "1006", "銀狼"), identity("hsr", "1208", "符玄"), identity("hsr", "1203", "羅刹"),
    identity("genshin", "10000082", "白朮"), identity("genshin", "10000058", "八重神子"), identity("genshin", "10000049", "宵宮"),
    identity("zzz", "1071", "シーザー"), identity("zzz", "1211", "リナ"), identity("zzz", "1251", "青衣"),
  ];

  it("全10名を実ソースIDキーで6段階の凸へ解決し、条件付き戦闘効果を目標補正にしない", () => {
    profiles.forEach((character) => {
      const profile = constellationProfileFor(character, 6);
      expect(profile.dataStatus).toBe("curated");
      expect(profile.effects.map((effect) => effect.level)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(profile.activeTargetChanges).toEqual([]);
      expect(profile.updatedAt).toBe("2026-08-26");
    });
    expect(constellationProfileFor(identity("hsr", "1506", "銀狼Lv.999"), 6).dataStatus).toBe("preparing");
  });

  it("全10名へ本人を含む最大3案の更新日付きPTとメタデータを返す", () => {
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
    expect(updated.every((character) => character.events.some((event) => event.title.includes("第6バッチ")))).toBe(true);
  });
});
