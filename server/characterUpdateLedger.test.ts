import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了180件と正規カタログ順の第15バッチ20名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(180);
    expect(ledger.pending).toBe(68);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 69, pending: 12 },
      genshin: { total: 109, reviewed: 57, pending: 52 },
      zzz: { total: 58, reviewed: 54, pending: 4 },
    });
    expect(ledger.nextBatch.id).toBe(15);
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "御空", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "三月なのか", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "長夜月", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "停雲", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "白露", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "緋英", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "彦卿", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "姫子", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ディルック", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ドゥリン", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "トーマ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ドリー", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ナヴィア", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ニィロウ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ネフェル", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ノエル", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "猫又", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "盤岳", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "葉瞬光", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "潘引壺", status: "pending" }),
    ]);
  });
});
