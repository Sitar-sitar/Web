import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createTranslationFeedback: vi.fn(),
  getLookupAnalyticsDashboard: vi.fn(),
  listTranslationFeedback: vi.fn(),
  lookupGameBuild: vi.fn(),
  recordLookupAnalyticsEvent: vi.fn(),
  updateTranslationFeedbackStatus: vi.fn(),
}));

vi.mock("./db", () => ({
  createTranslationFeedback: mocks.createTranslationFeedback,
  getLookupAnalyticsDashboard: mocks.getLookupAnalyticsDashboard,
  listTranslationFeedback: mocks.listTranslationFeedback,
  recordLookupAnalyticsEvent: mocks.recordLookupAnalyticsEvent,
  updateTranslationFeedbackStatus: mocks.updateTranslationFeedbackStatus,
}));

vi.mock("./gameProviders", () => ({ lookupGameBuild: mocks.lookupGameBuild }));

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
    mocks.getLookupAnalyticsDashboard.mockReset();
    mocks.lookupGameBuild.mockReset();
    mocks.recordLookupAnalyticsEvent.mockReset();
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

  it("records successful lookups anonymously with the game and cache result", async () => {
    mocks.lookupGameBuild.mockResolvedValue({ cached: true, player: { uid: "802643469" }, characters: [] });
    mocks.recordLookupAnalyticsEvent.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(context);

    await expect(caller.build.lookup({ game: "hsr", uid: "802643469" })).resolves.toMatchObject({ cached: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.recordLookupAnalyticsEvent).toHaveBeenCalledWith("hsr", true);
  });

  it("allows only admins to view lookup analytics", async () => {
    const nonAdmin = appRouter.createCaller(context);
    await expect(nonAdmin.analytics.lookupDashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });

    const dashboard = { totalLookups: 3, cacheHits: 2, cacheMisses: 1, cacheHitRate: 66.7, byGame: [] };
    mocks.getLookupAnalyticsDashboard.mockResolvedValue(dashboard);
    const admin = appRouter.createCaller(adminContext);
    await expect(admin.analytics.lookupDashboard()).resolves.toEqual(dashboard);
  });

  it("filters lookup analytics by JST date range and game, and rejects reversed dates", async () => {
    const dashboard = { totalLookups: 2, cacheHits: 1, cacheMisses: 1, cacheHitRate: 50, byGame: [] };
    mocks.getLookupAnalyticsDashboard.mockResolvedValue(dashboard);
    const admin = appRouter.createCaller(adminContext);

    await expect(admin.analytics.lookupDashboard({ game: "zzz", startDate: "2026-08-01", endDate: "2026-08-25" })).resolves.toEqual(dashboard);
    expect(mocks.getLookupAnalyticsDashboard).toHaveBeenCalledWith({
      game: "zzz",
      startAt: new Date("2026-07-31T15:00:00.000Z"),
      endAt: new Date("2026-08-25T14:59:59.999Z"),
    });

    mocks.getLookupAnalyticsDashboard.mockClear();
    await expect(admin.analytics.lookupDashboard({ startDate: "2026-08-26", endDate: "2026-08-25" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.getLookupAnalyticsDashboard).not.toHaveBeenCalled();

    await expect(admin.analytics.lookupDashboard({ startDate: "2026-02-30" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.getLookupAnalyticsDashboard).not.toHaveBeenCalled();
  });
});
