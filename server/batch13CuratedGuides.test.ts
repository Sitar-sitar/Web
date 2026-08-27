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
  identity("hsr", "1111", "ルカ"), identity("hsr", "1221", "雲璃"), identity("hsr", "1508", "遠坂凛"), identity("hsr", "1501", "火花"),
  identity("hsr", "1215", "寒鴉"), identity("hsr", "1225", "帰忘の流離人"), identity("hsr", "1204", "景元"), identity("hsr", "1210", "桂乃芬"),
  identity("genshin", "10000107", "シトラリ"), identity("genshin", "10000088", "シャルロット"), identity("genshin", "10000090", "シュヴルーズ"), identity("genshin", "10000003", "ジン"), identity("genshin", "10000114", "スカーク"), identity("genshin", "10000043", "スクロース"),
  identity("zzz", "1541", "プロメイア"), identity("zzz", "1121", "ベン"), identity("zzz", "1141", "ライカン"), identity("zzz", "1451", "リュシア"), identity("zzz", "1371", "儀玄"), identity("zzz", "1391", "橘福福"),
];

describe("第13バッチ20名の個別ガイド", () => {
  it("HSR8名をロール共通値ではなく個別公開プロフィール比較として返す", () => {
    expect(guideFor("ルカ", "虚無").targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(148);
    expect(guideFor("雲璃", "壊滅").targets.find((target) => target.key === "attack")?.targets["目標"]).toBe(3400);
    expect(guideFor("遠坂凛", "知恵").targets.find((target) => target.key === "critRate")?.targets["目標"]).toBe(90);
    expect(guideFor("火花", "愉悦").targets.find((target) => target.key === "attack")?.targets["目標"]).toBe(3600);
    expect(guideFor("寒鴉", "調和").targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(160);
    expect(guideFor("帰忘の流離人", "虚無").targets.find((target) => target.key === "effectHitRate")?.targets["目標"]).toBe(67);
    expect(guideFor("景元", "知恵").targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(135);
    expect(guideFor("桂乃芬", "虚無").targets.find((target) => target.key === "effectHitRate")?.targets["目標"]).toBe(67);
    ["ルカ", "雲璃", "遠坂凛", "火花", "寒鴉", "帰忘の流離人", "景元", "桂乃芬"].forEach((name) => {
      const path = name === "雲璃" ? "壊滅" : name === "遠坂凛" || name === "景元" ? "知恵" : name === "火花" ? "愉悦" : name === "寒鴉" ? "調和" : "虚無";
      expect(guideFor(name, path).targetContext).toContain("公開プロフィール");
    });
  });

  it("原神・ZZZの個別目標を公開プロフィール正規化経路で選択する", () => {
    const avatar = (avatarId: number) => ({ avatarId, propMap: { "4001": { val: 90 } }, talentIdList: [1, 2], fightPropMap: { "20": 0.7, "22": 1.5, "23": 2, "28": 400, "2000": 50000, "2001": 2500, "2002": 900 }, equipList: [] });
    const genshin = normalizeGenshinPayload({ uid: "618285856", playerInfo: { nickname: "テスト旅人", level: 60 }, avatarInfoList: [avatar(10000107), avatar(10000088), avatar(10000090), avatar(10000003), avatar(10000114), avatar(10000043)] }, {
      characters: {
        "10000107": { NameTextMapHash: 1, Element: "Ice", WeaponType: "WEAPON_CATALYST", SideIconName: "UI_Citlali" }, "10000088": { NameTextMapHash: 2, Element: "Ice", WeaponType: "WEAPON_CATALYST", SideIconName: "UI_Charlotte" },
        "10000090": { NameTextMapHash: 3, Element: "Fire", WeaponType: "WEAPON_POLE", SideIconName: "UI_Chevreuse" }, "10000003": { NameTextMapHash: 4, Element: "Wind", WeaponType: "WEAPON_SWORD_ONE_HAND", SideIconName: "UI_Jean" },
        "10000114": { NameTextMapHash: 5, Element: "Ice", WeaponType: "WEAPON_SWORD_ONE_HAND", SideIconName: "UI_Skirk" }, "10000043": { NameTextMapHash: 6, Element: "Wind", WeaponType: "WEAPON_CATALYST", SideIconName: "UI_Sucrose" },
      }, loc: { ja: { "1": "シトラリ", "2": "シャルロット", "3": "シュヴルーズ", "4": "ジン", "5": "スカーク", "6": "スクロース" } },
    });
    const gi = Object.fromEntries(genshin.characters.map((character) => [character.name, character]));
    expect(gi["シトラリ"]?.comparisons.find((comparison) => comparison.key === "elementalMastery")?.targets["目標"]).toBe(800);
    expect(gi["シャルロット"]?.comparisons.find((comparison) => comparison.key === "energyRecharge")?.targets["目標"]).toBe(200);
    expect(gi["シュヴルーズ"]?.comparisons.find((comparison) => comparison.key === "hp")?.targets["目標"]).toBe(40000);
    expect(gi["ジン"]?.comparisons.find((comparison) => comparison.key === "energyRecharge")?.targets["目標"]).toBe(200);
    expect(gi["スカーク"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(2100);
    expect(gi["スクロース"]?.comparisons.find((comparison) => comparison.key === "elementalMastery")?.targets["目標"]).toBe(800);

    const metadata = { Image: "/ui/zzz/avatar.png", BaseProps: { "11101": 10000, "12101": 1800, "12201": 180, "20101": 500, "21101": 5000 }, GrowthProps: {}, PromotionProps: [{}], CoreEnhancementProps: [{}] };
    const zzz = normalizeZzzPayload({ uid: "1300622089", PlayerInfo: { SocialDetail: { ProfileDetail: { Nickname: "テストプロキシ", Level: 60 } }, ShowcaseDetail: { AvatarList: [1541, 1121, 1141, 1451, 1371, 1391].map((Id) => ({ Id, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] })) } } }, {
      avatars: {
        "1541": { ...metadata, Name: "Avatar_Promeia", ElementTypes: ["Ice"], ProfessionType: "Anomaly" }, "1121": { ...metadata, Name: "Avatar_Ben", ElementTypes: ["Fire"], ProfessionType: "Defense" },
        "1141": { ...metadata, Name: "Avatar_Lycaon", ElementTypes: ["Ice"], ProfessionType: "Stun" }, "1451": { ...metadata, Name: "Avatar_Lucia", ElementTypes: ["Ether"], ProfessionType: "Support" },
        "1371": { ...metadata, Name: "Avatar_Yixuan", ElementTypes: ["Ether"], ProfessionType: "Rupture" }, "1391": { ...metadata, Name: "Avatar_JuFufu", ElementTypes: ["Fire"], ProfessionType: "Stun" },
      }, weapons: { "12001": { ItemName: "Weapon_Test", ImagePath: "/ui/zzz/weapon.png", MainStat: { PropertyId: 12101, PropertyValue: 50 }, SecondaryStat: {} } }, equipments: { Items: {}, Suits: {} },
      locs: { ja: { Avatar_Promeia: "プロメイア", Avatar_Ben: "ベン", Avatar_Lycaon: "ライカン", Avatar_Lucia: "リュシア", Avatar_Yixuan: "儀玄", Avatar_JuFufu: "橘福福", Weapon_Test: "テスト音動機" } }, property: { "11101": { Name: "HP", Format: "{0:0}" }, "12101": { Name: "AttackBase", Format: "{0:0}" }, "12201": { Name: "Impact", Format: "{0:0}" }, "20101": { Name: "CritRateBase", Format: "{0:0.0}%" }, "21101": { Name: "CritDmgBase", Format: "{0:0.0}%" } },
    });
    const zzzByName = Object.fromEntries(zzz.characters.map((character) => [character.name, character]));
    expect(zzzByName["プロメイア"]?.comparisons.find((comparison) => comparison.key === "anomalyMastery")?.targets["目標"]).toBe(314);
    expect(zzzByName["ベン"]?.comparisons.find((comparison) => comparison.key === "defense")?.targets["目標"]).toBe(2000);
    expect(zzzByName["ライカン"]?.comparisons.find((comparison) => comparison.key === "impact")?.targets["目標"]).toBe(194);
    expect(zzzByName["リュシア"]?.comparisons.find((comparison) => comparison.key === "hp")?.targets["目標"]).toBe(24000);
    expect(zzzByName["儀玄"]?.comparisons.find((comparison) => comparison.key === "critRate")?.targets["目標"]).toBe(67.4);
    expect(zzzByName["橘福福"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(3400);
  });

  it("20名を確認済みsource IDで6段階の凸へ解決し、効果を公開値へ加算しない", () => {
    curatedProfiles.forEach((character) => {
      const profile = constellationProfileFor(character, 99);
      expect(profile.dataStatus).toBe("curated");
      expect(profile.acquiredRank).toBe(6);
      expect(profile.effects.map((effect) => effect.level)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(profile.activeTargetChanges).toEqual([]);
      expect(profile.updatedAt).toBe("2026-08-27");
    });
    const sparxie = constellationProfileFor(identity("hsr", "1501", "花火"), 6);
    expect(sparxie.dataStatus).toBe("curated");
    expect(constellationProfileFor(identity("hsr", "1306", "花火"), 6).effects).not.toEqual(sparxie.effects);
  });

  it("全20名へ本人を含む根拠付きの最大3案を返し、パーティ補正を公開値へ加算しない", () => {
    curatedProfiles.forEach(({ game, displayName }) => {
      const parties = partyRecommendationsFor(game, displayName);
      expect(parties.options.length).toBeGreaterThan(0);
      expect(parties.options.length).toBeLessThanOrEqual(3);
      expect(parties.options.every((option) => option.members.some((member) => member.name.ja === displayName))).toBe(true);
      expect(parties.options.every((option) => option.targetChanges.length === 0)).toBe(true);
      expect(parties.updatedAt).toBe("2026-08-27");
      expect(guideMetadataFor(game, displayName).updatedAt).toBe("2026-08-27");
    });
    expect(partyRecommendationsFor("hsr", "雲璃").options[0]?.members.map((member) => member.name.ja)).toEqual(["雲璃", "サンデー", "ロビン", "丹恒・騰荒"]);
    expect(partyRecommendationsFor("genshin", "スカーク").options[0]?.members.map((member) => member.name.ja)).toEqual(["スカーク", "フリーナ", "夜蘭", "エスコフィエ"]);
    expect(partyRecommendationsFor("zzz", "儀玄").options[0]?.members.map((member) => member.name.ja)).toEqual(["儀玄", "ダイアリン", "リュシア"]);
  });
});
