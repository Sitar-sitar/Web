// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";

const lookupResult = {
  player: { uid: "1300622089", name: "検証用プロキシ", level: 60 },
  cached: false,
  fetchedAt: "2026-08-18T10:00:00.000Z",
  characters: [{
    id: "eren", name: "エレン", level: 60, rank: 0, portrait: null, element: "氷", elementColor: "#76c8dc", path: "強攻", lightCone: null, relics: [], allStats: [],
    guide: { headline: "会心ダメージを強化する。", relicSet: "極地のヘヴィメタル ×4", planarSet: "会心率を優先", mainStats: [] },
    comparisons: [{ key: "critDmg", label: "会心ダメージ", unit: "%", current: 131.6, currentDisplay: "131.6%", targets: { "厳選": 180, "目標": 150, "妥協": 130 }, achieved: { "厳選": false, "目標": false, "妥協": true } }],
    recommendations: [{ key: "critDmg", label: "会心ダメージ", unit: "%", current: 131.6, target: 150, deficit: 18.4, priority: "優先", rationale: "目標 150% まであと 18.4%" }],
    equipmentActions: [{ recommendationKey: "critDmg", statLabel: "会心ダメージ", action: "主ステータスを変更", slot: "IV", equippedName: "ドライバディスク 4", currentMain: "HP%", desiredStat: "会心ダメ", reason: "IVは現在HP%です。会心ダメを主ステータスにした装備へ変更します。" }],
  }],
};

vi.mock("@/lib/trpc", () => ({ trpc: { build: { lookup: { useQuery: () => ({ data: lookupResult, isFetching: false, error: null }) } } } }));
vi.mock("@/lib/uidHistory", () => ({ isValidUidForGame: () => true, loadLastUid: () => "", saveLastUid: () => undefined }));

describe("優先強化項目の画面統合", () => {
  beforeEach(() => window.history.replaceState({}, "", "/?game=zzz&uid=1300622089&character=eren"));

  it("未達キャラクターを初期選択すると、優先強化カードと不足量を描画する", () => {
    render(createElement(Home));
    expect(screen.getByRole("heading", { name: "優先して強化する項目" })).toBeTruthy();
    expect(screen.getByText("目標 150% まであと 18.4%")).toBeTruthy();
    expect(screen.getByText("-18.4%", { exact: true })).toBeTruthy();
    expect(screen.getByText("EQUIPMENT ACTION / 主ステータスを変更")).toBeTruthy();
    expect(screen.getByText("IV：会心ダメ")).toBeTruthy();
  });
});
