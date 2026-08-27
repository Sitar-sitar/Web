import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了120件と第12バッチ20名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(120);
    expect(ledger.pending).toBe(128);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 47, pending: 34 },
      genshin: { total: 109, reviewed: 37, pending: 72 },
      zzz: { total: 58, reviewed: 36, pending: 22 },
    });
    expect(ledger.nextBatch.id).toBe(12);
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "フック", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "ペラ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "ヘルタ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "マダム・ヘルタ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "ミーシャ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "モーディス", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "モゼ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "リンクス", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "クレー", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "クロリンデ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "コレイ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ゴロー", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "コロンビーナ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "シグウィン", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "ニコ", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "ノルムー", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "ヒューゴ", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "ピュロイス", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "ビリー", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "プルクラ", status: "pending" }),
    ]);
  });
});
