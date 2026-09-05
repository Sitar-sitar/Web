import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { applyBatch15CuratedOverrides } from "./batch15CuratedData";
import { applyBatch15History } from "./batch15History";
import { characterReferenceCatalog, characterReferenceFor } from "./characterReference";
import { createTranslationFeedback, getLookupAnalyticsDashboard, listTranslationFeedback, recordLookupAnalyticsEvent, updateTranslationFeedbackStatus } from "./db";
import { lookupGameBuild } from "./gameProviders";
import { guideUpdateHistory } from "./guideUpdateHistory";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const isCalendarDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
};

const analyticsFilterInput = z.object({
  game: z.enum(["hsr", "genshin", "zzz"]).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "開始日はYYYY-MM-DD形式で指定してください。").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "終了日はYYYY-MM-DD形式で指定してください。").optional(),
}).superRefine((input, ctx) => {
  if (input.startDate && !isCalendarDate(input.startDate)) {
    ctx.addIssue({ code: "custom", path: ["startDate"], message: "開始日に有効な日付を指定してください。" });
  }
  if (input.endDate && !isCalendarDate(input.endDate)) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "終了日に有効な日付を指定してください。" });
  }
  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "終了日は開始日以降を指定してください。" });
  }
});

const startOfJst = (date: string) => new Date(`${date}T00:00:00.000+09:00`);
const endOfJst = (date: string) => new Date(`${date}T23:59:59.999+09:00`);

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  build: router({
    guideHistory: publicProcedure.query(() => applyBatch15History(guideUpdateHistory())),
    referenceCatalog: publicProcedure.query(() => characterReferenceCatalog()),
    reference: publicProcedure
      .input(z.object({ game: z.enum(["hsr", "genshin", "zzz"]), name: z.string().trim().min(1).max(80) }))
      .query(({ input }) => {
        const result = characterReferenceFor(input.game, input.name);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "キャラクターが図鑑に見つかりません。" });
        }
        return result;
      }),
    lookup: publicProcedure
      .input(z.object({ game: z.enum(["hsr", "genshin", "zzz"]), uid: z.string().trim().regex(/^\d{8,10}$/, "UIDは8〜10桁の数字で入力してください。") }).superRefine(({ game, uid }, ctx) => {
        if (game !== "zzz" && !/^\d{9,10}$/.test(uid)) {
          ctx.addIssue({ code: "custom", path: ["uid"], message: "このゲームのUIDは9〜10桁の数字で入力してください。" });
        }
      }))
      .query(async ({ input }) => {
        const result = applyBatch15CuratedOverrides(await lookupGameBuild(input.game, input.uid));
        // Analytics are anonymous and must not turn a successful lookup into a failure.
        try {
          await recordLookupAnalyticsEvent(input.game, result.cached);
        } catch (error) {
          console.error("[Analytics] Failed to record lookup:", error);
        }
        return result;
      }),
  }),

  analytics: router({
    lookupDashboard: adminProcedure.input(analyticsFilterInput.optional()).query(async ({ input }) => {
      try {
        return await getLookupAnalyticsDashboard({
          game: input?.game,
          startAt: input?.startDate ? startOfJst(input.startDate) : undefined,
          endAt: input?.endDate ? endOfJst(input.endDate) : undefined,
        });
      } catch (error) {
        console.error("[Analytics] Failed to load lookup dashboard:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to load lookup analytics" });
      }
    }),
  }),

  feedback: router({
    submit: publicProcedure
      .input(z.object({
        feedbackType: z.enum(["mistranslation", "improvement", "other"]),
        locale: z.enum(["ja", "en", "zh-CN"]),
        pagePath: z.string().trim().max(255).regex(/^\/[a-zA-Z0-9/_-]*$/, "Invalid page path"),
        originalText: z.string().trim().max(800).optional(),
        suggestedText: z.string().trim().min(3).max(1000),
        notes: z.string().trim().max(2000).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await createTranslationFeedback({
            feedbackType: input.feedbackType,
            locale: input.locale,
            pagePath: input.pagePath,
            originalText: input.originalText || null,
            suggestedText: input.suggestedText,
            notes: input.notes || null,
          });
          return { success: true } as const;
        } catch (error) {
          console.error("[Feedback] Failed to store translation feedback:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to save feedback" });
        }
      }),
    list: adminProcedure.query(async () => {
      try {
        return await listTranslationFeedback();
      } catch (error) {
        console.error("[Feedback] Failed to list translation feedback:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to load feedback" });
      }
    }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "in_progress", "resolved"]) }))
      .mutation(async ({ input }) => {
        try {
          const updated = await updateTranslationFeedbackStatus(input.id, input.status);
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found" });
          return { success: true } as const;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Feedback] Failed to update feedback status:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to update feedback" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
