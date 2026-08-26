import { describe, expect, it } from "vitest";
import { guideFor } from "./buildAdvisor";
import { constellationProfileFor } from "./characterConstellations";
import { guideMetadataFor } from "./characterGuideMetadata";
import { normalizeGenshinPayload, normalizeZzzPayload } from "./gameProviders";
import { guideUpdateHistory } from "./guideUpdateHistory";
import { partyRecommendationsFor } from "./partyRecommendations";

const identity = (game: "hsr" | "genshin" | "zzz", sourceId: string, displayName: string) => ({ game, sourceId, key: `${game}:${sourceId}` as const, displayName, variantOf: null, resolved: true, resolution: "provider" as const });

describe("第5バッチの個別ビルド", () => {
  it("HSR4名をロール共通値ではなく更新日付きの個別目標で返す", () => {
    const ratio = guideFor("Dr.レイシオ", "巡狩");
    const kafka = guideFor("カフカ", "虚無");
    const blackSwan = guideFor("ブラックスワン", "虚無");
    const jingliu = guideFor("鏡流", "壊滅");
    expect(ratio.targets.find((target) => target.key === "critRate")?.targets["目標"]).toBe(70);
    expect(kafka.targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(160);
    expect(blackSwan.targets.find((target) => target.key === "effectHitRate")?.targets["目標"]).toBe(120);
    expect(jingliu.targets.find((target) => target.key === "hp")?.targets["目標"]).toBe(6000);
    [ratio, kafka, blackSwan, jingliu].forEach((guide) => {
      expect(guide.dataAsOf).toBe("2026-08-26");
      expect(guide.targetContext).toContain("公開プロフィール");
    });
  });

  it("原神3名を個別の公開プロフィール比較で正規化する", () => {
    const avatar = (avatarId: number) => ({ avatarId, propMap: { "4001": { val: 90 } }, talentIdList: [1, 2], fightPropMap: { "20": 0.7, "22": 1.6, "23": 1.3, "28": 150, "2000": 30000, "2001": 2000, "2002": 800 }, equipList: [] });
    const result = normalizeGenshinPayload({ uid: "618285856", playerInfo: { nickname: "テスト旅人", level: 60 }, avatarInfoList: [avatar(10000025), avatar(10000023), avatar(10000031)] }, {
      characters: {
        "10000025": { NameTextMapHash: 1, Element: "Water", WeaponType: "WEAPON_SWORD_ONE_HAND", SideIconName: "UI_Xingqiu" },
        "10000023": { NameTextMapHash: 2, Element: "Fire", WeaponType: "WEAPON_POLE", SideIconName: "UI_Xiangling" },
        "10000031": { NameTextMapHash: 3, Element: "Electric", WeaponType: "WEAPON_BOW", SideIconName: "UI_Fischl" },
      },
      loc: { ja: { "1": "行秋", "2": "香菱", "3": "フィッシュル" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));
    expect(byName["行秋"]?.comparisons.find((comparison) => comparison.key === "energyRecharge")?.targets["目標"]).toBe(180);
    expect(byName["香菱"]?.comparisons.find((comparison) => comparison.key === "elementalMastery")?.targets["目標"]).toBe(150);
    expect(byName["フィッシュル"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(2000);
    ["行秋", "香菱", "フィッシュル"].forEach((name) => expect(byName[name]?.guide.targetContext).toContain("公開プロフィール"));
  });

  it("ZZZ3名の異常・支援目標を個別比較し、戦闘中の補正を現在値へ足さない", () => {
    const base = { Image: "/ui/zzz/avatar.png", BaseProps: { "11101": 100, "12101": 100, "20101": 500, "21101": 5000, "31201": 160, "31401": 400 }, GrowthProps: {}, PromotionProps: [{}], CoreEnhancementProps: [{}] };
    const result = normalizeZzzPayload({ uid: "1300622089", PlayerInfo: { SocialDetail: { ProfileDetail: { Nickname: "テストプロキシ", Level: 60 } }, ShowcaseDetail: { AvatarList: [
      { Id: 1181, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1171, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1151, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
    ] } } }, {
      avatars: { "1181": { ...base, Name: "Avatar_Grace", ElementTypes: ["Electric"], ProfessionType: "Anomaly" }, "1171": { ...base, Name: "Avatar_Burnice", ElementTypes: ["Fire"], ProfessionType: "Anomaly" }, "1151": { ...base, Name: "Avatar_Lucy", ElementTypes: ["Fire"], ProfessionType: "Support" } },
      weapons: { "12001": { ItemName: "Weapon_Test", ImagePath: "/ui/zzz/weapon.png", MainStat: { PropertyId: 12101, PropertyValue: 50 }, SecondaryStat: {} } }, equipments: { Items: {}, Suits: {} },
      locs: { ja: { Avatar_Grace: "グレース", Avatar_Burnice: "バーニス", Avatar_Lucy: "ルーシー", Weapon_Test: "テスト音動機" } },
      property: { "11101": { Name: "HP", Format: "{0:0}" }, "12101": { Name: "AttackBase", Format: "{0:0}" }, "20101": { Name: "CritRateBase", Format: "{0:0.0}%" }, "21101": { Name: "CritDmgBase", Format: "{0:0.0}%" }, "31201": { Name: "AnomalyMastery", Format: "{0:0}" }, "31401": { Name: "AnomalyProficiency", Format: "{0:0}" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));
    expect(byName["グレース"]?.comparisons.find((comparison) => comparison.key === "anomalyProficiency")?.targets["目標"]).toBe(400);
    expect(byName["バーニス"]?.comparisons.find((comparison) => comparison.key === "anomalyProficiency")?.targets["目標"]).toBe(375);
    expect(byName["ルーシー"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(2000);
    expect(byName["バーニス"]?.comparisons.find((comparison) => comparison.key === "penRatio")?.current).not.toBe(20);
  });
});

describe("第5バッチの凸・PT・履歴", () => {
  const profiles = [
    identity("hsr", "1305", "Dr.レイシオ"), identity("hsr", "1005", "カフカ"), identity("hsr", "1214", "ブラックスワン"), identity("hsr", "1212", "鏡流"),
    identity("genshin", "10000025", "行秋"), identity("genshin", "10000023", "香菱"), identity("genshin", "10000031", "フィッシュル"),
    identity("zzz", "1181", "グレース"), identity("zzz", "1171", "バーニス"), identity("zzz", "1151", "ルーシー"),
  ];

  it("全10名を実ソースIDキーで6段階の凸へ解決し、条件付き戦闘効果を目標補正にしない", () => {
    profiles.forEach((character) => {
      const profile = constellationProfileFor(character, 6);
      expect(profile.dataStatus).toBe("curated");
      expect(profile.effects.map((effect) => effect.level)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(profile.activeTargetChanges).toEqual([]);
      expect(profile.updatedAt).toBe("2026-08-26");
    });
    expect(constellationProfileFor(identity("zzz", "1151", "ルーシー"), 4).effects[3]?.description.ja).toContain("10%");
  });

  it("全10名へ本人を含む最大3案のPTと第5バッチ更新履歴を返す", () => {
    profiles.forEach(({ game, displayName }) => {
      const parties = partyRecommendationsFor(game, displayName);
      expect(parties.options).toHaveLength(3);
      expect(parties.options.every((option) => option.members.some((member) => member.name.ja === displayName))).toBe(true);
      expect(parties.updatedAt).toBe("2026-08-26");
      expect(guideMetadataFor(game, displayName).updatedAt).toBe("2026-08-26");
    });
    const history = guideUpdateHistory();
    const updated = history.characters.filter((character) => profiles.some((profile) => profile.game === character.game && profile.displayName === character.name));
    expect(updated).toHaveLength(10);
    expect(updated.every((character) => character.events.some((event) => event.title.includes("第5バッチ")))).toBe(true);
  });
});
