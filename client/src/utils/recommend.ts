/**
 * 両面セットの推薦ロジック（純粋関数）。
 * 予算判定では `price: null`（オープン価格）にダミー価格を割り当てない（修正設計書 APP-02）。
 */
import type { Rubber } from "@/lib/rubberData";
import type { Budget, Level, Role } from "@/types/favorites";

/** 片面あたりの上限価格。null は「こだわらない」。 */
export const BUDGET_LIMITS: Record<Budget, number | null> = {
  easy: 6000,
  standard: 8000,
  free: null,
};

/**
 * 初心者向けスコアの価格ペナルティ。
 * オープン価格帯は各社の上位モデルが中心のため、価格不明でも高価格帯と同等に減点する。
 * 価格そのものをダミー値で埋めず、減点値としてだけ扱う。
 */
const UNKNOWN_PRICE_PENALTY = 12.5;
const PRICE_PENALTY_THRESHOLD = 7000;
const PRICE_PENALTY_DIVISOR = 400;

/** 予算を指定した場合、価格不明（オープン価格）の商品は候補から除外する。 */
export function withinBudget(rubber: Rubber, budget: Budget): boolean {
  const limit = BUDGET_LIMITS[budget];
  if (limit === null) return true;
  if (rubber.price === null) return false;
  return rubber.price <= limit;
}

export function beginnerPricePenalty(rubber: Rubber): number {
  if (rubber.price === null) return UNKNOWN_PRICE_PENALTY;
  return (
    Math.max(0, rubber.price - PRICE_PENALTY_THRESHOLD) / PRICE_PENALTY_DIVISOR
  );
}

export function sideScore(rubber: Rubber, role: Role, level: Level): number {
  const base =
    role === "spin"
      ? rubber.spin * 8 + rubber.speed * 2 + rubber.control * 2
      : role === "counter"
        ? rubber.speed * 8 + rubber.control * 4 + rubber.spin * 2
        : rubber.control * 9 + rubber.spin * 3 + rubber.speed;
  const roleFit = rubber.styles.includes(role) ? 22 : 0;
  const levelFit =
    level === "beginner"
      ? rubber.control * 5 +
        (rubber.styles.includes("beginner") ? 12 : 0) -
        beginnerPricePenalty(rubber)
      : rubber.control * 2 + rubber.speed + rubber.spin;

  return base + roleFit + levelFit;
}

export type SetConditions = {
  foreRole: Role;
  backRole: Role;
  level: Level;
  budget: Budget;
};

export type SetSuggestion = {
  fore: Rubber;
  back: Rubber;
  foreList: Rubber[];
  backList: Rubber[];
  /** 予算条件でオープン価格の商品を除外した件数 */
  excludedUnknownPriceCount: number;
};

export function suggestSet(
  catalog: Rubber[],
  conditions: SetConditions
): SetSuggestion {
  const { foreRole, backRole, level, budget } = conditions;
  const candidates = catalog.filter(rubber => withinBudget(rubber, budget));
  const excludedUnknownPriceCount =
    BUDGET_LIMITS[budget] === null
      ? 0
      : catalog.filter(rubber => rubber.price === null).length;

  const foreList = [...candidates].sort(
    (a, b) => sideScore(b, foreRole, level) - sideScore(a, foreRole, level)
  );
  const fore = foreList[0] ?? catalog[0];
  const backList = [...candidates]
    .filter(rubber => rubber.id !== fore.id)
    .sort(
      (a, b) => sideScore(b, backRole, level) - sideScore(a, backRole, level)
    );
  const back = backList[0] ?? foreList[1] ?? catalog[1];

  return { fore, back, foreList, backList, excludedUnknownPriceCount };
}
