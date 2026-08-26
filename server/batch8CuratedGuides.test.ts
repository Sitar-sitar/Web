import { describe, expect, it } from "vitest";
import { guideFor } from "./buildAdvisor";
import { constellationProfileFor } from "./characterConstellations";
import { guideMetadataFor } from "./characterGuideMetadata";
import { normalizeGenshinPayload, normalizeZzzPayload } from "./gameProviders";
import { guideUpdateHistory } from "./guideUpdateHistory";
import { partyRecommendationsFor } from "./partyRecommendations";

const identity = (game: "hsr" | "genshin" | "zzz", sourceId: string, displayName: string) => ({ game, sourceId, key: `${game}:${sourceId}` as const, displayName, variantOf: null, resolved: true, resolution: "provider" as const });

describe("第8バッチの個別ビルド", () => {
  it("HSR4名をロール共通値ではなく更新日付きの個別公開値で返す", () => {
    const welt = guideFor("ヴェルト", "虚無");
    const gallagher = guideFor("ギャラガー", "豊穣");
    const cyrene = guideFor("キュレネ", "記憶");
    const gilgamesh = guideFor("ギルガメッシュ", "壊滅");
    expect(welt.targets.find((target) => target.key === "attack")?.targets["目標"]).toBe(2500);
    expect(gallagher.targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(143);
    expect(cyrene.targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(180);
    expect(gilgamesh.targets.find((target) => target.key === "attack")?.targets["目標"]).toBe(2800);
    [welt, gallagher, cyrene, gilgamesh].forEach((guide) => {
      expect(guide.dataAsOf).toBe("2026-08-26");
      expect(guide.targetContext).toContain("公開プロフィール");
    });
  });

  it("原神3名を個別の公開プロフィール比較で正規化する", () => {
    const avatar = (avatarId: number) => ({ avatarId, propMap: { "4001": { val: 90 } }, talentIdList: [1, 2], fightPropMap: { "20": 0.6, "22": 1.5, "23": 1.8, "28": 300, "2000": 22000, "2001": 2000, "2002": 900 }, equipList: [] });
    const result = normalizeGenshinPayload({ uid: "618285856", playerInfo: { nickname: "テスト旅人", level: 60 }, avatarInfoList: [avatar(10000021), avatar(10000110), avatar(10000116)] }, {
      characters: {
        "10000021": { NameTextMapHash: 1, Element: "Fire", WeaponType: "WEAPON_BOW", SideIconName: "UI_Ambor" },
        "10000110": { NameTextMapHash: 2, Element: "Electric", WeaponType: "WEAPON_POLE", SideIconName: "UI_Iansan" },
        "10000116": { NameTextMapHash: 3, Element: "Electric", WeaponType: "WEAPON_POLE", SideIconName: "UI_Ineffa" },
      },
      loc: { ja: { "1": "アンバー", "2": "イアンサ", "3": "イネファ" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));
    expect(byName["アンバー"]?.comparisons.find((comparison) => comparison.key === "energyRecharge")?.targets["目標"]).toBe(110);
    expect(byName["イアンサ"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(2500);
    expect(byName["イネファ"]?.comparisons.find((comparison) => comparison.key === "elementalMastery")?.targets["目標"]).toBe(300);
    ["アンバー", "イアンサ", "イネファ"].forEach((name) => expect(byName[name]?.guide.targetContext).toContain("公開プロフィール"));
  });

  it("ZZZ3名を個別比較し、心象映画由来の戦闘中補正を現在値へ足さない", () => {
    const base = { Image: "/ui/zzz/avatar.png", BaseProps: { "11101": 10000, "12101": 1800, "12201": 120, "20101": 500, "21101": 5000, "23101": 0, "31201": 94, "31401": 93 }, GrowthProps: {}, PromotionProps: [{}], CoreEnhancementProps: [{}] };
    const result = normalizeZzzPayload({ uid: "1300622089", PlayerInfo: { SocialDetail: { ProfileDetail: { Nickname: "テストプロキシ", Level: 60 } }, ShowcaseDetail: { AvatarList: [
      { Id: 1381, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1501, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
      { Id: 1401, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] },
    ] } } }, {
      avatars: { "1381": { ...base, Name: "Avatar_Soldier0Anby", ElementTypes: ["Electric"], ProfessionType: "Attack" }, "1501": { ...base, Name: "Avatar_Aria", ElementTypes: ["Ether"], ProfessionType: "Anomaly" }, "1401": { ...base, Name: "Avatar_Alice", ElementTypes: ["Physical"], ProfessionType: "Anomaly" } },
      weapons: { "12001": { ItemName: "Weapon_Test", ImagePath: "/ui/zzz/weapon.png", MainStat: { PropertyId: 12101, PropertyValue: 50 }, SecondaryStat: {} } }, equipments: { Items: {}, Suits: {} },
      locs: { ja: { Avatar_Soldier0Anby: "0号・アンビー", Avatar_Aria: "アリア", Avatar_Alice: "アリス", Weapon_Test: "テスト音動機" } },
      property: { "11101": { Name: "HP", Format: "{0:0}" }, "12101": { Name: "AttackBase", Format: "{0:0}" }, "12201": { Name: "Impact", Format: "{0:0}" }, "20101": { Name: "CritRateBase", Format: "{0:0.0}%" }, "21101": { Name: "CritDmgBase", Format: "{0:0.0}%" }, "23101": { Name: "PenRatio", Format: "{0:0.0}%" }, "31201": { Name: "AnomalyMastery", Format: "{0:0}" }, "31401": { Name: "AnomalyProficiency", Format: "{0:0}" } },
    });
    const byName = Object.fromEntries(result.characters.map((character) => [character.name, character]));
    expect(byName["0号・アンビー"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(2800);
    expect(byName["アリア"]?.comparisons.find((comparison) => comparison.key === "anomalyProficiency")?.targets["目標"]).toBe(330);
    expect(byName["アリス"]?.comparisons.find((comparison) => comparison.key === "anomalyMastery")?.targets["目標"]).toBe(140);
    expect(byName["0号・アンビー"]?.allStats.find((stat) => stat.name === "会心率")?.display).toBe("5.0%");
  });
});

describe("第8バッチの凸と推奨PT", () => {
  const profiles = [
    identity("hsr", "1004", "ヴェルト"), identity("hsr", "1301", "ギャラガー"), identity("hsr", "1415", "キュレネ"), identity("hsr", "1509", "ギルガメッシュ"),
    identity("genshin", "10000021", "アンバー"), identity("genshin", "10000110", "イアンサ"), identity("genshin", "10000116", "イネファ"),
    identity("zzz", "1381", "0号・アンビー"), identity("zzz", "1501", "アリア"), identity("zzz", "1401", "アリス"),
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
    const ineffaVariant = constellationProfileFor(identity("genshin", "10000903", "イネファ"), 6);
    expect(aloy.dataStatus).toBe("preparing");
    expect(aloy.effects).toEqual([]);
    expect(ineffaVariant.dataStatus).toBe("preparing");
    expect(ineffaVariant.effects).toEqual([]);
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
    expect(updated.every((character) => character.events.some((event) => event.title.includes("第8バッチ")))).toBe(true);
  });
});
