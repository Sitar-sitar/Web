import type { GuideDefinition } from "./buildAdvisor";
import { guideFor, withGuideMetadata } from "./buildAdvisor";
import { batch15ConstellationFor } from "./batch15Constellations";
import { batch15GuideFor } from "./batch15Guides";
import { batch15PartyFor } from "./batch15Parties";
import { CHARACTER_GUIDE_CATALOG, HSR_RUNTIME_PATHS, ZZZ_RUNTIME_PROFESSIONS, type CatalogGameId } from "./characterGuideCatalog";
import { constellationProfileFor } from "./characterConstellations";
import { characterUpdateLedger } from "./characterUpdateLedger";
import { generatedGenshinGuide, generatedZzzGuide } from "./individualGuides";
import { partyRecommendationsFor } from "./partyRecommendations";
import { resolveCharacterIdentity } from "./characterIdentity";

export type CharacterReferenceCatalogEntry = {
  game: CatalogGameId;
  name: string;
  status: "reviewed" | "pending";
  batch: number | null;
};

export type CharacterReference = {
  game: CatalogGameId;
  name: string;
  status: "reviewed" | "pending";
  batch: number | null;
  guide: GuideDefinition;
  partyRecommendations: ReturnType<typeof partyRecommendationsFor>;
  constellations: ReturnType<typeof constellationProfileFor>;
};

const GAME_IDS: CatalogGameId[] = ["hsr", "genshin", "zzz"];

export function isCatalogCharacter(game: CatalogGameId, name: string) {
  return (CHARACTER_GUIDE_CATALOG[game] as readonly string[]).includes(name);
}

function baseGuideFor(game: CatalogGameId, name: string): GuideDefinition {
  if (game === "hsr") {
    return guideFor(name, HSR_RUNTIME_PATHS[name] ?? "");
  }
  if (game === "genshin") {
    return withGuideMetadata("genshin", generatedGenshinGuide(name), name);
  }
  return withGuideMetadata("zzz", generatedZzzGuide(name, ZZZ_RUNTIME_PROFESSIONS[name] ?? "Attack"), name);
}

export function characterReferenceCatalog() {
  const ledger = characterUpdateLedger();
  const entryByKey = new Map(ledger.entries.map((entry) => [`${entry.game}:${entry.name}`, entry]));
  const games = Object.fromEntries(GAME_IDS.map((game) => [
    game,
    CHARACTER_GUIDE_CATALOG[game].map((name): CharacterReferenceCatalogEntry => {
      const entry = entryByKey.get(`${game}:${name}`);
      return {
        game,
        name,
        status: entry?.status ?? "pending",
        batch: entry?.batch ?? null,
      };
    }),
  ])) as Record<CatalogGameId, CharacterReferenceCatalogEntry[]>;

  return {
    dataAsOf: CHARACTER_GUIDE_CATALOG.dataAsOf,
    total: ledger.total,
    reviewed: ledger.reviewed,
    pending: ledger.pending,
    games,
  };
}

export function characterReferenceFor(game: CatalogGameId, name: string): CharacterReference | null {
  if (!isCatalogCharacter(game, name)) return null;

  const ledgerEntry = characterUpdateLedger().entries.find((entry) => entry.game === game && entry.name === name);
  const baseGuide = baseGuideFor(game, name);
  const guide = batch15GuideFor(game, name, baseGuide) ?? baseGuide;
  const partyRecommendations = batch15PartyFor(game, name) ?? partyRecommendationsFor(game, name);
  const identity = resolveCharacterIdentity(game, name, name);
  const constellations = batch15ConstellationFor(game, name, 0) ?? constellationProfileFor(identity, 0);

  return {
    game,
    name,
    status: ledgerEntry?.status ?? "pending",
    batch: ledgerEntry?.batch ?? null,
    guide,
    partyRecommendations,
    constellations,
  };
}
