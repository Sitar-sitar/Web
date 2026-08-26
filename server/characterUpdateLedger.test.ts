import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了100件と第11バッチ10名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(100);
    expect(ledger.pending).toBe(148);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 39, pending: 42 },
      genshin: { total: 109, reviewed: 31, pending: 78 },
      zzz: { total: 58, reviewed: 30, pending: 28 },
    });
    expect(ledger.nextBatch.id).toBe(11);
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "セーバル", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "ゼーレ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "ダリア", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "トリビー", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "オロルン", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "カーヴェ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ガイア", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "カリン", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "クレタ", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "シーシィア", status: "pending" }),
    ]);
  });
});
