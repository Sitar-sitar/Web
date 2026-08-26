import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了80件と第9バッチ10名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(80);
    expect(ledger.pending).toBe(168);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 31, pending: 50 },
      genshin: { total: 109, reviewed: 25, pending: 84 },
      zzz: { total: 58, reviewed: 24, pending: 34 },
    });
    expect(ledger.nextBatch.id).toBe(9);
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "クラーラ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "ケリュドラ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "サフェル", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "サンポ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "イファ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ヴァレサ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ウェンティ", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "アンドー", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "アンビー", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "イヴリン", status: "pending" }),
    ]);
  });
});
