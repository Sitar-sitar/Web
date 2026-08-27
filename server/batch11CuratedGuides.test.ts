import { describe, expect, it } from "vitest";
import { guideFor } from "./buildAdvisor";
import { constellationProfileFor } from "./characterConstellations";
import { guideMetadataFor } from "./characterGuideMetadata";
import { guideUpdateHistory } from "./guideUpdateHistory";
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
  identity("hsr", "1103", "セーバル"), identity("hsr", "1102", "ゼーレ"), identity("hsr", "1321", "ダリア"), identity("hsr", "1403", "トリビー"),
  identity("hsr", "1105", "ナターシャ"), identity("hsr", "1409", "ヒアンシー"), identity("hsr", "1408", "ファイノン"), identity("hsr", "1217", "フォフォ"),
  identity("genshin", "10000105", "オロルン"), identity("genshin", "10000081", "カーヴェ"), identity("genshin", "10000015", "ガイア"), identity("genshin", "10000100", "カチーナ"), identity("genshin", "10000101", "キィニチ"), identity("genshin", "10000072", "キャンディス"),
  identity("zzz", "1061", "カリン"), identity("zzz", "1101", "クレタ"), identity("zzz", "1591", "シグリッド"), identity("zzz", "1531", "スターライト･ビリー"), identity("zzz", "1481", "ダイアリン"),
];

const allBatch11 = [...curatedProfiles, identity("zzz", "unconfirmed", "シーシィア")];

describe("第11バッチ20名の個別ガイド", () => {
  it("HSR8名をロール共通値ではなく個別の公開プロフィール比較ガイドとして返す", () => {
    expect(guideFor("セーバル", "知恵").targets.find((target) => target.key === "speed")?.targets["目標"]).toBe(134);
    expect(guideFor("ゼーレ", "巡狩").targets.find((target) => target.key === "critRate")?.targets["目標"]).toBe(80);
    expect(guideFor("ダリア", "虚無").targets.find((target) => target.key === "breakEffect")?.targets["目標"]).toBe(150);
    expect(guideFor("ファイノン", "壊滅").targets.find((target) => target.key === "critRate")?.targets["目標"]).toBe(95);
    ["セーバル", "ゼーレ", "ダリア", "トリビー", "ナターシャ", "ヒアンシー", "ファイノン", "フォフォ"].forEach((name) => {
      expect(guideFor(name, name === "セーバル" ? "知恵" : name === "ゼーレ" ? "巡狩" : name === "ダリア" ? "虚無" : name === "トリビー" ? "調和" : name === "ナターシャ" || name === "フォフォ" ? "豊穣" : name === "ヒアンシー" ? "記憶" : "壊滅").targetContext).toContain("公開プロフィール");
    });
  });

  it("確認済み19名を実ソースIDで6段階の凸へ解決し、戦闘中効果を目標補正にしない", () => {
    curatedProfiles.forEach((character) => {
      const profile = constellationProfileFor(character, 99);
      expect(profile.dataStatus).toBe("curated");
      expect(profile.acquiredRank).toBe(6);
      expect(profile.effects.map((effect) => effect.level)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(profile.activeTargetChanges).toEqual([]);
      expect(profile.updatedAt).toBe("2026-08-27");
    });
    const unresolved = constellationProfileFor(identity("zzz", "unconfirmed", "シーシィア"), 6);
    expect(unresolved.dataStatus).toBe("preparing");
    expect(unresolved.effects).toEqual([]);
    expect(unresolved.activeTargetChanges).toEqual([]);
  });

  it("全20名へ本人を含む根拠付きの最大3案を返し、パーティ補正を公開値へ加算しない", () => {
    allBatch11.forEach(({ game, displayName }) => {
      const parties = partyRecommendationsFor(game, displayName);
      expect(parties.options.length).toBeGreaterThan(0);
      expect(parties.options.length).toBeLessThanOrEqual(3);
      expect(parties.options.every((option) => option.members.some((member) => member.name.ja === displayName))).toBe(true);
      expect(parties.options.every((option) => option.targetChanges.length === 0)).toBe(true);
      expect(parties.updatedAt).toBe("2026-08-27");
      expect(guideMetadataFor(game, displayName).updatedAt).toBe("2026-08-27");
    });
    expect(partyRecommendationsFor("hsr", "ファイノン").options[0]?.members.map((member) => member.name.ja)).toEqual(["ファイノン", "ケリュドラ", "サンデー", "丹恒・騰荒"]);
    expect(partyRecommendationsFor("genshin", "カーヴェ").options[0]?.members.map((member) => member.name.ja)).toEqual(["カーヴェ", "ニィロウ", "ナヒーダ", "珊瑚宮心海"]);
    expect(partyRecommendationsFor("zzz", "シグリッド").options[0]?.members.map((member) => member.name.ja)).toEqual(["シグリッド", "ダイアリン", "千夏"]);
  });

  it("全20名の第11バッチ履歴を登録し、20名単位の公開変更を追跡する", () => {
    const history = guideUpdateHistory();
    const updated = history.characters.filter((character) => allBatch11.some((profile) => profile.game === character.game && profile.displayName === character.name));
    expect(updated).toHaveLength(20);
    expect(updated.every((character) => character.events.some((event) => event.title === "第11バッチ：個別ビルド・凸・推奨PTを再精査" && event.date === "2026-08-27T01:15:00+09:00"))).toBe(true);
    expect(updated.every((character) => character.events.some((event) => event.changes.includes("分割公開の対象を20キャラクター単位へ変更")))).toBe(true);
  });
});
