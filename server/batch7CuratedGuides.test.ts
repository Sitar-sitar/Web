import { describe, expect, it } from "vitest";
import { guideFor } from "./buildAdvisor";
import { constellationProfileFor } from "./characterConstellations";
import { guideMetadataFor } from "./characterGuideMetadata";
import { normalizeGenshinPayload, normalizeZzzPayload } from "./gameProviders";
import { guideUpdateHistory } from "./guideUpdateHistory";
import { partyRecommendationsFor } from "./partyRecommendations";

const identity = (game: "hsr" | "genshin" | "zzz", sourceId: string, displayName: string) => ({ game, sourceId, key: `${game}:${sourceId}` as const, displayName, variantOf: null, resolved: true, resolution: "provider" as const });

describe("第7バッチの個別ビルド", () => {
  it("HSR4名をロール共通値ではなく更新日付きの個別公開値で返す", () => {
    const archer = guideFor("アーチャー", "巡狩");
    const arlan = guideFor("アーラン", "壊滅");
    const asta = guideFor("アスター", "調和");
    const argenti = guideFor("アルジェンティ", "知恵");
    expect(archer.targets.find((target) => target.key === "critRate")?.targets["目標"]).toBe(100);
    expect(archer.targets.some((target) => target.key === "speed")).toBe(false);
    expect(arlan.targets.find((target) => target.key === "attack")?.targets["目標"]).toBe(2500);
    expect(asta.targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(134);
    expect(argenti.targets.find((target) => target.key === "critDmg")?.targets["目標"]).toBe(150);
    [archer, arlan, asta, argenti].forEach((guide) => {
      expect(guide.dataAsOf).toBe("2026-08-26");
      expect(guide.targetContext).toContain("公開プロフィール");
    });
  });

  it("原神3名を個別の公開プロフィール比較で正規化する", () => {
    const avatar = (avatarId: number) => ({ avatarId, propMap: { "4001": { val: 90 } }, talentIdList: [1, 2], fightPropMap: { "20": 0.6, "22": 1.7, "23": 1.4, "28": 1.5, "2000": 24000, "2001": 1800, "2002": 2000 }, equipList: [] });
    const result = normalizeGenshinPayload({ uid: "618285856", playerInfo: { nickname: "テスト旅人", level: 60 }, avatarInfoList: [avatar(10000062), avatar(10000121), avatar(10000038)] }, {
      characters: {
        "10000062": { NameTextMapHash: 1, Element: "Ice", WeaponType: "WEAPON_BOW", SideIconName: "UI_Aloy" },
        "10000121": { NameTextMapHash: 2, Element: "Water", WeaponType: "WEAPON_CLAYMORE", SideIconName: "UI_Aino" },
        "10000038": { NameTextMapHash: 3, Element: "Rock", WeaponType: "WEAPON_SWORD_ONE_HAND", SideIconName: "UI_Albedo" },
      },
      loc: { ja: { "1": "アーロイ", "2": "アイノ", "3": "アルベド" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));
    expect(byName["アーロイ"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(1600);
    expect(byName["アイノ"]?.comparisons.find((comparison) => comparison.key === "elementalMastery")?.targets["目標"]).toBe(700);
    expect(byName["アルベド"]?.comparisons.find((comparison) => comparison.key === "defense")?.targets["目標"]).toBe(2000);
    ["アーロイ", "アイノ", "アルベド"].forEach((name) => expect(byName[name]?.guide.targetContext).toContain("公開プロフィール"));
  });

  it("ZZZ3名を個別比較し、心象映画由来の戦闘中補正を現在値へ足さない", () => {
    const base = { Image: "/ui/zzz/avatar.png", BaseProps: { "11101": 10000, "12101": 1800, "12201": 120, "20101": 500, "21101": 5000, "23101": 0, "31201": 94, "31401": 93 }, GrowthProps: {}, PromotionProps: [{}], CoreEnhancementProps: [{}] };
    const result = normalizeZzzPayload({ uid: "1300622089", PlayerInfo: { SocialDetail: { ProfileDetail: { Nickname: "テストプロキシ", Level: 60 } }, ShowcaseDetail: { AvatarList: [
      { Id: 1041, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1461, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1361, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
    ] } } }, {
      avatars: { "1041": { ...base, Name: "Avatar_Soldier11", ElementTypes: ["Fire"], ProfessionType: "Attack" }, "1461": { ...base, Name: "Avatar_Seed", ElementTypes: ["Electric"], ProfessionType: "Attack" }, "1361": { ...base, Name: "Avatar_Trigger", ElementTypes: ["Electric"], ProfessionType: "Stun" } },
      weapons: { "12001": { ItemName: "Weapon_Test", ImagePath: "/ui/zzz/weapon.png", MainStat: { PropertyId: 12101, PropertyValue: 50 }, SecondaryStat: {} } }, equipments: { Items: {}, Suits: {} },
      locs: { ja: { Avatar_Soldier11: "「11号」", Avatar_Seed: "「シード」", Avatar_Trigger: "「トリガー」", Weapon_Test: "テスト音動機" } },
      property: { "11101": { Name: "HP", Format: "{0:0}" }, "12101": { Name: "AttackBase", Format: "{0:0}" }, "12201": { Name: "Impact", Format: "{0:0}" }, "20101": { Name: "CritRateBase", Format: "{0:0.0}%" }, "21101": { Name: "CritDmgBase", Format: "{0:0.0}%" }, "23101": { Name: "PenRatio", Format: "{0:0.0}%" }, "31201": { Name: "AnomalyMastery", Format: "{0:0}" }, "31401": { Name: "AnomalyProficiency", Format: "{0:0}" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));
    expect(byName["「11号」"]?.comparisons.find((comparison) => comparison.key === "critRate")?.targets["目標"]).toBe(80);
    expect(byName["「シード」"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(2700);
    expect(byName["「トリガー」"]?.comparisons.find((comparison) => comparison.key === "critRate")?.targets["目標"]).toBe(90);
    expect(byName["「シード」"]?.allStats.find((stat) => stat.name === "会心率")?.display).toBe("5.0%");
  });
});

describe("第7バッチの凸と推奨PT", () => {
  const profiles = [
    identity("hsr", "1015", "アーチャー"), identity("hsr", "1008", "アーラン"), identity("hsr", "1009", "アスター"), identity("hsr", "1302", "アルジェンティ"),
    identity("genshin", "10000121", "アイノ"), identity("genshin", "10000038", "アルベド"),
    identity("zzz", "1041", "「11号」"), identity("zzz", "1461", "「シード」"), identity("zzz", "1361", "「トリガー」"),
  ];

  it("確認済み9名を実ソースIDキーで6段階の凸へ解決し、条件付き戦闘効果を目標補正にしない", () => {
    profiles.forEach((character) => {
      const profile = constellationProfileFor(character, 6);
      expect(profile.dataStatus).toBe("curated");
      expect(profile.effects.map((effect) => effect.level)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(profile.activeTargetChanges).toEqual([]);
      expect(profile.updatedAt).toBe("2026-08-26");
    });
    const aloy = constellationProfileFor(identity("genshin", "10000062", "アーロイ"), 6);
    expect(aloy.dataStatus).toBe("preparing");
    expect(aloy.effects).toEqual([]);
    expect(aloy.activeTargetChanges).toEqual([]);
  });

  it("全10名へ本人を含む最大3案の更新日付きPTとメタデータを返す", () => {
    const allProfiles = [...profiles, identity("genshin", "10000062", "アーロイ")];
    allProfiles.forEach(({ game, displayName }) => {
      const parties = partyRecommendationsFor(game, displayName);
      expect(parties.options).toHaveLength(3);
      expect(parties.options.every((option) => option.members.some((member) => member.name.ja === displayName))).toBe(true);
      expect(parties.options.every((option) => option.targetChanges.length === 0)).toBe(true);
      expect(parties.updatedAt).toBe("2026-08-26");
      expect(guideMetadataFor(game, displayName).updatedAt).toBe("2026-08-26");
    });
    const history = guideUpdateHistory();
    const updated = history.characters.filter((character) => allProfiles.some((profile) => profile.game === character.game && profile.displayName === character.name));
    expect(updated).toHaveLength(10);
    expect(updated.every((character) => character.events.some((event) => event.title.includes("第7バッチ")))).toBe(true);
  });
});
