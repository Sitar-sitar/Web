import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { lookupGameBuild } from "./gameProviders";
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
    lookup: publicProcedure
      .input(z.object({ game: z.enum(["hsr", "genshin", "zzz"]), uid: z.string().trim().regex(/^\d{8,10}$/, "UIDは8〜10桁の数字で入力してください。") }).superRefine(({ game, uid }, ctx) => {
        if (game !== "zzz" && !/^\d{9,10}$/.test(uid)) {
          ctx.addIssue({ code: "custom", path: ["uid"], message: "このゲームのUIDは9〜10桁の数字で入力してください。" });
        }
      }))
      .query(({ input }) => lookupGameBuild(input.game, input.uid)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
