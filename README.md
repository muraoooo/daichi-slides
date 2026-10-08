# daichi-slides

ダイチ｜AIレスキュー隊の6色で、資料・URL・会話を編集可能なPowerPointへまとめる非公式ブランド版スキルです。元の [dads-slides](https://github.com/seiji1097g-cell/dads-slides) の9型とDADS由来の余白を活かし、配色と文字サイズを改変しています。デジタル庁や元作者の公式版ではありません。

![ダイチブランド版の9型](sample.png)

## 使い方

Codexで `$daichi-slides` を指定して頼みます。

- 「このPDFをダイチ配色で5枚のスライドにして」
- 「今の会話を初心者向けのスライド8枚にして」
- 「この資料をピンクの強調、PDFで納品して」

ユーザー指定の形式・総枚数・色・順番を優先します。表紙や全9型を強制しません。通常は構成案で承認待ちせず、生成・検証まで進めて完成PPTXを提示します。事前確認を明示された場合はその指定に従います。

## 配色

| 役割 | 色 |
|---|---|
| 白い背景・カード | `#FFFFFF` |
| ソフト背景 | `#F7F9FA` |
| 主アクセントのピンク | `#D98FA3` |
| 補助アクセントのブルー | `#7FD6D0` |
| 見出し・意味のある輪郭 | `#1F3552` |
| 本文・出典 | `#111111` |

白系背景を土台に、ピンクは強調の面や飾り、ブルーは手順番号やアイコンの面に使います。文字はネイビーまたは黒。ピンク・ブルーの文字を白地に置かず、その面に白文字を置きません。標準の文字／背景の最小比率は4.98:1です。

## 9種類の型

| 型 | 使用場面 |
|---|---|
| `title` | 白い表紙 |
| `section` | ソフト背景の章扉 |
| `stats` | 数値2〜4個 |
| `cards` | 並列項目2〜4個、4個は2×2 |
| `steps` | 順番のある手順3〜5個 |
| `twoColumn` | 2列の対比、コード・例文 |
| `numbered` | 番号付き項目と補足 |
| `table` | 編集可能な比較表 |
| `summary` | ソフト背景のまとめ、3〜8項目 |

初期サイズは表紙42pt、見出し30pt、本文21pt、補足15pt。フォントはNoto Sans JP / Noto Sans Monoを基本とし、利用環境の実在フォントへ変更できます。

## 表と4カードの文字量

表の目安は本文6行・4列ですが、各セルの折返し込みで判定します。補足欄・注記・リードなしの短い1行セルなら、見出しを含め7行×64pxで収まります。4等分の列へ23字程度の日本語を各セルに入れる6行表は拒否します。列幅は合計1152pxで指定します。

4カード＋補足欄＋注記（リードなし）では、21ptを保ち、カードの内余白12px・項目間6pxで配置します。各カードに短い1行見出し・1行body・1行箇条書き1件が目安です。折返しやリード追加で収まらなければ生成前に停止します。bodyと箇条書きを統合するか、詳細をノートへ移します。

実例は `examples/table-six-short.json` と `examples/cards-four-callout-note.json`、拒否例は `examples/table-six-wrapped.json`。どの文字量でも収まる保証ではなく、実表示の確認を続けます。

## 実行と依存

Node.js 20.9以降とnpmが必要です。PPTX生成はPptxGenJS、アイコン生成はreact-icons・React・react-dom・sharp、内部参照整理はJSZipを使います。バージョンは `package-lock.json` に固定しています。画像処理の間接依存 `image-size` は2.0.4へ固定。共有プロジェクトへ依存を入れず、この専用コピーまたは別の制作フォルダーで実行してください。

```sh
npm ci
node --check scripts/build_deck.js
node scripts/build_deck.js examples/demo.json demo.pptx
```

表・カードはセルや本文の折返し、余白、利用可能な高さを検査します。収まらない場合は終了コード2で生成前に停止し、PPTX出力先を更新しません。他の推定警告や不明アイコンでは終了コード2でレビュー用の未確定PPTXを残します。どちらも納品用として扱いません。推定だけで納品せず、画像化して確認します。デモ入力は実描画を確認したNoto Sans CJK JP / Menloを指定しています。標準フォントを使う場合は入力の `fontFace` / `fontMono` を変更します。

LibreOffice・pdftoppmがあれば画像化できます。環境の描画フォントが不足する場合は [ローカル描画の手順](references/local-rendering.md) を参照してください。

## ローカル導入

Codexの `~/.codex/skills/daichi-slides/` に `SKILL.md`、`LICENSE`、`scripts/`、`references/`、`agents/`、`package.json`、`package-lock.json` を配置します。この作業でローカル導入済みです。今開いている別チャットがスキル一覧を更新しない場合は新しいチャットで `$daichi-slides` を指定するか、このSKILL.mdのパスを渡します。

`SKILL.md` 末尾にも同じビルダーを埋め込んでいます。更新時は `scripts/build_deck.js` と同期してください。GitHubへの公開・push・forkは行っていません。

## ライセンスと出典

- 元コード：Copyright (c) 2026 IT navi、[MIT License](LICENSE)。著作権表示と許諾本文を保持しています。
- 基準コミット：[51ede47f9b1fea3dbfe68388ce85c7f0776bb261](https://github.com/seiji1097g-cell/dads-slides/tree/51ede47f9b1fea3dbfe68388ce85c7f0776bb261)。
- 出典：[デジタル庁デザインシステムウェブサイト](https://design.digital.go.jp/dads/)。コンテンツを加工して作成しています。配色と文字サイズはダイチ用に変更しているためDADS準拠を称しません。
- [デジタル庁コピーライトポリシー](https://www.digital.go.jp/copyright-policy)、[DADS利用上の注意事項](https://design.digital.go.jp/dads/introduction/notices/)。公開資料をデジタル庁作成や元作者公認と誤認させないでください。
- アイコン：[react-icons](https://github.com/react-icons/react-icons) 経由のMaterial Design Icons（Apache 2.0）。依存パッケージとフォント自体はスキル配布物に同梱しません。
