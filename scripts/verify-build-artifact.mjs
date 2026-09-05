#!/usr/bin/env node
/**
 * 本番成果物の検査（修正設計書 CI-01）。
 * build が成功しただけでは本番として正しいとは限らないため、配布物そのものを検査する。
 *
 *   node scripts/verify-build-artifact.mjs <dist-dir> [--base /Web/rubber/] [--max-js-kb 400] [--max-css-kb 60]
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const positional = args.filter(arg => !arg.startsWith("--"));
const distDir = path.resolve(positional[0] ?? "dist/public");

function option(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
}

const expectedBase = option("base", "/Web/rubber/");
const maxJsKb = Number(option("max-js-kb", "400"));
const maxCssKb = Number(option("max-css-kb", "60"));

const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

if (!fs.existsSync(distDir)) {
  console.error(`[verify-artifact] 成果物ディレクトリが存在しません: ${distDir}`);
  process.exit(1);
}

const files = listFiles(distDir);
const relative = file => path.relative(distDir, file).split(path.sep).join("/");

// 1. 出てはいけないファイル
const forbiddenPathPatterns = [
  { pattern: /(^|\/)__manus__(\/|$)/, label: "デバッグ収集用 __manus__" },
  { pattern: /\.map$/, label: "source map" },
  { pattern: /(^|\/)\.env(\.|$)/, label: ".env" },
  { pattern: /\.log$/, label: "ログファイル" },
];
for (const file of files) {
  const rel = relative(file);
  for (const { pattern, label } of forbiddenPathPatterns) {
    if (pattern.test(rel)) fail(`${label} が成果物に含まれています: ${rel}`);
  }
}

// 2. 出てはいけない文字列
const textExtensions = new Set([".html", ".js", ".css", ".json", ".txt", ".svg"]);
const forbiddenContentPatterns = [
  { pattern: "%VITE_", label: "未解決の環境変数プレースホルダ" },
  { pattern: "/manus-storage/", label: "存在しない manus-storage 参照" },
  { pattern: "__manus__", label: "デバッグ収集用 __manus__ 参照" },
];
for (const file of files) {
  if (!textExtensions.has(path.extname(file))) continue;
  const content = fs.readFileSync(file, "utf8");
  for (const { pattern, label } of forbiddenContentPatterns) {
    if (content.includes(pattern)) {
      fail(`${label}（${pattern}）が残っています: ${relative(file)}`);
    }
  }
}

// 3. index.html の基本構造
const indexPath = path.join(distDir, "index.html");
if (!fs.existsSync(indexPath)) {
  fail("index.html がありません");
} else {
  const html = fs.readFileSync(indexPath, "utf8");

  if (!html.includes(`${expectedBase}assets/`)) {
    fail(`index.html に base 付きのアセット参照（${expectedBase}assets/）がありません`);
  }

  if (!/http-equiv="Content-Security-Policy"/.test(html)) {
    fail("index.html に Content-Security-Policy の meta がありません");
  }

  if (/maximum-scale\s*=/.test(html)) {
    fail("viewport に maximum-scale が残っています（拡大操作を妨げる）");
  }

  const iconMatch = html.match(/<link[^>]+rel="icon"[^>]*>/);
  if (!iconMatch) {
    fail("index.html に favicon の link がありません");
  } else {
    const hrefMatch = iconMatch[0].match(/href="([^"]+)"/);
    if (!hrefMatch) {
      fail("favicon の href がありません");
    } else {
      const href = hrefMatch[1];
      if (!href.startsWith(expectedBase)) {
        fail(`favicon の参照が base 配下ではありません: ${href}`);
      }
      const iconPath = path.join(distDir, href.slice(expectedBase.length));
      if (!fs.existsSync(iconPath)) {
        fail(`favicon の参照先が成果物に存在しません: ${href}`);
      } else {
        notes.push(`favicon: ${href}`);
      }
    }
  }
}

// 4. バンドルサイズ
function totalKb(extension) {
  const bytes = files
    .filter(file => file.endsWith(extension))
    .reduce((sum, file) => sum + fs.statSync(file).size, 0);
  return Math.round((bytes / 1024) * 100) / 100;
}

const jsKb = totalKb(".js");
const cssKb = totalKb(".css");
notes.push(`JS 合計: ${jsKb} kB (上限 ${maxJsKb} kB)`);
notes.push(`CSS 合計: ${cssKb} kB (上限 ${maxCssKb} kB)`);
if (jsKb > maxJsKb) fail(`JS 合計サイズが上限を超えています: ${jsKb} kB > ${maxJsKb} kB`);
if (cssKb > maxCssKb) fail(`CSS 合計サイズが上限を超えています: ${cssKb} kB > ${maxCssKb} kB`);

for (const note of notes) console.log(`[verify-artifact] ${note}`);

if (failures.length > 0) {
  console.error(`[verify-artifact] NG: ${failures.length} 件`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`[verify-artifact] OK: ${files.length} ファイルを検査しました (${distDir})`);
