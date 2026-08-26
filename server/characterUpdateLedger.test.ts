import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了90件と第10バッチ10名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(90);
    expect(ledger.pending).toBe(158);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 35, pending: 46 },
      genshin: { total: 109, reviewed: 28, pending: 81 },
      zzz: { total: 58, reviewed: 27, pending: 31 },
    });
    expect(ledger.nextBatch.id).toBe(10);
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "ジェイド", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "ジェパード", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "セイバー", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "セイレンス", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "エウルア", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "エスコフィエ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "エミリエ", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "イドリー", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "ヴェリナ", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "オルペウス&「鬼火」", status: "pending" }),
    ]);
  });
});
