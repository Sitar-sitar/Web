import { HSR_RUNTIME_PATHS, ZZZ_RUNTIME_PROFESSIONS, type CatalogGameId } from "./characterGuideCatalog";

const hsrDot = new Set(["カフカ", "ブラックスワン", "サンポ", "ルカ", "桂乃芬", "セイレンス", "ヒーゼル", "ダリア"]);
const hsrBreak = new Set(["ホタル", "ブートヒル", "乱破", "帰忘の流離人", "ルアン・メェイ", "ギャラガー", "霊砂"]);
const hsrHp = new Set(["刃", "キャストリス", "モーディス", "ヒアンシー", "長夜月"]);
const hsrDef = new Set(["アベンチュリン"]);
const hsrSustain = new Set(["白露", "羅刹", "フォフォ", "リンクス", "ナターシャ", "ジェパード", "符玄", "丹恒・騰荒"]);
const hsrLabels: Record<string, string> = { Warrior: "壊滅", Rogue: "巡狩", Mage: "知恵", Shaman: "調和", Knight: "存護", Warlock: "虚無", Priest: "豊穣", Memory: "記憶", Elation: "歓楽" };

const giEm = new Set(["楓原万葉", "スクロース", "ウェンティ", "早柚", "夢見月瑞希", "ナヒーダ", "久岐忍", "雷主人公"]);
const giHp = new Set(["胡桃", "夜蘭", "フリーナ", "ヌヴィレット", "ニィロウ", "鍾離", "珊瑚宮心海", "白朮", "シグウィン", "キャンディス", "トーマ", "ディシア", "レイラ", "シャルロット", "ダリア"]);
const giDef = new Set(["荒瀧一斗", "千織", "アルベド", "ノエル", "雲菫", "ゴロー", "シロネン", "カチーナ"]);
const giSupport = new Set(["ベネット", "九条裟羅", "ファルザン", "オロルン", "イアンサ", "藍硯", "ヨォーヨ", "コレイ", "ディオナ", "バーバラ", "七七", "ドリー"]);

export function expectedProfileFor(game: CatalogGameId, name: string): string {
  if (game === "hsr") {
    const path = hsrLabels[HSR_RUNTIME_PATHS[name] ?? ""] ?? HSR_RUNTIME_PATHS[name] ?? "";
    if (hsrDot.has(name)) return "dot";
    if (hsrBreak.has(name)) return "break";
    if (hsrHp.has(name)) return "hp";
    if (hsrDef.has(name)) return "def";
    if (hsrSustain.has(name)) return "sustain";
    if (path === "調和" || path === "記憶") return "support";
    if (path === "存護") return "tank";
    return "crit";
  }
  if (game === "genshin") {
    if (giEm.has(name)) return "em";
    if (giHp.has(name)) return "hp";
    if (giDef.has(name)) return "def";
    if (giSupport.has(name)) return "support";
    return "crit";
  }
  const profession = ZZZ_RUNTIME_PROFESSIONS[name] ?? "";
  return profession === "Anomaly" ? "anomaly" : profession === "Stun" ? "stun" : profession === "Support" ? "support" : profession === "Defense" ? "tank" : profession === "Rupture" ? "rupture" : "crit";
}
