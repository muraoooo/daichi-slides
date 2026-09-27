---
name: "dads-slides"
description: "資料やURLの内容を整理・構造化してから、デジタル庁デザインシステム（DADS）に従ったPowerPoint（.pptx）スライドを作る。「DADSでスライドにして」「デジタル庁デザインシステムでパワポを作って」などで使う。"
---

# DADS 準拠スライド作成

素材（URL・ファイル・会話の内容）を読み、**先に内容を整理・構造化した構成案を作ってから**、デジタル庁デザインシステム（DADS）のルールに沿った .pptx を作るスキル。レイアウトは同梱のビルダー（末尾の付録）が DADS のトークンで描画するので、Claude は「何をどの型で見せるか」に集中する。

## 全体の流れ

1. 素材を集めて読む
2. 内容を整理・構造化し、構成案を作る（ユーザーに確認）
3. 構成案を `deck.json` に落とす
4. ビルダーで .pptx を生成する
5. 検証（はみ出し推定・ファイル検証・画像で目視）
6. 納品

---

## 手順 1：素材を集めて読む

- URL は WebFetch で取得する。取得時のプロンプトは「見出し・数値・固有名詞・推奨事項・例文をすべて、構造を保って返す」とし、要約で情報を落とさない。
- 添付ファイルは全文を読む（.pptx は `markitdown`、PDF は pdf スキル）。
- 事実・数値・固有名詞は必ず素材から取る。素材にないことは足さない。足す場合は「補足」と明記する。

## 手順 2：内容を整理・構造化する（最重要）

いきなりスライドを作らない。まず次の順で内容を組み立て、`outline.md` に構成案として書く。

### 2-1. 前提を決める

- **目的**：読んだ人に何をしてほしいか（理解・判断・行動）を 1 文で。
- **聞き手**：誰が読むか、前提知識はどれくらいか。
- **キーメッセージ**：資料全体で一番伝えたいことを 1 文で。

ユーザーの依頼から読み取れない場合は、手順 2 の最後の確認でまとめて尋ねる。

### 2-2. 情報を分解してグループにまとめる

1. 素材から「伝えるべき情報」を 1 行ずつ抜き出す（事実・数値・手順・注意点・例）。
2. 似たものをグループにまとめ、各グループに見出しを付ける。重複と漏れがないようにする。
3. グループを並べる。基本は「概要 → 詳細（重要な順、または手順の順）→ まとめ」。
4. 1 グループ = 1〜2 枚。1 枚に伝えるメッセージは 1 つ。

### 2-3. 各スライドの見せ方（型）を選ぶ

情報の性質で型を決める。迷ったら表の上から順に当てはまるものを選ぶ。

| 情報の性質 | 型（type） | 目安 |
|---|---|---|
| 資料の表紙 | `title` | 1 枚目 |
| 章の区切り | `section` | 10 枚を超える資料で章ごとに |
| 押さえるべき数値 2〜4 個 | `stats` | 数値は短く（「30%」「128K」など） |
| 並列の項目 2〜4 個 | `cards` | 4 個なら 2×2 |
| 順番のある手順 3〜5 個 | `steps` | 各項目 60 字以内 |
| 2 つの話題・対比、コード例つき | `twoColumn` | 例文・コードは `code` に |
| 優先順位のある 2〜4 項目＋補足 | `numbered` | 右に強調カード（`side`）を置ける |
| 行と列で比べるデータ | `table` | 6 行・4 列まで。カードより表が適切な比較はこちら |
| 最後のまとめ・チェックリスト | `summary` | 3〜8 項目 |

### 2-4. 文章のルール

- **見出しは結論を書く**（「Effort について」ではなく「まず medium から始め、複数レベルを比較する」）。最大 30 字程度で 1 行に収める。
- 箇条書きは 1 枚あたり 5 項目まで、1 項目 40 字程度まで。体言止めか「〜する」で揃える。
- 1 枚に載らない量は、削るか 2 枚に分ける。文字を小さくして詰めない（DADS の最小サイズは 14px 相当）。
- 専門用語・英語の固有名詞（API のパラメータ名など）は素材の表記のまま残す。
- 色だけで意味を伝えない。強調したい項目は「【デフォルト】」のように文字でも示す。
- 出典は表紙または最後のスライドに書く。

### 2-5. 構成案を確認する

`outline.md` を次の形式で書き、ユーザーが対応できる状況なら要点（枚数・各スライドの見出しと型）を示して、AskUserQuestion などの質問ツール（なければ返信）で「この構成で作成してよいか」を確認する。ユーザーが不在（スケジュール実行など）の場合は、置いた前提を明記して先に進む。

```markdown
# 構成案：<資料名>
- 目的：…
- 聞き手：…
- キーメッセージ：…

| # | 型 | ショルダー | 見出し（結論） | 載せる内容 |
|---|---|---|---|---|
| 1 | title | … | … | … |
| 2 | stats | 概要 | … | 数値3つ：… |
```

## 手順 3：`deck.json` を書く

構成案をそのまま JSON にする。共通フィールドと型ごとのフィールドは次のとおり。

```jsonc
{
  "title": "資料名（フッターにも使う）",
  "footer": "任意。省略時は title",
  "slides": [
    // 表紙・章扉・まとめは濃色（Blue-900）背景
    {"type": "title", "shoulder": "上に小さく出す分類", "title": "タイトル\n2行まで", "subtitle": "…", "source": "出典：…"},
    {"type": "section", "shoulder": "第 2 部", "heading": "章タイトル", "lead": "…"},
    {"type": "summary", "shoulder": "まとめ", "heading": "…", "items": ["…"], "source": "出典：…"},

    // 本文スライド共通： shoulder（任意）, heading（必須）, lead（任意・1行）,
    //   callout {icon?, text}（任意・上部の強調ボックス）, note（任意・下部の注記）, notes（任意・発表者ノート）
    {"type": "stats", "heading": "…", "items": [{"icon": "MdSpeed", "value": "30%", "label": "…", "desc": "…"}]},
    {"type": "cards", "heading": "…", "items": [{"icon": "MdCode", "title": "…", "body": "任意", "bullets": ["…"], "emphasis": false}]},
    {"type": "steps", "heading": "…", "items": [{"title": "…", "desc": "…"}]},
    {"type": "twoColumn", "heading": "…", "columns": [{"icon": "MdSearch", "title": "…", "body": "任意", "bullets": ["…"], "code": "任意", "codeLabel": "例"}]},
    {"type": "numbered", "heading": "…", "items": [{"title": "…", "desc": "任意"}], "side": {"title": "…", "bullets": ["…"]}},
    {"type": "table", "heading": "…", "columns": ["項目", "A", "B"], "rows": [["…", "…", "…"]], "colW": [384, 384, 384], "alignRight": [2]}
  ]
}
```

- `icon` は Material Design アイコン（`react-icons/md` の名前。例：MdCode, MdWork, MdForum, MdVisibility, MdSpeed, MdTune, MdSearch, MdSchedule, MdSmartToy, MdLock, MdInfo, MdWarning, MdCheckCircle, MdImage, MdPalette, MdContentPaste, MdBiotech, MdPsychology, MdDescription, MdGroups, MdTrendingUp, MdSettings）。アイコンは必ず見出しの文字と組み合わせて使う（アイコン単体で意味を持たせない）。
- `colW` と数値は CSS px（本文幅は 1152px）。`alignRight` は右寄せにする列番号（数値・日付の列）。
- `\n` で改行できる。

## 手順 4：ビルドする

1. 付録の `build_deck.js` を作業ディレクトリに書き出す（中身を変えずにそのまま）。
2. 依存を確認：`node -e "require('pptxgenjs');require('react-icons/md');require('sharp');require('react-dom/server')"`。失敗したら `npm install pptxgenjs react-icons react react-dom sharp`。
3. 実行：`node build_deck.js deck.json <資料名>.pptx`
4. 「⚠ はみ出しの可能性」が出たら、**レイアウトではなく deck.json の文章を短くする／スライドを分ける**。警告がなくなるまで繰り返す。

新しい型が本当に必要なときだけ、ビルダーに型を追加する。その場合も下の「DADS ルール」を守る。

## 手順 5：検証する

`anthropic-skills:pptx` スキル（または pptx スキル）があれば、その `scripts/office/validate.py` と `scripts/office/soffice.py` を使う。どちらもなければ、1. のファイル検証は省き、2. の画像化は LibreOffice の `soffice` を直接使う。

1. ファイル検証：`python <pptxスキル>/scripts/office/validate.py <資料名>.pptx`
2. 画像化：`python <pptxスキル>/scripts/office/soffice.py --headless --convert-to pdf <資料名>.pptx` → `pdftoppm -jpeg -r 60 <資料名>.pdf s`。複数枚を 1 枚のグリッド画像にまとめて Read で確認する。
3. 確認に使う環境に Noto Sans JP が無い場合は、fontconfig で Noto Sans CJK JP に置き換えて描画する（~/.config/fontconfig/fonts.conf に `<alias binding="same"><family>Noto Sans JP</family><prefer><family>Noto Sans CJK JP</family></prefer></alias>` を追加して `fc-cache -f`）。
4. 目で見る観点：文字のはみ出し・重なり／見出しが 1 行に収まっているか／カード内の余白の偏り／内容の誤り・抜け（`markitdown` で文字だけ取り出して素材と照合）。
5. 直したら、該当スライドだけ再度画像化して確認し、終える。

## 手順 6：納品

- 完成した .pptx は、ユーザーが受け取れる場所に置いて渡す（claude.ai では `/mnt/user-data/outputs/` に置き、ファイルを渡すツールがあればそれで渡す。ユーザーのフォルダーが接続されていればそこにも保存）。
- 返信では 1〜2 文で内容を伝え、次の注意を添える：「フォントは DADS 指定の Noto Sans JP / Noto Sans Mono。お使いの PC に無い場合は Google Fonts から無料で入れると意図どおり表示されます」。

---

## DADS ルール（ビルダーに実装済み。型を追加するときもこれに従う）

出典：デジタル庁デザインシステムウェブサイト https://design.digital.go.jp/dads/ （foundations: color / typography / spacing / corner-shapes / elevation / icon / layout、components: card / heading / table / divider / notice-block / chip-label）
この節は、デジタル庁デザインシステムウェブサイトのコンテンツを加工して作成したもので、デジタル庁の公式な資料ではない。

### 座標と単位
- スライドは 16:9 ワイド（13.333in × 7.5in）= **1280 × 720 CSS px**（96dpi）として扱う。
- 余白は 8px の倍数（8 / 16 / 24 / 32 / 48 / 64）。左右マージン 64px、本文幅 1152px、カラム間のガター 32px（カード行間 24px）。
- 文字サイズ：**pt = CSS px × 0.75**。

### タイポグラフィ
- 書体：本文・見出し **Noto Sans JP**、コード **Noto Sans Mono**。
- 使うテキストスタイル（DADS トークン → pt）：
  - 表紙タイトル Std-45B-140 → 33.75pt
  - スライド見出し Std-36B-140 → 27pt
  - 数値の強調 Dsp-48B-140 → 36pt
  - カード見出し Std-20B-150 → 15pt
  - 本文 Std-16N-150〜170 → 12pt（行間 1.5 以上）
  - ショルダー・ラベル Oln-16B-100 → 12pt
  - 注記・フッター Dns-14N-130 → 10.5pt（補足情報にだけ使う）
  - コード Mono-14N-150 → 10.5pt
- **14px（10.5pt）未満は使わない**。本文は 16px（12pt）以上。
- 日本語にイタリックは使わない。空白文字や両端揃えで位置を合わせない。

### カラー（キーカラー：Blue、共通カラー：Solid Gray）
| 用途 | トークン | HEX |
|---|---|---|
| プライマリー（見出しのショルダー・数値・濃色背景・番号バッジ） | Blue-900 | 0017C1 |
| セカンダリー | Blue-1200 | 000060 |
| 濃色背景上の補足文字 | Blue-100 | D9E6FF |
| 強調カード・アイコン背景 | Blue-50 | E8F1FE |
| 見出し文字 | Gray-900 | 1A1A1A |
| 本文文字 | Gray-800 | 333333 |
| 補足文字（白・Gray-50 上でも 4.5:1 以上） | Gray-600 | 666666 |
| カードの外周・区切り線（白に対して 3:1） | Gray-420 | 949494 |
| コード背景・表ヘッダー背景 | Gray-50 | F2F2F2 |

- 文字と背景のコントラスト比は **4.5:1 以上**、枠線・アイコンなど文字以外は **3:1 以上**。Gray-420 より明るいグレーを枠線に使わない（例：Gray-300 は 2.1:1 で不可）。
- HEX 値は DADS 公開のプリミティブカラーの値。資料（Markdown 版）には色見本の画像しかないため、厳密に合わせる必要があるときは Figma のデザインデータで確認する。
- 色だけで情報を区別しない（文字・アイコン・位置でも示す）。アクセントカラーは多用しない。

### コンポーネント
- **カード**：必ず背景色と外周（外側の背景に対して 3:1 以上）をもつ。影だけで境界を表さない。角丸はスモール（8px）。通常＝白背景＋Gray-420 外周、強調＝Blue-50 背景＋Blue-900 外周。
- **見出し**：ショルダー（分類名、Blue-900）＋見出しテキスト（Gray-900）＋任意のリード文。見出しの大きさはスライド内で一貫させる。
- **アイコン**：Material 系アイコンを見出しの左（フロントアイコン）に置き、必ずラベルと組み合わせる。色は背景に対して 4.5:1 以上（Blue-900 on Blue-50）。
- **テーブル**：ヘッダーセルは太字で、データセルとの間を黒いボーダーで区切る。上寄せ。通常は左寄せ、数値・日付は右寄せ。セルは結合しない。
- **ディバイダー**：Gray-420。前後に 16px 以上の余白をとり、余白だけでも区切りが分かる構成にする。
- **注釈ブロックの考え方**：強調ボックス（callout）は補足・注意の提示にだけ使い、単なる装飾には使わない。

---

## 付録：build_deck.js（そのまま書き出して使う）

```javascript
// DADS 準拠スライドビルダー: node build_deck.js deck.json out.pptx
// 座標は CSS px（1280×720 = LAYOUT_WIDE @96dpi）。8px グリッド。文字は px×0.75=pt。
const fs = require('fs');
const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const md = require('react-icons/md');

const px = (n) => n / 96;
const pt = (n) => n * 0.75;
const C = {
  b900: '0017C1', b1200: '000060', b100: 'D9E6FF', b50: 'E8F1FE',
  g900: '1A1A1A', g800: '333333', g600: '666666', g420: '949494', g50: 'F2F2F2',
  white: 'FFFFFF', black: '000000',
};
const F = 'Noto Sans JP', MONO = 'Noto Sans Mono';
const TS = {
  dsp48B: { fontSize: pt(48), bold: true, lineSpacingMultiple: 1.4 },
  std45B: { fontSize: pt(45), bold: true, lineSpacingMultiple: 1.4 },
  std36B: { fontSize: pt(36), bold: true, lineSpacingMultiple: 1.4 },
  std20B: { fontSize: pt(20), bold: true, lineSpacingMultiple: 1.5 },
  std20N: { fontSize: pt(20), bold: false, lineSpacingMultiple: 1.5 },
  std16B: { fontSize: pt(16), bold: true, lineSpacingMultiple: 1.5 },
  std16N: { fontSize: pt(16), bold: false, lineSpacingMultiple: 1.5 },
  dns14N: { fontSize: pt(14), bold: false, lineSpacingMultiple: 1.3 },
  oln16B: { fontSize: pt(16), bold: true },
  mono14N: { fontSize: pt(14), bold: false, lineSpacingMultiple: 1.5 },
};

// ---- はみ出し推定（全角=1em、半角=0.55em）----
const warnings = [];
function estLines(str, style, wPx) {
  const em = style.fontSize / 0.75;
  return String(str).split('\n').reduce((n, line) => {
    let w = 0;
    for (const ch of line) w += /[\u0000-ÿ]/.test(ch) ? em * 0.55 : em;
    return n + Math.max(1, Math.ceil(w / wPx));
  }, 0);
}
function estHeight(str, style, wPx) {
  return estLines(str, style, wPx) * (style.fontSize / 0.75) * (style.lineSpacingMultiple || 1.2);
}
function check(ctx, str, style, w, h) {
  const need = estHeight(str, style, w);
  if (need > h + 2) warnings.push(`[${ctx}] 推定 ${Math.round(need)}px > 枠 ${h}px：「${String(str).slice(0, 24)}…」を短くする`);
}

async function iconData(name, color) {
  const Comp = md[name] || md.MdCircle;
  if (!md[name]) warnings.push(`アイコン ${name} が見つからないため MdCircle を使用`);
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: '#' + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

async function main() {
  const [, , inPath, outPath] = process.argv;
  const deck = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = deck.title || '';
  const total = deck.slides.length;
  const footerText = deck.footer || deck.title || '';
  const iconCache = {};
  const getIcon = async (n, c = C.b900) => (iconCache[n + c] ||= await iconData(n, c));

  const text = (s, t, x, y, w, h, style, o = {}) => {
    s.addText(t, { x: px(x), y: px(y), w: px(w), h: px(h), fontFace: F, color: C.g800, margin: 0, valign: 'top', isTextBox: true, ...style, ...o });
  };
  const card = (s, x, y, w, h, variant = 'default') => {
    const v = variant === 'emphasis' ? { fill: C.b50, line: C.b900 } : { fill: C.white, line: C.g420 };
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px(x), y: px(y), w: px(w), h: px(h), rectRadius: px(8), fill: { color: v.fill }, line: { color: v.line, width: 1 } });
  };
  const frontIcon = async (s, name, x, y, d = 40) => {
    s.addShape(pres.shapes.OVAL, { x: px(x), y: px(y), w: px(d), h: px(d), fill: { color: C.b50 }, line: { color: C.b50 } });
    const p = d * 0.2;
    s.addImage({ data: await getIcon(name), x: px(x + p), y: px(y + p), w: px(d - 2 * p), h: px(d - 2 * p), altText: '' });
  };
  const badge = (s, n, x, y, d = 32) => {
    s.addShape(pres.shapes.OVAL, { x: px(x), y: px(y), w: px(d), h: px(d), fill: { color: C.b900 }, line: { color: C.b900 } });
    text(s, String(n), x, y, d, d, TS.oln16B, { color: C.white, align: 'center', valign: 'middle' });
  };
  const bullets = (s, ctx, items, x, y, w, h, color = C.g800) => {
    const joined = items.join('\n');
    check(ctx, joined, TS.std16N, w - 20, h - items.length * 8);
    s.addText(items.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < items.length - 1, paraSpaceAfter: 6 } })),
      { x: px(x), y: px(y), w: px(w), h: px(h), fontFace: F, color, margin: 0, valign: 'top', isTextBox: true, ...TS.std16N });
  };
  const para = (s, ctx, t, x, y, w, h, style = TS.std16N, o = {}) => { check(ctx, t, style, w, h); text(s, t, x, y, w, h, style, o); };
  const codeBox = (s, ctx, code, x, y, w, h) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px(x), y: px(y), w: px(w), h: px(h), rectRadius: px(8), fill: { color: C.g50 }, line: { color: C.g420, width: 1 } });
    check(ctx + ' code', code, TS.mono14N, w - 32, h - 24);
    text(s, code, x + 16, y + 12, w - 32, h - 24, TS.mono14N, { fontFace: MONO, color: C.g900, valign: 'middle' });
  };
  const header = (s, ctx, d) => {
    if (d.shoulder) text(s, d.shoulder, 64, 40, 1152, 24, TS.oln16B, { color: C.b900, valign: 'middle' });
    check(ctx + ' 見出し', d.heading, TS.std36B, 1152, 56);
    text(s, d.heading, 64, 72, 1152, 56, TS.std36B, { color: C.g900, valign: 'middle' });
    if (d.lead) para(s, ctx + ' リード', d.lead, 64, 136, 1152, 32, TS.std16N, { valign: 'middle' });
  };
  const footer = (s, n) => {
    s.addShape(pres.shapes.LINE, { x: px(64), y: px(664), w: px(1152), h: 0, line: { color: C.g420, width: 0.75 } });
    text(s, footerText, 64, 672, 900, 24, TS.dns14N, { color: C.g600, valign: 'middle' });
    text(s, `${n} / ${total}`, 1016, 672, 200, 24, TS.dns14N, { color: C.g600, align: 'right', valign: 'middle' });
  };
  // 本文エリア（リード・コールアウト・注記に応じて伸縮）
  const area = async (s, ctx, d) => {
    let top = d.lead ? 192 : 152, bottom = d.note ? 600 : 648;
    if (d.callout) {
      card(s, 64, top, 1152, 80, 'emphasis');
      await frontIcon(s, d.callout.icon || 'MdInfo', 88, top + 20);
      para(s, ctx + ' コールアウト', d.callout.text, 144, top + 8, 1048, 64, TS.std16N, { valign: 'middle', color: C.g900 });
      top += 104;
    }
    if (d.note) para(s, ctx + ' 注記', d.note, 64, 608, 1152, 48, TS.dns14N, { color: C.g600 });
    return { x: 64, y: top, w: 1152, h: bottom - top };
  };
  const cols = (n, gap = 32) => { const w = (1152 - gap * (n - 1)) / n; return Array.from({ length: n }, (_, i) => ({ x: 64 + i * (w + gap), w })); };

  const L = {
    async title(s, d) {
      s.background = { color: C.b900 };
      if (d.shoulder) text(s, d.shoulder, 96, 200, 1088, 24, TS.oln16B, { color: C.white });
      check('表紙タイトル', d.title, TS.std45B, 1088, 136);
      text(s, d.title, 96, 240, 1088, 136, TS.std45B, { color: C.white });
      if (d.subtitle) text(s, d.subtitle, 96, 400, 1088, 64, TS.std20N, { color: C.white });
      if (d.source) text(s, d.source, 96, 600, 1088, 48, TS.dns14N, { color: C.b100 });
    },
    async section(s, d) {
      s.background = { color: C.b900 };
      if (d.shoulder) text(s, d.shoulder, 96, 272, 1088, 24, TS.oln16B, { color: C.white });
      text(s, d.heading, 96, 304, 1088, 64, TS.std36B, { color: C.white, valign: 'middle' });
      if (d.lead) text(s, d.lead, 96, 384, 1088, 64, TS.std20N, { color: C.white });
    },
    async stats(s, d, a, ctx) {
      const cs = cols(d.items.length);
      for (const [i, it] of d.items.entries()) {
        const { x, w } = cs[i];
        card(s, x, a.y, w, a.h);
        let y = a.y + 32;
        if (it.icon) { await frontIcon(s, it.icon, x + 32, y); y += 64; }
        check(`${ctx} 数値${i + 1}`, it.value, TS.dsp48B, w - 64, 88);
        text(s, it.value, x + 32, y, w - 64, 88, TS.dsp48B, { color: C.b900, valign: 'middle' }); y += 104;
        para(s, `${ctx} 数値${i + 1}ラベル`, it.label, x + 32, y, w - 64, 32, TS.std20B, { color: C.g900 }); y += 48;
        if (it.desc) para(s, `${ctx} 数値${i + 1}説明`, it.desc, x + 32, y, w - 64, a.y + a.h - 24 - y);
      }
    },
    async cards(s, d, a, ctx) {
      const n = d.items.length, grid = n === 4;
      const cs = cols(grid ? 2 : n);
      const rows = grid ? 2 : 1, ch = (a.h - 24 * (rows - 1)) / rows;
      for (const [i, it] of d.items.entries()) {
        const { x, w } = cs[grid ? i % 2 : i];
        const y = a.y + (grid ? Math.floor(i / 2) : 0) * (ch + 24);
        card(s, x, y, w, ch, it.emphasis ? 'emphasis' : 'default');
        let tx = x + 24;
        if (it.icon) { await frontIcon(s, it.icon, x + 24, y + 24); tx = x + 80; }
        para(s, `${ctx} カード${i + 1}見出し`, it.title, tx, y + 24, x + w - 24 - tx, 40, TS.std20B, { color: C.g900, valign: 'middle' });
        let by = y + 80;
        if (it.body) { const h = estHeight(it.body, TS.std16N, w - 48) + 8; para(s, `${ctx} カード${i + 1}本文`, it.body, x + 24, by, w - 48, Math.min(h, y + ch - 24 - by)); by += h + 8; }
        if (it.bullets) bullets(s, `${ctx} カード${i + 1}`, it.bullets, x + 24, by, w - 48, y + ch - 24 - by);
      }
    },
    async steps(s, d, a, ctx) {
      const cs = cols(d.items.length);
      for (const [i, it] of d.items.entries()) {
        const { x, w } = cs[i];
        card(s, x, a.y, w, a.h);
        badge(s, i + 1, x + 24, a.y + 24);
        const th = estHeight(it.title, TS.std20B, w - 48) > 32 ? 64 : 32;
        para(s, `${ctx} 手順${i + 1}見出し`, it.title, x + 24, a.y + 72, w - 48, th, TS.std20B, { color: C.g900 });
        para(s, `${ctx} 手順${i + 1}本文`, it.desc, x + 24, a.y + 72 + th + 16, w - 48, a.h - 72 - th - 40);
      }
    },
    async twoColumn(s, d, a, ctx) {
      const cs = cols(2);
      for (const [i, c] of d.columns.entries()) {
        const { x, w } = cs[i];
        card(s, x, a.y, w, a.h, c.emphasis ? 'emphasis' : 'default');
        let tx = x + 24;
        if (c.icon) { await frontIcon(s, c.icon, x + 24, a.y + 24); tx = x + 80; }
        para(s, `${ctx} 列${i + 1}見出し`, c.title, tx, a.y + 24, x + w - 24 - tx, 40, TS.std20B, { color: C.g900, valign: 'middle' });
        const codeH = c.code ? Math.max(80, Math.ceil(estHeight(c.code, TS.mono14N, w - 80) + 24)) : 0;
        const bottom = a.y + a.h - 24 - (c.code ? codeH + 40 : 0);
        let by = a.y + 80;
        if (c.body) { const h = estHeight(c.body, TS.std16N, w - 48) + 8; para(s, `${ctx} 列${i + 1}本文`, c.body, x + 24, by, w - 48, Math.min(h, bottom - by)); by += h + 8; }
        if (c.bullets) bullets(s, `${ctx} 列${i + 1}`, c.bullets, x + 24, by, w - 48, bottom - by);
        if (c.code) {
          text(s, c.codeLabel || '例', x + 24, a.y + a.h - 24 - codeH - 32, w - 48, 24, TS.std16B, { color: C.g900, valign: 'middle' });
          codeBox(s, `${ctx} 列${i + 1}`, c.code, x + 24, a.y + a.h - 24 - codeH, w - 48, codeH);
        }
      }
    },
    async numbered(s, d, a, ctx) {
      // 左：番号付きリスト、右（任意）：強調カード
      const hasSide = !!d.side;
      const lw = hasSide ? 560 : 1152;
      let y = a.y;
      for (const [i, it] of d.items.entries()) {
        badge(s, i + 1, 64, y);
        para(s, `${ctx} 項目${i + 1}`, it.title, 112, y, lw - 48, 32, TS.std16B, { color: C.g900, valign: 'middle' });
        const h = it.desc ? Math.ceil(estHeight(it.desc, TS.std16N, lw - 48)) : 0;
        if (it.desc) text(s, it.desc, 112, y + 32, lw - 48, h, TS.std16N);
        y += 32 + h + 24;
      }
      if (y - 24 > a.y + a.h) warnings.push(`[${ctx}] 番号付きリストが本文エリアを超過`);
      if (hasSide) {
        card(s, 656, a.y, 560, a.h, 'emphasis');
        para(s, `${ctx} 右カード見出し`, d.side.title, 688, a.y + 24, 496, 32, TS.std20B, { color: C.g900 });
        if (d.side.bullets) bullets(s, `${ctx} 右カード`, d.side.bullets, 688, a.y + 72, 496, a.h - 96);
        else if (d.side.body) para(s, `${ctx} 右カード本文`, d.side.body, 688, a.y + 72, 496, a.h - 96);
      }
    },
    async table(s, d, a, ctx) {
      // DADS テーブル：ヘッダーは太字＋黒ボーダーで区切る／上寄せ／左寄せ（数値は右寄せ）／結合しない
      const right = d.alignRight || [];
      const cell = (t, ci, head) => ({
        text: String(t),
        options: {
          bold: head, color: head ? C.g900 : C.g800, fill: { color: head ? C.g50 : C.white },
          align: right.includes(ci) ? 'right' : 'left', valign: 'top', fontFace: F, fontSize: pt(16),
          margin: [px(12) * 72, px(16) * 72, px(12) * 72, px(16) * 72],
          border: head ? [{ type: 'none' }, { type: 'none' }, { pt: 1.5, color: C.black }, { type: 'none' }]
                       : [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: C.g420 }, { type: 'none' }],
        },
      });
      const rows = [d.columns.map((t, ci) => cell(t, ci, true)), ...d.rows.map((r) => r.map((t, ci) => cell(t, ci, false)))];
      s.addTable(rows, { x: px(a.x), y: px(a.y), w: px(a.w), colW: d.colW ? d.colW.map(px) : undefined, autoPage: false });
      const rowH = 48;
      if ((d.rows.length + 1) * rowH > a.h) warnings.push(`[${ctx}] 行数が多く本文エリアを超える可能性（${d.rows.length} 行）`);
    },
    async summary(s, d) {
      s.background = { color: C.b900 };
      if (d.shoulder) text(s, d.shoulder, 64, 40, 1152, 24, TS.oln16B, { color: C.white, valign: 'middle' });
      text(s, d.heading, 64, 72, 1152, 56, TS.std36B, { color: C.white, valign: 'middle' });
      const two = d.items.length > 4, rows = Math.ceil(d.items.length / (two ? 2 : 1));
      const rh = Math.min(104, Math.floor(432 / rows));
      for (const [i, t] of d.items.entries()) {
        const x = two ? 64 + (i % 2) * 592 : 64, y = 168 + (two ? Math.floor(i / 2) : i) * rh, w = two ? 512 : 1104;
        s.addShape(pres.shapes.OVAL, { x: px(x), y: px(y), w: px(32), h: px(32), fill: { color: C.white }, line: { color: C.white } });
        s.addImage({ data: await getIcon('MdCheck'), x: px(x + 6), y: px(y + 6), w: px(20), h: px(20), altText: '' });
        check(`まとめ ${i + 1}`, t, TS.std16N, w, rh - 16);
        text(s, t, x + 48, y + 2, w, rh - 16, TS.std16N, { color: C.white });
      }
      if (d.source) text(s, d.source, 64, 624, 1152, 24, TS.dns14N, { color: C.b100, valign: 'middle' });
    },
  };

  for (const [i, d] of deck.slides.entries()) {
    const s = pres.addSlide();
    s.background = { color: C.white };
    const ctx = `スライド${i + 1}(${d.type})`;
    if (!L[d.type]) throw new Error(`未知の type: ${d.type}`);
    if (['title', 'section', 'summary'].includes(d.type)) await L[d.type](s, d, null, ctx);
    else {
      header(s, ctx, d);
      const a = await area(s, ctx, d);
      await L[d.type](s, d, a, ctx);
      footer(s, i + 1);
    }
    if (d.notes) s.addNotes(d.notes);
  }
  await pres.writeFile({ fileName: outPath });
  console.log(`書き出し完了: ${outPath}（${total} 枚）`);
  if (warnings.length) { console.log('\n⚠ はみ出しの可能性:'); warnings.forEach((w) => console.log(' - ' + w)); }
  else console.log('はみ出し推定: 問題なし');
}
main().catch((e) => { console.error(e); process.exit(1); });
```