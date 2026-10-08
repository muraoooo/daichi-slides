// ダイチブランド版（dads-slidesを改変、MIT / Copyright (c) 2026 IT navi）: node build_deck.js deck.json out.pptx
// 座標は CSS px（1280×720 = LAYOUT_WIDE @96dpi）。8px グリッド。文字は px×0.75=pt。
const fs = require('fs');
const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const md = require('react-icons/md');
const JSZip = require('jszip');

const px = (n) => n / 96;
const pt = (n) => n * 0.75;
const C = {
  white: 'FFFFFF', soft: 'F7F9FA', pink: 'D98FA3', blue: '7FD6D0',
  navy: '1F3552', ink: '111111',
};
let F = 'Noto Sans JP', MONO = 'Noto Sans Mono';
const TS = {
  dsp48B: { fontSize: pt(48), bold: true, lineSpacingMultiple: 1.2 },
  std45B: { fontSize: pt(56), bold: true, lineSpacingMultiple: 1.2 },
  std36B: { fontSize: pt(40), bold: true, lineSpacingMultiple: 1.2 },
  std20B: { fontSize: pt(28), bold: true, lineSpacingMultiple: 1.15 },
  std20N: { fontSize: pt(28), bold: false, lineSpacingMultiple: 1.15 },
  std16B: { fontSize: pt(28), bold: true, lineSpacingMultiple: 1.15 },
  std16N: { fontSize: pt(28), bold: false, lineSpacingMultiple: 1.35 },
  dns14N: { fontSize: pt(20), bold: false, lineSpacingMultiple: 1.2 },
  oln16B: { fontSize: pt(28), bold: true },
  mono14N: { fontSize: pt(20), bold: false, lineSpacingMultiple: 1.15 },
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

// Stop before writing a deck when the declared content cannot fit safely.
function fitError(ctx, detail) {
  const error = new Error(`[${ctx}] 収容不能: ${detail}。文章を短くするか、指定枚数内で構成を変更してください。PPTX出力は更新されません`);
  error.exitCode = 2;
  throw error;
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
  if (!inPath || !outPath) throw new Error('使い方: node build_deck.js deck.json out.pptx');
  const deck = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  if (!Array.isArray(deck.slides) || !deck.slides.length) throw new Error('slides は1枚以上の配列');
  if (deck.theme) for (const [key, value] of Object.entries(deck.theme)) {
    if (!(key in C) || typeof value !== 'string' || !/^#?[0-9a-f]{6}$/i.test(value)) throw new Error('theme は6色の役割名とHEXを指定');
    C[key] = value.replace(/^#/, '').toUpperCase();
  }
  F = deck.fontFace || F; MONO = deck.fontMono || MONO;
  for (const d of deck.slides) {
    if (typeof (d.type === 'title' ? d.title : d.heading) !== 'string') throw new Error('見出しが必要');
    if (d.type === 'twoColumn' && (!Array.isArray(d.columns) || d.columns.length !== 2)) throw new Error('twoColumn は2列');
    if (['stats','cards','steps','numbered','summary'].includes(d.type) && (!Array.isArray(d.items) || !d.items.length)) throw new Error('items が必要');
    if (d.type === 'table' && (!Array.isArray(d.columns) || !d.columns.length || !Array.isArray(d.rows) || d.rows.some(r => r.length !== d.columns.length))) throw new Error('表の列数と各行のセル数を一致させる');
  }
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = deck.title || '';
  const total = deck.slides.length;
  const footerText = deck.footer || deck.title || '';
  const iconCache = {};
  const getIcon = async (n, c = C.navy) => (iconCache[n + c] ||= await iconData(n, c));

  const text = (s, t, x, y, w, h, style, o = {}) => {
    s.addText(t, { x: px(x), y: px(y), w: px(w), h: px(h), fontFace: F, color: C.ink, margin: 0, valign: 'top', isTextBox: true, ...style, ...o });
  };
  const card = (s, x, y, w, h, variant = 'default') => {
    const v = variant === 'emphasis' ? { fill: C.pink, line: C.navy } : { fill: C.white, line: C.navy };
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px(x), y: px(y), w: px(w), h: px(h), rectRadius: px(8), fill: { color: v.fill }, line: { color: v.line, width: 1 } });
  };
  const frontIcon = async (s, name, x, y, d = 40) => {
    s.addShape(pres.shapes.OVAL, { x: px(x), y: px(y), w: px(d), h: px(d), fill: { color: C.blue }, line: { color: C.navy } });
    const p = d * 0.2;
    s.addImage({ data: await getIcon(name), x: px(x + p), y: px(y + p), w: px(d - 2 * p), h: px(d - 2 * p), altText: '' });
  };
  const badge = (s, n, x, y, d = 32) => {
    s.addShape(pres.shapes.OVAL, { x: px(x), y: px(y), w: px(d), h: px(d), fill: { color: C.blue }, line: { color: C.navy } });
    text(s, String(n), x, y, d, d, TS.oln16B, { color: C.navy, align: 'center', valign: 'middle' });
  };
  const bullets = (s, ctx, items, x, y, w, h, color = C.ink) => {
    const joined = items.join('\n');
    check(ctx, joined, TS.std16N, w - 20, h - items.length * 8);
    s.addText(items.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < items.length - 1, paraSpaceAfter: 6 } })),
      { x: px(x), y: px(y), w: px(w), h: px(h), fontFace: F, color, margin: 0, valign: 'top', isTextBox: true, ...TS.std16N });
  };
  const para = (s, ctx, t, x, y, w, h, style = TS.std16N, o = {}) => { check(ctx, t, style, w, h); text(s, t, x, y, w, h, style, o); };
  const codeBox = (s, ctx, code, x, y, w, h) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px(x), y: px(y), w: px(w), h: px(h), rectRadius: px(8), fill: { color: C.soft }, line: { color: C.navy, width: 1 } });
    check(ctx + ' code', code, TS.mono14N, w - 32, h - 24);
    text(s, code, x + 16, y + 12, w - 32, h - 24, TS.mono14N, { fontFace: MONO, color: C.navy, valign: 'middle' });
  };
  const accent = (s, y = 128, x = 64, w = 160) => s.addShape(pres.shapes.LINE, { x: px(x), y: px(y), w: px(w), h: 0, line: { color: C.pink, width: 4 } });
  const header = (s, ctx, d) => {
    accent(s);
    if (d.shoulder) text(s, d.shoulder, 64, 40, 1152, 24, TS.oln16B, { color: C.navy, valign: 'middle' });
    check(ctx + ' 見出し', d.heading, TS.std36B, 1152, 56);
    text(s, d.heading, 64, 72, 1152, 56, TS.std36B, { color: C.navy, valign: 'middle' });
    if (d.lead) para(s, ctx + ' リード', d.lead, 64, 136, 1152, 40, TS.std16N, { valign: 'middle' });
  };
  const footer = (s, n) => {
    s.addShape(pres.shapes.LINE, { x: px(64), y: px(664), w: px(1152), h: 0, line: { color: C.navy, width: 0.75 } });
    text(s, footerText, 64, 672, 900, 24, TS.dns14N, { color: C.ink, valign: 'middle' });
    text(s, `${n} / ${total}`, 1016, 672, 200, 24, TS.dns14N, { color: C.ink, align: 'right', valign: 'middle' });
  };
  // 本文エリア（リード・コールアウト・注記に応じて伸縮）
  const area = async (s, ctx, d) => {
    let top = d.lead ? 192 : 152, bottom = d.note ? 600 : 648;
    if (d.callout) {
      card(s, 64, top, 1152, 80, 'emphasis');
      await frontIcon(s, d.callout.icon || 'MdInfo', 88, top + 20);
      para(s, ctx + ' コールアウト', d.callout.text, 144, top + 8, 1048, 64, TS.std16N, { valign: 'middle', color: C.navy });
      top += 104;
    }
    if (d.note) para(s, ctx + ' 注記', d.note, 64, 608, 1152, 48, TS.dns14N, { color: C.ink });
    return { x: 64, y: top, w: 1152, h: bottom - top };
  };
  const cols = (n, gap = 32) => { const w = (1152 - gap * (n - 1)) / n; return Array.from({ length: n }, (_, i) => ({ x: 64 + i * (w + gap), w })); };

  const L = {
    async title(s, d) {
      s.background = { color: C.white };
      accent(s, 184, 96, 240);
      if (d.shoulder) text(s, d.shoulder, 96, 200, 1088, 24, TS.oln16B, { color: C.navy });
      check('表紙タイトル', d.title, TS.std45B, 1088, 136);
      text(s, d.title, 96, 240, 1088, 136, TS.std45B, { color: C.navy });
      if (d.subtitle) para(s, '表紙副題', d.subtitle, 96, 400, 1088, 64, TS.std20N, { color: C.navy });
      if (d.source) para(s, '表紙出典', d.source, 96, 600, 1088, 48, TS.dns14N, { color: C.ink });
    },
    async section(s, d) {
      s.background = { color: C.soft };
      accent(s, 248, 96, 240);
      if (d.shoulder) text(s, d.shoulder, 96, 272, 1088, 24, TS.oln16B, { color: C.navy });
      check('章見出し', d.heading, TS.std36B, 1088, 64);
      text(s, d.heading, 96, 304, 1088, 64, TS.std36B, { color: C.navy, valign: 'middle' });
      if (d.lead) para(s, '章リード', d.lead, 96, 384, 1088, 64, TS.std20N, { color: C.navy });
    },
    async stats(s, d, a, ctx) {
      const cs = cols(d.items.length);
      for (const [i, it] of d.items.entries()) {
        const { x, w } = cs[i];
        card(s, x, a.y, w, a.h);
        let y = a.y + 32;
        if (it.icon) { await frontIcon(s, it.icon, x + 32, y); y += 64; }
        check(`${ctx} 数値${i + 1}`, it.value, TS.dsp48B, w - 64, 88);
        text(s, it.value, x + 32, y, w - 64, 88, TS.dsp48B, { color: C.navy, valign: 'middle' }); y += 104;
        para(s, `${ctx} 数値${i + 1}ラベル`, it.label, x + 32, y, w - 64, 32, TS.std20B, { color: C.navy }); y += 48;
        if (it.desc) para(s, `${ctx} 数値${i + 1}説明`, it.desc, x + 32, y, w - 64, a.y + a.h - 24 - y);
      }
    },
    async cards(s, d, a, ctx) {
      const n = d.items.length, grid = n === 4;
      const cs = cols(grid ? 2 : n);
      const rows = grid ? 2 : 1, ch = (a.h - 24 * (rows - 1)) / rows;
      // With callout + note, a 2x2 card has 160px: use smaller padding,
      // preserving the 21pt text size and space between title/body/bullets.
      const compact = grid && ch < 216;
      const pad = compact ? 12 : 24, gap = compact ? 6 : 16, iconSize = compact ? 32 : 40;
      for (const [i, it] of d.items.entries()) {
        const { x, w } = cs[grid ? i % 2 : i];
        const y = a.y + (grid ? Math.floor(i / 2) : 0) * (ch + 24);
        const tx = x + pad + (it.icon ? iconSize + 16 : 0);
        const titleW = x + w - pad - tx;
        const titleH = Math.max(compact ? 34 : 40, Math.ceil(estHeight(it.title, TS.std20B, titleW)) + 2);
        const bodyH = it.body ? Math.ceil(estHeight(it.body, TS.std16N, w - 2 * pad)) + 2 : 0;
        const bulletH = it.bullets?.length ? Math.ceil(estHeight(it.bullets.join('\n'), TS.std16N, w - 2 * pad - 20)) + it.bullets.length * 8 : 0;
        const needed = pad + titleH + (bodyH || bulletH ? gap : 0) + bodyH + (bodyH && bulletH ? gap : 0) + bulletH + pad;
        if (needed > ch) fitError(`${ctx} カード${i + 1}`, `必要高さ${needed}px > カード${Math.floor(ch)}px（21pt、内余白${pad}px）`);
        card(s, x, y, w, ch, it.emphasis ? 'emphasis' : 'default');
        if (it.icon) await frontIcon(s, it.icon, x + pad, y + pad, iconSize);
        para(s, `${ctx} カード${i + 1}見出し`, it.title, tx, y + pad, titleW, titleH, TS.std20B, { color: C.navy, valign: 'middle' });
        let by = y + pad + titleH + gap;
        if (it.body) { para(s, `${ctx} カード${i + 1}本文`, it.body, x + pad, by, w - 2 * pad, bodyH); by += bodyH + gap; }
        if (it.bullets?.length) bullets(s, `${ctx} カード${i + 1}`, it.bullets, x + pad, by, w - 2 * pad, y + ch - pad - by);
      }
    },
    async steps(s, d, a, ctx) {
      const cs = cols(d.items.length);
      for (const [i, it] of d.items.entries()) {
        const { x, w } = cs[i];
        card(s, x, a.y, w, a.h);
        badge(s, i + 1, x + 24, a.y + 24);
        const th = estHeight(it.title, TS.std20B, w - 48) > 32 ? 64 : 32;
        para(s, `${ctx} 手順${i + 1}見出し`, it.title, x + 24, a.y + 72, w - 48, th, TS.std20B, { color: C.navy });
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
        para(s, `${ctx} 列${i + 1}見出し`, c.title, tx, a.y + 24, x + w - 24 - tx, 40, TS.std20B, { color: C.navy, valign: 'middle' });
        const codeH = c.code ? Math.max(80, Math.ceil(estHeight(c.code, TS.mono14N, w - 80) + 24)) : 0;
        const bottom = a.y + a.h - 24 - (c.code ? codeH + 40 : 0);
        let by = a.y + 80;
        if (c.body) { const h = estHeight(c.body, TS.std16N, w - 48) + 8; para(s, `${ctx} 列${i + 1}本文`, c.body, x + 24, by, w - 48, Math.min(h, bottom - by)); by += h + 8; }
        if (c.bullets) bullets(s, `${ctx} 列${i + 1}`, c.bullets, x + 24, by, w - 48, bottom - by);
        if (c.code) {
          text(s, c.codeLabel || '例', x + 24, a.y + a.h - 24 - codeH - 32, w - 48, 24, TS.std16B, { color: C.navy, valign: 'middle' });
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
        para(s, `${ctx} 項目${i + 1}`, it.title, 112, y, lw - 48, 32, TS.std16B, { color: C.navy, valign: 'middle' });
        const h = it.desc ? Math.ceil(estHeight(it.desc, TS.std16N, lw - 48)) : 0;
        if (it.desc) text(s, it.desc, 112, y + 32, lw - 48, h, TS.std16N);
        y += 32 + h + 24;
      }
      if (y - 24 > a.y + a.h) warnings.push(`[${ctx}] 番号付きリストが本文エリアを超過`);
      if (hasSide) {
        card(s, 656, a.y, 560, a.h, 'emphasis');
        para(s, `${ctx} 右カード見出し`, d.side.title, 688, a.y + 24, 496, 32, TS.std20B, { color: C.navy });
        if (d.side.bullets) bullets(s, `${ctx} 右カード`, d.side.bullets, 688, a.y + 72, 496, a.h - 96);
        else if (d.side.body) para(s, `${ctx} 右カード本文`, d.side.body, 688, a.y + 72, 496, a.h - 96);
      }
    },
    async table(s, d, a, ctx) {
      // Estimate each wrapped cell at 21pt, including margins and safety slack.
      // A row count alone does not describe height. Fix rowH explicitly so
      // Office cannot silently derive a table taller than the body area.
      const right = d.alignRight || [], marginX = 16, marginY = 12;
      const widths = d.colW || d.columns.map(() => a.w / d.columns.length);
      if (widths.length !== d.columns.length || widths.some(w => !Number.isFinite(w) || w <= 2 * marginX + 8) || Math.abs(widths.reduce((x, y) => x + y, 0) - a.w) > 1) {
        throw new Error('colWは各列の正の幅、合計1152pxを指定');
      }
      const tableStyle = { fontSize: pt(28), lineSpacingMultiple: 1.2 };
      const rawRows = [d.columns, ...d.rows];
      const rowHeights = rawRows.map(row => Math.ceil(Math.max(...row.map((t, ci) => {
        // Allow 5% width slack for Japanese font differences and cell borders.
        const contentW = (widths[ci] - 2 * marginX - 8) / 1.05;
        return estHeight(String(t), tableStyle, contentW);
      })) + 2 * marginY + 6));
      const totalH = rowHeights.reduce((x, y) => x + y, 0);
      if (totalH > a.h) fitError(ctx, `表の折返し込み高さ${totalH}px > 本文${a.h}px（行高 ${rowHeights.join('/')}px）`);
      const cell = (t, ci, head) => ({
        text: String(t),
        options: {
          bold: head, color: head ? C.navy : C.ink, fill: { color: head ? C.soft : C.white },
          align: right.includes(ci) ? 'right' : 'left', valign: 'top', fontFace: F, ...tableStyle, paraSpaceAfter: 0,
          margin: [pt(marginY), pt(marginX), pt(marginY), pt(marginX)],
          border: head ? [{ type: 'none' }, { type: 'none' }, { pt: 1.5, color: C.ink }, { type: 'none' }]
                       : [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: C.navy }, { type: 'none' }],
        },
      });
      const rows = rawRows.map((row, ri) => row.map((t, ci) => cell(t, ci, ri === 0)));
      s.addTable(rows, { x: px(a.x), y: px(a.y), w: px(a.w), h: px(totalH), colW: widths.map(px), rowH: rowHeights.map(px), autoPage: false });
    },
    async summary(s, d) {
      s.background = { color: C.soft };
      accent(s);
      check('まとめ見出し', d.heading, TS.std36B, 1152, 56);
      if (d.shoulder) text(s, d.shoulder, 64, 40, 1152, 24, TS.oln16B, { color: C.navy, valign: 'middle' });
      text(s, d.heading, 64, 72, 1152, 56, TS.std36B, { color: C.navy, valign: 'middle' });
      const two = d.items.length > 4, rows = Math.ceil(d.items.length / (two ? 2 : 1));
      const rh = Math.min(104, Math.floor(432 / rows));
      for (const [i, t] of d.items.entries()) {
        const x = two ? 64 + (i % 2) * 592 : 64, y = 168 + (two ? Math.floor(i / 2) : i) * rh, w = two ? 512 : 1104;
        s.addShape(pres.shapes.OVAL, { x: px(x), y: px(y), w: px(32), h: px(32), fill: { color: C.blue }, line: { color: C.navy } });
        s.addImage({ data: await getIcon('MdCheck'), x: px(x + 6), y: px(y + 6), w: px(20), h: px(20), altText: '' });
        check(`まとめ ${i + 1}`, t, TS.std16N, w, rh - 16);
        text(s, t, x + 48, y + 2, w, rh - 16, TS.std16N, { color: C.navy });
      }
      if (d.source) text(s, d.source, 64, 624, 1152, 24, TS.dns14N, { color: C.ink, valign: 'middle' });
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
  // PptxGenJS 4.x declares per-slide masters that do not exist. Remove only
  // those orphan content-type entries; keep real masters and relationships.
  const zip = await JSZip.loadAsync(fs.readFileSync(outPath));
  const contentTypes = await zip.file('[Content_Types].xml').async('string');
  const cleaned = contentTypes.replace(/<Override\b[^>]*\/>/g, entry => {
    const part = /PartName="([^" ]+)"/.exec(entry)?.[1];
    return part && /^\/ppt\/slideMasters\/slideMaster\d+\.xml$/.test(part) && !zip.file(part.slice(1)) ? '' : entry;
  });
  if (cleaned !== contentTypes) {
    zip.file('[Content_Types].xml', cleaned);
    fs.writeFileSync(outPath, await zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}));
  }
  console.log(`書き出し完了: ${outPath}（${total} 枚）`);
  if (warnings.length) { console.log('\n⚠ はみ出しの可能性:'); warnings.forEach((w) => console.log(' - ' + w)); process.exitCode = 2; }
  else console.log('はみ出し推定: 問題なし');
}
main().catch((e) => { console.error(e); process.exit(e.exitCode || 1); });
