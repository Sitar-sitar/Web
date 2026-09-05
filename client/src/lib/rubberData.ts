/**
 * 卓球ラバー図鑑 / ラボ・アーカイブ
 * Design reminder: 仕様を同じ基準で比較できる、精密で率直なデータ設計を保つ。
 * 価格は各メーカー公式の製品一覧で確認した税込価格またはオープン価格（2026-08-17確認、2026-09-05追補）。
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
  brand: "Butterfly" | "Nittaku" | "VICTAS" | "Yasaka" | "TIBHAR" | "XIOM" | "STIGA" | "DONIC" | "andro" | "JOOLA" | "JUIC";
  name: string;
  type: RubberType;
  price: number | null;
  priceLabel: string;
  hardness: "軟" | "中" | "中硬" | "硬" | "—";
  country?: string;
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
  { id: "zyre-03", brand: "Butterfly", name: "ザイア03", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "高い弧線と強い回転で、深いドライブやカウンターを狙いたい人", source: "https://www.butterfly.co.jp/products/detail/06140.html", officialNote: "ハイテンション／スプリング スポンジX／リコシート／スポンジ硬度44" },
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
  { id: "gennexion-v2c", brand: "Nittaku", name: "ジェネクション V2C", type: "裏ソフト", price: 10780, priceLabel: "10,780円（税込）", hardness: "硬", country: "ドイツ", speed: 5, spin: 5, control: 4, styles: ["sticky", "counter", "spin"], suitableFor: "微粘着の球持ちを生かし、台上技術と早い打点のカウンターを高めたい人", source: "https://www.nittaku.com/products/rubbers/post-71", officialNote: "微粘着テンション／デュアルトップシート・デュアルスポンジ／硬度42.5" },
  { id: "hammond-z2", brand: "Nittaku", name: "ハモンド Z2", type: "裏ソフト", price: 7480, priceLabel: "7,480円（税込）", hardness: "中硬", speed: 5, spin: 4, control: 3, styles: ["counter"], suitableFor: "打ち負けにくさを重視して前陣で攻める人", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "ZC（ゼットチャージ）" },
  { id: "flyatt-evo", brand: "Nittaku", name: "フライアット EVO", type: "裏ソフト", price: 4950, priceLabel: "4,950円（税込）", hardness: "中", speed: 4, spin: 3, control: 4, styles: ["counter", "beginner"], suitableFor: "扱いやすいスピード系を求める人", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "AC（アクティブチャージ）" },
  { id: "blastac", brand: "Nittaku", name: "ブラスタック", type: "裏ソフト", price: 5720, priceLabel: "5,720円（税込）", hardness: "軟", country: "日本", speed: 4, spin: 4, control: 5, styles: ["control", "counter"], suitableFor: "柔らかな球持ちと安定した軌道を保ちながら攻撃力も求める人", source: "https://www.nittaku.com/products/rubbers/post-78", officialNote: "AC（アクティブチャージ）／カーボンブラックスポンジ／硬度35.0" },
  { id: "kyohyo-8-80", brand: "Nittaku", name: "キョウヒョウ8-80", type: "裏ソフト", price: 6600, priceLabel: "6,600円（税込）", hardness: "中硬", speed: 4, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "粘着系を食い込ませて飛ばしたい人", source: "https://www.nittaku.com/products/rubbers/pimples-in/", officialNote: "粘着性／食い込ませて飛ばす" },
  { id: "kyohyo-neo3", brand: "Nittaku", name: "キョウヒョウ ネオ3", type: "裏ソフト", price: 5720, priceLabel: "5,720円（税込）", hardness: "硬", speed: 4, spin: 5, control: 3, styles: ["sticky"], suitableFor: "粘着性の強い回転を武器にしたい人", source: "https://www.nittaku.com/products/rubbers/post-20", officialNote: "粘着性／スピード重視" },
  { id: "kyohyo-8-80-power", brand: "Nittaku", name: "キョウヒョウ8-80パワー", type: "裏ソフト", price: 7150, priceLabel: "7,150円（税込）", hardness: "中硬", speed: 5, spin: 5, control: 3, styles: ["sticky", "spin", "counter"], suitableFor: "粘着の回転を生かしながら、反発力とバック面での扱いやすさも求める人", source: "https://www.nittaku.com/products/rubbers/post-73", officialNote: "AC内蔵／粘着性能を保ちつつパワー＋スピードドライブ" },
  { id: "kyohyo-national-blue", brand: "Nittaku", name: "キョウヒョウ3国狂ブルー", type: "裏ソフト", price: 19800, priceLabel: "19,800円（税込）", hardness: "硬", speed: 5, spin: 5, control: 2, styles: ["sticky", "spin"], suitableFor: "高いスイングスピードで、ブルースポンジのパワードライブを引き出したい人", source: "https://www.nittaku.com/products/rubbers/post-61", officialNote: "紅双喜製ブルースポンジ／特厚・中国ナショナルチーム使用モデル" },
  { id: "kyohyo-pro3-turbo-blue", brand: "Nittaku", name: "キョウヒョウプロ3-TURBO BLUE-", type: "裏ソフト", price: 7260, priceLabel: "7,260円（税込）", hardness: "硬", speed: 5, spin: 5, control: 2, styles: ["sticky", "spin", "counter"], suitableFor: "パワー系スイングで、粘着の強回転と破壊力を両立したい人", source: "https://www.nittaku.com/products/rubbers/post-18", officialNote: "AC内蔵日本製高弾性スポンジ／硬度50.0" },
  { id: "kyohyo-pro3-turbo-orange", brand: "Nittaku", name: "キョウヒョウプロ3-TURBO ORANGE-", type: "裏ソフト", price: 6930, priceLabel: "6,930円（税込）", hardness: "中硬", speed: 4, spin: 5, control: 3, styles: ["sticky", "spin", "control"], suitableFor: "粘着の回転と威力を保ちつつ、サービスや台上など細かなプレーも重視する人", source: "https://www.nittaku.com/products/rubbers/post-19", officialNote: "AC内蔵日本製高弾性スポンジ／硬度45.0" },
  { id: "kyohyo-pro2", brand: "Nittaku", name: "キョウヒョウ プロ2", type: "裏ソフト", price: 5500, priceLabel: "5,500円（税込）", hardness: "硬", speed: 3, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "重い回転球を中心に、粘着ドライブで得点を狙いたい人", source: "https://www.nittaku.com/products/rubbers/post-21", officialNote: "回転重視シート／キョウヒョウIIのプロ仕様" },
  { id: "kyohyo-pro3", brand: "Nittaku", name: "キョウヒョウ プロ3", type: "裏ソフト", price: 5500, priceLabel: "5,500円（税込）", hardness: "硬", speed: 4, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "粘着らしい強い回転とスピードの両方を求める人", source: "https://www.nittaku.com/products/rubbers/post-22", officialNote: "回転＋スピードタイプのシート／キョウヒョウIIIのプロ仕様" },
  { id: "nittaku-kyohyo3", brand: "Nittaku", name: "ニッタク キョウヒョウ3", type: "裏ソフト", price: 4950, priceLabel: "4,950円（税込）", hardness: "中", speed: 3, spin: 4, control: 4, styles: ["sticky", "spin", "control"], suitableFor: "粘着系を初めて使う際に、日本製スポンジの扱いやすさも求める人", source: "https://www.nittaku.com/products/rubbers/post-24", officialNote: "キョウヒョウIIIのシート＋日本製スポンジ／硬度37.5" },
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
  { id: "triple-extra", brand: "VICTAS", name: "トリプル エキストラ", type: "裏ソフト", price: 5500, priceLabel: "5,500円（税込）", hardness: "硬", country: "中国", speed: 4, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "強粘着の回転と球威を生かして、粘着ドライブを軸に組み立てる人", source: "https://www.victas.com/products/detail.html?id=54", officialNote: "中国製強粘着裏ソフト／硬度55.0±3" },
  { id: "triple-double-extra", brand: "VICTAS", name: "トリプル ダブルエキストラ", type: "裏ソフト", price: 5940, priceLabel: "5,940円（税込）", hardness: "硬", country: "中国", speed: 5, spin: 5, control: 2, styles: ["sticky", "spin", "counter"], suitableFor: "高い打球威力と強烈な粘着回転を引き出せる上級攻撃型の人", source: "https://www.victas.com/products/detail.html?id=53", officialNote: "中国製強粘着裏ソフト／硬度57.5±3" },
  { id: "triple-regular", brand: "VICTAS", name: "トリプル レギュラー", type: "裏ソフト", price: 4400, priceLabel: "4,400円（税込）", hardness: "中", country: "中国", speed: 3, spin: 5, control: 4, styles: ["sticky", "spin", "control", "beginner"], suitableFor: "中国製強粘着を初中級者向けの扱いやすさで試したい人", source: "https://www.victas.com/products/detail.html?id=55", officialNote: "中国製強粘着裏ソフト／硬度42.5±3" },
  { id: "vs401", brand: "VICTAS", name: "VS>401", type: "裏ソフト", price: 5720, priceLabel: "5,720円（税込）", hardness: "中硬", speed: 2, spin: 5, control: 5, styles: ["defense"], suitableFor: "切れたカットと守備の安定を求める人", source: "https://www.victas.com/products/?cat=3", officialNote: "裏ソフトラバー" },
  { id: "curl-p1v", brand: "VICTAS", name: "カール P1V", type: "粒高", price: 4620, priceLabel: "4,620円（税込）", hardness: "—", speed: 1, spin: 5, control: 4, styles: ["defense"], suitableFor: "粒高の切れたカットと変化を使いたい人", source: "https://www.victas.com/products/?cat=3", officialNote: "粒高ラバー" },
  { id: "curl-p3v", brand: "VICTAS", name: "カール P3V", type: "粒高", price: 4620, priceLabel: "4,620円（税込）", hardness: "—", speed: 1, spin: 4, control: 5, styles: ["defense"], suitableFor: "粒高で守備の安定性を求める人", source: "https://www.victas.com/products/?cat=3", officialNote: "粒高ラバー" },
  { id: "vo-102", brand: "VICTAS", name: "VO>102", type: "表ソフト", price: 6050, priceLabel: "6,050円（税込）", hardness: "中", speed: 5, spin: 3, control: 3, styles: ["shortPips"], suitableFor: "表ソフトで回転とミートを使い分けたい人", source: "https://www.victas.com/products/?cat=3", officialNote: "表ソフトラバー" },
  { id: "spectol-s1", brand: "VICTAS", name: "スペクトル S1", type: "表ソフト", price: 4620, priceLabel: "4,620円（税込）", hardness: "中", speed: 5, spin: 2, control: 4, styles: ["shortPips"], suitableFor: "表ソフトでの速攻とミートを重視する人", source: "https://www.victas.com/products/?cat=3", officialNote: "表ソフトラバー" },
  { id: "rakza-xx", brand: "Yasaka", name: "ラクザXX", type: "裏ソフト", price: 7920, priceLabel: "7,920円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "強烈な回転とスピードで打ち合いたい人", source: "https://www.yasakajp.com/items/rakza-xx/", officialNote: "ハイブリッドエナジー型／硬度47〜52°" },
  { id: "rakza-x", brand: "Yasaka", name: "ラクザ X", type: "裏ソフト", price: 6930, priceLabel: "6,930円（税込）", hardness: "中硬", speed: 5, spin: 4, control: 3, styles: ["counter", "spin"], suitableFor: "相手の回転に負けない前陣攻撃を求める人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "ハイブリッドエナジー型" },
  { id: "rakza-x-soft", brand: "Yasaka", name: "ラクザX ソフト", type: "裏ソフト", price: 6930, priceLabel: "6,930円（税込）", hardness: "中", speed: 4, spin: 4, control: 4, styles: ["control", "spin"], suitableFor: "ラクザXの性能を柔らかめに扱いたい人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "ハイブリッドエナジー型" },
  { id: "rakza-z", brand: "Yasaka", name: "ラクザZ", type: "裏ソフト", price: 6930, priceLabel: "6,930円（税込）", hardness: "硬", speed: 4, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "粘着性を生かした強い回転を求める人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "ハイブリッドエナジー型" },
  { id: "rakza-z-eh", brand: "Yasaka", name: "ラクザZ エクストラハード", type: "裏ソフト", price: 6930, priceLabel: "6,930円（税込）", hardness: "硬", speed: 5, spin: 5, control: 2, styles: ["sticky"], suitableFor: "硬めの粘着系でパワードライブを狙う人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "ハイブリッドエナジー型" },
  { id: "rakza-7", brand: "Yasaka", name: "ラクザ 7", type: "裏ソフト", price: 6380, priceLabel: "6,380円（税込）", hardness: "中硬", speed: 4, spin: 5, control: 4, styles: ["spin"], suitableFor: "回転量の多いドライブを安定して打ちたい人", source: "https://www.yasakajp.com/items/rakza_7/", officialNote: "ハイブリッドエナジー型／硬度45〜50°" },
  { id: "rakza-7-soft", brand: "Yasaka", name: "ラクザ 7 ソフト", type: "裏ソフト", price: 6380, priceLabel: "6,380円（税込）", hardness: "中", speed: 4, spin: 5, control: 4, styles: ["spin", "control"], suitableFor: "高回転をソフトな打球感で扱いたい人", source: "https://www.yasakajp.com/items/rakza_7_soft/", officialNote: "ハイブリッドエナジー型" },
  { id: "rakza-7-hard", brand: "Yasaka", name: "ラクザ7ハード", type: "裏ソフト", price: 6380, priceLabel: "6,380円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "ラクザ7の回転を硬めの打球感で引き出す人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "ハイブリッドエナジー型" },
  { id: "rakza-9", brand: "Yasaka", name: "ラクザ 9", type: "裏ソフト", price: 6380, priceLabel: "6,380円（税込）", hardness: "中硬", speed: 5, spin: 4, control: 3, styles: ["counter"], suitableFor: "スピードのあるドライブとカウンターを重視する人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "ハイブリッドエナジー型" },
  { id: "rigan", brand: "Yasaka", name: "ライガン", type: "裏ソフト", price: 4620, priceLabel: "4,620円（税込）", hardness: "中", speed: 3, spin: 4, control: 5, styles: ["control", "beginner"], suitableFor: "安定感を保ちながら攻撃技術を覚えたい人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "ハイブリッドエナジー型" },
  { id: "rigan-spin", brand: "Yasaka", name: "ライガンスピン", type: "裏ソフト", price: 4840, priceLabel: "4,840円（税込）", hardness: "中", speed: 3, spin: 5, control: 4, styles: ["spin", "control"], suitableFor: "扱いやすさを保って回転量を高めたい人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "ハイブリッドエナジー型" },
  { id: "shining-dragon-2", brand: "Yasaka", name: "輝龍II", type: "裏ソフト", price: 5500, priceLabel: "5,500円（税込）", hardness: "中硬", country: "中国", speed: 4, spin: 5, control: 4, styles: ["sticky", "spin", "control"], suitableFor: "粘着の回転を保ちながら、扱いやすさも重視する人", source: "https://www.yasakajp.com/items/shining-dragon2/", officialNote: "中国製テンション系粘着裏ソフト／硬度45〜50°" },
  { id: "rising-dragon-2", brand: "Yasaka", name: "翔龍II", type: "裏ソフト", price: 5500, priceLabel: "5,500円（税込）", hardness: "硬", country: "中国", speed: 5, spin: 5, control: 3, styles: ["sticky", "spin", "counter"], suitableFor: "強いスピンとパワードライブで、粘着系の威力を高めたい人", source: "https://www.yasakajp.com/items/rising-dragon2/", officialNote: "中国製テンション系粘着裏ソフト／硬度47〜52°" },
  { id: "mark-v", brand: "Yasaka", name: "マーク V", type: "裏ソフト", price: 3520, priceLabel: "3,520円（税込）", hardness: "中", speed: 3, spin: 3, control: 5, styles: ["beginner"], suitableFor: "基本打法を丁寧に身につけたい人", source: "https://www.yasakajp.com/items/markv/", officialNote: "高弾性裏ソフト" },
  { id: "original-extra", brand: "Yasaka", name: "オリジナルエクストラ", type: "裏ソフト", price: 2970, priceLabel: "2,970円（税込）", hardness: "軟", speed: 2, spin: 3, control: 5, styles: ["beginner"], suitableFor: "最初の一枚で基本技術を練習する人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "コントロール系裏ソフト" },
  { id: "anti-power", brand: "Yasaka", name: "アンチパワー", type: "アンチ", price: 3080, priceLabel: "3,080円（税込）", hardness: "—", speed: 1, spin: 1, control: 5, styles: ["defense"], suitableFor: "アンチで相手の回転を抑えて変化を出す人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "アンチスピン裏ソフト" },
  { id: "trick-anti", brand: "Yasaka", name: "トリックアンチ", type: "アンチ", price: 4400, priceLabel: "4,400円（税込）", hardness: "—", speed: 1, spin: 2, control: 4, styles: ["defense"], suitableFor: "アンチの変化と守備の組み立てを求める人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "アンチスピン裏ソフト" },
  { id: "rakza-po", brand: "Yasaka", name: "ラクザ PO", type: "表ソフト", price: 6380, priceLabel: "6,380円（税込）", hardness: "中硬", speed: 5, spin: 4, control: 3, styles: ["shortPips"], suitableFor: "表ソフトでも回転と攻撃力を両立したい人", source: "https://www.yasakajp.com/goods/osr/", officialNote: "表ソフトラバー" },
  { id: "spinate", brand: "Yasaka", name: "スピネイト", type: "表ソフト", price: 5500, priceLabel: "5,500円（税込）", hardness: "中", speed: 4, spin: 4, control: 4, styles: ["shortPips"], suitableFor: "表ソフトで回転を生かした攻撃をする人", source: "https://www.yasakajp.com/goods/osr/", officialNote: "表ソフトラバー" },
  { id: "elfrark-rf", brand: "Yasaka", name: "エルフラークRF", type: "表ソフト", price: 4400, priceLabel: "4,400円（税込）", hardness: "中", speed: 4, spin: 3, control: 4, styles: ["shortPips", "control"], suitableFor: "変化と安定を両立する表ソフトを求める人", source: "https://www.yasakajp.com/goods/osr/", officialNote: "表ソフトラバー" },
  { id: "phantom-007", brand: "Yasaka", name: "ファントム 007", type: "粒高", price: 2530, priceLabel: "2,530円（税込）", hardness: "—", speed: 1, spin: 4, control: 4, styles: ["defense"], suitableFor: "粒高カットの基礎を身につけたい人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "粒高ラバー" },
  { id: "phantom-0011", brand: "Yasaka", name: "ファントム 0011∞", type: "粒高", price: 2970, priceLabel: "2,970円（税込）", hardness: "—", speed: 1, spin: 5, control: 4, styles: ["defense"], suitableFor: "粒高で強い変化と切れを出したい人", source: "https://www.yasakajp.com/goods/rub/", officialNote: "粒高ラバー" },
  { id: "hybrid-k3", brand: "TIBHAR", name: "ハイブリッド K3", type: "裏ソフト", price: 8910, priceLabel: "8,910円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "粘着テンションの強回転と反発を求める人", source: "https://tibhar-japan.com/rubber/", officialNote: "回転系テンション／硬度53" },
  { id: "hybrid-k3-fx", brand: "TIBHAR", name: "ハイブリッド K3 FX", type: "裏ソフト", price: 8910, priceLabel: "8,910円（税込）", hardness: "中", speed: 4, spin: 5, control: 4, styles: ["sticky", "control"], suitableFor: "粘着テンションの回転を扱いやすくしたい人", source: "https://tibhar-japan.com/rubber/", officialNote: "粘着系テンション／硬度48" },
  { id: "hybrid-mk", brand: "TIBHAR", name: "ハイブリッド MK", type: "裏ソフト", price: 7920, priceLabel: "7,920円（税込）", hardness: "中硬", speed: 4, spin: 5, control: 4, styles: ["spin", "control"], suitableFor: "弧線・球持ち・威力を高い水準で求める人", source: "https://tibhar-japan.com/rubber/", officialNote: "回転系テンション／硬度48" },
  { id: "hybrid-mk-fx", brand: "TIBHAR", name: "ハイブリッド MK FX", type: "裏ソフト", price: 7920, priceLabel: "7,920円（税込）", hardness: "中", speed: 4, spin: 5, control: 5, styles: ["spin", "control"], suitableFor: "柔らかな打球感で高い回転を求める人", source: "https://tibhar-japan.com/rubber/", officialNote: "回転系テンション／硬度44" },
  { id: "evolution-mxd", brand: "TIBHAR", name: "エボリューション MX-D", type: "裏ソフト", price: 7810, priceLabel: "7,810円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "威力と安定感を両立した高性能ラバーを求める人", source: "https://tibhar-japan.com/rubber/", officialNote: "回転系テンション／硬度51.5" },
  { id: "evolution-eld", brand: "TIBHAR", name: "エボリューション EL-D", type: "裏ソフト", price: 7810, priceLabel: "7,810円（税込）", hardness: "中", speed: 4, spin: 5, control: 4, styles: ["spin", "control"], suitableFor: "高い回転性能を保ちつつ硬さを抑えたい人", source: "https://tibhar-japan.com/rubber/", officialNote: "回転系テンション／硬度46" },
  { id: "evolution-fxd", brand: "TIBHAR", name: "エボリューション FX-D", type: "裏ソフト", price: 7810, priceLabel: "7,810円（税込）", hardness: "中", speed: 4, spin: 4, control: 5, styles: ["control"], suitableFor: "威力を保ちながら扱いやすさを重視する人", source: "https://tibhar-japan.com/rubber/", officialNote: "回転系テンション／硬度44" },
  { id: "evolution-mxp", brand: "TIBHAR", name: "エボリューション MX-P", type: "裏ソフト", price: 7260, priceLabel: "7,260円（税込）", hardness: "中硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "中・上級の攻撃型で回転と飛距離を求める人", source: "https://tibhar-japan.com/rubber/", officialNote: "回転系テンション／硬度45.7〜47.7" },
  { id: "evolution-elp", brand: "TIBHAR", name: "エボリューション EL-P", type: "裏ソフト", price: 7260, priceLabel: "7,260円（税込）", hardness: "中", speed: 4, spin: 5, control: 4, styles: ["control", "spin"], suitableFor: "回転性能と使いやすさを両立したい人", source: "https://tibhar-japan.com/rubber/", officialNote: "回転系テンション／硬度42.4〜44.4" },
  { id: "rapid", brand: "TIBHAR", name: "ラピッド", type: "裏ソフト", price: 4180, priceLabel: "4,180円（税込）", hardness: "中", speed: 3, spin: 3, control: 5, styles: ["beginner", "control"], suitableFor: "高弾性ラバーで基礎と安定を両立したい人", source: "https://tibhar-japan.com/rubber/", officialNote: "高弾性／硬度42.5" },
  { id: "rapid-soft", brand: "TIBHAR", name: "ラピッドソフト", type: "裏ソフト", price: 4180, priceLabel: "4,180円（税込）", hardness: "軟", speed: 2, spin: 3, control: 5, styles: ["beginner"], suitableFor: "柔らかな感覚でコントロールを磨きたい人", source: "https://tibhar-japan.com/rubber/", officialNote: "コントロール系／硬度35" },
  { id: "speedy-soft", brand: "TIBHAR", name: "スピーディーソフト", type: "表ソフト", price: 5170, priceLabel: "5,170円（税込）", hardness: "中", speed: 4, spin: 3, control: 5, styles: ["shortPips", "control"], suitableFor: "扱いやすい表ソフトで速攻を始めたい人", source: "https://tibhar-japan.com/rubber/", officialNote: "コントロール系表ソフト／硬度45" },
  { id: "speedy-soft-dtecs", brand: "TIBHAR", name: "スピーディーソフトD.TecS", type: "表ソフト", price: 6105, priceLabel: "6,105円（税込）", hardness: "軟", speed: 5, spin: 3, control: 3, styles: ["shortPips"], suitableFor: "表ソフトのスピードと変化を強く出したい人", source: "https://tibhar-japan.com/rubber/", officialNote: "テンション表ソフト／硬度35" },
  { id: "grass-dtecs", brand: "TIBHAR", name: "グラスD.TecS", type: "粒高", price: 6655, priceLabel: "6,655円（税込）", hardness: "—", speed: 1, spin: 5, control: 4, styles: ["defense"], suitableFor: "粒高の大きな変化と攻撃力を使いたい人", source: "https://tibhar-japan.com/rubber/", officialNote: "ハイテンション粒高" },
  { id: "grass-dtecs-gs", brand: "TIBHAR", name: "グラスD.TecS GS", type: "粒高", price: 7095, priceLabel: "7,095円（税込）", hardness: "—", speed: 1, spin: 5, control: 4, styles: ["defense"], suitableFor: "接着シート付き粒高で変化を出したい人", source: "https://tibhar-japan.com/rubber/", officialNote: "ハイテンション粒高／OX" },
  { id: "omega-8-china", brand: "XIOM", name: "オメガ8 チャイナ", type: "裏ソフト", price: 9680, priceLabel: "9,680円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "中国ラバー系の強い回転と威力を求める人", source: "https://m.xiom.jp/", officialNote: "オメガシリーズ" },
  { id: "omega-8-hybrid", brand: "XIOM", name: "オメガ8 ハイブリッド", type: "裏ソフト", price: 7920, priceLabel: "7,920円（税込）", hardness: "中硬", speed: 5, spin: 5, control: 3, styles: ["sticky", "counter"], suitableFor: "ハイブリッド系で回転と反発を両立したい人", source: "https://m.xiom.jp/", officialNote: "オメガシリーズ" },
  { id: "omega-8-pro", brand: "XIOM", name: "オメガ8 プロ", type: "裏ソフト", price: 7920, priceLabel: "7,920円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "高い攻撃力で主導権を取りたい人", source: "https://m.xiom.jp/", officialNote: "オメガシリーズ" },
  { id: "omega-8-euro", brand: "XIOM", name: "オメガ8 ヨーロ", type: "裏ソフト", price: 7920, priceLabel: "7,920円（税込）", hardness: "中硬", speed: 5, spin: 4, control: 4, styles: ["counter", "control"], suitableFor: "スピードと扱いやすさを高水準で求める人", source: "https://m.xiom.jp/", officialNote: "オメガシリーズ" },
  { id: "jekyll-c575", brand: "XIOM", name: "ジキル＆ハイド C57.5", type: "裏ソフト", price: 11000, priceLabel: "11,000円（税込）", hardness: "硬", speed: 5, spin: 5, control: 2, styles: ["sticky"], suitableFor: "強いインパクトで最大限の威力を引き出す人", source: "https://m.xiom.jp/", officialNote: "ジキル＆ハイドシリーズ" },
  { id: "jekyll-z525", brand: "XIOM", name: "ジキル＆ハイド Z52.5", type: "裏ソフト", price: 11000, priceLabel: "11,000円（税込）", hardness: "硬", speed: 5, spin: 5, control: 2, styles: ["counter", "spin"], suitableFor: "高硬度で威力のある攻撃を求める人", source: "https://m.xiom.jp/", officialNote: "ジキル＆ハイドシリーズ" },
  { id: "jekyll-v475", brand: "XIOM", name: "ジキル＆ハイド V47.5", type: "裏ソフト", price: 8470, priceLabel: "8,470円（税込）", hardness: "中", speed: 4, spin: 5, control: 4, styles: ["spin", "control"], suitableFor: "高性能ラバーを扱いやすい硬さで選びたい人", source: "https://m.xiom.jp/", officialNote: "ジキル＆ハイドシリーズ" },
  { id: "vega-x", brand: "XIOM", name: "ヴェガ X", type: "裏ソフト", price: 5500, priceLabel: "5,500円（税込）", hardness: "中硬", speed: 4, spin: 4, control: 4, styles: ["spin", "counter"], suitableFor: "攻撃型テンションをバランスよく使いたい人", source: "https://m.xiom.jp/", officialNote: "ヴェガシリーズ" },
  { id: "vega-tour", brand: "XIOM", name: "ヴェガ ツアー", type: "裏ソフト", price: 6050, priceLabel: "6,050円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "硬めの打球感で回転と威力を求める人", source: "https://m.xiom.jp/", officialNote: "ヴェガシリーズ" },
  { id: "vega-pro", brand: "XIOM", name: "ヴェガ プロ", type: "裏ソフト", price: 5500, priceLabel: "5,500円（税込）", hardness: "中硬", speed: 4, spin: 5, control: 4, styles: ["spin"], suitableFor: "回転重視のドライブで攻めたい人", source: "https://m.xiom.jp/", officialNote: "ヴェガシリーズ" },
  { id: "vega-asia", brand: "XIOM", name: "ヴェガ アジア", type: "裏ソフト", price: 5280, priceLabel: "5,280円（税込）", hardness: "中硬", speed: 5, spin: 4, control: 3, styles: ["counter"], suitableFor: "直線的な攻撃とカウンターを重視する人", source: "https://m.xiom.jp/", officialNote: "ヴェガシリーズ" },
  { id: "vega-europe", brand: "XIOM", name: "ヴェガ ヨーロッパ", type: "裏ソフト", price: 5280, priceLabel: "5,280円（税込）", hardness: "中", speed: 4, spin: 4, control: 5, styles: ["control", "spin"], suitableFor: "柔らかめで回転と安定を求める人", source: "https://m.xiom.jp/", officialNote: "ヴェガシリーズ" },
  { id: "vega-japan", brand: "XIOM", name: "ヴェガ ジャパン", type: "裏ソフト", price: 5720, priceLabel: "5,720円（税込）", hardness: "中硬", speed: 5, spin: 4, control: 4, styles: ["counter", "spin"], suitableFor: "スピードと回転の両立を求める人", source: "https://m.xiom.jp/", officialNote: "ヴェガシリーズ" },
  { id: "vega-elite", brand: "XIOM", name: "ヴェガ エリート", type: "裏ソフト", price: 5280, priceLabel: "5,280円（税込）", hardness: "中", speed: 4, spin: 4, control: 5, styles: ["control"], suitableFor: "扱いやすいテンションで安定を求める人", source: "https://m.xiom.jp/", officialNote: "ヴェガシリーズ" },
  { id: "vega-intro", brand: "XIOM", name: "ヴェガ イントロ", type: "裏ソフト", price: 3850, priceLabel: "3,850円（税込）", hardness: "中", speed: 3, spin: 3, control: 5, styles: ["beginner"], suitableFor: "入門用にテンション系の感覚を学びたい人", source: "https://m.xiom.jp/", officialNote: "ヴェガシリーズ" },
  { id: "helix-platinum-m", brand: "STIGA", name: "ヘリックスプラチナ M", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "中硬", country: "ドイツ", speed: 5, spin: 5, control: 4, styles: ["spin", "counter", "control"], suitableFor: "高い弧線と回転を保ちながら、扱いやすさも重視する人", source: "https://stigasports.jp/products/5108", officialNote: "Optimized Energy Sponge／硬度47.5°" },
  { id: "helix-platinum-h", brand: "STIGA", name: "ヘリックスプラチナ H", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "硬", country: "ドイツ", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "高い弧線とスピードのバランスで攻撃したい人", source: "https://stigasports.jp/products/5106", officialNote: "Optimized Energy Sponge／硬度50°" },
  { id: "helix-platinum-xh", brand: "STIGA", name: "ヘリックスプラチナ XH", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "硬", country: "ドイツ", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "強いインパクトでパワーとコントロールの両立を狙う人", source: "https://stigasports.jp/helix", officialNote: "Optimized Energy Sponge／硬度52.5°／モーレゴード使用モデル" },
  { id: "helix-platinum-55", brand: "STIGA", name: "ヘリックスプラチナ 55", type: "裏ソフト", price: null, priceLabel: "オープン価格", hardness: "硬", country: "ドイツ", speed: 5, spin: 5, control: 2, styles: ["spin", "counter"], suitableFor: "高硬度スポンジを生かして最大級のスピードを引き出したい人", source: "https://stigasports.jp/products/5095", officialNote: "Optimized Energy Sponge／硬度55°" },
  { id: "dna-dragon-power-525", brand: "STIGA", name: "DNA ドラゴンパワー 52.5", type: "裏ソフト", price: 9350, priceLabel: "9,350円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "微粘着のグリップとパワードライブを求める人", source: "https://stigasports.jp/products/2965", officialNote: "微粘着テンション／硬度52.5°" },
  { id: "dna-dragon-power-55", brand: "STIGA", name: "DNA ドラゴンパワー 55", type: "裏ソフト", price: 9350, priceLabel: "9,350円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["sticky", "counter"], suitableFor: "硬めの微粘着で打ち合いの威力を求める人", source: "https://stigasports.jp/products/2972", officialNote: "微粘着テンション／硬度55°" },
  { id: "dna-hybrid-h", brand: "STIGA", name: "DNA ハイブリッド H", type: "裏ソフト", price: 9900, priceLabel: "9,900円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "回転系技術とスピードのバランスを高水準で求める人", source: "https://stigasports.jp/products/2358", officialNote: "ハイブリッドテンション" },
  { id: "dna-hybrid-m", brand: "STIGA", name: "DNA ハイブリッド M", type: "裏ソフト", price: 9900, priceLabel: "9,900円（税込）", hardness: "中硬", speed: 4, spin: 5, control: 4, styles: ["sticky", "control"], suitableFor: "ハイブリッドの回転を扱いやすい硬さで選びたい人", source: "https://stigasports.jp/products/2364", officialNote: "ハイブリッドテンション" },
  { id: "dna-pro-h", brand: "STIGA", name: "DNA プロ H", type: "裏ソフト", price: 7590, priceLabel: "7,590円（税込）", hardness: "硬", speed: 5, spin: 4, control: 3, styles: ["counter", "spin"], suitableFor: "ボールの重さとスピードで勝負したい人", source: "https://stigasports.jp/products/1450", officialNote: "テンション系／硬度50°" },
  { id: "dna-pro-m", brand: "STIGA", name: "DNA プロ M", type: "裏ソフト", price: 7590, priceLabel: "7,590円（税込）", hardness: "中硬", speed: 4, spin: 5, control: 4, styles: ["spin", "counter"], suitableFor: "球持ちと弾みのバランスを求める人", source: "https://stigasports.jp/products/1454", officialNote: "テンション系／硬度47.5°" },
  { id: "dna-pro-s", brand: "STIGA", name: "DNA プロ S", type: "裏ソフト", price: 7590, priceLabel: "7,590円（税込）", hardness: "中", speed: 4, spin: 4, control: 5, styles: ["control", "spin"], suitableFor: "球持ちとコントロール性能を重視する人", source: "https://stigasports.jp/products/1457", officialNote: "テンション系／硬度42.5°" },
  { id: "dna-future-m", brand: "STIGA", name: "DNA フューチャー M", type: "裏ソフト", price: 4180, priceLabel: "4,180円（税込）", hardness: "中硬", speed: 3, spin: 4, control: 5, styles: ["beginner", "control"], suitableFor: "グリップとコントロールを優先して基礎を学ぶ人", source: "https://stigasports.jp/products/1460", officialNote: "ドイツ製裏ソフト／硬度47.5°" },
  { id: "mantra-pro-m", brand: "STIGA", name: "マントラ プロ M", type: "裏ソフト", price: 5940, priceLabel: "5,940円（税込）", hardness: "中硬", speed: 4, spin: 4, control: 4, styles: ["counter", "control"], suitableFor: "弾きとコントロールをバランスよく使いたい人", source: "https://stigasports.jp/products/1474", officialNote: "日本製テンション／硬度47°" },
  { id: "mantra-pro-h", brand: "STIGA", name: "マントラ プロ H", type: "裏ソフト", price: 5940, priceLabel: "5,940円（税込）", hardness: "硬", speed: 5, spin: 4, control: 3, styles: ["counter"], suitableFor: "前陣からのスピードとコース取りを重視する人", source: "https://stigasports.jp/products/1471", officialNote: "日本製テンション／硬度50°" },
  { id: "mantra-pro-xh", brand: "STIGA", name: "マントラ プロ XH", type: "裏ソフト", price: 5940, priceLabel: "5,940円（税込）", hardness: "硬", speed: 5, spin: 4, control: 3, styles: ["counter"], suitableFor: "早い球離れで前陣攻撃をしたい人", source: "https://stigasports.jp/products/1466", officialNote: "日本製テンション／硬度53°" },
  { id: "mantra-control", brand: "STIGA", name: "マントラ コントロール", type: "裏ソフト", price: 3520, priceLabel: "3,520円（税込）", hardness: "軟", speed: 2, spin: 3, control: 5, styles: ["beginner"], suitableFor: "基本打法と回転のかけ方を身につけたい人", source: "https://stigasports.jp/products/2462", officialNote: "日本製裏ソフト" },
  { id: "symmetry", brand: "STIGA", name: "シンメトリー", type: "表ソフト", price: 4730, priceLabel: "4,730円（税込）", hardness: "中", speed: 4, spin: 3, control: 4, styles: ["shortPips", "control"], suitableFor: "表ソフトでブロックと回転系攻撃を使い分けたい人", source: "https://stigasports.jp/products/1494", officialNote: "日本製テンション系表ソフト" },
  { id: "clippa", brand: "STIGA", name: "クリッパ", type: "表ソフト", price: 3300, priceLabel: "3,300円（税込）", hardness: "中", speed: 4, spin: 3, control: 4, styles: ["shortPips"], suitableFor: "表ソフトでドライブとスマッシュを両立したい人", source: "https://stigasports.jp/products/1496", officialNote: "表ソフトラバー" },
  { id: "vertical-20", brand: "STIGA", name: "バーティカル 20", type: "粒高", price: 4290, priceLabel: "4,290円（税込）", hardness: "—", speed: 1, spin: 4, control: 5, styles: ["defense"], suitableFor: "粒高を初めて使い、抑えと攻撃を両立したい人", source: "https://stigasports.jp/products/1500", officialNote: "縦目粒高ラバー" },
  { id: "horizontal-55", brand: "STIGA", name: "ホリゾンタル 55", type: "粒高", price: 4290, priceLabel: "4,290円（税込）", hardness: "—", speed: 1, spin: 5, control: 4, styles: ["defense"], suitableFor: "横目粒高の大きな変化で惑わせたい人", source: "https://stigasports.jp/products/1512", officialNote: "横目粒高ラバー" },
  { id: "bluegrip-j1", brand: "DONIC", name: "ブルーグリップ J1", type: "裏ソフト", price: 8800, priceLabel: "8,800円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["sticky", "counter"], suitableFor: "粘着性と高速ドライブを両立したい人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL107", officialNote: "ハイブリッド系裏ソフト" },
  { id: "bluegrip-j2", brand: "DONIC", name: "ブルーグリップ J2", type: "裏ソフト", price: 8800, priceLabel: "8,800円（税込）", hardness: "中硬", speed: 5, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "回転とパワーの両方を求める人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL108", officialNote: "ハイブリッド系裏ソフト" },
  { id: "bluegrip-j3", brand: "DONIC", name: "ブルーグリップ J3", type: "裏ソフト", price: 8800, priceLabel: "8,800円（税込）", hardness: "中", speed: 4, spin: 5, control: 4, styles: ["sticky", "control"], suitableFor: "粘着系の球持ちを扱いやすく使いたい人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL109", officialNote: "ハイブリッド系裏ソフト" },
  { id: "bluestar-a1", brand: "DONIC", name: "ブルースター A1", type: "裏ソフト", price: 10450, priceLabel: "10,450円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["counter", "spin"], suitableFor: "上級攻撃型として強い球威を求める人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL101", officialNote: "裏ソフトラバー" },
  { id: "bluestar-a2", brand: "DONIC", name: "ブルースター A2", type: "裏ソフト", price: 10450, priceLabel: "10,450円（税込）", hardness: "中硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "高い回転とスピードをバランスよく求める人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL103", officialNote: "裏ソフトラバー" },
  { id: "bluestar-a3", brand: "DONIC", name: "ブルースター A3", type: "裏ソフト", price: 10450, priceLabel: "10,450円（税込）", hardness: "中", speed: 4, spin: 5, control: 4, styles: ["spin", "control"], suitableFor: "高性能ラバーを柔らかめに使いたい人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL104", officialNote: "裏ソフトラバー" },
  { id: "bluestorm-pro", brand: "DONIC", name: "ブルーストーム PRO", type: "裏ソフト", price: 9900, priceLabel: "9,900円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["counter", "spin"], suitableFor: "プロ仕様の強い反発と回転を求める人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL097", officialNote: "プロ仕様セレクトモデル" },
  { id: "bluestorm-pro-am", brand: "DONIC", name: "ブルーストーム PRO AM", type: "裏ソフト", price: 9900, priceLabel: "9,900円（税込）", hardness: "中", speed: 4, spin: 5, control: 4, styles: ["spin", "control"], suitableFor: "PRO系の性能をソフトに扱いたい人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL098", officialNote: "プロ仕様ソフトモデル" },
  { id: "bluestorm-z1", brand: "DONIC", name: "ブルーストーム Z1", type: "裏ソフト", price: 7920, priceLabel: "7,920円（税込）", hardness: "中硬", speed: 4, spin: 5, control: 3, styles: ["spin"], suitableFor: "回転を重視したドライブ型の人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL086", officialNote: "ブルーストーム Zシリーズ" },
  { id: "bluestorm-z2", brand: "DONIC", name: "ブルーストーム Z2", type: "裏ソフト", price: 7920, priceLabel: "7,920円（税込）", hardness: "中硬", speed: 5, spin: 4, control: 3, styles: ["counter"], suitableFor: "スピード主体の前陣攻撃をしたい人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL087", officialNote: "ブルーストーム Zシリーズ" },
  { id: "bluestorm-z3", brand: "DONIC", name: "ブルーストーム Z3", type: "裏ソフト", price: 7920, priceLabel: "7,920円（税込）", hardness: "中", speed: 4, spin: 4, control: 4, styles: ["control", "counter"], suitableFor: "打球感と扱いやすさを両立したい人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL088", officialNote: "ブルーストーム Zシリーズ" },
  { id: "baracuda", brand: "DONIC", name: "バラクーダ", type: "裏ソフト", price: 7590, priceLabel: "7,590円（税込）", hardness: "中", speed: 4, spin: 5, control: 4, styles: ["spin"], suitableFor: "豊富な回転量をドライブに生かしたい人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL043", officialNote: "スピン系裏ソフト" },
  { id: "baxster-f1a", brand: "DONIC", name: "バグスター F1-A", type: "表ソフト", price: 6600, priceLabel: "6,600円（税込）", hardness: "中", speed: 4, spin: 3, control: 4, styles: ["shortPips"], suitableFor: "表ソフトで球持ちとスピードを両立したい人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL020", officialNote: "表ソフトラバー" },
  { id: "piranha-cd", brand: "DONIC", name: "ピラニア CD", type: "粒高", price: 5500, priceLabel: "5,500円（税込）", hardness: "—", speed: 1, spin: 4, control: 5, styles: ["defense"], suitableFor: "守備での安定とクラシックな粒高の変化を求める人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL102", officialNote: "粒高ラバー" },
  { id: "spike-p1", brand: "DONIC", name: "スパイク P1", type: "粒高", price: 5500, priceLabel: "5,500円（税込）", hardness: "—", speed: 1, spin: 5, control: 4, styles: ["defense"], suitableFor: "粒高の変化と守備力を幅広く使いたい人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL073", officialNote: "粒高ラバー" },
  { id: "alligator-anti", brand: "DONIC", name: "アリゲーター アンチ", type: "アンチ", price: 5720, priceLabel: "5,720円（税込）", hardness: "—", speed: 1, spin: 1, control: 5, styles: ["defense"], suitableFor: "硬質アンチで相手の回転を抑えたい人", source: "https://www.donic.jp/home/catalogue.php?pg=A/AL061", officialNote: "ハードタイプアンチラバー" },
  { id: "rasanter-r45", brand: "andro", name: "ラザンター R45", type: "裏ソフト", price: 8360, priceLabel: "8,360円（税込）", hardness: "中", speed: 4, spin: 5, control: 5, styles: ["spin", "control"], suitableFor: "高い回転と安定性を扱いやすい硬度で求める人", source: "https://andro.jp/?item=rasanter-r45", officialNote: "エナジー・セル／硬度45°" },
  { id: "rasanter-r48", brand: "andro", name: "ラザンター R48", type: "裏ソフト", price: 8360, priceLabel: "8,360円（税込）", hardness: "中硬", speed: 5, spin: 5, control: 4, styles: ["spin", "counter"], suitableFor: "パワードライブと安定感を両立したい人", source: "https://andro.jp/?item=rasanter-r48", officialNote: "エナジー・セル／硬度48°" },
  { id: "rasanter-r53", brand: "andro", name: "ラザンター R53", type: "裏ソフト", price: 8360, priceLabel: "8,360円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "硬めのスポンジで最大限の加速と回転を求める人", source: "https://andro.jp/?item=rasanter-r53", officialNote: "エナジー・セル／硬度53°" },
  { id: "trinity-hugo-calderano-dynamic", brand: "JOOLA", name: "トリニティ ウーゴ カルデラノ ダイナミック", type: "裏ソフト", price: 12100, priceLabel: "12,100円（税込）", hardness: "硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "強いスイングで回転と威力を両立したい人", source: "https://joola.co.jp/collections/table-tennis-rubbers-pimples-in-rubbers", officialNote: "JOOLA公式の裏ラバーカテゴリ掲載モデル" },
  { id: "trinity-hugo-calderano-charge", brand: "JOOLA", name: "トリニティ ウーゴ カルデラノ チャージ", type: "裏ソフト", price: 12100, priceLabel: "12,100円（税込）", hardness: "中硬", speed: 5, spin: 5, control: 3, styles: ["spin", "counter"], suitableFor: "反発と回転のバランスで積極的に攻めたい人", source: "https://joola.co.jp/collections/table-tennis-rubbers-pimples-in-rubbers", officialNote: "JOOLA公式の裏ラバーカテゴリ掲載モデル" },
  { id: "golden-tango", brand: "JOOLA", name: "ゴールデン タンゴ", type: "裏ソフト", price: 7480, priceLabel: "7,480円（税込）", hardness: "中硬", speed: 4, spin: 5, control: 3, styles: ["sticky", "spin"], suitableFor: "粘着系の回転を使ってドライブを打ちたい人", source: "https://joola.co.jp/collections/table-tennis-rubbers-pimples-in-rubbers", officialNote: "JOOLA公式の裏ラバーカテゴリ掲載モデル" },
  { id: "tango-ultra", brand: "JOOLA", name: "タンゴ ウルトラ", type: "表ソフト", price: 7590, priceLabel: "7,590円（税込）", hardness: "中", speed: 4, spin: 3, control: 5, styles: ["shortPips", "control"], suitableFor: "表ソフトでブロックとミートを安定させたい人", source: "https://joola.co.jp/products/tango-ultra-table-tennis-rubber", officialNote: "スピードグルー効果内蔵テンション表ラバー" },
  { id: "express-ultra", brand: "JOOLA", name: "エクスプレス ウルトラ", type: "表ソフト", price: 7970, priceLabel: "7,970円（税込）", hardness: "中", speed: 5, spin: 3, control: 3, styles: ["shortPips"], suitableFor: "強い弾みを生かして速攻したい人", source: "https://joola.co.jp/products/express-ultra-table-tennis-rubber", officialNote: "スピード系テンション表ソフトラバー" },
  { id: "allegro-s", brand: "JOOLA", name: "アレグロ S", type: "表ソフト", price: 7150, priceLabel: "7,150円（税込）", hardness: "中", speed: 4, spin: 3, control: 4, styles: ["shortPips", "control"], suitableFor: "表ソフトで反発とコントロールを両立したい人", source: "https://joola.co.jp/collections/table-tennis-rubbers-pimples-out-rubbers", officialNote: "JOOLA公式の表ラバーカテゴリ掲載モデル" },
  { id: "adagio", brand: "JOOLA", name: "アダジオ", type: "表ソフト", price: 4807, priceLabel: "4,807円（税込）", hardness: "中", speed: 3, spin: 3, control: 5, styles: ["shortPips", "beginner"], suitableFor: "表ソフトの基本技術と安定感を身につけたい人", source: "https://joola.co.jp/collections/table-tennis-rubbers-pimples-out-rubbers", officialNote: "JOOLA公式の表ラバーカテゴリ掲載モデル" },
  { id: "scordato", brand: "JOOLA", name: "スコルダート", type: "表ソフト", price: 5693, priceLabel: "5,693円（税込）", hardness: "中", speed: 4, spin: 3, control: 4, styles: ["shortPips"], suitableFor: "表ソフトで攻撃と安定をバランスよく使いたい人", source: "https://joola.co.jp/collections/table-tennis-rubbers-pimples-out-rubbers", officialNote: "JOOLA公式の表ラバーカテゴリ掲載モデル" },
  { id: "juic-999-elite", brand: "JUIC", name: "JUIC999エリート", type: "裏ソフト", price: 4290, priceLabel: "4,290円（税込）", hardness: "中", country: "日本", speed: 3, spin: 5, control: 4, styles: ["sticky", "spin", "control"], suitableFor: "粘着系の高回転と軽量性を両立したい人", source: "https://www.juic.co.jp/view/item/000000000083", officialNote: "日本製粘着ゴムシート＋日本製スポンジ／硬度M" },
  { id: "spin-spiel", brand: "JUIC", name: "スピンスピール", type: "裏ソフト", price: 4290, priceLabel: "4,290円（税込）", hardness: "中", country: "日本", speed: 3, spin: 5, control: 5, styles: ["sticky", "spin", "control", "beginner"], suitableFor: "軽量な粘着ラバーで、回転と安定性を両立したい人", source: "https://www.juic.co.jp/view/item/000000000067", officialNote: "日本製粘着裏ソフト／硬度M" },
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
  { name: "Yasaka ラバー製品情報", url: "https://www.yasakajp.com/goods/rub/" },
  { name: "TIBHAR JAPAN ラバー製品情報", url: "https://tibhar-japan.com/rubber/" },
  { name: "XIOM 日本向け公式ストア", url: "https://m.xiom.jp/" },
  { name: "STIGA ラバー製品情報", url: "https://stigasports.jp/products_cat/rubber" },
  { name: "DONIC-JAPAN ラバーカタログ", url: "https://www.donic.jp/home/download.php?pg=Catalogue" },
  { name: "andro ラバー製品情報", url: "https://www.andro.de/ja/raha" },
  { name: "JOOLA JAPAN ラバー製品情報", url: "https://joola.co.jp/collections/table-tennis-rubbers-1" },
  { name: "JUIC 粘着ラバー製品情報", url: "https://www.juic.co.jp/view/category/ct65" },
];
