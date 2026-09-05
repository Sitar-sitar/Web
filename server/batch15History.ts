import type { GuideUpdateEvent } from "./guideUpdateHistory";
import { BATCH15_CHARACTERS, BATCH15_DATE } from "./batch15Guides";

type GuideHistory = ReturnType<typeof import("./guideUpdateHistory").guideUpdateHistory>;
const batch15Keys = new Set(Object.entries(BATCH15_CHARACTERS).flatMap(([game, names]) => names.map((name) => `${game}:${name}`)));

function sourceLabel(game: "hsr" | "genshin" | "zzz") {
  return game === "hsr" ? "Game8のVer4.5更新日付き個別ビルド・星魂・編成情報を照合" : game === "genshin" ? "Game8のVer7.0個別ビルド・命ノ星座・編成情報を照合" : "Game8のVer3.1更新日付きビルド・心象映画・編成情報を照合";
}
function eventFor(game: "hsr" | "genshin" | "zzz", name: string): GuideUpdateEvent {
  return {
    date: "2026-09-05T16:55:00+09:00", scope: "character", title: "第15バッチ：個別ビルド・凸・推奨PTを再精査",
    summary: `${name}の現行公開ガイドを再確認し、公開プロフィール目標、全6段階の凸効果、最大3案の推奨PTを第15バッチとして更新しました。`,
    changes: ["2026-09-05時点の更新日付き個別ガイドへ再照合", "全6段階の星魂・命ノ星座・心象映画を登録", "対象キャラクターを必ず含む最大3案の推奨PTを更新", "戦闘中・編成・凸の条件付き補正を公開プロフィール値から分離", "固定値根拠のないステータスは推測で補完しない"],
    rationale: "Manus時代と同じ個別精査基準を維持しつつ、Ver4.5/7.0/3.1の現行情報へ更新するため。", games: [game],
  };
}

export function applyBatch15History(history: GuideHistory): GuideHistory {
  const batchEvent: GuideUpdateEvent = {
    date: "2026-09-05T16:55:00+09:00", scope: "site", title: "第15バッチ20名の個別情報を更新",
    summary: "HSR 8名、原神8名、ZZZ 4名についてビルド・凸・推奨PTを現行情報へ更新しました。",
    changes: ["個別精査済みを180/248から200/248へ更新", "第16バッチ候補20名へ台帳を更新"], rationale: "Manus時代から継続している全キャラクター個別精査を再開するため。", games: ["hsr", "genshin", "zzz"],
  };
  return {
    ...history,
    siteEvents: [batchEvent, ...history.siteEvents],
    characters: history.characters.map((character) => {
      const key = `${character.game}:${character.name}`;
      if (!batch15Keys.has(key)) return character;
      return { ...character, dataAsOf: BATCH15_DATE, updatedAt: BATCH15_DATE, sourceLabel: sourceLabel(character.game), events: [eventFor(character.game, character.name), ...character.events] };
    }),
  };
}
