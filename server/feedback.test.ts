import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createTranslationFeedback: vi.fn(),
  listTranslationFeedback: vi.fn(),
  updateTranslationFeedbackStatus: vi.fn(),
}));

vi.mock("./db", () => ({
  createTranslationFeedback: mocks.createTranslationFeedback,
  listTranslationFeedback: mocks.listTranslationFeedback,
  updateTranslationFeedbackStatus: mocks.updateTranslationFeedbackStatus,
}));

import { appRouter } from "./routers";

const context = {
  req: {},
  res: {},
  user: null,
} as any;

const adminContext = {
  req: {},
  res: {},
  user: { id: 1, openId: "owner", role: "admin" },
} as any;

describe("translation feedback submission", () => {
  beforeEach(() => {
    mocks.createTranslationFeedback.mockReset();
    mocks.createTranslationFeedback.mockResolvedValue(undefined);
    mocks.listTranslationFeedback.mockReset();
    mocks.updateTranslationFeedbackStatus.mockReset();
  });

  it("stores a valid public report without collecting a user identity", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.feedback.submit({
      feedbackType: "mistranslation",
      locale: "en",
      pagePath: "/",
      originalText: "CURRENT EQUIPMENT",
      suggestedText: "Current Equipment",
      notes: "Use title case consistently.",
    })).resolves.toEqual({ success: true });

    expect(mocks.createTranslationFeedback).toHaveBeenCalledWith({
      feedbackType: "mistranslation",
      locale: "en",
      pagePath: "/",
      originalText: "CURRENT EQUIPMENT",
      suggestedText: "Current Equipment",
      notes: "Use title case consistently.",
    });
  });

  it("rejects invalid page paths and undersized suggestions", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.feedback.submit({
      feedbackType: "improvement",
      locale: "ja",
      pagePath: "/?uid=123456789",
      suggestedText: "x",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.createTranslationFeedback).not.toHaveBeenCalled();
  });

  it("allows only admins to list reports and update their status", async () => {
    const nonAdmin = appRouter.createCaller(context);
    await expect(nonAdmin.feedback.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.listTranslationFeedback).not.toHaveBeenCalled();

    mocks.listTranslationFeedback.mockResolvedValue([{ id: 7, status: "new", suggestedText: "Clarify this label" }]);
    mocks.updateTranslationFeedbackStatus.mockResolvedValue(true);
    const admin = appRouter.createCaller(adminContext);
    await expect(admin.feedback.list()).resolves.toEqual([{ id: 7, status: "new", suggestedText: "Clarify this label" }]);
    await expect(admin.feedback.updateStatus({ id: 7, status: "in_progress" })).resolves.toEqual({ success: true });
    expect(mocks.updateTranslationFeedbackStatus).toHaveBeenCalledWith(7, "in_progress");
  });
});
