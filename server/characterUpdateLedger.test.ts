import { describe, expect, it } from "vitest";
import { characterUpdateLedger } from "./characterUpdateLedger";

describe("全キャラクター更新台帳", () => {
  it("全248件を重複なく追跡し、完了140件と正規カタログ順の第13バッチ20名を返す", () => {
    const ledger = characterUpdateLedger();
    expect(ledger.total).toBe(248);
    expect(ledger.reviewed).toBe(140);
    expect(ledger.pending).toBe(108);
    expect(ledger.byGame).toEqual({
      hsr: { total: 81, reviewed: 55, pending: 26 },
      genshin: { total: 109, reviewed: 43, pending: 66 },
      zzz: { total: 58, reviewed: 42, pending: 16 },
    });
    expect(ledger.nextBatch.id).toBe(13);
    expect(new Set(ledger.entries.map((entry) => `${entry.game}:${entry.name}`)).size).toBe(ledger.total);
    expect(ledger.nextBatch.names).toEqual([
      expect.objectContaining({ game: "hsr", name: "ルカ", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "雲璃", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "遠坂凛", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "火花", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "寒鴉", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "帰忘の流離人", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "景元", status: "pending" }),
      expect.objectContaining({ game: "hsr", name: "桂乃芬", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "シトラリ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "シャルロット", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "シュヴルーズ", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "ジン", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "スカーク", status: "pending" }),
      expect.objectContaining({ game: "genshin", name: "スクロース", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "プロメイア", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "ベン", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "ライカン", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "リュシア", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "儀玄", status: "pending" }),
      expect.objectContaining({ game: "zzz", name: "橘福福", status: "pending" }),
    ]);
  });
});
