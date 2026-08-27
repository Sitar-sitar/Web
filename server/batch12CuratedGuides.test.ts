import { describe, expect, it } from "vitest";
import { guideFor } from "./buildAdvisor";
import { constellationProfileFor } from "./characterConstellations";
import { guideMetadataFor } from "./characterGuideMetadata";
import { normalizeGenshinPayload, normalizeZzzPayload } from "./gameProviders";
import { partyRecommendationsFor } from "./partyRecommendations";

const identity = (game: "hsr" | "genshin" | "zzz", sourceId: string, displayName: string) => ({
  game,
  sourceId,
  key: `${game}:${sourceId}` as const,
  displayName,
  variantOf: null,
  resolved: true,
  resolution: "provider" as const,
});

const curatedProfiles = [
  identity("hsr", "1109", "フック"), identity("hsr", "1106", "ペラ"), identity("hsr", "1013", "ヘルタ"), identity("hsr", "1401", "マダム・ヘルタ"),
  identity("hsr", "1312", "ミーシャ"), identity("hsr", "1404", "モーディス"), identity("hsr", "1223", "モゼ"), identity("hsr", "1110", "リンクス"),
  identity("genshin", "10000029", "クレー"), identity("genshin", "10000098", "クロリンデ"), identity("genshin", "10000067", "コレイ"), identity("genshin", "10000055", "ゴロー"), identity("genshin", "10000095", "シグウィン"),
  identity("zzz", "1571", "ノルムー"), identity("zzz", "1291", "ヒューゴ"), identity("zzz", "1081", "ビリー"), identity("zzz", "1351", "プルクラ"),
];

const unresolvedProfiles = [
  identity("genshin", "10000125", "コロンビーナ"),
  identity("zzz", "1031", "ニコ"),
  identity("zzz", "1551", "ピュロイス"),
];

const allBatch12 = [...curatedProfiles, ...unresolvedProfiles];

describe("第12バッチ20名の個別ガイド", () => {
  it("HSR8名をロール共通値ではなく個別公開プロフィール比較として返し、未明示閾値を創作しない", () => {
    expect(guideFor("フック", "壊滅").targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(135);
    expect(guideFor("ペラ", "虚無").targets.find((target) => target.key === "effectHitRate")?.targets["目標"]).toBe(67);
    expect(guideFor("マダム・ヘルタ", "知恵").targets.find((target) => target.key === "critRate")?.targets["目標"]).toBe(100);
    expect(guideFor("ヘルタ", "知恵").targets).toEqual([]);
    expect(guideFor("ミーシャ", "壊滅").targets).toEqual([]);
    expect(guideFor("モゼ", "巡狩").targets).toEqual([]);
    ["フック", "ペラ", "ヘルタ", "マダム・ヘルタ", "ミーシャ", "モーディス", "モゼ", "リンクス"].forEach((name) => {
      expect(guideFor(name, name === "ペラ" ? "虚無" : name === "ヘルタ" || name === "マダム・ヘルタ" ? "知恵" : name === "リンクス" ? "豊穣" : name === "モゼ" ? "巡狩" : "壊滅").targetContext).toContain("公開プロフィール");
    });
  });

  it("原神・ZZZの個別数値目標を公開プロフィール正規化経路で選択し、未明示閾値を補わない", () => {
    const avatar = (avatarId: number) => ({ avatarId, propMap: { "4001": { val: 90 } }, talentIdList: [1, 2], fightPropMap: { "20": 0.7, "22": 1.5, "23": 2, "28": 400, "2000": 50000, "2001": 2500, "2002": 900 }, equipList: [] });
    const genshin = normalizeGenshinPayload({ uid: "618285856", playerInfo: { nickname: "テスト旅人", level: 60 }, avatarInfoList: [avatar(10000029), avatar(10000098), avatar(10000067), avatar(10000055), avatar(10000125), avatar(10000095)] }, {
      characters: {
        "10000029": { NameTextMapHash: 1, Element: "Fire", WeaponType: "WEAPON_CATALYST", SideIconName: "UI_Klee" },
        "10000098": { NameTextMapHash: 2, Element: "Electric", WeaponType: "WEAPON_SWORD_ONE_HAND", SideIconName: "UI_Clorinde" },
        "10000067": { NameTextMapHash: 3, Element: "Grass", WeaponType: "WEAPON_BOW", SideIconName: "UI_Collei" },
        "10000055": { NameTextMapHash: 4, Element: "Rock", WeaponType: "WEAPON_BOW", SideIconName: "UI_Gorou" },
        "10000125": { NameTextMapHash: 5, Element: "Water", WeaponType: "WEAPON_CATALYST", SideIconName: "UI_Columbina" },
        "10000095": { NameTextMapHash: 6, Element: "Water", WeaponType: "WEAPON_BOW", SideIconName: "UI_Sigewinne" },
      },
      loc: { ja: { "1": "クレー", "2": "クロリンデ", "3": "コレイ", "4": "ゴロー", "5": "コロンビーナ", "6": "シグウィン" } },
    });
    const giByName = Object.fromEntries(genshin.characters.map((character) => [character.name, character]));
    expect(giByName["クレー"]?.comparisons).toEqual([]);
    expect(giByName["クロリンデ"]?.comparisons).toEqual([]);
    expect(giByName["コロンビーナ"]?.comparisons.find((comparison) => comparison.key === "hp")?.targets["目標"]).toBe(35000);
    expect(giByName["シグウィン"]?.comparisons.find((comparison) => comparison.key === "hp")?.targets["目標"]).toBe(50000);

    const metadata = { Image: "/ui/zzz/avatar.png", BaseProps: { "11101": 10000, "12101": 1800, "12201": 180, "20101": 500, "21101": 5000 }, GrowthProps: {}, PromotionProps: [{}], CoreEnhancementProps: [{}] };
    const zzz = normalizeZzzPayload({ uid: "1300622089", PlayerInfo: { SocialDetail: { ProfileDetail: { Nickname: "テストプロキシ", Level: 60 } }, ShowcaseDetail: { AvatarList: [
      { Id: 1031, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1571, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1291, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1551, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1081, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1351, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
    ] } } }, {
      avatars: {
        "1031": { ...metadata, Name: "Avatar_Nicole", ElementTypes: ["Ether"], ProfessionType: "Support" },
        "1571": { ...metadata, Name: "Avatar_Norem", ElementTypes: ["Fire"], ProfessionType: "Stun" },
        "1291": { ...metadata, Name: "Avatar_Hugo", ElementTypes: ["Ice"], ProfessionType: "Attack" },
        "1551": { ...metadata, Name: "Avatar_Pyrois", ElementTypes: ["Ether"], ProfessionType: "Attack" },
        "1081": { ...metadata, Name: "Avatar_Billy", ElementTypes: ["Physical"], ProfessionType: "Attack" },
        "1351": { ...metadata, Name: "Avatar_Pulchra", ElementTypes: ["Physical"], ProfessionType: "Stun" },
      },
      weapons: { "12001": { ItemName: "Weapon_Test", ImagePath: "/ui/zzz/weapon.png", MainStat: { PropertyId: 12101, PropertyValue: 50 }, SecondaryStat: {} } },
      equipments: { Items: {}, Suits: {} },
      locs: { ja: { Avatar_Nicole: "ニコ", Avatar_Norem: "ノルムー", Avatar_Hugo: "ヒューゴ", Avatar_Pyrois: "ピュロイス", Avatar_Billy: "ビリー", Avatar_Pulchra: "プルクラ", Weapon_Test: "テスト音動機" } },
      property: { "11101": { Name: "HP", Format: "{0:0}" }, "12101": { Name: "AttackBase", Format: "{0:0}" }, "12201": { Name: "Impact", Format: "{0:0}" }, "20101": { Name: "CritRateBase", Format: "{0:0.0}%" }, "21101": { Name: "CritDmgBase", Format: "{0:0.0}%" } },
    });
    const zzzByName = Object.fromEntries(zzz.characters.map((character) => [character.name, character]));
    expect(zzzByName["ニコ"]?.comparisons.find((comparison) => comparison.key === "energyRegen")?.targets["目標"]).toBe(3.2);
    expect(zzzByName["ノルムー"]?.comparisons.find((comparison) => comparison.key === "critRate")?.targets["目標"]).toBe(76);
    expect(zzzByName["ヒューゴ"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(2500);
    expect(zzzByName["ピュロイス"]?.comparisons.find((comparison) => comparison.key === "critRate")?.targets["目標"]).toBe(72);
    expect(zzzByName["ビリー"]?.comparisons.find((comparison) => comparison.key === "critDmg")?.targets["目標"]).toBe(150);
    expect(zzzByName["プルクラ"]?.comparisons.find((comparison) => comparison.key === "impact")?.targets["目標"]).toBe(189);
  });

  it("確認済み17実装だけを実source IDで6段階の凸へ解決し、未解決・未公開本文は準備中へ留める", () => {
    curatedProfiles.forEach((character) => {
      const profile = constellationProfileFor(character, 99);
      expect(profile.dataStatus).toBe("curated");
      expect(profile.acquiredRank).toBe(6);
      expect(profile.effects.map((effect) => effect.level)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(profile.activeTargetChanges).toEqual([]);
      expect(profile.updatedAt).toBe("2026-08-27");
    });
    unresolvedProfiles.forEach((character) => {
      const profile = constellationProfileFor(character, 6);
      expect(profile.dataStatus).toBe("preparing");
      expect(profile.effects).toEqual([]);
      expect(profile.activeTargetChanges).toEqual([]);
    });
  });

  it("全20名へ本人を含む根拠付きの最大3案を返し、パーティ補正を公開値へ加算しない", () => {
    allBatch12.forEach(({ game, displayName }) => {
      const parties = partyRecommendationsFor(game, displayName);
      expect(parties.options.length).toBeGreaterThan(0);
      expect(parties.options.length).toBeLessThanOrEqual(3);
      expect(parties.options.every((option) => option.members.some((member) => member.name.ja === displayName))).toBe(true);
      expect(parties.options.every((option) => option.targetChanges.length === 0)).toBe(true);
      expect(parties.updatedAt).toBe("2026-08-27");
      expect(guideMetadataFor(game, displayName).updatedAt).toBe("2026-08-27");
    });
    expect(partyRecommendationsFor("hsr", "モゼ").options[1]?.members.map((member) => member.name.ja)).toEqual(["飛霄", "モゼ", "ロビン", "アベンチュリン"]);
    expect(partyRecommendationsFor("genshin", "クレー").options[0]?.members.map((member) => member.name.ja)).toEqual(["クレー", "夜蘭", "楓原万葉", "ベネット"]);
    expect(partyRecommendationsFor("zzz", "ビリー").options[2]?.members.map((member) => member.name.ja)).toEqual(["ビリー", "アンビー", "ニコ"]);
  });

  it("ID未解決のコロンビーナは名称だけで別実装へ誤接続しない", () => {
    const unresolved = constellationProfileFor(identity("genshin", "10000125", "コロンビーナ"), 6);
    const conflicting = constellationProfileFor(identity("genshin", "10000904", "コロンビーナ"), 6);
    expect(unresolved.dataStatus).toBe("preparing");
    expect(conflicting.dataStatus).toBe("preparing");
  });
});
