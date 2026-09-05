import { describe, expect, it } from "vitest";
import {
  chinaGuideRubberIds,
  rubbers,
  sources,
  type Rubber,
} from "@/lib/rubberData";
import { brandTint } from "@/utils/brandTint";

/** メーカー公式サイトとして許可するホスト名。 */
const ALLOWED_SOURCE_HOSTS = new Set([
  "www.butterfly.co.jp",
  "www.nittaku.com",
  "www.victas.com",
  "www.yasakajp.com",
  "tibhar-japan.com",
  "m.xiom.jp",
  "stigasports.jp",
  "www.donic.jp",
  "andro.jp",
  "www.andro.de",
  "joola.co.jp",
  "www.juic.co.jp",
]);

const SCORE_KEYS: Array<keyof Pick<Rubber, "speed" | "spin" | "control">> = [
  "speed",
  "spin",
  "control",
];

describe("ラバーデータの整合性", () => {
  it("1件以上のデータを持つ", () => {
    expect(rubbers.length).toBeGreaterThan(0);
  });

  it("id が全件ユニーク", () => {
    const ids = rubbers.map(rubber => rubber.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("speed / spin / control は 1〜5 の整数", () => {
    for (const rubber of rubbers) {
      for (const key of SCORE_KEYS) {
        const value = rubber[key];
        expect(
          Number.isInteger(value) && value >= 1 && value <= 5,
          `${rubber.id}.${key} = ${value}`
        ).toBe(true);
      }
    }
  });

  it("price は null または 0 より大きい有限数", () => {
    for (const rubber of rubbers) {
      if (rubber.price === null) continue;
      expect(
        Number.isFinite(rubber.price) && rubber.price > 0,
        `${rubber.id}.price = ${rubber.price}`
      ).toBe(true);
    }
  });

  it("priceLabel と price が矛盾しない", () => {
    for (const rubber of rubbers) {
      if (rubber.price === null) {
        expect(rubber.priceLabel, rubber.id).toContain("オープン価格");
      } else {
        expect(rubber.priceLabel, rubber.id).toContain(
          rubber.price.toLocaleString("ja-JP")
        );
        expect(rubber.priceLabel, rubber.id).not.toContain("オープン価格");
      }
    }
  });

  it("source は許可済みメーカードメインの https URL", () => {
    for (const rubber of rubbers) {
      const url = new URL(rubber.source);
      expect(url.protocol, rubber.id).toBe("https:");
      expect(ALLOWED_SOURCE_HOSTS.has(url.hostname), `${rubber.id} ${url.hostname}`).toBe(true);
    }
  });

  it("公式ソース一覧も許可済みメーカードメインの https URL", () => {
    for (const source of sources) {
      const url = new URL(source.url);
      expect(url.protocol, source.name).toBe("https:");
      expect(ALLOWED_SOURCE_HOSTS.has(url.hostname), `${source.name} ${url.hostname}`).toBe(true);
    }
  });

  it("styles が空でない", () => {
    for (const rubber of rubbers) {
      expect(rubber.styles.length, rubber.id).toBeGreaterThan(0);
    }
  });

  it("brand が brandTint に網羅されている", () => {
    for (const rubber of rubbers) {
      expect(brandTint[rubber.brand], rubber.id).toBeTruthy();
    }
  });

  it("brandTint に未使用のブランドが残っていない", () => {
    const usedBrands = new Set(rubbers.map(rubber => rubber.brand));
    for (const brand of Object.keys(brandTint)) {
      expect(usedBrands.has(brand as Rubber["brand"]), brand).toBe(true);
    }
  });

  it("verifiedAt が YYYY-MM-DD 形式の有効な日付", () => {
    for (const rubber of rubbers) {
      expect(rubber.verifiedAt, rubber.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const parsed = new Date(`${rubber.verifiedAt}T00:00:00Z`);
      expect(Number.isNaN(parsed.getTime()), rubber.id).toBe(false);
      expect(rubber.verifiedAt.slice(0, 10), rubber.id).toBe(
        parsed.toISOString().slice(0, 10)
      );
    }
  });

  it("中国製ガイドで固定参照する ID が実在する", () => {
    const ids = new Set(rubbers.map(rubber => rubber.id));
    for (const id of [
      ...chinaGuideRubberIds.beginner,
      ...chinaGuideRubberIds.advanced,
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});
