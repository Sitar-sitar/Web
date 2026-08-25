// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import FeedbackAdmin from "./FeedbackAdmin";
import React from "react";

const mocks = vi.hoisted(() => ({
  authState: { user: { id: 1, role: "admin" }, loading: false, isAuthenticated: true },
  dashboardInput: vi.fn(),
  mutate: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => mocks.authState }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    feedback: {
      list: { useQuery: () => ({ isLoading: false, error: null, data: [{ id: 1, feedbackType: "mistranslation", locale: "ja", pagePath: "/", originalText: "CURRENT", suggestedText: "現在", notes: null, status: "new", createdAt: "2026-08-18T13:34:34.000Z" }] }) },
      updateStatus: { useMutation: (options: { onSuccess?: (result: unknown) => void }) => ({ mutate: (input: unknown) => mocks.mutate(input, options), isPending: false }) },
    },
    analytics: {
      lookupDashboard: { useQuery: (input: unknown) => { mocks.dashboardInput(input); return { isLoading: false, error: null, data: { totalLookups: 3, cacheHits: 2, cacheMisses: 1, cacheHitRate: 66.7, byGame: [{ game: "hsr", totalLookups: 1, cacheHits: 1, cacheMisses: 0, cacheHitRate: 100 }, { game: "genshin", totalLookups: 1, cacheHits: 0, cacheMisses: 1, cacheHitRate: 0 }, { game: "zzz", totalLookups: 1, cacheHits: 1, cacheMisses: 0, cacheHitRate: 100 }] } }; } },
    },
    useUtils: () => ({ feedback: { list: { invalidate: mocks.invalidate } } }),
  },
}));

describe("フィードバック管理画面", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    window.localStorage.setItem("starrail-build-advisor.language", "ja");
    mocks.authState = { user: { id: 1, role: "admin" }, loading: false, isAuthenticated: true };
    mocks.mutate.mockReset();
    mocks.invalidate.mockReset();
    mocks.dashboardInput.mockReset();
    mocks.mutate.mockImplementation((_input, options) => options?.onSuccess?.({ success: true }));
  });

  it("管理者は報告一覧を確認し、対応状況を更新できる", async () => {
    render(<LanguageProvider><FeedbackAdmin /></LanguageProvider>);
    expect(screen.getAllByRole("heading", { name: "フィードバック管理" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "照会ダッシュボード" })).toBeTruthy();
    expect(screen.getByText("キャッシュ利用率")).toBeTruthy();
    expect(screen.getByText("現在")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("対応状況"), { target: { value: "resolved" } });
    expect(mocks.mutate).toHaveBeenCalledWith({ id: 1, status: "resolved" }, expect.any(Object));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("対応状況を更新しました"));
  });

  it("日付範囲とゲームタイトルを適用して集計クエリを絞り込める", () => {
    render(<LanguageProvider><FeedbackAdmin /></LanguageProvider>);
    fireEvent.change(screen.getByLabelText("開始日"), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText("終了日"), { target: { value: "2026-08-25" } });
    fireEvent.change(screen.getByLabelText("ゲームタイトル"), { target: { value: "zzz" } });
    fireEvent.click(screen.getByRole("button", { name: "適用する" }));
    expect(mocks.dashboardInput).toHaveBeenLastCalledWith({ game: "zzz", startDate: "2026-08-01", endDate: "2026-08-25" });
  });

  it("非管理者には一覧を表示しない", () => {
    mocks.authState = { user: { id: 2, role: "user" }, loading: false, isAuthenticated: true };
    render(<LanguageProvider><FeedbackAdmin /></LanguageProvider>);
    expect(screen.getByText("この画面は管理者のみ利用できます。")).toBeTruthy();
    expect(screen.queryByText("現在")).toBeNull();
  });
});
