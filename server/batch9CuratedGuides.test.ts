import { describe, expect, it } from "vitest";
import { guideFor } from "./buildAdvisor";
import { constellationProfileFor } from "./characterConstellations";
import { guideMetadataFor } from "./characterGuideMetadata";
import { normalizeGenshinPayload, normalizeZzzPayload } from "./gameProviders";
import { guideUpdateHistory } from "./guideUpdateHistory";
import { partyRecommendationsFor } from "./partyRecommendations";

const identity = (game: "hsr" | "genshin" | "zzz", sourceId: string, displayName: string) => ({ game, sourceId, key: `${game}:${sourceId}` as const, displayName, variantOf: null, resolved: true, resolution: "provider" as const });

describe("第9バッチの個別ビルド", () => {
  it("HSR4名をロール共通値ではなく個別公開値で返す", () => {
    const clara = guideFor("クラーラ", "壊滅");
    const cerydra = guideFor("ケリュドラ", "調和");
    const cipher = guideFor("サフェル", "虚無");
    const sampo = guideFor("サンポ", "虚無");
    expect(clara.targets.find((target) => target.key === "critRate")?.targets["目標"]).toBe(75);
    expect(cerydra.targets.find((target) => target.key === "attack")?.targets["目標"]).toBe(4000);
    expect(cipher.targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(170);
    expect(sampo.targets.find((target) => target.key === "effectHitRate")?.targets["目標"]).toBe(67);
    [clara, cerydra, cipher, sampo].forEach((guide) => expect(guide.targetContext).toContain("公開プロフィール"));
  });

  it("原神3名を確認済みsourceIdで個別公開値比較へ正規化する", () => {
    const avatar = (avatarId: number) => ({ avatarId, propMap: { "4001": { val: 90 } }, talentIdList: [1, 2], fightPropMap: { "20": 0.6, "22": 1.5, "23": 1.8, "28": 300, "2000": 22000, "2001": 2000, "2002": 900 }, equipList: [] });
    const result = normalizeGenshinPayload({ uid: "618285856", playerInfo: { nickname: "テスト旅人", level: 60 }, avatarInfoList: [avatar(10000113), avatar(10000111), avatar(10000022)] }, {
      characters: {
        "10000113": { NameTextMapHash: 1, Element: "Wind", WeaponType: "WEAPON_CATALYST", SideIconName: "UI_Ifa" },
        "10000111": { NameTextMapHash: 2, Element: "Electric", WeaponType: "WEAPON_CATALYST", SideIconName: "UI_Varesa" },
        "10000022": { NameTextMapHash: 3, Element: "Wind", WeaponType: "WEAPON_BOW", SideIconName: "UI_Venti" },
      },
      loc: { ja: { "1": "イファ", "2": "ヴァレサ", "3": "ウェンティ" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));
    expect(byName["イファ"]?.comparisons.find((comparison) => comparison.key === "elementalMastery")?.targets["目標"]).toBe(800);
    expect(byName["ヴァレサ"]?.comparisons.find((comparison) => comparison.key === "critRate")?.targets["目標"]).toBe(85);
    expect(byName["ウェンティ"]?.comparisons.find((comparison) => comparison.key === "energyRecharge")?.targets["目標"]).toBe(160);
    expect(byName["イファ"]?.identity.sourceId).toBe("10000113");
  });

  it("ZZZ3名を個別比較し、心象映画の戦闘中補正を現在値へ足さない", () => {
    const base = { Image: "/ui/zzz/avatar.png", BaseProps: { "11101": 10000, "12101": 1800, "12201": 120, "20101": 500, "21101": 5000, "23101": 0, "31201": 94, "31401": 93 }, GrowthProps: {}, PromotionProps: [{}], CoreEnhancementProps: [{}] };
    const result = normalizeZzzPayload({ uid: "1300622089", PlayerInfo: { SocialDetail: { ProfileDetail: { Nickname: "テストプロキシ", Level: 60 } }, ShowcaseDetail: { AvatarList: [
      { Id: 1111, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1011, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1321, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
    ] } } }, {
      avatars: { "1111": { ...base, Name: "Avatar_Anton", ElementTypes: ["Electric"], ProfessionType: "Attack" }, "1011": { ...base, Name: "Avatar_Anby", ElementTypes: ["Electric"], ProfessionType: "Stun" }, "1321": { ...base, Name: "Avatar_Evelyn", ElementTypes: ["Fire"], ProfessionType: "Attack" } },
      weapons: { "12001": { ItemName: "Weapon_Test", ImagePath: "/ui/zzz/weapon.png", MainStat: { PropertyId: 12101, PropertyValue: 50 }, SecondaryStat: {} } }, equipments: { Items: {}, Suits: {} },
      locs: { ja: { Avatar_Anton: "アンドー", Avatar_Anby: "アンビー", Avatar_Evelyn: "イヴリン", Weapon_Test: "テスト音動機" } },
      property: { "11101": { Name: "HP", Format: "{0:0}" }, "12101": { Name: "AttackBase", Format: "{0:0}" }, "12201": { Name: "Impact", Format: "{0:0}" }, "20101": { Name: "CritRateBase", Format: "{0:0.0}%" }, "21101": { Name: "CritDmgBase", Format: "{0:0.0}%" }, "23101": { Name: "PenRatio", Format: "{0:0.0}%" }, "31201": { Name: "AnomalyMastery", Format: "{0:0}" }, "31401": { Name: "AnomalyProficiency", Format: "{0:0}" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));
    expect(byName["アンドー"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(2400);
    expect(byName["アンビー"]?.comparisons.find((comparison) => comparison.key === "impact")?.targets["目標"]).toBe(189);
    expect(byName["イヴリン"]?.comparisons.find((comparison) => comparison.key === "critRate")?.targets["目標"]).toBe(80);
    expect(byName["アンビー"]?.identity.sourceId).toBe("1011");
  });
});

describe("第9バッチの凸と推奨PT", () => {
  const profiles = [
    identity("hsr", "1107", "クラーラ"), identity("hsr", "1412", "ケリュドラ"), identity("hsr", "1406", "サフェル"), identity("hsr", "1108", "サンポ"),
    identity("genshin", "10000113", "イファ"), identity("genshin", "10000111", "ヴァレサ"), identity("genshin", "10000022", "ウェンティ"),
    identity("zzz", "1111", "アンドー"), identity("zzz", "1011", "アンビー"), identity("zzz", "1321", "イヴリン"),
  ];

  it("全10名を実ソースIDで6段階の凸へ解決し、戦闘中効果を目標補正にしない", () => {
    profiles.forEach((character) => {
      const profile = constellationProfileFor(character, 6);
      expect(profile.dataStatus).toBe("curated");
      expect(profile.effects.map((effect) => effect.level)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(profile.activeTargetChanges).toEqual([]);
      expect(profile.updatedAt).toBe("2026-08-26");
    });
    expect(constellationProfileFor(identity("zzz", "1381", "0号・アンビー"), 6).effects).toHaveLength(6);
    expect(constellationProfileFor(identity("genshin", "10000903", "イネファ"), 6).dataStatus).toBe("preparing");
  });

  it("全10名へ本人を含む最大3案の更新日付きPTを返し、パーティ補正を公開値へ加算しない", () => {
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
    expect(updated.every((character) => character.events.some((event) => event.title.includes("第9バッチ")))).toBe(true);
  });
});
