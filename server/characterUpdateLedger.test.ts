import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了40件と第5バッチ10名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(40);
    expect(ledger.pending).toBe(208);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 15, pending: 66 },
      genshin: { total: 109, reviewed: 13, pending: 96 },
      zzz: { total: 58, reviewed: 12, pending: 46 },
    });
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "Dr.レイシオ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "カフカ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "ブラックスワン", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "鏡流", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "行秋", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "香菱", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "フィッシュル", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "グレース", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "バーニス", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "ルーシー", status: "pending" }),
    ]);
  });
});
