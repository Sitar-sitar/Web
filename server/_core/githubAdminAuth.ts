import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { randomBytes } from "crypto";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_API_VERSION = "2022-11-28";
const ADMIN_SESSION_ISSUER = "hoyoverse-builder-api";
const ADMIN_SESSION_AUDIENCE = "hoyoverse-builder-admin";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;
const ADMIN_SESSION_TTL_MS = ADMIN_SESSION_TTL_SECONDS * 1000;
const OAUTH_STATE_COOKIE = "github_admin_oauth_state";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_ADMIN_FRONTEND_URL = "https://sitar-sitar.github.io/Web/hoyoverse";

type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
};

type AdminSessionClaims = {
  githubId: string;
  login: string;
  name?: string;
  avatarUrl?: string;
  role: "admin";
};

type OAuthStateCookie = {
  nonce: string;
  returnTo: string;
};

export function parseAdminGitHubIds(raw = process.env.ADMIN_GITHUB_IDS ?? "") {
  return new Set(
    raw
      .split(/[\s,]+/)
      .map(value => value.trim())
      .filter(value => /^\d+$/.test(value)),
  );
}

export function hasGitHubAdminAllowlist() {
  return parseAdminGitHubIds().size > 0;
}

export function isGitHubAdminIdAllowed(githubId: string | number) {
  return parseAdminGitHubIds().has(String(githubId));
}

export function isGitHubAdminOpenIdAllowed(openId: string) {
  if (!openId.startsWith("github:")) return false;
  return isGitHubAdminIdAllowed(openId.slice("github:".length));
}

export function sanitizeAdminReturnPath(value: unknown) {
  if (typeof value !== "string") return "/admin";
  if (value === "/admin") return value;
  if (!value.startsWith("/admin/")) return "/admin";
  if (value.includes("..") || value.includes("\\") || value.startsWith("//")) return "/admin";
  return value;
}

function getAdminSessionSecret() {
  const raw = process.env.ADMIN_SESSION_SECRET ?? process.env.JWT_SECRET ?? "";
  if (raw.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET (or JWT_SECRET) must be at least 32 characters");
  }
  return new TextEncoder().encode(raw);
}

function getMissingConfiguration() {
  const missing: string[] = [];
  if (!process.env.GITHUB_APP_CLIENT_ID) missing.push("GITHUB_APP_CLIENT_ID");
  if (!process.env.GITHUB_APP_CLIENT_SECRET) missing.push("GITHUB_APP_CLIENT_SECRET");
  if (!hasGitHubAdminAllowlist()) missing.push("ADMIN_GITHUB_IDS");
  const sessionSecret = process.env.ADMIN_SESSION_SECRET ?? process.env.JWT_SECRET ?? "";
  if (sessionSecret.length < 32) missing.push("ADMIN_SESSION_SECRET");
  return missing;
}

function getForwardedProtocol(req: Request) {
  const forwarded = req.headers["x-forwarded-proto"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return value?.trim() || req.protocol || "https";
}

function getCallbackUrl(req: Request) {
  const configured = process.env.GITHUB_APP_CALLBACK_URL?.trim();
  if (configured) return configured;
  return `${getForwardedProtocol(req)}://${req.get("host")}/api/auth/github/callback`;
}

function getFrontendUrl(returnTo: string) {
  const base = (process.env.ADMIN_FRONTEND_URL?.trim() || DEFAULT_ADMIN_FRONTEND_URL).replace(/\/$/, "");
  return `${base}${sanitizeAdminReturnPath(returnTo)}`;
}

function encodeStateCookie(value: OAuthStateCookie) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeStateCookie(value: string | undefined): OAuthStateCookie | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed.nonce !== "string" || typeof parsed.returnTo !== "string") return null;
    return { nonce: parsed.nonce, returnTo: sanitizeAdminReturnPath(parsed.returnTo) };
  } catch {
    return null;
  }
}

function getOAuthStateCookieOptions(req: Request) {
  const sessionOptions = getSessionCookieOptions(req);
  return {
    ...sessionOptions,
    sameSite: "lax" as const,
    maxAge: OAUTH_STATE_TTL_MS,
  };
}

async function createAdminSessionToken(user: GitHubUser) {
  return new SignJWT({
    githubId: String(user.id),
    login: user.login,
    name: user.name ?? undefined,
    avatarUrl: user.avatar_url ?? undefined,
    role: "admin",
  } satisfies AdminSessionClaims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ADMIN_SESSION_ISSUER)
    .setAudience(ADMIN_SESSION_AUDIENCE)
    .setSubject(`github:${user.id}`)
    .setIssuedAt()
    .setJti(randomBytes(16).toString("hex"))
    .setExpirationTime(`${ADMIN_SESSION_TTL_SECONDS}s`)
    .sign(getAdminSessionSecret());
}

function getSessionToken(req: Request) {
  const cookieToken = parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) return authorization.slice("Bearer ".length).trim();
  return null;
}

async function verifyAdminSessionToken(token: string) {
  const { payload } = await jwtVerify(token, getAdminSessionSecret(), {
    algorithms: ["HS256"],
    issuer: ADMIN_SESSION_ISSUER,
    audience: ADMIN_SESSION_AUDIENCE,
  });

  const githubId = typeof payload.githubId === "string" ? payload.githubId : "";
  const login = typeof payload.login === "string" ? payload.login : "";
  const role = payload.role;
  if (!githubId || !login || role !== "admin" || !isGitHubAdminIdAllowed(githubId)) return null;

  return {
    githubId,
    login,
    name: typeof payload.name === "string" ? payload.name : undefined,
    avatarUrl: typeof payload.avatarUrl === "string" ? payload.avatarUrl : undefined,
  };
}

export async function authenticateGitHubAdminRequest(req: Request) {
  const token = getSessionToken(req);
  if (!token || !hasGitHubAdminAllowlist()) return null;

  try {
    const claims = await verifyAdminSessionToken(token);
    if (!claims) return null;

    const openId = `github:${claims.githubId}`;
    let user = await db.getUserByOpenId(openId);
    if (!user || user.role !== "admin") {
      await db.upsertUser({
        openId,
        name: claims.name || claims.login,
        email: null,
        loginMethod: "github",
        role: "admin",
        lastSignedIn: new Date(),
      });
      user = await db.getUserByOpenId(openId);
    }

    return user ?? null;
  } catch {
    return null;
  }
}

async function exchangeCodeForToken(code: string, callbackUrl: string) {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_APP_CLIENT_ID,
      client_secret: process.env.GITHUB_APP_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl,
    }),
  });

  if (!response.ok) throw new Error(`GitHub token exchange failed: ${response.status}`);
  const payload = await response.json() as { access_token?: string; error?: string; error_description?: string };
  if (!payload.access_token) {
    throw new Error(payload.error_description || payload.error || "GitHub access token missing");
  }
  return payload.access_token;
}

async function fetchGitHubUser(accessToken: string) {
  const response = await fetch(GITHUB_USER_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "User-Agent": "hoyoverse-builder-admin",
    },
  });
  if (!response.ok) throw new Error(`GitHub user lookup failed: ${response.status}`);

  const user = await response.json() as Partial<GitHubUser>;
  if (!Number.isSafeInteger(user.id) || typeof user.login !== "string") {
    throw new Error("GitHub user response is missing id/login");
  }
  return user as GitHubUser;
}

export function registerGitHubAdminAuthRoutes(app: Express) {
  app.get("/api/auth/github", (req: Request, res: Response) => {
    const missing = getMissingConfiguration();
    if (missing.length) {
      res.status(503).json({ error: "GitHub admin authentication is not configured", missing });
      return;
    }

    const nonce = randomBytes(32).toString("base64url");
    const returnTo = sanitizeAdminReturnPath(req.query.returnTo);
    res.cookie(OAUTH_STATE_COOKIE, encodeStateCookie({ nonce, returnTo }), getOAuthStateCookieOptions(req));

    const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("client_id", process.env.GITHUB_APP_CLIENT_ID!);
    authorizeUrl.searchParams.set("redirect_uri", getCallbackUrl(req));
    authorizeUrl.searchParams.set("state", nonce);
    res.redirect(302, authorizeUrl.toString());
  });

  app.get("/api/auth/github/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const stateCookie = decodeStateCookie(parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE]);
    res.clearCookie(OAUTH_STATE_COOKIE, { ...getOAuthStateCookieOptions(req), maxAge: -1 });

    if (!code || !state || !stateCookie || stateCookie.nonce !== state) {
      res.status(403).json({ error: "Invalid GitHub OAuth state" });
      return;
    }

    try {
      const callbackUrl = getCallbackUrl(req);
      const accessToken = await exchangeCodeForToken(code, callbackUrl);
      const githubUser = await fetchGitHubUser(accessToken);

      if (!isGitHubAdminIdAllowed(githubUser.id)) {
        res.status(403).json({ error: "This GitHub account is not an administrator" });
        return;
      }

      const openId = `github:${githubUser.id}`;
      await db.upsertUser({
        openId,
        name: githubUser.name || githubUser.login,
        email: null,
        loginMethod: "github",
        role: "admin",
        lastSignedIn: new Date(),
      });
      const storedUser = await db.getUserByOpenId(openId);
      if (!storedUser) {
        res.status(503).json({ error: "Administrator database storage is unavailable" });
        return;
      }

      const sessionToken = await createAdminSessionToken(githubUser);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ADMIN_SESSION_TTL_MS });
      res.redirect(302, getFrontendUrl(stateCookie.returnTo));
    } catch (error) {
      console.error("[GitHub Admin Auth] Callback failed", error);
      res.status(502).json({ error: "GitHub administrator authentication failed" });
    }
  });
}
