// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import TranslationFeedback from "./TranslationFeedback";
import React from "react";

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    feedback: {
      submit: {
        useMutation: () => ({ mutate: mocks.mutate, isPending: false }),
      },
    },
  },
}));

describe("翻訳フィードバック画面", () => {
  beforeEach(() => {
    window.localStorage.setItem("starrail-build-advisor.language", "en");
    window.history.replaceState({}, "", "/feedback?source=/");
    mocks.mutate.mockReset();
    mocks.mutate.mockImplementation((_input, options) => options?.onSuccess?.({ success: true }));
  });

  it("保存済み言語で表示し、中国語への切替と匿名送信を行える", () => {
    render(<LanguageProvider><TranslationFeedback /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "Help Improve Translations" })).toBeTruthy();
    expect(screen.getByText("Do not enter personal, account, or UID information.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Suggested wording"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(screen.getByRole("alert").textContent).toContain("Enter at least 3 characters");
    expect(mocks.mutate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Suggested wording"), { target: { value: "Use a consistent title." } });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(mocks.mutate).toHaveBeenCalledWith(expect.objectContaining({ locale: "en", pagePath: "/", suggestedText: "Use a consistent title." }), expect.any(Object));
    expect(screen.getByRole("status").textContent).toContain("Your report has been received");

    fireEvent.click(screen.getByRole("button", { name: "简体中文" }));
    expect(screen.getByRole("heading", { name: "帮助改进翻译" })).toBeTruthy();
    expect(window.localStorage.getItem("starrail-build-advisor.language")).toBe("zh-CN");
  });

  it("更新履歴からの報告を対象画面として保存する", () => {
    window.history.replaceState({}, "", "/feedback?source=/updates");
    render(<LanguageProvider><TranslationFeedback /></LanguageProvider>);
    fireEvent.change(screen.getByLabelText("Suggested wording"), { target: { value: "Make this label clearer." } });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(mocks.mutate).toHaveBeenCalledWith(expect.objectContaining({ pagePath: "/updates" }), expect.any(Object));
  });
});
