import { describe, expect, it } from "vitest";
import {
  calcSetPrice,
  formatYen,
  setPriceHeadline,
  setPriceNote,
} from "@/utils/price";

describe("calcSetPrice", () => {
  it("両面とも価格が判明していれば合計する", () => {
    const price = calcSetPrice([{ price: 6050 }, { price: 6050 }]);
    expect(price).toEqual({
      knownPriceTotal: 12100,
      unknownPriceCount: 0,
      hasUnknownPrice: false,
    });
  });

  it("オープン価格は 0 円として合計しない", () => {
    const price = calcSetPrice([{ price: 6050 }, { price: null }]);
    expect(price.knownPriceTotal).toBe(6050);
    expect(price.unknownPriceCount).toBe(1);
    expect(price.hasUnknownPrice).toBe(true);
  });

  it("両面ともオープン価格なら価格不明として扱う", () => {
    const price = calcSetPrice([{ price: null }, { price: null }]);
    expect(price.knownPriceTotal).toBe(0);
    expect(price.unknownPriceCount).toBe(2);
  });
});

describe("表示文言", () => {
  it("価格が揃っていれば金額を表示する", () => {
    const price = calcSetPrice([{ price: 6050 }, { price: 6050 }]);
    expect(setPriceHeadline(price)).toBe("¥12,100");
    expect(setPriceNote(price)).toBe("両面の参考価格合計（税込）");
  });

  it("オープン価格を含む場合は ¥0 も過少な合計も表示しない", () => {
    const partial = calcSetPrice([{ price: 6050 }, { price: null }]);
    expect(setPriceHeadline(partial)).toBe("算出不可");
    expect(setPriceHeadline(partial)).not.toContain("¥0");
    expect(setPriceNote(partial)).toContain("¥6,050");
    expect(setPriceNote(partial)).toContain("オープン価格");

    const unknown = calcSetPrice([{ price: null }, { price: null }]);
    expect(setPriceHeadline(unknown)).toBe("算出不可");
    expect(setPriceNote(unknown)).toBe(
      "両面ともオープン価格のため、合計は算出できません"
    );
  });

  it("金額は日本語ロケールで整形する", () => {
    expect(formatYen(12100)).toBe("¥12,100");
  });
});
