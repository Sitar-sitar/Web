import { describe, expect, it } from "vitest";
import type { GuideDefinition } from "./buildAdvisor";
import { batch15ConstellationFor } from "./batch15Constellations";
import { BATCH15_CHARACTERS, BATCH15_DATE, batch15GuideFor } from "./batch15Guides";
import { batch15PartyFor } from "./batch15Parties";
import { characterUpdateLedger } from "./characterUpdateLedger";

const baseGuide: GuideDefinition = {
  headline: "base",
  relicSet: "base",
  planarSet: "base",
  mainStats: [],
  targets: [],
};

const entries = Object.entries(BATCH15_CHARACTERS).flatMap(([game, names]) =>
  names.map((name) => ({ game: game as "hsr" | "genshin" | "zzz", name })),
);

describe("第15バッチ個別精査", () => {
  it("対象はHSR 8・原神8・ZZZ4の計20名", () => {
    expect(BATCH15_CHARACTERS.hsr).toHaveLength(8);
    expect(BATCH15_CHARACTERS.genshin).toHaveLength(8);
    expect(BATCH15_CHARACTERS.zzz).toHaveLength(4);
    expect(entries).toHaveLength(20);
  });

  it.each(entries)("$game:$name に個別ガイド・3編成・全6段階凸を返す", ({ game, name }) => {
    const guide = batch15GuideFor(game, name, baseGuide);
    expect(guide).not.toBeNull();
    expect(guide?.updatedAt).toBe(BATCH15_DATE);
    expect(guide?.dataAsOf).toBe(BATCH15_DATE);
    expect(guide?.profileId).toContain("curated:batch15:");
    expect(guide?.targetContext?.length).toBeGreaterThan(0);

    const parties = batch15PartyFor(game, name);
    expect(parties?.updatedAt).toBe(BATCH15_DATE);
    expect(parties?.options).toHaveLength(3);
    expect(parties?.options.every((option) => option.members.some((member) => member.name.ja === name))).toBe(true);

    const constellations = batch15ConstellationFor(game, name, 6);
    expect(constellations?.dataStatus).toBe("curated");
    expect(constellations?.updatedAt).toBe(BATCH15_DATE);
    expect(constellations?.effects).toHaveLength(6);
    expect(constellations?.effects.map((effect) => effect.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("更新台帳は200/248完了・残48件・第16バッチ20名になる", () => {
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
    expect(ledger.nextBatch.names).toHaveLength(20);
    expect(ledger.nextBatch.names.every((entry) => entry.status === "pending")).toBe(true);
  });
});
