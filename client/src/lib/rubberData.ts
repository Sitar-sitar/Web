/**
 * 卓球ラバー図鑑 / ラボ・アーカイブ
 * Design reminder: 仕様を同じ基準で比較できる、精密で率直なデータ設計を保つ。
 * 価格は各メーカー公式の製品一覧で確認した税込価格またはオープン価格（2026-08-17確認）。
 */

export type RubberType = "裏ソフト" | "表ソフト" | "粒高" | "アンチ";
export type PlayStyle =
  | "spin"
  | "counter"
  | "sticky"
  | "control"
  | "shortPips"
  | "defense"
  | "beginner";

export type Rubber = {
  id: string;
  brand: "Butterfly" | "Nittaku" | "VICTAS";
  name: string;
  type: RubberType;
  price: number | null;
  priceLabel: string;
  hardness: "軟" | "中" | "中硬" | "硬" | "—";
  speed: number;
  spin: number;
  control: number;
  styles: PlayStyle[];
  suitableFor: string;
  source: string;
  officialNote: string;
};

export const playStyles: Array<{
  id: PlayStyle;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
}> = [
  {
    id: "spin",
    number: "01",
    title: "回転ドライブ",
    subtitle: "弧線・ループを軸にする",
    description: "台から少し下がっても、回転量と弧線で主導権を取るスタイル。",
    tags: ["高回転", "弧線", "ドライブ"],
  },
  {
    id: "counter",
    number: "02",
    title: "前陣カウンター",
    subtitle: "早い打点で押し返す",
    description: "ブロック・ミート・カウンターを早い打点でつなげるスタイル。",
    tags: ["反発", "安定", "早い打点"],
  },
  {
    id: "sticky",
    number: "03",
    title: "粘着パワー",
    subtitle: "強い回転から一撃へ",
    description: "粘着系の球持ちを生かし、サービスと強打の質を引き上げるスタイル。",
    tags: ["粘着", "強回転", "パワー"],
  },
  {
    id: "control",
    number: "04",
    title: "安定ラリー",
    subtitle: "ミスを減らして組み立てる",
    description: "台上・ブロック・つなぎの質を重視し、ラリーの再現性を高めるスタイル。",
    tags: ["安定", "扱いやすさ", "バランス"],
  },
  {
    id: "shortPips",
    number: "05",
    title: "表ソフト速攻",
    subtitle: "ミートと変化で攻める",
    description: "表ソフトを使い、早い打点のミートとナックル性の変化で展開するスタイル。",
    tags: ["表ソフト", "ミート", "速攻"],
  },
  {
    id: "defense",
    number: "06",
    title: "カット・変化",
    subtitle: "守備から相手を揺さぶる",
    description: "カットや粒高の変化を主軸に、回転量とコースで試合を設計するスタイル。",
    tags: ["カット", "粒高", "変化"],
  },
  {
    id: "beginner",
    number: "07",
    title: "基礎習得",
    subtitle: "フォームを固める",
    description: "基本打法の再現性を優先し、無理なく回転とスピードを学ぶスタイル。",
    tags: ["初級", "コントロール", "基本技術"],
  },
];

export const rubbers: Rubber[] = [
  { id: "dignics-09c", brand: "Butterfly", name: "ディグニクス09C", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "硬", speed: 4, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "粘着系の強い回転とパワードライブを求める人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "スプリング スポンジX搭載" },
  { id: "dignics-05", brand: "Butterfly", name: "ディグニクス05", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "中硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "回転量とカウンターの両方を重視する人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "スプリング スポンジX搭載" },
  { id: "dignics-80", brand: "Butterfly", name: "ディグニクス80", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "中硬", speed: 4, spin: 4, control: 4, styles: ["counter", "control"], suitableFor: "攻守の切り替えを重視する人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "スプリング スポンジX搭載" },
  { id: "dignics-64", brand: "Butterfly", name: "ディグニクス64", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "中硬", speed: 5, spin: 3, control: 3, styles: ["counter"], suitableFor: "前陣でのスピードとカウンターを求める人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "スプリング スポンジX搭載" },
  { id: "tenergy-05", brand: "Butterfly", name: "テナジー05", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "中硬", speed: 4, spin: 5, control: 3, styles: ["spin"], suitableFor: "ドライブ主体で回転を武器にしたい人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "スプリング スポンジ搭載" },
  { id: "tenergy-05fx", brand: "Butterfly", name: "テナジー05FX", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "中", speed: 4, spin: 5, control: 4, styles: ["spin", "control"], suitableFor: "回転性能と扱いやすさを両立したい人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "スプリング スポンジ搭載" },
  { id: "tenergy-80", brand: "Butterfly", name: "テナジー80", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "中硬", speed: 4, spin: 4, control: 4, styles: ["counter", "control"], suitableFor: "オールラウンドな攻撃を組み立てたい人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "スプリング スポンジ搭載" },
  { id: "tenergy-64", brand: "Butterfly", name: "テナジー64", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "中", speed: 5, spin: 3, control: 3, styles: ["counter"], suitableFor: "スピード感ある前陣攻撃をしたい人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "スプリング スポンジ搭載" },
  { id: "glayzer", brand: "Butterfly", name: "グレイザー", type: "裏ソフト", price: 6050, priceLabel: "6,050円（税込）", hardness: "中硬", speed: 4, spin: 4, control: 4, styles: ["spin", "control"], suitableFor: "回転系テンションの基本性能を求める人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "ハイテンション裏ラバー" },
  { id: "glayzer-09c", brand: "Butterfly", name: "グレイザー09C", type: "裏ソフト", price: 6050, priceLabel: "6,050円（税込）", hardness: "硬", speed: 4, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "粘着系の回転を取り入れたい人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "ハイテンション裏ラバー" },
  { id: "rozena", brand: "Butterfly", name: "ロゼナ", type: "裏ソフト", price: 5500, priceLabel: "5,500円（税込）", hardness: "中", speed: 4, spin: 4, control: 5, styles: ["control", "beginner"], suitableFor: "安定性を優先して攻撃技術を身につけたい人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "ハイテンション裏ラバー" },
  { id: "roundell", brand: "Butterfly", name: "ラウンデル", type: "裏ソフト", price: 4620, priceLabel: "4,620円（税込）", hardness: "中", speed: 4, spin: 3, control: 4, styles: ["counter", "beginner"], suitableFor: "スピードと扱いやすさの両方を求める人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "ハイテンション裏ラバー" },
  { id: "tackiness-chop", brand: "Butterfly", name: "タキネス チョップ", type: "裏ソフト", price: 3080, priceLabel: "3,080円（税込）", hardness: "軟", speed: 2, spin: 5, control: 5, styles: ["defense"], suitableFor: "カットの回転量と安定を求める人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "裏ラバー" },
  { id: "sriver", brand: "Butterfly", name: "スレイバー", type: "裏ソフト", price: 3520, priceLabel: "3,520円（税込）", hardness: "中", speed: 3, spin: 3, control: 4, styles: ["beginner"], suitableFor: "基本打法を反復して身につけたい人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "裏ラバー" },
  { id: "flextra", brand: "Butterfly", name: "フレクストラ", type: "裏ソフト", price: 2200, priceLabel: "2,200円（税込）", hardness: "軟", speed: 2, spin: 3, control: 5, styles: ["beginner"], suitableFor: "最初の一枚で基礎を固めたい人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "裏ラバー" },
  { id: "impartial-xs", brand: "Butterfly", name: "インパーシャルXS", type: "表ソフト", price: 5500, priceLabel: "5,500円（税込）", hardness: "中硬", speed: 5, spin: 3, control: 3, styles: ["shortPips"], suitableFor: "ミート・スマッシュを主軸に速攻したい人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "表ラバー" },
  { id: "speedy-po", brand: "Butterfly", name: "スピーディーP.O.", type: "表ソフト", price: 3080, priceLabel: "3,080円（税込）", hardness: "中", speed: 4, spin: 2, control: 4, styles: ["shortPips", "beginner"], suitableFor: "表ソフトの速攻技術を基礎から学びたい人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "表ラバー" },
  { id: "feint-long-3", brand: "Butterfly", name: "フェイント ロング3", type: "粒高", price: 2750, priceLabel: "2,750円（税込）", hardness: "—", speed: 1, spin: 5, control: 4, styles: ["defense"], suitableFor: "粒高カットの変化と回転量を求める人", source: "https://www.butterfly.co.jp/products/rubber/", officialNote: "ツブ高ラバー" },
  { id: "fastarc-g1", brand: "Nittaku", name: "ファスターク G-1", type: "裏ソフト", price: 7480, priceLabel: "7,480円（税込）", hardness: "中硬", speed: 4, spin: 5, control: 4, styles: ["spin"], suitableFor: "スピンドライブを軸に攻めたい人", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "テンション系／スピンドライブ重視" },
  { id: "fastarc-c1", brand: "Nittaku", name: "ファスターク C-1", type: "裏ソフト", price: 7260, priceLabel: "7,260円（税込）", hardness: "中", speed: 4, spin: 4, control: 5, styles: ["control", "spin"], suitableFor: "バランス型のラリーを組み立てたい人", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "テンション系／バランスラリー重視" },
  { id: "fastarc-s1", brand: "Nittaku", name: "ファスターク S-1", type: "裏ソフト", price: 5720, priceLabel: "5,720円（税込）", hardness: "中", speed: 5, spin: 3, control: 3, styles: ["counter"], suitableFor: "スマッシュとスピードドライブを重視する人", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "テンション系／スピードスマッシュ重視" },
  { id: "gennexion", brand: "Nittaku", name: "ジェネクション", type: "裏ソフト", price: 10780, priceLabel: "10,780円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "パワーと深い打球を求める人", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "テンション系／掴んで深く飛ばす" },
  { id: "hammond-z2", brand: "Nittaku", name: "ハモンド Z2", type: "裏ソフト", price: 7480, priceLabel: "7,480円（税込）", hardness: "中硬", speed: 5, spin: 4, control: 3, styles: ["counter"], suitableFor: "打ち負けにくさを重視して前陣で攻める人", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "ZC（ゼットチャージ）" },
  { id: "flyatt-evo", brand: "Nittaku", name: "フライアット EVO", type: "裏ソフト", price: 4950, priceLabel: "4,950円（税込）", hardness: "中", speed: 4, spin: 3, control: 4, styles: ["counter", "beginner"], suitableFor: "扱いやすいスピード系を求める人", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "AC（アクティブチャージ）" },
  { id: "kyohyo-8-80", brand: "Nittaku", name: "キョウヒョウ8-80", type: "裏ソフト", price: 6600, priceLabel: "6,600円（税込）", hardness: "中硬", speed: 4, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "粘着系を食い込ませて飛ばしたい人", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "粘着性／食い込ませて飛ばす" },
  { id: "kyohyo-neo3", brand: "Nittaku", name: "キョウヒョウ ネオ3", type: "裏ソフト", price: 5720, priceLabel: "5,720円（税込）", hardness: "硬", speed: 4, spin: 5, control: 3, styles: ["sticky"], suitableFor: "粘着性の強い回転を武器にしたい人", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "粘着性／スピード重視" },
  { id: "morist-df", brand: "Nittaku", name: "モリスト DF", type: "裏ソフト", price: 6050, priceLabel: "6,050円（税込）", hardness: "軟", speed: 2, spin: 5, control: 5, styles: ["defense"], suitableFor: "攻守バランスを保ちながらカットしたい人", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "テンション系／カット用" },
  { id: "stellack", brand: "Nittaku", name: "ステラック", type: "裏ソフト", price: 2970, priceLabel: "2,970円（税込）", hardness: "軟", speed: 2, spin: 3, control: 5, styles: ["beginner"], suitableFor: "基本打法を身につけたい入門者", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "コントロール系／入門者向け" },
  { id: "v15-sticky", brand: "VICTAS", name: "V>15 スティッキー", type: "裏ソフト", price: 8580, priceLabel: "8,580円（税込）", hardness: "硬", speed: 4, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "微粘着の強回転と反発を両立したい人", source: "https://www.victas.com/products/?cat=3", officialNote: "微粘着テンション系" },
  { id: "v15-sticky-soft", brand: "VICTAS", name: "V>15 スティッキー ソフト", type: "裏ソフト", price: 8580, priceLabel: "8,580円（税込）", hardness: "中", speed: 4, spin: 5, control: 4, styles: ["sticky", "control"], suitableFor: "粘着系の回転を扱いやすく取り入れたい人", source: "https://www.victas.com/products/?cat=3", officialNote: "微粘着テンション系" },
  { id: "v22-double-extra", brand: "VICTAS", name: "V>22 ダブルエキストラ", type: "裏ソフト", price: 8800, priceLabel: "8,800円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "高い打球威力で主導権を握りたい人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "v20-extra", brand: "VICTAS", name: "V>20 エキストラ", type: "裏ソフト", price: 7260, priceLabel: "7,260円（税込）", hardness: "中硬", speed: 5, spin: 4, control: 3, styles: ["counter"], suitableFor: "前陣から中陣の攻撃力を求める人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "v15-extra", brand: "VICTAS", name: "V>15 エキストラ", type: "裏ソフト", price: 7260, priceLabel: "7,260円（税込）", hardness: "中硬", speed: 5, spin: 4, control: 3, styles: ["counter", "spin"], suitableFor: "攻撃のスピードと回転を両立したい人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "v15-stiff", brand: "VICTAS", name: "V>15 スティフ", type: "裏ソフト", price: 7260, priceLabel: "7,260円（税込）", hardness: "中硬", speed: 5, spin: 4, control: 3, styles: ["counter"], suitableFor: "硬めの打球感でパワーを伝えたい人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "v15-limber", brand: "VICTAS", name: "V>15 リンバー", type: "裏ソフト", price: 7260, priceLabel: "7,260円（税込）", hardness: "中", speed: 4, spin: 4, control: 4, styles: ["counter", "control"], suitableFor: "弾みと球持ちのバランスを求める人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "ventus-extra", brand: "VICTAS", name: "ヴェンタス エキストラ", type: "裏ソフト", price: 6050, priceLabel: "6,050円（税込）", hardness: "中硬", speed: 4, spin: 4, control: 4, styles: ["spin", "counter"], suitableFor: "攻撃型テンションをバランスよく使いたい人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "ventus-stiff", brand: "VICTAS", name: "ヴェンタス スティフ", type: "裏ソフト", price: 5610, priceLabel: "5,610円（税込）", hardness: "中硬", speed: 4, spin: 4, control: 3, styles: ["counter"], suitableFor: "しっかりした打球感の前陣攻撃を求める人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "ventus-limber", brand: "VICTAS", name: "ヴェンタス リンバー", type: "裏ソフト", price: 5610, priceLabel: "5,610円（税込）", hardness: "中", speed: 4, spin: 4, control: 4, styles: ["control", "beginner"], suitableFor: "扱いやすい攻撃型ラバーを求める人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "ventus-regular-alpha", brand: "VICTAS", name: "ヴェンタス レギュラー アルファ", type: "裏ソフト", price: 3520, priceLabel: "3,520円（税込）", hardness: "軟", speed: 3, spin: 3, control: 5, styles: ["beginner"], suitableFor: "基本技術とコントロールを優先する人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "vj-next", brand: "VICTAS", name: "VJ>ネクスト", type: "裏ソフト", price: 3080, priceLabel: "3,080円（税込）", hardness: "中", speed: 3, spin: 3, control: 4, styles: ["beginner"], suitableFor: "無理のない価格で攻撃技術を練習したい人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "triple-extra", brand: "VICTAS", name: "トリプル エキストラ", type: "裏ソフト", price: 5500, priceLabel: "5,500円（税込）", hardness: "硬", speed: 4, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "粘着系の強回転を軸に組み立てる人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "vs401", brand: "VICTAS", name: "VS>401", type: "裏ソフト", price: 5720, priceLabel: "5,720円（税込）", hardness: "中硬", speed: 2, spin: 5, control: 5, styles: ["defense"], suitableFor: "切れたカットと守備の安定を求める人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "curl-p1v", brand: "VICTAS", name: "カール P1V", type: "粒高", price: 4620, priceLabel: "4,620円（税込）", hardness: "—", speed: 1, spin: 5, control: 4, styles: ["defense"], suitableFor: "粒高の切れたカットと変化を使いたい人", source: "https://www.victas.com/products/?cat=3", officialNote: "粒高ラバー" },
  { id: "curl-p3v", brand: "VICTAS", name: "カール P3V", type: "粒高", price: 4620, priceLabel: "4,620円（税込）", hardness: "—", speed: 1, spin: 4, control: 5, styles: ["defense"], suitableFor: "粒高で守備の安定性を求める人", source: "https://www.victas.com/products/?cat=3", officialNote: "粒高ラバー" },
  { id: "vo-102", brand: "VICTAS", name: "VO>102", type: "表ソフト", price: 6050, priceLabel: "6,050円（税込）", hardness: "中", speed: 5, spin: 3, control: 3, styles: ["shortPips"], suitableFor: "表ソフトで回転とミートを使い分けたい人", source: "https://www.victas.com/products/?cat=3", officialNote: "表ソフトラバー" },
  { id: "spectol-s1", brand: "VICTAS", name: "スペクトル S1", type: "表ソフト", price: 4620, priceLabel: "4,620円（税込）", hardness: "中", speed: 5, spin: 2, control: 4, styles: ["shortPips"], suitableFor: "表ソフトでの速攻とミートを重視する人", source: "https://www.victas.com/products/?cat=3", officialNote: "表ソフトラバー" },
];

export function getRecommendedRubbers(style: PlayStyle) {
  return rubbers
    .filter((rubber) => rubber.styles.includes(style))
    .sort((a, b) => {
      const score = (rubber: Rubber) =>
        (rubber.styles.includes(style) ? 20 : 0) + rubber.speed + rubber.spin + rubber.control;
      return score(b) - score(a);
    })
    .slice(0, 6);
}

export const sources = [
  { name: "Butterfly ラバー製品情報", url: "https://www.butterfly.co.jp/products/rubber/" },
  { name: "Nittaku 裏ソフト製品情報", url: "https://www.nittaku.com/products/rubbers/pimples-in/" },
  { name: "VICTAS ラバー製品情報", url: "https://www.victas.com/products/?cat=3" },
];
