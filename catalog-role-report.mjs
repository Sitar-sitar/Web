import { readFileSync } from "node:fs";

const catalog = JSON.parse(readFileSync("/home/ubuntu/research-character-catalogs.json", "utf8"));
const report = {
  hsr: catalog.hsr.map(({ name, path }) => ({ name, path })),
  zzz: catalog.zzz.map(({ name, profession }) => ({ name, profession })),
};

console.log(JSON.stringify(report));
