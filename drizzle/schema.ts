import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Public reports about incorrect or improvable translations. Personal contact
 * details are intentionally not collected; reports are reviewed operationally.
 */
export const translationFeedback = mysqlTable("translation_feedback", {
  id: int("id").autoincrement().primaryKey(),
  feedbackType: mysqlEnum("feedbackType", ["mistranslation", "improvement", "other"]).notNull(),
  locale: varchar("locale", { length: 16 }).notNull(),
  pagePath: varchar("pagePath", { length: 255 }).notNull(),
  originalText: text("originalText"),
  suggestedText: text("suggestedText").notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["new", "reviewed", "resolved"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TranslationFeedback = typeof translationFeedback.$inferSelect;
export type InsertTranslationFeedback = typeof translationFeedback.$inferInsert;
