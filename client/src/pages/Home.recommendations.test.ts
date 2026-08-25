// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";
import { LanguageProvider } from "@/contexts/LanguageContext";

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

const mocks = vi.hoisted(() => ({ queryEnabled: [] as boolean[] }));
vi.mock("@/lib/trpc", () => ({ trpc: { build: { lookup: { useQuery: (_input: unknown, options: { enabled?: boolean }) => { mocks.queryEnabled.push(Boolean(options.enabled)); return { data: options.enabled ? lookupResult : undefined, isFetching: false, error: null }; } } } } }));
vi.mock("@/lib/uidHistory", () => ({ isValidUidForGame: () => true, loadLastUid: () => "", saveLastUid: () => undefined }));

describe("優先強化項目の画面統合", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    window.localStorage.setItem("starrail-build-advisor.language", "ja");
    window.history.replaceState({}, "", "/?game=zzz&uid=1300622089&character=eren");
    mocks.queryEnabled.length = 0;
  });

  it("保存済みUIDやURLのUIDだけでは照会せず、照会ボタン実行後に優先強化カードを描画する", () => {
    render(createElement(LanguageProvider, null, createElement(Home)));
    expect(mocks.queryEnabled).toEqual([false]);
    expect(screen.queryByRole("heading", { name: "優先して強化する項目" })).toBeNull();
    expect(screen.getByRole("link", { name: "管理者" }).getAttribute("href")).toBe("/admin/feedback");
    fireEvent.click(screen.getByRole("button", { name: "照会する" }));
    expect(mocks.queryEnabled.at(-1)).toBe(true);
    expect(screen.getByRole("heading", { name: "優先して強化する項目" })).toBeTruthy();
    expect(screen.getByText("目標 150% まであと 18.4%")).toBeTruthy();
    expect(screen.getByText("-18.4%", { exact: true })).toBeTruthy();
    expect(screen.getByText("装備アクション / 主ステータスを変更")).toBeTruthy();
    expect(screen.getByText("IV：会心ダメ")).toBeTruthy();
  });

  it("ゲーム切替だけでは照会を開始しない", () => {
    render(createElement(LanguageProvider, null, createElement(Home)));
    fireEvent.click(screen.getByRole("button", { name: "GI" }));
    expect(mocks.queryEnabled.at(-1)).toBe(false);
    expect(screen.queryByRole("heading", { name: "公開キャラクター" })).toBeNull();
  });

  it("保存済みの英語設定で、優先強化提案と装備アクションを英語表示する", () => {
    window.localStorage.setItem("starrail-build-advisor.language", "en");
    render(createElement(LanguageProvider, null, createElement(Home)));
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(screen.getByRole("heading", { name: "Priority Upgrades" })).toBeTruthy();
    expect(screen.getByText("EQUIPMENT ACTION / Change Main Stat")).toBeTruthy();
    expect(screen.getByText("CURRENT 131.6%", { exact: false })).toBeTruthy();
  });
});
