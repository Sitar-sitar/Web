/**
 * お気に入りの localStorage 入出力。
 * 保存済みデータは壊れている前提で読み、型検証を通ったものだけを採用する（修正設計書 ROB-01）。
 * スキーマを変更するときはキー末尾の版数（.v1）を上げ、旧キーは読まない。
 */
import {
  BUDGET_VALUES,
  HANDEDNESS_VALUES,
  LEVEL_VALUES,
  ROLE_VALUES,
  type Budget,
  type Handedness,
  type Level,
  type Role,
  type SavedSet,
} from "@/types/favorites";

export const FAVORITE_RUBBERS_KEY = "rubber-index.favorite-rubbers.v1";
export const FAVORITE_SETS_KEY = "rubber-index.favorite-sets.v1";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[]
): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function isSavedSet(value: unknown): value is SavedSet {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;

  return (
    isNonEmptyString(item.id) &&
    isNonEmptyString(item.foreId) &&
    isNonEmptyString(item.backId) &&
    isOneOf<Handedness>(item.handedness, HANDEDNESS_VALUES) &&
    isOneOf<Role>(item.foreRole, ROLE_VALUES) &&
    isOneOf<Role>(item.backRole, ROLE_VALUES) &&
    isOneOf<Level>(item.level, LEVEL_VALUES) &&
    isOneOf<Budget>(item.budget, BUDGET_VALUES) &&
    isNonEmptyString(item.createdAt) &&
    !Number.isNaN(new Date(item.createdAt).getTime())
  );
}

function parseArray(raw: string | null): unknown[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 壊れた要素は破棄し、正しい ID だけを返す。 */
export function parseFavoriteRubberIds(raw: string | null): string[] {
  return parseArray(raw).filter(isNonEmptyString);
}

/** 壊れた要素は破棄し、型検証を通ったセットだけを返す。 */
export function parseFavoriteSets(raw: string | null): SavedSet[] {
  return parseArray(raw).filter(isSavedSet);
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 保存不可でも画面内の利用は継続する */
  }
}

export function loadFavoriteRubberIds(): string[] {
  return parseFavoriteRubberIds(readRaw(FAVORITE_RUBBERS_KEY));
}

export function loadFavoriteSets(): SavedSet[] {
  return parseFavoriteSets(readRaw(FAVORITE_SETS_KEY));
}

export function saveFavoriteRubberIds(ids: string[]) {
  writeRaw(FAVORITE_RUBBERS_KEY, ids);
}

export function saveFavoriteSets(sets: SavedSet[]) {
  writeRaw(FAVORITE_SETS_KEY, sets);
}
