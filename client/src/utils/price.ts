/**
 * 参考価格の集計（純粋関数）。
 * `price: null` は「オープン価格＝価格不明」であり 0 円ではない。
 * 合計は「確認できた価格の合計」と「価格不明を含むか」を分けて持つ（修正設計書 APP-01）。
 */

export type PricedItem = { price: number | null };

export type SetPrice = {
  /** price が判明している面だけを合計した金額（円） */
  knownPriceTotal: number;
  /** price が不明（オープン価格）の面の数 */
  unknownPriceCount: number;
  /** 価格不明の面を含むか */
  hasUnknownPrice: boolean;
};

export function calcSetPrice(items: PricedItem[]): SetPrice {
  const knownPriceTotal = items.reduce(
    (total, item) => total + (item.price ?? 0),
    0
  );
  const unknownPriceCount = items.filter(item => item.price === null).length;

  return {
    knownPriceTotal,
    unknownPriceCount,
    hasUnknownPrice: unknownPriceCount > 0,
  };
}

export function formatYen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

/** 合計欄の大きい見出し。価格不明を含む場合は金額を出さない。 */
export function setPriceHeadline(price: SetPrice): string {
  return price.hasUnknownPrice ? "算出不可" : formatYen(price.knownPriceTotal);
}

/** 合計欄の補足文。価格不明の扱いを明示する。 */
export function setPriceNote(price: SetPrice): string {
  if (!price.hasUnknownPrice) {
    return "両面の参考価格合計（税込）";
  }

  if (price.knownPriceTotal > 0) {
    return `確認できる価格分 ${formatYen(price.knownPriceTotal)} ＋ オープン価格${price.unknownPriceCount}枚（合計は算出できません）`;
  }

  return "両面ともオープン価格のため、合計は算出できません";
}
