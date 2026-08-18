import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTranslationFeedback } from "./db";
import { lookupGameBuild } from "./gameProviders";
import { guideUpdateHistory } from "./guideUpdateHistory";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

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
    guideHistory: publicProcedure.query(() => guideUpdateHistory()),
    lookup: publicProcedure
      .input(z.object({ game: z.enum(["hsr", "genshin", "zzz"]), uid: z.string().trim().regex(/^\d{8,10}$/, "UIDは8〜10桁の数字で入力してください。") }).superRefine(({ game, uid }, ctx) => {
        if (game !== "zzz" && !/^\d{9,10}$/.test(uid)) {
          ctx.addIssue({ code: "custom", path: ["uid"], message: "このゲームのUIDは9〜10桁の数字で入力してください。" });
        }
      }))
      .query(({ input }) => lookupGameBuild(input.game, input.uid)),
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
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
