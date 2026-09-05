import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了200件と正規カタログ順の第16バッチ20名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(200);
    expect(ledger.pending).toBe(48);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 77, pending: 4 },
      genshin: { total: 109, reviewed: 65, pending: 44 },
      zzz: { total: 58, reviewed: 58, pending: 0 },
    });
    expect(ledger.nextBatch.id).toBe(16);
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "不死途", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "乱破", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "椒丘", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "爻光", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "バーバラ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ファルザン", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "フリンズ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "フレミネ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "マーヴィカ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ミカ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ムアラニ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "モナ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ヤフォダ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ヨォーヨ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ラウマ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "リオセスリ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "リサ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "リネ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "リネット", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "レイラ", status: "pending" }),
    ]);
  });
});
