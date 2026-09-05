/** 診断条件とお気に入り保存で共有する型定義。 */

export type Handedness = "right" | "left";
export type Role = "spin" | "counter" | "control";
export type Level = "beginner" | "middle";
export type Budget = "easy" | "standard" | "free";

export type SavedSet = {
  id: string;
  foreId: string;
  backId: string;
  handedness: Handedness;
  foreRole: Role;
  backRole: Role;
  level: Level;
  budget: Budget;
  createdAt: string;
};

export const HANDEDNESS_VALUES: readonly Handedness[] = ["right", "left"];
export const ROLE_VALUES: readonly Role[] = ["spin", "counter", "control"];
export const LEVEL_VALUES: readonly Level[] = ["beginner", "middle"];
export const BUDGET_VALUES: readonly Budget[] = ["easy", "standard", "free"];
