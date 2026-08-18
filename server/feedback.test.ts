import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createTranslationFeedback: vi.fn(),
}));

vi.mock("./db", () => ({
  createTranslationFeedback: mocks.createTranslationFeedback,
}));

import { appRouter } from "./routers";

const context = {
  req: {},
  res: {},
  user: null,
} as any;

describe("translation feedback submission", () => {
  beforeEach(() => {
    mocks.createTranslationFeedback.mockReset();
    mocks.createTranslationFeedback.mockResolvedValue(undefined);
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
});
