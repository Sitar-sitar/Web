import { describe, expect, it } from "vitest";
import { CHARACTER_GUIDE_CATALOG } from "./characterGuideCatalog";
import { assertPartyCatalogIntegrity, MAX_PARTY_OPTIONS, PARTY_CATALOG_CHARACTER_COUNT, partyRecommendationsFor } from "./partyRecommendations";

describe("推奨パーティー編成カタログ", () => {
  it("各登録キャラクターの案は最大3件で、順位が連続している", () => {
    expect(MAX_PARTY_OPTIONS).toBe(3);
    expect(assertPartyCatalogIntegrity()).toBe(true);
  });

  it("編成ごとに対応バージョン・基準日・更新日を保持する", () => {
    const teams = partyRecommendationsFor("zzz", "星見雅");
    expect(teams.gameVersion).toBe("3.1");
    expect(teams.options).toHaveLength(3);
    expect(teams.options[0]).toMatchObject({ gameVersion: "3.1", dataAsOf: "2026-08-25", updatedAt: "2026-08-25" });
  });

  it("編成による目標ステータスの変化を明示的な補正データとして返す", () => {
    const teams = partyRecommendationsFor("genshin", "アルレッキーノ");
    expect(teams.options[0]?.targetChanges).toContainEqual(expect.objectContaining({ key: "elementalMastery", targets: { "厳選": 220, "目標": 160, "妥協": 100 } }));
  });

  it("HSR・原神・ZZZの代表キャラクターで、最大3案とゲーム別のバージョン情報を返す", () => {
    const coverage = [
      { game: "hsr" as const, character: "ホタル", version: "4.4", changedKey: "speed" },
      { game: "genshin" as const, character: "神里綾華", version: "7.0", changedKey: "critRate" },
      { game: "zzz" as const, character: "星見雅", version: "3.1", changedKey: "critRate" },
    ];
    coverage.forEach(({ game, character, version, changedKey }) => {
      const teams = partyRecommendationsFor(game, character);
      expect(teams).toMatchObject({ gameVersion: version, dataAsOf: "2026-08-25", updatedAt: "2026-08-25" });
      expect(teams.options).toHaveLength(MAX_PARTY_OPTIONS);
      expect(teams.options.map((option) => option.rank)).toEqual([1, 2, 3]);
      expect(teams.options.some((option) => option.targetChanges.some((change) => change.key === changedKey))).toBe(true);
    });
  });

  it("全キャラクターへ個別の最大3案、選択キャラクター、SNS補助根拠を登録する", () => {
    const allCharacters = Object.entries(CHARACTER_GUIDE_CATALOG)
      .filter(([game]) => game === "hsr" || game === "genshin" || game === "zzz")
      .flatMap(([game, names]) => (names as readonly string[]).map((name) => ({ game: game as "hsr" | "genshin" | "zzz", name })));
    expect(allCharacters).toHaveLength(PARTY_CATALOG_CHARACTER_COUNT);
    allCharacters.forEach(({ game, name }) => {
      const options = partyRecommendationsFor(game, name).options;
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThanOrEqual(MAX_PARTY_OPTIONS);
      expect(options.every((option) => option.members.some((partyMember) => partyMember.name.ja === name))).toBe(true);
      expect(options.every((option) => option.communitySources.some((source) => /^2026-08-(25|26|27)$/.test(source.checkedAt) && source.url.startsWith("https://")))).toBe(true);
    });
  });

  it("高使用優先の20キャラクターは自動生成ではない手動精査済み編成を優先する", () => {
    const curated = [
      ["hsr", "アグライア"], ["hsr", "アナイクス"], ["hsr", "キャストリス"], ["hsr", "ホタル"], ["hsr", "ロビン"], ["hsr", "ルアン・メェイ"], ["hsr", "飛霄"],
      ["genshin", "フリーナ"], ["genshin", "シロネン"], ["genshin", "楓原万葉"], ["genshin", "ベネット"], ["genshin", "アルレッキーノ"], ["genshin", "ヌヴィレット"], ["genshin", "夜蘭"],
      ["zzz", "星見雅"], ["zzz", "浮波柚葉"], ["zzz", "月城柳"], ["zzz", "アストラ"], ["zzz", "ライト"], ["zzz", "レミエール"],
    ] as const;
    expect(curated).toHaveLength(20);
    curated.forEach(([game, name]) => {
      const options = partyRecommendationsFor(game, name).options;
      expect(options).toHaveLength(MAX_PARTY_OPTIONS);
      expect(options[0]?.id.startsWith("generated-")).toBe(false);
      expect(options.every((option) => option.members.some((partyMember) => partyMember.name.ja === name))).toBe(true);
      expect(options.every((option) => option.sourceUrl.startsWith("https://") && option.communitySources.length > 0)).toBe(true);
    });
  });

  it("第2バッチは個別ガイドの構成を採用し、汎用の目標補正を自動追加しない", () => {
    const robin = partyRecommendationsFor("hsr", "ロビン").options;
    const ruanMei = partyRecommendationsFor("hsr", "ルアン・メェイ").options;
    const feixiao = partyRecommendationsFor("hsr", "飛霄").options;
    const arlecchino = partyRecommendationsFor("genshin", "アルレッキーノ").options;
    const neuvillette = partyRecommendationsFor("genshin", "ヌヴィレット").options;
    const yelan = partyRecommendationsFor("genshin", "夜蘭").options;
    const yanagi = partyRecommendationsFor("zzz", "月城柳").options;
    const astra = partyRecommendationsFor("zzz", "アストラ").options;
    const lighter = partyRecommendationsFor("zzz", "ライト").options;
    const remielle = partyRecommendationsFor("zzz", "レミエール").options;

    expect(robin[0]?.members.map((item) => item.name.ja)).toEqual(["ロビン", "飛霄", "トパーズ&カブ", "アベンチュリン"]);
    expect(ruanMei[0]?.members.map((item) => item.name.ja)).toEqual(["ルアン・メェイ", "ホタル", "帰忘の流離人", "ダリア"]);
    expect(feixiao[0]?.members.map((item) => item.name.ja)).toEqual(["飛霄", "サフェル", "サンデー", "丹恒・騰荒"]);
    expect(arlecchino[0]?.members.map((item) => item.name.ja)).toEqual(["アルレッキーノ", "ベネット", "シロネン", "シトラリ"]);
    expect(arlecchino[0]?.targetChanges).toContainEqual(expect.objectContaining({ key: "elementalMastery" }));
    expect(arlecchino[2]?.targetChanges).toEqual([]);
    expect(neuvillette[0]?.members.map((item) => item.name.ja)).toEqual(["ヌヴィレット", "コロンビーナ", "イネファ", "シロネン"]);
    expect(yelan[2]?.members.map((item) => item.name.ja)).toEqual(["夜蘭", "ナヒーダ", "ニィロウ", "白朮"]);
    expect(yanagi[1]?.members.map((item) => item.name.ja)).toEqual(["月城柳", "ビビアン", "アストラ"]);
    expect(astra[1]?.members.map((item) => item.name.ja)).toEqual(["アストラ", "星見雅", "月城柳"]);
    expect(lighter[1]?.members.map((item) => item.name.ja)).toEqual(["ライト", "エレン", "蒼角"]);
    expect(remielle[0]?.members.map((item) => item.name.ja)).toEqual(["レミエール", "ヴェリナ", "プロメイア"]);
    [robin, ruanMei, feixiao, neuvillette, yelan, yanagi, astra, lighter, remielle].forEach((options) => {
      expect(options.every((option) => option.targetChanges.length === 0)).toBe(true);
    });
  });
});
