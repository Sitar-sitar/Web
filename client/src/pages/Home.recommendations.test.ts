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
    id: "eren", identity: { game: "zzz", sourceId: "eren", key: "zzz:eren", displayName: "エレン", variantOf: "エレン（別実装）", resolved: true, resolution: "provider" }, name: "エレン", level: 60, rank: 0, portrait: null, element: "氷", elementColor: "#76c8dc", path: "強攻", lightCone: null, relics: [], allStats: [{ name: "会心率", display: "68.0%", icon: null }],
    guide: { headline: "会心ダメージを強化する。", relicSet: "極地のヘヴィメタル ×4", planarSet: "会心率を優先", mainStats: [] },
    comparisons: [{ key: "critDmg", label: "会心ダメージ", unit: "%", current: 131.6, currentDisplay: "131.6%", targets: { "厳選": 180, "目標": 150, "妥協": 130 }, achieved: { "厳選": false, "目標": false, "妥協": true } }],
    recommendations: [{ key: "critDmg", label: "会心ダメージ", unit: "%", current: 131.6, target: 150, deficit: 18.4, priority: "優先", rationale: "目標 150% まであと 18.4%" }],
    equipmentActions: [{ recommendationKey: "critDmg", statLabel: "会心ダメージ", action: "主ステータスを変更", slot: "IV", equippedName: "ドライバディスク 4", currentMain: "HP%", desiredStat: "会心ダメ", reason: "IVは現在HP%です。会心ダメを主ステータスにした装備へ変更します。" }],
    partyRecommendations: { gameVersion: "3.1", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", options: [
      { id: "ice-core", rank: 1, title: { ja: "氷・標準", en: "Ice Standard", "zh-CN": "冰系标准" }, members: [{ name: { ja: "エレン", en: "Ellen", "zh-CN": "艾莲" }, role: { ja: "主力", en: "Main DPS", "zh-CN": "主C" } }], synergy: [{ ja: "氷属性ダメージを支援する。", en: "Supports Ice damage.", "zh-CN": "辅助冰属性伤害。" }], targetChanges: [], targetSummary: { ja: "基本目標を維持。", en: "Keep baseline targets.", "zh-CN": "维持基础目标。" }, gameVersion: "3.1", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: { ja: "公開ガイド", en: "Public guide", "zh-CN": "公开指南" }, sourceUrl: "https://example.com/ice", communitySources: [{ label: { ja: "公開SNS", en: "Public social post", "zh-CN": "公开SNS" }, url: "https://example.com/social", checkedAt: "2026-08-25", note: { ja: "代替案を確認。", en: "Alternative checked.", "zh-CN": "已核对替代方案。" }, status: "crossChecked" }] },
      { id: "crit-core", rank: 2, title: { ja: "会心・集中", en: "CRIT Focus", "zh-CN": "暴击集中" }, members: [{ name: { ja: "エレン", en: "Ellen", "zh-CN": "艾莲" }, role: { ja: "主力", en: "Main DPS", "zh-CN": "主C" } }], synergy: [{ ja: "会心率を優先する。", en: "Prioritizes CRIT Rate.", "zh-CN": "优先暴击率。" }], targetChanges: [{ key: "critRate", label: { ja: "会心率", en: "CRIT Rate", "zh-CN": "暴击率" }, unit: "%", targets: { "厳選": 85, "目標": 75, "妥協": 65 }, reason: { ja: "会心率を75%へ引き上げる。", en: "Raises CRIT Rate target to 75%.", "zh-CN": "将暴击率目标提高至75%。" } }], targetSummary: { ja: "会心率目標を変更。", en: "Changes CRIT Rate target.", "zh-CN": "调整暴击率目标。" }, gameVersion: "3.1", dataAsOf: "2026-08-25", updatedAt: "2026-08-25", sourceLabel: { ja: "公開ガイド", en: "Public guide", "zh-CN": "公开指南" }, sourceUrl: "https://example.com/crit", communitySources: [{ label: { ja: "公開SNS", en: "Public social post", "zh-CN": "公开SNS" }, url: "https://example.com/social", checkedAt: "2026-08-25", note: { ja: "代替案を確認。", en: "Alternative checked.", "zh-CN": "已核对替代方案。" }, status: "crossChecked" }] },
    ] },
  }],
};

let activeLookupResult: any = lookupResult;

function lookupWithPartySelection(gameVersion: string, change: { key: string; label: string; unit: "%" | ""; target: number; reason: string }) {
  const result = structuredClone(lookupResult);
  const party = result.characters[0].partyRecommendations;
  party.gameVersion = gameVersion;
  party.options.forEach((option: any) => {
    option.gameVersion = gameVersion;
    option.dataAsOf = "2026-08-25";
    option.updatedAt = "2026-08-25";
  });
  party.options[1].targetChanges = [{
    key: change.key,
    label: { ja: change.label, en: change.label, "zh-CN": change.label },
    unit: change.unit,
    targets: { "厳選": change.target + 10, "目標": change.target, "妥協": change.target - 10 },
    reason: { ja: change.reason, en: change.reason, "zh-CN": change.reason },
  }];
  party.options[1].targetSummary = { ja: change.reason, en: change.reason, "zh-CN": change.reason };
  return result;
}

function lookupWithMiyabiMindscape() {
  const result = structuredClone(lookupResult);
  const character = result.characters[0];
  character.id = "miyabi";
  character.name = "星見雅";
  character.rank = 2;
  character.identity = { game: "zzz", sourceId: "1191", key: "zzz:1191", displayName: "星見雅", variantOf: null, resolved: true, resolution: "provider" };
  character.constellations = {
    rankLabel: { ja: "心象映画", en: "Mindscape Cinema", "zh-CN": "心象电影" },
    acquiredRank: 2,
    dataStatus: "curated",
    gameVersion: "3.1",
    dataAsOf: "2026-08-25",
    updatedAt: "2026-08-25",
    sourceLabel: { ja: "公開ガイド", en: "Public guide", "zh-CN": "公开指南" },
    sourceUrl: "https://example.com/miyabi",
    effects: [
      { level: 1, name: { ja: "霜雪の頂", en: "Frost Atop the Snow", "zh-CN": "霜雪之巅" }, description: { ja: "M1の効果。", en: "M1 effect.", "zh-CN": "M1效果。" } },
      { level: 2, name: { ja: "呼吸法", en: "Breath Technique", "zh-CN": "呼吸法" }, description: { ja: "入場時に会心率を15%上げる。", en: "Gains 15% CRIT Rate on entry.", "zh-CN": "入场时暴击率提高15%。" }, targetChanges: [{ key: "critRate", label: { ja: "会心率", en: "CRIT Rate", "zh-CN": "暴击率" }, unit: "%", targets: { "厳選": 65, "目標": 55, "妥協": 45 }, reason: { ja: "M2の戦闘中会心率+15%を反映。", en: "Applies M2's 15% in-combat CRIT Rate.", "zh-CN": "反映M2战斗内15%暴击率。" } }] },
      { level: 3, name: { ja: "武芸", en: "Martial Discipline", "zh-CN": "武艺" }, description: { ja: "M3の効果。", en: "M3 effect.", "zh-CN": "M3效果。" } },
      { level: 4, name: { ja: "断裂", en: "Rupture", "zh-CN": "断裂" }, description: { ja: "M4の効果。", en: "M4 effect.", "zh-CN": "M4效果。" } },
      { level: 5, name: { ja: "記念日", en: "Anniversary", "zh-CN": "纪念日" }, description: { ja: "M5の効果。", en: "M5 effect.", "zh-CN": "M5效果。" } },
      { level: 6, name: { ja: "天賦", en: "Prodigious Talent", "zh-CN": "天赋" }, description: { ja: "M6の効果。", en: "M6 effect.", "zh-CN": "M6效果。" } },
    ],
    activeTargetChanges: [{ key: "critRate", label: { ja: "会心率", en: "CRIT Rate", "zh-CN": "暴击率" }, unit: "%", targets: { "厳選": 65, "目標": 55, "妥協": 45 }, reason: { ja: "M2の戦闘中会心率+15%を反映。", en: "Applies M2's 15% in-combat CRIT Rate.", "zh-CN": "反映M2战斗内15%暴击率。" } }],
  };
  return result;
}

const mocks = vi.hoisted(() => ({ queryEnabled: [] as boolean[] }));
vi.mock("@/lib/trpc", () => ({ trpc: { build: { lookup: { useQuery: (_input: unknown, options: { enabled?: boolean }) => { mocks.queryEnabled.push(Boolean(options.enabled)); return { data: options.enabled ? activeLookupResult : undefined, isFetching: false, error: null }; } } } } }));
vi.mock("@/lib/uidHistory", () => ({ isValidUidForGame: () => true, loadLastUid: () => "", saveLastUid: () => undefined }));

describe("優先強化項目の画面統合", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    window.localStorage.setItem("starrail-build-advisor.language", "ja");
    window.history.replaceState({}, "", "/?game=zzz&uid=1300622089&character=eren");
    mocks.queryEnabled.length = 0;
    activeLookupResult = lookupResult;
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

  it("IDと派生実装の識別情報を詳細画面へ表示する", () => {
    render(createElement(LanguageProvider, null, createElement(Home)));
    fireEvent.click(screen.getByRole("button", { name: "照会する" }));
    expect(screen.getByText("SOURCE ID / zzz:eren")).toBeTruthy();
    expect(screen.getByText("エレン（別実装）とは別実装として識別しています。")).toBeTruthy();
  });

  it("凸データが未収集のキャラクターには、効果を推測せず収集中表示を出す", () => {
    render(createElement(LanguageProvider, null, createElement(Home)));
    fireEvent.click(screen.getByRole("button", { name: "照会する" }));
    expect(screen.getByRole("heading", { name: "凸効果・目標補正" })).toBeTruthy();
    expect(screen.getByText("このキャラクターの凸効果データは収集中です。表示対象は10キャラクター単位で検証・適用します。")).toBeTruthy();
  });

  it("星見雅M2では解放済み効果を既定表示し、未解放効果を折り畳み、会心率目標を再計算する", () => {
    activeLookupResult = lookupWithMiyabiMindscape();
    window.history.replaceState({}, "", "/?game=zzz&uid=1300622089&character=miyabi");
    render(createElement(LanguageProvider, null, createElement(Home)));
    fireEvent.click(screen.getByRole("button", { name: "照会する" }));

    expect(screen.getByText("解放済み / 心象映画 1")).toBeTruthy();
    expect(screen.getByText("解放済み / 心象映画 2")).toBeTruthy();
    expect(screen.getByText("呼吸法")).toBeTruthy();
    expect(screen.getByText("凸による目標変更 / 会心率 55%")).toBeTruthy();
    expect(screen.getAllByText("55%").length).toBeGreaterThan(0);

    const locked = screen.getByText("未解放の効果を表示").closest("details");
    expect(locked).toBeTruthy();
    expect(locked?.open).toBe(false);
    fireEvent.click(screen.getByText("未解放の効果を表示"));
    expect(locked?.open).toBe(true);
    expect(screen.getByText("武芸")).toBeTruthy();
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

  it("最大3案の推奨編成に対応バージョンを表示し、選択した案の目標補正を比較表へ反映する", () => {
    render(createElement(LanguageProvider, null, createElement(Home)));
    fireEvent.click(screen.getByRole("button", { name: "照会する" }));
    expect(screen.getByRole("heading", { name: "おすすめPT編成" })).toBeTruthy();
    expect(screen.getByText("対応バージョン 3.1")).toBeTruthy();
    expect(screen.getByRole("button", { name: /PLAN 02/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /PLAN 02/ }));
    expect(screen.getByText("会心率を75%へ引き上げる。")).toBeTruthy();
    expect(screen.getAllByText("75%").length).toBeGreaterThan(0);
    expect(screen.getByText("-7.0%", { exact: true })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "会心率" })).toBeTruthy();
  });

  it.each([
    { game: "hsr", version: "4.4", change: { key: "speed", label: "速度", unit: "" as const, target: 154, reason: "速度を154に調整する。" } },
    { game: "genshin", version: "7.0", change: { key: "elementalMastery", label: "元素熟知", unit: "" as const, target: 160, reason: "元素熟知を160に調整する。" } },
  ])("$gameでもPlan選択後に対応バージョンと編成別目標を表示する", ({ game, version, change }) => {
    activeLookupResult = lookupWithPartySelection(version, change);
    window.history.replaceState({}, "", `/?game=${game}&uid=123456789&character=test`);
    render(createElement(LanguageProvider, null, createElement(Home)));
    fireEvent.click(screen.getByRole("button", { name: "照会する" }));
    expect(screen.getByText(`対応バージョン ${version}`)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /PLAN 02/ }));
    expect(screen.getAllByText(change.reason).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`${change.target}${change.unit}`).length).toBeGreaterThan(0);
  });
});
