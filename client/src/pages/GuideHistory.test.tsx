// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import GuideHistory from "./GuideHistory";
import React from "react";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    build: {
      guideHistory: {
        useQuery: () => ({
          isLoading: false,
          data: {
            currentBaseline: "2026-08-18",
            characters: [{ game: "zzz", name: "エレン", profileId: "crit", dataAsOf: "2026-08-18", sourceLabel: "public data", events: [] }],
            siteEvents: [{ date: "2026-08-18", title: "更新", summary: "summary", changes: ["change"], rationale: "reason", games: ["zzz"] }],
          },
        }),
      },
    },
  },
}));

describe("更新履歴の多言語表示", () => {
  beforeEach(() => window.localStorage.setItem("starrail-build-advisor.language", "en"));

  it("保存済みの英語設定を復元し、中国語へ切り替える", () => {
    render(<LanguageProvider><GuideHistory /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "Update History" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Site-wide Changes" })).toBeTruthy();
    expect(screen.getByPlaceholderText("Search character")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "简体中文" }));
    expect(screen.getByRole("heading", { name: "更新记录" })).toBeTruthy();
    expect(screen.getByPlaceholderText("搜索角色")).toBeTruthy();
    expect(window.localStorage.getItem("starrail-build-advisor.language")).toBe("zh-CN");
  });
});
