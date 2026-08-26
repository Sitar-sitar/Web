import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了70件と第8バッチ10名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(70);
    expect(ledger.pending).toBe(178);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 27, pending: 54 },
      genshin: { total: 109, reviewed: 22, pending: 87 },
      zzz: { total: 58, reviewed: 21, pending: 37 },
    });
    expect(ledger.nextBatch.id).toBe(8);
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "ヴェルト", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "ギャラガー", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "キュレネ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "ギルガメッシュ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "アンバー", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "イアンサ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "イネファ", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "0号・アンビー", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "アリア", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "アリス", status: "pending" }),
    ]);
  });
});
