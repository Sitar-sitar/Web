import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了20件と第3バッチ10名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(20);
    expect(ledger.pending).toBe(228);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 7, pending: 74 },
      genshin: { total: 109, reviewed: 7, pending: 102 },
      zzz: { total: 58, reviewed: 6, pending: 52 },
    });
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "サンデー", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "ブートヒル", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "黄泉", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "霊砂", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "雷電将軍", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ナヒーダ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "鍾離", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "ビビアン", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "ジェーン", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "エレン", status: "pending" }),
    ]);
  });
});
