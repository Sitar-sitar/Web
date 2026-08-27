import { readFileSync } from "node:fs";

const root = "/home/ubuntu/starrail-build-advisor/.research-cache";
const genshin = JSON.parse(readFileSync(`${root}/genshin-characters.json`, "utf8"));
const genshinLoc = JSON.parse(readFileSync(`${root}/genshin-loc.json`, "utf8"));
const zzz = JSON.parse(readFileSync(`${root}/zzz-avatars.json`, "utf8"));
const zzzLoc = JSON.parse(readFileSync(`${root}/zzz-locs.json`, "utf8"));

const target = new Set(["クレー", "クロリンデ", "コレイ", "ゴロー", "コロンビーナ", "シグウィン", "ニコ", "ノルムー", "ヒューゴ", "ピュロイス", "ビリー", "プルクラ"]);
const localized = (loc, key) => String(loc?.ja?.[String(key)] ?? "");

for (const [id, value] of Object.entries(genshin)) {
  const name = localized(genshinLoc, value.NameTextMapHash);
  if (target.has(name)) console.log(`genshin:${id}\t${name}\t${value.Element}\t${value.WeaponType}`);
}

for (const [id, value] of Object.entries(zzz)) {
  const name = localized(zzzLoc, value.Name);
  if (target.has(name)) console.log(`zzz:${id}\t${name}\t${value.ProfessionType}\t${(value.ElementTypes ?? []).join(",")}`);
}
