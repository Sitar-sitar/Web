import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了50件と第6バッチ10名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(50);
    expect(ledger.pending).toBe(198);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 19, pending: 62 },
      genshin: { total: 109, reviewed: 16, pending: 93 },
      zzz: { total: 58, reviewed: 15, pending: 43 },
    });
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "ブローニャ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "銀狼", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "符玄", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "羅刹", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "白朮", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "八重神子", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "宵宮", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "シーザー", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "リナ", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "青衣", status: "pending" }),
    ]);
  });
});
