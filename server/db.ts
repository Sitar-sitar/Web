import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertTranslationFeedback, InsertUser, lookupAnalyticsEvents, translationFeedback, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createTranslationFeedback(feedback: InsertTranslationFeedback): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Translation feedback storage is unavailable");
  }

  try {
    await db.insert(translationFeedback).values(feedback);
  } catch (error) {
    console.error("[Database] Failed to save translation feedback:", error);
    throw error;
  }
}

export type TranslationFeedbackStatus = "new" | "in_progress" | "resolved";

export async function listTranslationFeedback() {
  const db = await getDb();
  if (!db) {
    throw new Error("Translation feedback storage is unavailable");
  }

  return db
    .select()
    .from(translationFeedback)
    .orderBy(desc(translationFeedback.createdAt), desc(translationFeedback.id))
    .limit(250);
}

export async function updateTranslationFeedbackStatus(id: number, status: TranslationFeedbackStatus): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Translation feedback storage is unavailable");
  }

  const existing = await db
    .select({ id: translationFeedback.id })
    .from(translationFeedback)
    .where(eq(translationFeedback.id, id))
    .limit(1);
  if (!existing.length) return false;

  await db.update(translationFeedback).set({ status }).where(eq(translationFeedback.id, id));
  return true;
}

export type LookupGame = "hsr" | "genshin" | "zzz";
export type LookupAnalyticsFilter = { game?: LookupGame; startAt?: Date; endAt?: Date };

export async function recordLookupAnalyticsEvent(game: LookupGame, cacheHit: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Lookup analytics storage is unavailable");
  await db.insert(lookupAnalyticsEvents).values({ game, cacheHit: cacheHit ? 1 : 0 });
}

export async function getLookupAnalyticsDashboard(filters: LookupAnalyticsFilter = {}) {
  const db = await getDb();
  if (!db) throw new Error("Lookup analytics storage is unavailable");

  const conditions = [
    filters.game ? eq(lookupAnalyticsEvents.game, filters.game) : undefined,
    filters.startAt ? gte(lookupAnalyticsEvents.createdAt, filters.startAt) : undefined,
    filters.endAt ? lte(lookupAnalyticsEvents.createdAt, filters.endAt) : undefined,
  ].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));
  const where = conditions.length ? and(...conditions) : undefined;
  const aggregateFields = {
    totalLookups: count(lookupAnalyticsEvents.id),
    cacheHits: sql<number>`coalesce(sum(${lookupAnalyticsEvents.cacheHit}), 0)`,
  };

  const [total] = where
    ? await db.select(aggregateFields).from(lookupAnalyticsEvents).where(where)
    : await db.select(aggregateFields).from(lookupAnalyticsEvents);

  const groupedFields = { game: lookupAnalyticsEvents.game, ...aggregateFields };
  const grouped = where
    ? await db.select(groupedFields).from(lookupAnalyticsEvents).where(where).groupBy(lookupAnalyticsEvents.game)
    : await db.select(groupedFields).from(lookupAnalyticsEvents).groupBy(lookupAnalyticsEvents.game);

  const normalize = (row: { totalLookups: number | string; cacheHits: number | string }) => {
    const totalLookups = Number(row.totalLookups ?? 0);
    const cacheHits = Number(row.cacheHits ?? 0);
    return { totalLookups, cacheHits, cacheMisses: Math.max(0, totalLookups - cacheHits), cacheHitRate: totalLookups ? Math.round((cacheHits / totalLookups) * 1000) / 10 : 0 };
  };
  const byGame = (["hsr", "genshin", "zzz"] as const).map((game) => ({ game, ...normalize(grouped.find((row) => row.game === game) ?? { totalLookups: 0, cacheHits: 0 }) }));
  return { filters: { game: filters.game ?? null, startDate: filters.startAt?.toISOString().slice(0, 10) ?? null, endDate: filters.endAt?.toISOString().slice(0, 10) ?? null }, ...normalize(total ?? { totalLookups: 0, cacheHits: 0 }), byGame };
}
