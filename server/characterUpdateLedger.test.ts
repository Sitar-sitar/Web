import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了60件と第7バッチ10名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(60);
    expect(ledger.pending).toBe(188);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 23, pending: 58 },
      genshin: { total: 109, reviewed: 19, pending: 90 },
      zzz: { total: 58, reviewed: 18, pending: 40 },
    });
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "アーチャー", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "アーラン", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "アスター", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "アルジェンティ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "アーロイ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "アイノ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "アルベド", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "「11号」", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "「シード」", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "「トリガー」", status: "pending" }),
    ]);
  });
});
