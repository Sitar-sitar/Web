import {
  equipmentActionsFor,
  priorityRecommendations,
  type BuildLookupResult,
  type CharacterProfile,
  type StatComparison,
  type StatKey,
  type TargetStatDefinition,
  type TierName,
} from "./buildAdvisor";
import { batch15ConstellationFor } from "./batch15Constellations";
import { batch15GuideFor } from "./batch15Guides";
import { batch15PartyFor } from "./batch15Parties";

const STAT_ALIASES: Partial<Record<StatKey, string[]>> = {
  critRate: ["会心率", "CRIT Rate"], critDmg: ["会心ダメ", "CRIT DMG"], speed: ["速度", "SPD"], attack: ["攻撃力", "ATK"], attackPercent: ["攻撃力%", "ATK%"], breakEffect: ["撃破特効", "Break Effect"], effectHitRate: ["効果命中", "Effect Hit Rate"], effectRes: ["効果抵抗", "Effect RES"], hp: ["HP", "HP上限"], hpPercent: ["HP%"], defense: ["防御力", "DEF"], defPercent: ["防御力%", "DEF%"], energyRecharge: ["EP回復効率", "元素チャージ効率", "Energy Recharge"], elementalMastery: ["元素熟知", "Elemental Mastery"], anomalyMastery: ["異常掌握"], anomalyProficiency: ["異常マスタリー", "異常精通"], impact: ["衝撃力"], penRatio: ["貫通率"], energyRegen: ["エネルギー自動回復", "エネルギー回復"],
};

function parseDisplay(display: string) {
  const normalized = display.replace(/,/g, "").replace(/[％%]/g, "");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) ? value : null;
}

function currentFor(character: CharacterProfile, target: TargetStatDefinition) {
  const existing = character.comparisons.find((entry) => entry.key === target.key);
  if (existing) return { current: existing.current, currentDisplay: existing.currentDisplay };
  const aliases = STAT_ALIASES[target.key] ?? [target.label];
  const stat = character.allStats.find((entry) => aliases.some((alias) => entry.name === alias || entry.name.includes(alias)));
  if (!stat) return { current: null, currentDisplay: "未取得" };
  return { current: parseDisplay(stat.display), currentDisplay: stat.display };
}

function comparisonFor(character: CharacterProfile, target: TargetStatDefinition): StatComparison {
  const { current, currentDisplay } = currentFor(character, target);
  const achieved = Object.fromEntries((['厳選', '目標', '妥協'] as TierName[]).map((tier) => [tier, current === null ? null : current >= target.targets[tier]])) as Record<TierName, boolean | null>;
  return { ...target, current, currentDisplay, achieved };
}

function isSafeBatch15Identity(character: CharacterProfile) {
  if (character.identity.game === "hsr" && character.name === "三月なのか") return character.identity.sourceId === "1001" && !character.identity.variantOf;
  return !character.identity.variantOf;
}

function applyCharacter(character: CharacterProfile): CharacterProfile {
  if (!isSafeBatch15Identity(character)) return character;
  const game = character.identity.game;
  const guide = batch15GuideFor(game, character.name, character.guide);
  if (!guide) return character;
  const comparisons = guide.targets.map((target) => comparisonFor(character, target));
  const recommendations = priorityRecommendations(comparisons);
  return {
    ...character,
    guide,
    comparisons,
    recommendations,
    equipmentActions: equipmentActionsFor(guide, character.relics, recommendations),
    partyRecommendations: batch15PartyFor(game, character.name) ?? character.partyRecommendations,
    constellations: batch15ConstellationFor(game, character.name, character.rank) ?? character.constellations,
  };
}

export function applyBatch15CuratedOverrides(result: BuildLookupResult): BuildLookupResult {
  return { ...result, characters: result.characters.map(applyCharacter) };
}
