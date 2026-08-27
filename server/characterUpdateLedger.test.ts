import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了160件と正規カタログ順の第14バッチ20名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(160);
    expect(ledger.pending).toBe(88);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 63, pending: 18 },
      genshin: { total: 109, reviewed: 49, pending: 60 },
      zzz: { total: 58, reviewed: 48, pending: 10 },
    });
    expect(ledger.nextBatch.id).toBe(14);
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "刃", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "青雀", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "雪衣", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "素裳", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "丹恒", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "丹恒・騰荒", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "セトス", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "セノ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ダリア", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "タルタリヤ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "チャスカ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ディオナ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ディシア", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ティナリ", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "狛野真斗", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "朱鳶", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "照", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "千夏", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "浅羽悠真", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "南宮羽", status: "pending" }),
    ]);
  });
});
