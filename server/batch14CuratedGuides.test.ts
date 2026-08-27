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
  identity("hsr", "1205", "刃"), identity("hsr", "1201", "青雀"), identity("hsr", "1214", "雪衣"), identity("hsr", "1206", "素裳"), identity("hsr", "1002", "丹恒"), identity("hsr", "1414", "丹恒・騰荒"),
  identity("genshin", "10000097", "セトス"), identity("genshin", "10000071", "セノ"), identity("genshin", "10000115", "ダリア"), identity("genshin", "10000033", "タルタリヤ"), identity("genshin", "10000104", "チャスカ"), identity("genshin", "10000039", "ディオナ"), identity("genshin", "10000079", "ディシア"), identity("genshin", "10000069", "ティナリ"),
  identity("zzz", "1441", "狛野真斗"), identity("zzz", "1241", "朱鳶"), identity("zzz", "1341", "照"), identity("zzz", "1491", "千夏"), identity("zzz", "1201", "浅羽悠真"), identity("zzz", "1511", "南宮羽"),
];

describe("第14バッチ20名の個別ガイド", () => {
  it("HSR6名をロール共通値ではなく個別公開プロフィール比較として返す", () => {
    expect(guideFor("刃", "壊滅").targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(135);
    expect(guideFor("青雀", "知恵").targets.find((target) => target.key === "critRate")?.targets["目標"]).toBe(70);
    expect(guideFor("雪衣", "壊滅").targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(145);
    expect(guideFor("素裳", "巡狩").targets).toEqual([]);
    expect(guideFor("丹恒", "巡狩").targets).toEqual([]);
    expect(guideFor("丹恒・騰荒", "存護").targets.find((target) => target.key === "attack")?.targets["目標"]).toBe(3000);
    ["刃", "青雀", "雪衣", "素裳", "丹恒", "丹恒・騰荒"].forEach((name) => {
      const path = name === "刃" || name === "雪衣" ? "壊滅" : name === "青雀" ? "知恵" : name === "丹恒・騰荒" ? "存護" : "巡狩";
      expect(guideFor(name, path).targetContext).toContain("公開プロフィール");
    });
  });

  it("原神・ZZZの個別目標を公開プロフィール正規化経路で選択し、根拠外の数値を足さない", () => {
    const avatar = (avatarId: number) => ({ avatarId, propMap: { "4001": { val: 90 } }, talentIdList: [1, 2], fightPropMap: { "20": 0.7, "22": 1.5, "23": 2, "28": 400, "2000": 50000, "2001": 2500, "2002": 900 }, equipList: [] });
    const genshinIds = [10000097, 10000071, 10000115, 10000033, 10000104, 10000039, 10000079, 10000069];
    const names = ["セトス", "セノ", "ダリア", "タルタリヤ", "チャスカ", "ディオナ", "ディシア", "ティナリ"];
    const genshin = normalizeGenshinPayload({ uid: "618285856", playerInfo: { nickname: "テスト旅人", level: 60 }, avatarInfoList: genshinIds.map(avatar) }, {
      characters: Object.fromEntries(genshinIds.map((id, index) => [`${id}`, { NameTextMapHash: index + 1, Element: "Elec", WeaponType: "WEAPON_BOW", SideIconName: `UI_B14_${id}` }])),
      loc: { ja: Object.fromEntries(names.map((name, index) => [`${index + 1}`, name])) },
    });
    const gi = Object.fromEntries(genshin.characters.map((character) => [character.name, character]));
    expect(gi["セノ"]?.comparisons.find((comparison) => comparison.key === "elementalMastery")?.targets["目標"]).toBe(300);
    expect(gi["ダリア"]?.comparisons.find((comparison) => comparison.key === "hp")?.targets["目標"]).toBe(40000);
    expect(gi["セトス"]?.comparisons).toEqual([]);
    expect(gi["ディオナ"]?.comparisons).toEqual([]);

    const agentMetadata = { Image: "/ui/zzz/avatar.png", BaseProps: { "11101": 10000, "12101": 1800, "12201": 180, "20101": 500, "21101": 5000 }, GrowthProps: {}, PromotionProps: [{}], CoreEnhancementProps: [{}] };
    const zzzIds = [1441, 1241, 1341, 1491, 1201, 1511];
    const zzzNames = ["狛野真斗", "朱鳶", "照", "千夏", "浅羽悠真", "南宮羽"];
    const zzz = normalizeZzzPayload({ uid: "1300622089", PlayerInfo: { SocialDetail: { ProfileDetail: { Nickname: "テストプロキシ", Level: 60 } }, ShowcaseDetail: { AvatarList: zzzIds.map((Id) => ({ Id, Level: 60, TalentLevel: 6, Weapon: { Id: 12001, Level: 60, BreakLevel: 0 }, EquippedList: [] })) } } }, {
      avatars: Object.fromEntries(zzzIds.map((id, index) => [`${id}`, { ...agentMetadata, Name: `Avatar_B14_${id}`, ElementTypes: ["Ether"], ProfessionType: "Support" }])),
      weapons: { "12001": { ItemName: "Weapon_Test", ImagePath: "/ui/zzz/weapon.png", MainStat: { PropertyId: 12101, PropertyValue: 50 }, SecondaryStat: {} } }, equipments: { Items: {}, Suits: {} },
      locs: { ja: { ...Object.fromEntries(zzzIds.map((id, index) => [`Avatar_B14_${id}`, zzzNames[index]])), Weapon_Test: "テスト音動機" } }, property: { "11101": { Name: "HP", Format: "{0:0}" }, "12101": { Name: "AttackBase", Format: "{0:0}" }, "12201": { Name: "Impact", Format: "{0:0}" }, "20101": { Name: "CritRateBase", Format: "{0:0.0}%" }, "21101": { Name: "CritDmgBase", Format: "{0:0.0}%" } },
    });
    const zzzByName = Object.fromEntries(zzz.characters.map((character) => [character.name, character]));
    expect(zzzByName["朱鳶"]?.comparisons.find((comparison) => comparison.key === "critRate")?.targets["目標"]).toBe(40);
    expect(zzzByName["照"]?.comparisons.find((comparison) => comparison.key === "hp")?.targets["目標"]).toBe(27000);
    expect(zzzByName["千夏"]?.comparisons.find((comparison) => comparison.key === "attack")?.targets["目標"]).toBe(3500);
    expect(zzzByName["浅羽悠真"]?.comparisons.find((comparison) => comparison.key === "critRate")?.targets["目標"]).toBe(75);
    expect(zzzByName["狛野真斗"]?.comparisons).toEqual([]);
    expect(zzzByName["南宮羽"]?.comparisons).toEqual([]);
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
    expect(constellationProfileFor(identity("hsr", "999999", "丹恒"), 6).dataStatus).toBe("preparing");
    expect(constellationProfileFor(identity("genshin", "10000115", "ダリア"), 99).effects).not.toEqual(constellationProfileFor(identity("hsr", "1321", "ダリア"), 99).effects);
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
    expect(partyRecommendationsFor("hsr", "刃").options[0]?.members.map((member) => member.name.ja)).toEqual(["刃", "サンデー", "トリビー", "ヒアンシー"]);
    expect(partyRecommendationsFor("genshin", "セトス").options[0]?.members.map((member) => member.name.ja)).toEqual(["セトス", "コロンビーナ", "イネファ", "シロネン"]);
    expect(partyRecommendationsFor("zzz", "狛野真斗").options[0]?.members.map((member) => member.name.ja)).toEqual(["狛野真斗", "リュシア", "フーフー"]);
  });
});
