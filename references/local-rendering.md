# ローカル描画で日本語が欠ける場合

このmacOSの同梱headless LibreOfficeでは、システムで見えるフォントでも日本語が欠けることがあった。`fc-match`だけで可視検証済みと判断しない。全ページの文字を実際に確認する。

`render_deck.py` は指定したフォントディレクトリだけを参照するfontconfigを出力先に作る。システム共通設定は変更しない。

```sh
python3 scripts/render_deck.py demo.pptx rendered --font-dir /absolute/path/to/task-fonts
```

日本語フォントと必要な等幅フォントを当該フォルダーへ用意する。検証ではNoto Sans CJK JPのRegular/Bold OTFとMenloを使った。PPTX入力の `fontFace` も `Noto Sans CJK JP` に指定し、`fontMono` は `Menlo`。既定のNoto Sans JPを使う場合は同名フォントを用意するか、このヘルパーのCJK JPへのaliasで代替を明記する。Menloで日本語が出るかも実際に確認する。

Notoの公式ファイル例：
- https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf
- https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/Japanese/NotoSansCJKjp-Bold.otf
- ライセンス：https://github.com/notofonts/noto-cjk/blob/main/LICENSE

フォントをスキルや配布物へ同梱する場合はそのフォントのライセンスを含める。今回はフォントを配布スキルへ同梱せず、専用検証領域にだけ置いた。PDFは文字を含めて描画できることを検証した。PowerPointでの表示は、開く環境のフォントで再確認する。
