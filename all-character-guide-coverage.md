# 全キャラクター目標ステータス対応表

**データ基準日・最終整理日：2026-08-18 JST**。対象キャラクター名は `server/characterGuideCatalog.ts` に保存し、公開メタデータから取得した一覧と一対一で突合する。目標値は戦闘中・編成・武器固有の条件付き補正を原則として除外し、公開プロフィールに現れる戦闘外ステータスとの比較用に整理している。

| ゲーム | 対象件数 | 対象一覧の取得元 | 個別ガイドの解決規則 | 画面に表示する参照範囲 |
|---|---:|---|---|---|
| 崩壊：スターレイル | 81 | Mar-7th/StarRailRes 日本語キャラクターメタデータ | 精密定義を最優先。未精密定義分はキャラクター名と運命により、会心・持続ダメージ・撃破・支援・耐久・HP依存・防御依存の個別プロファイルを割当 | KQM・StarDB・Game8の公開ビルド情報を照合 |
| 原神 | 109 | Enka.Network `characters.json` と日本語ローカライズ | 精密定義を最優先。未精密定義分はキャラクター名により、会心・HP依存・防御依存・元素反応・支援の個別プロファイルを割当 | GameWith・Game8の公開ビルド情報を照合 |
| ゼンレスゾーンゼロ | 58 | Enka.Network ZZZ `avatars.json` と日本語ローカライズ | 精密定義を最優先。未精密定義分はエージェント名と特性により、直撃・異常・撃破・支援・防護・命破の個別プロファイルを割当 | Prydwen・公開エージェントデータを照合 |

## 実装上の確認方法

`server/characterGuideCatalog.ts` が現在対象にする全名称、`server/individualGuides.ts` がプロファイルごとの主ステータス・目標ステータス、`server/buildAdvisor.ts` と `server/gameProviders.ts` がゲーム別の選択とメタデータ付与を管理する。`server/buildAdvisor.test.ts` の全件網羅テストでは、各一覧のすべての名称に対して、目標値、採用プロファイル、基準日、更新日、参照範囲、個別注記が返ることを検証する。

キャラクター名ごとの実対応表は `server/characterGuideMetadata.ts` の `CHARACTER_GUIDE_METADATA` として保持する。`pnpm exec tsx guide-catalog-report.mjs --markdown` を実行すると、**全248件**について「キャラクター名→採用プロファイル→参照範囲→基準日→更新日」のMarkdown表を生成できる。

> 目標値は固定的な戦闘内DPSランキングではなく、公開プロフィールから装備の次の改善点を判断するための比較目安である。元素反応、編成、凸・完凸、モチーフ武器、条件付きバフは必要に応じて各キャラクターの注記を参照する。

## 参照先

[1] [Mar-7th/StarRailRes](https://github.com/Mar-7th/StarRailRes)  
[2] [Enka.Network](https://enka.network/)  
[3] [StarDB Recommended Stats](https://stardb.gg/en/posts/recommended-units-end-game-stats-builds)  
[4] [Prydwen ZZZ](https://www.prydwen.gg/zenless/characters)  
[5] [GameWith 原神最強キャラランキング・育成情報](https://gamewith.jp/genshin/article/show/328052)
