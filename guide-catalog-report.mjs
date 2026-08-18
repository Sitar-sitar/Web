import { CHARACTER_GUIDE_CATALOG } from "./server/characterGuideCatalog.ts";
import { CHARACTER_GUIDE_METADATA } from "./server/characterGuideMetadata.ts";

const games = ["hsr", "genshin", "zzz"];
const markdown = process.argv.includes("--markdown");

if (markdown) {
  console.log("# 全キャラクター・ガイド対応表\n");
  console.log(`基準日: ${CHARACTER_GUIDE_CATALOG.dataAsOf} JST  \\`);
  console.log(`対象一覧: ${CHARACTER_GUIDE_CATALOG.source}\n`);
  for (const game of games) {
    console.log(`## ${game.toUpperCase()} (${CHARACTER_GUIDE_CATALOG[game].length}件)\n`);
    console.log("| キャラクター | 採用プロファイル | 参照範囲 | 基準日 | 更新日 |\n|---|---|---|---|---|");
    for (const name of CHARACTER_GUIDE_CATALOG[game]) {
      const record = CHARACTER_GUIDE_METADATA[game][name];
      console.log(`| ${name} | ${record.profileId} | ${record.sourceLabel} | ${record.dataAsOf} | ${record.updatedAt} |`);
    }
    console.log("");
  }
} else {
  const report = Object.fromEntries(games.map((game) => [game, { count: CHARACTER_GUIDE_CATALOG[game].length }]));
  console.log(JSON.stringify({ dataAsOf: CHARACTER_GUIDE_CATALOG.dataAsOf, source: CHARACTER_GUIDE_CATALOG.source, report }, null, 2));
}
