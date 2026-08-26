import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了30件と第4バッチ10名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(30);
    expect(ledger.pending).toBe(218);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 11, pending: 70 },
      genshin: { total: 109, reviewed: 10, pending: 99 },
      zzz: { total: 58, reviewed: 9, pending: 49 },
    });
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "アベンチュリン", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "トパーズ&カブ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "花火", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "丹恒・飲月", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "アルハイゼン", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "胡桃", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "久岐忍", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "セス", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "パイパー", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "蒼角", status: "pending" }),
    ]);
  });
});
