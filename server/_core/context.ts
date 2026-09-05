import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { authenticateGitHubAdminRequest } from "./githubAdminAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // GitHub App administrator sessions are supported in both the full-stack
  // runtime and the API-only Railway deployment.
  try {
    user = await authenticateGitHubAdminRequest(opts.req);
  } catch {
    user = null;
  }

  // Preserve the legacy Manus session flow only for the original full-stack
  // runtime. The public Railway API does not load the Manus SDK.
  if (!user && process.env.API_ONLY !== "true") {
    const { sdk } = await import("./sdk");
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
