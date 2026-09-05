import { describe, expect, it } from "vitest";
import {
  parseFavoriteRubberIds,
  parseFavoriteSets,
} from "@/lib/favoritesStorage";

const validSet = {
  id: "right-a-b-spin-control-beginner-standard",
  foreId: "a",
  backId: "b",
  handedness: "right",
  foreRole: "spin",
  backRole: "control",
  level: "beginner",
  budget: "standard",
  createdAt: "2026-09-05T00:00:00.000Z",
};

describe("parseFavoriteRubberIds", () => {
  it("正しい配列はそのまま読む", () => {
    expect(parseFavoriteRubberIds(JSON.stringify(["a", "b"]))).toEqual([
      "a",
      "b",
    ]);
  });

  it("未保存・壊れたJSON・配列以外は既定値へ戻す", () => {
    expect(parseFavoriteRubberIds(null)).toEqual([]);
    expect(parseFavoriteRubberIds("{")).toEqual([]);
    expect(parseFavoriteRubberIds(JSON.stringify({ a: 1 }))).toEqual([]);
  });

  it("配列内の不正な要素だけを破棄する", () => {
    expect(
      parseFavoriteRubberIds(JSON.stringify(["a", 1, null, "", { id: "b" }]))
    ).toEqual(["a"]);
  });
});

describe("parseFavoriteSets", () => {
  it("型検証を通ったセットだけを読む", () => {
    expect(parseFavoriteSets(JSON.stringify([validSet]))).toEqual([validSet]);
  });

  it("フィールド欠損・不正な列挙値・不正な日付は破棄する", () => {
    const broken = [
      { ...validSet, foreRole: "unknown" },
      { ...validSet, handedness: "both" },
      { ...validSet, createdAt: "not-a-date" },
      { ...validSet, backId: undefined },
      "string",
      null,
    ];
    expect(parseFavoriteSets(JSON.stringify(broken))).toEqual([]);
  });

  it("壊れたJSONや配列以外は既定値へ戻す", () => {
    expect(parseFavoriteSets(null)).toEqual([]);
    expect(parseFavoriteSets("[[")).toEqual([]);
    expect(parseFavoriteSets(JSON.stringify({ sets: [validSet] }))).toEqual([]);
  });
});
